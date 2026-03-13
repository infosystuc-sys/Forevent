/**
 * Event Detail — Diseño premium
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
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps'

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

// Estilo oscuro para el mapa (JSON oficial de Google Maps Retro/Dark)
const DARK_MAP_STYLE = [
    { "elementType": "geometry", "stylers": [{ "color": "#212121" }] },
    { "elementType": "labels.icon", "stylers": [{ "visibility": "off" }] },
    { "elementType": "labels.text.fill", "stylers": [{ "color": "#757575" }] },
    { "elementType": "labels.text.stroke", "stylers": [{ "color": "#212121" }] },
    { "featureType": "administrative", "elementType": "geometry", "stylers": [{ "color": "#757575" }] },
    { "featureType": "poi", "elementType": "geometry", "stylers": [{ "color": "#181818" }] },
    { "featureType": "road", "elementType": "geometry.fill", "stylers": [{ "color": "#2c2c2c" }] },
    { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#000000" }] }
]

export default function EventDetailScreen() {
    const { eventId } = useLocalSearchParams()
    const [selectedTicket, setSelectedTicket] = useState('general')

    // Datos simulados (Yerba Buena, Tucumán)
    const eventData = {
        title: 'Neon Nights Festival 2024',
        locationName: 'Yerba Buena, Tucumán',
        lat: -26.8167,
        lng: -65.2833,
        description: 'Prepárate para la experiencia audiovisual más impactante del año. Un despliegue de luces neon, sonido inmersivo y los mejores exponentes del techno melódico en un entorno natural único.',
    }

    const initialRegion = {
        latitude: eventData.lat,
        longitude: eventData.lng,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
    }

    const onShare = async () => {
        try {
            await Share.share({ message: `¡Mira este evento en Forevent: ${eventData.title}!` })
        } catch (error) {
            console.log(error)
        }
    }

    const onOpenGoogleMaps = () => {
        // Corrección de URL: Se elimina el "0" sobrante que causaba error en Android
        const url = `https://www.google.com/maps/search/?api=1&query=${eventData.lat},${eventData.lng}`
        Linking.openURL(url)
    }

    return (
        <View style={styles.container}>
            <StatusBar style="light" />

            <ScrollView bounces={false} contentContainerStyle={{ paddingBottom: 120 }}>
                {/* --- HERO SECTION --- */}
                <View style={styles.heroContainer}>
                    <ImageBackground
                        source={{ uri: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?q=80&w=2070' }}
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
                            <View style={styles.liveBadge}>
                                <View style={styles.liveDot} />
                                <Text style={styles.liveText}>EVENTO EN VIVO</Text>
                            </View>
                            <Text style={styles.eventTitle}>{eventData.title}</Text>
                            <View style={styles.row}>
                                <Ionicons name="calendar-clear-outline" size={16} color={C.magenta} />
                                <Text style={styles.infoText}>Vie, 25 Oct • 22:00 – 04:00</Text>
                            </View>
                        </View>
                    </ImageBackground>
                </View>

                {/* --- CONTENT --- */}
                <View style={styles.contentPadding}>
                    
                    {/* Sección Sobre el Evento */}
                    <Text style={styles.sectionTitle}>Sobre el Evento</Text>
                    <Text style={styles.description}>{eventData.description}</Text>

                    {/* Sección Ubicación con MAPA */}
                    <View style={styles.locationHeader}>
                        <Text style={styles.sectionTitle}>Ubicación</Text>
                        <Text style={styles.locationSub}>{eventData.locationName}</Text>
                    </View>

                    <View style={styles.mapContainer}>
                        <MapView
                            style={styles.mapView}
                            provider={PROVIDER_GOOGLE}
                            initialRegion={initialRegion}
                            scrollEnabled={false}
                            zoomEnabled={false}
                            rotateEnabled={false}
                            pitchEnabled={false}
                            customMapStyle={DARK_MAP_STYLE}
                        >
                            <Marker
                                coordinate={{ latitude: eventData.lat, longitude: eventData.lng }}
                                pinColor={C.magenta}
                            />
                        </MapView>
                        
                        {/* FAB para abrir Maps externo */}
                        <Pressable style={styles.mapFab} onPress={onOpenGoogleMaps}>
                            <MaterialCommunityIcons name="directions" size={24} color="#fff" />
                            <Text style={styles.mapFabText}>Cómo llegar</Text>
                        </Pressable>
                    </View>

                </View>
            </ScrollView>

            {/* --- FOOTER COMPRA --- */}
            <View style={styles.footer}>
                <Pressable style={styles.btnPrimary}>
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
        height: 200,
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: C.border,
        backgroundColor: C.card,
    },
    mapView: { ...StyleSheet.absoluteFillObject },
    mapFab: {
        position: 'absolute',
        bottom: 12,
        right: 12,
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