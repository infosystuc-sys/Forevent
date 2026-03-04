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
import { PLACEHOLDER, blurhash } from '~/utils/constants'

export default function Page() {
    const { colors } = useTheme()
    const { user } = useSession()
    const { eventId } = useLocalSearchParams<{ eventId: string }>()
    const utils = api.useUtils()
    const insets = useSafeAreaInsets();
    const chats = api.mobile.chat.all.useQuery({ userId: user!.id, eventId: eventId! as string });

    function onChat(chatId: string) {
        router.push({ pathname: '/(app)/home/event/[eventId]/live/chats/[chatId]', params: { eventId, chatId } });
    }

    if (chats.isLoading) return <Loading />

    if (!chats.data) return <NoneChats />

    return (
        <View style={{ flex: 1, flexDirection: 'column', paddingHorizontal: 20, paddingTop: insets.top }}>
            <FlashList
                data={chats.data}
                ListHeaderComponent={() => (
                    <View className=''>
                        <Text numberOfLines={2} style={{ textTransform: "uppercase", fontWeight: "800", fontSize: 25, lineHeight: 50, letterSpacing: -1, color: colors.text }}>
                            Chats
                        </Text>
                    </View>
                )}
                refreshControl={<RefreshControl tintColor={colors.text} progressBackgroundColor={colors.text} refreshing={chats.isFetching} onRefresh={() => {
                    console.log('refresh!');
                    chats.refetch()
                }} />}
                estimatedItemSize={20}
                showsVerticalScrollIndicator={false}
                showsHorizontalScrollIndicator={false}
                ListEmptyComponent={() => (
                    <View className="py-2">
                        <Text className="font-semibold italic text-white">
                            No tienes chats con nadie
                        </Text>
                    </View>
                )}
                ItemSeparatorComponent={() => <View className="h-px bg-gray-500/20 my-5 rounded-lg" />}
                // ListFooterComponent={() => <View className="h-px bg-gray-500/25 my-5" />}
                renderItem={({ item, index }) => {
                    return (
                        <>
                            <Pressable className='flex flex-row items-center gap-5 w-full' key={index.toString()} style={{ paddingHorizontal: 10 }} onPress={() => {
                                onChat(item.id)
                            }}>
                                <View className=''>
                                    <Image
                                        cachePolicy='memory-disk'
                                        placeholder={blurhash}
                                        priority='high'
                                        style={{ borderRadius: 100, backgroundColor: colors.onBackground, height: 50, width: 50 }}
                                        source={{
                                            uri: item.requester.user.id === user?.id ? (item.receiver.user.image ?? PLACEHOLDER) : (item.requester.user.image ?? PLACEHOLDER)
                                        }} />
                                </View>
                                <View className='flex flex-1 flex-col gap-1'>
                                    <Text numberOfLines={2} style={{ fontWeight: "800", fontSize: 18, letterSpacing: -1, color: colors.text }}>
                                        {item.receiver.user.id === user?.id ? item.requester.user.name : item.receiver.user.name}
                                    </Text>
                                    <Text className='text-gray-500'>
                                        {item.messages.length > 0 && item.messages[0]?.text}
                                    </Text>
                                </View>
                            </Pressable>
                        </>
                    )
                }}
            />
        </View>
    )
}