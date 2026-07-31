/**
 * Purchase Detail — QR + regalo para productos comprados
 *
 * Layout:
 *   ┌──────────────────────────────────────┐
 *   │  ← back    Detalle de compra         │
 *   ├──────────────────────────────────────┤
 *   │  [Imagen producto]                   │
 *   │  Nombre · Descripción · Precio       │
 *   │  Evento · Fecha                      │
 *   │  ┄┄┄┄ perforación ┄┄┄┄┄┄┄┄┄┄┄      │
 *   │       ┌──────────────┐               │
 *   │       │  QR Code     │               │
 *   │       └──────────────┘               │
 *   │  [Enviar como regalo]                │
 *   └──────────────────────────────────────┘
 */

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import BottomSheet, { BottomSheetBackdrop, BottomSheetFlatList, BottomSheetView } from '@gorhom/bottom-sheet'
import { zodResolver } from '@hookform/resolvers/zod'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import { router, useLocalSearchParams } from 'expo-router'
import React, { useCallback, useMemo, useRef } from 'react'
import { Controller, FormProvider, useForm, type SubmitHandler } from 'react-hook-form'
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import QRCode from 'react-native-qrcode-svg'
import { z } from 'zod'

import Loading from '~/components/loading'
import TextInput from '~/components/input'
import { useSession } from '~/context/auth'
import { api } from '~/utils/api'
import { blurhash, dayjs, PLACEHOLDER } from '~/utils/constants'

// ─── Brand palette ─────────────────────────────────────────────────────────────
const C = {
  bg:      '#0d1233',
  card:    '#111827',
  surface: '#1e2a45',
  magenta: '#ff00ff',
  purple:  '#411377',
  amber:   '#f59e0b',
  white:   '#ffffff',
  dim:     'rgba(255,255,255,0.50)',
  border:  'rgba(255,255,255,0.08)',
}

const emailSchema = z.object({
  email: z.string().email({ message: 'Debes ingresar un correo electrónico.' }),
})

// ─── Perforation decoration ─────────────────────────────────────────────────────
function Perforation() {
  return (
    <View style={styles.perfRow}>
      <View style={[styles.perfCircle, { left: -12 }]} />
      <View style={styles.perfLine} />
      <View style={[styles.perfCircle, { right: -12 }]} />
    </View>
  )
}

