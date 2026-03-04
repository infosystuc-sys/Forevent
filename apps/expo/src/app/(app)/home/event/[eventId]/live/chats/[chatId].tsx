import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { FlashList } from '@shopify/flash-list';
import { Image, ImageBackground } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrayElement } from 'node_modules/@forevent/api/src/root';
import React, { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Loading from '~/components/loading';
import { useSession } from '~/context/auth';
import useTheme from '~/hooks/useTheme';
import { RouterOutputs, api } from '~/utils/api';
import { blurhash, dayjs } from '~/utils/constants';
import { socket } from '~/utils/socket';

export default function Page() {
    const { colors } = useTheme();
    const flatlistRef = useRef<FlashList<ArrayElement<RouterOutputs["mobile"]["message"]["all"]>>>(null);
    const insets = useSafeAreaInsets();
    const { chatId } = useLocalSearchParams<{ chatId: string }>()
    const { user } = useSession()
    const utils = api.useUtils();
    const getChat = api.mobile.chat.byId.useQuery({ chatId: chatId! as string });

    const createMessage = api.mobile.message.create.useMutation({
        onSuccess: (res) => {
            // setMessages((messages) => [...messages, res])
        },
        onError: (error) => {
            console.log(error.message, "error")
        },
    });

    const getMessages = api.mobile.message.all.useQuery({ chatId: chatId! as string });

    const [message, setMessage] = useState("");
    const [messages, setMessages] = useState<RouterOutputs["mobile"]["message"]["all"]>([]);

    const handleSendMessage = () => {
        console.log("send message!!!")
        if (!message) {
            return null;
        }
        createMessage.mutate({
            chatId: chatId! as string,
            requesterId: user!.id,
            text: message,
        });
        socket.emit('sendMessage', {
            chatId,
            requesterId: user!.id,
            text: message,
        })

        setMessage("")
    };

    useEffect(() => {

        socket.connect();
        socket.emit('login', { requesterId: user?.id, chatId });

        socket.on("message", msg => {
            console.log("llego un mensaje!!!", msg)
            setMessages((messages: any) => [msg, ...messages]);
        })

        console.log("Is socket active??", socket.active)

        return () => {
            socket.disconnect();
            console.log("final:", socket.active)
            utils.mobile.chat.all.invalidate();
        }

    }, []);

    if (getMessages.isLoading || !getMessages.data) {
        return <Loading />
    }

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className='flex-1'
            contentContainerStyle={{ marginBottom: 0, paddingBottom: 0 }}
        >
            <ImageBackground
                contentFit='cover'
                contentPosition={'center'}
                style={{ flex: 1 }}
                source={require("../../../../../../../assets/background/notickets.png")} >
                <LinearGradient start={{ x: 0, y: 0 }} end={{ x: 0, y: .65 }} style={{ flex: 1, flexDirection: "row", justifyContent: 'space-between', alignItems: "flex-end", gap: 10 }} colors={['rgba(0,0,0, 0)', 'rgba(0,0,0,.8)']}>
                    <View style={{ paddingTop: insets.top }} className='flex-1 flex-col'>
                        <View className='flex-row w-full justify-between gap-2 py-2 '>
                            <Pressable onPress={() => {
                                router.back();
                            }} style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                                <View style={{ justifyContent: 'center', alignItems: 'center', padding: 4, }}>
                                    <MaterialCommunityIcons name={'chevron-left'} style={{}} size={35} color={colors.text} />
                                </View>
                            </Pressable>
                            <View className='flex-row flex-1 gap-5'>
                                <Image
                                    cachePolicy='memory-disk'
                                    placeholder={blurhash}
                                    priority='high'
                                    style={{ borderRadius: 100, backgroundColor: colors.onBackground, height: 40, width: 40 }}
                                    source={{ uri: getChat.data?.receiver.user.id === user?.id ? getChat.data?.requester.user.image as string : getChat.data?.receiver.user.image as string }} />
                                <View className='flex flex-col'>
                                    <Text style={styles.title}>
                                        {getChat.data?.receiver.user.id === user?.id ? getChat.data?.requester.user.name : getChat.data?.receiver.user.name}
                                    </Text>
                                    {
                                        socket.active &&
                                        <Text className='text-gray-500' >
                                            En línea
                                        </Text>
                                    }
                                </View>
                            </View>
                        </View>
                        <View className='flex-1 flex-row' style={{ justifyContent: 'center' }}>
                            <View style={{ flex: 1, flexDirection: "row", gap: 10 }}>
                                <FlashList
                                    ref={flatlistRef}
                                    estimatedItemSize={20}
                                    inverted
                                    onEndReachedThreshold={0.4}
                                    contentContainerStyle={{ paddingHorizontal: 10 }}
                                    data={[...messages, ...getMessages.data]}
                                    ListHeaderComponent={() => <View style={{ height: 10 }} />}
                                    ListFooterComponent={() => <View style={{ height: 10 }} />}
                                    ItemSeparatorComponent={() => <View style={{ height: 5 }} />}
                                    renderItem={({ item }) => <View style={item.requesterId === user?.id ? styles.myMessage : styles.message}>
                                        <Text className='text-white font-normal text-lg'>
                                            {item.text}
                                        </Text>
                                        <Text className={`text-white font-normal text-right text-xs`}>
                                            {dayjs(item.createdAt).format("HH:mm")}
                                        </Text>
                                    </View>}
                                />
                            </View>
                        </View>
                        <View style={{ height: 100, borderTopColor: colors.outline, borderTopWidth: .2, paddingBottom: insets.bottom }} className='w-full flex-row items-center justify-center gap-5  px-5'>
                            <View style={styles.textInput}>
                                <TextInput
                                    placeholder="Mensaje"
                                    blurOnSubmit
                                    inputMode='text'
                                    placeholderTextColor={"#757575"}
                                    value={message}
                                    className='text-white font-xl w-full'
                                    onChangeText={(text) => setMessage(text)}
                                // numberOfLines={4}
                                />
                            </View>
                            {/* Botón de envío */}
                            <Pressable
                                style={[styles.button, { backgroundColor: "#0086ff", borderWidth: 2 }]}
                                onPress={handleSendMessage}
                            >
                                <MaterialCommunityIcons name='send' size={26} style={{ padding: 0, margin: 0 }} color={colors.text} />
                            </Pressable>
                        </View>
                    </View>
                </LinearGradient>
            </ImageBackground>
        </KeyboardAvoidingView>
    )
}

const styles = StyleSheet.create({
    title: {
        fontSize: 20,
        fontWeight: 'bold', color: "white",
    },
    separator: {
        height: 1,
    },
    message: {
        fontSize: 17,
        alignSelf: "flex-start",
        color: "white",
        backgroundColor: "#1f1f1f",
        maxWidth: "75%",
        paddingHorizontal: 10,
        paddingTop: 4,
        paddingBottom: 4,
        borderRadius: 10,
        borderBottomLeftRadius: 2
    },
    myMessage: {
        fontSize: 17,
        alignSelf: "flex-end",
        color: "white",
        backgroundColor: "#0086ff",
        maxWidth: "75%",
        paddingHorizontal: 10,
        paddingTop: 4,
        paddingBottom: 4,
        borderRadius: 10,
        borderTopRightRadius: 2
    },
    textInput: {
        backgroundColor: '#111',
        borderRadius: 30,
        paddingVertical: 10,
        alignItems: "flex-start",
        justifyContent: "center",
        display: "flex",
        paddingHorizontal: 20,
        flex: 1,
        color: "#fff",
        fontSize: 18,
        textAlignVertical: "center"
    },
    button: {
        padding: 10,
        borderRadius: 100
    }
});
