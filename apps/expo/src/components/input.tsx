import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { BottomSheetTextInput, BottomSheetView } from '@gorhom/bottom-sheet'
import React from 'react'
import { Pressable, StyleSheet, Text, TextInput as RNTextInput, TextInputProps, View } from 'react-native'

interface Props extends TextInputProps {
    errorMessage?: string;
    label: string;
    bottomSheet?: boolean;
}

const TextInput: React.FC<Props> = ({
    errorMessage,
    label,
    bottomSheet,
    ...textInputProps
}) => {
    const [visible, setVisible] = React.useState(textInputProps.secureTextEntry ?? false)
    const toggleVisibility = React.useCallback(() => setVisible(!visible), [visible])

    return bottomSheet ?
        <BottomSheetView style={styles.wrapper}>
            <Text className='font-semibold text-lg mb-3 text-white'>{label}</Text>
            <BottomSheetView style={styles.textInput}>
                <BottomSheetTextInput
                    style={{
                        display: "flex",
                        flex: 1,
                        color: "#fff",
                        paddingVertical: 15,
                    }}
                    placeholder='Ingresa texto'
                    autoCorrect={false}
                    placeholderTextColor={"#999"}
                    autoCapitalize="none"
                    {...textInputProps}
                    secureTextEntry={visible}
                />
                {textInputProps.secureTextEntry && (
                    <Pressable onPress={() => { setVisible(!visible) }}>
                        {visible ?
                            <MaterialCommunityIcons name="eye-outline" style={{ paddingVertical: 10, paddingHorizontal: 15, margin: 0, borderRadius: 50 }} size={22} color={"#fff"} />
                            :
                            <MaterialCommunityIcons name="eye-off-outline" style={{ paddingVertical: 10, paddingHorizontal: 15, margin: 0 }} size={22} color={"#fff"} />
                        }
                    </Pressable>
                )}
            </BottomSheetView>
            {!!errorMessage && (
                <Text className='font-bold font-lg' style={styles.errorMessageText}>{errorMessage}</Text>)
            }
        </BottomSheetView>
        :
        <View style={styles.wrapper}>
            <Text className='font-semibold text-lg mb-3 text-white'>{label}</Text>
            <View style={styles.textInput}>
                <RNTextInput
                    style={{
                        display: "flex",
                        flex: 1,
                        color: "#fff",
                        paddingVertical: 15,
                    }}
                    autoCorrect={false}
                    placeholderTextColor={"#999"}
                    placeholder='example@example.com'
                    autoCapitalize="none"
                    {...textInputProps}
                    secureTextEntry={visible}
                />
                {textInputProps.secureTextEntry && (
                    <Pressable onPress={() => { setVisible(!visible) }}>
                        {visible ?
                            <MaterialCommunityIcons name="eye-outline" style={{ paddingVertical: 10, paddingHorizontal: 15, margin: 0, borderRadius: 50 }} size={22} color={"#fff"} />
                            :
                            <MaterialCommunityIcons name="eye-off-outline" style={{ paddingVertical: 10, paddingHorizontal: 15, margin: 0 }} size={22} color={"#fff"} />
                        }
                    </Pressable>
                )}
            </View>
            {!!errorMessage && (
                <Text className='font-bold font-lg' style={styles.errorMessageText}>{errorMessage}</Text>)
            }
        </View>
}

const styles = StyleSheet.create({
    wrapper: {
        width: '100%',
        marginBottom: 4,
    },
    textInput: {
        borderWidth: 1,
        borderColor: "#FFD25B",
        shadowColor: "#FFD25B",
        backgroundColor: "#000",
        shadowOpacity: 0.2,
        shadowRadius: 10,
        paddingHorizontal: 12,
        borderRadius: 8,
        elevation: 1,
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between"
    },
    errorMessageText: {
        color: '#ff0020',
        marginTop: 6,
    },
});

export default React.memo(TextInput)