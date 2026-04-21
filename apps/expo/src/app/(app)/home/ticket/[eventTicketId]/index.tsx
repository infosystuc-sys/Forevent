/**
 * Ticket Detail — Diseño premium con QR visible
 *
 * Layout:
 *   ┌──────────────────────────────────────┐
 *   │  [Imagen del evento — hero]          │
 *   │  ← back                             │
 *   ├──────────────────────────────────────┤
 *   │  [ MI ENTRADA ]  [ PRODUCTOS ]       │  ← tab bar
 *   ├──────────────────────────────────────┤
 *   │  Tab "Mi Entrada":                   │
 *   │    Nombre · Venue · Fecha · Hora     │
 *   │    ┄┄┄┄ perforación ┄┄┄┄┄┄┄┄┄┄┄    │
 *   │         ┌──────────────┐            │
 *   │         │  QR Code     │            │
 *   │         └──────────────┘            │
 *   │    [Enviar entrada]  [Info]         │
 *   │    [ENTRAR AL EVENTO]               │
 *   ├──────────────────────────────────────┤
 *   │  Tab "Productos":                    │
 *   │    🍹 Tragos  🍔 Comidas  🎁 Promos │
 *   │    [producto] [−] qty [+]           │
 *   │  [X ítems · $TOTAL — Confirmar]     │
 *   └──────────────────────────────────────┘
 */

// Polyfill guard — fast-text-encoding ya se importa en index.ts
// pero lo aseguramos aquí también para hot-reload en desarrollo
if (typeof (global as any).TextEncoder === 'undefined') {
  const te = require('fast-text-encoding');
  (global as any).TextEncoder = te.TextEncoder;
  (global as any).TextDecoder = te.TextDecoder;
}

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import BottomSheet, { BottomSheetBackdrop, BottomSheetFlatList, BottomSheetView } from '@gorhom/bottom-sheet';
import { zodResolver } from '@hookform/resolvers/zod';
import { Image, ImageBackground } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { SubmitHandler } from 'react-hook-form';
import { Controller, FormProvider, useForm } from 'react-hook-form';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Platform,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { RefreshControl, ScrollView } from 'react-native-gesture-handler';
import QRCode from 'react-native-qrcode-svg';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { z } from 'zod';
import TextInput from '~/components/input';
import { useSession } from '~/context/auth';
import useTheme from '~/hooks/useTheme';
import { api } from '~/utils/api';
import { PLACEHOLDER, blurhash, dayjs } from '~/utils/constants';
import { socket } from '~/utils/socket';

// ─── Brand palette ──────────────────────────────────────────────────────────────
const C = {
  bg:        '#0d1233',
  card:      '#141e35',
  surface:   '#1e2a45',
  magenta:   '#ff00ff',
  purple:    '#411377',
  white:     '#ffffff',
  dim:       'rgba(255,255,255,0.50)',
  border:    'rgba(255,255,255,0.10)',
  separator: 'rgba(255,255,255,0.08)',
}

const SCREEN_W = Dimensions.get('window').width;
const HERO_H   = 260;

// ─── Schemas ────────────────────────────────────────────────────────────────────
const emailSchema = z.object({
  email: z.string().email({ message: 'Debes ingresar un correo electrónico.' }),
})

