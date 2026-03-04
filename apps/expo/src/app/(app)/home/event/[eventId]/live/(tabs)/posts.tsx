import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { FlashList } from '@shopify/flash-list';
import { Image, ImageBackground } from 'expo-image';
import { Link, router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { Dimensions, Pressable, Text, View } from 'react-native';
import { RefreshControl } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Loading from '~/components/loading';
import useTheme from '~/hooks/useTheme';
import { api } from '~/utils/api';
import { blurhash, dayjs } from '~/utils/constants';

export default function Page() {
    const { eventId } = useLocalSearchParams<{ eventId: string }>();
    const { colors } = useTheme()
    const insets = useSafeAreaInsets();
    const posts = api.mobile.post.all.useQuery({ eventId: eventId! as string })

    const event = api.mobile.event.byId.useQuery({ id: eventId! as string })

    if (event.isLoading || posts.isLoading) {
        return <Loading />
    }

    return (
        <View style={{ flex: 1, flexDirection: 'column', paddingTop: insets.top }}>
            <View style={{ paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Pressable onPress={() => { router.back() }} style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                    <View style={{ justifyContent: 'center', alignItems: 'center', padding: 4, }}>
                        <MaterialCommunityIcons name={'chevron-left'} style={{}} size={30} color={colors.text} />
                    </View>
                    <Text className='text-white' style={{ fontSize: 15 }}>
                        Volver
                    </Text>
                </Pressable>

            </View >
            <FlashList
                // data={posts?.data?.pages.flatMap(page => page.finalData)}
                data={posts.data}
                estimatedItemSize={20}
                refreshControl={<RefreshControl tintColor={colors.text} progressBackgroundColor={colors.text} refreshing={posts.isFetching} onRefresh={() => {
                    console.log('refresh!');
                    posts.refetch()
                }} />}
                // onEndReached={handleEndReached}
                showsVerticalScrollIndicator={false}
                showsHorizontalScrollIndicator={false}
                ListHeaderComponent={() => (
                    <View className='px-5 flex flex-row justify-between items-center'>
                        <Text numberOfLines={2} style={{ textTransform: "uppercase", fontWeight: "800", fontSize: 25, lineHeight: 50, letterSpacing: -1, color: colors.text }}>
                            Posts
                        </Text>
                        <Link asChild href={{ pathname: "/(app)/home/event/[eventId]/live/posts/create", params: { eventId: eventId } }}>
                            <MaterialCommunityIcons name={'plus'} style={{}} size={30} color={colors.text} />
                        </Link>
                    </View>
                )}
                ListEmptyComponent={() => <View className='flex flex-1 items-center justify-center'>
                    <Text className='text-white' numberOfLines={4} style={{ fontSize: 18, maxWidth: 210, textAlign: "center" }}>
                        Todavia no hay posts. ¡Se el primero!
                    </Text>
                </View>}
                overScrollMode='never'
                keyExtractor={(item, index) => index.toString()}
                renderItem={({ item, index }) => {
                    // console.log(item, 'item')
                    return (
                        <View style={{ flex: 1 }}>
                            <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 15, paddingVertical: 10 }}>
                                <Image removeClippedSubviews={true} cachePolicy='memory-disk' placeholder={blurhash} priority='high' style={{ width: 40, height: 40, borderRadius: 100 }} source={{ uri: item?.userOnEvent.user?.image ?? "" }} />
                                <View style={{ paddingHorizontal: 10 }}>
                                    <Text style={{ color: colors.text, fontSize: 16 }}>
                                        {item?.userOnEvent.user?.name}
                                    </Text>
                                    <Text style={{ color: "#939393", fontSize: 14 }}>
                                        hace {`${dayjs(item?.createdAt).locale("es").fromNow(true)}`}
                                    </Text>
                                </View>
                            </View>
                            <View style={{ flex: 1, aspectRatio: 1 }}>
                                <ImageBackground contentFit='cover' cachePolicy='memory-disk' placeholder={blurhash} priority='high' style={{
                                    width: Dimensions.get('screen').width,
                                    height: Dimensions.get('screen').width
                                    // aspectRatio: 1,
                                }} source={{ uri: item?.pictures[0]?.url }} />
                            </View>
                            <View style={{ paddingRight: 15, paddingVertical: 10 }}>
                                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: 'space-between' }}>
                                    <View style={{ flexDirection: "row", paddingHorizontal: 15, paddingVertical: 5 }}>
                                        <Text style={{ color: colors.text, fontSize: 14, fontWeight: '600' }}>
                                            {item?.userOnEvent.user?.name}
                                        </Text>
                                        <Text style={{ color: colors.text, fontSize: 14, paddingLeft: 10, maxWidth: "70%" }}>
                                            {item?.about}
                                        </Text>
                                    </View>
                                    <Pressable onPress={() => { console.log("Corazon") }}>
                                        <MaterialCommunityIcons name={'heart-outline'} style={{ color: colors.text }} size={25} color={colors.text} />
                                    </Pressable>
                                </View>
                            </View>
                        </View>
                    )
                }
                }
            />
        </View>
    )
}