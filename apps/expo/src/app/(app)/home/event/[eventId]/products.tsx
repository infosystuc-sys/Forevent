/**
 * Products — Listado y compra de productos de un evento
 *
 * Layout:
 *   ┌──────────────────────────────────────┐
 *   │  ← Productos                        │  ← header
 *   ├──────────────────────────────────────┤
 *   │  🍹 Tragos                          │
 *   │    [img] nombre · precio  [−] 0 [+] │
 *   │  🍔 Comidas                         │
 *   │    ...                               │
 *   │  🎁 Promociones                     │
 *   │    ...                               │
 *   ├──────────────────────────────────────┤
 *   │  3 ítems · $450.00  [Confirmar]     │  ← cart footer (si hay ítems)
 *   └──────────────────────────────────────┘
 */

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { Image } from 'expo-image'
import { router, useLocalSearchParams } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import React, { useState } from 'react'
import {
    ActivityIndicator,
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useSession } from '~/context/auth'
import { api } from '~/utils/api'
import { blurhash, PLACEHOLDER } from '~/utils/constants'

// ─── Brand palette ────────────────────────────────────────────────────────────
const C = {
    bg:      '#0d1233',
    card:    '#141e35',
    surface: '#1e2a45',
    magenta: '#ff00ff',
    white:   '#ffffff',
    dim:     'rgba(255,255,255,0.50)',
    border:  'rgba(255,255,255,0.10)',
}

// ─── Types ────────────────────────────────────────────────────────────────────
type ProductType = 'PRODUCT' | 'DEAL'

type CartEntry = {
    id:       string
    name:     string
    price:    number
    quantity: number
    type:     ProductType
}

type ProductItem = {
    id:    string
    name:  string
    image: string | null
    price: number | null
    about: string | null
    type:  ProductType
}

// ─── ProductRow ───────────────────────────────────────────────────────────────
function ProductRow({
    item,
    qty,
    onIncrement,
    onDecrement,
}: {
    item:        ProductItem
    qty:         number
    onIncrement: (item: ProductItem) => void
    onDecrement: (id: string) => void
}) {
    return (
        <View style={styles.productRow}>
            <Image
                source={{ uri: item.image ?? PLACEHOLDER }}
                placeholder={blurhash}
                contentFit="cover"
                cachePolicy="memory-disk"
                style={styles.productImage}
            />
            <View style={styles.productInfo}>
                <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
                {!!item.about && (
                    <Text style={styles.productAbout} numberOfLines={2}>{item.about}</Text>
                )}
                <Text style={styles.productPrice}>
                    {item.price != null ? `$${item.price.toFixed(2)}` : '—'}
                </Text>
            </View>
            <View style={styles.qtyControl}>
                <Pressable
                    style={[styles.qtyBtn, qty === 0 && styles.qtyBtnDisabled]}
                    onPress={() => onDecrement(item.id)}
                    disabled={qty === 0}
                >
                    <MaterialCommunityIcons
                        name="minus"
                        size={15}
                        color={qty === 0 ? 'rgba(255,255,255,0.18)' : C.white}
                    />
                </Pressable>
                <Text style={styles.qtyText}>{qty}</Text>
                <Pressable
                    style={styles.qtyBtn}
                    onPress={() => onIncrement(item)}
                >
                    <MaterialCommunityIcons name="plus" size={15} color={C.white} />
                </Pressable>
            </View>
        </View>
    )
}

