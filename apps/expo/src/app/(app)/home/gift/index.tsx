import { View, Text, Pressable, FlatList, RefreshControl, ActivityIndicator, SectionList, Dimensions, Alert } from 'react-native'
import React, { Suspense, useMemo, useRef, useCallback, useState } from 'react'
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ImageBackground } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import useTheme from '~/hooks/useTheme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PLACEHOLDER, dayjs } from '~/utils/constants';
import { api } from '~/utils/api';
import { useSession } from '~/context/auth';

const Gift: React.FC = () => {
    const navigation = useNavigation<NativeStackNavigationProp<any>>()
    const { colors } = useTheme()
    const queryClient: any = useQueryClient()
    const { user } = useSession()
    const utils = api.useUtils()

    const invites = api.mobile.user.gifts.useQuery({ userId: user!.id })

    if (invites.isSuccess) {
        console.log(JSON.stringify(invites.data), "invites")
    }
    const patchInvite = api.mobile.invite.giftModify.useMutation({
        onSuccess: (res) => {
            // console.log(res, 'RES update employee')
            invites.refetch()
            Alert.alert(res ? 'Regalo aceptado' : 'Regalo rechazado', res ? 'El regalo fue aceptado correctamente' : 'El regalo fue rechazado correctamente')
            if (res) {
                utils.mobile.userTicket.list.invalidate()
                utils.mobile.user.profile.invalidate()
            }
        },
        onError: (error) => {
            console.log(JSON.stringify(error.message), "ERROR location")
            console.log(JSON.stringify(error))
            Alert.alert(error.message)
        },
    })

    return (
        <SafeAreaView>
            <View style={{ paddingVertical: 18, paddingHorizontal: 20 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Pressable style={{ flexDirection: 'row', zIndex: 10, alignItems: 'center' }} onPress={() => { console.log("PRESS"); navigation.goBack() }}>
                        <MaterialCommunityIcons name={'arrow-left'} style={{ paddingRight: 10 }} size={20} color={colors.text} />
                        <Text style={{ color: colors.text, fontSize: 19 }}>
                            Regalos
                        </Text>
                    </Pressable>
                    {patchInvite.isPending && <ActivityIndicator />}
                </View>
                <FlatList
                    data={invites.data}
                    scrollEnabled={true}
                    ListEmptyComponent={() =>
                        <View style={{ paddingVertical: 15 }}>
                            <Text style={{ zIndex: 10, color: colors.text, fontWeight: "600", fontSize: 14, textAlign: 'center' }}>
                                No tienes regalos
                            </Text>
                        </View>
                    }
                    keyExtractor={(i, index) => index.toString()}
                    renderItem={({ item }) => (
                        <>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 20, width: '100%', paddingTop: 20 }}>
                                <View style={{ width: "15%", alignItems: "center", borderRadius: 100 }}>
                                    <ImageBackground style={{ backgroundColor: colors.surface, width: '100%', aspectRatio: 1 / 1, zIndex: 0, justifyContent: "center", alignItems: "center", borderRadius: 100 }} imageStyle={{ borderRadius: 100 }} source={{ uri: item.giftRequester.image ?? PLACEHOLDER }} />
                                </View>
                                <Text style={{ fontWeight: "800", fontSize: 25, lineHeight: 50, letterSpacing: -1, color: colors.text }}>{item.giftRequester.name}</Text>
                            </View>

                            <View style={{ alignItems: "center", justifyContent: "space-between", flex: 1, width: '100%', height: 380 }} >
                                <ImageBackground style={[{ backgroundColor: colors.surface, width: '100%', height: 380 }]} source={{ uri: item.userTicket?.ticket.event.image ? item.userTicket?.ticket.event.image : PLACEHOLDER }} >
                                    <LinearGradient start={{ x: 0, y: 0 }} end={{ x: 0, y: 2 }} style={{ flex: 1, zIndex: 1000 }} colors={['rgba(20,20,20, 0)', 'rgba(20,20,20,1)']}>
                                        <View style={{ padding: 12.5, flex: 1, justifyContent: 'flex-end' }}>
                                            <View style={{ gap: 0 }}>
                                                <Text style={{ fontSize: 22, paddingVertical: 0, letterSpacing: .5, color: colors.text, textAlign: 'left' }}>
                                                    {item.userTicket?.ticket.event.name}
                                                </Text>
                                                <Text style={{ fontSize: 16.5, paddingVertical: 5, letterSpacing: 0, color: colors.text, textAlign: 'left' }}>
                                                    {item.userTicket?.ticket.event.location.name}
                                                </Text>
                                                <Text style={{ fontSize: 14, color: 'yellow', letterSpacing: 0, textAlign: 'left' }}>
                                                    {dayjs().locale('es').format('dddd D').charAt(0).toUpperCase()}{dayjs().locale('es').format('dddd D').slice(1)} de {dayjs(item.userTicket?.ticket.event.startsAt).locale('es').format('MMMM').charAt(0).toUpperCase()}{dayjs(item.userTicket?.ticket.event.startsAt).locale('es').format('MMMM').slice(1)}, {item.userTicket?.ticket.event.startsAt ? dayjs(item.userTicket?.ticket.event.startsAt).locale('es').format('LT') : "00:00"}
                                                </Text>
                                            </View>
                                            <Pressable style={{ position: 'absolute', right: 10, bottom: 25, padding: 6, alignItems: 'center', justifyContent: 'center' }}>
                                                <View style={{ flexDirection: 'row' }}>
                                                    <Text style={{ fontSize: 14.5, letterSpacing: 0, color: colors.text }} >
                                                        {item.userTicket?.ticket.name}
                                                    </Text>
                                                    <MaterialCommunityIcons name={'ticket-confirmation-outline'} style={{ transform: [{ rotateY: '45deg' }] }} size={20} color={colors.text} />
                                                </View>
                                            </Pressable>
                                        </View>
                                        <View style={{ height: 24, width: 24, left: (Dimensions.get('screen').width / 2) - 27.5, backgroundColor: colors.inverseText, borderRadius: 100, position: 'absolute', top: -12 }} />
                                        <View style={{ height: 24, width: 24, left: (Dimensions.get('screen').width / 2) - 27.5, backgroundColor: colors.inverseText, borderRadius: 100, position: 'absolute', bottom: -12 }} />
                                        <View style={{ height: 2, backgroundColor: colors.inverseText, width: '100%' }} />
                                    </LinearGradient>
                                </ImageBackground>
                            </View>

                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingTop: 15 }}>
                                <Pressable disabled={patchInvite.isPending} style={{ backgroundColor: patchInvite.isPending ? 'grey' : 'red', paddingVertical: 10, borderRadius: 20, width: '48%', alignItems: 'center' }} onPress={() => {
                                    // let invitesIds = section.data.flatMap((a) => { return a.invitesIds })
                                    patchInvite.mutate({ accept: false, giftsIds: [item.id], userId: user!.id })
                                }}>
                                    <MaterialCommunityIcons name={'gift-off'} style={{ paddingRight: 10 }} size={25} color={colors.text} />
                                </Pressable>
                                <Pressable disabled={patchInvite.isPending} style={{ backgroundColor: patchInvite.isPending ? 'grey' : colors.primaryAdmin, paddingVertical: 10, borderRadius: 20, width: '48%', alignItems: 'center' }} onPress={() => {
                                    // let invitesIds = section.data.flatMap((a) => { return a.invitesIds })
                                    patchInvite.mutate({ accept: true, giftsIds: [item.id], userId: user!.id })
                                }}>
                                    <MaterialCommunityIcons name={'gift-open'} style={{ paddingRight: 10 }} size={25} color={colors.text} />
                                </Pressable>
                            </View>
                        </>
                    )}
                />
            </View>
        </SafeAreaView>
    )
}

export default Gift