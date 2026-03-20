import Geolocation from '@react-native-community/geolocation'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { useFocusEffect, router } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import React, { useCallback, useRef, useState } from 'react'
import {
    ActivityIndicator,
    Animated,
    AppState,
    AppStateStatus,
    Image,
    Linking,
    PermissionsAndroid,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native'
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { api } from '~/utils/api'

type PermissionState = 'asking' | 'granted' | 'denied'

type CardEvent = {
    id: string
    name: string
    image: string | null
    startsAt: Date
    location: { name: string; address: string; city: string } | null
}

const DEFAULT_COORDS = { latitude: -26.8100, longitude: -65.2958 }

const FINE   = PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
const COARSE = PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION

function formatEventDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date
    return d.toLocaleDateString('es-AR', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
    })
}

async function androidHasLocation(): Promise<boolean> {
    const fine = await PermissionsAndroid.check(FINE)
    if (fine) return true
    return PermissionsAndroid.check(COARSE)
}

async function androidRequestLocation(): Promise<boolean> {
    const result = await PermissionsAndroid.request(FINE, {
        title: 'Permiso de ubicación',
        message: 'Forevent necesita tu ubicación para mostrar eventos cercanos.',
        buttonPositive: 'Aceptar',
        buttonNegative: 'Cancelar',
    })
    if (result === PermissionsAndroid.RESULTS.GRANTED) return true
    return PermissionsAndroid.check(COARSE)
}

