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
import { StatusBar } from 'expo-status-bar'
import React, { useState } from 'react'
import {
    ActivityIndicator,
    FlatList,
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
import { api } from '~/utils/api'

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
}

// ─── Category pills ─────────────────────────────────────────────────────────────
const CATEGORIES = [
    { id: 'ALL',     label: 'Todos los Eventos' },
    { id: 'FIESTAS', label: 'Fiestas' },
    { id: 'BARES',   label: 'Bares' },
    { id: 'CULTURA', label: 'Cultural' },
]

export default function Page() {
    const insets = useSafeAreaInsets()
    const [search, setSearch]     = useState('')
    const [activeTab, setActiveTab] = useState('ALL')

    const events = api.mobile.event.highlighted.useQuery({ latitude: 0, longitude: 0 })

    const isLoading  = events.isLoading
    const isRefresh  = events.isFetching && !events.isLoading
    const data       = events.data ?? []

    return (
        <View style={[styles.root, { backgroundColor: C.bg }]}>
            <StatusBar style="light" animated translucent backgroundColor="transparent" />

            {/* ── FIXED HEADER ── */}
            <View style={[styles.header, { paddingTop: insets.top + 6 }]}>

                {/* Row 1: hamburger – title – bell */}
                <View style={styles.topRow}>
                    <Pressable hitSlop={8}>
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
                    />
                    <Pressable hitSlop={8}>
                        <MaterialCommunityIcons name="tune-variant" size={18} color={C.dim} />
                    </Pressable>
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
                                onPress={() => setActiveTab(cat.id)}
                                style={[
                                    styles.pill,
                                    active ? styles.pillActive : styles.pillInactive,
                                ]}
                            >
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
                    data={data}
                    keyExtractor={(item, idx) => item.id ?? idx.toString()}
                    refreshControl={
                        <RefreshControl
                            refreshing={isRefresh}
                            onRefresh={() => events.refetch()}
                            tintColor={C.magenta}
                        />
                    }
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.listContent}
                    ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
                    ListHeaderComponent={() => (
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Eventos Destacados</Text>
                            <Pressable hitSlop={6}>
                                <Text style={styles.seeAll}>Ver todos</Text>
                            </Pressable>
                        </View>
                    )}
                    ListEmptyComponent={() => (
                        <View style={styles.center}>
                            <Text style={styles.emptyText}>
                                No hay eventos disponibles en tu área
                            </Text>
                        </View>
                    )}
                    ListFooterComponent={() => <View style={{ height: 24 }} />}
                    renderItem={({ item, index }) => (
                        <EventCardHighlighted item={item} index={index} />
                    )}
                />
            )}
        </View>
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
})
