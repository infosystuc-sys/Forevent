import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { Image } from 'expo-image'
import { useRouter } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import React from 'react'
import { ActivityIndicator, Pressable, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useSession } from '~/context/auth'
import useTheme from '~/hooks/useTheme'
import { api } from '~/utils/api'
import { PLACEHOLDER, blurhash } from '~/utils/constants'

export default function profile() {
    const { user } = useSession()
    const { colors } = useTheme()
    const insets = useSafeAreaInsets();
    const router = useRouter()

    const profile = api.mobile.user.profile.useQuery({ id: user!.id })

    return (
        <View style={{ flex: 1, flexDirection: 'column', paddingTop: insets.top, paddingHorizontal: 15 }}>
            <StatusBar animated={true} backgroundColor='#00000000' translucent />
            <View style={{ paddingTop: 12.5, gap: 7.5, paddingHorizontal: 20 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20 }}>
                    <Pressable disabled={!profile.data?.giftCount} style={{ justifyContent: 'flex-end', alignItems: 'center', padding: 4, flexDirection: "row" }} onPress={() => {
                        console.log("press")
                        router.push('/(app)/home/gift')
                        // navigation.navigate('user/ticket/gift')
                    }}>
                        {profile?.data?.giftCount ?
                            <View style={{ borderRadius: 100, zIndex: 10, position: 'absolute', top: 20, left: 15, backgroundColor: colors.primary, padding: 2.5, paddingHorizontal: 7.5, justifyContent: 'center', alignItems: 'center' }}>
                                <Text style={{ fontSize: 12, fontWeight: "600", color: colors.text, margin: 0, padding: 0 }}>
                                    {profile.data.giftCount}
                                </Text>
                            </View> : null}
                        <MaterialCommunityIcons name={profile.data?.giftCount && profile.data.giftCount > 0 ? 'gift' : 'gift-open'} style={{}} size={30} color={colors.text} />
                    </Pressable>
                    <View style={{ flexDirection: "row", alignSelf: "flex-end" }}>
                        <Pressable style={{ alignSelf: 'center', padding: 7.5, }} onPress={() => { router.push("/(app)/settings/") }}>
                            <MaterialCommunityIcons name={'cog-outline'} style={{}} size={30} color={colors.text} />
                        </Pressable>
                    </View>
                </View>
                <View style={{ height: "5%" }} />
                <View style={{ alignItems: 'center' }}>
                    <Pressable onPress={() => console.log('onCameraPressHandler')}>
                        <Image cachePolicy='memory-disk' placeholder={blurhash} priority='high' style={{ width: 85, height: 85, borderRadius: 100 }} source={{ uri: user?.image ?? "" }} />
                    </Pressable>
                    <View style={{ paddingTop: 10, paddingBottom: 15 }}>
                        <Text style={{ color: colors.text, fontSize: 25 }}>
                            {user?.name}
                        </Text>
                    </View>
                </View>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <Pressable style={{ width: "49%", height: 70, borderRadius: 10, backgroundColor: colors.background, alignItems: "center", justifyContent: "center" }} onPress={() => { }}>
                        {profile.isSuccess && profile.data?.friendsCount ?
                            <Text>{profile.data.friendsCount}</Text> :
                            <MaterialCommunityIcons name={'plus'} style={{}} size={20} color={colors.text} />
                        }
                        <Text style={{ color: colors.text, fontSize: 14 }}>
                            Amigos
                        </Text>
                    </Pressable>
                    <Pressable style={{ width: "49%", height: 70, borderRadius: 10, backgroundColor: colors.background, alignItems: "center", justifyContent: "center" }} onPress={() => { }}>
                        {profile.isSuccess ?
                            <Text style={{ color: colors.text }}>{profile.data?.friendRequests}</Text> :
                            <MaterialCommunityIcons name={'plus'} style={{}} size={20} color={colors.text} />
                        }
                        <Text style={{ color: colors.text, fontSize: 14 }}>
                            Solicitudes
                        </Text>
                    </Pressable>
                </View>
                {profile?.data?.event &&
                    <View style={{}}>
                        <View style={{ paddingTop: 20, paddingBottom: 10 }}>
                            <Text style={{ fontSize: 20, letterSpacing: 0, color: colors.text, textAlign: 'left' }}>
                                Estas actualmente en
                            </Text>
                        </View>
                        <Pressable className='w-full' style={{ alignItems: "center", marginTop: 10 }} onPress={() => {
                            router.push({ pathname: '/(app)/home/event/[eventId]/live/(tabs)/posts', params: { eventId: profile.data?.event?.id as string } })
                            // event.setCurrentEvent(userOnEvent?.data?.data);
                            // storeObject('cart', null)
                            // navigation.navigate('social')
                        }}>
                            <View style={{ paddingHorizontal: 20, paddingVertical: 15, width: '100%', borderRadius: 15, borderWidth: 1, borderColor: colors.primary, alignItems: 'center' }}>
                                <View style={{ justifyContent: 'space-between', alignItems: 'center', width: '100%', flexDirection: 'row', gap: 20 }}>
                                    <Image cachePolicy='memory-disk' placeholder={blurhash} priority='high' style={{ borderRadius: 100, backgroundColor: colors.onBackground, width: 50, height: 50 }} source={{ uri: profile?.data?.event.image ?? PLACEHOLDER }} />
                                    <View style={{ flex: 1, gap: 5 }}>
                                        <Text style={{ fontSize: 17.5, letterSpacing: 0, color: colors.text, textAlign: 'left' }}>
                                            {profile?.data?.event.name}
                                        </Text>
                                        <Text style={{ color: 'yellow', fontSize: 12.5 }}>
                                            {profile?.data?.event.location?.name}, {profile?.data?.event.location?.city}
                                        </Text>
                                    </View>
                                    <View style={{}}>
                                        <MaterialCommunityIcons name={'chevron-right'} style={{}} size={30} color={colors.text} />
                                    </View>
                                </View>
                            </View>
                            <View style={{ position: "absolute", height: "100%", borderRadius: 10, width: "100%", flex: 1, shadowOpacity: 0.1, shadowRadius: 10, backgroundColor: colors.inverseText, zIndex: -1, shadowColor: colors.primary }} />
                        </Pressable>
                    </View>
                }
            </View>
        </View >
    )
}