// ─── Status Gift labels ─────────────────────────────────────────────────────────
const GIFT_STATUS_LABEL: Record<string, { label: string; color: string; bg: string }> = {
  PENDING:   { label: 'Pendiente de aceptación', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  ACCEPTED:  { label: 'Regalo aceptado',          color: '#4ade80', bg: 'rgba(74,222,128,0.10)' },
  CANCELLED: { label: 'Regalo cancelado',          color: '#9ca3af', bg: 'rgba(156,163,175,0.10)' },
  REJECTED:  { label: 'Regalo rechazado',          color: '#f87171', bg: 'rgba(248,113,113,0.10)' },
}

// ─── Gift Banner ────────────────────────────────────────────────────────────────
function GiftBanner({
  status,
  isSentGift,
  person,
  onCancel,
  isCancelling,
}: {
  status:       string | null
  isSentGift:   boolean
  person:       { id: string; name: string | null; image: string | null } | null
  onCancel?:    () => void
  isCancelling?: boolean
}) {
  const statusInfo = status
    ? (GIFT_STATUS_LABEL[status] ?? GIFT_STATUS_LABEL['PENDING']!)
    : GIFT_STATUS_LABEL['PENDING']!

  const canCancel = isSentGift && (status === 'PENDING')

  return (
    <View style={giftStyles.container}>
      <LinearGradient
        colors={['rgba(255,0,255,0.12)', 'rgba(65,19,119,0.18)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <View style={giftStyles.accentBar} />

      <View style={giftStyles.content}>
        <View style={giftStyles.titleRow}>
          <Text style={giftStyles.icon}>🎁</Text>
          <Text style={giftStyles.title}>
            {isSentGift ? 'Enviaste este ticket como regalo' : 'Este ticket es un regalo'}
          </Text>
        </View>

        {person?.name && (
          <View style={giftStyles.senderRow}>
            {person.image ? (
              <Image
                source={{ uri: person.image }}
                style={giftStyles.senderAvatar}
                contentFit="cover"
              />
            ) : (
              <View style={[giftStyles.senderAvatar, giftStyles.senderAvatarFallback]}>
                <MaterialCommunityIcons name="account" size={13} color={C.dim} />
              </View>
            )}
            <Text style={giftStyles.senderText}>
              {isSentGift ? 'Enviado a: ' : 'Enviado por: '}
              <Text style={giftStyles.senderName}>{person.name}</Text>
            </Text>
          </View>
        )}

        <View style={[giftStyles.statusPill, { backgroundColor: statusInfo.bg, borderColor: statusInfo.color + '66' }]}>
          <View style={[giftStyles.statusDot, { backgroundColor: statusInfo.color }]} />
          <Text style={[giftStyles.statusText, { color: statusInfo.color }]}>
            {statusInfo.label}
          </Text>
        </View>

        {canCancel && (
          <Pressable
            style={giftStyles.cancelBtn}
            onPress={onCancel}
            disabled={isCancelling}
          >
            {isCancelling ? (
              <ActivityIndicator size={12} color={C.magenta} />
            ) : (
              <>
                <MaterialCommunityIcons name="close-circle-outline" size={14} color={C.magenta} />
                <Text style={giftStyles.cancelBtnText}>Anular Envío de Regalo</Text>
              </>
            )}
          </Pressable>
        )}
      </View>
    </View>
  )
}

const giftStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 4,
    marginBottom: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,0,255,0.28)',
    overflow: 'hidden',
  },
  accentBar: {
    width: 4,
    backgroundColor: C.magenta,
  },
  content: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 9,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  icon: {
    fontSize: 20,
  },
  title: {
    color: C.magenta,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.3,
    fontFamily: 'Montserrat_800ExtraBold',
  },
  senderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  senderAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    overflow: 'hidden',
  },
  senderAvatarFallback: {
    backgroundColor: C.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  senderText: {
    color: C.dim,
    fontSize: 12,
    flexShrink: 1,
  },
  senderName: {
    color: C.white,
    fontWeight: '700',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 50,
    paddingHorizontal: 11,
    paddingVertical: 5,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(255,0,255,0.45)',
    borderRadius: 50,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 2,
    backgroundColor: 'rgba(255,0,255,0.06)',
  },
  cancelBtnText: {
    color: C.magenta,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
})

// ─── Dashed separator (simula perforación de ticket) ───────────────────────────
function TicketPerforation() {
  return (
    <View style={styles.perforationRow}>
      <View style={styles.perforationCircleLeft} />
      <View style={styles.perforationDash} />
      <View style={styles.perforationCircleRight} />
    </View>
  )
}

// ─── Tipos y helpers para el carrito ────────────────────────────────────────────
type ProductType = 'PRODUCT' | 'DEAL'

type CartEntry = {
  id: string
  name: string
  price: number
  quantity: number
  type: ProductType
}

type ProductItem = {
  id: string
  name: string
  image: string | null
  price: number | null
  about: string | null
  type: ProductType
}

// ─── ProductSection ──────────────────────────────────────────────────────────────
function ProductSection({
  title,
  items,
  cart,
  onIncrement,
  onDecrement,
}: {
  title: string
  items: ProductItem[]
  cart: Record<string, CartEntry>
  onIncrement: (p: ProductItem) => void
  onDecrement: (id: string) => void
}) {
  return (
    <View style={productStyles.section}>
      <Text style={productStyles.sectionTitle}>{title}</Text>
      {items.map((item) => {
        const qty = cart[item.id]?.quantity ?? 0
        return (
          <View key={item.id} style={productStyles.card}>
            <Image
              source={{ uri: item.image ?? PLACEHOLDER }}
              placeholder={blurhash}
              contentFit="cover"
              cachePolicy="memory-disk"
              style={productStyles.cardImage}
            />
            <View style={productStyles.cardInfo}>
              <Text style={productStyles.cardName} numberOfLines={2}>
                {item.name}
              </Text>
              {!!item.about && (
                <Text style={productStyles.cardAbout} numberOfLines={2}>
                  {item.about}
                </Text>
              )}
              <Text style={productStyles.cardPrice}>
                {item.price != null ? `$${item.price.toFixed(2)}` : '—'}
              </Text>
            </View>
            <View style={productStyles.qtyControl}>
              <Pressable
                style={[productStyles.qtyBtn, qty === 0 && productStyles.qtyBtnDisabled]}
                onPress={() => onDecrement(item.id)}
                disabled={qty === 0}
              >
                <MaterialCommunityIcons
                  name="minus"
                  size={15}
                  color={qty === 0 ? 'rgba(255,255,255,0.18)' : C.white}
                />
              </Pressable>
              <Text style={productStyles.qtyText}>{qty}</Text>
              <Pressable
                style={productStyles.qtyBtn}
                onPress={() => onIncrement(item)}
              >
                <MaterialCommunityIcons name="plus" size={15} color={C.white} />
              </Pressable>
            </View>
          </View>
        )
      })}
    </View>
  )
}

