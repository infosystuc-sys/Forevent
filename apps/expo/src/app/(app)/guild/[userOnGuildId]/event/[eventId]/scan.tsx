import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Camera, CameraType } from 'expo-camera';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import useTheme from '~/hooks/useTheme';
import { api } from '~/utils/api';

export default function App() {
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    const [scanned, setScanned] = useState(false);
    const { colors } = useTheme()
    const { userOnGuildId, eventId } = useLocalSearchParams<{ userOnGuildId: string, eventId: string }>();
    const cameraRef = React.useRef<Camera>(null)

    // Mutation para escanear ENTRADAS (empleado con gateId — portero)
    const scanTicket = api.mobile.event.scanTicket.useMutation({
        onSuccess: () => {
            Alert.alert('Entrada escaneada exitosamente')
        },
        onError: (error) => {
            Alert.alert('Error', error.message)
        }
    })

    // Mutation para escanear PRODUCTOS (empleado con counterId — cajero/barrero)
    const scanProducts = api.mobile.event.scanProducts.useMutation({
        onSuccess: () => {
            Alert.alert('Productos entregados exitosamente')
        },
        onError: (error) => {
            Alert.alert('Error', error.message)
        }
    })

    useEffect(() => {
        (async () => {
            const { status } = await Camera.requestCameraPermissionsAsync();
            setHasPermission(status === 'granted');
        })();
    }, []);

    const handleBarCodeScanned = (scanResult: { type: string; data: string }) => {
        if (scanned) return;
        setScanned(true);
        try {
            const parseData = JSON.parse(scanResult.data);

            // QR de PRODUCTO (desde "Mis compras" / purchases):
            // Formato: { s: userId, p: [purchaseId1, purchaseId2, ...] }
            if (parseData.s && parseData.p) {
                const userId = parseData.s;
                const productIds = Array.isArray(parseData.p) ? parseData.p : [parseData.p];

                if (typeof userId !== 'string' || productIds.some((id: unknown) => typeof id !== 'string')) {
                    Alert.alert('QR inválido');
                    return;
                }

                scanProducts.mutate({
                    userOnGuildId: userOnGuildId!,
                    eventId: eventId!,
                    userId,
                    userProductsIds: productIds,
                });
                return;
            }

            // QR de ENTRADA (ticket) o COMPRA individual:
            // Formato: { url: userTicketId | purchaseId, u: userId }
            if (parseData.url && parseData.u) {
                if (typeof parseData.url !== 'string' || typeof parseData.u !== 'string') {
                    Alert.alert('QR inválido');
                    return;
                }

                scanTicket.mutate({
                    userOnGuildId: userOnGuildId!,
                    eventId: eventId!,
                    userId: parseData.u,
                    userTicketId: parseData.url,
                });
                return;
            }

            Alert.alert('QR inválido', 'El código no corresponde a una entrada ni a un producto.');
        } catch (error) {
            Alert.alert('QR inválido');
        }
    };

    if (hasPermission === null) {
        return (
            <View style={[styles.container, { backgroundColor: '#000' }]}>
                <Text style={{ color: '#fff' }}>Solicitando permiso de cámara...</Text>
            </View>
        );
    }
    if (hasPermission === false) {
        return (
            <View style={[styles.container, { backgroundColor: '#000' }]}>
                <Text style={{ color: '#fff' }}>Sin acceso a la cámara</Text>
            </View>
        );
    }

    const isLoading = scanTicket.isPending || scanProducts.isPending;

    return (
        <View style={{ flex: 1 }}>
            <Camera
                ref={cameraRef}
                style={StyleSheet.absoluteFill}
                type={CameraType.back}
                onCameraReady={() => setScanned(false)}
                onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
                barCodeScannerSettings={{
                    barCodeTypes: ['qr'],
                    interval: 5000,
                }}
            >
                <View style={styles.overlay}>
                    <View style={styles.topBar}>
                        <Pressable onPress={() => router.back()} hitSlop={12}>
                            <MaterialCommunityIcons name='chevron-left' color={colors.text} size={30} />
                        </Pressable>
                        <Text style={{ fontWeight: '600', fontSize: 16, color: colors.text }}>
                            Escanear código
                        </Text>
                        <Pressable onPress={() => router.back()} hitSlop={12}>
                            <MaterialCommunityIcons name='history' color={colors.text} size={30} />
                        </Pressable>
                    </View>

                    {scanned && !isLoading && (
                        <Pressable style={styles.scanAgainButton} onPress={() => setScanned(false)}>
                            <Text style={styles.scanAgainText}>Escanear de nuevo</Text>
                        </Pressable>
                    )}

                    {isLoading && (
                        <View style={styles.scanAgainButton}>
                            <Text style={styles.scanAgainText}>Procesando...</Text>
                        </View>
                    )}
                </View>
            </Camera>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    overlay: {
        flex: 1,
        justifyContent: 'space-between',
    },
    topBar: {
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 50,
        paddingBottom: 10,
    },
    scanAgainButton: {
        alignSelf: 'center',
        marginBottom: 80,
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 30,
    },
    scanAgainText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});
