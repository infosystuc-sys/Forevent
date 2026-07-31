import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Camera, CameraType } from 'expo-camera';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useTheme from '~/hooks/useTheme';
import { api } from '~/utils/api';

const { width: SCREEN_W } = Dimensions.get('window');
const VIEWFINDER_SIZE = SCREEN_W * 0.7;
const CORNER_SIZE = 24;
const CORNER_THICKNESS = 4;
const CORNER_RADIUS = 12;

// Brand palette (matches role-selection + guild index)
const C = {
  bg: '#002447',
  surface: '#0a3060',
  accent: '#ffa300',
  accentText: '#002447',
  primary: '#13a8fe',
  magenta: '#ff00ff',
  white: '#ffffff',
  whiteSubtle: 'rgba(255,255,255,0.6)',
  success: '#22c55e',
  error: '#ef4444',
  overlay: 'rgba(0,18,40,0.75)',
} as const;

type ScanResult = {
  type: 'success' | 'error';
  message: string;
} | null;

// ─── Corner decorator ──────────────────────────────────────────────────────
function Corner({ position }: { position: 'tl' | 'tr' | 'bl' | 'br' }) {
  const isTop = position.startsWith('t');
  const isLeft = position.endsWith('l');
  return (
    <View
      style={[
        styles.corner,
        {
          [isTop ? 'top' : 'bottom']: 0,
          [isLeft ? 'left' : 'right']: 0,
          [isTop ? 'borderTopWidth' : 'borderBottomWidth']: CORNER_THICKNESS,
          [isLeft ? 'borderLeftWidth' : 'borderRightWidth']: CORNER_THICKNESS,
          [isTop && isLeft ? 'borderTopLeftRadius' : '']: CORNER_RADIUS,
          [isTop && !isLeft ? 'borderTopRightRadius' : '']: CORNER_RADIUS,
          [!isTop && isLeft ? 'borderBottomLeftRadius' : '']: CORNER_RADIUS,
          [!isTop && !isLeft ? 'borderBottomRightRadius' : '']: CORNER_RADIUS,
        },
      ]}
    />
  );
}

