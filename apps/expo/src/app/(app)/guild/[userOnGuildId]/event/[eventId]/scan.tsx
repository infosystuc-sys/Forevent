import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { BarCodeScanner } from 'expo-barcode-scanner';
import { Camera, CameraType } from 'expo-camera';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Button, Pressable, StyleSheet, Text, View } from 'react-native';
import useTheme from '~/hooks/useTheme';
import { api } from '~/utils/api';

export default function App() {
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    const [scanned, setScanned] = useState(false);
    const { colors } = useTheme()
    const { employeeId, eventId } = useLocalSearchParams<{ employeeId: string, eventId: string }>();
    const cameraRef = React.useRef<any>(null)

    const qr = api.mobile.event.scanTicket.useMutation({
        onSuccess: () => {
            Alert.alert('QR escanedo exitosamente')
        },
        onError: (error) => {
            Alert.alert(error.message)
        }
    })

    useEffect(() => {
        const getBarCodeScannerPermissions = async () => {
            const { status } = await BarCodeScanner.requestPermissionsAsync();
            setHasPermission(status === 'granted');
        };

        getBarCodeScannerPermissions();
    }, []);

    const handleBarCodeScanned = ({ type, data }: any) => {
        setScanned(true);
        try {
            let parseData = JSON.parse(data)
            if (!parseData.url || !parseData.u || typeof (parseData.url) !== 'string' || typeof (parseData.u) !== 'string') {
                Alert.alert(`QR inválido`);
                return
            }
            qr.mutate({
                userOnGuildId:employeeId! as string,
                eventId: eventId! as string,
                userId: parseData.u,
                userTicketId: parseData.url
            })
        } catch (error) {
            Alert.alert(`QR inválido`);
        }
    };

    if (hasPermission === null) {
        return <Text>Requesting for camera permission</Text>;
    }
    if (hasPermission === false) {
        return <Text>No access to camera</Text>;
    }

    function log() {
        console.log("log")
    }

    return (
        <Camera ref={cameraRef} className='flex-1' type={CameraType.back} onCameraReady={() => { setScanned(false) }} onBarCodeScanned={handleBarCodeScanned} barCodeScannerSettings={{ barCodeTypes: [BarCodeScanner.Constants.BarCodeType.qr], interval: 5000 }}>
            <View className='px-10 flex-row w-full z-10 items-center justify-between mt-14 py-5'>
                <Pressable className='bg-green-500 z-20' onPress={log}>
                    <MaterialCommunityIcons name='chevron-left' color={colors.text} size={30} style={{ zIndex: 2, }} onPress={() => { console.log("click") }} />
                </Pressable>
                <Text style={{ fontWeight: "600", textAlign: 'center', fontSize: 16, color: colors.text }}>
                    Escanear código
                </Text>
                <Pressable className='bg-green-500 z-20' onPress={() => {
                    console.log("Historial")
                    router.back()
                }}>
                    <MaterialCommunityIcons name='history' color={colors.text} size={30} style={{ zIndex: 2 }} onPress={() => { }} />
                </Pressable>
            </View>
            {scanned && <Button title={'Tap to Scan Again'} onPress={() => setScanned(false)} />}
        </Camera>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'column',
        justifyContent: 'center',
    },
});