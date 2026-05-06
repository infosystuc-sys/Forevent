import React from 'react'
import { Text, View } from 'react-native'
import useTheme from '~/hooks/useTheme'

export default function NoneMessages({ name }: { name?: string }) {
    const { colors } = useTheme()

    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 }}>
            <Text style={{ color: colors.text, fontSize: 22, fontWeight: '700', textAlign: 'center', marginBottom: 8 }}>
                {name ? `Empezá a hablar con ${name}` : 'Sé el primero en saludar'}
            </Text>
            <Text style={{ color: '#666', fontSize: 14, textAlign: 'center' }}>
                Enviá un mensaje para iniciar la conversación
            </Text>
        </View>
    )
}
