import { Fontisto, MaterialCommunityIcons, Octicons } from '@expo/vector-icons'
import { Tabs } from 'expo-router/tabs'
import useTheme from '~/hooks/useTheme'
import { useLocalSearchParams } from 'expo-router'
import { api } from '~/utils/api'
import { Text, View } from 'react-native'

export default function AppLayout() {
    const { colors } = useTheme()
    const { eventId } = useLocalSearchParams<{ eventId: string }>()

    const unread = api.mobile.chat.unreadCount.useQuery(
        { eventId: eventId! as string },
        { refetchInterval: 30_000, enabled: !!eventId }
    )

    const unreadCount = unread.data?.count ?? 0

    return (
        <Tabs screenOptions={() => ({
            tabBarStyle: {
                backgroundColor: colors.background,
                borderTopColor: '#444',
                borderTopWidth: 0.25,
            },
            headerShown: false,
        })}>
            <Tabs.Screen
                name="posts"
                initialParams={{ eventId }}
                options={{
                    tabBarShowLabel: false,
                    tabBarIcon: ({ focused }) => <Octicons name="home" size={24} color={focused ? colors.text : colors.outline} />,
                }}
            />
            <Tabs.Screen
                name="users"
                initialParams={{ eventId }}
                options={{
                    tabBarShowLabel: false,
                    tabBarIcon: ({ focused }) => <MaterialCommunityIcons name='account-group' size={24} color={focused ? colors.text : colors.outline} />,
                }}
            />
            <Tabs.Screen
                name="store"
                initialParams={{ eventId }}
                options={{
                    tabBarShowLabel: false,
                    tabBarIcon: ({ focused }) => <Fontisto name="shopping-bag-1" size={24} color={focused ? colors.text : colors.outline} />,
                }}
            />
            <Tabs.Screen
                name="chats"
                initialParams={{ eventId }}
                options={{
                    tabBarShowLabel: false,
                    tabBarIcon: ({ focused }) => (
                        <View>
                            <MaterialCommunityIcons name='message-text' size={24} color={focused ? colors.text : colors.outline} />
                            {unreadCount > 0 && (
                                <View style={{
                                    position: 'absolute', top: -4, right: -8,
                                    backgroundColor: '#0086ff', borderRadius: 8,
                                    minWidth: 16, height: 16,
                                    alignItems: 'center', justifyContent: 'center',
                                    paddingHorizontal: 4,
                                }}>
                                    <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>
                                        {unreadCount > 9 ? '9+' : unreadCount}
                                    </Text>
                                </View>
                            )}
                        </View>
                    ),
                }}
            />
        </Tabs>
    )
}
