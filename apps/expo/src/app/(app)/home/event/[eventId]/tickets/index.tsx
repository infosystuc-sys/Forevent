import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { zodResolver } from '@hookform/resolvers/zod';
import { FlashList } from '@shopify/flash-list';
import { ImageBackground } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { Controller, FieldValues, UseFormReturn, useForm } from 'react-hook-form';
import { ActivityIndicator, Alert, Pressable, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { z } from "zod";
import Loading from '~/components/loading';
import { useSession } from '~/context/auth';
import useTheme from '~/hooks/useTheme';
import { api } from '~/utils/api';
import { blurhash, dayjs } from '~/utils/constants';

const countSchema = z.object({
    count: z.number().min(1),
    ticket: z.object({
        ticketId: z.string(),
        price: z.number(),
        name: z.string()
    })
})

function Ticket({ ticket, form }: {
    ticket: {
        _count: {
            userTicket: number;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        price: number;
        name: string;
        about: string | null;
        discharged: boolean;
        eventId: string;
        validUntil: Date | null;
        quantity: number;
    },
    form: UseFormReturn<FieldValues, any>
}) {
    const { colors } = useTheme();
    // console.log(ticket.quantity - ticket._count.userTicket, 'lo que queda de', ticket.name)
    return (
        <Controller
            control={form.control}
            name={ticket.id}
            rules={{ min: 0, max: ticket.quantity }}
            defaultValue={0}
            render={({ field: { value, onChange, onBlur }, fieldState: { error } }) => {
                // console.log(ticket.quantity - ticket._count.userTicket, "result")
                return (
                    <View style={{ flexDirection: "row", padding: 10, borderRadius: 10, borderWidth: 1, borderColor: "#ffb852", alignItems: "center" }}>
                        <View style={{ flex: 1, flexDirection: "row", alignItems: "center" }}>
                            <MaterialCommunityIcons name="human-male" size={40} color={colors.text} style={{ padding: 5 }} />
                            <View style={{ gap: 5 }}>
                                <Text className='text-white' style={{ fontSize: 15, letterSpacing: .2 }}>
                                    {ticket.name}
                                </Text>
                                <Text className='text-white' style={{ fontSize: 15, letterSpacing: .2, fontWeight: "700" }}>
                                    ${ticket.price.toLocaleString()}
                                </Text>
                            </View>
                        </View>
                        {ticket.quantity - ticket._count.userTicket <= 0 ?
                            <View>
                                <Text style={{ color: colors.text, paddingHorizontal: 20, textTransform: 'uppercase', fontSize: 18, letterSpacing: .5, width: '100%', textAlign: 'center' }}>
                                    Agotado
                                </Text>
                            </View>
                            :
                            <View style={{ flexDirection: "row" }}>
                                <Pressable onPress={() => {
                                    if (value === 0) {
                                        return
                                    }
                                    onChange(value - 1)
                                }} style={{ backgroundColor: colors.background, borderRadius: 2.5 }}>
                                    <MaterialCommunityIcons name="minus" size={24} color="white" style={{ padding: 5 }} />
                                </Pressable>
                                <View style={{ alignItems: "center", justifyContent: "center" }}>
                                    <Text style={{ color: colors.text, paddingHorizontal: 20, textTransform: 'uppercase', fontSize: 18, letterSpacing: .5, width: '100%', textAlign: 'center' }}>
                                        {value}
                                    </Text>
                                </View>
                                <Pressable onPress={() => {
                                    if (value === ticket.quantity - ticket._count.userTicket || value >= 5) {
                                        return
                                    }
                                    onChange(value + 1)
                                }} style={{ backgroundColor: colors.background, borderRadius: 2.5 }}>
                                    <MaterialCommunityIcons name="plus" size={24} color="white" style={{ padding: 5 }} />
                                </Pressable>
                            </View>
                        }
                    </View >
                )
            }}
        />

    )
}



export default function Index() {
    const { user } = useSession()
    const { colors } = useTheme();
    const insets = useSafeAreaInsets();
    const [ticketCount, setTicketCount] = useState(1)
    const [selected, setSelected] = useState()
    const { eventId } = useLocalSearchParams<{ eventId: string }>();
    const event = api.mobile.event.byId.useQuery({ id: eventId! as string })
    const buy = api.mobile.eventTicket.purchase.useMutation({
        onSuccess: (res) => {
            // Navega al tab de Entradas usando la ruta completa correcta
            router.replace('/(app)/home/(tabs)/ticket')
        },
        onError: (error) => {
            Alert.alert('Error', error.message)
        }
    })

    const emailForm = useForm<z.infer<typeof countSchema>>({
        resolver: zodResolver(countSchema),
        defaultValues: {
            count: 1,
            ticket: undefined
        },
        mode: "onBlur"
    })

    const form = useForm();

    const date = `${dayjs(event.data?.startsAt).locale('es').format('dddd D')} de ${dayjs(event.data?.startsAt).locale('es').format('MMMM').charAt(0).toUpperCase()}${dayjs(event.data?.startsAt).locale('es').format('MMMM').slice(1)}`

    function getTotal(): number {
        let total: number = 0
        event?.data?.tickets.map((ticket) => {
            // console.log(ticket.price, typeof (ticket.price), parseInt(form.watch(ticket.id)), typeof (parseInt(form.watch(ticket.id))))
            total += ticket.price * parseInt(isNaN(form.watch(ticket.id)) ? 0 : form.watch(ticket.id))
        })
        // console.log(typeof (total), total)
        return total
    }

    function getPurchase() {
        if (!event.data?.tickets) {
            return []
        }
        let products = event?.data?.tickets.map((ticket: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            price: number;
            name: string;
            about: string | null;
            discharged: boolean;
            eventId: string;
            validUntil: Date | null;
            quantity: number;
        }) => {
            return { ticketId: ticket.id, quantity: parseInt(isNaN(form.watch(ticket.id)) ? 0 : form.watch(ticket.id)) }
        })
        return products
    }

    if (event.isError) {
        return <View className='flex flex-1 items-center justify-center'>
            <Text style={{ color: colors.text }}>
                Ocurrió un error
            </Text>
        </View>
    }

    if (event.isLoading) {
        return <Loading />
    }

    return (
        <SafeAreaView style={{ flex: 1, flexDirection: 'column' }}>
            <StatusBar animated={true} backgroundColor='#00000000' style='light' />
            <ImageBackground cachePolicy='memory-disk' placeholder={blurhash} priority='high' style={{ width: '100%', height: 400, zIndex: 0, position: "absolute", top: 0 }} source={{ uri: event?.data?.image ?? "" }}>
                <LinearGradient start={{ x: 0, y: 0 }} end={{ x: 0, y: 0.8 }} style={{ flex: 1 }} colors={['rgba(20,20,20, 0)', "#000"]} />
            </ImageBackground>
            <View style={{ marginTop: 25, marginBottom: 150 }} >
                <Pressable style={{ position: 'absolute', top: 0, left: 15, padding: 7.5, borderRadius: 50, backgroundColor: colors.text }} onPress={() => { console.log("PRESS"); if (router.canGoBack()) { router.back() } }}>
                    <MaterialCommunityIcons name={'arrow-left'} style={{}} size={20} color={colors.inverseText} />
                </Pressable>
            </View>
            <FlashList
                data={event?.data?.tickets}
                ItemSeparatorComponent={() => <View className='h-4' />}
                keyExtractor={(item, index) => index.toString()}
                showsVerticalScrollIndicator={false}
                estimatedItemSize={20}
                showsHorizontalScrollIndicator={false}
                overScrollMode='never'
                contentContainerStyle={{ paddingHorizontal: 15 }}
                ListHeaderComponent={() =>
                    <View style={{ gap: 5, paddingBottom: 20 }}>
                        <Text style={{ fontSize: 30, letterSpacing: 0, color: colors.text, textAlign: 'left' }} numberOfLines={4}>
                            {event?.data?.name}
                        </Text>
                        <Text style={{ color: 'yellow', fontSize: 15, }}>
                            {date.charAt(0).toUpperCase()}{date.slice(1)}
                        </Text>
                        <Text style={{ color: '#aaa', fontSize: 15 }}>
                            {event?.data?.location?.name}, {event?.data?.location?.city}
                        </Text>
                    </View>
                }
                renderItem={({ item }) =>
                    <Ticket
                        ticket={item}
                        form={form}
                    />
                }
                ListFooterComponent={() => <View style={{ height: 12.5 }} />}
            />
            <View style={{ width: '100%', paddingVertical: 20, justifyContent: "center", alignItems: "center", paddingHorizontal: 15, marginBottom: 10 }}>
                <Pressable
                    className='w-full rounded-full'
                    style={{
                        borderWidth: 1,
                        borderColor: "#FFD25B",
                        shadowColor: "#FFD25B",
                        shadowOpacity: 0.5,
                        shadowRadius: 10,
                    }}
                    onPress={() => {
                        if (!event.data?.tickets.some((ticket) => ticket.quantity - ticket._count.userTicket > 0)) {
                            Alert.alert('Agotado', 'No hay tickets disponibles')
                        } else {
                            console.log(user, "USER")
                            buy.mutate({ userId: user!.id, tickets: getPurchase() })
                        }

                    }}
                    disabled={buy.isPending || getTotal() === 0}
                >
                    {buy.isPending ?
                        <ActivityIndicator style={{ paddingVertical: 12.5 }} />
                        :
                        <Text className='' style={{ color: colors.text, paddingHorizontal: 22.5, paddingVertical: 12.5, textTransform: 'uppercase', fontSize: 16, fontWeight: "800", letterSpacing: .5, width: '100%', textAlign: 'center' }}>
                            {!event.data?.tickets.some((ticket) => ticket.quantity - ticket._count.userTicket > 0) ? 'Agotado' : `Comprar $${getTotal().toLocaleString()}`}
                        </Text>
                    }
                </Pressable>
            </View >
        </SafeAreaView>
    )
}