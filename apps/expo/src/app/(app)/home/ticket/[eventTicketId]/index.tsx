/**
 * Ticket Detail — Diseño premium con QR visible
 *
 * Layout:
 *   ┌──────────────────────────────────────┐
 *   │  [Imagen del evento — hero]          │
 *   │  ← back                             │
 *   ├──────────────────────────────────────┤  ← tarjeta con borde dentado
 *   │  Nombre · Venue · Fecha · Hora       │
 *   │  ┄┄┄┄┄┄ perforación ┄┄┄┄┄┄┄┄┄┄┄┄┄  │
 *   │        ┌──────────────┐              │
 *   │        │  QR Code     │              │
 *   │        └──────────────┘              │
 *   │   Apoya la pantalla al escáner       │
 *   ├──────────────────────────────────────┤
 *   │  [Enviar entrada]  [Info]            │
 *   │  [ENTRAR AL EVENTO]                  │
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
  person,          // sender name if received; receiver name if sent
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
        {/* ── Título ── */}
        <View style={giftStyles.titleRow}>
          <Text style={giftStyles.icon}>🎁</Text>
          <Text style={giftStyles.title}>
            {isSentGift ? 'Enviaste este ticket como regalo' : 'Este ticket es un regalo'}
          </Text>
        </View>

        {/* ── Persona del otro lado ── */}
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

        {/* ── Pill de estado ── */}
        <View style={[giftStyles.statusPill, { backgroundColor: statusInfo.bg, borderColor: statusInfo.color + '66' }]}>
          <View style={[giftStyles.statusDot, { backgroundColor: statusInfo.color }]} />
          <Text style={[giftStyles.statusText, { color: statusInfo.color }]}>
            {statusInfo.label}
          </Text>
        </View>

        {/* ── Botón anular (solo para el remitente con regalo PENDING) ── */}
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

