/**
 * EventCardHighlighted
 *
 * Tarjeta grande de evento — réplica fiel del diseño Stitch/Principal.
 *
 * Layout:
 *   ┌────────────────────────────────────┐
 *   │  [image]              [DATE BADGE] │
 *   │  [CATEGORY TAG]                    │
 *   ├────────────────────────────────────┤
 *   │  Nombre del Evento       ♡         │
 *   │  📍 Venue, Ciudad                  │
 *   │  👤👤👤 +123    Desde $2.500       │
 *   └────────────────────────────────────┘
 */

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import { router } from 'expo-router'
import React, { useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { RouterOutputs } from '@forevent/api'
import { ArrayElement } from 'node_modules/@forevent/api/src/root'
import { blurhash, dayjs, PLACEHOLDER } from '~/utils/constants'

// ─── Brand colors ─────────────────────────────────────────────────────────────
const C = {
    bg:      '#111827',   // card background
    surface: '#1e2a45',   // slightly lighter surface
    magenta: '#ff00ff',
    white:   '#ffffff',
    dim:     'rgba(255,255,255,0.55)',
    faint:   'rgba(255,255,255,0.08)',
}

// Date-badge colors cycle
const DATE_COLORS = ['#e67e22', '#1abc9c', '#e74c3c', '#9b59b6', '#2980b9']

// Category-tag colors by event category
const CATEGORY_COLOR: Record<string, string> = {
    BAR:      '#7e00ff',
    CULTURAL: '#b666d2',
    CLUB:     '#1a55ff',
    SPEED:    '#e74c3c',
}

// Format price in ARS locale: 2500 → "$ 2.500"
function formatPrice(value: number): string {
    return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        minimumFractionDigits: 0,
    }).format(value)
}

// Format month abbreviation: "OCT"
function formatMonth(date: string | Date): string {
    return dayjs(date).locale('es').format('MMM').toUpperCase().replace('.', '')
}
function formatDay(date: string | Date): string {
    return dayjs(date).format('DD')
}

type EventItem = ArrayElement<RouterOutputs['mobile']['event']['highlighted']>

interface Props {
    item: EventItem
    index?: number
}

