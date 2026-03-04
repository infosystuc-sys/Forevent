import { FlashList } from '@shopify/flash-list';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { RefreshControl } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Loading from '~/components/loading';
import { useSession } from '~/context/auth';
import useTheme from '~/hooks/useTheme';
import { api } from '~/utils/api';
import { PLACEHOLDER, blurhash } from '~/utils/constants';


export default function Page() {
    const { colors } = useTheme()
    const { user } = useSession()

    const { eventId } = useLocalSearchParams<{ eventId: string }>();
    const insets = useSafeAreaInsets();
    const users = api.mobile.event.users.useQuery({ eventId: eventId! as string });

    const createChat = api.mobile.chat.create.useMutation({
        onSuccess: (res) => {
            router.push({ pathname: '/(app)/home/event/[eventId]/live/chats/[chatId]', params: { eventId, chatId: res } })
        },
        onError: (error) => {
            console.log(error.data?.code, "error al crear chat", error.message)
            if (error.data?.code === "CONFLICT") {
                router.push({ pathname: '/(app)/home/event/[eventId]/live/chats/[chatId]', params: { eventId, chatId: error.message } })
            }
        },

    })

    function onChat({ receiverId }: { receiverId: string }) {
        console.log("on chat", receiverId, "userid", user?.id!)
        if (receiverId === user?.id) { return null }
        createChat.mutate({ requesterId: user?.id! as string, receiverId, eventId: eventId! as string })
    }


    if (users.isLoading) {
        return <Loading />
    }

    return (
        <View style={{ flex: 1, flexDirection: 'column', paddingHorizontal: 20, paddingTop: insets.top }}>
            <FlashList
                data={users.data}
                ListHeaderComponent={() => (
                    <View className=''>
                        <Text numberOfLines={2} style={{ textTransform: "uppercase", fontWeight: "800", fontSize: 25, lineHeight: 50, letterSpacing: -1, color: colors.text }}>
                            En esta fiesta
                        </Text>
                    </View>
                )}
                refreshControl={<RefreshControl tintColor={colors.text} progressBackgroundColor={colors.text} refreshing={users.isFetching} onRefresh={() => {
                    console.log('refresh!');
                    users.refetch()
                }} />}
                estimatedItemSize={20}
                showsVerticalScrollIndicator={false}
                showsHorizontalScrollIndicator={false}
                ListEmptyComponent={() => (
                    <View className="py-2">
                        <Text className="font-semibold italic text-white">
                            No hay más gente en esta fiesta
                        </Text>
                    </View>
                )}
                ItemSeparatorComponent={() => <View className="h-10" />}
                ListFooterComponent={() => <View className="h-20" />}
                renderItem={({ item, index }) => {
                    return (
                        <Pressable  className='flex flex-row items-center gap-5 w-full' disabled={createChat.isPending || createChat.isError || createChat.isPaused } key={index.toString()} style={{ paddingHorizontal: 10 }} onPress={() => {
                            onChat({ receiverId: item.user.id })
                        }}>
                            <View className=''>
                                <Image
                                    cachePolicy='memory-disk'
                                    placeholder={blurhash}
                                    priority='high'
                                    style={{ borderRadius: 100, backgroundColor: colors.onBackground, height: 75, width: 75 }}
                                    source={{ uri: item.user.image ?? ""}} />
                            </View>
                            <View className='flex flex-1'>
                                <Text numberOfLines={2} style={{ fontWeight: "800", fontSize: 18, lineHeight: 50, letterSpacing: -1, color: colors.text }}>
                                    {item.user.name} {item.user.id === user?.id ? '(Tú)' : ''}
                                </Text>
                            </View>
                        </Pressable>
                    )
                }}
            />
        </View>
    )
}