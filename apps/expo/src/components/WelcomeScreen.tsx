/**
 * WelcomeScreen — Pantalla de bienvenida Forevent
 *
 * Diseño basado en:
 *   · Manual de Marca Forevent app final.pdf
 *     - Tipografía: Montserrat medium / bold  (pág. 6)
 *     - Paleta RGB: #ffa300 · #002447 · #13a8fe · #ff00ff · #411377 · #2b2b2b  (pág. 7)
 *   · Estilo visual de VARIAS.jpg
 *     - Fondo negro (#0a0a0a) con orbes brillantes difusos
 *     - CTAs sólidos magenta (#ff00ff) estilo "COMPRAR"
 *     - Cards oscuras con borde sutil
 *
 * Persistencia: expo-secure-store  (no AsyncStorage)
 */

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import * as SecureStore from 'expo-secure-store'
import React, { useRef, useState } from 'react'
import {
    Animated,
    Dimensions,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Logo from '~/assets/logo'

// ─── Constante de clave SecureStore ─────────────────────────────────────────
export const HIDE_WELCOME_KEY = 'hideWelcome'

// ─── Paleta (Manual de Marca Forevent — pág. 7) ──────────────────────────────
const C = {
    // Primarios
    purple:   '#411377',
    magenta:  '#ff00ff',
    // Acento
    amber:    '#ffa300',
    // Secundarios
    blueDark: '#002447',
    blueLight:'#13a8fe',
    // Fondos
    bg:       '#2b2b2b',
    bgDeep:   '#0a0a0a',   // Fondo real de la app (ver VARIAS.jpg)
    // Texto
    white:    '#ffffff',
    whiteDim: 'rgba(255,255,255,0.60)',
    whiteFaint:'rgba(255,255,255,0.10)',
} as const

const { height: SCREEN_H } = Dimensions.get('window')

// ─── Slides de propuesta de valor ────────────────────────────────────────────
const FEATURES = [
    {
        icon: 'ticket-confirmation-outline' as const,
        title: 'Tus entradas, siempre contigo',
        desc:  'Todos tus tickets en un solo lugar, sin impresiones.',
        color: C.magenta,
    },
    {
        icon: 'map-search-outline' as const,
        title: 'Descubrí eventos cerca tuyo',
        desc:  'Conciertos, festivales y fiestas en tu ciudad.',
        color: C.blueLight,
    },
    {
        icon: 'shield-check-outline' as const,
        title: 'Acceso seguro y verificado',
        desc:  'Ingresá con código QR único, sin colas ni papeles.',
        color: C.amber,
    },
]

// ─── Props ────────────────────────────────────────────────────────────────────
interface WelcomeScreenProps {
    onContinue: () => void
}

// ─── Componente ───────────────────────────────────────────────────────────────
export default function WelcomeScreen({ onContinue }: WelcomeScreenProps) {
    const [doNotShow, setDoNotShow] = useState(false)
    const scaleAnim  = useRef(new Animated.Value(1)).current
    const glowAnim   = useRef(new Animated.Value(0.55)).current
    const glowAnim2  = useRef(new Animated.Value(0.35)).current

    // Orbe 1: magenta — pulso lento
    React.useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(glowAnim, { toValue: 0.9,  duration: 2200, useNativeDriver: true }),
                Animated.timing(glowAnim, { toValue: 0.55, duration: 2200, useNativeDriver: true }),
            ]),
        ).start()
    }, [])

    // Orbe 2: azul — pulso desfasado
    React.useEffect(() => {
        const timeout = setTimeout(() => {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(glowAnim2, { toValue: 0.65, duration: 2600, useNativeDriver: true }),
                    Animated.timing(glowAnim2, { toValue: 0.25, duration: 2600, useNativeDriver: true }),
                ]),
            ).start()
        }, 900)
        return () => clearTimeout(timeout)
    }, [])

    function onPressIn()  { Animated.spring(scaleAnim, { toValue: 0.96, useNativeDriver: true }).start() }
    function onPressOut() { Animated.spring(scaleAnim, { toValue: 1,    useNativeDriver: true }).start() }

    async function handleContinue() {
        if (doNotShow) {
            await SecureStore.setItemAsync(HIDE_WELCOME_KEY, 'true')
        }
        onContinue()
    }

    return (
        <View style={styles.bg}>
            {/* ── Orbes de fondo (estilo VARIAS.jpg) ── */}
            <Animated.View style={[styles.orb, styles.orbTopRight,  { opacity: glowAnim  }]} pointerEvents="none" />
            <Animated.View style={[styles.orb, styles.orbMidLeft,   { opacity: glowAnim2 }]} pointerEvents="none" />
            <Animated.View style={[styles.orb, styles.orbBottomMid, { opacity: glowAnim  }]} pointerEvents="none" />

            <SafeAreaView style={styles.root}>

                {/* ── HEADER ── */}
                <View style={styles.headerSection}>
                    {/* Badge "Nuevo" */}
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>✦ BIENVENIDO/A</Text>
                    </View>

                    {/* Logo con halo */}
                    <View style={styles.logoContainer}>
                        <View style={styles.logoHalo} pointerEvents="none" />
                        <View style={styles.logoWrapper}>
                            <Logo fill={C.white} />
                        </View>
                    </View>

                    <Text style={styles.brandName}>FOREVENT</Text>
                    <Text style={styles.tagline}>
                        La app de eventos que estabas{'\n'}esperando llegó.
                    </Text>
                </View>

                {/* ── FEATURES ── */}
                <View style={styles.featuresSection}>
                    {FEATURES.map((f, i) => (
                        <View key={i} style={styles.featureCard}>
                            {/* Indicador de color izquierdo */}
                            <View style={[styles.featureAccent, { backgroundColor: f.color }]} />
                            <View style={[styles.featureIconBg, { borderColor: f.color + '55' }]}>
                                <MaterialCommunityIcons name={f.icon} size={20} color={f.color} />
                            </View>
                            <View style={styles.featureTexts}>
                                <Text style={styles.featureTitle}>{f.title}</Text>
                                <Text style={styles.featureDesc}>{f.desc}</Text>
                            </View>
                        </View>
                    ))}
                </View>

                {/* ── BOTTOM ── */}
                <View style={styles.bottomSection}>
                    <View style={styles.divider} />

                    {/* Checkbox */}
                    <Pressable
                        style={styles.checkboxRow}
                        onPress={() => setDoNotShow(v => !v)}
                        hitSlop={10}
                    >
                        <View style={[styles.checkbox, doNotShow && styles.checkboxActive]}>
                            {doNotShow && (
                                <MaterialCommunityIcons name="check" size={12} color={C.white} />
                            )}
                        </View>
                        <Text style={styles.checkboxLabel}>
                            No volver a mostrar esta pantalla
                        </Text>
                    </Pressable>

                    {/* Botón CONTINUAR — estilo "COMPRAR" de VARIAS.jpg */}
                    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                        <Pressable
                            onPress={handleContinue}
                            onPressIn={onPressIn}
                            onPressOut={onPressOut}
                            style={styles.button}
                        >
                            <Text style={styles.buttonText}>CONTINUAR</Text>
                            <MaterialCommunityIcons name="arrow-right" size={18} color={C.white} />
                        </Pressable>
                    </Animated.View>

                    <Text style={styles.footer}>
                        Al continuar aceptás nuestros{' '}
                        <Text style={styles.footerLink}>Términos y condiciones</Text>
                    </Text>
                </View>

            </SafeAreaView>
        </View>
    )
}