// ─── ProductSection ───────────────────────────────────────────────────────────
function ProductSection({
    title,
    items,
    cart,
    onIncrement,
    onDecrement,
}: {
    title:       string
    items:       ProductItem[]
    cart:        Record<string, CartEntry>
    onIncrement: (item: ProductItem) => void
    onDecrement: (id: string) => void
}) {
    if (items.length === 0) return null
    return (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>{title}</Text>
            {items.map((item) => (
                <ProductRow
                    key={item.id}
                    item={item}
                    qty={cart[item.id]?.quantity ?? 0}
                    onIncrement={onIncrement}
                    onDecrement={onDecrement}
                />
            ))}
        </View>
    )
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function ProductsScreen() {
    const { eventId } = useLocalSearchParams<{ eventId: string }>()
    const insets = useSafeAreaInsets()
    const { user } = useSession()

    const [cart, setCart] = useState<Record<string, CartEntry>>({})

    // ── Derived cart values ──────────────────────────────────────────────────
    const cartEntries = Object.values(cart).filter((e) => e.quantity > 0)
    const cartCount   = cartEntries.reduce((sum, e) => sum + e.quantity, 0)
    const cartTotal   = cartEntries.reduce((sum, e) => sum + e.price * e.quantity, 0)

    // ── Query ────────────────────────────────────────────────────────────────
    const productsQuery = api.mobile.product.onEvent.useQuery(
        { eventId: eventId! },
        { enabled: !!eventId },
    )

    // ── Purchase mutation ────────────────────────────────────────────────────
    const utils = api.useUtils()
    const purchaseMutation = api.mobile.purchase.products.useMutation({
        onSuccess: async () => {
            setCart({})
            // Refetch explícito (await) en lugar de invalidate. Garantiza que la lista
            // de "Mis compras" tenga el dato nuevo antes de mostrar el alert al user.
            // Sin esto, en MIUI/Xiaomi el invalidate disparaba un refetch que el OS
            // bloqueaba silenciosamente y el user no veía la compra recién hecha.
            await utils.mobile.userPurchase.myPurchases.refetch()
            Alert.alert(
                '¡Pedido confirmado!',
                'Tu pedido fue registrado exitosamente. Presentá el QR en el mostrador.',
                [{ text: 'Entendido' }],
            )
        },
        onError: (err) => {
            Alert.alert('Error en el pedido', err.message)
        },
    })

    // ── Cart helpers ─────────────────────────────────────────────────────────
    function incrementCart(item: ProductItem) {
        setCart((prev) => ({
            ...prev,
            [item.id]: {
                id:       item.id,
                name:     item.name,
                price:    item.price ?? 0,
                quantity: (prev[item.id]?.quantity ?? 0) + 1,
                type:     item.type,
            },
        }))
    }

    function decrementCart(id: string) {
        setCart((prev) => {
            const current = prev[id]?.quantity ?? 0
            if (current <= 1) {
                const { [id]: _removed, ...rest } = prev
                return rest
            }
            return { ...prev, [id]: { ...prev[id]!, quantity: current - 1 } }
        })
    }

    function handleConfirmOrder() {
        if (cartEntries.length === 0) return

        const lines = cartEntries
            .map((e) => `${e.quantity}x ${e.name}  $${(e.price * e.quantity).toFixed(2)}`)
            .join('\n')

        Alert.alert(
            'Confirmar pedido',
            `${lines}\n\nTotal: $${cartTotal.toFixed(2)}`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Confirmar',
                    onPress: () => {
                        purchaseMutation.mutate({
                            products: cartEntries.map((e) => ({
                                quantity: e.quantity,
                                product: { id: e.id, type: e.type },
                            })),
                            userId:  user!.id,
                            eventId: eventId!,
                        })
                    },
                },
            ],
        )
    }

    // ── Build product lists with correct type ────────────────────────────────
    // drinks/foods: id = ProductOnDeposit.id → type PRODUCT
    // deals: id = Deal.id → type DEAL
    const drinks = (productsQuery.data?.drinks ?? []).map<ProductItem>((p) => ({
        ...p,
        type: 'PRODUCT' as const,
    }))
    const foods = (productsQuery.data?.foods ?? []).map<ProductItem>((p) => ({
        ...p,
        type: 'PRODUCT' as const,
    }))
    const deals = (productsQuery.data?.deals ?? []).map<ProductItem>((p) => ({
        ...p,
        type: 'DEAL' as const,
    }))

    const hasProducts = drinks.length > 0 || foods.length > 0 || deals.length > 0

    return (
        <View style={[styles.root, { paddingTop: insets.top }]}>
            <StatusBar style="light" />

            {/* ── Header ── */}
            <View style={styles.header}>
                <Pressable style={styles.headerBtn} onPress={() => router.back()}>
                    <MaterialCommunityIcons name="arrow-left" size={22} color={C.white} />
                </Pressable>
                <Text style={styles.headerTitle}>Productos</Text>
                {/* Spacer para centrar el título */}
                <View style={styles.headerSpacer} />
            </View>

            {/* ── Content ── */}
            <ScrollView
                style={{ flex: 1 }}
                showsVerticalScrollIndicator={false}
                overScrollMode="never"
                contentContainerStyle={[
                    styles.scrollContent,
                    { paddingBottom: cartCount > 0 ? 110 : 32 },
                ]}
            >
                {/* Loading */}
                {productsQuery.isLoading && (
                    <View style={styles.centered}>
                        <ActivityIndicator color={C.magenta} size="large" />
                        <Text style={styles.centeredText}>Cargando productos...</Text>
                    </View>
                )}

                {/* Empty */}
                {!productsQuery.isLoading && !hasProducts && (
                    <View style={styles.centered}>
                        <MaterialCommunityIcons
                            name="food-off-outline"
                            size={56}
                            color={C.dim}
                        />
                        <Text style={styles.emptyTitle}>Sin productos disponibles</Text>
                        <Text style={styles.emptySubtitle}>
                            Este evento no tiene productos disponibles por el momento.
                        </Text>
                    </View>
                )}

                {/* Secciones */}
                {!productsQuery.isLoading && hasProducts && (
                    <>
                        <ProductSection
                            title="🍹  Tragos"
                            items={drinks}
                            cart={cart}
                            onIncrement={incrementCart}
                            onDecrement={decrementCart}
                        />
                        <ProductSection
                            title="🍔  Comidas"
                            items={foods}
                            cart={cart}
                            onIncrement={incrementCart}
                            onDecrement={decrementCart}
                        />
                        <ProductSection
                            title="🎁  Promociones"
                            items={deals}
                            cart={cart}
                            onIncrement={incrementCart}
                            onDecrement={decrementCart}
                        />
                    </>
                )}
            </ScrollView>

            {/* ── Cart footer ── */}
            {cartCount > 0 && (
                <View style={[styles.cartFooter, { paddingBottom: insets.bottom + 12 }]}>
                    <View style={styles.cartInfo}>
                        <Text style={styles.cartCount}>
                            {cartCount} {cartCount === 1 ? 'ítem' : 'ítems'}
                        </Text>
                        <Text style={styles.cartTotal}>${cartTotal.toFixed(2)}</Text>
                    </View>
                    <Pressable
                        style={({ pressed }) => [
                            styles.cartBtn,
                            pressed && { opacity: 0.8 },
                            purchaseMutation.isPending && { opacity: 0.6 },
                        ]}
                        onPress={handleConfirmOrder}
                        disabled={purchaseMutation.isPending}
                    >
                        {purchaseMutation.isPending ? (
                            <ActivityIndicator size={18} color={C.white} />
                        ) : (
                            <>
                                <MaterialCommunityIcons
                                    name="check-circle-outline"
                                    size={18}
                                    color={C.white}
                                />
                                <Text style={styles.cartBtnText}>Confirmar pedido</Text>
                            </>
                        )}
                    </Pressable>
                </View>
            )}
        </View>
    )
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: C.bg,
    },

    // ── Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: C.border,
    },
    headerBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.08)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        flex: 1,
        color: C.white,
        fontSize: 18,
        fontWeight: '800',
        textAlign: 'center',
        letterSpacing: 0.3,
    },
    headerSpacer: {
        width: 36,
    },

    // ── Scroll content
    scrollContent: {
        paddingTop: 8,
    },

    // ── Loading / empty
    centered: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 80,
        paddingHorizontal: 32,
        gap: 12,
    },
    centeredText: {
        color: C.dim,
        fontSize: 13,
    },
    emptyTitle: {
        color: C.white,
        fontSize: 17,
        fontWeight: '700',
        textAlign: 'center',
    },
    emptySubtitle: {
        color: C.dim,
        fontSize: 13,
        textAlign: 'center',
        lineHeight: 20,
    },

    // ── Section
    section: {
        marginHorizontal: 16,
        marginBottom: 24,
    },
    sectionTitle: {
        color: C.white,
        fontSize: 13,
        fontWeight: '800',
        letterSpacing: 0.8,
        textTransform: 'uppercase',
        marginBottom: 10,
        marginTop: 8,
    },

    // ── Product row
    productRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: C.card,
        borderRadius: 14,
        padding: 10,
        marginBottom: 8,
        gap: 12,
        borderWidth: 1,
        borderColor: C.border,
    },
    productImage: {
        width: 64,
        height: 64,
        borderRadius: 10,
        backgroundColor: C.surface,
    },
    productInfo: {
        flex: 1,
        gap: 3,
    },
    productName: {
        color: C.white,
        fontSize: 14,
        fontWeight: '700',
        lineHeight: 18,
    },
    productAbout: {
        color: C.dim,
        fontSize: 11,
        lineHeight: 15,
    },
    productPrice: {
        color: C.magenta,
        fontSize: 15,
        fontWeight: '800',
        marginTop: 3,
    },

    // ── Qty control
    qtyControl: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    qtyBtn: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: C.surface,
        alignItems: 'center',
        justifyContent: 'center',
    },
    qtyBtnDisabled: {
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    qtyText: {
        color: C.white,
        fontSize: 15,
        fontWeight: '700',
        minWidth: 18,
        textAlign: 'center',
    },

    // ── Cart footer
    cartFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 12,
        backgroundColor: C.surface,
        borderTopWidth: 1,
        borderTopColor: C.border,
        gap: 12,
    },
    cartInfo: {
        flex: 1,
        gap: 1,
    },
    cartCount: {
        color: C.dim,
        fontSize: 11,
        fontWeight: '600',
    },
    cartTotal: {
        color: C.white,
        fontSize: 22,
        fontWeight: '800',
    },
    cartBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 7,
        backgroundColor: C.magenta,
        borderRadius: 14,
        paddingVertical: 13,
        paddingHorizontal: 18,
        shadowColor: C.magenta,
        shadowOpacity: 0.45,
        shadowRadius: 10,
        elevation: 6,
    },
    cartBtnText: {
        color: C.white,
        fontSize: 13,
        fontWeight: '800',
        letterSpacing: 0.3,
    },
})
