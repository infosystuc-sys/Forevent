import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import { router } from 'expo-router'
import React from 'react'
import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native'
import { RouterOutputs } from '@forevent/api'
import { type ArrayElement } from '@forevent/api/types'
import { useSession } from '~/context/auth'
import { api } from '~/utils/api'
import { blurhash, dayjs, PLACEHOLDER } from '~/utils/constants'

const { width: SCREEN_W } = Dimensions.get('window')
const CARD_W = SCREEN_W - 32

const C = {
    bg:      '#111827',
    magenta: '#ff00ff',
    purple:  '#411377',
    white:   '#ffffff',
    dim:     'rgba(255,255,255,0.55)',
}

const DATE_COLORS = ['#e67e22', '#1abc9c', '#e74c3c', '#9b59b6', '#2980b9']

function formatPrice(value: number): string {
    return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        minimumFractionDigits: 0,
    }).format(value)
}

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
    const { user } = useSession()
    const utils = api.useUtils()
    const favoriteIdsQuery = api.mobile.event.myFavoriteIds.useQuery(
        { userId: user?.id ?? '' },
        { enabled: !!user?.id, staleTime: 60_000 },
    )
    const liked = favoriteIdsQuery.data?.includes(item.id) ?? false

    const toggleFavorite = api.mobile.event.toggleFavorite.useMutation({
        onMutate: async ({ eventId }) => {
            if (!user?.id) return
            await utils.mobile.event.myFavoriteIds.cancel({ userId: user.id })
            const prev = utils.mobile.event.myFavoriteIds.getData({ userId: user.id }) ?? []
            const next = prev.includes(eventId)
                ? prev.filter(id => id !== eventId)
                : [...prev, eventId]
            utils.mobile.event.myFavoriteIds.setData({ userId: user.id }, next)
            return { prev }
        },
        onError: (_err, _vars, ctx) => {
            if (!user?.id || !ctx?.prev) return
            utils.mobile.event.myFavoriteIds.setData({ userId: user.id }, ctx.prev)
        },
        onSettled: async () => {
            if (!user?.id) return
            // Refetch explícito (await) en lugar de invalidate solo. En MIUI/Xiaomi
            // el invalidate dispara un refetch que el OS bloquea silenciosamente,
            // dejando el optimistic update sin confirmar contra el servidor.
            await Promise.all([
                utils.mobile.event.myFavoriteIds.refetch({ userId: user.id }),
                utils.mobile.event.listFavorites.refetch({ userId: user.id }),
            ])
        },
    })

    function handleToggleLike() {
        if (!user?.id) return
        toggleFavorite.mutate({ userId: user.id, eventId: item.id })
    }

    const badgeColor = DATE_COLORS[index % DATE_COLORS.length]!
    const categoryLabel = item.artists?.[0]?.name ?? 'Evento'

    const minPrice = item.tickets?.reduce(
        (min, t) => (t.price < min ? t.price : min),
        Infinity
    ) ?? 0
    const safeMin = minPrice === Infinity ? 0 : minPrice
    const priceLabel = safeMin === 0 ? 'Entrada Gratis' : `Desde ${formatPrice(safeMin)}`
    const priceColor = safeMin === 0 ? C.white : C.magenta

    const dateLabel = dayjs(item.startsAt)
        .locale('es')
        .format('ddd D [de] MMMM · HH:mm')
        .replace(/^\w/, (c) => c.toUpperCase())

    return (
        <Pressable
            style={styles.card}
            onPress={() =>
                router.push({ pathname: '/(app)/home/event/[eventId]/', params: { eventId: item.id } })
            }
        >
            {/* ── IMAGE (fills entire card) ── */}
            <Image
                source={{ uri: item.image ?? PLACEHOLDER }}
                placeholder={blurhash}
                cachePolicy="memory-disk"
                priority="high"
                style={StyleSheet.absoluteFill}
                contentFit="cover"
            />

            {/* ── GRADIENT overlay: transparent top → dark bottom ── */}
            <LinearGradient
                colors={['rgba(0,0,0,0.05)', 'rgba(0,0,0,0.50)', 'rgba(0,0,0,0.88)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={StyleSheet.absoluteFill}
                pointerEvents="none"
            />

            {/* ── DATE BADGE — top right ── */}
            <View style={[styles.dateBadge, { backgroundColor: badgeColor }]}>
                <Text style={styles.dateBadgeMonth}>{formatMonth(item.startsAt)}</Text>
                <Text style={styles.dateBadgeDay}>{formatDay(item.startsAt)}</Text>
            </View>

            {/* ── LIKE — top left ── */}
            <Pressable
                hitSlop={8}
                onPress={handleToggleLike}
                disabled={!user?.id}
                style={styles.likeBtn}
            >
                <MaterialCommunityIcons
                    name={liked ? 'heart' : 'heart-outline'}
                    size={20}
                    color={liked ? C.magenta : C.white}
                />
            </Pressable>

            {/* ── BOTTOM CONTENT ── */}
            <View style={styles.bottom}>
                {/* Category tag */}
                <View style={styles.categoryTag}>
                    <Text style={styles.categoryTagText}>{categoryLabel}</Text>
                </View>

                {/* Event name */}
                <Text style={styles.title} numberOfLines={2}>{item.name}</Text>

                {/* Location */}
                {item.location && (
                    <View style={styles.metaRow}>
                        <MaterialCommunityIcons name="map-marker-outline" size={13} color={C.dim} />
                        <Text style={styles.metaText} numberOfLines={1}>
                            {item.location.name ?? item.location.address}, {item.location.city}
                        </Text>
                    </View>
                )}

                {/* Date */}
                <View style={styles.metaRow}>
                    <MaterialCommunityIcons name="calendar-outline" size={13} color={C.dim} />
                    <Text style={styles.metaText}>{dateLabel}</Text>
                </View>

                {/* Price */}
                <Text style={[styles.price, { color: priceColor }]}>{priceLabel}</Text>
            </View>
        </Pressable>
    )
}

const styles = StyleSheet.create({
    card: {
        width: CARD_W,
        height: 300,
        borderRadius: 16,
        overflow: 'hidden',
        marginHorizontal: 16,
        backgroundColor: C.bg,
    },

    dateBadge: {
        position: 'absolute',
        top: 12,
        right: 12,
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

    likeBtn: {
        position: 'absolute',
        top: 12,
        left: 12,
        padding: 4,
    },

    bottom: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 14,
        paddingBottom: 16,
        paddingTop: 10,
        gap: 5,
    },

    categoryTag: {
        alignSelf: 'flex-start',
        backgroundColor: 'rgba(255,0,255,0.25)',
        borderRadius: 50,
        paddingHorizontal: 10,
        paddingVertical: 3,
        marginBottom: 2,
    },
    categoryTagText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '600',
    },

    title: {
        color: C.white,
        fontSize: 18,
        fontWeight: '800',
        lineHeight: 22,
    },

    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    metaText: {
        color: C.dim,
        fontSize: 12,
        flex: 1,
    },

    price: {
        fontSize: 15,
        fontWeight: '700',
        marginTop: 2,
    },
})
