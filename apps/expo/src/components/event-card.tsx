import { View, Text, Pressable, StyleProp, ViewStyle } from 'react-native'
import React from 'react'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import useTheme from '~/hooks/useTheme'
import { IANA, PLACEHOLDER, blurhash, dayjs } from '~/utils/constants'
import { Link, router } from 'expo-router'
import { RouterOutputs } from '@forevent/api'
import { ArrayElement } from 'node_modules/@forevent/api/src/root'

const EventCard = ({ item, back, like, menu, price, showData, style }: {
    menu?: () => void,
    price?: boolean,
    back?: boolean,
    like?: boolean,
    showData?: boolean,
    item: ArrayElement<RouterOutputs['mobile']["event"]["highlighted"]>
    style?: StyleProp<ViewStyle>
}) => {
    const { colors } = useTheme();

    return (
        <View style={{ flex: 1, paddingTop: 20 }}>
            <Link asChild href={{ pathname: "/(app)/home/event/[eventId]/", params: { eventId: item.id } }}>
                <Pressable style={[{ flex: 1, elevation: 50, shadowOpacity: 0.8, shadowRadius: 7.5, shadowColor: colors.primary, borderColor: colors.primary, alignItems: 'center', backgroundColor: colors.inverseText, width: '100%', borderBottomRightRadius: 75, borderTopLeftRadius: 75, borderWidth: 1 }, style]}>
                    {back &&
                        <Pressable onPress={() => { router.back() }} style={{ position: 'absolute', top: 0, left: 0, borderRadius: 100, zIndex: 1000, alignItems: 'center', justifyContent: 'center', padding: 7.5, backgroundColor: colors.text }}>
                            <MaterialCommunityIcons name={'arrow-left'} style={{}} size={20} color={colors.inverseText} />
                        </Pressable>
                    }
                    {price &&
                        <View style={{ position: 'absolute', top: -10, left: 0, zIndex: 1000, width: 65, height: 65, backgroundColor: colors.inverseText, borderRadius: 100, alignItems: 'center', justifyContent: 'center' }}>
                            <Text style={{ fontSize: 12, color: colors.text, alignSelf: 'center', zIndex: 1000 }}>
                                DESDE
                            </Text>
                            <Text style={{ fontSize: 16, color: colors.text, alignSelf: 'center', zIndex: 1000 }}>
                                ${item?.tickets[0]?.price.toLocaleString() ?? '20'}
                            </Text>
                        </View>
                    }
                    {menu &&
                        <View style={{ position: 'absolute', top: 10, right: 10, zIndex: 1000 }}>
                            <Pressable style={{ justifyContent: 'center', alignItems: 'center', padding: 7.5, borderRadius: 50, backgroundColor: colors.text }}>
                                <MaterialCommunityIcons name={'dots-horizontal'} size={20} color={colors.inverseText} />
                            </Pressable>
                        </View>
                    }
                    {like &&
                        <View style={{ position: 'absolute', bottom: 10, left: 10, zIndex: 1000 }}>
                            <Pressable style={{ justifyContent: 'center', alignItems: 'center', padding: 7.5, borderRadius: 50, backgroundColor: colors.text, zIndex: 1000 }}>
                                <MaterialCommunityIcons name={'heart-outline'} size={20} color={colors.inverseText} />
                            </Pressable>
                        </View>
                    }
                    <View style={{ width: "100%", aspectRatio: 1 }}>
                        <Image cachePolicy='memory-disk' placeholder={blurhash} priority='high' style={{ backgroundColor: colors.surface, width: '100%', aspectRatio: 1, borderBottomRightRadius: 75, borderTopLeftRadius: 75, zIndex: 0 }} source={{ uri: item.image ?? PLACEHOLDER }} />
                        {showData &&
                            <LinearGradient start={{ x: 0, y: 0 }} end={{ x: 0, y: 0.75 }} style={{ flex: 1, borderBottomRightRadius: 75, borderRadius: 0, zIndex: 2, position: "absolute", bottom: 0, width: "100%" }} colors={['transparent', 'rgba(11,11,11,0.8)']}>
                                <View style={{ flex: 1, justifyContent: 'flex-end', alignItems: 'center', marginBottom: 25 }}>
                                    <Text style={{ color: '#fff', fontSize: 20 }}>
                                        Nuevo
                                    </Text>
                                    <Text style={{ fontSize: 25, letterSpacing: 0, color: colors.text, textAlign: 'left' }} >
                                        {item.name}
                                    </Text>
                                    <Text style={{ color: colors.text, fontSize: 13, textTransform: 'capitalize' }}>
                                        {dayjs.utc(item.startsAt).local().locale('es').format('dddd D')} <Text style={{ textTransform: 'lowercase' }}>de</Text> {dayjs.utc(item.startsAt).local().locale('es').format('MMMM')}, {dayjs.utc(item.startsAt).local().locale('es').format('HH:mm')}
                                    </Text>
                                    <Text style={{ color: 'yellow', fontSize: 13, maxWidth: '60%', textAlign: 'center' }}>
                                        {item?.location?.name}, {item?.location?.city}
                                    </Text>
                                </View>
                            </LinearGradient>
                        }
                    </View>
                </Pressable>
            </Link>
        </View>
    )
}

export default EventCard