export default function EventCardHighlighted({ item, index = 0 }: Props) {
    const [liked, setLiked] = useState(false)

    const badgeColor   = DATE_COLORS[index % DATE_COLORS.length]!

    // No category in API — derive a visual label from about/name if needed
    const categoryLabel = item.artists?.[0]?.name ?? 'Evento'
    const categoryColor = DATE_COLORS[(index + 2) % DATE_COLORS.length]!

    // Tickets are ordered by price asc in the first query, desc in fallback.
    // Take the minimum price manually.
    const minPrice = item.tickets?.reduce(
        (min, t) => (t.price < min ? t.price : min),
        Infinity
    ) ?? 0
    const safeMin = minPrice === Infinity ? 0 : minPrice
    const priceLabel = safeMin === 0
        ? 'Entrada Gratis'
        : `Desde ${formatPrice(safeMin)}`
    const priceColor = safeMin === 0 ? C.white : C.magenta

    const artists = item.artists ?? []

    return (
        <Pressable
            style={styles.card}
            onPress={() =>
                router.push({ pathname: '/(app)/home/event/[eventId]/', params: { eventId: item.id } })
            }
        >
            {/* ── IMAGE ── */}
            <View style={styles.imageWrapper}>
                <Image
                    source={{ uri: item.image ?? PLACEHOLDER }}
                    placeholder={blurhash}
                    cachePolicy="memory-disk"
                    priority="high"
                    style={styles.image}
                    contentFit="cover"
                />

                {/* Gradient overlay at bottom of image */}
                <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.55)']}
                    style={StyleSheet.absoluteFill}
                    start={{ x: 0, y: 0.4 }}
                    end={{ x: 0, y: 1 }}
                    pointerEvents="none"
                />

                {/* Date badge — top right */}
                <View style={[styles.dateBadge, { backgroundColor: badgeColor }]}>
                    <Text style={styles.dateBadgeMonth}>{formatMonth(item.startsAt)}</Text>
                    <Text style={styles.dateBadgeDay}>{formatDay(item.startsAt)}</Text>
                </View>

                {/* Category tag — bottom left */}
                <View style={[styles.categoryTag, { backgroundColor: categoryColor }]}>
                    <Text style={styles.categoryTagText}>{categoryLabel}</Text>
                </View>
            </View>

            {/* ── BODY ── */}
            <View style={styles.body}>
                {/* Title row */}
                <View style={styles.titleRow}>
                    <Text style={styles.title} numberOfLines={1}>{item.name}</Text>
                    <Pressable
                        hitSlop={8}
                        onPress={() => setLiked(v => !v)}
                        style={styles.likeBtn}
                    >
                        <MaterialCommunityIcons
                            name={liked ? 'heart' : 'heart-outline'}
                            size={20}
                            color={liked ? C.magenta : C.dim}
                        />
                    </Pressable>
                </View>

                {/* Location */}
                {item.location && (
                    <View style={styles.locationRow}>
                        <MaterialCommunityIcons name="map-marker-outline" size={13} color={C.dim} />
                        <Text style={styles.locationText} numberOfLines={1}>
                            {item.location.name}, {item.location.city}
                        </Text>
                    </View>
                )}

                {/* Footer: avatars (artists) + price */}
                <View style={styles.footer}>
                    <View style={styles.avatarsRow}>
                        {artists.slice(0, 3).map((a, i) => (
                            <View key={a.id} style={[styles.avatarWrapper, { left: i * 16 }]}>
                                <Image
                                    source={{ uri: a.image ?? PLACEHOLDER }}
                                    style={styles.avatar}
                                    contentFit="cover"
                                />
                            </View>
                        ))}
                        {artists.length > 0 && (
                            <Text style={[styles.attendeeCount, { marginLeft: Math.min(artists.length, 3) * 16 + 4 }]}>
                                {artists.length} artista{artists.length > 1 ? 's' : ''}
                            </Text>
                        )}
                    </View>

                    {/* Price */}
                    <Text style={[styles.price, { color: priceColor }]}>
                        {priceLabel}
                    </Text>
                </View>
            </View>
        </Pressable>
    )
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: C.bg,
        borderRadius: 16,
        overflow: 'hidden',
        marginHorizontal: 16,
    },

    // Image
    imageWrapper: {
        width: '100%',
        aspectRatio: 16 / 9,
    },
    image: {
        width: '100%',
        height: '100%',
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
    },

    // Date badge
    dateBadge: {
        position: 'absolute',
        top: 10,
        right: 10,
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 5,
        alignItems: 'center',
        minWidth: 42,
    },
    dateBadgeMonth: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    dateBadgeDay: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '900',
        lineHeight: 20,
    },

    // Category tag
    categoryTag: {
        position: 'absolute',
        bottom: 10,
        left: 10,
        borderRadius: 50,
        paddingHorizontal: 10,
        paddingVertical: 4,
    },
    categoryTagText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '600',
    },

    // Body
    body: {
        paddingHorizontal: 14,
        paddingTop: 12,
        paddingBottom: 14,
        gap: 6,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    title: {
        color: C.white,
        fontSize: 16,
        fontWeight: '700',
        flex: 1,
        marginRight: 8,
    },
    likeBtn: {
        padding: 2,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    locationText: {
        color: C.dim,
        fontSize: 12,
        flex: 1,
    },

    // Footer
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 2,
    },
    avatarsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        position: 'relative',
        height: 28,
        flex: 1,
    },
    avatarWrapper: {
        position: 'absolute',
        width: 26,
        height: 26,
        borderRadius: 13,
        borderWidth: 1.5,
        borderColor: C.bg,
        overflow: 'hidden',
    },
    avatar: {
        width: '100%',
        height: '100%',
    },
    attendeeCount: {
        color: C.dim,
        fontSize: 11,
    },
    price: {
        fontSize: 14,
        fontWeight: '700',
    },
})
