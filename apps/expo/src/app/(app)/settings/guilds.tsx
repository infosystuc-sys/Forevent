import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { FlashList } from '@shopify/flash-list'
import { Image } from 'expo-image'
import { router } from 'expo-router'
import React from 'react'
import { ActivityIndicator, Alert, Pressable, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Loading from '~/components/loading'
import { useSession } from '~/context/auth'
import useTheme from '~/hooks/useTheme'
import { api } from '~/utils/api'
import { blurhash } from '~/utils/constants'

export default function Page() {
    const { user } = useSession()
    const { colors } = useTheme()
    const insets = useSafeAreaInsets();
    const utils = api.useUtils()
    const invites = api.mobile.joinInvite.byUserId.useQuery({ userId: user!.id })

    const joinInvite = api.mobile.joinInvite.modify.useMutation({
        onSuccess: (res) => {
            Alert.alert(`Solicitud ${res.discharged ? 'aceptada' : 'rechazada'}`, `${res.discharged ? 'Aceptaste' : 'Rechazaste'} las solicitud para unirte a ${res.guild.name}`)
            utils.mobile.joinInvite.byUserId.invalidate()
        },
        onError: (err) => {
            Alert.alert('Error', err.message)
        }
    })

    if (invites.isLoading) {
        return <Loading />
    }

    return (
        <View style={{ flex: 1, flexDirection: 'column', paddingTop: insets.top, paddingHorizontal: 15 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Pressable onPress={() => { router.back() }} style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                    <View style={{ justifyContent: 'center', alignItems: 'center', padding: 4, }}>
                        <MaterialCommunityIcons name={'chevron-left'} style={{}} size={30} color={colors.text} />
                    </View>
                    <Text className='text-white' style={{ fontSize: 15 }}>
                        Volver
                    </Text>
                </Pressable>

            </View >
            <View className='px-5 flex flex-row justify-between items-center'>
                <Text numberOfLines={2} style={{ textTransform: "uppercase", fontWeight: "800", fontSize: 25, lineHeight: 50, letterSpacing: -1, color: colors.text }}>
                    INVITACIONES
                </Text>
            </View>
            <FlashList
                data={invites.data}
                scrollEnabled={true}
                estimatedItemSize={1000}
                ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
                keyExtractor={(item, index) => index.toString()}
                showsVerticalScrollIndicator={false}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 15 }}
                ListEmptyComponent={() => <View>
                    {invites.isLoading ? <ActivityIndicator color={colors.text} size={25} /> : <Text style={{ fontSize: 15, letterSpacing: 0, color: colors.text, textAlign: 'center', paddingTop: 20 }} numberOfLines={4}>
                        No tienes invitaciones a una organización.
                    </Text>
                    }</View>
                }
                ListHeaderComponent={() =>
                    <>
                        {(invites.data?.length ?? 0) > 0 && <View style={{ paddingBottom: 10 }}>
                            <Text style={{ fontSize: 20, letterSpacing: 0, color: colors.text, textAlign: 'left' }}>
                                Te invitaron a unirte a
                            </Text>
                        </View>}
                    </>
                }
                renderItem={({ item }) => (
                    <View className='w-full' style={{ flex: 1, marginTop: 10 }}>
                        <View className='w-full' style={{ flex: 1, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: colors.primary, alignItems: 'center', shadowColor: colors.primary, shadowOpacity: .2, shadowRadius: 15 }}>
                            <View style={{
                                flex: 1, justifyContent: 'flex-start', alignItems: 'center', width: '100%', flexDirection: 'row', gap: 20, paddingBottom: 10
                            }}>
                                <View style={{}}>
                                    <Image cachePolicy='memory-disk' placeholder={blurhash} priority='high' style={{ borderRadius: 100, backgroundColor: colors.onBackground, minWidth: 50, minHeight: 50 }} source={{ uri: item.guild.image ?? "" }} />
                                </View>
                                <View style={{ gap: 5 }}>
                                    <Text style={{ fontSize: 17.5, letterSpacing: 0, color: colors.text, textAlign: 'left' }}>
                                        {item.guild.name}
                                    </Text>
                                    <Text style={{ color: 'yellow', fontSize: 13 }}>
                                        Tu rol: {item.role === 'EMPLOYEE' ? "Cajero/Portero" : item.role === 'MANAGER' ? 'Gerencia' : "Propietario"}
                                    </Text>
                                </View>
                            </View>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-evenly', width: "100%" }}>
                                <Pressable disabled={joinInvite.isPending} style={{ borderWidth: .5, borderColor: colors.primary, paddingVertical: 7.5, borderRadius: 10, paddingHorizontal: 20 }}
                                    onPress={() => joinInvite.mutate({ joinInviteId: item.id, accept: false })} >
                                    <Text style={{ color: colors.text, fontSize: 14 }}>
                                        Rechazar
                                    </Text>
                                </Pressable>
                                <Pressable disabled={joinInvite.isPending} style={{ borderWidth: .5, borderColor: colors.primary, paddingVertical: 7.5, borderRadius: 10, paddingHorizontal: 20 }}
                                    onPress={() => joinInvite.mutate({ joinInviteId: item.id, accept: true })} >
                                    <Text style={{ color: colors.text, fontSize: 14 }}>
                                        Aceptar
                                    </Text>
                                </Pressable>
                            </View>
                        </View>

                    </View>
                )}
            />
        </View>
    )
}