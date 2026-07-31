/**
 * Mis Entradas — Tab screen
 *
 * Layout:
 *   ┌──────────────────────────────────────┐
 *   │  Header: "MIS ENTRADAS"              │
 *   ├──────────────────────────────────────┤
 *   │  [ ENTRADAS ]  [ PRODUCTOS ]         │  ← pill tab bar
 *   ├──────────────────────────────────────┤
 *   │  Tab "Entradas":                     │
 *   │    [carousel horizontal, snap]       │
 *   │    card: imagen · nombre · badge qty │
 *   │    ● ○ ○  (pager dots)              │
 *   │    ── Regalos en Curso ────────      │
 *   │    [compact amber card x N]          │
 *   ├──────────────────────────────────────┤
 *   │  Tab "Productos":                    │
 *   │    [purchase card list]              │
 *   │    producto · precio · evento · badge│
 *   └──────────────────────────────────────┘
 */

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import { router } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import React, { useState } from 'react'
import {
  Dimensions,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import ErrorBanner from '~/components/ErrorBanner'
import Loading from '~/components/loading'
import { TicketItemCard, type TicketItem } from '~/components/TicketItemCard'
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

const { width: SCREEN_W } = Dimensions.get('window')
const CARD_W   = SCREEN_W - 32   // 16px padding each side
const CARD_GAP = 12
const SNAP_INT = CARD_W + CARD_GAP

// ─── Sent-gift card (compact) ──────────────────────────────────────────────────
function SentGiftCard({
  item,
  onPress,
}: {
  item: {
    userTicketId: string
    giftId: string | null
    giftStatus: string | null
    giftReceiver: { id: string; name: string | null; image: string | null } | null
    eventTicket: {
      id: string
      name: string
      locatioName: string
      event: { name: string; image: string; startsAt: Date; endsAt: Date }
    }
  }
  onPress: () => void
}) {
  const dateLabel = item.eventTicket.event.startsAt
    ? dayjs(item.eventTicket.event.startsAt).locale('es').format('D MMM · HH:mm')
    : '—'

  return (
    <Pressable style={styles.giftCard} onPress={onPress}>
      {/* Thumbnail */}
      <View style={styles.giftThumb}>
        <Image
          source={{ uri: item.eventTicket.event.image }}
          placeholder={blurhash}
          cachePolicy="memory-disk"
          contentFit="cover"
          style={StyleSheet.absoluteFill}
        />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.6)']}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        <MaterialCommunityIcons
          name="gift-outline"
          size={22}
          color={C.amber}
          style={{ position: 'absolute', bottom: 8, left: 8 }}
        />
      </View>

      {/* Info */}
      <View style={styles.giftInfo}>
        <Text style={styles.giftEventName} numberOfLines={1}>
          {item.eventTicket.event.name}
        </Text>
        <Text style={styles.giftMeta} numberOfLines={1}>
          {item.eventTicket.name}  ·  {dateLabel}
        </Text>
        {item.giftReceiver?.name && (
          <View style={styles.giftReceiverRow}>
            {item.giftReceiver.image ? (
              <Image
                source={{ uri: item.giftReceiver.image }}
                style={styles.giftAvatar}
                contentFit="cover"
              />
            ) : (
              <View style={[styles.giftAvatar, styles.giftAvatarFallback]}>
                <MaterialCommunityIcons name="account" size={10} color={C.dim} />
              </View>
            )}
            <Text style={styles.giftReceiverText}>
              Enviado a <Text style={{ color: C.white, fontWeight: '700' }}>{item.giftReceiver.name}</Text>
            </Text>
          </View>
        )}
      </View>

      {/* Status pill */}
      <View style={styles.giftStatusPill}>
        <View style={styles.giftStatusDot} />
        <Text style={styles.giftStatusText}>Pendiente</Text>
      </View>
    </Pressable>
  )
}

// ─── Pager dots ────────────────────────────────────────────────────────────────
function PagerDots({ total, active }: { total: number; active: number }) {
  if (total <= 1) return null
  return (
    <View style={styles.dotsRow}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            i === active
              ? styles.dotActive
              : styles.dotInactive,
          ]}
        />
      ))}
    </View>
  )
}