// ─── Main component ─────────────────────────────────────────────────────────
export default function ScanScreen() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [result, setResult] = useState<ScanResult>(null);
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { userOnGuildId, eventId } = useLocalSearchParams<{
    userOnGuildId: string;
    eventId: string;
  }>();
  const cameraRef = useRef<Camera>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const utils = api.useUtils();

  // ── Show / hide result toast ──────────────────────────────────────────────
  const showResult = useCallback(
    (type: 'success' | 'error', message: string) => {
      setResult({ type, message });
      fadeAnim.setValue(0);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start();
    },
    [fadeAnim],
  );

  const dismissResult = useCallback(() => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setResult(null);
      setScanned(false);
    });
  }, [fadeAnim]);

  // ── Mutations ─────────────────────────────────────────────────────────────
  const scanTicket = api.mobile.event.scanTicket.useMutation({
    onSuccess: () => {
      showResult('success', 'Entrada escaneada exitosamente');
      utils.mobile.event.invalidate();
    },
    onError: (error) => showResult('error', error.message),
  });

  const scanProducts = api.mobile.event.scanProducts.useMutation({
    onSuccess: () => {
      showResult('success', 'Productos entregados exitosamente');
      utils.mobile.purchase.invalidate();
      utils.mobile.userPurchase.invalidate();
    },
    onError: (error) => showResult('error', error.message),
  });

  // ── Camera permission ─────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  // ── QR handler ────────────────────────────────────────────────────────────
  const handleBarCodeScanned = useCallback(
    (scanResult: { type: string; data: string }) => {
      if (scanned) return;
      setScanned(true);
      try {
        const parseData = JSON.parse(scanResult.data);

        // QR de PRODUCTO: { s: userId, p: [purchaseId, ...], sig }
        if (parseData.s && parseData.p) {
          const userId = parseData.s;
          const productIds = Array.isArray(parseData.p)
            ? parseData.p
            : [parseData.p];
          if (
            typeof userId !== 'string' ||
            typeof parseData.sig !== 'string' ||
            productIds.some((id: unknown) => typeof id !== 'string')
          ) {
            showResult('error', 'QR inválido');
            return;
          }
          scanProducts.mutate({
            eventId: eventId!,
            userId,
            userProductsIds: productIds,
            sig: parseData.sig,
          });
          return;
        }

        // QR de ENTRADA: { url: userTicketId, u: userId, sig }
        if (parseData.url && parseData.u) {
          if (
            typeof parseData.url !== 'string' ||
            typeof parseData.u !== 'string' ||
            typeof parseData.sig !== 'string'
          ) {
            showResult('error', 'QR inválido');
            return;
          }
          scanTicket.mutate({
            eventId: eventId!,
            userId: parseData.u,
            userTicketId: parseData.url,
            sig: parseData.sig,
          });
          return;
        }

        showResult('error', 'El código no corresponde a una entrada ni a un producto');
      } catch {
        showResult('error', 'QR inválido');
      }
    },
    [scanned, userOnGuildId, eventId, scanTicket, scanProducts, showResult],
  );

  // ── Permission states ─────────────────────────────────────────────────────
  if (hasPermission === null) {
    return (
      <View style={[styles.center, { backgroundColor: C.bg }]}>
        <ActivityIndicator size="large" color={C.primary} />
        <Text style={styles.permText}>Solicitando permiso de cámara...</Text>
      </View>
    );
  }
  if (hasPermission === false) {
    return (
      <View style={[styles.center, { backgroundColor: C.bg }]}>
        <MaterialCommunityIcons name="camera-off" size={48} color={C.whiteSubtle} />
        <Text style={[styles.permText, { marginTop: 16 }]}>Sin acceso a la cámara</Text>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Volver</Text>
        </Pressable>
      </View>
    );
  }

  const isLoading = scanTicket.isPending || scanProducts.isPending;

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <Camera
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        type={CameraType.back}
        onCameraReady={() => setScanned(false)}
        onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
        barCodeScannerSettings={{ barCodeTypes: ['qr'], interval: 5000 }}
      />

      {/* ── Dark overlay with cutout ──────────────────────────────────── */}
      <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
        {/* Top mask */}
        <View style={[styles.mask, { flex: 1 }]}>
          {/* Header */}
          <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
            <Pressable
              onPress={() => router.back()}
              hitSlop={16}
              style={styles.headerBtn}
            >
              <MaterialCommunityIcons name="arrow-left" size={22} color={C.white} />
            </Pressable>
            <Text style={styles.headerTitle}>Escanear código</Text>
            <View style={{ width: 36 }} />
          </View>

          {/* Mode indicator */}
          <View style={styles.modeRow}>
            <MaterialCommunityIcons name="qrcode-scan" size={16} color={C.accent} />
            <Text style={styles.modeText}>Escaneando productos</Text>
          </View>
        </View>

        {/* Middle row: left mask – viewfinder – right mask */}
        <View style={{ flexDirection: 'row' }}>
          <View style={[styles.mask, { flex: 1 }]} />
          {/* Viewfinder (transparent) */}
          <View style={styles.viewfinder}>
            <Corner position="tl" />
            <Corner position="tr" />
            <Corner position="bl" />
            <Corner position="br" />
          </View>
          <View style={[styles.mask, { flex: 1 }]} />
        </View>

        {/* Bottom mask */}
        <View style={[styles.mask, { flex: 1, alignItems: 'center' }]}>
          {/* Loading */}
          {isLoading && (
            <View style={styles.loadingPill}>
              <ActivityIndicator size="small" color={C.white} />
              <Text style={styles.loadingText}>Procesando...</Text>
            </View>
          )}

          {/* Result toast */}
          {result && !isLoading && (
            <Animated.View
              style={[
                styles.toast,
                {
                  opacity: fadeAnim,
                  transform: [
                    {
                      translateY: fadeAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [20, 0],
                      }),
                    },
                  ],
                  borderColor:
                    result.type === 'success' ? C.success : C.error,
                },
              ]}
            >
              <MaterialCommunityIcons
                name={result.type === 'success' ? 'check-circle' : 'alert-circle'}
                size={24}
                color={result.type === 'success' ? C.success : C.error}
              />
              <Text style={styles.toastText}>{result.message}</Text>
            </Animated.View>
          )}

          {/* Scan again button */}
          {scanned && !isLoading && (
            <Pressable style={styles.scanAgainBtn} onPress={dismissResult}>
              <MaterialCommunityIcons name="qrcode-scan" size={18} color={C.accentText} />
              <Text style={styles.scanAgainText}>Escanear de nuevo</Text>
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  permText: {
    color: C.whiteSubtle,
    fontSize: 15,
    marginTop: 12,
    fontFamily: 'Montserrat_700Bold',
  },
  backBtn: {
    marginTop: 24,
    backgroundColor: C.primary,
    borderRadius: 50,
    paddingHorizontal: 28,
    paddingVertical: 12,
  },
  backBtnText: {
    color: C.white,
    fontSize: 15,
    fontFamily: 'Montserrat_800ExtraBold',
    textTransform: 'uppercase',
  },

  // Overlay masks
  mask: {
    backgroundColor: C.overlay,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: C.white,
    fontSize: 17,
    fontFamily: 'Montserrat_800ExtraBold',
    letterSpacing: -0.3,
  },

  // Mode indicator
  modeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingBottom: 16,
  },
  modeText: {
    color: C.accent,
    fontSize: 13,
    fontFamily: 'Montserrat_700Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Viewfinder
  viewfinder: {
    width: VIEWFINDER_SIZE,
    height: VIEWFINDER_SIZE,
  },
  corner: {
    position: 'absolute',
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderColor: C.accent,
  },

  // Loading pill
  loadingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 28,
    backgroundColor: C.surface,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 50,
  },
  loadingText: {
    color: C.white,
    fontSize: 14,
    fontFamily: 'Montserrat_700Bold',
  },

  // Result toast
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 24,
    marginHorizontal: 24,
    backgroundColor: C.surface,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderLeftWidth: 3,
  },
  toastText: {
    color: C.white,
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },

  // Scan again button
  scanAgainBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 20,
    backgroundColor: C.accent,
    borderRadius: 50,
    paddingHorizontal: 28,
    height: 48,
    shadowColor: C.accent,
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  scanAgainText: {
    color: C.accentText,
    fontSize: 15,
    fontFamily: 'Montserrat_800ExtraBold',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
});
