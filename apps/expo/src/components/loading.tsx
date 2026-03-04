import { View, Text, ActivityIndicator } from 'react-native'
import React from 'react'

const Loading = () => {
    return (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#000" }}>
            <ActivityIndicator size={20} color={'#fff'}  />
        </View>
    )
}

export default Loading