/**
 * Event Detail — Diseño premium réplica del Stitch "detalle1.png"
 *
 * Estructura:
 *   ┌─────────────────────────────────────┐
 *   │  [Hero Image + Gradient]            │  ← 45% pantalla
 *   │  ← back               ♡  ⤴         │
 *   │  ● EVENTO EN VIVO                   │
 *   │  Neon Nights Festival 2024          │
 *   │  📅 Oct 25   🕙 22:00 – 04:00       │
 *   │  👤👤👤 +2k     [Estoy Presente]    │
 *   ├─────────────────────────────────────┤
 *   │  Sobre el Evento                    │
 *   │  Artistas  (scroll horizontal)      │
 *   │  Ubicación (static map + FAB)       │
 *   │  Seleccionar Entrada (radio cards)  │
 *   └─────────────────────────────────────┘
 *   [sticky footer] Comprar Entrada | Comprar Artículo
 */

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { Image, ImageBackground } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import { router, useLocalSearchParams } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import React, { useState } from 'react'
import {
    Dimensions,
    Linking,
    Platform,
    Pressable,
    ScrollView,
    Share,
    StyleSheet,
    Text,
    View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Loading from '~/components/loading'
import { useSession } from '~/context/auth'
import { api } from '~/utils/api'
import { PLACEHOLDER, blurhash, dayjs } from '~/utils/constants'

// ─── Brand palette ──────────────────────────────────────────────────────────────
const C = {
    bg:       '#111827',   // fondo oscuro principal
    surface:  '#1e2535',   // superficie de tarjetas
    magenta:  '#ff00ff',
    purple:   '#7c3aed',
    white:    '#ffffff',
    dim:      'rgba(255,255,255,0.55)',
    faint:    'rgba(255,255,255,0.07)',
    border:   'rgba(255,255,255,0.10)',
    liveDot:  '#ff3b3b',
}

const { width: SCREEN_W } = Dimensions.get('window')
const HERO_H = SCREEN_W * 1.05   // ~45% en Pixel 6

// ─── Price formatter ────────────────────────────────────────────────────────────
function fmt(price: number) {
    return new Intl.NumberFormat('es-AR', {
        style: 'currency', currency: 'ARS', minimumFractionDigits: 0,
    }).format(price)
}

// ─── Availability label ────────────────────────────────────────────────────────
function availLabel(qty: number, sold: number): { text: string; color: string } {
    const remaining = qty - sold
    const pct = remaining / qty
    if (pct <= 0)    return { text: 'Agotado',   color: '#ef4444' }
    if (pct <= 0.15) return { text: 'Poco Stock', color: '#f59e0b' }
    return              { text: 'Disponible',  color: '#22c55e' }
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function EventDetailPage() {
    const insets = useSafeAreaInsets()
    const { eventId } = useLocalSearchParams<{ eventId: string }>()
    const { user } = useSession()

    const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null)
    const [attending, setAttending] = useState(false)

    const { data: event, isLoading } = api.mobile.event.byId.useQuery({ id: eventId! })

    if (isLoading || !event) return <Loading />

    // Derive values
    const minPrice  = event.tickets?.reduce((m, t) => t.price < m ? t.price : m, Infinity) ?? 0
    const safePrice = minPrice === Infinity ? 0 : minPrice
    const selectedTicket = event.tickets?.find(t => t.id === selectedTicketId) ?? event.tickets?.[0]

    const startDate  = dayjs.utc(event.startsAt).local()
    const endDate    = event.endsAt ? dayjs.utc(event.endsAt).local() : null
    const dateLabel  = startDate.locale('es').format('ddd, MMM D')
    const timeLabel  = `${startDate.format('HH:mm')}${endDate ? ` – ${endDate.format('HH:mm')}` : ''}`
    const isLive     = dayjs().isAfter(startDate) && (!endDate || dayjs().isBefore(endDate))

    const onOpenMaps = () => {
        const scheme = Platform.select({ ios: 'maps://0,0?q=', android: 'geo:0,0?q=' })
        const latLng = `${event.location?.latitude},${event.location?.longitude}`
        const label  = event.location?.name ?? ''
        const url    = Platform.select({
            ios:     `${scheme}${label}@${latLng}`,
            android: `${scheme}${latLng}(${label})`,
        })
        Linking.openURL(url ?? `maps://0,0?q=${label}@${latLng}`)
    }

    const onShare = () => {
        Share.share({ message: `¡Mirá este evento! ${event.name}` })
    }

    const onBuyTicket = () => {
        router.push({
            pathname: '/(app)/home/event/[eventId]/tickets/',
            params: { eventId },
        })
    }

    // Init selection to first ticket if not set yet
    if (!selectedTicketId && event.tickets?.[0]) {
        setSelectedTicketId(event.tickets[0].id)
    }

    return (
        <View style={styles.root}>
            <StatusBar style="light" animated translucent backgroundColor="transparent" />

            <ScrollView
                showsVerticalScrollIndicator={false}
                overScrollMode="never"
                contentContainerStyle={{ paddingBottom: 100 }}
            >
                {/* ════════════════ HERO ════════════════ */}
                <View style={[styles.hero, { height: HERO_H }]}>
                    <ImageBackground
                        source={{ uri: event.image ?? PLACEHOLDER }}
                        placeholder={blurhash}
                        cachePolicy="memory-disk"
                        style={StyleSheet.absoluteFill}
                        contentFit="cover"
                    />

                    {/* Gradient: transparent → dark */}
                    <LinearGradient
                        colors={['rgba(0,0,0,0.15)', 'rgba(0,0,0,0.45)', C.bg]}
                        style={StyleSheet.absoluteFill}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 0, y: 1 }}
                        pointerEvents="none"
                    />

                    {/* ── Nav buttons ── */}
                    <View style={[styles.heroNav, { paddingTop: insets.top + 6 }]}>
                        <Pressable style={styles.navBtn} onPress={() => router.back()}>
                            <MaterialCommunityIcons name="arrow-left" size={22} color={C.white} />
                        </Pressable>
                        <View style={styles.navRight}>
                            <Pressable style={styles.navBtn} onPress={onShare}>
                                <MaterialCommunityIcons name="export-variant" size={20} color={C.white} />
                            </Pressable>
                            <Pressable style={styles.navBtn} onPress={() => {}}>
                                <MaterialCommunityIcons
                                    name="heart-outline"
                                    size={20}
                                    color={C.white}
                                />
                            </Pressable>
                        </View>
                    </View>

                    {/* ── Hero content (bottom of image) ── */}
                    <View style={styles.heroContent}>
                        {/* Live badge */}
                        {isLive && (
                            <View style={styles.liveBadge}>
                                <View style={styles.liveDot} />
                                <Text style={styles.liveBadgeText}>EVENTO EN VIVO</Text>
                            </View>
                        )}

                        {/* Title */}
                        <Text style={styles.heroTitle}>{event.name}</Text>

                        {/* Date + time chips */}
                        <View style={styles.chipRow}>
                            <View style={styles.chip}>
                                <MaterialCommunityIcons name="calendar-outline" size={13} color={C.dim} />
                                <Text style={styles.chipText}>{dateLabel}</Text>
                            </View>
                            <View style={styles.chip}>
                                <MaterialCommunityIcons name="clock-outline" size={13} color={C.dim} />
                                <Text style={styles.chipText}>{timeLabel}</Text>
                            </View>
                        </View>

                        {/* Attendees + Estoy Presente */}
                        <View style={styles.attendRow}>
                            {/* Avatar placeholders */}
                            <View style={styles.avatarsInline}>
                                {[0, 1, 2].map(i => (
                                    <View key={i} style={[styles.avatarSmall, { left: i * 18 }]}>
                                        <Image
                                            source={{ uri: event.artists?.[i]?.image ?? PLACEHOLDER }}
                                            style={{ width: '100%', height: '100%' }}
                                            contentFit="cover"
                                        />
                                    </View>
                                ))}
                                <Text style={styles.attendCount}>+2k</Text>
                            </View>
                            <Pressable
                                style={[styles.presenteBtn, attending && styles.presenteBtnActive]}
                                onPress={() => setAttending(v => !v)}
                            >
                                <Text style={styles.presenteBtnText}>
                                    {attending ? '✓ Presente' : 'Estoy Presente'}
                                </Text>
                            </Pressable>
                        </View>
                    </View>
                </View>

                {/* ════════════════ CONTENT AREA ════════════════ */}
                <View style={styles.content}>

                    {/* ── Sobre el Evento ── */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Sobre el Evento</Text>
                        <Text style={styles.bodyText}>{event.about}</Text>
                    </View>

                    {/* ── Artistas ── */}
                    {event.artists && event.artists.length > 0 && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Artistas</Text>
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={styles.artistsRow}
                            >
                                {event.artists.map(artist => (
                                    <View key={artist.id} style={styles.artistItem}>
                                        <View style={styles.artistAvatarWrap}>
                                            <Image
                                                source={{ uri: artist.image ?? PLACEHOLDER }}
                                                placeholder={blurhash}
                                                style={styles.artistAvatar}
                                                contentFit="cover"
                                                cachePolicy="memory-disk"
                                            />
                                        </View>
                                        <Text style={styles.artistName} numberOfLines={1}>
                                            {artist.name}
                                        </Text>
                                    </View>
                                ))}
                            </ScrollView>
                        </View>
                    )}

                    {/* ── Ubicación ── */}
                    {event.location && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Ubicación</Text>
                            <Pressable style={styles.mapCard} onPress={onOpenMaps}>
                                {event.location.staticMap ? (
                                    <Image
                                        source={{ uri: event.location.staticMap }}
                                        placeholder={blurhash}
                                        cachePolicy="memory-disk"
                                        style={styles.mapImage}
                                        contentFit="cover"
                                    />
                                ) : (
                                    <View style={[styles.mapImage, styles.mapPlaceholder]}>
                                        <MaterialCommunityIcons name="map" size={40} color={C.dim} />
                                    </View>
                                )}

                                {/* Location overlay */}
                                <LinearGradient
                                    colors={['transparent', 'rgba(0,0,0,0.75)']}
                                    style={styles.mapGradient}
                                    start={{ x: 0, y: 0.4 }}
                                    end={{ x: 0, y: 1 }}
                                    pointerEvents="none"
                                />
                                <View style={styles.mapOverlay}>
                                    <View style={styles.mapOverlayText}>
                                        <Text style={styles.mapName}>{event.location.name}</Text>
                                        <Text style={styles.mapAddress} numberOfLines={1}>
                                            {event.location.address}, {event.location.city}
                                        </Text>
                                    </View>
                                    <View style={styles.mapFab}>
                                        <MaterialCommunityIcons name="navigation" size={18} color="#fff" />
                                    </View>
                                </View>
                            </Pressable>
                        </View>
                    )}

                    {/* ── Seleccionar Entrada ── */}
                    {event.tickets && event.tickets.length > 0 && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Seleccionar Entrada</Text>
                            <View style={styles.ticketsCol}>
                                {event.tickets.map((ticket, idx) => {
                                    const sold  = ticket._count?.userTicket ?? 0
                                    const avail = availLabel(ticket.quantity ?? 999, sold)
                                    const active = selectedTicketId === ticket.id
                                    const isPopular = idx === 1

                                    return (
                                        <Pressable
                                            key={ticket.id}
                                            style={[styles.ticketCard, active && styles.ticketCardActive]}
                                            onPress={() => setSelectedTicketId(ticket.id)}
                                        >
                                            {/* Radio dot */}
                                            <View style={[styles.radioDot, active && styles.radioDotActive]}>
                                                {active && <View style={styles.radioDotInner} />}
                                            </View>

                                            {/* Info */}
                                            <View style={styles.ticketInfo}>
                                                <View style={styles.ticketNameRow}>
                                                    <Text style={styles.ticketName}>{ticket.name}</Text>
                                                    {isPopular && (
                                                        <View style={styles.popularBadge}>
                                                            <Text style={styles.popularBadgeText}>POPULAR</Text>
                                                        </View>
                                                    )}
                                                </View>
                                                {ticket.about ? (
                                                    <Text style={styles.ticketAbout} numberOfLines={1}>
                                                        {ticket.about}
                                                    </Text>
                                                ) : null}
                                            </View>

                                            {/* Price + availability */}
                                            <View style={styles.ticketRight}>
                                                <Text style={styles.ticketPrice}>
                                                    {ticket.price === 0 ? 'Gratis' : fmt(ticket.price)}
                                                </Text>
                                                <Text style={[styles.ticketAvail, { color: avail.color }]}>
                                                    {avail.text}
                                                </Text>
                                            </View>
                                        </Pressable>
                                    )
                                })}
                            </View>
                        </View>
                    )}
                </View>
            </ScrollView>

            {/* ════════════════ STICKY FOOTER ════════════════ */}
            <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
                {/* Comprar Entrada */}
                <Pressable style={styles.btnPrimary} onPress={onBuyTicket}>
                    <MaterialCommunityIcons name="ticket-outline" size={18} color="#fff" />
                    <Text style={styles.btnPrimaryText}>Comprar Entrada</Text>
                </Pressable>

                {/* Comprar Artículo */}
                <Pressable
                    style={styles.btnOutline}
                    onPress={() => router.push({
                        pathname: '/(app)/home/event/[eventId]/tickets/',
                        params: { eventId },
                    })}
                >
                    <MaterialCommunityIcons name="hanger" size={18} color={C.magenta} />
                    <Text style={styles.btnOutlineText}>Comprar Artículo</Text>
                </Pressable>
            </View>
        </View>
    )
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: C.bg,
    },

    // ── Hero
    hero: {
        width: '100%',
        justifyContent: 'space-between',
    },
    heroNav: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        zIndex: 10,
    },
    navBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(0,0,0,0.45)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    navRight: {
        flexDirection: 'row',
        gap: 8,
    },
    heroContent: {
        paddingHorizontal: 18,
        paddingBottom: 22,
        gap: 10,
        zIndex: 10,
    },
    liveBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    liveDot: {
        width: 7,
        height: 7,
        borderRadius: 4,
        backgroundColor: C.liveDot,
    },
    liveBadgeText: {
        color: C.white,
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 1,
    },
    heroTitle: {
        color: C.white,
        fontSize: 26,
        fontWeight: '800',
        lineHeight: 32,
    },
    chipRow: {
        flexDirection: 'row',
        gap: 8,
        flexWrap: 'wrap',
    },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(0,0,0,0.45)',
        borderRadius: 50,
        paddingHorizontal: 10,
        paddingVertical: 5,
    },
    chipText: {
        color: C.dim,
        fontSize: 12,
        fontWeight: '500',
    },
    attendRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 4,
    },
    avatarsInline: {
        flexDirection: 'row',
        alignItems: 'center',
        position: 'relative',
        height: 28,
    },
    avatarSmall: {
        position: 'absolute',
        width: 26,
        height: 26,
        borderRadius: 13,
        borderWidth: 1.5,
        borderColor: C.bg,
        overflow: 'hidden',
        backgroundColor: C.surface,
    },
    attendCount: {
        color: C.dim,
        fontSize: 12,
        marginLeft: 3 * 18 + 4,
    },
    presenteBtn: {
        borderRadius: 50,
        borderWidth: 1,
        borderColor: C.border,
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: 'rgba(255,255,255,0.06)',
    },
    presenteBtnActive: {
        backgroundColor: C.purple,
        borderColor: C.purple,
    },
    presenteBtnText: {
        color: C.white,
        fontSize: 13,
        fontWeight: '600',
    },

    // ── Content
    content: {
        paddingHorizontal: 18,
        paddingTop: 4,
        gap: 4,
    },
    section: {
        paddingVertical: 16,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: C.border,
        gap: 12,
    },
    sectionTitle: {
        color: C.white,
        fontSize: 17,
        fontWeight: '700',
    },
    bodyText: {
        color: C.dim,
        fontSize: 14,
        lineHeight: 21,
    },

    // ── Artists
    artistsRow: {
        gap: 18,
        paddingRight: 8,
    },
    artistItem: {
        alignItems: 'center',
        gap: 6,
        width: 68,
    },
    artistAvatarWrap: {
        width: 62,
        height: 62,
        borderRadius: 31,
        borderWidth: 2,
        borderColor: C.purple,
        padding: 2,
        overflow: 'hidden',
    },
    artistAvatar: {
        width: '100%',
        height: '100%',
        borderRadius: 28,
    },
    artistName: {
        color: C.dim,
        fontSize: 11,
        textAlign: 'center',
    },

    // ── Map
    mapCard: {
        borderRadius: 16,
        overflow: 'hidden',
        height: 160,
    },
    mapImage: {
        width: '100%',
        height: '100%',
    },
    mapPlaceholder: {
        backgroundColor: C.surface,
        alignItems: 'center',
        justifyContent: 'center',
    },
    mapGradient: {
        ...StyleSheet.absoluteFillObject,
    },
    mapOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 12,
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
    },
    mapOverlayText: {
        flex: 1,
        gap: 2,
    },
    mapName: {
        color: C.white,
        fontSize: 14,
        fontWeight: '700',
    },
    mapAddress: {
        color: C.dim,
        fontSize: 11,
    },
    mapFab: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: C.magenta,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: C.magenta,
        shadowOpacity: 0.6,
        shadowRadius: 8,
        elevation: 6,
    },

    // ── Ticket cards
    ticketsCol: {
        gap: 10,
    },
    ticketCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: C.faint,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: C.border,
        padding: 14,
        gap: 12,
    },
    ticketCardActive: {
        borderColor: C.purple,
        backgroundColor: 'rgba(124,58,237,0.12)',
    },
    radioDot: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: C.border,
        alignItems: 'center',
        justifyContent: 'center',
    },
    radioDotActive: {
        borderColor: C.purple,
    },
    radioDotInner: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: C.purple,
    },
    ticketInfo: {
        flex: 1,
        gap: 3,
    },
    ticketNameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    ticketName: {
        color: C.white,
        fontSize: 14,
        fontWeight: '600',
    },
    popularBadge: {
        backgroundColor: C.purple,
        borderRadius: 50,
        paddingHorizontal: 7,
        paddingVertical: 2,
    },
    popularBadgeText: {
        color: '#fff',
        fontSize: 9,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    ticketAbout: {
        color: C.dim,
        fontSize: 11,
    },
    ticketRight: {
        alignItems: 'flex-end',
        gap: 2,
    },
    ticketPrice: {
        color: C.white,
        fontSize: 15,
        fontWeight: '700',
    },
    ticketAvail: {
        fontSize: 11,
        fontWeight: '600',
    },

    // ── Footer
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: C.bg,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: C.border,
        paddingTop: 12,
        paddingHorizontal: 16,
        flexDirection: 'row',
        gap: 10,
    },
    btnPrimary: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: C.magenta,
        borderRadius: 50,
        paddingVertical: 13,
        gap: 7,
        shadowColor: C.magenta,
        shadowOpacity: 0.45,
        shadowRadius: 10,
        elevation: 6,
    },
    btnPrimaryText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '700',
    },
    btnOutline: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
        borderColor: C.magenta,
        borderRadius: 50,
        paddingVertical: 13,
        gap: 7,
    },
    btnOutlineText: {
        color: C.magenta,
        fontSize: 14,
        fontWeight: '700',
    },
})
