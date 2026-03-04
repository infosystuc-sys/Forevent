import { View, Text, Pressable, FlatList, RefreshControl, ActivityIndicator, SectionList, Alert } from 'react-native'
import React, { Suspense, useMemo, useRef, useCallback, useState } from 'react'
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ImageBackground } from 'expo-image';
import useTheme from '~/hooks/useTheme';
import { useLocalSearchParams } from 'expo-router';
import { useSession } from '~/context/auth';
import { api } from '~/utils/api';
import { PLACEHOLDER } from '~/utils/constants';

const Gift: React.FC = () => {
    const navigation = useNavigation<NativeStackNavigationProp<any>>()
    const { colors } = useTheme()
    const { eventId } = useLocalSearchParams<{ eventId: string }>();
    const { user } = useSession()
    const utils = api.useUtils()

    const invites = api.mobile.invite.giftInvites.useQuery({ eventId, userId: user!.id })

    if (invites.isSuccess) {
        // console.log((invites.data.data), "invites")
    }
    const productPatch = api.mobile.invite.giftModify.useMutation({
        onSuccess: (res) => {
            // console.log(res, 'RES update employee')
            invites.refetch()
            Alert.alert(res ? 'Regalo aceptado' : 'Regalo rechazado', res ? 'El regalo fue aceptado correctamente' : 'El regalo fue rechazado correctamente')
            if (res) {
                utils.mobile.userPurchase.all.invalidate()
                utils.mobile.invite.giftCount.invalidate()
            }
        },
        onError: (error) => {
            console.log(JSON.stringify(error.message), "ERROR location")
            console.log(JSON.stringify(error))
            Alert.alert(error.message)
        },
    })
    return (
        <SafeAreaView >
            <View style={{ paddingVertical: 18, paddingHorizontal: 20 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Pressable style={{ flexDirection: 'row', zIndex: 10, alignItems: 'center' }} onPress={() => { console.log("PRESS"); navigation.goBack() }}>
                        <MaterialCommunityIcons name={'arrow-left'} style={{ paddingRight: 10 }} size={20} color={colors.text} />
                        <Text style={{ color: colors.text, fontSize: 19 }}>
                            Regalos
                        </Text>
                    </Pressable>
                    {/* {productPatch.isLoading && <ActivityIndicator />} */}
                </View>
                <SectionList
                    sections={invites.data ?? []}
                    scrollEnabled={true}
                    ListEmptyComponent={() =>
                        <View style={{ paddingVertical: 15 }}>
                            <Text style={{ zIndex: 10, fontWeight: "600", fontSize: 14, textAlign: 'center', color: colors.text }}>
                                No tienes regalos
                            </Text>
                        </View>
                    }
                    keyExtractor={(i, index) => index.toString()}
                    renderItem={({ item }) => (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 20, width: '100%', paddingTop: 20 }}>
                            {/* <View style={{ width: "15%", alignItems: "center", borderRadius: 100 }}>
                                <ImageBackground style={{ backgroundColor: colors.surface, width: '100%', aspectRatio: 1 / 1, zIndex: 0, justifyContent: "center", alignItems: "center", borderRadius: 100 }} imageStyle={{ borderRadius: 100 }} source={{ uri: item.avatar }} />
                            </View> */}
                            <View style={{ width: '100%' }}>
                                <View style={{ gap: 5, flexDirection: 'row', alignContent: 'center', justifyContent: 'space-between' }}>
                                    <View style={{}}>
                                        <Text style={{ zIndex: 10, fontWeight: "600", fontSize: 14 }}>{item.name}</Text>
                                        <Text style={{ color: "grey", zIndex: 10, fontSize: 14 }}>{item.about}</Text>
                                    </View>
                                    <View style={{ alignSelf: 'center' }}>
                                        <Text style={{ color: "yellow", zIndex: 10, fontSize: 20, textAlign: "center" }}>x{item.userPurchasesIds.length}</Text>
                                    </View>
                                </View>
                            </View>
                        </View>
                    )}
                    renderSectionHeader={({ section }) => (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 20, width: '100%', paddingTop: 20 }}>
                            <View style={{ width: "15%", alignItems: "center", borderRadius: 100 }}>
                                <ImageBackground style={{ backgroundColor: colors.surface, width: '100%', aspectRatio: 1 / 1, zIndex: 0, justifyContent: "center", alignItems: "center", borderRadius: 100 }} imageStyle={{ borderRadius: 100 }} source={{ uri: section.image ?? PLACEHOLDER }} />
                            </View>
                            <Text style={{ fontWeight: "800", fontSize: 25, lineHeight: 50, letterSpacing: -1, color: colors.text }}>{section.userName}</Text>
                        </View>
                    )}
                    renderSectionFooter={({ section }) =>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingTop: 15 }}>
                            <Pressable disabled={productPatch.isPending} style={{ backgroundColor: productPatch.isPending ? 'grey' : 'red', paddingVertical: 10, borderRadius: 20, width: '48%', alignItems: 'center' }} onPress={() => {
                                let giftsIds = section.data.flatMap((a) => { return a.giftsIds })
                                productPatch.mutate({ accept: false, giftsIds, userId: user!.id })
                            }}>
                                <MaterialCommunityIcons name={'gift-off'} style={{ paddingRight: 10 }} size={25} color={colors.text} />
                                {/* <CustomText style={{ fontWeight: "800", }}>
                                    Cancelar
                                </CustomText> */}
                            </Pressable>
                            <Pressable disabled={productPatch.isPending} style={{ backgroundColor: productPatch.isPending ? 'grey' : colors.primaryAdmin, paddingVertical: 10, borderRadius: 20, width: '48%', alignItems: 'center' }} onPress={() => {
                                let giftsIds = section.data.flatMap((a) => { return a.giftsIds })
                                productPatch.mutate({ accept: true, giftsIds, userId: user!.id })
                            }}>
                                <MaterialCommunityIcons name={'gift-open'} style={{ paddingRight: 10 }} size={25} color={colors.text} />
                                {/* <CustomText style={{ fontWeight: "800", }}>
                                    Aceptar
                                </CustomText> */}
                            </Pressable>
                        </View>
                    }

                />
            </View>
        </SafeAreaView>
    )
}

export default Gift