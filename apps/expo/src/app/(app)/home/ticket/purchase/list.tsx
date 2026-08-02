/**
 * Purchase Unit List — muestra cada unidad individual de un producto comprado
 */

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { router, useLocalSearchParams } from 'expo-router'
import React from 'react'
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { api } from '~/utils/api'
import { useSession } from '~/context/auth'
import Loading from '~/components/loading'

const C = {
  bg:      '#0d1233',
  card:    '#111827',
  surface: '#1e2a45',
  magenta: '#ff00ff',
  white:   '#ffffff',
  dim:     'rgba(255,255,255,0.50)',
  border:  'rgba(255,255,255,0.08)',
}

export default function PurchaseListPage() {
  const { ids, productName } = useLocalSearchParams<{ ids: string; productName: string }>()
  const { user } = useSession()

  let purchaseIds: string[] = []
  try {
    purchaseIds = JSON.parse(ids ?? '[]')
  } catch {
    purchaseIds = []
  }

  // Fetch each purchase to get its current status
  const queries = purchaseIds.map((id) =>
    api.mobile.userPurchase.byId.useQuery(
      { userPurchaseId: id },
      { enabled: !!id },
    ),
  )

  const isLoading = queries.some((q) => q.isLoading)

  if (isLoading) return <Loading />

  const units = purchaseIds.map((id, i) => {
    const data = queries[i]?.data
    const hasGift = (data?.gifts?.length ?? 0) > 0
    const name = data?.productOnDeposit?.product?.name ?? data?.deal?.name ?? 'Producto'
    return {
      id,
      index: i,
      name,
      status: (data?.status as string) ?? 'PENDING',
      isGifted: hasGift,
      giftReceiverName: hasGift ? data?.gifts?.[0]?.giftReceiver?.name ?? null : null,
    }
  })

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={C.white} />
        </Pressable>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle} numberOfLines={1}>{productName ?? 'Producto'}</Text>
          <Text style={styles.headerSub}>{units.length} unidades</Text>
        </View>
      </View>

      {/* List */}
      <FlatList
        data={units}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        renderItem={({ item }) => {
          const isDelivered = item.status === 'ACCEPTED'
          return (
            <Pressable
              // NativeWind v4 descarta la forma de función de `style`
              // (nativewind#1105) — la tarjeta perdia todos sus estilos.
              style={[
                styles.card,
                item.isGifted && styles.cardGifted,
              ]}
              android_ripple={{ color: 'rgba(255,255,255,0.08)' }}
              onPress={() =>
                router.push({
                  pathname: '/(app)/home/ticket/purchase/[userPurchaseId]/',
                  params: { userPurchaseId: item.id },
                })
              }
            >
              <View style={[styles.cardIcon, item.isGifted && styles.cardIconGifted]}>
                <MaterialCommunityIcons
                  name={item.isGifted ? 'gift-outline' : 'qrcode'}
                  size={28}
                  color={item.isGifted ? '#7c3aed' : C.magenta}
                />
              </View>

              <View style={styles.cardInfo}>
                <Text style={styles.cardTitle} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.cardId}>#{item.id.slice(-8).toUpperCase()}</Text>
                {item.isGifted && (
                  <View style={styles.giftLabel}>
                    <Text style={styles.giftLabelText}>
                      Enviado como regalo{item.giftReceiverName ? ` a ${item.giftReceiverName}` : ''}
                    </Text>
                  </View>
                )}
              </View>

              <View style={[
                styles.badge,
                isDelivered && styles.badgeDelivered,
                item.isGifted && styles.badgeGifted,
              ]}>
                <View style={[
                  styles.badgeDot,
                  isDelivered && styles.badgeDotDelivered,
                  item.isGifted && styles.badgeDotGifted,
                ]} />
                <Text style={[
                  styles.badgeText,
                  isDelivered && styles.badgeTextDelivered,
                  item.isGifted && styles.badgeTextGifted,
                ]}>
                  {item.isGifted ? 'Regalado' : isDelivered ? 'Entregado' : 'Pendiente'}
                </Text>
              </View>

              <MaterialCommunityIcons name="chevron-right" size={20} color={C.dim} />
            </Pressable>
          )
        }}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: { flex: 1, gap: 2 },
  headerTitle: {
    color: C.white,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  headerSub: {
    color: C.dim,
    fontSize: 13,
  },

  list: {
    padding: 16,
  },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: C.border,
  },
  cardGifted: {
    backgroundColor: 'rgba(124,58,237,0.12)',
    borderColor: 'rgba(124,58,237,0.25)',
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(255,0,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardIconGifted: {
    backgroundColor: 'rgba(124,58,237,0.15)',
  },
  cardInfo: {
    flex: 1,
    gap: 2,
  },
  cardTitle: {
    color: C.white,
    fontSize: 16,
    fontWeight: '700',
  },
  cardId: {
    color: C.dim,
    fontSize: 12,
    fontFamily: 'Montserrat_700Bold',
    letterSpacing: 0.5,
  },

  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(255,0,255,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,0,255,0.30)',
  },
  badgeDelivered: {
    backgroundColor: 'rgba(0,255,157,0.10)',
    borderColor: 'rgba(0,255,157,0.30)',
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: C.magenta,
  },
  badgeDotDelivered: {
    backgroundColor: '#4ade80',
  },
  badgeText: {
    color: C.magenta,
    fontSize: 10,
    fontWeight: '700',
  },
  badgeTextDelivered: {
    color: '#4ade80',
  },
  badgeGifted: {
    backgroundColor: 'rgba(124,58,237,0.12)',
    borderColor: 'rgba(124,58,237,0.30)',
  },
  badgeDotGifted: {
    backgroundColor: '#7c3aed',
  },
  badgeTextGifted: {
    color: '#7c3aed',
  },
  giftLabel: {
    marginTop: 2,
  },
  giftLabelText: {
    color: '#7c3aed',
    fontSize: 11,
    fontWeight: '600',
  },
})