// ─── Main screen ────────────────────────────────────────────────────────────────
export default function PurchaseDetailPage() {
  const { userPurchaseId } = useLocalSearchParams<{ userPurchaseId: string }>()
  const insets = useSafeAreaInsets()
  const { user } = useSession()
  const utils = api.useUtils()

  // ── Query ────────────────────────────────────────────────────────────────────
  const purchaseQuery = api.mobile.userPurchase.byId.useQuery(
    { userPurchaseId: userPurchaseId! },
    { enabled: !!userPurchaseId },
  )
  const friends = api.mobile.user.friend.useQuery(
    { userId: user?.id ?? '' },
    { enabled: !!user?.id },
  )

  // ── Gift mutation ────────────────────────────────────────────────────────────
  const giftMutation = api.mobile.invite.giftCreate.useMutation({
    onSuccess: () => {
      purchaseQuery.refetch()
      utils.mobile.userPurchase.myPurchases.invalidate()
      Alert.alert('Enviado', 'El producto fue enviado como regalo correctamente.')
      handleClosePress()
    },
    onError: (err) => Alert.alert('Error', err.message),
  })

  // ── Email form ───────────────────────────────────────────────────────────────
  const emailForm = useForm<z.infer<typeof emailSchema>>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: '' },
    mode: 'onBlur',
  })

  const onEmailSubmit: SubmitHandler<z.infer<typeof emailSchema>> = (data) => {
    giftMutation.mutate({
      requesterId: user!.id,
      receiverEmail: data.email,
      userPurchasesIds: [userPurchaseId!],
    })
  }

  // ── BottomSheet ──────────────────────────────────────────────────────────────
  const bottomSheetRef = useRef<BottomSheet>(null)
  const handleExpandPress = useCallback(() => bottomSheetRef.current?.expand(), [])
  const handleClosePress = useCallback(() => bottomSheetRef.current?.close(), [])
  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        pressBehavior="close"
        onPress={handleClosePress}
      />
    ), []
  )
  const contentContainerStyle = useMemo(() => [
    { paddingTop: 12, paddingHorizontal: 20 },
    { paddingBottom: insets.bottom || 6 },
  ], [insets.bottom])

  // ── Loading / error ──────────────────────────────────────────────────────────
  if (purchaseQuery.isLoading) return <Loading />

  const purchase = purchaseQuery.data
  if (!purchase) {
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons name="alert-circle-outline" size={48} color={C.dim} />
          <Text style={styles.errorText}>Compra no encontrada</Text>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>Volver</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    )
  }

  // ── Derived data ─────────────────────────────────────────────────────────────
  const product = purchase.productOnDeposit?.product ?? purchase.deal
  const event = purchase.productOnDeposit?.product?.event ?? purchase.deal?.event
  const productName = product?.name ?? 'Producto'
  const productAbout = product?.about ?? null
  const productImage = product?.image ?? PLACEHOLDER
  const productPrice = product?.price ?? 0
  const eventName = event?.name ?? '—'
  const eventImage = event?.image ?? PLACEHOLDER
  const eventStartsAt = event?.startsAt
  const dateLabel = eventStartsAt
    ? dayjs(eventStartsAt).locale('es').format('ddd D [de] MMMM, HH:mm')
    : '—'

  const isDelivered = purchase.status === 'ACCEPTED'
  const hasPendingGift = (purchase.gifts?.length ?? 0) > 0
  const giftReceiver = purchase.gifts?.[0]?.giftReceiver ?? null
  const canGift = !isDelivered && !hasPendingGift && purchase.ownerId === user?.id

  const qrValue = JSON.stringify({ s: user?.id, p: [purchase.id], sig: purchase.sig })

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {/* ── Hero image ── */}
      <View style={styles.hero}>
        <Image
          source={{ uri: eventImage }}
          placeholder={blurhash}
          cachePolicy="memory-disk"
          contentFit="cover"
          style={StyleSheet.absoluteFill}
        />
        <LinearGradient
          colors={['rgba(13,18,51,0.3)', 'rgba(13,18,51,0.95)']}
          style={StyleSheet.absoluteFill}
        />
        <Pressable style={styles.heroBack} onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={C.white} />
        </Pressable>
        <View style={styles.heroBottom}>
          <Text style={styles.heroTitle}>Detalle de compra</Text>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* ── Product card ── */}
        <View style={styles.productCard}>
          <Image
            source={{ uri: productImage }}
            placeholder={blurhash}
            cachePolicy="memory-disk"
            contentFit="cover"
            style={styles.productImage}
          />

          <View style={styles.productInfo}>
            <Text style={styles.productName}>{productName}</Text>
            {!!productAbout && (
              <Text style={styles.productAbout}>{productAbout}</Text>
            )}
            <Text style={styles.productPrice}>${productPrice.toFixed(2)}</Text>

            <View style={styles.eventRow}>
              <MaterialCommunityIcons name="calendar-outline" size={14} color={C.dim} />
              <Text style={styles.eventLabel}>{eventName}  ·  {dateLabel}</Text>
            </View>

            {/* Status badge */}
            <View style={[styles.statusBadge, isDelivered && styles.statusBadgeDelivered]}>
              <View style={[styles.statusDot, isDelivered && styles.statusDotDelivered]} />
              <Text style={[styles.statusText, isDelivered && styles.statusTextDelivered]}>
                {isDelivered ? 'Entregado' : 'Pendiente'}
              </Text>
            </View>
          </View>

          {/* Gift banner */}
          {hasPendingGift && giftReceiver && (
            <View style={styles.giftBanner}>
              <MaterialCommunityIcons name="gift-outline" size={16} color={C.amber} />
              <Text style={styles.giftBannerText}>
                Enviado a <Text style={{ color: C.white, fontWeight: '700' }}>{giftReceiver.name}</Text>
              </Text>
            </View>
          )}

          <Perforation />

          {/* QR section */}
          <View style={styles.qrSection}>
            <View style={styles.qrGlow} />
            <View style={[styles.qrWrapper, hasPendingGift && { opacity: 0.3 }]}>
              <QRCode
                value={qrValue}
                size={196}
                quietZone={16}
                backgroundColor="#ffffff"
                color="#180a2e"
              />
            </View>
            {hasPendingGift ? (
              <View style={styles.qrDisabledOverlay}>
                <MaterialCommunityIcons name="gift-outline" size={18} color="#7c3aed" />
                <Text style={styles.qrDisabledText}>
                  QR deshabilitado — Producto enviado como regalo
                </Text>
              </View>
            ) : (
              <Text style={styles.qrHint}>
                Presenta este código en el mostrador
              </Text>
            )}
            <Text style={styles.qrId} numberOfLines={1}>
              #{purchase.id.slice(-12).toUpperCase()}
            </Text>
          </View>

          <Perforation />

          {/* Actions */}
          <View style={styles.actionsSection}>
            {canGift && (
              <Pressable
                style={({ pressed }) => [styles.giftBtn, pressed && { opacity: 0.8 }]}
                onPress={handleExpandPress}
              >
                <MaterialCommunityIcons name="gift-outline" size={18} color={C.magenta} />
                <Text style={styles.giftBtnText}>Enviar como regalo</Text>
              </Pressable>
            )}

            {isDelivered && (
              <View style={styles.deliveredNotice}>
                <MaterialCommunityIcons name="check-circle" size={20} color="#4ade80" />
                <Text style={styles.deliveredText}>Este producto ya fue entregado</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* ── BottomSheet — Enviar como regalo ── */}
      <BottomSheet
        ref={bottomSheetRef}
        enableDynamicSizing
        backdropComponent={renderBackdrop}
        enablePanDownToClose
        animateOnMount
        keyboardBehavior="interactive"
        keyboardBlurBehavior="restore"
        handleIndicatorStyle={{ backgroundColor: C.dim }}
        style={{ zIndex: 1000 }}
        backgroundStyle={{ backgroundColor: C.card, borderTopLeftRadius: 20, borderTopRightRadius: 20 }}
        index={-1}
      >
        <BottomSheetView style={contentContainerStyle}>
          <Text style={styles.bsTitle}>Enviar producto como regalo</Text>
          <Text style={styles.bsSub}>Busca el correo de tu amigo o selecciónalo de tu lista</Text>

          <FormProvider {...emailForm}>
            <Controller
              control={emailForm.control}
              name="email"
              render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
                <TextInput
                  bottomSheet={Platform.OS === 'ios'}
                  label="Correo electrónico"
                  placeholder="email@ejemplo.com"
                  keyboardType="email-address"
                  autoComplete="email"
                  onBlur={onBlur}
                  value={value}
                  onChangeText={onChange}
                  errorMessage={error?.message}
                />
              )}
            />

            <BottomSheetFlatList
              data={friends.data}
              keyExtractor={(_, i) => i.toString()}
              ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
              style={{ maxHeight: 200, marginTop: 12 }}
              ListEmptyComponent={() => (
                <Text style={[styles.bsSub, { textAlign: 'center', paddingVertical: 12 }]}>
                  No tenés amigos agregados aún
                </Text>
              )}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.friendRow}
                  onPress={() => emailForm.setValue('email', item.email)}
                >
                  <Image
                    source={{ uri: item.image ?? PLACEHOLDER }}
                    style={styles.friendAvatar}
                    contentFit="cover"
                  />
                  <View>
                    <Text style={styles.friendName}>{item.name}</Text>
                    <Text style={styles.friendEmail}>{item.email}</Text>
                  </View>
                </Pressable>
              )}
            />

            <Pressable
              style={styles.bsBtn}
              onPress={emailForm.handleSubmit(onEmailSubmit)}
            >
              {giftMutation.isPending
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={styles.bsBtnText}>ENVIAR PRODUCTO</Text>
              }
            </Pressable>
          </FormProvider>
          <View style={{ height: 20 }} />
        </BottomSheetView>
      </BottomSheet>
    </SafeAreaView>
  )
}