// ─── Main ───────────────────────────────────────────────────────────────────────
export default function Page() {
  const { eventTicketId, userTicketId } = useLocalSearchParams<{ eventTicketId: string; userTicketId?: string }>()
  const { colors } = useTheme()
  const { user } = useSession()
  const insets = useSafeAreaInsets()
  const [send, setSend] = useState(false)
  const utils = api.useUtils()

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

  const enter = api.mobile.event.enter.useMutation({
    onSuccess: (res) => {
      utils.mobile.userTicket.list.invalidate()
      utils.mobile.user.profile.invalidate()
      router.replace({ pathname: '/(app)/home/event/[eventId]/live/(tabs)/posts', params: { eventId: res.eventId } })
    },
    onError: (err) => Alert.alert('Error', err.message),
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

  useEffect(() => {
    socket.emit('joinTransaction', { userId: user?.id, userTicketId: ticket.data?.url ?? userTicketId ?? eventTicketId })
    socket.on('response', ({ message, code }: { message: string; code: string }) => {
      console.log('Socket response:', message, code)
    })
    return () => { socket.disconnect() }
  }, [])

  // Fuerza refetch al montar para evitar datos cacheados
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

  const onEmailSubmit: SubmitHandler<z.infer<typeof emailSchema>> = (data) => {
    invite.mutate({ requesterId: user!.id, receiverEmail: data.email, userTicketsIds: [ticket.data!.url!] })
  }

  // QR value — encode ticket URL + user ID
  const qrValue = ticket.data?.url
    ? JSON.stringify({ url: ticket.data.url, u: user?.id })
    : 'loading'

  const eventName = ticket.data?.eventTicket?.event.name ?? '—'
  const venueName = ticket.data?.eventTicket?.locatioName ?? ''
  const startDate = ticket.data?.eventTicket?.event.startsAt
  const dateLabel = startDate
    ? dayjs(startDate).locale('es').format('ddd D [de] MMMM, HH:mm')
    : '—'
  const ticketQty = ticket.data?.quantity ?? 0

  // Gift metadata
  const isGift         = ticket.data?.isGift         ?? false
  const giftStatus     = ticket.data?.giftStatus     ?? null
  const giftId         = ticket.data?.giftId         ?? null
  const isSentGift     = ticket.data?.isSentGift     ?? false
  const isGiftBlocking = ticket.data?.isGiftBlocking ?? false   // PENDING o ACCEPTED
  // Person on the other end: receiver if I sent, sender if I received
  const giftPerson     = isSentGift
    ? (ticket.data?.giftReceiver ?? null)
    : (ticket.data?.giftSender   ?? null)

  // La entrada se puede usar sólo si hay stock Y no está bloqueada por un regalo en curso
  const canEnterRaw = (ticket.data?.quantity ?? 0) > 0
  const canEnter    = canEnterRaw && !isGiftBlocking
  // La opción de enviar también queda deshabilitada mientras hay regalo pendiente
  const canSend     = !isGiftBlocking

  const handleCancelGift = () => {
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

  return (
    <SafeAreaView style={styles.root} edges={['bottom']}>
      <StatusBar style="light" animated backgroundColor="transparent" translucent />

      <ScrollView
        style={{ flex: 1 }}
        overScrollMode="never"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
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

        {/* ════════════════ TICKET CARD ════════════════ */}
        <View style={styles.ticketCard}>

          {/* Ticket header */}
          <View style={styles.ticketHeader}>
            <View>
              <Text style={styles.ticketLabel}>TIPO DE ENTRADA</Text>
              <Text style={styles.ticketType}>
                {ticket.data?.eventTicket?.name ?? 'General'}
              </Text>
            </View>
            <View style={styles.ticketStatusBadge}>
              {isGiftBlocking ? (
                <>
                  <View style={[styles.statusDot, { backgroundColor: '#f59e0b' }]} />
                  <Text style={[styles.ticketStatusText, { color: '#f59e0b' }]}>En regalo</Text>
                </>
              ) : canEnterRaw ? (
                <>
                  <View style={[styles.statusDot, { backgroundColor: '#22c55e' }]} />
                  <Text style={[styles.ticketStatusText, { color: '#22c55e' }]}>Activa</Text>
                </>
              ) : (
                <>
                  <View style={[styles.statusDot, { backgroundColor: '#6b7280' }]} />
                  <Text style={[styles.ticketStatusText, { color: '#6b7280' }]}>Usada</Text>
                </>
              )}
            </View>
          </View>

          {/* ── Perforación ── */}
          <TicketPerforation />

          {/* ── QR Code ── */}
          <View style={styles.qrSection}>
            {/* Halo difuminado detrás del QR */}
            <View style={styles.qrGlow} />
            <View style={styles.qrWrapper}>
              {/*
               * quietZone provee el margen blanco interno (zona silenciosa ISO 18004).
               * Se recomienda al menos 4 módulos; usamos 16 px para garantizar
               * escaneabilidad en modo oscuro del Pixel 6.
               */}
              <QRCode
                value={qrValue}
                size={196}
                quietZone={16}
                backgroundColor="#ffffff"
                color="#180a2e"
              />
            </View>
            <Text style={styles.qrHint}>
              Presenta este código en la entrada del evento
            </Text>
            <Text style={styles.qrId} numberOfLines={1}>
              #{(ticket.data?.url ?? '').slice(-12).toUpperCase()}
            </Text>
          </View>

          {/* ── Perforación inferior ── */}
          <TicketPerforation />

          {/* ── Sección regalo ── */}
          {isGift && (
            <GiftBanner
              status={giftStatus}
              isSentGift={isSentGift}
              person={giftPerson}
              onCancel={handleCancelGift}
              isCancelling={cancelGift.isPending}
            />
          )}

          {/* ── Aviso de bloqueo ── */}
          {isGiftBlocking && (
            <View style={styles.giftBlockNotice}>
              <MaterialCommunityIcons name="information-outline" size={15} color="#f59e0b" />
              <Text style={styles.giftBlockText}>
                Esta entrada no está disponible porque fue enviada como regalo
              </Text>
            </View>
          )}

          {/* ── Info rows ── */}
          <View style={styles.infoRows}>
            <Pressable
              style={[styles.infoRow, isGiftBlocking && styles.infoRowDisabled]}
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
                  Enviar entrada a un amigo
                </Text>
                <Text style={styles.infoRowSub}>
                  {canSend
                    ? 'Transfiere esta entrada antes de activarla'
                    : 'No disponible mientras el regalo esté pendiente'}
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

        {/* ════════════════ ENTER BUTTON ════════════════ */}
        <View style={styles.enterSection}>
          <Pressable
            style={[
              styles.enterBtnPress,
              (!canEnter || isGiftBlocking) && styles.enterBtnDisabled,
            ]}
            disabled={!canEnter || isGiftBlocking || enter.isPending}
            onPress={() => enter.mutate({ userId: user!.id, userTicketId: ticket.data!.url! })}
          >
            {canEnter && !isGiftBlocking ? (
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
            ) : isGiftBlocking ? (
              // Bloqueado porque fue enviado como regalo
              <View style={[styles.enterBtnUsed, { opacity: 0.5 }]}>
                <MaterialCommunityIcons name="gift-outline" size={20} color="#f59e0b" />
                <Text style={[styles.enterBtnText, { color: '#f59e0b' }]}>ENVIADO COMO REGALO</Text>
              </View>
            ) : (
              // Entrada ya escaneada / sin stock
              <View style={styles.enterBtnUsed}>
                <MaterialCommunityIcons name="check-circle-outline" size={20} color="#6b7280" />
                <Text style={[styles.enterBtnText, { color: '#6b7280' }]}>ENTRADA UTILIZADA</Text>
              </View>
            )}
          </Pressable>

          <Text style={styles.enterHint}>
            {isGiftBlocking
              ? 'Anulá el regalo para recuperar el acceso a esta entrada'
              : canEnter
                ? 'El QR se activa automáticamente al presentarlo'
                : 'Esta entrada ya fue escaneada en el ingreso'}
          </Text>
        </View>
      </ScrollView>

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
    // Padding blanco generoso: garantiza zona silenciosa extra ante escaners exigentes
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
    // Glow exterior — sólo visible cuando está activo
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
})

