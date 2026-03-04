import { useLocalSearchParams } from 'expo-router';
import React from 'react';

import { SafeAreaView } from 'react-native-safe-area-context';
import useTheme from '~/hooks/useTheme';
import { api } from '~/utils/api';

export default function Page() {
    const { colors } = useTheme()
    const { userPurchaseId } = useLocalSearchParams<{ userPurchaseId: string, eventId: string }>();
    const purchase = api.mobile.userPurchase.qrInfo.useQuery({ userPurchaseId: userPurchaseId! as string })
    return (
        <SafeAreaView>
            {/* <View style={{ paddingHorizontal: 20, flex: 1 }}>
                <FlashList
                    data={purchase.data?.product }
                    keyExtractor={(item, index) => index.toString()}
                    bounces={true}
                    showsHorizontalScrollIndicator={false}
                    showsVerticalScrollIndicator={false}
                    ListHeaderComponent={() =>
                        <View style={{ gap: 5, marginBottom: 5 }}>
                            <CustomNavBar style={{ paddingHorizontal: 0 }} leftAction={() => { navigation.navigate('cashier/scan', route.params.eventId) }} leftIcon='arrow-left' text='Escanear código' textProps={{ style: { textAlign: "center", fontWeight: "600" } }} />
                            <Text style={{ fontSize: 16, marginBottom: 10 }}>{checkProduct?.data?.data.user.given_name} {checkProduct?.data?.data.user.family_name}</Text>
                        </View>
                    }
                    ListEmptyComponent={() =>
                        <View style={{ alignSelf: 'center' }}>
                            {checkProduct.isLoading ?
                                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                                    <ActivityIndicator color={colors.text} size={25} />
                                </View>
                                :
                                <Text style={{ zIndex: 10, fontWeight: "600", fontSize: 14 }}>Pedido ya tomado</Text>
                            }
                        </View>
                    }
                    ListFooterComponent={() =>
                        <View style={{ marginTop: 20 }}>
                            {checkProduct?.data?.data?.product?.length > 0 &&
                                <CustomButton text='Tomar pedido' loading={dischargeProduct.isLoading} labelStyle={{ color: colors.text }} buttonColor={`${colors.primaryAdmin}55`} onPress={() => {
                                    // console.log("pedido tomado", { qr: route.params.data, eventId: route.params.eventId, sub: auth.sub, guildId: guild.guildId })
                                    // dischargeProduct.mutate({ qr: route.params.data, eventId: route.params.eventId, sub: auth.sub, guildId: guild.guildId })
                                }} />
                            }
                            <View style={{ height: 50 }} />
                        </View>
                    }
                    ItemSeparatorComponent={() => <View style={{ height: 20 }} />}
                    renderItem={({ item }: any) =>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 20, flex: 1 }}>
                            <View style={{ width: "15%", alignItems: "center", borderRadius: 100 }}>
                                <ImageBackground cachePolicy='memory-disk' placeholder={blurhash} priority='high' style={{ backgroundColor: colors.surface, width: '100%', aspectRatio: 1 / 1, zIndex: 0, justifyContent: "center", alignItems: "center", borderRadius: 100 }} imageStyle={{ borderRadius: 100 }} source={{ uri: item.avatar }} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <View style={{ flexDirection: 'row', alignContent: 'center', justifyContent: 'space-between' }}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={{ zIndex: 10, fontWeight: "600", fontSize: 14, color: colors.text }}>{item.name}</Text>
                                        <Text style={{ color: "grey", zIndex: 10, fontSize: 14 }}>{item.description}</Text>
                                    </View>
                                    <View style={{ alignSelf: 'center' }}>
                                        <Text style={{ color: "yellow", zIndex: 10, fontSize: 20, textAlign: "center" }}>x{item.quantity}</Text>
                                    </View>
                                </View>
                            </View>
                        </View>
                    }
                />
            </View> */}
        </SafeAreaView>
    )
}