import { MaterialCommunityIcons, Octicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router/tabs';
import { Fontisto } from '@expo/vector-icons';
import useTheme from '~/hooks/useTheme';
import { useLocalSearchParams } from 'expo-router';

export default function AppLayout() {
  const { colors } = useTheme();
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  return (
    <Tabs screenOptions={({ route }) => ({
      tabBarStyle: {
        backgroundColor: colors.background,
        borderTopColor: '#444',
        borderTopWidth: 0.25
      },
      headerShown: false,
    })}>
      <Tabs.Screen
        name="posts"
        initialParams={{ eventId: eventId }}
        options={{
          tabBarShowLabel: false,
          tabBarIcon: ({ focused, color, size }) => <Octicons name="home" size={24} color={focused ? colors.text : colors.outline} />
        }}
      />
      <Tabs.Screen
        name="users"
        initialParams={{ eventId: eventId }}
        options={{
          tabBarShowLabel: false,
          tabBarIcon: ({ focused, color, size }) => <MaterialCommunityIcons name='account-group' size={24} color={focused ? colors.text : colors.outline} />
        }}
      />
      <Tabs.Screen
        name="store"
        initialParams={{ eventId: eventId }}
        options={{
          tabBarShowLabel: false,
          tabBarIcon: ({ focused, color, size }) => <Fontisto name="shopping-bag-1" size={24} color={focused ? colors.text : colors.outline} />
        }}
      />
      <Tabs.Screen
        name="chats"
        initialParams={{ eventId: eventId }}
        options={{
          tabBarShowLabel: false,
          tabBarIcon: ({ focused, color, size }) => <MaterialCommunityIcons name='message-text' size={24} color={focused ? colors.text : colors.outline} />
        }}
      />
    </Tabs>
  );
}