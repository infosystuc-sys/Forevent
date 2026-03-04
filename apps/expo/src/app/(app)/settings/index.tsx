import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { FlashList } from '@shopify/flash-list'
import { router } from 'expo-router'
import React from 'react'
import { Alert, Pressable, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useSession } from '~/context/auth'
import useTheme from '~/hooks/useTheme'
import { api } from '~/utils/api'

type ItemCode = 'GUILDS' | 'LOGOUT'

const items: { code: ItemCode; text: string; icon: string }[] = [
    {
        code: 'GUILDS',
        text: 'Organizaciones',
        icon: 'briefcase-outline',
    },
    {
        code: 'LOGOUT',
        text: 'Cerrar sesión',
        icon: 'logout',
    },
]

export default function Page() {
    const { colors } = useTheme()
    const { signOut, user, session } = useSession()

    const signoutMutation = api.mobile.auth.logout.useMutation({
        onSettled: () => {
            // signOut() clears SecureStore + AsyncStorage + React state.
            // The (app)/_layout.tsx guard then auto-redirects to /(auth)/login.
            signOut()
            console.log('Sesión eliminada correctamente del dispositivo')
        },
    })

    function handleLogout() {
        Alert.alert(
            'Cerrar sesión',
            '¿Estás seguro de que querés salir?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Salir',
                    style: 'destructive',
                    onPress: () => {
                        if (user?.id && session) {
                            signoutMutation.mutate({ userId: user.id, sessionId: session })
                        } else {
                            // Fallback: clear local state even without server confirmation
                            signOut()
                            console.log('Sesión eliminada correctamente del dispositivo')
                        }
                    },
                },
            ],
        )
    }

    function handlePress(code: ItemCode) {
        switch (code) {
            case 'GUILDS':
                router.push('/(app)/settings/guilds')
                break
            case 'LOGOUT':
                handleLogout()
                break
        }
    }

    return (
        <SafeAreaView>
            <Pressable
                style={{ padding: 20, borderRadius: 50, alignItems: 'center', flexDirection: 'row' }}
                onPress={() => { if (router.canGoBack()) router.back() }}
            >
                <MaterialCommunityIcons name='arrow-left' size={18} color={colors.text} />
                <Text style={{ color: colors.text, fontSize: 20, paddingHorizontal: 20 }}>
                    Configuración
                </Text>
            </Pressable>
            <View className='h-full w-full px-5'>
                <FlashList
                    data={items}
                    estimatedItemSize={20}
                    showsVerticalScrollIndicator={false}
                    showsHorizontalScrollIndicator={false}
                    overScrollMode='never'
                    keyExtractor={(_, index) => index.toString()}
                    ItemSeparatorComponent={() => (
                        <View style={{ borderBottomColor: colors.outlineVariant, borderBottomWidth: 1 }} />
                    )}
                    renderItem={({ item }) => (
                        <Pressable
                            style={{ flexDirection: 'row', alignItems: 'center', paddingRight: 15, paddingVertical: 10 }}
                            onPress={() => handlePress(item.code)}
                        >
                            <View style={{ paddingHorizontal: 20, paddingVertical: 5, borderRadius: 50 }}>
                                <MaterialCommunityIcons
                                    name={item.icon as any}
                                    size={18}
                                    color={item.code === 'LOGOUT' ? '#ef4444' : colors.text}
                                />
                            </View>
                            <Text style={{
                                color: item.code === 'LOGOUT' ? '#ef4444' : colors.text,
                                fontSize: 14,
                                fontWeight: item.code === 'LOGOUT' ? '600' : '400',
                            }}>
                                {item.text}
                            </Text>
                        </Pressable>
                    )}
                />
            </View>
        </SafeAreaView>
    )
}