// ─── Section header ────────────────────────────────────────────────────────────
function SectionHeader({ title, count, accent }: { title: string; count: number; accent?: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {count > 0 && (
        <View style={[styles.sectionCount, { borderColor: accent ?? C.magenta }]}>
          <Text style={[styles.sectionCountText, { color: accent ?? C.magenta }]}>
            {count}
          </Text>
        </View>
      )}
    </View>
  )
}

// ─── Purchase product card ─────────────────────────────────────────────────────
function PurchaseProductCard({
  product,
  eventName,
  eventStartsAt,
}: {
  product: {
    userPurchaseIds: string[]
    productId: string
    name: string
    about: string | null
    image: string | null
    price: number
    quantity: number
    status: string
  }
  eventName: string
  eventStartsAt: Date
}) {
  const isDelivered = product.status === 'ACCEPTED'
  const dateLabel = dayjs(eventStartsAt).locale('es').format('D MMM')

  return (
    <Pressable
      style={styles.purchaseCard}
      onPress={() => {
        if (product.userPurchaseIds.length === 1) {
          router.push({
            pathname: '/(app)/home/ticket/purchase/[userPurchaseId]/',
            params: { userPurchaseId: product.userPurchaseIds[0] },
          })
        } else {
          router.push({
            pathname: '/(app)/home/ticket/purchase/list',
            params: { ids: JSON.stringify(product.userPurchaseIds), productName: product.name },
          })
        }
      }}
    >
      <Image
        source={{ uri: product.image ?? PLACEHOLDER }}
        placeholder={blurhash}
        cachePolicy="memory-disk"
        contentFit="cover"
        style={styles.purchaseImg}
      />
      <View style={styles.purchaseInfo}>
        <Text style={styles.purchaseName} numberOfLines={2}>{product.name}</Text>
        {!!product.about && (
          <Text style={styles.purchaseAbout} numberOfLines={1}>{product.about}</Text>
        )}
        <Text style={styles.purchasePrice}>
          ${product.price.toFixed(2)}
          {product.quantity > 1 && (
            <Text style={styles.purchaseQty}>  ×{product.quantity}</Text>
          )}
        </Text>
        <Text style={styles.purchaseEventLabel} numberOfLines={1}>
          {eventName}  ·  {dateLabel}
        </Text>
      </View>
      <View style={[styles.purchaseBadge, isDelivered && styles.purchaseBadgeDelivered]}>
        <Text style={[styles.purchaseBadgeText, isDelivered && styles.purchaseBadgeTextDelivered]}>
          {isDelivered ? 'Entregado' : 'Pendiente'}
        </Text>
      </View>

      <MaterialCommunityIcons name="chevron-right" size={20} color={C.dim} style={{ alignSelf: 'center' }} />
    </Pressable>
  )
}

