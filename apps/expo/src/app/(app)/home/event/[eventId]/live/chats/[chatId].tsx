import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { FlashList } from '@shopify/flash-list'
import { Image, ImageBackground } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import { router, useLocalSearchParams } from 'expo-router'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Loading from '~/components/loading'
import { useSession } from '~/context/auth'
import useTheme from '~/hooks/useTheme'
import { api } from '~/utils/api'
import { blurhash, dayjs } from '~/utils/constants'
import { socket } from '~/utils/socket'

type WsMessage = {
    id: string
    text: string
    createdAt: string | Date
    requesterId: string
    requester?: { user: { id: string; name: string; image: string | null } }
}

export default function Page() {
    const { colors } = useTheme()
    const flatlistRef = useRef<FlashList<any>>(null)
    const insets = useSafeAreaInsets()
    const { chatId, eventId } = useLocalSearchParams<{ chatId: string; eventId: string }>()
    const { user } = useSession()
    const utils = api.useUtils()

    const getChat = api.mobile.chat.byId.useQuery({ chatId: chatId! })
    const markRead = api.mobile.chat.markRead.useMutation()
    const heartbeat = api.mobile.user.heartbeat.useMutation()

    // Paginated messages
    const messagesQuery = api.mobile.message.all.useInfiniteQuery(
        { chatId: chatId!, limit: 30 },
        {
            getNextPageParam: (lastPage) => lastPage.nextCursor,
        }
    )

    const [wsMessages, setWsMessages] = useState<WsMessage[]>([])
    const [message, setMessage] = useState("")

    const createMessage = api.mobile.message.create.useMutation({
        onSuccess: () => {
            // Message will arrive via WS; also refetch for consistency
            messagesQuery.refetch()
        },
    })

    const handleSendMessage = useCallback(() => {
        if (!message.trim()) return
        createMessage.mutate({ chatId: chatId!, text: message.trim() })
        setMessage("")
    }, [message, chatId])

    // Socket lifecycle
    useEffect(() => {
        socket.connect()
        socket.emit('login', { requesterId: user?.id, chatId })

        socket.on("message", (msg: WsMessage) => {
            // Only add if not from current user (we already show via mutation)
            if (msg.requester?.user?.id !== user?.id) {
                setWsMessages((prev) => [msg, ...prev])
            }
        })

        // Mark as read on open
        markRead.mutate({ chatId: chatId! })

        // Heartbeat for online status
        if (eventId) {
            heartbeat.mutate({ eventId })
            const interval = setInterval(() => heartbeat.mutate({ eventId }), 60_000)
            return () => {
                clearInterval(interval)
                socket.disconnect()
                markRead.mutate({ chatId: chatId! })
                utils.mobile.chat.all.invalidate()
            }
        }

        return () => {
            socket.disconnect()
            markRead.mutate({ chatId: chatId! })
            utils.mobile.chat.all.invalidate()
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    if (messagesQuery.isLoading || !messagesQuery.data || getChat.isLoading) {
        return <Loading />
    }

    const chatData = getChat.data
    const isChannel = chatData?.type === 'CHANNEL'

    // Merge WS messages with paginated DB messages
    const dbMessages = messagesQuery.data.pages.flatMap((p) => p.items)
    const allMessages = [...wsMessages, ...dbMessages]

    // Header info
    const otherUser = isChannel
        ? null
        : chatData?.requester?.user.id === user?.id
            ? chatData?.receiver?.user
            : chatData?.requester?.user

    const headerName = isChannel
        ? chatData?.name ?? 'Canal del evento'
        : otherUser?.name ?? 'Chat'

    const headerImage = isChannel
        ? chatData?.image
        : otherUser?.image

    const participantCount = isChannel ? chatData?._count?.participants : null

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className='flex-1'
        >
            <ImageBackground
                contentFit='cover'
                contentPosition='center'
                style={{ flex: 1 }}
                source={require("../../../../../../../assets/background/notickets.png")}
            >
                <LinearGradient
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: .65 }}
                    style={{ flex: 1, flexDirection: "row", justifyContent: 'space-between', alignItems: "flex-end", gap: 10 }}
                    colors={['rgba(0,0,0, 0)', 'rgba(0,0,0,.8)']}
                >
                    <View style={{ paddingTop: insets.top }} className='flex-1 flex-col'>
                        {/* Header */}
                        <View className='flex-row w-full justify-between gap-2 py-2'>
                            <Pressable onPress={() => router.back()} style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                                <View style={{ justifyContent: 'center', alignItems: 'center', padding: 4 }}>
                                    <MaterialCommunityIcons name='chevron-left' size={35} color={colors.text} />
                                </View>
                            </Pressable>
                            <View className='flex-row flex-1 gap-5'>
                                {headerImage && (
                                    <Image
                                        cachePolicy='memory-disk'
                                        placeholder={blurhash}
                                        priority='high'
                                        style={{ borderRadius: 100, backgroundColor: colors.onBackground, height: 40, width: 40 }}
                                        source={{ uri: headerImage }}
                                    />
                                )}
                                <View className='flex flex-col'>
                                    <Text style={styles.title}>{headerName}</Text>
                                    {isChannel && participantCount ? (
                                        <Text className='text-gray-500'>
                                            {participantCount} participantes
                                        </Text>
                                    ) : !isChannel && socket.active ? (
                                        <Text className='text-gray-500'>En línea</Text>
                                    ) : null}
                                </View>
                            </View>
                        </View>

                        {/* Messages */}
                        <View className='flex-1 flex-row' style={{ justifyContent: 'center' }}>
                            <View style={{ flex: 1, flexDirection: "row", gap: 10 }}>
                                <FlashList
                                    ref={flatlistRef}
                                    estimatedItemSize={70}
                                    inverted
                                    onEndReachedThreshold={0.4}
                                    onEndReached={() => {
                                        if (messagesQuery.hasNextPage && !messagesQuery.isFetchingNextPage) {
                                            messagesQuery.fetchNextPage()
                                        }
                                    }}
                                    contentContainerStyle={{ paddingHorizontal: 10 }}
                                    data={allMessages}
                                    ListHeaderComponent={() => <View style={{ height: 10 }} />}
                                    ListFooterComponent={() => (
                                        <View style={{ height: 10 }}>
                                            {messagesQuery.isFetchingNextPage && <Loading />}
                                        </View>
                                    )}
                                    ItemSeparatorComponent={() => <View style={{ height: 5 }} />}
                                    renderItem={({ item }) => {
                                        const isOwnMessage = item.requester?.user?.id === user?.id
                                        return (
                                            <View style={isOwnMessage ? styles.myMessage : styles.message}>
                                                {/* In channels, show sender name for other users' messages */}
                                                {isChannel && !isOwnMessage && item.requester?.user?.name && (
                                                    <Text style={{ color: '#7c3aed', fontSize: 12, fontWeight: '700', marginBottom: 2 }}>
                                                        {item.requester.user.name}
                                                    </Text>
                                                )}
                                                <Text className='text-white font-normal text-lg'>
                                                    {item.text}
                                                </Text>
                                                <Text className='text-white font-normal text-right text-xs' style={{ opacity: 0.6 }}>
                                                    {dayjs(item.createdAt).format("HH:mm")}
                                                </Text>
                                            </View>
                                        )
                                    }}
                                />
                            </View>
                        </View>

                        {/* Input */}
                        <View style={{ height: 100, borderTopColor: colors.outline, borderTopWidth: .2, paddingBottom: insets.bottom }} className='w-full flex-row items-center justify-center gap-5 px-5'>
                            <View style={styles.textInput}>
                                <TextInput
                                    placeholder="Mensaje"
                                    blurOnSubmit
                                    inputMode='text'
                                    placeholderTextColor="#757575"
                                    value={message}
                                    className='text-white font-xl w-full'
                                    onChangeText={setMessage}
                                    onSubmitEditing={handleSendMessage}
                                />
                            </View>
                            <Pressable
                                style={[styles.button, { backgroundColor: "#0086ff", borderWidth: 2 }]}
                                onPress={handleSendMessage}
                                disabled={createMessage.isPending || !message.trim()}
                            >
                                <MaterialCommunityIcons name='send' size={26} color={colors.text} />
                            </Pressable>
                        </View>
                    </View>
                </LinearGradient>
            </ImageBackground>
        </KeyboardAvoidingView>
    )
}

const styles = StyleSheet.create({
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: "white",
    },
    message: {
        alignSelf: "flex-start",
        backgroundColor: "#1f1f1f",
        maxWidth: "75%",
        paddingHorizontal: 10,
        paddingTop: 4,
        paddingBottom: 4,
        borderRadius: 10,
        borderBottomLeftRadius: 2,
    },
    myMessage: {
        alignSelf: "flex-end",
        backgroundColor: "#0086ff",
        maxWidth: "75%",
        paddingHorizontal: 10,
        paddingTop: 4,
        paddingBottom: 4,
        borderRadius: 10,
        borderTopRightRadius: 2,
    },
    textInput: {
        backgroundColor: '#111',
        borderRadius: 30,
        paddingVertical: 10,
        alignItems: "flex-start",
        justifyContent: "center",
        paddingHorizontal: 20,
        flex: 1,
    },
    button: {
        padding: 10,
        borderRadius: 100,
    },
})