export default function ExplorePage() {
    const insets = useSafeAreaInsets()
    const [permission, setPermission] = useState<PermissionState>('asking')
    const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null)
    const [usingFallback, setUsingFallback] = useState(false)
    const [selectedEvent, setSelectedEvent] = useState<CardEvent | null>(null)
    const permissionRef = useRef<PermissionState>('asking')
    const fallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const cardAnim = useRef(new Animated.Value(0)).current

    // cardAnim: 0 = oculta, 1 = visible
    const cardTranslateY = cardAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [300, 0],
    })

    function setPermState(s: PermissionState) {
        setPermission(s)
        permissionRef.current = s
    }

    function clearFallbackTimer() {
        if (fallbackTimerRef.current) {
            clearTimeout(fallbackTimerRef.current)
            fallbackTimerRef.current = null
        }
    }

    function showCard(event: CardEvent) {
        setSelectedEvent(event)
        cardAnim.stopAnimation()
        Animated.timing(cardAnim, {
            toValue: 1,
            duration: 250,
            useNativeDriver: true,
        }).start()
    }

    function hideCard() {
        Animated.timing(cardAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
        }).start(() => setSelectedEvent(null))
    }

    function fetchLocation() {
        clearFallbackTimer()

        fallbackTimerRef.current = setTimeout(() => {
            fallbackTimerRef.current = null
            console.log('[Explore] GPS sin respuesta en 10s, usando ubicación por defecto')
            setCoords(DEFAULT_COORDS)
            setUsingFallback(true)
            setPermState('granted')
        }, 10000)

        Geolocation.getCurrentPosition(
            (pos) => {
                clearFallbackTimer()
                setCoords({ latitude: pos.coords.latitude, longitude: pos.coords.longitude })
                setUsingFallback(false)
                setPermState('granted')
            },
            (err) => {
                clearFallbackTimer()
                console.log('[Explore] Geolocation error:', err.code, err.message)
                if (err.code === 1) {
                    setPermState('denied')
                } else {
                    setCoords(DEFAULT_COORDS)
                    setUsingFallback(true)
                    setPermState('granted')
                }
            },
            { enableHighAccuracy: false, timeout: 30000, maximumAge: 60000 },
        )
    }

    async function silentCheckAndLocate() {
        if (permissionRef.current === 'granted') return
        if (Platform.OS === 'android') {
            const has = await androidHasLocation()
            if (!has) return
        }
        fetchLocation()
    }

    async function verifyAndLocate() {
        if (Platform.OS === 'android') {
            const alreadyGranted = await androidHasLocation()
            if (alreadyGranted) {
                if (!coords) setPermState('asking')
                fetchLocation()
                return
            }
            setPermState('asking')
            const granted = await androidRequestLocation()
            if (!granted) {
                setPermState('denied')
                return
            }
        } else {
            Geolocation.requestAuthorization()
        }
        fetchLocation()
    }

    useFocusEffect(
        useCallback(() => {
            void verifyAndLocate()

            const handleAppState = (nextState: AppStateStatus) => {
                if (nextState === 'active') {
                    void silentCheckAndLocate()
                }
            }

            const sub = AppState.addEventListener('change', handleAppState)
            return () => {
                sub.remove()
                clearFallbackTimer()
            }
        // eslint-disable-next-line react-hooks/exhaustive-deps
        }, []),
    )

    const { data: events = [] } = api.mobile.event.nearby.useQuery(
        { latitude: coords?.latitude ?? 0, longitude: coords?.longitude ?? 0, radiusKm: 8 },
        { enabled: !!coords },
    )

    // --- Loading ---
    if (permission === 'asking') {
        return (
            <View style={[styles.centered, { paddingTop: insets.top }]}>
                <StatusBar style="light" />
                <ActivityIndicator color="#ff00ff" size="large" />
                <Text style={styles.loadingText}>Obteniendo ubicación...</Text>
            </View>
        )
    }

    // --- Permission Denied ---
    if (permission === 'denied') {
        return (
            <View style={[styles.centered, { paddingTop: insets.top }]}>
                <StatusBar style="light" />
                <MaterialCommunityIcons name="map-marker-off-outline" size={56} color="#ff00ff" />
                <Text style={styles.deniedTitle}>Permiso de ubicación denegado</Text>
                <Text style={styles.deniedSub}>
                    Habilitá el permiso de ubicación en la configuración del sistema para ver eventos cercanos.
                </Text>
                <Pressable style={styles.settingsBtn} onPress={() => Linking.openSettings()}>
                    <Text style={styles.settingsBtnText}>Ir a Configuración</Text>
                </Pressable>
            </View>
        )
    }

    // --- Map ---
    const initialRegion = {
        latitude: coords!.latitude,
        longitude: coords!.longitude,
        latitudeDelta: 0.08,
        longitudeDelta: 0.08,
    }

    return (
        <View style={styles.root}>
            <StatusBar style="light" />
            <MapView
                style={StyleSheet.absoluteFillObject}
                provider={PROVIDER_GOOGLE}
                initialRegion={initialRegion}
                showsUserLocation
                showsMyLocationButton={false}
                onPress={hideCard}
            >
                {events.map((event) => {
                    const lat = event.location?.latitude
                    const lng = event.location?.longitude
                    if (!lat || !lng) return null
                    const isSelected = selectedEvent?.id === event.id
                    return (
                        <Marker
                            key={event.id}
                            coordinate={{ latitude: lat, longitude: lng }}
                            onPress={() => showCard({
                                id: event.id,
                                name: event.name,
                                image: event.image ?? null,
                                startsAt: event.startsAt,
                                location: event.location
                                    ? {
                                        name: event.location.name,
                                        address: event.location.address,
                                        city: event.location.city,
                                    }
                                    : null,
                            })}
                        >
                            <View style={[styles.markerPin, isSelected && styles.markerPinSelected]}>
                                <View style={[styles.markerDot, isSelected && styles.markerDotSelected]} />
                            </View>
                        </Marker>
                    )
                })}
            </MapView>

            {/* Tarjeta de preview del evento seleccionado */}
            <Animated.View
                style={[
                    styles.eventCard,
                    { bottom: insets.bottom + 16 },
                    { transform: [{ translateY: cardTranslateY }], opacity: cardAnim },
                ]}
                pointerEvents={selectedEvent ? 'auto' : 'none'}
            >
                {selectedEvent && (
                    <>
                        <View style={styles.cardRow}>
                            <Image
                                source={
                                    selectedEvent.image
                                        ? { uri: selectedEvent.image }
                                        : require('../../../../../assets/icon.png')
                                }
                                style={styles.cardImage}
                                resizeMode="cover"
                            />
                            <View style={styles.cardInfo}>
                                <Text style={styles.cardName} numberOfLines={2}>
                                    {selectedEvent.name}
                                </Text>
                                <Text style={styles.cardDate}>
                                    {formatEventDate(selectedEvent.startsAt)}
                                </Text>
                                {selectedEvent.location && (
                                    <View style={styles.cardLocationRow}>
                                        <MaterialCommunityIcons
                                            name="map-marker-outline"
                                            size={13}
                                            color="rgba(255,255,255,0.5)"
                                        />
                                        <Text style={styles.cardLocation} numberOfLines={1}>
                                            {selectedEvent.location.name}
                                            {selectedEvent.location.city
                                                ? `, ${selectedEvent.location.city}`
                                                : ''}
                                        </Text>
                                    </View>
                                )}
                            </View>
                        </View>
                        <Pressable
                            style={({ pressed }) => [
                                styles.cardBtn,
                                pressed && styles.cardBtnPressed,
                            ]}
                            onPress={() => {
                                const id = selectedEvent.id
                                hideCard()
                                router.push('/(app)/home/event/' + id)
                            }}
                        >
                            <Text style={styles.cardBtnText}>Ver evento</Text>
                        </Pressable>
                    </>
                )}
            </Animated.View>

            {/* Banner de fallback — solo visible cuando no hay tarjeta abierta */}
            {usingFallback && !selectedEvent && (
                <View style={[styles.fallbackBanner, { bottom: insets.bottom + 16 }]}>
                    <MaterialCommunityIcons name="map-marker-alert-outline" size={16} color="#ffcc00" />
                    <Text style={styles.fallbackText}>
                        No se pudo obtener tu ubicación. Mostrando ubicación por defecto.
                    </Text>
                </View>
            )}
        </View>
    )
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: '#0d1233',
    },
    centered: {
        flex: 1,
        backgroundColor: '#0d1233',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        paddingHorizontal: 32,
    },
    loadingText: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 14,
    },
    deniedTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
        textAlign: 'center',
    },
    deniedSub: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 22,
    },
    settingsBtn: {
        backgroundColor: '#7c3aed',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
        marginTop: 8,
    },
    settingsBtnText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 15,
    },
    // Marker
    markerPin: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: 'rgba(255,0,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    markerPinSelected: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.25)',
    },
    markerDot: {
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: '#ff00ff',
    },
    markerDotSelected: {
        width: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: '#ffffff',
    },
    // Event card
    eventCard: {
        position: 'absolute',
        left: 16,
        right: 16,
        backgroundColor: '#1a2050',
        borderRadius: 16,
        padding: 14,
        gap: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 8,
    },
    cardRow: {
        flexDirection: 'row',
        gap: 12,
    },
    cardImage: {
        width: 72,
        height: 72,
        borderRadius: 10,
        backgroundColor: '#0d1233',
    },
    cardInfo: {
        flex: 1,
        gap: 4,
        justifyContent: 'center',
    },
    cardName: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '700',
        lineHeight: 20,
    },
    cardDate: {
        color: '#ff00ff',
        fontSize: 12,
        fontWeight: '600',
    },
    cardLocationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
    },
    cardLocation: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 12,
        flex: 1,
    },
    cardBtn: {
        backgroundColor: '#ff00ff',
        borderRadius: 10,
        paddingVertical: 10,
        alignItems: 'center',
    },
    cardBtnPressed: {
        opacity: 0.75,
    },
    cardBtnText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 14,
    },
    // Fallback banner
    fallbackBanner: {
        position: 'absolute',
        left: 16,
        right: 16,
        backgroundColor: 'rgba(0,0,0,0.75)',
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 10,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    fallbackText: {
        color: '#ffcc00',
        fontSize: 12,
        flex: 1,
    },
})
