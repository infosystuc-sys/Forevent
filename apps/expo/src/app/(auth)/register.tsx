import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { zodResolver } from '@hookform/resolvers/zod';
import { ImageBackground } from 'expo-image';
import { router } from 'expo-router';
import React from 'react';
import { Controller, FormProvider, SubmitErrorHandler, SubmitHandler, useForm } from 'react-hook-form';
import { ActivityIndicator, Alert, Pressable, ScrollView, Switch, Text, View } from 'react-native';
import { z } from 'zod';
import TextInput from '~/components/input';
import { useSession } from '~/context/auth';
import useTheme from '~/hooks/useTheme';
import { api } from '~/utils/api';

const formSchema = z.object({
    email: z.string().email({ message: "Debes ingresar un email" }).toLowerCase(),
    sendAll: z.boolean(),
    sendEvents: z.boolean(),
    sendEmails: z.boolean(),
    fullname: z.string().min(3, { message: "Debes ingresar un nombre" })
})

export default function Page() {
    const { colors } = useTheme()
    const { signIn } = useSession()

    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: "",
            fullname: "",
            sendAll: false,
            sendEmails: false,
            sendEvents: false
        },
        mode: "onBlur"
    })

    const register = api.mobile.auth.register.useMutation({
        onSuccess: (res) => {
            console.log(res, "Cuenta registrada!")
            Alert.alert("Registro exitoso", "Ya puedes iniciar sesión")
            router.replace("/login")
        },
        onError: (error) => {
            console.log(error.data?.code, "datazo", error.message, "message")
            if (error.data?.code === "CONFLICT") {
                form.setError("email", { message: error.message })
            }
        }
    })

    const onSubmit: SubmitHandler<z.infer<typeof formSchema>> = (data) => {
        console.log(JSON.stringify(data));
        register.mutate(data)
    };

    const onError: SubmitErrorHandler<z.infer<typeof formSchema>> = (
        errors,
        e
    ) => {
        console.log(JSON.stringify(errors));
        // Alert.alert('Warning', getReadableValidationErrorMessage(errors));
    };

    return (
        <View style={{ flex: 1, flexDirection: 'column' }}>
            <ImageBackground contentFit='cover' contentPosition={'center'} style={{ flex: 1, backgroundColor: "black" }} source={require("../../assets/register-bg.png")
            } >
                <ScrollView className='px-10 pt-20'>
                    <Pressable onPress={() => { router.back() }}>
                        <MaterialCommunityIcons size={40} color={colors.text} name='chevron-left' />
                    </Pressable>
                    <Text numberOfLines={2} style={{ fontWeight: "800", fontSize: 25, lineHeight: 50, letterSpacing: -1, color: colors.text }}>
                        CREAR CUENTA
                    </Text>
                    <View className='flex-1 mt-10 items-center justify-start'>
                        <FormProvider {...form}>
                            <Controller
                                control={form.control}
                                name="fullname"
                                render={({
                                    field: { onChange, onBlur, value },
                                    fieldState: { error },
                                }) => {
                                    return (
                                        <TextInput
                                            label="Nombre completo"
                                            onBlur={onBlur}
                                            keyboardType='email-address'
                                            placeholder='John Doe'
                                            value={value}
                                            onChangeText={onChange}
                                            errorMessage={error?.message}
                                        />
                                    );
                                }}
                            />
                            <View className='mb-5' />
                            <Controller
                                control={form.control}
                                name="email"
                                render={({
                                    field: { onChange, onBlur, value },
                                    fieldState: { error },
                                }) => {
                                    return (
                                        <TextInput
                                            label="Email"
                                            onBlur={onBlur}
                                            value={value}
                                            onChangeText={onChange}
                                            errorMessage={error?.message}
                                        />
                                    );
                                }}
                            />
                            <View className='mb-5' />
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Text className="text-white font-semibold flex-1 pr-2 py-5">
                                    Enterate de los eventos en tu ciudad
                                </Text>
                                <Controller
                                    control={form.control}
                                    name="sendEvents"
                                    render={({
                                        field: { onChange, onBlur, value },
                                        fieldState: { error },
                                    }) => {
                                        return (
                                            <Switch
                                                trackColor={{ false: colors.text, true: colors.surface }}
                                                thumbColor={colors.primary}
                                                style={{
                                                    transform: [{ scaleX: .8 }, { scaleY: .8 }],
                                                }}
                                                ios_backgroundColor={colors.background}
                                                onValueChange={onChange}
                                                value={value}
                                            />
                                        );
                                    }}
                                />
                            </View>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Text className="text-white font-semibold flex-1 pr-2 py-5">
                                    Emails de Forevent
                                </Text>
                                <Controller
                                    control={form.control}
                                    name="sendEmails"
                                    render={({
                                        field: { onChange, onBlur, value },
                                        fieldState: { error },
                                    }) => {
                                        return (
                                            <Switch
                                                trackColor={{ false: colors.text, true: colors.surface }}
                                                thumbColor={colors.primary}
                                                style={{
                                                    transform: [{ scaleX: .8 }, { scaleY: .8 }],
                                                }}
                                                ios_backgroundColor={colors.background}
                                                onValueChange={onChange}
                                                value={value}
                                            />
                                        );
                                    }}
                                />
                            </View>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Text className="text-white font-semibold flex-1 pr-2 py-5">
                                    Emails de amigos, artistas, lugares, promotores de los que hayas comprado entradas
                                </Text>
                                <Controller
                                    control={form.control}
                                    name="sendAll"
                                    render={({
                                        field: { onChange, onBlur, value },
                                        fieldState: { error },
                                    }) => {
                                        return (
                                            <Switch
                                                trackColor={{ false: colors.text, true: colors.surface }}
                                                thumbColor={colors.primary}
                                                style={{
                                                    transform: [{ scaleX: .8 }, { scaleY: .8 }],
                                                }}
                                                ios_backgroundColor={colors.background}
                                                onValueChange={onChange}
                                                value={value}
                                            />
                                        );
                                    }}
                                />
                            </View>
                            <View className='mt-10' />
                            <Pressable className='w-full rounded-full flex items-center justify-center h-12' style={{
                                borderWidth: 1,
                                borderColor: "#FFD25B",
                                shadowColor: "#FFD25B",
                                shadowOpacity: 0.5,
                                shadowRadius: 10,
                            }} onPress={form.handleSubmit(onSubmit, onError)}
                            >
                                {register.isPending ?
                                    <ActivityIndicator color={colors.text} size='small' />
                                    :
                                    <Text style={{ textTransform: "uppercase" }} className="text-white text-lg font-semibold ">
                                        Iniciar sesión
                                    </Text>
                                }
                            </Pressable>
                        </FormProvider>
                    </View>
                </ScrollView>
            </ImageBackground>
        </View>
    )
}
