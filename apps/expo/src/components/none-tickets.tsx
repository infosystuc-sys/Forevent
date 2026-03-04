import { View, Text } from 'react-native'
import React from 'react'
import { StatusBar } from 'expo-status-bar'
import { ImageBackground } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import useTheme from '~/hooks/useTheme'
import { blurhash } from '~/utils/constants'
import { Link } from 'expo-router'

export default function NoneTickets() {
    const { colors } = useTheme()
    return (
        <View style={{ flex: 1 }}>
            <StatusBar animated={true} backgroundColor='#00000000' style='light' />
            <ImageBackground cachePolicy='memory-disk' placeholder={blurhash} priority='high' style={[{ flex: 1, backgroundColor: colors.inverseText }]} source={require('~/assets/background/notickets.png')} >
                <LinearGradient start={{ x: 0, y: 0 }} end={{ x: 0, y: 0.6 }} style={{ flex: 1 }} colors={['rgba(0,0,0,0)', 'rgba(0,0,0,1)']}>
                    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', }}>
                        <Text style={{ textTransform: 'uppercase', fontWeight: "800", fontSize: 50, lineHeight: 50, letterSpacing: -4, color: colors.text, textAlign: 'center' }}>
                            mira que{'\n'}hay de nuevo
                        </Text>
                        <Text style={{ lineHeight: 20, letterSpacing: .25, color: colors.text, paddingTop: 10, paddingHorizontal: 30, textAlign: 'center', fontSize: 15 }}>
                            Estás buscando algo que hacer? Mira los eventos que tenemos para ti, compra entradas e invita a tus amigos.
                        </Text>
                        <View style={{ backgroundColor: colors.text, borderRadius: 100, position: 'absolute', bottom: '30%', paddingHorizontal: 20, paddingVertical: 10 }}>
                            <Link href={'/home/'} >
                                <Text style={{ color: colors.inverseText, fontWeight: "400", paddingHorizontal: 20, textTransform: 'uppercase', paddingVertical: 12.5, fontSize: 14 }}>
                                    Descubrir eventos
                                </Text>
                            </Link>
                        </View>
                    </View>
                </LinearGradient>
            </ImageBackground >
        </View >
    )
}