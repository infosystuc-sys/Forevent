import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { StatusBar } from 'expo-status-bar'
import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export default function ExplorePage() {
    const insets = useSafeAreaInsets()
    return (
        <View style={[styles.root, { paddingTop: insets.top }]}>
            <StatusBar style="light" />
            <MaterialCommunityIcons name="map-search-outline" size={56} color="#ff00ff" />
            <Text style={styles.title}>Mapa</Text>
            <Text style={styles.sub}>Próximamente — Explorar eventos cerca de ti</Text>
        </View>
    )
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: '#0d1233',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
    },
    title: { color: '#fff', fontSize: 22, fontWeight: '700' },
    sub:   { color: 'rgba(255,255,255,0.45)', fontSize: 14, textAlign: 'center', paddingHorizontal: 32 },
})