// ─── Main screen ───────────────────────────────────────────────────────────────
export default function Page() {
  const insets    = useSafeAreaInsets()
  const { user }  = useSession()
  const [activeIdx, setActiveIdx] = useState(0)
  const [activeTab, setActiveTab] = useState<'entradas' | 'productos'>('entradas')

  const utils = api.useUtils()
  const ticketsQuery = api.mobile.userTicket.list.useQuery(
    { userId: user?.id ?? '' },
    {
      enabled: !!user?.id,
      staleTime: 0,
      // Siempre re-fetcha al montar (cubre cambios de cuenta y aceptaciones recientes)
      refetchOnMount: 'always',
      refetchOnWindowFocus: true,
    }
  )

  const myPurchasesQuery = api.mobile.userPurchase.myPurchases.useQuery(
    undefined,
    { staleTime: 0, refetchOnMount: 'always', enabled: !!user },
  )

  const isRefreshing = ticketsQuery.isFetching || myPurchasesQuery.isFetching
  const onRefresh = async () => {
    // Refetch explícito esperando el resultado (no solo invalidate). En MIUI/Xiaomi
    // el invalidate solo no garantiza que el refetch llegue al servidor — al hacer
    // refetch directo el ciclo retry/error queda visible al usuario.
    await Promise.all([
      ticketsQuery.refetch(),
      myPurchasesQuery.refetch(),
    ])
  }
  const hasFetchError = ticketsQuery.isError || myPurchasesQuery.isError

  const allTickets = ticketsQuery.data ?? []

  /**
   * Sección "Regalos en Curso": tickets que YO regalé y aún están pendientes de aceptación.
   */
  const giftedTickets = allTickets.filter((t) => t.isSentGift)

  /**
   * Carrusel principal "Mis Entradas":
   *   · Tickets propios normales y transferencias aceptadas → se agrupan por `eventTicket.id` (tipo)
   *     mostrándose como un único card con badge = cantidad total de entradas.
   *   · Regalos pendientes recibidos (isIncomingGift=true) → se muestran individualmente porque
   *     tienen un flujo de aceptación propio (ruta `/gift`).
   *   · Regalos que yo ENVIÉ (isSentGift) → se excluyen del carrusel; van a "Regalos en Curso".
   */
  type GroupCard = {
    kind: 'group'
    key: string
    eventTicketId: string
    totalQuantity: number
    userTicketIds: string[]
    representative: (typeof allTickets)[number]
  }
  type IncomingCard = {
    kind: 'incoming'
    key: string
    ticket: (typeof allTickets)[number]
  }
  type CarouselItem = GroupCard | IncomingCard

  const carouselItems: CarouselItem[] = React.useMemo(() => {
    const groups = new Map<string, GroupCard>()
    const incomings: IncomingCard[] = []

    for (const t of allTickets) {
      if (t.isSentGift) continue
      const tid = t.id ?? t.userTicketId ?? t.url
      if (t.isIncomingGift) {
        incomings.push({ kind: 'incoming', key: `inc-${tid}`, ticket: t })
        continue
      }
      const k = t.eventTicket.id
      const existing = groups.get(k)
      if (existing) {
        existing.totalQuantity += t.quantity
        existing.userTicketIds.push(tid)
      } else {
        groups.set(k, {
          kind: 'group',
          key: `grp-${k}`,
          eventTicketId: k,
          totalQuantity: t.quantity,
          userTicketIds: [tid],
          representative: t,
        })
      }
    }
    return [...Array.from(groups.values()), ...incomings]
  }, [allTickets])

  const hasCarousel = carouselItems.length > 0
  const hasGifted   = giftedTickets.length > 0

  const myPurchases = myPurchasesQuery.data ?? []
  const hasPurchases = myPurchases.length > 0
  const purchaseTotalCount = myPurchases.reduce((sum, g) => sum + g.products.length, 0)

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offset = e.nativeEvent.contentOffset.x
    setActiveIdx(Math.round(offset / SNAP_INT))
  }

  if (ticketsQuery.isLoading || myPurchasesQuery.isLoading) return <Loading />

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar style="light" animated backgroundColor="transparent" translucent />

      <ScrollView
        style={{ flex: 1 }}
        overScrollMode="never"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={C.magenta}
            progressBackgroundColor={C.card}
          />
        }
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* ── Page header ── */}
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>MIS ENTRADAS</Text>
          {(hasCarousel || hasGifted) && (
            <View style={styles.totalBadge}>
              <Text style={styles.totalBadgeText}>
                {allTickets.length}
              </Text>
            </View>
          )}
        </View>

        {/* ── Error banner (queries fallidas) ── */}
        {hasFetchError && (
          <ErrorBanner
            onRetry={() => {
              void ticketsQuery.refetch()
              void myPurchasesQuery.refetch()
            }}
          />
        )}

        {/* ── Tab bar ── */}
        <View style={styles.tabBar}>
          <Pressable
            style={[styles.tabBtn, activeTab === 'entradas' && styles.tabBtnActive]}
            onPress={() => setActiveTab('entradas')}
          >
            <MaterialCommunityIcons
              name="ticket-confirmation-outline"
              size={16}
              color={activeTab === 'entradas' ? C.white : C.dim}
            />
            <Text style={[styles.tabBtnText, activeTab === 'entradas' && styles.tabBtnTextActive]}>
              ENTRADAS
            </Text>
          </Pressable>
          <Pressable
            style={[styles.tabBtn, activeTab === 'productos' && styles.tabBtnActive]}
            onPress={() => setActiveTab('productos')}
          >
            <MaterialCommunityIcons
              name="shopping-outline"
              size={16}
              color={activeTab === 'productos' ? C.white : C.dim}
            />
            <Text style={[styles.tabBtnText, activeTab === 'productos' && styles.tabBtnTextActive]}>
              PRODUCTOS
            </Text>
            {purchaseTotalCount > 0 && (
              <View style={styles.tabBadge}>
                <Text style={styles.tabBadgeText}>{purchaseTotalCount}</Text>
              </View>
            )}
          </Pressable>
        </View>

        {/* ══════════ TAB: ENTRADAS ══════════ */}
        {activeTab === 'entradas' && (
          <>
            {hasCarousel && (
              <View style={styles.section}>
                <SectionHeader title="Mis Entradas" count={carouselItems.length} />

                <Text style={styles.entradaCounter}>
                  Entrada {activeIdx + 1} de {carouselItems.length}
                </Text>

                <FlatList
                  data={carouselItems}
                  horizontal
                  keyExtractor={(item) => item.key}
                  showsHorizontalScrollIndicator={false}
                  snapToInterval={SNAP_INT}
                  decelerationRate="fast"
                  contentContainerStyle={styles.carouselContent}
                  ItemSeparatorComponent={() => <View style={{ width: CARD_GAP }} />}
                  onScroll={handleScroll}
                  scrollEventThrottle={16}
                  renderItem={({ item }) => {
                    if (item.kind === 'incoming') {
                      const raw = item.ticket
                      const ticket: TicketItem = {
                        id: raw.id ?? raw.userTicketId ?? raw.url,
                        userTicketId: raw.userTicketId ?? raw.url,
                        url: raw.url,
                        quantity: raw.quantity,
                        eventTicket: raw.eventTicket,
                        giftId: raw.giftId ?? null,
                        isSentGift:      raw.isSentGift      ?? false,
                        isIncomingGift:  raw.isIncomingGift  ?? false,
                        giftSenderName:  raw.giftSenderName  ?? null,
                        giftSenderImage: raw.giftSenderImage ?? null,
                      }
                      return (
                        <TicketItemCard
                          ticket={ticket}
                          cardWidth={CARD_W}
                          styles={styles}
                          onPress={() => router.push('/(app)/home/gift')}
                        />
                      )
                    }
                    // kind === 'group': agrupado por tipo de entrada dentro del evento
                    const rep = item.representative
                    const ticket: TicketItem = {
                      id: rep.id ?? rep.userTicketId ?? rep.url,
                      userTicketId: rep.userTicketId ?? rep.url,
                      url: rep.url,
                      quantity: item.totalQuantity,
                      eventTicket: rep.eventTicket,
                      giftId: rep.giftId ?? null,
                      isSentGift:      false,
                      isIncomingGift:  false,
                      giftSenderName:  rep.giftSenderName  ?? null,
                      giftSenderImage: rep.giftSenderImage ?? null,
                    }
                    return (
                      <TicketItemCard
                        ticket={ticket}
                        cardWidth={CARD_W}
                        styles={styles}
                        onPress={() =>
                          router.push({
                            pathname: '/(app)/home/ticket/[eventTicketId]/',
                            params: { eventTicketId: item.eventTicketId },
                          })
                        }
                      />
                    )
                  }}
                />

                <PagerDots total={carouselItems.length} active={activeIdx} />
              </View>
            )}

            {hasGifted && (
              <View style={[styles.section, { marginTop: hasCarousel ? 28 : 0 }]}>
                <SectionHeader
                  title="Regalos en Curso"
                  count={giftedTickets.length}
                  accent={C.amber}
                />
                <Text style={styles.giftSectionSub}>
                  Estos tickets están pendientes de aceptación. Podés anular el envío desde el detalle.
                </Text>

                <View style={styles.giftList}>
                  {giftedTickets.map((item, i) => (
                    <SentGiftCard
                      key={item.id ?? i}
                      item={{
                        userTicketId: item.userTicketId ?? item.id,
                        giftId: item.giftId ?? null,
                        giftStatus: item.gift?.status ?? null,
                        giftReceiver: item.gift?.giftReceiver ?? null,
                        eventTicket: item.eventTicket,
                      }}
                      onPress={() =>
                        router.push({
                          pathname: '/(app)/home/ticket/[eventTicketId]/',
                          params: {
                            eventTicketId: item.eventTicket.id,
                            userTicketId: item.id ?? item.userTicketId,
                          },
                        })
                      }
                    />
                  ))}
                </View>
              </View>
            )}

            {!hasCarousel && !hasGifted && (
              <View style={styles.purchaseEmpty}>
                <MaterialCommunityIcons name="ticket-outline" size={40} color={C.dim} />
                <Text style={styles.purchaseEmptyText}>
                  Aún no tenés entradas
                </Text>
              </View>
            )}
          </>
        )}

        {/* ══════════ TAB: PRODUCTOS ══════════ */}
        {activeTab === 'productos' && (
          <View style={styles.section}>
            {hasPurchases ? (
              <View style={styles.purchaseList}>
                {myPurchases.map((group) =>
                  group.products.map((product) => (
                    <PurchaseProductCard
                      key={`${group.eventId}-${product.productId}-${product.status}`}
                      product={product}
                      eventName={group.eventName}
                      eventStartsAt={group.eventStartsAt}
                    />
                  ))
                )}
              </View>
            ) : (
              <View style={styles.purchaseEmpty}>
                <MaterialCommunityIcons name="shopping-outline" size={40} color={C.dim} />
                <Text style={styles.purchaseEmptyText}>
                  Aún no tenés productos comprados
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  )
}

// ─── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  // ── Page header
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
  },
  pageTitle: {
    color: C.white,
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  totalBadge: {
    backgroundColor: 'rgba(255,0,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,0,255,0.35)',
    borderRadius: 50,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  totalBadgeText: {
    color: C.magenta,
    fontSize: 20,
    fontWeight: '800',
    fontFamily: 'Montserrat_700Bold',
  },

  // ── Tab bar (pill style)
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
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
  tabBadge: {
    backgroundColor: 'rgba(255,0,255,0.25)',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
    marginLeft: 2,
  },
  tabBadgeText: {
    color: C.magenta,
    fontSize: 10,
    fontWeight: '800',
  },

  // ── Sections
  section: { gap: 0 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  sectionTitle: {
    color: C.white,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  sectionCount: {
    borderWidth: 1,
    borderRadius: 50,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  sectionCountText: {
    fontSize: 20,
    fontWeight: '800',
    fontFamily: 'Montserrat_700Bold',
  },

  // ── Carousel
  carouselContent: { paddingHorizontal: 16 },
  entradaCounter: {
    color: C.dim,
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'Montserrat_700Bold',
    paddingHorizontal: 20,
    marginBottom: 8,
  },

  // ── Ticket card
  card: {
    width: CARD_W,
    height: 360,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: 'rgba(255,0,255,0.20)',
    // Shadow (iOS) — Fucsia según Manual de marca
    shadowColor: C.magenta,
    shadowOpacity: 0.25,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    // Android elevation
    elevation: 12,
  },
  cardGiftBlocking: {
    borderColor: 'rgba(245,158,11,0.35)',
    shadowColor: C.amber,
    shadowOpacity: 0.2,
  },
  qtyBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    borderRadius: 50,
    overflow: 'hidden',
    shadowColor: C.magenta,
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 6,
  },
  qtyBadgeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 50,
  },
  qtyBadgeGift: {
    shadowColor: C.amber,
    shadowOpacity: 0.4,
  },
  qtyBadgeGiftInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 50,
    backgroundColor: 'rgba(245,158,11,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.35)',
  },
  qtyBadgeText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  typeBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: 50,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  typeBadgeText: {
    color: C.white,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  cardBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    gap: 5,
  },
  cardEventName: {
    color: C.white,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
    lineHeight: 27,
    marginBottom: 4,
  },
  cardMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  cardMeta:    { color: C.dim, fontSize: 12, flex: 1 },
  cardCta: {
    gap: 8,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.15)',
  },
  cardCtaText: { color: C.magenta, fontSize: 12, fontWeight: '700', letterSpacing: 0.3 },
  enterBtnWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,0,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,0,255,0.35)',
    borderRadius: 50,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignSelf: 'flex-start',
  },
  enterBtnText: {
    color: C.magenta,
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Montserrat_700Bold',
    letterSpacing: 0.5,
  },

  // Perforación decorativa en los costados
  perfCircle: {
    position: 'absolute',
    top: '50%',
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: C.bg,
    marginTop: -12,
  },

  // ── Pager dots
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 16,
    paddingHorizontal: 16,
  },
  dot:         { height: 6, borderRadius: 3 },
  dotActive:   { width: 20, backgroundColor: C.magenta },
  dotInactive: { width: 6,  backgroundColor: 'rgba(255,255,255,0.25)' },

  // ── Gift section
  giftSectionSub: {
    color: C.dim,
    fontSize: 12,
    lineHeight: 17,
    paddingHorizontal: 20,
    marginBottom: 14,
    marginTop: -8,
  },
  giftList: { gap: 10, paddingHorizontal: 16 },

  // ── Gift card
  giftCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245,158,11,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.22)',
    borderRadius: 16,
    overflow: 'hidden',
    gap: 0,
    // Shadow
    shadowColor: C.amber,
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  giftThumb: {
    width: 90,
    height: 90,
    backgroundColor: C.surface,
  },
  giftInfo: {
    flex: 1,
    padding: 12,
    gap: 4,
  },
  giftEventName: {
    color: C.white,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 18,
  },
  giftMeta: {
    color: C.dim,
    fontSize: 11,
  },
  giftReceiverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  giftAvatar: {
    width: 18,
    height: 18,
    borderRadius: 9,
    overflow: 'hidden',
    backgroundColor: C.surface,
  },
  giftAvatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  giftReceiverText: {
    color: C.dim,
    fontSize: 11,
  },
  giftStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderLeftColor: 'rgba(245,158,11,0.20)',
  },
  giftStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: C.amber,
  },
  giftStatusText: {
    color: C.amber,
    fontSize: 10,
    fontWeight: '700',
    writingDirection: 'ltr',
  },

  // ── Purchase cards
  purchaseList: {
    gap: 8,
    paddingHorizontal: 16,
  },
  purchaseEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    gap: 10,
  },
  purchaseEmptyText: {
    color: C.dim,
    fontSize: 13,
    textAlign: 'center',
  },
  purchaseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.card,
    borderRadius: 14,
    padding: 10,
    gap: 12,
    borderWidth: 1,
    borderColor: C.border,
  },
  purchaseImg: {
    width: 60,
    height: 60,
    borderRadius: 10,
    backgroundColor: C.surface,
  },
  purchaseInfo: {
    flex: 1,
    gap: 2,
  },
  purchaseName: {
    color: C.white,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 18,
  },
  purchaseAbout: {
    color: C.dim,
    fontSize: 11,
    lineHeight: 15,
  },
  purchasePrice: {
    color: C.magenta,
    fontSize: 14,
    fontWeight: '800',
    marginTop: 2,
  },
  purchaseQty: {
    color: C.dim,
    fontSize: 12,
    fontWeight: '600',
  },
  purchaseEventLabel: {
    color: C.dim,
    fontSize: 11,
    marginTop: 2,
  },
  purchaseBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(255,0,255,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,0,255,0.30)',
    alignSelf: 'center',
  },
  purchaseBadgeDelivered: {
    backgroundColor: 'rgba(0,255,157,0.10)',
    borderColor: 'rgba(0,255,157,0.30)',
  },
  purchaseBadgeText: {
    color: C.magenta,
    fontSize: 10,
    fontWeight: '700',
  },
  purchaseBadgeTextDelivered: {
    color: '#00ff9d',
  },
})
