import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetFlatList,
  BottomSheetScrollView,
  BottomSheetView
} from '@gorhom/bottom-sheet';
import { zodResolver } from '@hookform/resolvers/zod';
import { FlashList } from '@shopify/flash-list';
import { Image, ImageBackground } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Controller, SubmitHandler, useForm } from 'react-hook-form';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { RefreshControl } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { z } from 'zod';
import { useSession } from '~/context/auth';
import useTheme from '~/hooks/useTheme';
import { api } from '~/utils/api';
import { PLACEHOLDER, blurhash } from '~/utils/constants';

const addSchema = z.object({
  quantity: z.number(),
  product: z.object({
    id: z.string(),
    name: z.string(),
    price: z.number(),
    about: z.string().nullish(),
    type: z.enum(['DEAL', 'PRODUCT']),
    image: z.string(),
  })
})

const cartSchema = z.object({
  cart: z.array(addSchema)
})

export default function Page() {
  const { colors } = useTheme();
  const [step, setStep] = useState(0)
  const { user } = useSession()
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const insets = useSafeAreaInsets();
  const { bottom: safeBottomArea } = useSafeAreaInsets();
  const snapPoints = useMemo(() => ["40%"], [])
  const bottomSheetRef = useRef<BottomSheet>(null);

  const handleSnapPress = useCallback((index: any) => {
    bottomSheetRef.current?.snapToIndex(index);
  }, []);

  const handleExpandPress = useCallback(() => {
    bottomSheetRef.current?.expand();
  }, []);

  const handleClosePress = useCallback(() => {
    bottomSheetRef.current?.close();
  }, []);

  const contentContainerStyle = useMemo(
    () => [
      { paddingHorizontal: 20, marginBottom: safeBottomArea || 6 },
    ],
    [safeBottomArea]
  );

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop  {...props} appearsOnIndex={0} disappearsOnIndex={-1} pressBehavior={'close'} onPress={() => handleClosePress()} >
        {/* <BlurView
          style={{ flex: 1 }}
          blurType="dark"
          blurAmount={20}
          reducedTransparencyFallbackColor="white"

        /> */}
      </BottomSheetBackdrop>
    ),
    []
  )

  const addForm = useForm<z.infer<typeof addSchema>>({
    resolver: zodResolver(addSchema),
    defaultValues: {
      product: {},
      quantity: 1
    },
    mode: "onBlur"
  })

  const cartForm = useForm<z.infer<typeof cartSchema>>({
    resolver: zodResolver(cartSchema),
    defaultValues: {
      cart: []
    },
    mode: "onBlur"
  })

  const onAddSubmit: SubmitHandler<z.infer<typeof addSchema>> = (data) => {
    console.log("on submit")
    console.log(JSON.stringify(data));

  };

  const store = api.mobile.product.onEvent.useQuery({ eventId: eventId! as string })

  const purchase = api.mobile.purchase.products.useMutation({
    onSuccess: () => {
      cartForm.setValue('cart', [])
      handleClosePress()
    },
    onError: () => {

    }
  })

  const Total = () => {
    let total = 0
    cartForm.watch('cart').map(item => {
      total += item.product.price * item.quantity
    })
    return total
  }


  return (
    <View style={{ flex: 1, flexDirection: 'column', paddingTop: insets.top }}>
      <View style={{ paddingVertical: 18, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View className='px-5'>
          <Text numberOfLines={2} style={{ textTransform: "uppercase", fontWeight: "800", fontSize: 25, lineHeight: 50, letterSpacing: -1, color: colors.text }}>
            Tienda
          </Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 20 }}>
          <Pressable style={{ justifyContent: 'center', alignItems: 'center', padding: 4, flexDirection: "row" }} onPress={() => { setStep(2); handleExpandPress() }}>
            {cartForm.watch('cart') && cartForm.watch('cart').length > 0 ?
              <View style={{ borderRadius: 100, zIndex: 10, position: 'absolute', top: 20, right: 25, backgroundColor: colors.primary, padding: 2.5, paddingHorizontal: 7.5, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ fontSize: 12, fontWeight: "600", color: colors.text, margin: 0, padding: 0 }}>
                  {cartForm.watch('cart').length}
                </Text>
              </View> : null}
            <MaterialCommunityIcons name={'cart-variant'} style={{}} size={30} color={colors.text} />
          </Pressable>
          <Pressable onPress={() => {
            router.push({ pathname: '/(app)/home/event/[eventId]/live/purchases/', params: { eventId } })
          }}
            className='rounded-full flex flex-row px-4 items-center justify-center h-10' style={{
              borderWidth: 1,
              borderColor: "#FFD25B",
              shadowColor: "#FFD25B",
              shadowOpacity: 0.5,
              shadowRadius: 10,
            }}
          >
            <Text style={{ color: colors.text, fontSize: 12, fontWeight: "600" }}>
              Mis compras
            </Text>
            <MaterialCommunityIcons name={'chevron-right'} style={{ justifyContent: 'center', alignItems: 'center', marginTop: 1 }} size={20} color={colors.text} />
          </Pressable>
        </View>
      </View >
      <View style={{ height: 10 }} />
      <View className='flex-1 px-5'>
        <Controller
          control={addForm.control}
          name="product"
          render={({
            field: { onChange, onBlur, value },
            fieldState: { error },
          }) => {
            return (
              <View className='flex flex-1'>
                <FlashList
                  data={store.data?.deals}
                  keyExtractor={(item, index) => index.toString()}
                  estimatedItemSize={20}
                  ItemSeparatorComponent={() => <View style={{ height: .5, backgroundColor: colors.outline, marginVertical: 20 }} />}
                  ListHeaderComponent={<Text numberOfLines={2} style={{ textTransform: "uppercase", fontWeight: "800", fontSize: 22, lineHeight: 50, letterSpacing: -1, color: colors.text }}>
                    Promociones
                  </Text>}
                  showsVerticalScrollIndicator={false}
                  showsHorizontalScrollIndicator={false}
                  refreshControl={<RefreshControl tintColor={colors.text} progressBackgroundColor={colors.text} refreshing={store.isFetching} onRefresh={() => {
                    console.log('refresh!');
                    store.refetch()
                  }} />}
                  ListEmptyComponent={() =>
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                      <Text style={{ color: colors.text }}>
                        No hay promociones disponibles
                      </Text>
                    </View>
                  }
                  overScrollMode='never'
                  scrollEnabled={false}
                  ListFooterComponent={() => <View style={{ height: 0 }} />}
                  renderItem={({ item, index }) =>
                    <View style={{ flex: 1, backgroundColor: colors.inverseText }}>
                      <Pressable style={{ borderRadius: 15 }} onPress={() => { onChange({ id: item.id, name: item.name, price: item.price, about: item.about, image: item.image, type: 'DEAL' }); setStep(1), handleExpandPress() }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                          <View style={{ gap: 10, justifyContent: 'space-between' }}>
                            <View>
                              <Text style={{ fontWeight: "600", fontSize: 20, letterSpacing: .5, color: colors.text, textAlign: 'left' }}>
                                {item.name}
                              </Text>
                              <Text style={{ fontSize: 16, letterSpacing: .5, color: colors.text, textAlign: 'left' }}>
                                {item.about}
                              </Text>
                            </View>
                            <Text style={{ color: "yellow", fontSize: 20, letterSpacing: .5, textAlign: 'left', fontWeight: '600' }}>
                              $ {item.price?.toLocaleString()}
                            </Text>
                          </View>
                          <Image cachePolicy='memory-disk' placeholder={blurhash} priority='high' style={{ borderRadius: 5, backgroundColor: colors.onBackground, width: '30%', aspectRatio: 1 }} source={{ uri: item.image ?? PLACEHOLDER }} />
                        </View>
                      </Pressable>
                    </View>
                  }
                />
                <FlashList
                  data={store.data?.foods}
                  keyExtractor={(item, index) => index.toString()}
                  estimatedItemSize={20}
                  ItemSeparatorComponent={() => <View style={{ height: .5, backgroundColor: colors.outline, marginVertical: 20 }} />}
                  ListHeaderComponent={<Text numberOfLines={2} style={{ textTransform: "uppercase", fontWeight: "800", fontSize: 22, lineHeight: 50, letterSpacing: -1, color: colors.text }}>
                    Comida
                  </Text>}
                  showsVerticalScrollIndicator={false}
                  showsHorizontalScrollIndicator={false}
                  refreshControl={<RefreshControl tintColor={colors.text} progressBackgroundColor={colors.text} refreshing={store.isFetching} onRefresh={() => {
                    console.log('refresh!');
                    store.refetch()
                  }} />}
                  ListEmptyComponent={() =>
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                      <Text style={{ color: colors.text }}>
                        No hay comida disponibles
                      </Text>
                    </View>
                  }
                  overScrollMode='never'
                  scrollEnabled={false}
                  ListFooterComponent={() => <View style={{ height: 10 }} />}
                  renderItem={({ item, index }) =>
                    <View style={{ flex: 1, backgroundColor: colors.inverseText }}>
                      <Pressable style={{ borderRadius: 15 }} onPress={() => { onChange({ id: item.id, name: item.name, price: item.price, about: item.about, image: item.image, type: 'PRODUCT' }); setStep(1), handleExpandPress() }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                          <View style={{ gap: 10, justifyContent: 'space-between' }}>
                            <View>
                              <Text style={{ fontWeight: "600", fontSize: 20, letterSpacing: .5, color: colors.text, textAlign: 'left' }}>
                                {item.name}
                              </Text>
                              <Text style={{ fontSize: 16, letterSpacing: .5, color: colors.text, textAlign: 'left' }} >
                                {item.about}
                              </Text>
                            </View>
                            <Text style={{ color: "yellow", fontSize: 20, letterSpacing: .5, textAlign: 'left', fontWeight: '600' }} >
                              $ {item.price?.toLocaleString()}
                            </Text>
                          </View>
                          <Image cachePolicy='memory-disk' placeholder={blurhash} priority='high' style={{ borderRadius: 5, backgroundColor: colors.onBackground, width: '30%', aspectRatio: 1 }} source={{ uri: item.image ?? PLACEHOLDER }} />
                        </View>
                      </Pressable>
                    </View>
                  }
                />
                <FlashList
                  data={store.data?.drinks}
                  keyExtractor={(item, index) => index.toString()}
                  estimatedItemSize={20}
                  ItemSeparatorComponent={() => <View style={{ height: .5, backgroundColor: colors.outline, marginVertical: 20 }} />}
                  ListHeaderComponent={<Text numberOfLines={2} style={{ textTransform: "uppercase", fontWeight: "800", fontSize: 22, lineHeight: 50, letterSpacing: -1, color: colors.text }}>
                    Bebidas
                  </Text>}
                  showsVerticalScrollIndicator={false}
                  showsHorizontalScrollIndicator={false}
                  refreshControl={<RefreshControl tintColor={colors.text} progressBackgroundColor={colors.text} refreshing={store.isFetching} onRefresh={() => {
                    console.log('refresh!');
                    store.refetch()
                  }} />}
                  ListEmptyComponent={() =>
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                      <Text style={{ color: colors.text }}>
                        No hay bebidas disponibles
                      </Text>
                    </View>
                  }
                  overScrollMode='never'
                  scrollEnabled={false}
                  ListFooterComponent={() => <View style={{ height: 50 }} />}
                  renderItem={({ item, index }) =>
                    <View style={{ flex: 1, backgroundColor: colors.inverseText }}>
                      <Pressable style={{ borderRadius: 15 }} onPress={() => { onChange({ id: item.id, name: item.name, price: item.price, about: item.about, image: item.image, type: 'PRODUCT' }); setStep(1), handleExpandPress() }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                          <View style={{ gap: 10, justifyContent: 'space-between' }}>
                            <View>
                              <Text style={{ fontWeight: "600", fontSize: 20, letterSpacing: .5, color: colors.text, textAlign: 'left' }}>
                                {item.name}
                              </Text>
                              <Text style={{ fontSize: 16, letterSpacing: .5, color: colors.text, textAlign: 'left' }}>
                                {item.about}
                              </Text>
                            </View>
                            <Text style={{ color: "yellow", fontSize: 20, letterSpacing: .5, textAlign: 'left', fontWeight: '600' }}>
                              $ {item.price?.toLocaleString()}
                            </Text>
                          </View>
                          <Image cachePolicy='memory-disk' placeholder={blurhash} priority='high' style={{ borderRadius: 5, backgroundColor: colors.onBackground, width: '30%', aspectRatio: 1 }} source={{ uri: item.image ?? PLACEHOLDER }} />
                        </View>
                      </Pressable>
                    </View>
                  }
                />
              </View>
            );
          }}
        />
      </View>
      <BottomSheet
        ref={bottomSheetRef}
        onClose={() => { setStep(0) }}
        enableDynamicSizing={true}
        snapPoints={snapPoints}
        enablePanDownToClose={true}
        animateOnMount={true}
        backdropComponent={renderBackdrop}
        keyboardBlurBehavior='restore'
        android_keyboardInputMode='adjustResize'
        backgroundStyle={{ backgroundColor: '#000' }}
        index={-1}
        handleIndicatorStyle={{ backgroundColor: '#fff' }}
      >
        <BottomSheetScrollView overScrollMode={"never"} scrollEnabled={false} style={{ paddingHorizontal: 20 }}>
          {step === 1 &&
            <BottomSheetView style={{ gap: 5 }}>
              <View style={{ paddingHorizontal: 20, gap: 5, borderRadius: 10 }}>
                <Text style={{ fontSize: 22, fontWeight: "600", paddingVertical: 0, letterSpacing: .5, color: colors.text, textAlign: 'left' }}>
                  {addForm.watch('product.name')}
                </Text>
                <Text style={{ fontSize: 13, paddingVertical: 5, letterSpacing: 0, color: colors.onSurfaceVariant, textAlign: 'left' }}>
                  {addForm.watch('product.about')}
                </Text>
                <Text style={{ fontSize: 20, fontWeight: "600", paddingVertical: 0, letterSpacing: .5, color: 'yellow', textAlign: 'left' }}>
                  ${addForm.watch('product.price').toLocaleString()}
                </Text>
              </View>
              <View style={{ flex: 1 }} />
              <View style={{ height: 5, backgroundColor: colors.surface, marginVertical: 10 }} />
              <View style={{ paddingHorizontal: 20, paddingVertical: 10, gap: 5 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ paddingVertical: 0, letterSpacing: .5, color: colors.text, textAlign: 'left', fontWeight: "600" }}>
                    Tu pedido
                  </Text>
                  <Text style={{ fontWeight: "600", paddingVertical: 5, letterSpacing: 0, color: colors.text, textAlign: 'left' }}>
                    ${(addForm.watch('product.price') * addForm.watch('quantity')).toLocaleString()}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', borderRadius: 5, borderWidth: 1, borderColor: colors.text, paddingHorizontal: 15, paddingVertical: 12.5 }}>
                    <Controller
                      control={addForm.control}
                      name="quantity"
                      render={({
                        field: { onChange, onBlur, value },
                        fieldState: { error },
                      }) => {
                        return (
                          <>
                            <Pressable disabled={value <= 1} onPress={() => onChange(value - 1)}>
                              <MaterialCommunityIcons name={'minus'} style={{}} size={25} color={value <= 1 ? "grey" : colors.text} />
                            </Pressable>
                            <View style={{ paddingHorizontal: 15 }}>
                              <Text style={{ fontWeight: "600", letterSpacing: 0, color: colors.text, textAlign: 'left' }}>
                                {value}
                              </Text>
                            </View>
                            <Pressable onPress={() => onChange(value + 1)}>
                              <MaterialCommunityIcons name={'plus'} style={{}} size={25} color={colors.text} />
                            </Pressable>
                          </>
                        );
                      }}
                    />
                  </View>
                  <View style={{ width: 10 }} />
                  <Controller
                    control={cartForm.control}
                    name="cart"
                    render={({
                      field: { onChange, onBlur, value },
                      fieldState: { error },
                    }) => {
                      return (
                        <Pressable style={{ borderRadius: 5, backgroundColor: colors.primary, padding: 12.5, alignItems: 'center', justifyContent: 'center', flex: 1 }} onPress={() => {
                          onChange([...value, addForm.watch()]),
                            handleClosePress()
                        }}>
                          <Text style={{ fontWeight: "600", letterSpacing: 0, color: colors.text, textAlign: 'left' }}>
                            Agregar
                          </Text>
                        </Pressable>
                      );
                    }}
                  />
                </View>
              </View>
            </BottomSheetView>
          }
          {step === 2 &&
            <BottomSheetView style={{ gap: 5 }}>
              <BottomSheetFlatList
                data={cartForm.watch('cart')}
                keyExtractor={(item, index) => index.toString()}
                ItemSeparatorComponent={() => <View style={{ height: .5, backgroundColor: colors.outline, marginVertical: 10 }} />}
                ListHeaderComponent={<Text numberOfLines={2} style={{ textTransform: "uppercase", fontWeight: "800", fontSize: 22, lineHeight: 50, letterSpacing: -1, color: colors.text }}>
                  Carrito
                </Text>}
                showsVerticalScrollIndicator={false}
                showsHorizontalScrollIndicator={false}
                ListEmptyComponent={() =>
                  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={{ color: colors.text }}>
                      No hay productos en el carrito
                    </Text>
                  </View>
                }
                ListFooterComponent={() => cartForm.watch('cart').length > 0 && <View style={{ paddingVertical: 20, gap: 10 }}>
                  <Pressable disabled={purchase.isPending} style={{ backgroundColor: `${colors.primary}ee`, borderRadius: 25 }} onPress={() => {
                    purchase.mutate({
                      products: cartForm.watch('cart').map(item => {
                        return {
                          product: {
                            id: item.product.id,
                            type: item.product.type,
                          },
                          quantity: item.quantity,
                        }
                      }),
                      userId: user!.id,
                      eventId,
                    })
                    console.log(JSON.stringify({ products: cartForm.watch('cart'), userId: user!.id }), "PURCHASE")
                  }}>
                    {purchase.isPending ?
                      <ActivityIndicator style={{ paddingHorizontal: 20, paddingVertical: 12.5, }} />
                      : <Text style={{ color: colors.text, paddingHorizontal: 20, paddingVertical: 12.5, fontSize: 16, textAlign: 'center', fontWeight: '600' }}>
                        Comprar (${Total()})
                      </Text>}
                  </Pressable>
                  <Pressable disabled={purchase.isPending} style={{ borderWidth: 1, borderColor: colors.text, borderRadius: 25, marginTop: 10 }} onPress={() => {
                    cartForm.setValue('cart', [])
                    handleClosePress()
                  }}>
                    {purchase.isPending ?
                      <ActivityIndicator style={{ paddingHorizontal: 20, paddingVertical: 12.5, }} />
                      :
                      <Text style={{ color: colors.text, paddingHorizontal: 20, paddingVertical: 12.5, fontSize: 16, textAlign: 'center', fontWeight: '600' }}>
                        Limpiar carrito
                      </Text>
                    }
                  </Pressable>
                </View>}
                overScrollMode='never'
                scrollEnabled={false}
                renderItem={({ item, index }) =>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 20, width: '100%' }}>
                    <View style={{ width: "15%", alignItems: "center", borderRadius: 100 }}>
                      <ImageBackground cachePolicy='memory-disk' placeholder={blurhash} priority='high' style={{ backgroundColor: colors.surface, width: '100%', aspectRatio: 1 / 1, zIndex: 0, justifyContent: "center", alignItems: "center", borderRadius: 100 }} imageStyle={{ borderRadius: 100 }} source={{ uri: item.product.image }} />
                    </View>
                    <View style={{ width: '75%' }}>
                      <View style={{ gap: 5, flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={{ zIndex: 10, fontWeight: "600", fontSize: 14, textAlign: "center", color: colors.text }}>{item.product.name}</Text>
                        <Text style={{ zIndex: 10, fontWeight: "600", fontSize: 14, textAlign: "center", color: 'yellow' }}>${(item.product.price * item.quantity).toLocaleString()}</Text>
                      </View>
                      <View style={{ gap: 5, flexDirection: 'row', justifyContent: 'space-between', paddingTop: 3 }}>
                        <Text style={{ color: "grey", zIndex: 10, fontSize: 14, textAlign: "center" }}>{item.product.about}</Text>
                        <Text style={{ color: "grey", zIndex: 10, fontSize: 14, textAlign: "center" }}>x{item.quantity}(${item.product.price.toLocaleString()})</Text>
                      </View>
                    </View>
                  </View>
                }
              />
            </BottomSheetView>
          }
        </BottomSheetScrollView>
      </BottomSheet>
    </View>
  )
}