// ─── Estilos ──────────────────────────────────────────────────────────────────
const ORB_SIZE = 300

const styles = StyleSheet.create({
    bg: {
        flex: 1,
        backgroundColor: C.bgDeep,   // #0a0a0a — igual que la app
    },
    root: {
        flex: 1,
        paddingHorizontal: 24,
        paddingBottom: 8,
        justifyContent: 'space-between',
    },

    // ── Orbes ──
    orb: {
        position: 'absolute',
        width: ORB_SIZE,
        height: ORB_SIZE,
        borderRadius: ORB_SIZE / 2,
    },
    orbTopRight: {
        top:   -ORB_SIZE * 0.35,
        right: -ORB_SIZE * 0.35,
        backgroundColor: C.magenta,
        // elevation/shadow para Android glow
        elevation: 0,
        shadowColor: C.magenta,
        shadowOpacity: 0.8,
        shadowRadius: 80,
        shadowOffset: { width: 0, height: 0 },
    },
    orbMidLeft: {
        top:  SCREEN_H * 0.38,
        left: -ORB_SIZE * 0.5,
        width: ORB_SIZE * 0.85,
        height: ORB_SIZE * 0.85,
        borderRadius: ORB_SIZE * 0.425,
        backgroundColor: C.blueLight,
        shadowColor: C.blueLight,
        shadowOpacity: 0.6,
        shadowRadius: 60,
        shadowOffset: { width: 0, height: 0 },
    },
    orbBottomMid: {
        bottom: -ORB_SIZE * 0.4,
        right:  -ORB_SIZE * 0.2,
        width: ORB_SIZE * 0.7,
        height: ORB_SIZE * 0.7,
        borderRadius: ORB_SIZE * 0.35,
        backgroundColor: C.purple,
        shadowColor: C.purple,
        shadowOpacity: 0.8,
        shadowRadius: 50,
        shadowOffset: { width: 0, height: 0 },
    },

    // ── Header ──
    headerSection: {
        alignItems: 'center',
        paddingTop: SCREEN_H * 0.035,
        gap: 0,
    },
    badge: {
        backgroundColor: 'rgba(255,0,255,0.18)',
        borderWidth: 1,
        borderColor: 'rgba(255,0,255,0.4)',
        borderRadius: 50,
        paddingHorizontal: 14,
        paddingVertical: 4,
        marginBottom: 20,
    },
    badgeText: {
        color: C.magenta,
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 2,
    },
    logoContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    logoHalo: {
        position: 'absolute',
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: C.magenta,
        opacity: 0.18,
        shadowColor: C.magenta,
        shadowOpacity: 1,
        shadowRadius: 40,
        shadowOffset: { width: 0, height: 0 },
        elevation: 0,
    },
    logoWrapper: {
        width: 72,
        height: 100,
    },
    brandName: {
        color: C.white,
        fontSize: 36,
        fontWeight: '900',
        letterSpacing: 5,
        textAlign: 'center',
        marginBottom: 8,
    },
    tagline: {
        color: C.whiteDim,
        fontSize: 14,
        fontWeight: '400',
        textAlign: 'center',
        lineHeight: 21,
        letterSpacing: 0.2,
        marginBottom: 4,
    },

    // ── Features ──
    featuresSection: {
        gap: 10,
    },
    featureCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
        paddingVertical: 11,
        paddingHorizontal: 14,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.07)',
        overflow: 'hidden',
    },
    featureAccent: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: 3,
        borderRadius: 2,
    },
    featureIconBg: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.07)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
    },
    featureTexts: {
        flex: 1,
        gap: 2,
    },
    featureTitle: {
        color: C.white,
        fontSize: 13,
        fontWeight: '700',
        letterSpacing: 0.1,
    },
    featureDesc: {
        color: C.whiteDim,
        fontSize: 11.5,
        lineHeight: 16,
        fontWeight: '400',
    },

    // ── Bottom ──
    bottomSection: {
        gap: 12,
    },
    divider: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: 'rgba(255,255,255,0.15)',
    },
    checkboxRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    checkbox: {
        width: 19,
        height: 19,
        borderRadius: 5,
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.35)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkboxActive: {
        backgroundColor: C.magenta,
        borderColor: C.magenta,
    },
    checkboxLabel: {
        color: C.whiteDim,
        fontSize: 12.5,
        flex: 1,
        fontWeight: '400',
    },

    // Botón sólido magenta — igual que "COMPRAR" en VARIAS.jpg
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: C.magenta,
        borderRadius: 50,
        paddingVertical: 15,
        shadowColor: C.magenta,
        shadowOpacity: 0.55,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 4 },
        elevation: 12,
    },
    buttonText: {
        color: C.white,
        fontWeight: '800',
        fontSize: 15,
        letterSpacing: 2.5,
    },
    footer: {
        textAlign: 'center',
        color: 'rgba(255,255,255,0.30)',
        fontSize: 10.5,
        marginBottom: 2,
        fontWeight: '400',
    },
    footerLink: {
        color: 'rgba(255,163,0,0.7)',   // amber del manual
        textDecorationLine: 'underline',
    },
})