const productStyles = StyleSheet.create({
  section: {
    marginHorizontal: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    color: C.white,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 10,
    marginTop: 4,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.card,
    borderRadius: 14,
    padding: 10,
    marginBottom: 8,
    gap: 12,
    borderWidth: 1,
    borderColor: C.border,
  },
  cardImage: {
    width: 60,
    height: 60,
    borderRadius: 10,
    backgroundColor: C.surface,
  },
  cardInfo: {
    flex: 1,
    gap: 3,
  },
  cardName: {
    color: C.white,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 17,
  },
  cardAbout: {
    color: C.dim,
    fontSize: 11,
    lineHeight: 15,
  },
  cardPrice: {
    color: C.magenta,
    fontSize: 14,
    fontWeight: '800',
    marginTop: 3,
  },
  qtyControl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  qtyBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: C.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnDisabled: {
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  qtyText: {
    color: C.white,
    fontSize: 15,
    fontWeight: '700',
    minWidth: 18,
    textAlign: 'center',
  },
})

// ─── Main ───────────────────────────────────────────────────────────────────────
export default function Page() {
  const { eventTicketId, userTicketId } = useLocalSearchParams<{ eventTicketId: string; userTicketId?: string }>()
  const { colors } = useTheme()
  const { user } = useSession()
  const insets = useSafeAreaInsets()
  const [send, setSend] = useState(false)
  const utils = api.useUtils()

  // ─── Tab state ────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<'ticket' | 'products'>('ticket')

  // ─── Cart state ───────────────────────────────────────────────────────────────
  const [cart, setCart] = useState<Record<string, CartEntry>>({})

  const cartEntries = Object.values(cart).filter((e) => e.quantity > 0)
  const cartCount   = cartEntries.reduce((sum, e) => sum + e.quantity, 0)
  const cartTotal   = cartEntries.reduce((sum, e) => sum + e.price * e.quantity, 0)

  function incrementCart(item: ProductItem) {
    setCart((prev) => ({
      ...prev,
      [item.id]: {
        id:       item.id,
        name:     item.name,
        price:    item.price ?? 0,
        quantity: (prev[item.id]?.quantity ?? 0) + 1,
        type:     item.type,
      },
    }))
  }

  function decrementCart(id: string) {
    setCart((prev) => {
      const current = prev[id]?.quantity ?? 0
      if (current <= 1) {
        const { [id]: _removed, ...rest } = prev
        return rest
      }
      return { ...prev, [id]: { ...prev[id]!, quantity: current - 1 } }
    })
  }

  function handleConfirmOrder() {
    const lines = cartEntries
      .map((e) => `${e.quantity}x ${e.name}  $${(e.price * e.quantity).toFixed(2)}`)
      .join('\n')
    Alert.alert(
      'Resumen del pedido',
      `${lines}\n\nTotal: $${cartTotal.toFixed(2)}`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: () => {
            if (!eventId) {
              Alert.alert('Error', 'No se pudo identificar el evento.')
              return
            }
            purchaseMutation.mutate({
              products: cartEntries.map((e) => ({
                quantity: e.quantity,
                product: { id: e.id, type: e.type },
              })),
              userId: user!.id,
              eventId,
            })
          },
        },
      ]
    )
  }

  // ─── Queries / mutations ──────────────────────────────────────────────────────
  const emailForm = useForm<z.infer<typeof emailSchema>>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: '' },
    mode: 'onBlur',
  })

  const ticket = api.mobile.userTicket.byEventTicket.useQuery({
    eventTicketId,
    userId: user!.id,
    ...(userTicketId && { userTicketId }),
  })
  const friends = api.mobile.user.friend.useQuery({ userId: user!.id })

  const eventId = ticket.data?.eventTicket?.event.id

  const productsQuery = api.mobile.product.onEvent.useQuery(
    { eventId: eventId! },
    { enabled: !!eventId && activeTab === 'products' },
  )

  const enter = api.mobile.event.enter.useMutation({
    onSuccess: (res) => {
      utils.mobile.userTicket.list.invalidate()
      utils.mobile.user.profile.invalidate()
      router.replace({ pathname: '/(app)/home/event/[eventId]/live/(tabs)/posts', params: { eventId: res.eventId } })
    },
    onError: (err) => Alert.alert('Error', err.message),
  })

  const purchaseMutation = api.mobile.purchase.products.useMutation({
    onSuccess: () => {
      setCart({})
      utils.mobile.userPurchase.myPurchases.invalidate()
      Alert.alert(
        '¡Pedido confirmado!',
        'Tu pedido fue registrado exitosamente. Presentá el QR en el mostrador.',
        [{ text: 'Entendido' }],
      )
    },
    onError: (err) => Alert.alert('Error en el pedido', err.message),
  })

  const invite = api.mobile.invite.giftCreate.useMutation({
    onSuccess: () => {
      router.back()
      Alert.alert('Éxito', 'Se mandó el regalo correctamente')
      utils.mobile.userTicket.list.invalidate()
      utils.mobile.userTicket.byEventTicket.invalidate()
    },
    onError: (error) => Alert.alert('Error', error.message),
  })

  const cancelGift = api.mobile.invite.giftCancel.useMutation({
    onSuccess: () => {
      Alert.alert('Listo', 'El envío de regalo fue anulado. La entrada vuelve a estar activa.')
      ticket.refetch()
      utils.mobile.userTicket.list.invalidate()
    },
    onError: (error) => Alert.alert('Error al anular', error.message),
  })

  // ─── Derived ticket data ───────────────────────────────────────────────────
  const ticketsList = (ticket.data?.tickets ?? []) as Array<{
    userTicketId: string
    url: string
    isGift: boolean
    giftStatus: string | null
    giftId: string | null
    isSentGift: boolean
    isGiftBlocking: boolean
    giftSender: { id: string; name: string | null; image: string | null } | null
    giftReceiver: { id: string; name: string | null; image: string | null } | null
  }>

  const firstAvailableTicket = ticketsList.find((t) => !t.isGiftBlocking) ?? null
  const availableCount = ticket.data?.availableCount ?? 0

  useEffect(() => {
    const socketTicketId = firstAvailableTicket?.url ?? ticketsList[0]?.url ?? userTicketId ?? eventTicketId
    socket.emit('joinTransaction', { userId: user?.id, userTicketId: socketTicketId })
    socket.on('response', ({ message, code }: { message: string; code: string }) => {
      console.log('Socket response:', message, code)
    })
    return () => { socket.disconnect() }
  }, [])

  useEffect(() => {
    ticket.refetch()
  }, [eventTicketId])

  // ─── BottomSheet (enviar entrada) ───────────────────────────────────────────
  const { bottom: safeBottomArea } = useSafeAreaInsets()
  const snapPoints = useMemo(() => ['60%'], [])
  const bottomSheetRef = useRef<BottomSheet>(null)

  const handleExpandPress = useCallback(() => bottomSheetRef.current?.expand(), [])
  const handleClosePress  = useCallback(() => bottomSheetRef.current?.close(), [])

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
    { paddingBottom: safeBottomArea || 6 },
  ], [safeBottomArea])

  // ─── Gift flow: qué ticket regalar ────────────────────────────────────────
  const [selectedGiftTicketId, setSelectedGiftTicketId] = useState<string | null>(null)

  // Inicializa/sincroniza con el primer ticket disponible cuando cambia la lista
  useEffect(() => {
    if (!firstAvailableTicket) return
    if (!selectedGiftTicketId || !ticketsList.some((t) => t.url === selectedGiftTicketId && !t.isGiftBlocking)) {
      setSelectedGiftTicketId(firstAvailableTicket.url)
    }
  }, [ticketsList.map((t) => t.url).join('|'), firstAvailableTicket?.url])

  const onEmailSubmit: SubmitHandler<z.infer<typeof emailSchema>> = (data) => {
    if (!selectedGiftTicketId) {
      Alert.alert('Error', 'No hay entradas disponibles para regalar.')
      return
    }
    invite.mutate({ requesterId: user!.id, receiverEmail: data.email, userTicketsIds: [selectedGiftTicketId] })
  }

  const eventName = ticket.data?.eventTicket?.event.name ?? '—'
  const venueName = ticket.data?.eventTicket?.locatioName ?? ''
  const startDate = ticket.data?.eventTicket?.event.startsAt
  const dateLabel = startDate
    ? dayjs(startDate).locale('es').format('ddd D [de] MMMM, HH:mm')
    : '—'
  const ticketQty = ticket.data?.quantity ?? 0

  const canEnter = availableCount > 0
  const canSend  = ticketsList.some((t) => !t.isGiftBlocking)
  const allBlocked = ticketsList.length > 0 && availableCount === 0

  const handleCancelGift = (giftId: string | null) => {
    if (!giftId) return
    Alert.alert(
      'Anular envío',
      '¿Estás seguro de que querés anular el envío? La entrada volverá a quedar activa para vos.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sí, anular',
          style: 'destructive',
          onPress: () => cancelGift.mutate({ giftId, requesterId: user!.id }),
        },
      ]
    )
  }

  // ─── Products data helpers ────────────────────────────────────────────────────
  const drinks = (productsQuery.data?.drinks ?? []).map((p) => ({ ...p, type: 'PRODUCT' as const })) as ProductItem[]
  const foods  = (productsQuery.data?.foods  ?? []).map((p) => ({ ...p, type: 'PRODUCT' as const })) as ProductItem[]
  const deals  = (productsQuery.data?.deals  ?? []).map((p) => ({ ...p, type: 'DEAL' as const })) as ProductItem[]
  const hasProducts = drinks.length > 0 || foods.length > 0 || deals.length > 0

  return (
    <SafeAreaView style={styles.root} edges={['bottom']}>
      <StatusBar style="light" animated backgroundColor="transparent" translucent />

      <ScrollView
        style={{ flex: 1 }}
        overScrollMode="never"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: activeTab === 'products' && cartCount > 0 ? 100 : 24 }}
      >
        {/* ════════════════ HERO IMAGE ════════════════ */}
        <View style={[styles.hero, { height: HERO_H }]}>
          <Image
            source={{ uri: ticket.data?.eventTicket?.event.image ?? PLACEHOLDER }}
            placeholder={blurhash}
            cachePolicy="memory-disk"
            style={StyleSheet.absoluteFill}
            contentFit="cover"
          />
          <LinearGradient
            colors={['rgba(0,0,0,0.10)', 'rgba(0,0,0,0.55)', C.bg]}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            pointerEvents="none"
          />

          {/* Nav */}
          <View style={[styles.heroNav, { paddingTop: insets.top + 6 }]}>
            <Pressable style={styles.navBtn} onPress={() => router.back()}>
              <MaterialCommunityIcons name="arrow-left" size={22} color={C.white} />
            </Pressable>
            <Pressable style={styles.navBtn} onPress={() => Share.share({ message: `¡Voy a ${eventName}!` })}>
              <MaterialCommunityIcons name="export-variant" size={20} color={C.white} />
            </Pressable>
          </View>

          {/* Event info overlay */}
          <View style={styles.heroBottom}>
            <View style={styles.heroEventBadge}>
              <MaterialCommunityIcons name="ticket-confirmation-outline" size={13} color={C.magenta} />
              <Text style={styles.heroEventBadgeText}>MI ENTRADA</Text>
              {ticketQty > 1 && <Text style={styles.heroQtyBadge}>x{ticketQty}</Text>}
            </View>
            <Text style={styles.heroTitle} numberOfLines={2}>{eventName}</Text>
            <View style={styles.heroMetaRow}>
              <MaterialCommunityIcons name="map-marker-outline" size={13} color={C.dim} />
              <Text style={styles.heroMeta} numberOfLines={1}>{venueName}</Text>
            </View>
            <View style={styles.heroMetaRow}>
              <MaterialCommunityIcons name="calendar-outline" size={13} color={C.dim} />
              <Text style={styles.heroMeta}>{dateLabel}</Text>
            </View>
          </View>
        </View>

        {/* ════════════════ TAB BAR ════════════════ */}
        <View style={styles.tabBar}>
          <Pressable
            style={[styles.tabBtn, activeTab === 'ticket' && styles.tabBtnActive]}
            onPress={() => setActiveTab('ticket')}
          >
            <MaterialCommunityIcons
              name="ticket-confirmation-outline"
              size={14}
              color={activeTab === 'ticket' ? C.white : C.dim}
            />
            <Text style={[styles.tabBtnText, activeTab === 'ticket' && styles.tabBtnTextActive]}>
              MI ENTRADA
            </Text>
          </Pressable>
          <Pressable
            style={[styles.tabBtn, activeTab === 'products' && styles.tabBtnActive]}
            onPress={() => setActiveTab('products')}
          >
            <MaterialCommunityIcons
              name="food-fork-drink"
              size={14}
              color={activeTab === 'products' ? C.white : C.dim}
            />
            <Text style={[styles.tabBtnText, activeTab === 'products' && styles.tabBtnTextActive]}>
              PRODUCTOS
            </Text>
          </Pressable>
        </View>

        {/* ════════════════ TAB: MI ENTRADA ════════════════ */}
        {activeTab === 'ticket' && (
          <>
            {/* ── Ticket card ── */}
            <View style={styles.ticketCard}>
              <View style={styles.ticketHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.ticketLabel}>TIPO DE ENTRADA</Text>
                  <Text style={styles.ticketType}>
                    {ticket.data?.eventTicket?.name ?? 'General'}
                  </Text>
                </View>
                {ticketQty > 0 && (
                  <View style={styles.ticketCountBadge}>
                    <MaterialCommunityIcons name="ticket-confirmation-outline" size={13} color={C.magenta} />
                    <Text style={styles.ticketCountText}>
                      {ticketQty > 1 ? `×${ticketQty}` : '1'}
                    </Text>
                  </View>
                )}
              </View>

              {ticketsList.map((t, i) => {
                const qrValue = JSON.stringify({ url: t.url, u: user?.id })
                const isBlocked = t.isGiftBlocking
                const statusColor = isBlocked ? '#f59e0b' : '#22c55e'
                const statusLabel = isBlocked ? 'En regalo' : 'Activa'
                const giftPerson = t.isSentGift ? t.giftReceiver : t.giftSender
                return (
                  <View key={t.url}>
                    <TicketPerforation />

                    <View style={styles.qrSlotHeader}>
                      <Text style={styles.qrSlotTitle}>
                        Entrada {i + 1} de {ticketsList.length}
                      </Text>
                      <View style={styles.ticketStatusBadge}>
                        <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                        <Text style={[styles.ticketStatusText, { color: statusColor }]}>{statusLabel}</Text>
                      </View>
                    </View>

                    <View style={styles.qrSection}>
                      <View style={styles.qrGlow} />
                      <View style={[styles.qrWrapper, isBlocked && { opacity: 0.35 }]}>
                        <QRCode
                          value={qrValue}
                          size={196}
                          quietZone={16}
                          backgroundColor="#ffffff"
                          color="#180a2e"
                        />
                      </View>
                      <Text style={styles.qrHint}>
                        {isBlocked
                          ? 'Entrada no disponible — está en regalo'
                          : 'Presenta este código en la entrada del evento'}
                      </Text>
                      <Text style={styles.qrId} numberOfLines={1}>
                        #{t.url.slice(-12).toUpperCase()}
                      </Text>
                    </View>

                    {t.isGift && (
                      <GiftBanner
                        status={t.giftStatus}
                        isSentGift={t.isSentGift}
                        person={giftPerson}
                        onCancel={() => handleCancelGift(t.giftId)}
                        isCancelling={cancelGift.isPending}
                      />
                    )}
                  </View>
                )
              })}

              <TicketPerforation />

              {allBlocked && (
                <View style={styles.giftBlockNotice}>
                  <MaterialCommunityIcons name="information-outline" size={15} color="#f59e0b" />
                  <Text style={styles.giftBlockText}>
                    Todas las entradas están en proceso de regalo
                  </Text>
                </View>
              )}

              <View style={styles.infoRows}>
                <Pressable
                  style={[styles.infoRow, !canSend && styles.infoRowDisabled]}
                  onPress={() => {
                    if (!canSend) return
                    setSend(true)
                    handleExpandPress()
                  }}
                  disabled={!canSend}
                >
                  <MaterialCommunityIcons
                    name="send-outline"
                    size={18}
                    color={canSend ? C.magenta : C.dim}
                  />
                  <View style={styles.infoRowText}>
                    <Text style={[styles.infoRowTitle, !canSend && { color: C.dim }]}>
                      {ticketsList.length > 1 ? 'Regalar una entrada a un amigo' : 'Enviar entrada a un amigo'}
                    </Text>
                    <Text style={styles.infoRowSub}>
                      {canSend
                        ? ticketsList.length > 1
                          ? 'Elegí cuál de tus entradas regalar'
                          : 'Transfiere esta entrada antes de activarla'
                        : 'No hay entradas disponibles para regalar'}
                    </Text>
                  </View>
                  {canSend && <MaterialCommunityIcons name="chevron-right" size={18} color={C.dim} />}
                </Pressable>

                <View style={styles.infoRowDivider} />

                <View style={styles.infoRow}>
                  <MaterialCommunityIcons name="clock-outline" size={18} color={C.dim} />
                  <View style={styles.infoRowText}>
                    <Text style={styles.infoRowTitle}>
                      Las puertas abren a las {startDate ? dayjs(startDate).format('HH:mm') : '—'}
                    </Text>
                    <Text style={styles.infoRowSub}>Llega con tiempo</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* ── Enter button ── */}
            <View style={styles.enterSection}>
              <Pressable
                style={[
                  styles.enterBtnPress,
                  !canEnter && styles.enterBtnDisabled,
                ]}
                disabled={!canEnter || enter.isPending}
                onPress={() => {
                  if (!firstAvailableTicket) return
                  enter.mutate({ userId: user!.id, userTicketId: firstAvailableTicket.url })
                }}
              >
                {canEnter ? (
                  <LinearGradient
                    colors={['#ff00ff', '#8b00ff', '#411377']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.enterBtnGradient}
                  >
                    {enter.isPending ? (
                      <ActivityIndicator size={20} color="#fff" />
                    ) : (
                      <>
                        <MaterialCommunityIcons name="door-open" size={22} color="#fff" />
                        <Text style={styles.enterBtnText}>ENTRAR AL EVENTO</Text>
                      </>
                    )}
                  </LinearGradient>
                ) : allBlocked ? (
                  <View style={[styles.enterBtnUsed, { opacity: 0.5 }]}>
                    <MaterialCommunityIcons name="gift-outline" size={20} color="#f59e0b" />
                    <Text style={[styles.enterBtnText, { color: '#f59e0b' }]}>TODAS EN REGALO</Text>
                  </View>
                ) : (
                  <View style={styles.enterBtnUsed}>
                    <MaterialCommunityIcons name="check-circle-outline" size={20} color="#6b7280" />
                    <Text style={[styles.enterBtnText, { color: '#6b7280' }]}>ENTRADA UTILIZADA</Text>
                  </View>
                )}
              </Pressable>

              <Text style={styles.enterHint}>
                {allBlocked
                  ? 'Anulá algún regalo para recuperar el acceso'
                  : canEnter
                    ? ticketsList.length > 1
                      ? `Ingresa con la primera entrada disponible (quedan ${availableCount - 1} más)`
                      : 'El QR se activa automáticamente al presentarlo'
                    : 'Esta entrada ya fue escaneada en el ingreso'}
              </Text>
            </View>
          </>
        )}

        {/* ════════════════ TAB: PRODUCTOS ════════════════ */}
        {activeTab === 'products' && (
          <View style={styles.productsContainer}>
            {productsQuery.isLoading && (
              <View style={styles.productsLoading}>
                <ActivityIndicator color={C.magenta} size="large" />
                <Text style={styles.productsLoadingText}>Cargando productos...</Text>
              </View>
            )}

            {!productsQuery.isLoading && !hasProducts && (
              <View style={styles.emptyProducts}>
                <MaterialCommunityIcons name="food-off-outline" size={52} color={C.dim} />
                <Text style={styles.emptyProductsTitle}>Sin productos disponibles</Text>
                <Text style={styles.emptyProductsSub}>
                  Este evento no tiene productos disponibles por el momento.
                </Text>
              </View>
            )}

            {!productsQuery.isLoading && hasProducts && (
              <>
                {drinks.length > 0 && (
                  <ProductSection
                    title="🍹  Tragos"
                    items={drinks}
                    cart={cart}
                    onIncrement={incrementCart}
                    onDecrement={decrementCart}
                  />
                )}
                {foods.length > 0 && (
                  <ProductSection
                    title="🍔  Comidas"
                    items={foods}
                    cart={cart}
                    onIncrement={incrementCart}
                    onDecrement={decrementCart}
                  />
                )}
                {deals.length > 0 && (
                  <ProductSection
                    title="🎁  Promociones"
                    items={deals}
                    cart={cart}
                    onIncrement={incrementCart}
                    onDecrement={decrementCart}
                  />
                )}
              </>
            )}
          </View>
        )}
      </ScrollView>

      {/* ════════════════ CART FOOTER ════════════════ */}
      {activeTab === 'products' && cartCount > 0 && (
        <View style={styles.cartFooter}>
          <View style={styles.cartFooterInfo}>
            <Text style={styles.cartFooterCount}>
              {cartCount} {cartCount === 1 ? 'ítem' : 'ítems'}
            </Text>
            <Text style={styles.cartFooterTotal}>${cartTotal.toFixed(2)}</Text>
          </View>
          <Pressable
            style={({ pressed }) => [
              styles.cartFooterBtn,
              pressed && { opacity: 0.8 },
              purchaseMutation.isPending && { opacity: 0.6 },
            ]}
            onPress={handleConfirmOrder}
            disabled={purchaseMutation.isPending}
          >
            {purchaseMutation.isPending ? (
              <ActivityIndicator size={18} color={C.white} />
            ) : (
              <MaterialCommunityIcons name="check-circle-outline" size={18} color={C.white} />
            )}
            <Text style={styles.cartFooterBtnText}>Confirmar pedido</Text>
          </Pressable>
        </View>
      )}

      {/* ════════════════ BOTTOM SHEET — Enviar entrada ════════════════ */}
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
          <Text style={styles.bsTitle}>Enviar entrada</Text>
          <Text style={styles.bsSub}>Busca el correo de tu amigo o selecciónalo de tu lista</Text>

          {ticketsList.length > 1 && (
            <View style={styles.giftPickerWrap}>
              <Text style={styles.giftPickerLabel}>¿Cuál entrada querés regalar?</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.giftPickerRow}
              >
                {ticketsList.map((t, i) => {
                  const disabled = t.isGiftBlocking
                  const selected = selectedGiftTicketId === t.url
                  return (
                    <Pressable
                      key={t.url}
                      style={[
                        styles.giftPickerChip,
                        selected && styles.giftPickerChipSelected,
                        disabled && styles.giftPickerChipDisabled,
                      ]}
                      onPress={() => !disabled && setSelectedGiftTicketId(t.url)}
                      disabled={disabled}
                    >
                      <MaterialCommunityIcons
                        name={disabled ? 'gift-outline' : selected ? 'ticket-confirmation' : 'ticket-confirmation-outline'}
                        size={14}
                        color={disabled ? '#f59e0b' : selected ? C.white : C.dim}
                      />
                      <Text style={[
                        styles.giftPickerChipText,
                        selected && { color: C.white },
                        disabled && { color: '#f59e0b' },
                      ]}>
                        Entrada {i + 1}
                      </Text>
                      <Text style={[
                        styles.giftPickerChipId,
                        selected && { color: 'rgba(255,255,255,0.75)' },
                      ]}>
                        #{t.url.slice(-6).toUpperCase()}
                      </Text>
                    </Pressable>
                  )
                })}
              </ScrollView>
            </View>
          )}

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
              keyExtractor={(item, i) => i.toString()}
              ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
              style={{ maxHeight: 200, marginTop: 12 }}
              refreshControl={
                <RefreshControl
                  tintColor={C.magenta}
                  progressBackgroundColor={C.card}
                  refreshing={friends.isFetching}
                  onRefresh={() => friends.refetch()}
                />
              }
              ListEmptyComponent={() => (
                <Text style={[styles.infoRowSub, { textAlign: 'center', paddingVertical: 12 }]}>
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
              {invite.isPending
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={styles.bsBtnText}>ENVIAR ENTRADA</Text>
              }
            </Pressable>
          </FormProvider>
          <View style={{ height: 20 }} />
        </BottomSheetView>
      </BottomSheet>
    </SafeAreaView>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  // ── Hero
  hero: { width: '100%', justifyContent: 'space-between' },
  heroNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    zIndex: 10,
  },
  navBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center', justifyContent: 'center',
  },
  heroBottom: { paddingHorizontal: 18, paddingBottom: 20, gap: 6, zIndex: 10 },
  heroEventBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(255,0,255,0.12)',
    alignSelf: 'flex-start',
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 50, borderWidth: 1, borderColor: 'rgba(255,0,255,0.30)',
  },
  heroEventBadgeText: { color: C.magenta, fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  heroQtyBadge: {
    backgroundColor: C.magenta, color: '#fff',
    fontSize: 9, fontWeight: '900',
    paddingHorizontal: 5, paddingVertical: 1, borderRadius: 50,
  },
  heroTitle: { color: C.white, fontSize: 22, fontWeight: '800', lineHeight: 28 },
  heroMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  heroMeta: { color: C.dim, fontSize: 12 },

  // ── Tab bar
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 12,
    backgroundColor: C.card,
    borderRadius: 14,
    padding: 4,
    gap: 4,
    borderWidth: 1,
    borderColor: C.border,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 6,
    borderRadius: 11,
  },
  tabBtnActive: {
    backgroundColor: C.magenta,
  },
  tabBtnText: {
    color: C.dim,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  tabBtnTextActive: {
    color: C.white,
  },

  // ── Ticket card
  ticketCard: {
    marginHorizontal: 16,
    marginTop: -2,
    backgroundColor: C.card,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: C.border,
  },
  ticketHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 18, paddingBottom: 14,
  },
  ticketLabel: { color: C.dim, fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  ticketType: { color: C.white, fontSize: 16, fontWeight: '700', marginTop: 2 },
  ticketStatusBadge: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  ticketStatusText: { fontSize: 12, fontWeight: '600' },

  // ── Perforation
  perforationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: -1,
  },
  perforationCircleLeft: {
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: C.bg,
    marginLeft: -10,
  },
  perforationDash: {
    flex: 1,
    borderBottomWidth: 1.5,
    borderColor: C.border,
    borderStyle: 'dashed',
    marginHorizontal: 4,
  },
  perforationCircleRight: {
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: C.bg,
    marginRight: -10,
  },

  // ── QR section
  qrSection: {
    alignItems: 'center',
    paddingTop: 28,
    paddingBottom: 24,
    paddingHorizontal: 20,
    gap: 14,
  },
  qrGlow: {
    position: 'absolute',
    top: 20,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(255,0,255,0.07)',
  },
  qrWrapper: {
    padding: 20,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    shadowColor: '#ffffff',
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 10,
  },
  qrHint: {
    color: C.dim,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  qrId: {
    color: 'rgba(255,255,255,0.25)',
    fontSize: 10,
    letterSpacing: 2.5,
    fontWeight: '700',
  },

  // ── Gift block notice
  giftBlockNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 11,
    backgroundColor: 'rgba(245,158,11,0.08)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.25)',
  },
  giftBlockText: {
    flex: 1,
    color: '#f59e0b',
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '500',
  },

  // ── Info rows
  infoRows: { paddingHorizontal: 16, paddingBottom: 16 },
  infoRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 14, gap: 12,
  },
  infoRowDisabled: { opacity: 0.45 },
  infoRowDivider: { height: StyleSheet.hairlineWidth, backgroundColor: C.separator },
  infoRowText: { flex: 1, gap: 2 },
  infoRowTitle: { color: C.white, fontSize: 13, fontWeight: '600' },
  infoRowSub: { color: C.dim, fontSize: 11 },

  // ── Enter button
  enterSection: { marginHorizontal: 16, marginTop: 24, marginBottom: 8, gap: 12 },
  enterBtnPress: {
    borderRadius: 50,
    overflow: 'hidden',
    shadowColor: C.magenta,
    shadowOpacity: 0.55,
    shadowRadius: 18,
    elevation: 10,
  },
  enterBtnDisabled: {
    shadowOpacity: 0,
    elevation: 0,
  },
  enterBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 50,
    paddingVertical: 17,
    gap: 10,
  },
  enterBtnUsed: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1f2937',
    borderRadius: 50,
    paddingVertical: 17,
    gap: 10,
  },
  enterBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 1.5,
    fontFamily: 'Montserrat_800ExtraBold',
  },
  enterHint: { color: C.dim, fontSize: 12, textAlign: 'center', lineHeight: 18 },

  // ── Products tab
  productsContainer: {
    paddingTop: 4,
    minHeight: 200,
  },
  productsLoading: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  productsLoadingText: {
    color: C.dim,
    fontSize: 13,
  },
  emptyProducts: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
    gap: 12,
  },
  emptyProductsTitle: {
    color: C.white,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptyProductsSub: {
    color: C.dim,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
  },

  // ── Cart footer
  cartFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: C.surface,
    borderTopWidth: 1,
    borderTopColor: C.border,
    gap: 12,
  },
  cartFooterInfo: {
    flex: 1,
    gap: 1,
  },
  cartFooterCount: {
    color: C.dim,
    fontSize: 11,
    fontWeight: '600',
  },
  cartFooterTotal: {
    color: C.white,
    fontSize: 22,
    fontWeight: '800',
  },
  cartFooterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: C.magenta,
    borderRadius: 14,
    paddingVertical: 13,
    paddingHorizontal: 18,
    shadowColor: C.magenta,
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 6,
  },
  cartFooterBtnText: {
    color: C.white,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  // ── Bottom Sheet
  bsTitle: { color: C.white, fontSize: 22, fontWeight: '700', marginBottom: 4 },
  bsSub: { color: C.dim, fontSize: 13, marginBottom: 16 },
  friendRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  friendAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.surface },
  friendName: { color: C.white, fontSize: 14, fontWeight: '600' },
  friendEmail: { color: C.dim, fontSize: 11 },
  bsBtn: {
    marginTop: 16,
    backgroundColor: C.magenta,
    borderRadius: 50, paddingVertical: 14,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: C.magenta, shadowOpacity: 0.4, shadowRadius: 10, elevation: 6,
  },
  bsBtnText: { color: '#fff', fontSize: 14, fontWeight: '800', letterSpacing: 0.5 },

  // ── Ticket count badge (en el header del card)
  ticketCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,0,255,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,0,255,0.30)',
    borderRadius: 50,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  ticketCountText: {
    color: C.magenta,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  // ── Per-QR slot header (Entrada N de M + status)
  qrSlotHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 2,
  },
  qrSlotTitle: {
    color: C.dim,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },

  // ── Gift picker (en bottom sheet)
  giftPickerWrap: {
    marginBottom: 10,
  },
  giftPickerLabel: {
    color: C.dim,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.4,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  giftPickerRow: {
    gap: 8,
    paddingRight: 8,
  },
  giftPickerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.surface,
  },
  giftPickerChipSelected: {
    backgroundColor: C.magenta,
    borderColor: C.magenta,
  },
  giftPickerChipDisabled: {
    opacity: 0.55,
    borderColor: 'rgba(245,158,11,0.35)',
    backgroundColor: 'rgba(245,158,11,0.08)',
  },
  giftPickerChipText: {
    color: C.white,
    fontSize: 12,
    fontWeight: '700',
  },
  giftPickerChipId: {
    color: C.dim,
    fontSize: 10,
    letterSpacing: 1,
    fontWeight: '700',
  },
})