// ─── Styles ─────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  // ── Hero
  hero: {
    height: 160,
    justifyContent: 'flex-end',
  },
  heroBack: {
    position: 'absolute',
    top: 8,
    left: 12,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBottom: {
    padding: 16,
  },
  heroTitle: {
    color: C.white,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },

  // ── Product card
  productCard: {
    marginHorizontal: 16,
    marginTop: -2,
    backgroundColor: C.card,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,0,255,0.15)',
    shadowColor: C.magenta,
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  productImage: {
    width: '100%',
    height: 200,
  },
  productInfo: {
    padding: 20,
    gap: 6,
  },
  productName: {
    color: C.white,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  productAbout: {
    color: C.dim,
    fontSize: 14,
    lineHeight: 20,
  },
  productPrice: {
    color: C.magenta,
    fontSize: 24,
    fontWeight: '800',
    marginTop: 4,
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  eventLabel: {
    color: C.dim,
    fontSize: 13,
    flex: 1,
  },

  // ── Status badge
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: 'rgba(255,0,255,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,0,255,0.30)',
  },
  statusBadgeDelivered: {
    backgroundColor: 'rgba(0,255,157,0.10)',
    borderColor: 'rgba(0,255,157,0.30)',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: C.magenta,
  },
  statusDotDelivered: {
    backgroundColor: '#4ade80',
  },
  statusText: {
    color: C.magenta,
    fontSize: 12,
    fontWeight: '700',
  },
  statusTextDelivered: {
    color: '#4ade80',
  },

  // ── Gift banner
  giftBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 20,
    marginBottom: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(245,158,11,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.25)',
  },
  giftBannerText: {
    color: C.dim,
    fontSize: 13,
    flex: 1,
  },

  // ── Perforation
  perfRow: {
    height: 24,
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 0,
    overflow: 'hidden',
  },
  perfCircle: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: C.bg,
  },
  perfLine: {
    flex: 1,
    marginHorizontal: 16,
    borderTopWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,255,255,0.10)',
  },

  // ── QR
  qrSection: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 12,
  },
  qrGlow: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 200,
    height: 200,
    marginLeft: -100,
    marginTop: -100,
    borderRadius: 100,
    backgroundColor: 'rgba(255,0,255,0.06)',
  },
  qrWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: C.magenta,
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  qrHint: {
    color: C.dim,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  qrDisabledOverlay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(124,58,237,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(124,58,237,0.25)',
  },
  qrDisabledText: {
    color: '#7c3aed',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  qrId: {
    color: 'rgba(255,255,255,0.25)',
    fontSize: 11,
    fontFamily: 'Montserrat_700Bold',
    letterSpacing: 1.5,
  },

  // ── Actions
  actionsSection: {
    padding: 20,
    gap: 12,
  },
  giftBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(255,0,255,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,0,255,0.30)',
  },
  giftBtnText: {
    color: C.magenta,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  deliveredNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
  },
  deliveredText: {
    color: '#4ade80',
    fontSize: 14,
    fontWeight: '600',
  },

  // ── Error / not found
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  errorText: {
    color: C.dim,
    fontSize: 16,
  },
  backBtn: {
    marginTop: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: C.surface,
  },
  backBtnText: {
    color: C.white,
    fontSize: 14,
    fontWeight: '600',
  },

  // ── BottomSheet
  bsTitle: {
    color: C.white,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  bsSub: {
    color: C.dim,
    fontSize: 13,
    marginBottom: 16,
    lineHeight: 18,
  },
  friendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 10,
    borderRadius: 12,
    backgroundColor: C.surface,
  },
  friendAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: C.card,
  },
  friendName: {
    color: C.white,
    fontSize: 14,
    fontWeight: '600',
  },
  friendEmail: {
    color: C.dim,
    fontSize: 12,
  },
  bsBtn: {
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: C.magenta,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: C.magenta,
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  bsBtnText: {
    color: C.white,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1,
  },
})
