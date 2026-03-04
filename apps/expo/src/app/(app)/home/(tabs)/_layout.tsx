/**
 * Tab bar — 5 tabs con FAB central, réplica del diseño Stitch/Principal.png
 *
 *  Inicio  |  Mapa  |  [＋]  |  Entradas  |  Perfil
 *
 * NOTA: `href` y `tabBarButton` no pueden usarse juntos en Expo Router.
 * El FAB usa su propia screen `add` con `tabBarButton` para renderizar
 * el botón circular sin conflictos.
 */

import { Fontisto, MaterialCommunityIcons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { Tabs } from 'expo-router/tabs'
import React from 'react'
import { Pressable, StyleSheet, Text } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

// ─── Brand colors ──────────────────────────────────────────────────────────────
const C = {
    bg:       '#0d1233',
    active:   '#ff00ff',
    inactive: 'rgba(255,255,255,0.40)',
    fab:      '#7c3aed',
    border:   'rgba(255,255,255,0.08)',
}

// ─── FAB central (botón circular "＋") ────────────────────────────────────────
function FabButton() {
    return (
        <Pressable
            style={styles.fab}
            onPress={() =>
                router.push({
                    pathname: '/(app)/home/[category]',
                    params: { category: 'TRENDING' },
                })
            }
            hitSlop={6}
        >
            <MaterialCommunityIcons name="plus" size={28} color="#fff" />
        </Pressable>
    )
}

// ─── Etiqueta de tab ───────────────────────────────────────────────────────────
function TabLabel({ label, focused }: { label: string; focused: boolean }) {
    return (
        <Text style={[styles.label, { color: focused ? C.active : C.inactive }]}>
            {label}
        </Text>
    )
}

export default function AppLayout() {
    const insets = useSafeAreaInsets()

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: C.bg,
                    borderTopColor: C.border,
                    borderTopWidth: StyleSheet.hairlineWidth,
                    height: 56 + insets.bottom,
                    paddingBottom: insets.bottom,
                },
                tabBarActiveTintColor:   C.active,
                tabBarInactiveTintColor: C.inactive,
            }}
        >
            {/* ── Inicio ── */}
            <Tabs.Screen
                name="index"
                options={{
                    tabBarShowLabel: true,
                    tabBarLabel: ({ focused }) => <TabLabel label="Inicio" focused={focused} />,
                    tabBarIcon: ({ focused }) => (
                        <MaterialCommunityIcons
                            name={focused ? 'home' : 'home-outline'}
                            size={24}
                            color={focused ? C.active : C.inactive}
                        />
                    ),
                }}
            />

            {/* ── Mapa ── */}
            <Tabs.Screen
                name="explore"
                options={{
                    tabBarShowLabel: true,
                    tabBarLabel: ({ focused }) => <TabLabel label="Mapa" focused={focused} />,
                    tabBarIcon: ({ focused }) => (
                        <MaterialCommunityIcons
                            name={focused ? 'map' : 'map-outline'}
                            size={24}
                            color={focused ? C.active : C.inactive}
                        />
                    ),
                }}
            />

            {/* ── FAB Central ──
                tabBarButton reemplaza el botón del tab. Sin href, sin href:null.
                La navegación la maneja FabButton directamente.            ── */}
            <Tabs.Screen
                name="add"
                options={{
                    tabBarButton: () => <FabButton />,
                }}
            />

            {/* ── Entradas ── */}
            <Tabs.Screen
                name="ticket"
                options={{
                    tabBarShowLabel: true,
                    tabBarLabel: ({ focused }) => <TabLabel label="Entradas" focused={focused} />,
                    tabBarIcon: ({ focused }) => (
                        <Fontisto
                            name="ticket-alt"
                            size={22}
                            color={focused ? C.active : C.inactive}
                        />
                    ),
                }}
            />

            {/* ── Perfil ── */}
            <Tabs.Screen
                name="profile"
                options={{
                    tabBarShowLabel: true,
                    tabBarLabel: ({ focused }) => <TabLabel label="Perfil" focused={focused} />,
                    tabBarIcon: ({ focused }) => (
                        <MaterialCommunityIcons
                            name={focused ? 'account' : 'account-outline'}
                            size={24}
                            color={focused ? C.active : C.inactive}
                        />
                    ),
                }}
            />
        </Tabs>
    )
}

const styles = StyleSheet.create({
    fab: {
        width: 54,
        height: 54,
        borderRadius: 27,
        backgroundColor: C.fab,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,
        shadowColor: C.fab,
        shadowOpacity: 0.6,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        elevation: 8,
    },
    label: {
        fontSize: 10,
        fontWeight: '600',
        marginTop: 2,
    },
})
