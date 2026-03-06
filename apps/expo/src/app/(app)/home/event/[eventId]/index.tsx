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

import Ionicons from '@expo/vector-icons/Ionicons'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { Image, ImageBackground } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import { router, useLocalSearchParams } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import React, { useEffect, useState } from 'react'
import {
    Dimensions,
    Linking,
    Pressable,
    ScrollView,
    Share,
    StyleSheet,
    Text,
    View,
} from 'react-native'
import Constants from 'expo-constants'
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps'
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

// ─── Map ────────────────────────────────────────────────────────────────────────
// Fallback a Yerba Buena, Tucumán cuando el evento no tiene coordenadas en DB
const LAT_FALLBACK = -26.8167
const LNG_FALLBACK = -65.2833

// Estilo oscuro para Google Maps (desactivado temporalmente para verificar tiles)
// Re-activar con customMapStyle={DARK_MAP_STYLE} cuando el mapa cargue correctamente
const DARK_MAP_STYLE = [
    { elementType: 'geometry',             stylers: [{ color: '#1d2035' }] },
    { elementType: 'labels.icon',          stylers: [{ visibility: 'off' }] },
    { elementType: 'labels.text.fill',     stylers: [{ color: '#757575' }] },
    { elementType: 'labels.text.stroke',   stylers: [{ color: '#212121' }] },
    { featureType: 'administrative',       elementType: 'geometry',             stylers: [{ color: '#757575' }] },
    { featureType: 'administrative.locality', elementType: 'labels.text.fill',  stylers: [{ color: '#bdbdbd' }] },
    { featureType: 'poi',                  elementType: 'labels.text.fill',     stylers: [{ color: '#757575' }] },
    { featureType: 'poi.park',             elementType: 'geometry',             stylers: [{ color: '#181818' }] },
    { featureType: 'road',                 elementType: 'geometry.fill',        stylers: [{ color: '#2c2c2c' }] },
    { featureType: 'road',                 elementType: 'labels.text.fill',     stylers: [{ color: '#8a8a8a' }] },
    { featureType: 'road.arterial',        elementType: 'geometry',             stylers: [{ color: '#373737' }] },
    { featureType: 'road.highway',         elementType: 'geometry',             stylers: [{ color: '#3c3c3c' }] },
    { featureType: 'road.highway.controlled_access', elementType: 'geometry',   stylers: [{ color: '#4e4e4e' }] },
    { featureType: 'transit',              elementType: 'labels.text.fill',     stylers: [{ color: '#757575' }] },
    { featureType: 'water',                elementType: 'geometry',             stylers: [{ color: '#000000' }] },
    { featureType: 'water',                elementType: 'labels.text.fill',     stylers: [{ color: '#3d3d3d' }] },
]

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

    // ─── TODOS LOS HOOKS ANTES DE CUALQUIER return (Rules of Hooks) ───
    // Coordenadas: derivar con optional chaining para que existan siempre (incluso cuando event es undefined)
    const rawLat = event?.location?.latitude ?? 0
    const rawLng = event?.location?.longitude ?? 0
    const mapLat = (rawLat === 0 && rawLng === 0) ? LAT_FALLBACK : rawLat
    const mapLng = (rawLat === 0 && rawLng === 0) ? LNG_FALLBACK : rawLng

    // Log coordenadas móvil vs web admin (apiKeyVacia) — siempre se ejecuta, no condicional
    useEffect(() => {
        console.log('DEBUG KEY:', process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ? 'PRESENTE' : 'AUSENTE')
        const keyFromEnv = typeof process !== 'undefined' && !!process.env?.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY
        const keyFromExtra = Constants.expoConfig?.extra?.googleMapsApiKeyConfigured === true
        const apiKeyVacia = !keyFromEnv && !keyFromExtra
        console.log('[EventDetail] Coordenadas móvil:', {
            raw: { latitude: rawLat, longitude: rawLng },
            map: { mapLat, mapLng },
            address: event?.location?.address,
            apiKeyVacia,
        })
    }, [rawLat, rawLng, mapLat, mapLng, event?.location?.address])

    // Init selección de ticket al cargar evento (evita setState durante render)
    useEffect(() => {
        if (event?.tickets?.[0] && !selectedTicketId) {
            setSelectedTicketId(event.tickets[0].id)
        }
    }, [event?.tickets, selectedTicketId])

    // Early return DESPUÉS de todos los Hooks
    if (isLoading || !event) return <Loading />

    // Derive values (solo cuando event existe)
    const minPrice  = event.tickets?.reduce((m, t) => t.price < m ? t.price : m, Infinity) ?? 0
    const safePrice = minPrice === Infinity ? 0 : minPrice
    const selectedTicket = event.tickets?.find(t => t.id === selectedTicketId) ?? event.tickets?.[0]

    const startDate  = dayjs.utc(event.startsAt).local()
    const endDate    = event.endsAt ? dayjs.utc(event.endsAt).local() : null
    const dateLabel  = startDate.locale('es').format('ddd, MMM D')
    const timeLabel  = `${startDate.format('HH:mm')}${endDate ? ` – ${endDate.format('HH:mm')}` : ''}`
    const isLive     = dayjs().isAfter(startDate) && (!endDate || dayjs().isBefore(endDate))

    const onOpenGoogleMaps = () => {
        const url = `https://www.google.com/maps/search/?api=1&query=${mapLat},${mapLng}`
        Linking.openURL(url)
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

    // Coordenadas válidas para MapView: números finitos (mapLat/mapLng ya tienen fallback)
    const hasValidCoords = Number.isFinite(mapLat) && Number.isFinite(mapLng)

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

                    {/* ── Ubicación ── (MapView solo si coordenadas válidas) */}
                    {event.location && hasValidCoords && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Ubicación</Text>
                            <View style={styles.mapCard}>
                                {/* MapView: provider Google forzado, sin customMapStyle para verificar tiles */}
                                <MapView
                                    style={styles.mapViewFill}
                                    provider={PROVIDER_GOOGLE}
                                    initialRegion={{
                                        latitude:       mapLat,
                                        longitude:      mapLng,
                                        latitudeDelta:  0.01,
                                        longitudeDelta: 0.01,
                                    }}
                                    scrollEnabled={false}
                                    zoomEnabled={false}
                                    rotateEnabled={false}
                                    pitchEnabled={false}
                                    pointerEvents="none"
                                    liteMode={false}
                                >
                                    <Marker
                                        coordinate={{ latitude: mapLat, longitude: mapLng }}
                                        pinColor={C.magenta}
                                    />
                                </MapView>

                                {/* Gradient suave (solo borde inferior, sin tapar el mapa) */}
                                <LinearGradient
                                    colors={['transparent', 'rgba(0,0,0,0.25)']}
                                    style={[styles.mapGradient, { zIndex: 1 }]}
                                    start={{ x: 0, y: 0.75 }}
                                    end={{ x: 0, y: 1 }}
                                    pointerEvents="none"
                                />

                                {/* Info + FAB de navegación */}
                                <View style={[styles.mapOverlay, { zIndex: 2 }]}>
                                    <View style={styles.mapOverlayText}>
                                        <Text style={styles.mapName}>{event.location.name}</Text>
                                        <Text style={styles.mapAddress} numberOfLines={1}>
                                            {event.location.address}
                                            {event.location.city ? `, ${event.location.city}` : ''}
                                        </Text>
                                    </View>
                                    <Pressable style={styles.mapFab} onPress={onOpenGoogleMaps}>
                                        <MaterialCommunityIcons name="navigation" size={18} color="#fff" />
                                    </Pressable>
                                </View>
                            </View>

                            {/* ── Datos de ubicación debajo del mapa ── */}
                            <View style={styles.locationInfoCard}>
                                <View style={styles.locationInfoRow}>
                                    <Ionicons name="location" size={18} color={C.magenta} style={styles.locationIcon} />
                                    <View style={styles.locationInfoText}>
                                        <Text style={styles.locationVenueName} numberOfLines={2}>
                                            {event?.location?.name ?? 'Ubicación del evento'}
                                        </Text>
                                        <Text style={styles.locationAddress} numberOfLines={2}>
                                            {[event?.location?.address, event?.location?.city].filter(Boolean).join(', ') || 'Dirección no disponible'}
                                        </Text>
                                    </View>
                                </View>
                                <View style={styles.locationInfoRow}>
                                    <Ionicons name="time-outline" size={18} color={C.dim} style={styles.locationIcon} />
                                    <Text style={styles.locationTime}>
                                        {dateLabel} · {timeLabel}
                                    </Text>
                                </View>
                                <Pressable style={styles.openMapsBtn} onPress={onOpenGoogleMaps}>
                                    <Ionicons name="navigate" size={18} color="#fff" />
                                    <Text style={styles.openMapsBtnText}>Abrir en Google Maps</Text>
                                </Pressable>
                            </View>
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

    // ── Map (dimensiones explícitas para Android)
    mapCard: {
        borderRadius: 16,
        overflow: 'hidden',
        height: 250,
        minHeight: 250,
        flex: 1,
        backgroundColor: '#1d2035',
    },
    mapViewFill: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 0,
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
        marginRight: 10,
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
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: C.magenta,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: C.magenta,
        shadowOpacity: 0.65,
        shadowRadius: 10,
        elevation: 8,
    },

    // ── Ubicación: datos debajo del mapa
    locationInfoCard: {
        marginTop: 12,
        backgroundColor: C.surface,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: C.border,
        padding: 16,
        gap: 12,
    },
    locationInfoRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
    },
    locationIcon: {
        marginTop: 2,
    },
    locationInfoText: {
        flex: 1,
        gap: 4,
    },
    locationVenueName: {
        color: C.white,
        fontSize: 16,
        fontWeight: '700',
    },
    locationAddress: {
        color: C.dim,
        fontSize: 14,
        lineHeight: 20,
    },
    locationTime: {
        flex: 1,
        color: C.dim,
        fontSize: 13,
    },
    openMapsBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: C.magenta,
        borderRadius: 12,
        paddingVertical: 12,
        paddingHorizontal: 16,
        marginTop: 4,
    },
    openMapsBtnText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '700',
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
