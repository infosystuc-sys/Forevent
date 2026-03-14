/**
 * Event Detail — Diseño premium
 * Datos obtenidos de api.mobile.event.byId
 */

import Ionicons from '@expo/vector-icons/Ionicons'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { ImageBackground } from 'expo-image'
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
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps'
import Loading from '~/components/loading'
import { api } from '~/utils/api'
import { blurhash, dayjs, PLACEHOLDER } from '~/utils/constants'

// --- Constantes de Estilo ---
const C = {
    bg: '#0A0A0A',
    card: '#161616',
    border: '#262626',
    white: '#FFFFFF',
    dim: '#A0A0A0',
    magenta: '#FF00FF',
    cyan: '#00FFFF',
    green: '#00FF9D',
}

const { width: W_WIDTH, height: W_HEIGHT } = Dimensions.get('window')
const HERO_HEIGHT = W_HEIGHT * 0.48

// Fallback coordenadas cuando el evento no tiene location
const LAT_FALLBACK = -26.8167
const LNG_FALLBACK = -65.2833

// customMapStyle desactivado — en Android el estilo personalizado provocaba mapa gris.
// El mapa por defecto de Google muestra calles y datos correctamente.

export default function EventDetailScreen() {
    const params = useLocalSearchParams<{ eventId: string }>()
    const eventId = typeof params.eventId === 'string' ? params.eventId : params.eventId?.[0]
    const [selectedTicket, setSelectedTicket] = useState('general')

    const { data: event, isLoading } = api.mobile.event.byId.useQuery(
        { id: eventId! },
        { enabled: !!eventId }
    )

    const rawLat = event?.location?.latitude ?? 0
    const rawLng = event?.location?.longitude ?? 0
    const mapLat = (rawLat === 0 && rawLng === 0) ? LAT_FALLBACK : rawLat
    const mapLng = (rawLat === 0 && rawLng === 0) ? LNG_FALLBACK : rawLng
    const hasValidCoords = Number.isFinite(mapLat) && Number.isFinite(mapLng)
    const mapRenders = hasValidCoords

    // Fase 2: Diagnóstico — revisar en consola Metro/Logcat
    useEffect(() => {
        console.log('[EventDetail] Mapa debug:', {
            eventLocation: event?.location,
            rawLat,
            rawLng,
            mapLat,
            mapLng,
            hasValidCoords,
            mapRenders,
        })
    }, [event?.location, rawLat, rawLng, mapLat, mapLng, hasValidCoords, mapRenders])

    // Deltas 0.004 = zoom detallado "calle"
    const initialRegion = {
        latitude: mapLat,
        longitude: mapLng,
        latitudeDelta: 0.004,
        longitudeDelta: 0.004,
    }

    if (isLoading || !event) return <Loading />

    const startDate = dayjs.utc(event.startsAt).local()
    const endDate = event.endsAt ? dayjs.utc(event.endsAt).local() : null
    const dateLabel = startDate.locale('es').format('ddd, D MMM')
    const timeLabel = `${startDate.format('HH:mm')}${endDate ? ` – ${endDate.format('HH:mm')}` : ''}`
    const isLive = dayjs().isAfter(startDate) && (!endDate || dayjs().isBefore(endDate))
    const locationLabel = event.location
        ? [event.location.name, event.location.city].filter(Boolean).join(', ') || event.location.address || 'Ubicación'
        : 'Ubicación por confirmar'

    const onShare = async () => {
        try {
            await Share.share({ message: `¡Mira este evento en Forevent: ${event.name}!` })
        } catch (error) {
            console.log(error)
        }
    }

    const onOpenGoogleMaps = () => {
        const url = `https://www.google.com/maps/search/?api=1&query=${mapLat},${mapLng}`
        Linking.openURL(url)
    }

    const onBuyTicket = () => {
        router.push({
            pathname: '/(app)/home/event/[eventId]/tickets/',
            params: { eventId: eventId! },
        })
    }

    return (
        <View style={styles.container}>
            <StatusBar style="light" />

            <ScrollView bounces={false} contentContainerStyle={{ paddingBottom: 120 }}>
                {/* --- HERO SECTION --- */}
                <View style={styles.heroContainer}>
                    <ImageBackground
                        source={{ uri: event.image ?? PLACEHOLDER }}
                        placeholder={blurhash}
                        style={styles.heroImage}
                        contentFit="cover"
                    >
                        <LinearGradient
                            colors={['transparent', 'rgba(10,10,10,0.5)', C.bg]}
                            style={styles.heroGradient}
                        />

                        {/* Header Buttons */}
                        <View style={styles.headerNav}>
                            <Pressable onPress={() => router.back()} style={styles.navBtn}>
                                <Ionicons name="chevron-back" size={24} color="#fff" />
                            </Pressable>
                            <View style={{ flexDirection: 'row', gap: 12 }}>
                                <Pressable style={styles.navBtn}><Ionicons name="heart-outline" size={22} color="#fff" /></Pressable>
                                <Pressable onPress={onShare} style={styles.navBtn}><Ionicons name="share-outline" size={22} color="#fff" /></Pressable>
                            </View>
                        </View>

                        {/* Event Basic Info Overlay */}
                        <View style={styles.heroBottomInfo}>
                            {isLive && (
                                <View style={styles.liveBadge}>
                                    <View style={styles.liveDot} />
                                    <Text style={styles.liveText}>EVENTO EN VIVO</Text>
                                </View>
                            )}
                            <Text style={styles.eventTitle}>{event.name}</Text>
                            <View style={styles.row}>
                                <Ionicons name="calendar-clear-outline" size={16} color={C.magenta} />
                                <Text style={styles.infoText}>{dateLabel} • {timeLabel}</Text>
                            </View>
                        </View>
                    </ImageBackground>
                </View>

                {/* --- CONTENT --- */}
                <View style={styles.contentPadding}>
                    {/* Sección Sobre el Evento */}
                    <Text style={styles.sectionTitle}>Sobre el Evento</Text>
                    <Text style={styles.description}>{event.about || 'Sin descripción.'}</Text>

                    {/* Sección Ubicación con MAPA */}
                    <View style={styles.locationHeader}>
                        <Text style={styles.sectionTitle}>Ubicación</Text>
                        <Text style={styles.locationSub}>{locationLabel}</Text>
                    </View>

                    {mapRenders && (
                        <View style={styles.mapContainer}>
                            <MapView
                                style={styles.mapView}
                                provider={PROVIDER_GOOGLE}
                                initialRegion={initialRegion}
                                mapPadding={{ top: 10, right: 10, bottom: 60, left: 10 }}
                                scrollEnabled={true}
                                zoomEnabled={true}
                                zoomControlEnabled={true}
                                rotateEnabled={false}
                                pitchEnabled={false}
                                liteMode={false}
                            >
                                <Marker
                                    coordinate={{ latitude: mapLat, longitude: mapLng }}
                                    pinColor={C.magenta}
                                />
                            </MapView>
                            <Pressable style={styles.mapFab} onPress={onOpenGoogleMaps}>
                                <MaterialCommunityIcons name="directions" size={24} color="#fff" />
                                <Text style={styles.mapFabText}>Cómo llegar</Text>
                            </Pressable>
                        </View>
                    )}
                </View>
            </ScrollView>

            {/* --- FOOTER COMPRA --- */}
            <View style={styles.footer}>
                <Pressable style={styles.btnPrimary} onPress={onBuyTicket}>
                    <Text style={styles.btnPrimaryText}>Comprar Entrada</Text>
                    <Ionicons name="ticket-outline" size={20} color="#fff" />
                </Pressable>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: C.bg },
    heroContainer: { height: HERO_HEIGHT, width: '100%' },
    heroImage: { flex: 1 },
    heroGradient: { ...StyleSheet.absoluteFillObject },
    headerNav: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 50,
    },
    navBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.4)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    heroBottomInfo: {
        position: 'absolute',
        bottom: 20,
        left: 20,
        right: 20,
    },
    liveBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 0, 255, 0.2)',
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: C.magenta,
    },
    liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.magenta, marginRight: 6 },
    liveText: { color: C.magenta, fontSize: 10, fontWeight: '800' },
    eventTitle: { color: '#fff', fontSize: 28, fontWeight: '900', marginBottom: 10 },
    row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    infoText: { color: '#ddd', fontSize: 14 },
    contentPadding: { paddingHorizontal: 20, paddingTop: 20 },
    sectionTitle: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 10 },
    description: { color: C.dim, fontSize: 14, lineHeight: 22, marginBottom: 25 },
    locationHeader: { marginBottom: 12 },
    locationSub: { color: C.dim, fontSize: 14 },
    mapContainer: {
        height: 300,
        minHeight: 300,
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: C.border,
        backgroundColor: C.card,
    },
    mapView: { ...StyleSheet.absoluteFillObject },
    mapFab: {
        position: 'absolute',
        bottom: 16,
        right: 16,
        backgroundColor: C.magenta,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 30,
        gap: 8,
        elevation: 5,
    },
    mapFabText: { color: '#fff', fontWeight: '700', fontSize: 13 },
    footer: {
        position: 'absolute',
        bottom: 0,
        width: '100%',
        padding: 20,
        paddingBottom: 40,
        backgroundColor: C.bg,
        borderTopWidth: 1,
        borderTopColor: C.border,
    },
    btnPrimary: {
        backgroundColor: C.magenta,
        height: 55,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
    },
    btnPrimaryText: { color: '#fff', fontSize: 16, fontWeight: '700' },
})