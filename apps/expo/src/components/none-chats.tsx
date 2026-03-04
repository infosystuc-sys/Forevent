import { StatusBar } from 'expo-status-bar'
import useTheme from '~/hooks/useTheme'
import React, { useMemo, useState } from 'react'
import { StyleSheet, Text, View, useColorScheme } from 'react-native'
import { useSession } from '~/context/auth'
import { ImageBackground } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import { router, useLocalSearchParams } from 'expo-router'
import { useForm } from 'react-hook-form'
import { Pressable } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { blurhash } from '~/utils/constants'

const NoneChats: React.FC = () => {
    const { eventId } = useLocalSearchParams<{ eventId: string }>();
    const [currentIndex, setCurrentIndex] = useState(0);
    const theme = useColorScheme()
    const { colors } = useTheme()
    const { control, handleSubmit, setError } = useForm();
    const { user } = useSession()
    const [screen, setScreen] = useState(0)

    // state
    const snapPoints = useMemo(() => [], []);

    // hooks
    const { bottom: safeBottomArea } = useSafeAreaInsets();

    return (
        <View style={{ flex: 1 }}>
            <StatusBar animated={true} backgroundColor='#00000000' style='light' />
            <ImageBackground cachePolicy='memory-disk' placeholder={blurhash} priority='high' style={[{ flex: 1, backgroundColor: colors.inverseText }]} source={require("../assets/background/notickets.png")} >
                <LinearGradient start={{ x: 0, y: 0 }} end={{ x: 0, y: 0.6 }} style={{ flex: 1 }} colors={['rgba(0,0,0,0)', 'rgba(0,0,0,1)']}>
                    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ textTransform: "uppercase", fontSize: 50, lineHeight: 50, letterSpacing: -2, color: colors.text, textAlign: 'center', fontWeight: "700" }} numberOfLines={2}>
                            Conoce gente
                        </Text>
                        <Text style={{ color: colors.text, paddingTop: 10, fontSize: 15 }}>
                            Mira las personas que estan contigo en el evento
                        </Text>
                        <Pressable style={{ backgroundColor: colors.text, borderRadius: 25, marginTop: 20 }} onPress={() => {
                            router.push({ pathname: "/(app)/home/event/[eventId]/live/(tabs)/users", params: { eventId: eventId } })
                        }}>
                            <Text style={{ textTransform: "uppercase", color: colors.inverseText, paddingHorizontal: 20, paddingVertical: 12.5, fontSize: 16, fontWeight: "600" }}>
                                Buscar
                            </Text>
                        </Pressable>
                    </View>
                </LinearGradient>
            </ImageBackground >
        </View >
    )
}

const styles = StyleSheet.create({
})

export default NoneChats