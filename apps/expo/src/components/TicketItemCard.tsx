/**
 * TicketItemCard — Componente independiente para cada ítem del carrusel.
 *
 * Regla de oro: NUNCA usa variables externas o acumuladores para determinar si un
 * ticket es regalo. Toda la lógica se calcula DENTRO de este componente usando
 * únicamente la prop `ticket`.
 *
 * Tipos de ticket:
 *   · Normal propio    — giftId=null, isSentGift=false, isIncomingGift=false
 *   · Regalo enviado   — isSentGift=true   → "Enviaste este ticket como regalo"
 *   · Regalo pendiente — isIncomingGift=true → "Recibido de [Nombre] · Pendiente"
 *   · Regalo aceptado  — giftId=null, giftSenderName != null → "Recibido de [Nombre]" + botón entrada
 */

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import React from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { blurhash, dayjs } from '~/utils/constants'

const C = {
  card:    '#111827',
  magenta: '#ff00ff',
  purple:  '#411377',
  amber:   '#f59e0b',
  cyan:    '#22d3ee',
  white:   '#ffffff',
  dim:     'rgba(255,255,255,0.50)',
}

export type TicketItem = {
  id: string
  userTicketId: string
  url: string
  quantity: number
  eventTicket: {
    id: string
    name: string
    locatioName: string
    event: { name: string; image: string; startsAt: Date; endsAt: Date }
  }
  giftId?: string | null
  /** true si soy el emisor del regalo (pending) */
  isSentGift?: boolean
  /** true si soy el receptor del regalo y aún está pendiente de aceptación */
  isIncomingGift?: boolean
  /** Nombre del amigo que me regaló este ticket (pending o aceptado) */
  giftSenderName?: string | null
  /** Imagen del amigo que me regaló este ticket */
  giftSenderImage?: string | null
}

type Props = {
  ticket: TicketItem
  onPress: () => void
  cardWidth: number
  styles: ReturnType<typeof StyleSheet.create>
}

export function TicketItemCard({ ticket, onPress, cardWidth, styles }: Props) {
  const isSentGift     = !!ticket.isSentGift
  const isIncomingGift = !!ticket.isIncomingGift
  // Regalo aceptado: ya está en mi cuenta (giftId=null) pero vino de alguien
  const isAcceptedGift = !ticket.giftId && !!ticket.giftSenderName && !isSentGift && !isIncomingGift
  // Puede entrar al evento: ticket propio (normal o aceptado como regalo)
  const canEnter       = !isSentGift && !isIncomingGift

  const dateLabel = ticket.eventTicket.event.startsAt
    ? dayjs(ticket.eventTicket.event.startsAt)
        .locale('es')
        .format('ddd D [de] MMMM · HH:mm')
        .replace(/^\w/, (c) => c.toUpperCase())
    : '—'

  // Color de borde según estado
  const borderStyle = isSentGift || isIncomingGift ? styles.cardGiftBlocking : undefined

  return (
    <Pressable
      style={[styles.card, { width: cardWidth }, borderStyle]}
      onPress={onPress}
      android_ripple={{ color: 'rgba(255,255,255,0.06)' }}
    >
      <Image
        source={{ uri: ticket.eventTicket.event.image }}
        placeholder={blurhash}
        cachePolicy="memory-disk"
        contentFit="cover"
        style={StyleSheet.absoluteFill}
      />

      <LinearGradient
        colors={['rgba(0,0,0,0.05)', 'rgba(0,0,0,0.55)', 'rgba(0,0,0,0.90)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      {/* Badge cantidad: magenta para tickets propios, ámbar para cualquier estado de regalo */}
      <View style={[styles.qtyBadge, (isSentGift || isIncomingGift) && styles.qtyBadgeGift]}>
        {canEnter && !isAcceptedGift ? (
          <LinearGradient
            colors={[C.magenta, C.purple]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.qtyBadgeGradient}
          >
            <MaterialCommunityIcons name="ticket-confirmation-outline" size={14} color="#fff" />
            <Text style={styles.qtyBadgeText}>
              {ticket.quantity > 1 ? `x${ticket.quantity}` : '1'}
            </Text>
          </LinearGradient>
        ) : (
          <View style={styles.qtyBadgeGiftInner}>
            <MaterialCommunityIcons
              name={isIncomingGift ? 'gift-open-outline' : 'gift-outline'}
              size={14}
              color={C.amber}
            />
            <Text style={[styles.qtyBadgeText, { color: C.amber }]}>
              {ticket.quantity > 1 ? `x${ticket.quantity}` : '1'}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.typeBadge}>
        <Text style={styles.typeBadgeText} numberOfLines={1}>
          {ticket.eventTicket.name.toUpperCase()}
        </Text>
      </View>

      <View style={styles.cardBottom}>
        <Text style={styles.cardEventName} numberOfLines={2}>
          {ticket.eventTicket.event.name}
        </Text>

        <View style={styles.cardMetaRow}>
          <MaterialCommunityIcons name="map-marker-outline" size={12} color={C.dim} />
          <Text style={styles.cardMeta} numberOfLines={1}>
            {ticket.eventTicket.locatioName}
          </Text>
        </View>

        <View style={styles.cardMetaRow}>
          <MaterialCommunityIcons name="calendar-outline" size={12} color={C.dim} />
          <Text style={styles.cardMeta}>{dateLabel}</Text>
        </View>

        <View style={styles.cardCta}>
          {isSentGift ? (
            /* Regalo que yo envié y está pendiente de aceptación */
            <>
              <Text style={[styles.cardCtaText, { color: C.amber }]}>
                Enviaste este ticket como regalo
              </Text>
              <MaterialCommunityIcons name="gift-outline" size={14} color={C.amber} />
            </>
          ) : isIncomingGift ? (
            /* Regalo pendiente que me enviaron — aún no acepté */
            <>
              <Text style={[styles.cardCtaText, { color: C.amber }]}>
                Recibido de{' '}
                <Text style={{ fontWeight: '700', color: C.white }}>
                  {ticket.giftSenderName ?? '—'}
                </Text>
                {' · '}Pendiente de aceptación
              </Text>
              <MaterialCommunityIcons name="gift-open-outline" size={14} color={C.amber} />
            </>
          ) : isAcceptedGift ? (
            /* Regalo aceptado — ya puedo usarlo */
            <>
              <Text style={[styles.cardCtaText, { color: C.cyan }]}>
                Recibido de{' '}
                <Text style={{ fontWeight: '700', color: C.white }}>
                  {ticket.giftSenderName}
                </Text>
              </Text>
              <View style={styles.enterBtnWrapper}>
                <Text style={styles.enterBtnText}>ENTRAR AL EVENTO</Text>
                <MaterialCommunityIcons name="arrow-right" size={16} color={C.magenta} />
              </View>
            </>
          ) : (
            /* Ticket propio normal */
            <>
              <Text style={styles.cardCtaText}>Ver QR</Text>
              <View style={styles.enterBtnWrapper}>
                <Text style={styles.enterBtnText}>ENTRAR AL EVENTO</Text>
                <MaterialCommunityIcons name="arrow-right" size={16} color={C.magenta} />
              </View>
            </>
          )}
        </View>
      </View>

      <View style={[styles.perfCircle, { left: -12 }]} />
      <View style={[styles.perfCircle, { right: -12 }]} />
    </Pressable>
  )
}
