import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { FlashList } from '@shopify/flash-list'
import { Image } from 'expo-image'
import { router, useLocalSearchParams } from 'expo-router'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { RefreshControl } from 'react-native-gesture-handler'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Loading from '~/components/loading'
import { useSession } from '~/context/auth'
import { api } from '~/utils/api'
import { blurhash, dayjs } from '~/utils/constants'
import { usePusher } from '~/hooks/useSocket'

// ─── Types ────────────────────────────────────────────────────────────────────
type Tab = 'attendees' | 'chat'
type WsMessage = {
  id: string
  text: string
  createdAt: string | Date
  requesterId: string
  requester?: { user: { id: string; name: string; image: string | null } }
}

// ─── Brand palette ────────────────────────────────────────────────────────────
const C = {
  bg: '#1a1a1a',
  card: '#2b2b2b',
  magenta: '#ff00ff',
  violet: '#411377',
  blue: '#13a8fe',
  orange: '#ffa300',
  text: '#eeeeee',
  subtext: '#888888',
  inputBg: '#111111',
}

// ─── Presence helper ──────────────────────────────────────────────────────────
function isOnline(lastSeenAt?: Date | string | null): boolean {
  if (!lastSeenAt) return false
  return Date.now() - new Date(lastSeenAt).getTime() < 2 * 60 * 1000
}

// ─── Avatar: 42dp with TÚ badge + presence dot ───────────────────────────────
function UserAvatar({
  image,
  name,
  isSelf,
  lastSeenAt,
}: {
  image?: string | null
  name: string
  isSelf: boolean
  lastSeenAt?: Date | string | null
}) {
  const online = isOnline(lastSeenAt)
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0] ?? '')
    .join('')
    .toUpperCase()

  return (
    <View style={{ position: 'relative', width: 42, height: 42 }}>
      {image ? (
        <Image
          cachePolicy='memory-disk'
          placeholder={blurhash}
          priority='high'
          style={{ borderRadius: 100, height: 42, width: 42, backgroundColor: C.card }}
          source={{ uri: image }}
        />
      ) : (
        <View style={styles.avatarFallback}>
          <Text style={styles.avatarInitials}>{initials}</Text>
        </View>
      )}

      {/* Presence dot: blue = online, orange = absent */}
      <View style={[styles.presenceDot, { backgroundColor: online ? C.blue : C.orange }]} />

      {/* TÚ badge */}
      {isSelf && (
        <View style={styles.selfBadge}>
          <Text style={styles.selfBadgeText}>TÚ</Text>
        </View>
      )}
    </View>
  )
}

