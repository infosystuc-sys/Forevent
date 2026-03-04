import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { FlashList } from '@shopify/flash-list';
import { Image, ImageBackground } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import useTheme from '~/hooks/useTheme';
import { api } from '~/utils/api';
import { PLACEHOLDER, USER_CATEGORIES, blurhash, dayjs } from '~/utils/constants';

export default function Page() {
  const { colors } = useTheme()
  const { category } = useLocalSearchParams<{ category: string }>();

  console.log(category, "categoria")

  const categoryData = USER_CATEGORIES?.find((cat) => cat.name === category)

  const categorizedEvents = api.mobile.event.byCategory.useQuery({ page: "1", latitude: 0, longitude: 0, take: 10, type: category as any })

  return (
    <View style={{ flex: 1, flexDirection: 'column' }}>
      <ImageBackground
        contentFit='cover'
        contentPosition={'center'}
        style={{ flex: 1 }}
        source={
          category?.toLowerCase() === "tonight" ?
            require("../../../../assets/background/tonight.png")
            :
            category?.toLowerCase() === "thisweek" ?
              require("../../../../assets/background/thisweek.png")
              :
              category?.toLowerCase() === "speed" ?
                require("../../../../assets/background/speed.png")
                :
                category?.toLowerCase() === "private" ?
                  require("../../../../assets/background/private.png")
                  :
                  category?.toLowerCase() === "cultural" ?
                    require("../../../../assets/background/cultural.png")
                    :
                    category?.toLowerCase() === "bar" ?
                      require("../../../../assets/background/bar.png")
                      :
                      category?.toLowerCase() === "notickets" ?
                        require("../../../../assets/background/notickets.png")
                        :
                        require("../../../../assets/background/trending.png")
        } >
        <LinearGradient start={{ x: 0.1, y: 0 }} end={{ x: 0, y: 0.2 }} style={{ flex: 1 }} colors={['rgba(0,0,0,0)', 'rgba(0,0,0,1)']}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 60 }}>
            <Pressable style={{ padding: 7.5, borderRadius: 50, backgroundColor: colors.text }} onPress={() => { router.back() }}>
              <MaterialCommunityIcons name={'arrow-left'} style={{}} size={20} color={colors.inverseText} />
            </Pressable>
            {/* <Pressable onPress={() => { router.back() }} style={{ backgroundColor: colors.text, borderRadius: 15 }}>
              <Text style={{ color: colors.inverseText, paddingHorizontal: 15, paddingVertical: 6, fontSize: 14, textTransform: "uppercase" }}>
                Fecha
              </Text>
            </Pressable> */}
          </View>
          <View style={{ paddingHorizontal: 20, paddingTop: 5 }}>
            <View style={{ paddingTop: 25, gap: 10 }}>
              <Text numberOfLines={2} style={{ textTransform: "uppercase", fontWeight: "800", fontSize: 35, lineHeight: 50, letterSpacing: -.5, color: colors.text }}>
                {categoryData?.title}
              </Text>
              <Text style={{ color: "#cccccc", fontSize: 14, fontWeight: "600", paddingLeft: 5 }}>
                {categoryData?.about}
              </Text>
            </View>
          </View>
          <FlashList
            data={categorizedEvents.data}
            estimatedItemSize={20}
            ItemSeparatorComponent={() => <View style={{ height: 25 }} />}
            ListHeaderComponent={() => <View style={{ height: 25 }} />}
            showsVerticalScrollIndicator={false}
            showsHorizontalScrollIndicator={false}
            ListEmptyComponent={() => <View>
              {categorizedEvents.isLoading ? <ActivityIndicator color={colors.text} size={25} /> : <Text style={{ fontSize: 15, letterSpacing: 0, color: colors.text, textAlign: 'center', paddingTop: 20 }} numberOfLines={4}>
                No hay ningun evento de este tipo en tu ubicación
              </Text>
              }
            </View>}
            renderItem={({ item }) => {
              console.log(item, "ITEM")
              return (
                <Link asChild href={{ pathname: "/(app)/home/event/[eventId]/", params: { eventId: item.id } }}>
                  <Pressable style={{ alignItems: "center", width: '100%', paddingHorizontal: 20 }}>
                    <View style={{ paddingHorizontal: 10, width: '100%', borderRadius: 15, alignItems: 'center' }}>
                      <View style={{ justifyContent: 'space-between', alignItems: 'center', width: '100%', flexDirection: 'row', gap: 20 }}>
                        <Image cachePolicy='memory-disk' placeholder={blurhash} priority='high' style={{ borderRadius: 5, backgroundColor: colors.onBackground, width: 125, height: 125 }} source={{ uri: item.image ?? PLACEHOLDER }} />
                        <View style={{ flex: 1, gap: 5 }}>
                          <Text numberOfLines={4} style={{ fontSize: 17.5, letterSpacing: 0, color: colors.text, textAlign: 'left', fontWeight: "600" }}>
                            {item.name}
                          </Text>
                          <Text numberOfLines={4} style={{ color: colors.text, fontSize: 12.5 }}>
                            {item?.location?.name}
                          </Text>
                          <Text numberOfLines={4} style={{ color: colors.text, fontSize: 12.5 }}>
                            {item.startsAt ? dayjs(item.startsAt).locale('es').format('LT') : "00:00"},&nbsp;
                            {dayjs(item.startsAt).locale('es').format('dddd D').charAt(0).toUpperCase()}{dayjs(item.startsAt).locale('es').format('dddd D').slice(1)} de {dayjs(item.startsAt).locale('es').format('MMMM').charAt(0).toUpperCase()}{dayjs(item.startsAt).locale('es').format('MMMM').slice(1)}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </Pressable>
                </Link>
              )
            }}
          />
        </LinearGradient>
      </ImageBackground>
    </View>
  )
}