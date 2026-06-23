import { FlashList } from '@shopify/flash-list'
import { Image } from 'expo-image'
import { router, useLocalSearchParams } from 'expo-router'
import React from 'react'
import { Pressable, Text, View } from 'react-native'
import { RefreshControl } from 'react-native-gesture-handler'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Loading from '~/components/loading'
import NoneChats from '~/components/none-chats'
import { useSession } from '~/context/auth'
import useTheme from '~/hooks/useTheme'
import { api } from '~/utils/api'
import { PLACEHOLDER, blurhash, dayjs } from '~/utils/constants'

export default function Page() {
    const { colors } = useTheme()
    const { user } = useSession()
    const { eventId } = useLocalSearchParams<{ eventId: string }>()
    const insets = useSafeAreaInsets()

    const chats = api.mobile.chat.all.useQuery(
        { eventId: eventId! as string },
        { refetchInterval: 8_000 }
    )

    // Auto-join event channel (creates if needed)
    api.mobile.chat.eventChannel.useQuery(
        { eventId: eventId! as string },
        { staleTime: 5 * 60_000 }
    )

    function onChat(chatId: string) {
        router.push({ pathname: '/(app)/home/event/[eventId]/live/chats/[chatId]', params: { eventId, chatId } })
    }

    if (chats.isLoading) return <Loading />
    if (!chats.data) return <NoneChats />

    // Sort: channels first, then DMs by updatedAt
    const sorted = [...(chats.data ?? [])].sort((a, b) => {
        if (a.type === 'CHANNEL' && b.type !== 'CHANNEL') return -1
        if (a.type !== 'CHANNEL' && b.type === 'CHANNEL') return 1
        return 0
    })

    return (
        <View style={{ flex: 1, flexDirection: 'column', paddingHorizontal: 20, paddingTop: insets.top }}>
            <FlashList
                data={sorted}
                ListHeaderComponent={() => (
                    <View>
                        <Text numberOfLines={2} style={{ textTransform: "uppercase", fontWeight: "800", fontSize: 25, lineHeight: 50, letterSpacing: -1, color: colors.text }}>
                            Chats
                        </Text>
                    </View>
                )}
                refreshControl={
                    <RefreshControl
                        tintColor={colors.text}
                        progressBackgroundColor={colors.text}
                        refreshing={chats.isFetching}
                        onRefresh={() => chats.refetch()}
                    />
                }
                estimatedItemSize={70}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={() => (
                    <View className="py-2">
                        <Text className="font-semibold italic text-white">
                            No tienes chats con nadie
                        </Text>
                    </View>
                )}
                ItemSeparatorComponent={() => <View className="h-px bg-gray-500/20 my-5 rounded-lg" />}
                renderItem={({ item }) => {
                    const isChannel = item.type === 'CHANNEL'

                    // For DMs: show the other user's info
                    const otherUser = isChannel
                        ? null
                        : item.requester?.user.id === user?.id
                            ? item.receiver?.user
                            : item.requester?.user

                    const displayName = isChannel
                        ? item.name ?? 'Canal del evento'
                        : otherUser?.name ?? 'Usuario'

                    const displayImage = isChannel
                        ? item.image
                        : otherUser?.image

                    const lastMsg = item.messages[0]
                    const lastMsgText = isChannel && lastMsg
                        ? `${lastMsg.requester?.user.name ?? ''}: ${lastMsg.text}`
                        : lastMsg?.text ?? ''

                    const timeStr = lastMsg ? dayjs(lastMsg.createdAt).format('HH:mm') : ''

                    return (
                        <Pressable
                            className='flex flex-row items-center gap-5 w-full'
                            style={{ paddingHorizontal: 10 }}
                            onPress={() => onChat(item.id)}
                        >
                            <View>
                                <Image
                                    cachePolicy='memory-disk'
                                    placeholder={blurhash}
                                    priority='high'
                                    style={{ borderRadius: 100, backgroundColor: colors.onBackground, height: 50, width: 50 }}
                                    source={{ uri: displayImage ?? PLACEHOLDER }}
                                />
                                {isChannel && (
                                    <View style={{
                                        position: 'absolute', bottom: -2, right: -2,
                                        backgroundColor: '#7c3aed', borderRadius: 10,
                                        width: 20, height: 20, alignItems: 'center', justifyContent: 'center'
                                    }}>
                                        <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>
                                            {item._count?.participants ?? ''}
                                        </Text>
                                    </View>
                                )}
                            </View>
                            <View className='flex flex-1 flex-col gap-1'>
                                <View className='flex flex-row justify-between items-center'>
                                    <Text numberOfLines={1} style={{ fontWeight: "800", fontSize: 18, letterSpacing: -1, color: colors.text, flex: 1 }}>
                                        {displayName}
                                    </Text>
                                    {timeStr ? (
                                        <Text style={{ color: item.unreadCount > 0 ? '#0086ff' : '#666', fontSize: 12 }}>
                                            {timeStr}
                                        </Text>
                                    ) : null}
                                </View>
                                <View className='flex flex-row justify-between items-center'>
                                    <Text className='text-gray-500' numberOfLines={1} style={{ flex: 1 }}>
                                        {lastMsgText}
                                    </Text>
                                    {item.unreadCount > 0 && (
                                        <View style={{
                                            backgroundColor: '#0086ff', borderRadius: 10,
                                            minWidth: 20, height: 20, alignItems: 'center',
                                            justifyContent: 'center', paddingHorizontal: 6
                                        }}>
                                            <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>
                                                {item.unreadCount}
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            </View>
                        </Pressable>
                    )
                }}
            />
        </View>
    )
}
