import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { FlashList } from '@shopify/flash-list'
import { Image } from 'expo-image'
import { router, useLocalSearchParams } from 'expo-router'
import React from 'react'
import { Pressable, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Logo from '~/assets/logo'
import useTheme from '~/hooks/useTheme'
import { api } from '~/utils/api'
import { PLACEHOLDER, blurhash, dayjs } from '~/utils/constants'

export default function Page() {
  const { colors } = useTheme()
  const { userOnGuildId } = useLocalSearchParams<{ userOnGuildId: string }>();
  const events = api.mobile.employeeOnEvent.events.useQuery({ userOnGuildId: userOnGuildId! as string })
  return (
    <SafeAreaView className='flex-1'>
      <View style={{ height: 60, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View className='flex-row items-end'>
          <View style={{ height: 35, width: 35 }}>
            <Logo fill={colors.text} />
          </View>
          <Text style={{ color: colors.text, fontSize: 20 }}>orevent</Text>
        </View>
        <Pressable style={{ justifyContent: 'center', alignItems: 'center', padding: 4, borderRadius: 50, borderWidth: 1, borderColor: colors.text }}>
          <MaterialCommunityIcons name={'map-marker-outline'} style={{}} size={20} color={colors.text} />
        </Pressable>
      </View>
      <FlashList
        data={events.data}
        keyExtractor={(item, index) => index.toString()}
        ItemSeparatorComponent={() => <View style={{ height: 5 }} />}
        estimatedItemSize={20}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        overScrollMode='never'
        bounces={false}
        scrollEnabled={false}
        ListHeaderComponent={() => <Text numberOfLines={2} style={{ paddingHorizontal: 20, textTransform: "uppercase", fontWeight: "800", fontSize: 25, lineHeight: 50, letterSpacing: -1, color: colors.text }}>
          Transcurriendo
        </Text>}
        ListEmptyComponent={() =>
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ color: colors.text }}>
              Ningún evento transcurriendo actualmente
            </Text>
          </View>
        }
        ListFooterComponent={() => <View style={{ height: 40 }} />}
        renderItem={({ item }) =>
          <View style={{ paddingHorizontal: 15, flex: 1, flexDirection: "row" }}>
            <Pressable style={{ flex: 1, width: '100%', borderRadius: 15, alignItems: 'center', paddingVertical: 7.5, paddingHorizontal: 7.5, flexDirection: "row", gap: 10 }} onPress={() => { router.replace({ pathname: `/(app)/guild/[userOnGuildId]/event/[eventId]/scan`, params: { userOnGuildId, eventId: item.event?.id as string } }) }}>
              <View style={{ shadowOpacity: .5, shadowRadius: 5, shadowColor: colors.primaryAdmin, borderColor: colors.primaryAdmin, backgroundColor: colors.surface, borderBottomRightRadius: 25, borderTopLeftRadius: 25, borderWidth: 1 }}>
                <Image cachePolicy='memory-disk' placeholder={blurhash} priority='high' style={{ flex: 0, width: 120, height: 120, zIndex: 0, borderBottomRightRadius: 25, borderTopLeftRadius: 25 }} source={{ uri: item.event?.image ?? PLACEHOLDER }} />
                <View style={{ position: 'absolute', alignSelf: 'center', padding: 10, bottom: 40, backgroundColor: "rgba(0, 0, 0, 0.8)", borderRadius: 100 }}>
                  <MaterialCommunityIcons name={'qrcode-scan'} style={{}} size={20} color={colors.text} />
                </View>
              </View>
              <View style={{ paddingVertical: 7.5, paddingHorizontal: 5, flex: 1, justifyContent: 'space-between', alignSelf: 'flex-start' }}>
                <View style={{ paddingBottom: 15 }}>
                  <Text style={{ fontSize: 20, paddingBottom: 5, letterSpacing: 0, color: colors.text, textAlign: 'left' }}>
                    {item.event?.name}
                  </Text>
                  <Text style={{ textTransform: 'capitalize', color: 'yellow', fontSize: 13, paddingBottom: 2.5 }}>
                    {dayjs.utc(item.event?.startsAt).local().locale('es').format('dddd D')} <Text style={{ textTransform: 'lowercase' }}>de</Text> {dayjs.utc(item.event?.startsAt).local().locale('es').format('MMMM')}
                  </Text>
                  <Text style={{ color: colors.outline, fontSize: 13 }}>
                    {item.event?.location?.name}, {item.event?.location?.city}
                  </Text>
                  {item?.counter?.name && <Text style={{ color: colors.outline, fontSize: 13 }}>
                    {item.counter.name}
                  </Text>}
                </View>
              </View>
            </Pressable>
          </View>
        }
      />
    </SafeAreaView>
  )
}