import Bar from '~/assets/svg/bar';
import Cultural from '~/assets/svg/cultural';
import PrivateEvent from '~/assets/svg/private-event';
import SpeedIcon from "~/assets/svg/speed";
import ThisWeek from '~/assets/svg/this-week';
import Today from '~/assets/svg/today';
import Trending from '~/assets/svg/trending';
import { router } from 'expo-router';
import useTheme from '~/hooks/useTheme';
import React from 'react';
import { LogBox, Pressable, Text, View, ViewStyle } from 'react-native';
import { TouchableWithoutFeedback } from "react-native-gesture-handler";
import { AnimatedStyleProp, interpolate } from "react-native-reanimated";
import Carousel, { ICarouselInstance } from "react-native-reanimated-carousel";
import { PAGE_WIDTH } from '~/utils/constants';
import { SvgProps } from 'react-native-svg';

export type TAnimationStyle = (value: number) => AnimatedStyleProp<ViewStyle>;

const USER_CATEGORIES = [
    {
        name: "TRENDING",
        title: 'Tendencias',
        icon: Trending,
        color: '#ffb852',
        about: 'Eventos más populares',
        navigate: { pathname: "/(app)/home/[category]/", params: { category: "TRENDING" } }
    },
    {
        name: "SPEED",
        title: 'Speed',
        icon: SpeedIcon,
        color: '#db0000',
        about: 'Eventos auspiciados por speed',
        navigate: { pathname: "/(app)/home/[category]/", params: { category: "SPEED" } }
    },
    {
        name: "TONIGHT",
        title: 'Hoy',
        icon: Today,
        color: '#ff00ff',
        about: 'Eventos que transcurrirán hoy',
        navigate: { pathname: "/(app)/home/[category]/", params: { category: "TONIGHT" } }
    },
    {
        name: "THISWEEK",
        title: 'Esta semana',
        icon: ThisWeek,
        color: '#ff0094',
        about: 'Eventos que transcurren esta semana',
        navigate: { pathname: "/(app)/home/[category]/", params: { category: "THISWEEK" } }
    },
    {
        name: "PRIVATE",
        title: 'Fiestas privadas',
        icon: PrivateEvent,
        color: '#1a55ff',
        about: 'Eventos organizadas por usuarios de forevent',
        navigate: { pathname: "/(app)/home/[category]/", params: { category: "PRIVATE" } }

    },
    {
        name: "CULTURAL",
        title: 'Cultural',
        icon: Cultural,
        color: '#b666d2',
        about: 'Eventos culturales',
        navigate: { pathname: "/(app)/home/[category]/", params: { category: "CULTURAL" } }
    },
    {
        name: "BAR",
        title: 'Bares',
        icon: Bar,
        color: '#7e00ff',
        about: 'Bares cerca de tí',
        navigate: { pathname: "/(app)/home/[category]/", params: { category: "BAR" } }
    },
]

