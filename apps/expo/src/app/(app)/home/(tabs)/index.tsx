/**
 * Home — Eventos Destacados
 * Réplica del diseño Stitch/Principal.png
 *
 * Layout:
 *   ┌──────────────────────────────────────┐
 *   │  ≡  Forevent                    🔔   │  ← Header
 *   │  🔍 Buscar eventos, bares...  [ = ]  │  ← Search bar
 *   │  [Todos los Eventos] [Fiestas] [Bares]│  ← Category pills
 *   ├──────────────────────────────────────┤
 *   │  Eventos Destacados        Ver todos  │
 *   │  ┌──────────────────────────────────┐│
 *   │  │  Card 1                          ││
 *   │  └──────────────────────────────────┘│
 *   │  ┌──────────────────────────────────┐│
 *   │  │  Card 2                          ││
 *   │  └──────────────────────────────────┘│
 *   └──────────────────────────────────────┘
 */

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import Constants from 'expo-constants'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import { router } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import React, { useEffect, useRef, useState } from 'react'
import {
    ActivityIndicator,
    Alert,
    Animated,
    Dimensions,
    Easing,
    FlatList,
    Linking,
    Modal,
    Platform,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Logo from '~/assets/logo'
import EventCardHighlighted from '~/components/EventCardHighlighted'
import { useSession } from '~/context/auth'
import { api } from '~/utils/api'
import { PLACEHOLDER, blurhash } from '~/utils/constants'

const { width: SCREEN_W } = Dimensions.get('window')
const DRAWER_W = Math.min(SCREEN_W * 0.82, 340)

// ─── Brand palette ─────────────────────────────────────────────────────────────
const C = {
    bg:         '#0d1233',    // dark navy — fondo principal
    surface:    '#131c3e',    // superficie ligeramente más clara
    card:       '#111827',
    border:     'rgba(255,255,255,0.10)',
    magenta:    '#ff00ff',
    white:      '#ffffff',
    dim:        'rgba(255,255,255,0.50)',
    inputBg:    'rgba(255,255,255,0.07)',
    activePill: '#7c3aed',    // purple activo de la pill
    purple:     '#8b5cf6',
    danger:     '#ff5470',
    dangerBg:   'rgba(255,84,112,0.12)',
}

// ─── Category pills ─────────────────────────────────────────────────────────────
const CATEGORIES = [
    { id: 'ALL',       label: 'Todos los Eventos' },
    { id: 'FAVORITOS', label: 'Favoritos', icon: 'heart' as const },
    { id: 'FIESTAS',   label: 'Fiestas' },
    { id: 'BARES',     label: 'Bares' },
    { id: 'CULTURA',   label: 'Cultural' },
]

export default function Page() {
    const insets = useSafeAreaInsets()
    const { user, signOut, session, activeRole, setActiveRole } = useSession()
    const [search, setSearch]       = useState('')
    const [activeTab, setActiveTab] = useState<'ALL' | 'FAVORITOS' | 'FIESTAS' | 'BARES' | 'CULTURA'>('ALL')
    const [menuOpen, setMenuOpen]   = useState(false)

    // ─── Drawer animation ─────────────────────────────────────────────────────
    const slideAnim = useRef(new Animated.Value(-DRAWER_W)).current
    const fadeAnim  = useRef(new Animated.Value(0)).current

    useEffect(() => {
        if (menuOpen) {
            Animated.parallel([
                Animated.timing(slideAnim, { toValue: 0, duration: 240, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
                Animated.timing(fadeAnim,  { toValue: 1, duration: 240, useNativeDriver: true }),
            ]).start()
        } else {
            Animated.parallel([
                Animated.timing(slideAnim, { toValue: -DRAWER_W, duration: 180, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
                Animated.timing(fadeAnim,  { toValue: 0, duration: 180, useNativeDriver: true }),
            ]).start()
        }
    }, [menuOpen])

    // ─── Logout ───────────────────────────────────────────────────────────────
    const signoutMutation = api.mobile.auth.logout.useMutation({
        onSettled: () => {
            signOut()
        },
    })

    function handleLogout() {
        Alert.alert(
            'Cerrar sesión',
            '¿Estás seguro de que querés salir?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Salir',
                    style: 'destructive',
                    onPress: () => {
                        if (user?.id && session) {
                            signoutMutation.mutate({ userId: user.id, sessionId: session })
                        } else {
                            signOut()
                        }
                    },
                },
            ],
        )
    }

    function navigateAndClose(fn: () => void) {
        setMenuOpen(false)
        setTimeout(fn, 180)
    }

    const appVersion = (Constants.expoConfig?.version as string | undefined) ?? '0.1.0'

    const highlighted = api.mobile.event.highlighted.useQuery(
        { latitude: 0, longitude: 0 },
        {
            staleTime: 0,
            refetchOnMount: 'always',
            refetchOnWindowFocus: true,
            enabled: activeTab !== 'ALL' && activeTab !== 'FAVORITOS',
        }
    )

    const allEvents = api.mobile.event.all.useQuery(undefined, {
        staleTime: 0,
        refetchOnMount: 'always',
        refetchOnWindowFocus: true,
        enabled: activeTab === 'ALL',
    })

    const favoritesQuery = api.mobile.event.listFavorites.useQuery(
        { userId: user?.id ?? '' },
        {
            enabled: activeTab === 'FAVORITOS' && !!user?.id,
            staleTime: 0,
            refetchOnMount: 'always',
            refetchOnWindowFocus: true,
        }
    )

    const activeQuery =
        activeTab === 'ALL'        ? allEvents :
        activeTab === 'FAVORITOS'  ? favoritesQuery :
        /* else */                   highlighted

    const isLoading = activeQuery.isLoading
    const isRefresh = activeQuery.isFetching && !activeQuery.isLoading
    const data = activeQuery.data ?? []

    // ─── Search (client-side) ─────────────────────────────────────────────────
    const filteredData = React.useMemo(() => {
        const norm = (s: string | null | undefined) =>
            (s ?? '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        const q = norm(search).trim()
        if (!q) return data
        const terms = q.split(/\s+/).filter(Boolean)
        return data.filter((e: any) => {
            const artistNames = Array.isArray(e.artists) ? e.artists.map((a: any) => a?.name) : []
            const hay = norm([
                e.name,
                e.about,
                e.location?.name,
                e.location?.address,
                e.location?.city,
                e.location?.country,
                ...artistNames,
            ].filter(Boolean).join(' | '))
            return terms.every((t) => hay.includes(t))
        })
    }, [data, search])

    const isSearching = search.trim().length > 0

    return (
        <View style={[styles.root, { backgroundColor: C.bg }]}>
            <StatusBar style="light" animated translucent backgroundColor="transparent" />

            {/* ── FIXED HEADER ── */}
            <View style={[styles.header, { paddingTop: insets.top + 6 }]}>

                {/* Row 1: hamburger – title – bell */}
                <View style={styles.topRow}>
                    <Pressable hitSlop={8} onPress={() => setMenuOpen(true)}>
                        <MaterialCommunityIcons name="menu" size={24} color={C.white} />
                    </Pressable>

                    <View style={styles.logoTitle}>
                        <View style={{ width: 22, height: 22 }}>
                            <Logo fill={C.white} />
                        </View>
                        <Text style={styles.brandName}>Forevent</Text>
                    </View>

                    <Pressable hitSlop={8}>
                        <MaterialCommunityIcons name="bell-outline" size={24} color={C.white} />
                    </Pressable>
                </View>

                {/* Row 2: search bar */}
                <View style={styles.searchBar}>
                    <MaterialCommunityIcons name="magnify" size={18} color={C.dim} />
                    <TextInput
                        value={search}
                        onChangeText={setSearch}
                        placeholder="Buscar eventos, bares, conciertos..."
                        placeholderTextColor={C.dim}
                        style={styles.searchInput}
                        returnKeyType="search"
                        autoCorrect={false}
                        autoCapitalize="none"
                        clearButtonMode="never"
                    />
                    {isSearching ? (
                        <Pressable hitSlop={8} onPress={() => setSearch('')}>
                            <MaterialCommunityIcons name="close-circle" size={18} color={C.dim} />
                        </Pressable>
                    ) : (
                        <Pressable hitSlop={8}>
                            <MaterialCommunityIcons name="tune-variant" size={18} color={C.dim} />
                        </Pressable>
                    )}
                </View>

                {/* Row 3: category pills */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.pillsRow}
                >
                    {CATEGORIES.map(cat => {
                        const active = activeTab === cat.id
                        return (
                            <Pressable
                                key={cat.id}
                                onPress={() => setActiveTab(cat.id as typeof activeTab)}
                                style={[
                                    styles.pill,
                                    active ? styles.pillActive : styles.pillInactive,
                                    cat.icon ? styles.pillWithIcon : null,
                                ]}
                            >
                                {cat.icon && (
                                    <MaterialCommunityIcons
                                        name={cat.icon}
                                        size={13}
                                        color={active ? C.white : C.magenta}
                                    />
                                )}
                                <Text style={[styles.pillText, active && styles.pillTextActive]}>
                                    {cat.label}
                                </Text>
                            </Pressable>
                        )
                    })}
                </ScrollView>
            </View>

            {/* ── CONTENT ── */}
            {isLoading ? (
                <View style={styles.center}>
                    <ActivityIndicator color={C.magenta} size="large" />
                </View>
            ) : (
                <FlatList
                    data={filteredData}
                    keyExtractor={(item, idx) => item.id ?? idx.toString()}
                    keyboardShouldPersistTaps="handled"
                    refreshControl={
                        <RefreshControl
                            refreshing={isRefresh}
                            onRefresh={() => activeQuery.refetch()}
                            tintColor={C.magenta}
                        />
                    }
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.listContent}
                    ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
                    ListHeaderComponent={() => {
                        const title = isSearching
                            ? `Resultados (${filteredData.length})`
                            : activeTab === 'FAVORITOS'
                                ? `Mis Favoritos (${filteredData.length})`
                                : 'Eventos Destacados'
                        return (
                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionTitle}>{title}</Text>
                                {!isSearching && activeTab !== 'FAVORITOS' && (
                                    <Pressable hitSlop={6}>
                                        <Text style={styles.seeAll}>Ver todos</Text>
                                    </Pressable>
                                )}
                            </View>
                        )
                    }}
                    ListEmptyComponent={() => {
                        const isFavs = activeTab === 'FAVORITOS'
                        const iconName = isSearching
                            ? 'magnify-close'
                            : isFavs
                                ? 'heart-outline'
                                : 'calendar-blank-outline'
                        const message = isSearching
                            ? `No encontramos eventos para "${search.trim()}"`
                            : isFavs
                                ? 'Todavía no marcaste eventos como favoritos. Tocá el corazón en cualquier evento para guardarlo acá.'
                                : 'No hay eventos disponibles en tu área'
                        return (
                            <View style={styles.center}>
                                <MaterialCommunityIcons
                                    name={iconName}
                                    size={40}
                                    color={C.dim}
                                    style={{ marginBottom: 10 }}
                                />
                                <Text style={styles.emptyText}>{message}</Text>
                            </View>
                        )
                    }}
                    ListFooterComponent={() => <View style={{ height: 24 }} />}
                    renderItem={({ item, index }) => (
                        <EventCardHighlighted item={item} index={index} />
                    )}
                />
            )}

            {/* ══════════ DRAWER MENU ══════════ */}
            <Modal
                visible={menuOpen}
                transparent
                animationType="none"
                onRequestClose={() => setMenuOpen(false)}
                statusBarTranslucent
            >
                <Animated.View style={[StyleSheet.absoluteFill, styles.drawerBackdrop, { opacity: fadeAnim }]}>
                    <Pressable style={StyleSheet.absoluteFill} onPress={() => setMenuOpen(false)} />
                </Animated.View>

                <Animated.View
                    style={[
                        styles.drawerPanel,
                        {
                            width: DRAWER_W,
                            paddingTop: insets.top + 18,
                            paddingBottom: insets.bottom + 16,
                            transform: [{ translateX: slideAnim }],
                        },
                    ]}
                >
                    {/* ── User header ── */}
                    <View style={styles.drawerUserHeader}>
                        <View style={styles.drawerAvatarWrap}>
                            <View style={styles.drawerAvatarGlow} />
                            <LinearGradient
                                colors={[C.magenta, C.purple]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.drawerAvatarRing}
                            >
                                <Image
                                    source={{ uri: user?.image ?? PLACEHOLDER }}
                                    placeholder={blurhash}
                                    contentFit="cover"
                                    style={styles.drawerAvatar}
                                />
                            </LinearGradient>
                        </View>
                        <Text style={styles.drawerUserName} numberOfLines={1}>
                            {user?.name ?? 'Invitado'}
                        </Text>
                        {!!user?.email && (
                            <Text style={styles.drawerUserEmail} numberOfLines={1}>
                                {user.email}
                            </Text>
                        )}
                        <View style={styles.drawerRolePill}>
                            <View style={styles.drawerRolePillDot} />
                            <Text style={styles.drawerRolePillText}>
                                {activeRole === 'EMPLOYEE' ? 'Modo empleado' : 'Modo usuario'}
                            </Text>
                        </View>
                    </View>

                    {/* ── Scrollable items ── */}
                    <ScrollView
                        style={styles.drawerScroll}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.drawerScrollContent}
                    >
                        <Text style={styles.drawerGroupLabel}>Cuenta</Text>
                        <View style={styles.drawerGroup}>
                            <DrawerItem
                                icon="account-outline"
                                label="Mi perfil"
                                tint="magenta"
                                onPress={() => navigateAndClose(() => router.push('/(app)/home/(tabs)/profile'))}
                            />
                            <DrawerItem
                                icon="ticket-confirmation-outline"
                                label="Mis entradas"
                                tint="magenta"
                                onPress={() => navigateAndClose(() => router.push('/(app)/home/(tabs)/ticket'))}
                            />
                            <DrawerItem
                                icon="gift-outline"
                                label="Regalos recibidos"
                                tint="magenta"
                                onPress={() => navigateAndClose(() => router.push('/(app)/home/gift'))}
                            />
                            <DrawerItem
                                icon="map-outline"
                                label="Explorar mapa"
                                tint="magenta"
                                last
                                onPress={() => navigateAndClose(() => router.push('/(app)/home/(tabs)/explore'))}
                            />
                        </View>

                        <Text style={styles.drawerGroupLabel}>Organización</Text>
                        <View style={styles.drawerGroup}>
                            <DrawerItem
                                icon="briefcase-outline"
                                label="Mis organizaciones"
                                tint="purple"
                                onPress={() => navigateAndClose(() => router.push('/(app)/settings/guilds'))}
                            />
                            <DrawerItem
                                icon="swap-horizontal"
                                label={activeRole === 'EMPLOYEE' ? 'Cambiar a modo Usuario' : 'Cambiar a modo Empleado'}
                                tint="purple"
                                last
                                onPress={() => navigateAndClose(() => router.push('/(app)/role-selection'))}
                            />
                        </View>

                        <Text style={styles.drawerGroupLabel}>General</Text>
                        <View style={styles.drawerGroup}>
                            <DrawerItem
                                icon="cog-outline"
                                label="Ajustes"
                                tint="neutral"
                                onPress={() => navigateAndClose(() => router.push('/(app)/settings'))}
                            />
                            <DrawerItem
                                icon="help-circle-outline"
                                label="Ayuda y soporte"
                                tint="neutral"
                                onPress={() =>
                                    Linking.openURL('mailto:soporte@forevent.com.ar?subject=Soporte%20Forevent%20App')
                                        .catch(() => Alert.alert('Soporte', 'Escribinos a soporte@forevent.com.ar'))
                                }
                            />
                            <DrawerItem
                                icon="information-outline"
                                label="Acerca de Forevent"
                                tint="neutral"
                                last
                                onPress={() =>
                                    Alert.alert(
                                        'Forevent',
                                        `Versión ${appVersion}\n\n© ${new Date().getFullYear()} Forevent. Todos los derechos reservados.`,
                                        [{ text: 'OK' }]
                                    )
                                }
                            />
                        </View>

                        <View style={styles.drawerGroup}>
                            <DrawerItem
                                icon="logout"
                                label="Cerrar sesión"
                                tint="danger"
                                last
                                onPress={handleLogout}
                            />
                        </View>
                    </ScrollView>

                    <Text style={styles.drawerVersion}>v{appVersion}</Text>
                </Animated.View>
            </Modal>
        </View>
    )
}

// ─── Drawer row ────────────────────────────────────────────────────────────────
const TINTS = {
    magenta: { bg: 'rgba(255,0,255,0.14)', fg: C.magenta },
    purple:  { bg: 'rgba(139,92,246,0.16)', fg: C.purple },
    neutral: { bg: 'rgba(255,255,255,0.07)', fg: C.dim },
    danger:  { bg: C.dangerBg, fg: C.danger },
} as const

function DrawerItem({
    icon,
    label,
    onPress,
    tint = 'neutral',
    last,
}: {
    icon: React.ComponentProps<typeof MaterialCommunityIcons>['name']
    label: string
    onPress: () => void
    tint?: keyof typeof TINTS
    last?: boolean
}) {
    const isDanger = tint === 'danger'
    const { bg, fg } = TINTS[tint]
    // NativeWind v4 no invoca la forma de función de `style` (nativewind#1105):
    // los estilos se descartan y la fila cae a layout de columna. Usamos la forma
    // de array con estado propio para el feedback de pulsado.
    const [pressed, setPressed] = useState(false)
    return (
        <Pressable
            onPress={onPress}
            onPressIn={() => setPressed(true)}
            onPressOut={() => setPressed(false)}
            style={[
                styles.drawerItem,
                !last && styles.drawerItemBorder,
                pressed && { backgroundColor: 'rgba(255,255,255,0.05)' },
            ]}
            android_ripple={{ color: 'rgba(255,255,255,0.08)' }}
        >
            <View style={[styles.drawerItemIconChip, { backgroundColor: bg }]}>
                <MaterialCommunityIcons name={icon} size={16} color={fg} />
            </View>
            <Text style={[styles.drawerItemText, isDanger && { color: C.danger }]}>
                {label}
            </Text>
            {!isDanger && (
                <MaterialCommunityIcons name="chevron-right" size={18} color={C.dim} />
            )}
        </Pressable>
    )
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
    },

    // ── Header
    header: {
        backgroundColor: C.bg,
        paddingHorizontal: 16,
        paddingBottom: 8,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: C.border,
        gap: 12,
    },
    topRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    logoTitle: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    brandName: {
        color: C.white,
        fontSize: 18,
        fontWeight: '700',
        letterSpacing: 0.3,
    },

    // Search
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: C.inputBg,
        borderRadius: 12,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: C.border,
        paddingHorizontal: 12,
        paddingVertical: Platform.OS === 'ios' ? 10 : 6,
        gap: 8,
    },
    searchInput: {
        flex: 1,
        color: C.white,
        fontSize: 14,
        padding: 0,
    },

    // Pills
    pillsRow: {
        flexDirection: 'row',
        gap: 8,
        paddingBottom: 4,
    },
    pill: {
        borderRadius: 50,
        paddingHorizontal: 16,
        paddingVertical: 7,
        borderWidth: 1,
    },
    pillWithIcon: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    pillActive: {
        backgroundColor: C.activePill,
        borderColor: C.activePill,
    },
    pillInactive: {
        backgroundColor: 'transparent',
        borderColor: C.border,
    },
    pillText: {
        color: C.dim,
        fontSize: 13,
        fontWeight: '600',
    },
    pillTextActive: {
        color: C.white,
    },

    // List
    listContent: {
        paddingTop: 20,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        marginBottom: 14,
    },
    sectionTitle: {
        color: C.white,
        fontSize: 18,
        fontWeight: '700',
    },
    seeAll: {
        color: C.magenta,
        fontSize: 13,
        fontWeight: '600',
    },

    // States
    center: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 60,
    },
    emptyText: {
        color: C.dim,
        fontSize: 14,
        textAlign: 'center',
        paddingHorizontal: 32,
    },

    // ── Drawer menu
    drawerBackdrop: {
        backgroundColor: 'rgba(0,0,0,0.55)',
    },
    drawerPanel: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        backgroundColor: C.bg,
        borderRightWidth: StyleSheet.hairlineWidth,
        borderRightColor: C.border,
        shadowColor: '#000',
        shadowOpacity: 0.4,
        shadowRadius: 16,
        shadowOffset: { width: 4, height: 0 },
        elevation: 16,
    },
    drawerUserHeader: {
        paddingHorizontal: 20,
        paddingBottom: 18,
        gap: 6,
    },
    drawerAvatarWrap: {
        width: 64,
        height: 64,
        marginBottom: 12,
    },
    drawerAvatarGlow: {
        position: 'absolute',
        top: -8,
        left: -8,
        right: -8,
        bottom: -8,
        borderRadius: 40,
        backgroundColor: 'rgba(255,0,255,0.22)',
    },
    drawerAvatarRing: {
        width: 64,
        height: 64,
        borderRadius: 32,
        padding: 2.5,
    },
    drawerAvatar: {
        width: '100%',
        height: '100%',
        borderRadius: 29,
        backgroundColor: C.surface,
    },
    drawerUserName: {
        color: C.white,
        fontSize: 18,
        fontWeight: '700',
        letterSpacing: 0.1,
    },
    drawerUserEmail: {
        color: C.dim,
        fontSize: 12,
        marginTop: 1,
    },
    drawerRolePill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        alignSelf: 'flex-start',
        marginTop: 9,
        paddingHorizontal: 10,
        paddingVertical: 5,
        backgroundColor: 'rgba(255,0,255,0.12)',
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: 'rgba(255,0,255,0.30)',
        borderRadius: 50,
    },
    drawerRolePillDot: {
        width: 5,
        height: 5,
        borderRadius: 3,
        backgroundColor: C.magenta,
    },
    drawerRolePillText: {
        color: C.magenta,
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 0.2,
    },
    drawerScroll: {
        flex: 1,
    },
    drawerScrollContent: {
        paddingTop: 4,
        paddingHorizontal: 16,
        paddingBottom: 6,
    },
    drawerGroupLabel: {
        color: 'rgba(255,255,255,0.32)',
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 0.7,
        textTransform: 'uppercase',
        marginBottom: 8,
        marginLeft: 4,
    },
    drawerGroup: {
        backgroundColor: C.surface,
        borderRadius: 16,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: C.border,
        overflow: 'hidden',
        marginBottom: 20,
    },
    drawerItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
    },
    drawerItemBorder: {
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: 'rgba(255,255,255,0.06)',
    },
    drawerItemIconChip: {
        width: 30,
        height: 30,
        borderRadius: 9,
        alignItems: 'center',
        justifyContent: 'center',
    },
    drawerItemText: {
        flex: 1,
        color: C.white,
        fontSize: 14,
        fontWeight: '500',
    },
    drawerVersion: {
        color: C.dim,
        fontSize: 10,
        textAlign: 'center',
        paddingHorizontal: 20,
        paddingTop: 6,
        letterSpacing: 0.5,
    },
})
