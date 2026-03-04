import { View, Text } from 'react-native'
import React from 'react'
import useTheme from '~/hooks/useTheme';

const Divider = ({ style }: any) => {
    const { colors } = useTheme();
    return (
        <View style={[{ shadowOpacity: 0.75, shadowRadius: 4, backgroundColor: colors.primary, shadowColor: colors.primary, height: 1.5, width: "100%", padding: 0, margin: 0 }, style]} />
    )
}

export default Divider