const MenuItem = ({ item, index, carouselRef, selected, setSelected, data }: {
    item: {
        name: string;
        title: string;
        icon: (props: SvgProps) => React.JSX.Element;
        color: string;
        about: string;
        navigate: {
            pathname: string;
            params: {
                category: string;
            };
        }
    }, index: number, carouselRef: React.MutableRefObject<ICarouselInstance | null>, selected: number, setSelected: React.Dispatch<React.SetStateAction<number>>, data: any[]
}) => {
    // console.log(item, 'item')
    LogBox.ignoreAllLogs(true)

    const { colors } = useTheme();

    const handleSnapPress = React.useCallback((index: any) => {
        carouselRef.current?.scrollTo({ index: index, animated: true });
    }, []);

    const handleBack = React.useCallback((index: any) => {
        carouselRef.current?.prev({ animated: true, count: index });
    }, []);

    const handleForward = React.useCallback((index: any) => {
        carouselRef.current?.next({ animated: true, count: index });
    }, []);

    const handleGetIndex = React.useCallback(() => {
        return carouselRef.current?.getCurrentIndex() ? carouselRef.current?.getCurrentIndex() : 0;
    }, []);

    return (
        <TouchableWithoutFeedback
            key={index}
            onPress={() => {
                setSelected(index)
                console.log(index, "index", handleGetIndex(), "ref");
                if (index !== handleGetIndex()) {
                    if (handleGetIndex() === 5 && index === 1) {
                        handleForward(2)
                    } else if (handleGetIndex() === 1 && index === 5) {
                        handleBack(2)
                    } else if (handleGetIndex() === 0) {
                        if (index === 4 || index === 5) {
                            handleBack(data.length - index)
                        } else {
                            handleForward(index)
                        }
                    } else if (index === 0) {
                        if (handleGetIndex() === 1 || handleGetIndex() === 2) {
                            handleBack(handleGetIndex())
                        } else {
                            handleForward(data.length - handleGetIndex())
                        }
                    } else if (index > handleGetIndex()) {
                        handleForward(index - handleGetIndex())
                    } else {
                        handleBack(handleGetIndex() - index)
                    }
                } else {
                }
                // console.log(item, "ITEMS")
                router.push(item.navigate as any)
            }}
            style={{ alignItems: 'center', overflow: 'hidden', backgroundColor: "transparent" }}
        >
            <View style={{ alignItems: 'center', borderRadius: 100, overflow: 'hidden', backgroundColor: "transparent" }}>
                <View style={{ borderRadius: 100, elevation: 200, borderWidth: 0.75, borderColor: item.color, overflow: 'hidden', backgroundColor: "transparent" }}>
                    <Pressable style={{ justifyContent: 'center', alignItems: 'center', width: 75, height: 75, borderRadius: 100, overflow: 'hidden', shadowOpacity: 100, shadowRadius: 10, shadowColor: item.color, elevation: 25, backgroundColor: "transparent" }}>
                        <item.icon style={{ padding: 20, width: 10, height: 10, borderRadius: 100, backgroundColor: "transparent" }} />
                    </Pressable>
                </View>
            </View>
            <Text className='text-white' style={{ fontSize: 13, textAlign: 'center', paddingTop: 5 }}>
                {item.title}
            </Text>
        </TouchableWithoutFeedback>
    )
}


const UserCategories = () => {
    const itemSize = 90;
    const carouselRef = React.useRef<ICarouselInstance>(null)
    const centerOffset = PAGE_WIDTH / 2 - itemSize / 2;
    const { colors } = useTheme();
    const [selected, setSelected] = React.useState<number>(0)
    LogBox.ignoreAllLogs(true)
    const animationStyle: TAnimationStyle = React.useCallback(
        (value: number) => {
            "worklet";

            const itemGap = interpolate(
                value,
                [-4, -3, -2, 0, 2, 3, 4],
                [-15, -15, 0, 0, 0, 15, 15],
            );

            const translateX = interpolate(value, [-1, 0, 1], [-itemSize, 0, itemSize]) + centerOffset - itemGap;

            const translateY = interpolate(
                value,
                [-1, -0.5, 0, 0.5, 1],
                [0, 0, 5, 0, 0],
            );

            const scale = interpolate(
                value,
                [-1, -0.5, 0, 0.5, 1],
                [0.8, 0.8, 1, 0.8, 0.8],
            );

            return {
                transform: [
                    {
                        translateX,
                    },
                    {
                        translateY,
                    },
                    { scale },
                ],
            };
        },
        [],
    );

    return (
        <View style={{ backgroundColor: "transparent" }}>
            <Carousel
                ref={carouselRef}
                width={itemSize}
                height={itemSize * 3}
                style={{
                    width: PAGE_WIDTH,
                    height: 120,
                    backgroundColor: "transparent"
                }}
                onSnapToItem={(index: any) => {
                    if (index !== selected) { setSelected(index) }
                }}
                loop
                data={USER_CATEGORIES}
                renderItem={({ item, index }: {
                    item: {
                        name: string;
                        title: string;
                        icon: (props: SvgProps) => React.JSX.Element;
                        color: string;
                        about: string;
                        navigate: {
                            pathname: string;
                            params: {
                                category: string;
                            };
                        }
                    }, index: number
                }) => <MenuItem data={USER_CATEGORIES} setSelected={setSelected} selected={selected} carouselRef={carouselRef} item={item} index={index} />}
                customAnimation={animationStyle}
            />
        </View >
    );
}

export default UserCategories