// ─── Embedded event channel chat ──────────────────────────────────────────────
function EventChat({ eventId }: { eventId: string }) {
  const { user } = useSession()
  const utils = api.useUtils()
  const insets = useSafeAreaInsets()
  const [wsMessages, setWsMessages] = useState<WsMessage[]>([])
  const [text, setText] = useState('')

  const channelQuery = api.mobile.chat.eventChannel.useQuery({ eventId })
  const chatId = channelQuery.data?.id

  const messagesQuery = api.mobile.message.all.useInfiniteQuery(
    { chatId: chatId ?? '', limit: 30 },
    {
      enabled: !!chatId,
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    }
  )

  const markRead = api.mobile.chat.markRead.useMutation()
  const myRequesterIdRef = useRef('')
  const createMessage = api.mobile.message.create.useMutation({
    onMutate: ({ text }) => {
      const tempId = `opt-${Date.now()}-${Math.random()}`
      setWsMessages((prev) => [
        {
          id: tempId,
          text,
          createdAt: new Date(),
          requesterId: 'self',
          requester: { user: { id: user?.id ?? '', name: user?.name ?? '', image: user?.image ?? null } },
        },
        ...prev,
      ])
      return { tempId }
    },
    onSuccess: (newMessage, _, context) => {
      if (newMessage.requesterId) myRequesterIdRef.current = newMessage.requesterId
      if (!context?.tempId) return
      setWsMessages((prev) =>
        prev.map((m) => m.id === context.tempId ? (newMessage as WsMessage) : m)
      )
    },
    onError: (_, __, context) => {
      if (!context?.tempId) return
      setWsMessages((prev) => prev.filter((m) => m.id !== context.tempId))
    },
  })

  const { onMessage } = usePusher(chatId)

  useEffect(() => {
    if (!chatId) return
    markRead.mutate({ chatId })

    const handler = (msg: WsMessage) => {
      // Skip own message echoes (already shown via optimistic UI)
      if (msg.requesterId === myRequesterIdRef.current) return
      setWsMessages((prev) => [msg, ...prev])
    }
    const cleanup = onMessage(handler)

    return () => {
      cleanup()
      markRead.mutate({ chatId })
      utils.mobile.chat.all.invalidate()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatId, onMessage])

  const handleSend = useCallback(() => {
    if (!text.trim() || !chatId) return
    createMessage.mutate({ chatId, text: text.trim() })
    setText('')
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, chatId])

  if (channelQuery.isLoading) return <Loading />

  const dbMessages = messagesQuery.data?.pages.flatMap((p) => p.items) ?? []
  // Dedup by text+createdAt (WS server doesn't forward message IDs)
  const wsKeys = new Set(wsMessages.map((m) => `${m.text}|${new Date(m.createdAt).getTime()}`))
  const allMessages = [...wsMessages, ...dbMessages.filter((m) => !wsKeys.has(`${m.text}|${new Date(m.createdAt).getTime()}`))]

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      {/* Channel info strip */}
      <View style={styles.channelHeader}>
        <MaterialCommunityIcons name='account-group' size={16} color={C.magenta} />
        <Text style={styles.channelName} numberOfLines={1}>
          {channelQuery.data?.name ?? 'Canal del evento'}
        </Text>
        <Text style={styles.channelSub}>
          {channelQuery.data?._count?.participants ?? 0} asistentes
        </Text>
      </View>

      {/* Messages */}
      <View style={{ flex: 1 }}>
        <FlashList
          estimatedItemSize={70}
          inverted
          onEndReachedThreshold={0.4}
          onEndReached={() => {
            if (messagesQuery.hasNextPage && !messagesQuery.isFetchingNextPage) {
              messagesQuery.fetchNextPage()
            }
          }}
          data={allMessages}
          ListEmptyComponent={() => (
            <View style={{ padding: 24, alignItems: 'center' }}>
              <Text style={{ color: C.subtext, fontStyle: 'italic', textAlign: 'center' }}>
                Sé el primero en saludar 👋
              </Text>
            </View>
          )}
          ListHeaderComponent={() => <View style={{ height: 8 }} />}
          ListFooterComponent={() => (
            <View style={{ height: 8 }}>
              {messagesQuery.isFetchingNextPage && <Loading />}
            </View>
          )}
          ItemSeparatorComponent={() => <View style={{ height: 4 }} />}
          renderItem={({ item }) => {
            const isOwn = item.requester?.user?.id === user?.id
            return (
              <View style={isOwn ? styles.myMsg : styles.otherMsg}>
                {!isOwn && item.requester?.user?.name && (
                  <Text style={styles.senderName}>{item.requester.user.name}</Text>
                )}
                <Text style={isOwn ? styles.myMsgText : styles.otherMsgText}>{item.text}</Text>
                <Text style={[styles.timestamp, isOwn && styles.timestampRight]}>
                  {dayjs(item.createdAt).format('HH:mm')}
                </Text>
              </View>
            )
          }}
        />
      </View>

      {/* Input */}
      <View style={[styles.inputRow, { paddingBottom: insets.bottom + 8 }]}>
        <TextInput
          style={styles.textInput}
          placeholder='Mensaje...'
          placeholderTextColor={C.subtext}
          value={text}
          onChangeText={setText}
          onSubmitEditing={handleSend}
          blurOnSubmit={false}
          inputMode='text'
        />
        <Pressable
          style={[styles.sendBtn, { opacity: !text.trim() || createMessage.isPending ? 0.4 : 1 }]}
          onPress={handleSend}
          disabled={!text.trim() || createMessage.isPending}
        >
          <MaterialCommunityIcons name='send' size={20} color='#fff' />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  )
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function Page() {
  const { user } = useSession()
  const { eventId } = useLocalSearchParams<{ eventId: string }>()
  const insets = useSafeAreaInsets()
  const [activeTab, setActiveTab] = useState<Tab>('attendees')

  const users = api.mobile.event.users.useQuery({ eventId: eventId! })

  const createChat = api.mobile.chat.create.useMutation({
    onSuccess: (res) => {
      router.push({
        pathname: '/(app)/home/event/[eventId]/live/chats/[chatId]',
        params: { eventId, chatId: res },
      })
    },
    onError: (error) => {
      if (error.data?.code === 'CONFLICT') {
        router.push({
          pathname: '/(app)/home/event/[eventId]/live/chats/[chatId]',
          params: { eventId, chatId: error.message },
        })
      }
    },
  })

  function onChat({ receiverId }: { receiverId: string }) {
    if (receiverId === user?.id) return
    createChat.mutate({ receiverId, eventId: eventId! })
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Title */}
      <Text style={styles.pageTitle}>En esta fiesta</Text>

      {/* Tab bar */}
      <View style={styles.tabBar}>
        {(['attendees', 'chat'] as Tab[]).map((tab) => (
          <Pressable key={tab} style={styles.tabItem} onPress={() => setActiveTab(tab)}>
            <Text style={[styles.tabLabel, activeTab === tab && styles.tabLabelActive]}>
              {tab === 'attendees' ? 'Asistentes' : 'Chat general'}
            </Text>
            {activeTab === tab && <View style={styles.tabUnderline} />}
          </Pressable>
        ))}
      </View>

      {/* Attendees tab */}
      {activeTab === 'attendees' ? (
        users.isLoading ? (
          <Loading />
        ) : (
          <FlashList
            data={users.data}
            refreshControl={
              <RefreshControl
                tintColor={C.magenta}
                progressBackgroundColor={C.card}
                refreshing={users.isFetching}
                onRefresh={() => users.refetch()}
              />
            }
            estimatedItemSize={62}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={() => (
              <View style={{ paddingVertical: 20 }}>
                <Text style={{ color: C.subtext, fontStyle: 'italic' }}>
                  No hay más gente en esta fiesta
                </Text>
              </View>
            )}
            ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
            ListHeaderComponent={() => <View style={{ height: 8 }} />}
            ListFooterComponent={() => <View style={{ height: 20 }} />}
            renderItem={({ item }) => {
              const isSelf = item.user.id === user?.id
              const online = isOnline(item.lastSeenAt)
              return (
                <Pressable
                  style={styles.userRow}
                  disabled={createChat.isPending || isSelf}
                  onPress={() => onChat({ receiverId: item.user.id })}
                >
                  <UserAvatar
                    image={item.user.image}
                    name={item.user.name}
                    isSelf={isSelf}
                    lastSeenAt={item.lastSeenAt}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.userName} numberOfLines={1}>
                      {item.user.name}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                      <View
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: 3,
                          backgroundColor: online ? C.blue : C.orange,
                        }}
                      />
                      <Text style={styles.presenceText}>{online ? 'En línea' : 'Ausente'}</Text>
                    </View>
                  </View>
                  {!isSelf && (
                    <MaterialCommunityIcons name='message-outline' size={20} color={C.subtext} />
                  )}
                </Pressable>
              )
            }}
          />
        )
      ) : (
        <EventChat eventId={eventId!} />
      )}
    </View>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
    paddingHorizontal: 20,
  },
  pageTitle: {
    textTransform: 'uppercase',
    fontFamily: 'Montserrat_800ExtraBold',
    fontWeight: '800',
    fontSize: 25,
    lineHeight: 50,
    letterSpacing: -1,
    color: C.text,
  },
  // ── Tabs
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    marginBottom: 4,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    position: 'relative',
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: C.subtext,
  },
  tabLabelActive: {
    color: C.magenta,
  },
  tabUnderline: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: C.magenta,
    borderRadius: 1,
  },
  // ── Attendee row
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 4,
  },
  userName: {
    fontWeight: '700',
    fontSize: 15,
    color: C.text,
  },
  presenceText: {
    fontSize: 11,
    color: C.subtext,
  },
  // ── Avatar
  avatarFallback: {
    borderRadius: 100,
    height: 42,
    width: 42,
    backgroundColor: C.violet,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    color: C.text,
    fontWeight: '700',
    fontSize: 14,
  },
  presenceDot: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: C.bg,
  },
  selfBadge: {
    position: 'absolute',
    top: -4,
    left: -4,
    backgroundColor: C.magenta,
    borderRadius: 4,
    paddingHorizontal: 3,
    paddingVertical: 1,
  },
  selfBadgeText: {
    color: '#fff',
    fontSize: 7,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  // ── Channel header
  channelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    marginBottom: 4,
  },
  channelName: {
    color: C.text,
    fontWeight: '600',
    fontSize: 14,
    flex: 1,
  },
  channelSub: {
    color: C.subtext,
    fontSize: 12,
  },
  // ── Message bubbles
  myMsg: {
    alignSelf: 'flex-end',
    backgroundColor: '#411377',
    maxWidth: '75%',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderBottomRightRadius: 2,
  },
  otherMsg: {
    alignSelf: 'flex-start',
    backgroundColor: C.card,
    maxWidth: '75%',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderBottomLeftRadius: 2,
  },
  myMsgText: {
    color: '#f0c0ff',
    fontSize: 15,
  },
  otherMsgText: {
    color: C.text,
    fontSize: 15,
  },
  senderName: {
    color: C.magenta,
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 2,
  },
  timestamp: {
    color: '#aaa',
    fontSize: 10,
    marginTop: 2,
    alignSelf: 'flex-start',
  },
  timestampRight: {
    alignSelf: 'flex-end',
  },
  // ── Chat input
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  textInput: {
    flex: 1,
    backgroundColor: C.inputBg,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: C.text,
    fontSize: 15,
  },
  sendBtn: {
    backgroundColor: C.violet,
    borderRadius: 100,
    padding: 10,
  },
})
