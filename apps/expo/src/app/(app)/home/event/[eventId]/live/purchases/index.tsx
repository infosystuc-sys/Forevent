import { MaterialCommunityIcons } from '@expo/vector-icons';
import BottomSheet, { BottomSheetBackdrop, BottomSheetFlatList, BottomSheetScrollView, BottomSheetView } from '@gorhom/bottom-sheet';
import { useIsFocused } from '@react-navigation/native';
import { ImageBackground } from 'expo-image';
import { router, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { useSession } from '~/context/auth';
import useTheme from '~/hooks/useTheme';
// import QRCode from 'react-native-qrcode-svg';
import { FlashList } from '@shopify/flash-list';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Loading from '~/components/loading';
import { api } from '~/utils/api';
import QRCode from 'react-native-qrcode-svg';
import Alone from '~/assets/svg/alone';
import { RefreshControl } from 'react-native-gesture-handler';
import { PLACEHOLDER } from '~/utils/constants';

const Page: React.FC = () => {
    const { eventId } = useLocalSearchParams<{ eventId: string }>();
    const { colors } = useTheme()
    const { user } = useSession()
    const focused = useIsFocused()
    const [length, setLength] = useState(-1)
    const [qrCode, setQrCode] = useState([])
    const [gift, setGift] = useState(false)
    const [selected, setSelected] = useState<string | undefined>()
    const { control, handleSubmit, reset } = useForm();
    const router = useRouter()

    const invitesCount = api.mobile.invite.giftCount.useQuery({ eventId, userId: user!.id })

    const purchases = api.mobile.userPurchase.all.useQuery({ eventId, userId: user!.id })

    const users = api.mobile.userOnEvent.all.useQuery({ eventId })

    const invite = api.mobile.invite.giftCreate.useMutation({
        onSuccess: (res) => {
            purchases.refetch()
            reset()
            handleClosePress()
        },
        onError: (error) => {
            console.log(JSON.stringify(error), "ERROR location")
            console.log(JSON.stringify(error))
        },
    })

    const snapPoints = useMemo(() => ["50%"], [qrCode]);

    const { bottom: safeBottomArea } = useSafeAreaInsets();
    const bottomSheetRef = useRef<BottomSheet>(null);


    const handleExpandPress = useCallback(() => {
        bottomSheetRef.current?.expand();
    }, []);

    const handleClosePress = useCallback(() => {
        bottomSheetRef.current?.close();
    }, []);

    const renderBackdrop = useCallback(
        (props: any) => (
            <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} pressBehavior={'close'} onPress={() => handleClosePress()} />
        ),
        []
    )

    const contentContainerStyle = useMemo(
        () => [
            {
                paddingTop: 12,
                paddingHorizontal: 20,
            },
            { paddingBottom: safeBottomArea || 6 },
        ],
        [safeBottomArea]
    );

    const onSubmit = (data: any) => {
        console.log(data, "onSubmit(productId+productName: quantity)")
        let userPurchasesIds: string[] = []
        purchases.data?.map(p => {
            if (data[`${p.product.id}${p.product.name}`]) {
                p.ids.map((u, i) => {
                    if (i < data[`${p.product.id}${p.product.name}`]) {
                        userPurchasesIds.push(u)
                    }
                })
            }
        })
        // console.log(urls, "urls", urls.length)
        if (selected) {
            console.log(selected, "selected")
            // console.log({ userPurchasesIds, receiverId: selected, requesterId: user!.id }, "InviteData mutate")
            invite.mutate({ userPurchasesIds, receiverId: selected, requesterId: user!.id })
        } else {
            //para cuando pongamos el qr y hay q ver como mostar la info del qr
            // setQrCode(urls)
        }
        // console.log({ s: user!.id, p: userPurchasesIds })
    }

    const Counter = ({ max, name }: { max: number, name: string }) => {
        return (
            <Controller
                control={control}
                name={name}
                defaultValue={0}
                render={({ field: { value, onChange, }, fieldState: { error } }) => (
                    <>
                        <View style={{ flexDirection: 'row', alignItems: 'center', borderRadius: 10, borderWidth: 1, borderColor: colors.text, padding: 8 }}>
                            <Pressable disabled={value <= 0} onPress={() => onChange(value - 1)}>
                                <MaterialCommunityIcons name={'minus'} style={{}} size={25} color={value <= 0 ? "grey" : colors.text} />
                            </Pressable>
                            <View style={{ paddingHorizontal: 5 }}>
                                <Text style={{ fontWeight: "600", letterSpacing: 0, color: colors.text, textAlign: 'left' }}>
                                    {value}
                                </Text>
                            </View>
                            <Pressable disabled={value >= max} onPress={() => onChange(value + 1)}>
                                <MaterialCommunityIcons name={'plus'} style={{}} size={25} color={value >= max ? "grey" : colors.text} />
                            </Pressable>
                        </View>
                    </>
                )}
            />
        )
    }

    const Content = () => {
        if (gift && !selected) {
            return (
                <BottomSheetFlatList
                    data={users.data?.filter(item => item.user.id !== user!.id)}
                    keyExtractor={(item, index) => index.toString()}
                    ItemSeparatorComponent={() => <View style={{ height: 15 }} />}
                    scrollEnabled={false}
                    // onEndReached={handleEndReached}
                    style={{ paddingHorizontal: 20, flex: 1 }}
                    refreshControl={<RefreshControl tintColor={colors.text} progressBackgroundColor={colors.text} refreshing={users.isFetching} onRefresh={() => {
                        console.log('refresh!');
                        users.refetch()
                    }} />}
                    ListEmptyComponent={
                        <View style={{ flex: 1, height: "100%", alignItems: "center", justifyContent: "center" }}>
                            <View style={{ height: 200 }} />
                            <View style={{ maxHeight: 250, width: 250 }}>
                                <Alone />
                            </View>
                            <Text style={{ fontSize: 18, color: colors.text }}>
                                Eres el primero en la fiesta
                            </Text>
                        </View>
                    }
                    showsVerticalScrollIndicator={false}
                    showsHorizontalScrollIndicator={false}
                    overScrollMode='never'
                    ListHeaderComponent={() => <View style={{ height: 20 }} />}
                    ListFooterComponent={() => <View style={{ height: 20 }} />}
                    renderItem={({ item }) =>
                        <Pressable style={{ flexDirection: 'row' }} onPress={() => {
                            setSelected(item.user.id)
                        }}>
                            <View style={{ width: "15%", alignItems: "center", borderRadius: 100 }}>
                                <ImageBackground style={{ backgroundColor: colors.surface, width: '100%', aspectRatio: 1 / 1, zIndex: 0, justifyContent: "center", alignItems: "center", borderRadius: 100 }} imageStyle={{ borderRadius: 100 }} source={{ uri: item.user.image ? item.user.image : PLACEHOLDER }} />
                            </View>
                            <View style={{ padding: 15, }}>
                                <View>
                                    <Text style={{ fontSize: 16, letterSpacing: .5, color: colors.text, textAlign: 'left' }}>
                                        {item.user.name}
                                    </Text>
                                </View>
                            </View>
                        </Pressable>
                    }
                />
            )
        }

        if (qrCode?.length > 0) {
            return (
                <View style={{ alignItems: 'center', paddingBottom: 20 }}>
                    <Text style={[{ fontSize: 30, paddingBottom: 15, letterSpacing: .5, color: colors.text, textAlign: 'left', fontWeight: "600" }]}>
                        Tu pedido
                    </Text>
                    <QRCode
                        value={JSON.stringify({ s: user!.id, p: qrCode })}
                        size={250}
                        quietZone={10}
                    />
                </View>
            )
        }

        return (<BottomSheetFlatList
            data={purchases.data}
            keyExtractor={(item, index) => index.toString()}
            scrollEnabled={false}
            ListFooterComponent={() =>
                <View style={{ paddingVertical: 20 }}>
                    <Pressable disabled={invite.isPending} style={{ backgroundColor: selected ? colors.primary : colors.primaryAdmin, borderRadius: 25, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }} onPress={handleSubmit(onSubmit)}>
                        {invite.isPending ?
                            <View style={{ paddingVertical: 12.5, }}>
                                <ActivityIndicator />
                            </View>
                            :
                            <>
                                <MaterialCommunityIcons name={selected ? 'gift-outline' : 'qrcode'} style={{}} size={20} color={colors.text} />
                                <Text style={{ color: colors.text, paddingHorizontal: 3, paddingVertical: 12.5, fontSize: 14, textAlign: 'center' }}>
                                    {selected ? 'Regalar' : 'QR'}
                                </Text>
                            </>
                        }
                    </Pressable>
                </View>}
            renderItem={({ item }) =>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 20, width: '100%', paddingTop: 20 }}>
                    <View style={{ width: "15%", alignItems: "center", borderRadius: 100 }}>
                        <ImageBackground style={{ backgroundColor: colors.surface, width: '100%', aspectRatio: 1 / 1, zIndex: 0, justifyContent: "center", alignItems: "center", borderRadius: 100 }} imageStyle={{ borderRadius: 100 }} source={{ uri: item.product.image ?? PLACEHOLDER }} />
                    </View>
                    <View style={{ width: '75%' }}>
                        <View style={{ gap: 5, flexDirection: 'row', alignContent: 'center', justifyContent: 'space-between' }}>
                            <View style={{}}>
                                <Text style={{ zIndex: 10, fontWeight: "600", fontSize: 14, color: colors.text }}>{item.product.name}</Text>
                                <Text style={{ color: "grey", zIndex: 10, fontSize: 14 }}>{item.product.about}</Text>
                            </View>
                            <View style={{ alignSelf: 'center' }}>
                                {/* <Text style={{ color: "yellow", zIndex: 10, fontSize: 20, textAlign: "center" }}>x{item.urls.length}</Text> */}
                                <Counter max={item.ids.length} name={`${item.product.id}${item.product.name}`} />
                            </View>
                        </View>
                    </View>
                </View>
            }
        />)
    }

    if (purchases.isLoading) {
        return <Loading />
    }

    return (
        <SafeAreaView style={{ flex: 1, flexDirection: 'column' }}>
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
            <View className='pb-3 px-5 flex flex-row items-center justify-between'>
                <View className='px-5'>
                    <Text numberOfLines={2} style={{ textTransform: "uppercase", fontWeight: "800", fontSize: 25, lineHeight: 50, letterSpacing: -1, color: colors.text }}>
                        Mis compras
                    </Text>
                </View>
                <Pressable disabled={invitesCount.data === 0} style={{ justifyContent: 'flex-end', alignItems: 'center', padding: 4, flexDirection: "row" }} onPress={() => {
                    console.log("press")
                    router.push({ pathname: '/(app)/home/event/[eventId]/live/purchases/gifts', params: { eventId } })
                }}>
                    {invitesCount.data ?? 0 > 0 ?
                        <View style={{ borderRadius: 100, zIndex: 10, position: 'absolute', top: 20, right: 25, backgroundColor: colors.primary, padding: 2.5, paddingHorizontal: 7.5, justifyContent: 'center', alignItems: 'center' }}>
                            <Text style={{ fontSize: 12, fontWeight: "600", color: colors.text, margin: 0, padding: 0 }}>
                                {invitesCount.data}
                            </Text>
                        </View> : null}
                    <MaterialCommunityIcons name={invitesCount.data ?? 0 > 0 ? 'gift' : 'gift-open'} style={{}} size={30} color={colors.text} />
                </Pressable>

            </View >
            <View className='flex flex-1 w-full h-full' style={{ paddingHorizontal: 15 }}>
                <FlashList
                    estimatedItemSize={20}
                    data={purchases.data}
                    keyExtractor={(item, index) => index.toString()}
                    ListEmptyComponent={() => <View className='flex flex-1 items-center justify-center'>
                        <Text className='text-white' numberOfLines={4} style={{ fontSize: 16, textAlign: "center" }}>
                            Todavia no hiciste compras
                        </Text>
                    </View>}
                    ListFooterComponent={() =>
                        <>
                            {purchases.data && purchases.data.length > 0 && <View style={{ paddingVertical: 20 }}>
                                <Pressable style={{ backgroundColor: colors.primaryAdmin, borderRadius: 25 }} onPress={() => {

                                }}>
                                    <Text style={{ color: colors.text, paddingHorizontal: 20, paddingVertical: 12.5, fontSize: 14, textAlign: 'center' }}>
                                        Retirar
                                    </Text>
                                </Pressable>
                                <Pressable style={{ backgroundColor: colors.primary, marginTop: 15, borderRadius: 25, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }} onPress={() => {
                                    // console.log(purchases.data.flatMap(p => p.urls), "DATAZO MY KING")
                                    if (!gift) {
                                        setGift(true)
                                    }
                                    if (selected) {
                                        setSelected(undefined)
                                    }
                                    handleExpandPress()
                                }}>
                                    <MaterialCommunityIcons name={'gift-outline'} style={{}} size={20} color={colors.text} />
                                    <Text style={{ color: colors.text, paddingHorizontal: 2, paddingVertical: 12.5, fontSize: 14, textAlign: 'center' }}>
                                        Regalar
                                    </Text>
                                </Pressable>
                            </View>}
                        </>}
                    renderItem={({ item }) =>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 20, width: '100%', paddingTop: 20 }}>
                            <View style={{ width: "15%", alignItems: "center", borderRadius: 100 }}>
                                <ImageBackground style={{ backgroundColor: colors.surface, width: '100%', aspectRatio: 1 / 1, zIndex: 0, justifyContent: "center", alignItems: "center", borderRadius: 100 }} imageStyle={{ borderRadius: 100 }} source={{ uri: item.product?.image ?? "" }} />
                            </View>
                            <View style={{ width: '75%' }}>
                                <View style={{ gap: 5, flexDirection: 'row', alignContent: 'center', justifyContent: 'space-between' }}>
                                    <View style={{}}>
                                        <Text style={{ zIndex: 10, fontWeight: "600", fontSize: 14, color: colors.text }}>{item.product?.name}</Text>
                                        <Text style={{ color: "grey", zIndex: 10, fontSize: 14 }}>
                                            {item.product?.about}
                                        </Text>
                                    </View>
                                    <View style={{ alignSelf: 'center' }}>
                                        <Text style={{ color: "yellow", zIndex: 10, fontSize: 20, textAlign: "center" }}>
                                            x {item.ids.length}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        </View>
                    }
                />
            </View>
            <BottomSheet
                ref={bottomSheetRef}
                snapPoints={snapPoints}
                backdropComponent={renderBackdrop}
                enablePanDownToClose={true}
                animateOnMount={true}
                onClose={() => {
                    if (qrCode.length > 0) {
                        setQrCode([])
                        reset()
                    }
                }}
                keyboardBehavior='interactive'
                keyboardBlurBehavior='restore'
                handleIndicatorStyle={{ backgroundColor: colors.text }}
                style={{ zIndex: 1000 }}
                backgroundStyle={{ borderWidth: 4, borderColor: '#FF00FF', backgroundColor: '#000' }}
                index={-1}
            >
                <BottomSheetScrollView
                    style={contentContainerStyle}
                    scrollEnabled={true}
                >
                    <Content />
                </BottomSheetScrollView>
            </BottomSheet>
        </SafeAreaView>
    )
}

export default Page