import { MaterialCommunityIcons, Octicons, SimpleLineIcons, AntDesign } from '@expo/vector-icons';
import BottomSheet, { BottomSheetBackdrop, BottomSheetScrollView, BottomSheetTextInput, BottomSheetView } from '@gorhom/bottom-sheet';
import { zodResolver } from "@hookform/resolvers/zod";
import { ImageBackground } from "expo-image";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Controller, FormProvider, SubmitErrorHandler, SubmitHandler, useForm } from 'react-hook-form';
import { ActivityIndicator, Alert, Animated, Keyboard, Platform, Pressable, Text, View } from "react-native";
import { CodeField, Cursor, useBlurOnFulfill, useClearByFocusCell } from 'react-native-confirmation-code-field';
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { z } from "zod";
import Logo from '~/assets/logo';
import TextInput from '~/components/input';
import { useSession } from "~/context/auth";
import useTheme from "~/hooks/useTheme";
import { api } from "~/utils/api";

let GoogleSignin: any = null;
let statusCodes: any = {};
try {
  const mod = require("@react-native-google-signin/google-signin");
  GoogleSignin = mod.GoogleSignin;
  statusCodes = mod.statusCodes;
} catch {
  // native module unavailable — Google login button will show an error
}

const CELL_SIZE = 70;
const CELL_BORDER_RADIUS = 100;
const CELL_COUNT = 5

const { Value, Text: AnimatedText } = Animated;

const animationsColor: any = [...new Array(CELL_COUNT)].map(() => new Value(0));
const animationsScale: any = [...new Array(CELL_COUNT)].map(() => new Value(1));

const animateCell: any = ({ hasValue, index, isFocused }: { hasValue: boolean, index: number, isFocused: boolean }) => {
    Animated.parallel([
        Animated.timing(animationsColor[index], {
            useNativeDriver: false,
            toValue: isFocused ? 1 : 0,
            duration: 250,
        }),
        Animated.spring(animationsScale[index], {
            useNativeDriver: false,
            toValue: hasValue ? 0 : 1,
            // duration: hasValue ? 300 : 250,
        }),
    ]).start();
};

const emailSchema = z.object({
    email: z.string().email({ message: "Debes ingresar un correo electrónico." }).toLowerCase(),
})

const codeSchema = z.object({
    code: z.string().min(5, { message: "Debes ingresar el codigo." }),
    challengeId: z.string().min(5, { message: "Debes ingresar el challenge id." }),
})

const Page: React.FC = () => {
    const { colors } = useTheme()
    const { signIn, session, user } = useSession()
    const insets = useSafeAreaInsets();
    const loginSnapPoints = useMemo(() => ["60%"], [])
    const codeSnapPoints = useMemo(() => ["100%"], [])
    const [value, setValue] = useState<string>('');
    const [timerCount, setTimer] = useState(60)
    const [step, setStep] = useState(0)
    const [sendError, setSendError] = useState<string | null>(null)
    const ref = useBlurOnFulfill({ value, cellCount: CELL_COUNT });

    const emailForm = useForm<z.infer<typeof emailSchema>>({
        resolver: zodResolver(emailSchema),
        defaultValues: {
            email: "",
        },
        mode: "onBlur"
    })

    const codeForm = useForm<z.infer<typeof codeSchema>>({
        resolver: zodResolver(codeSchema),
        defaultValues: {
            code: "",
            challengeId: ""
        },
        mode: "onBlur"
    })

    const sendCode = api.mobile.auth.sendCode.useMutation({
        onSuccess: (res) => {
            setSendError(null)
            setStep(1)
            Keyboard.dismiss()
            closeLogin()
            openCode()
            codeForm.setValue("challengeId", res)
        },
        onError: (error) => {
            console.log("[sendCode] error:", error.data?.code, error.message)
            if (error.data?.code === "NOT_FOUND") {
                // No hay cuenta → redirigir al registro
                router.push("/register")
                return
            }
            // Cualquier otro error (red, Resend, servidor caído) → mostrarlo en UI
            const userMessage =
                error.message?.includes("fetch")
                    ? "No se pudo conectar con el servidor. Verificá tu conexión."
                    : error.message ?? "Ocurrió un error. Intentá de nuevo."
            setSendError(userMessage)
        }
    })

    const login = api.mobile.auth.login.useMutation({
        onSuccess: (res) => {
            // signIn persiste user y session en SecureStore + setea el token en el tRPC client.
            signIn(res)
            router.replace("/(app)")
        },
        onError: (error) => {
            if (error.data?.code === 'CONFLICT') {
                codeForm.setError('code', { message: error.message })
            }
        }
    })

    /**
     * Login con Google: el SDK nativo abre el selector de cuentas del device,
     * obtiene un ID token de Google y lo manda al backend que verifica + crea/encuentra
     * el User y devuelve sessionId — mismo contrato que el flujo email+code.
     */
    const signInWithGoogle = api.mobile.auth.signInWithGoogle.useMutation({
        onSuccess: (res) => {
            signIn(res)
            router.replace("/(app)")
        },
        onError: (error) => {
            Alert.alert(
                "No se pudo iniciar sesión con Google",
                error.message ?? "Intentá de nuevo en unos segundos.",
            )
        },
    })

    const [googleLoading, setGoogleLoading] = useState(false)

    async function handleGoogleSignIn() {
        if (!GoogleSignin) {
            Alert.alert("Google Sign-In no disponible", "El módulo nativo no está instalado en este build.")
            return
        }
        if (googleLoading || signInWithGoogle.isPending) return
        setGoogleLoading(true)
        try {
            await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true })
            const result: any = await GoogleSignin.signIn()
            // Distintas versiones del SDK exponen el idToken en lugares distintos.
            const idToken: string | null =
                result?.idToken ??
                result?.data?.idToken ??
                result?.user?.idToken ??
                null
            if (!idToken) {
                throw new Error("No se obtuvo el token de Google. Revisá tu conexión.")
            }
            signInWithGoogle.mutate({ idToken })
        } catch (e: any) {
            // El SDK lanza códigos especiales cuando el user cancela o no hay Play Services.
            if (
                e?.code === statusCodes.SIGN_IN_CANCELLED ||
                e?.code === "SIGN_IN_CANCELLED" ||
                e?.code === "-5"
            ) {
                // Usuario cerró el selector: silenciar.
                return
            }
            if (
                e?.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE ||
                e?.code === "PLAY_SERVICES_NOT_AVAILABLE"
            ) {
                Alert.alert(
                    "Google Play Services no disponible",
                    "Tu dispositivo necesita Google Play Services actualizado para usar Google Sign-In.",
                )
                return
            }
            Alert.alert("Error", e?.message ?? "No se pudo iniciar sesión con Google.")
        } finally {
            setGoogleLoading(false)
        }
    }

    const [props, getCellOnLayoutHandler] = useClearByFocusCell({
        value,
        setValue,
    });

    const onEmailError: SubmitErrorHandler<z.infer<typeof emailSchema>> = (
        errors,
        e
    ) => {
        console.log("on error")
        console.log(JSON.stringify(errors));
        // Alert.alert('Warning', getReadableValidationErrorMessage(errors));
    };

    const onEmailSubmit: SubmitHandler<z.infer<typeof emailSchema>> = (data) => {
        console.log("on submit")
        console.log(JSON.stringify(data));
        // login.mutate(data)
        sendCode.mutate(data)
    };

    const onCodeError: SubmitErrorHandler<z.infer<typeof codeSchema>> = (
        errors,
        e
    ) => {
        console.log("on error")
        console.log(JSON.stringify(errors));
        // Alert.alert('Warning', getReadableValidationErrorMessage(errors));
    };

    const onCodeSubmit: SubmitHandler<z.infer<typeof codeSchema>> = (data) => {
        console.log("on submit")
        console.log(JSON.stringify(data));
        login.mutate(data)
    };

    const renderCell = ({ index, symbol, isFocused }: { index: number, symbol: string, isFocused: boolean }) => {
        const hasValue = Boolean(!symbol);
        setTimeout(() => {
            animateCell({ hasValue, index, isFocused });
        }, 0);

        return (
            <AnimatedText
                key={index}
                style={[{
                    height: CELL_SIZE,
                    width: CELL_SIZE,
                    flex: 1,
                    lineHeight: CELL_SIZE - 5,
                    fontSize: 30,
                    textAlign: 'center',
                    borderRadius: CELL_BORDER_RADIUS,
                    color: colors.text,
                },
                    // animatedCellStyle
                ]}
                onLayout={getCellOnLayoutHandler(index)}>
                {symbol || (isFocused ? <Cursor /> : <Octicons name="key" size={24} color={colors.text} />)}
            </AnimatedText>
        );
    };

    const loginBottomSheetRef = useRef<BottomSheet>(null);

    const codeBottomSheetRef = useRef<BottomSheet>(null);

    const closeLogin = useCallback(() => {
        loginBottomSheetRef.current?.close();
    }, []);

    const openLogin = useCallback(() => {
        loginBottomSheetRef.current?.expand();
    }, []);

    const closeCode = useCallback(() => {
        codeBottomSheetRef.current?.close();
    }, []);

    const openCode = useCallback(() => {
        codeBottomSheetRef.current?.expand();
    }, []);

    const renderBackdrop = useCallback(
        (props: any) => (
            <BottomSheetBackdrop style={{ zIndex: 100 }}  {...props} appearsOnIndex={0} disappearsOnIndex={-1} pressBehavior={'close'} onPress={() => { closeCode(); closeLogin() }} >
                {/* <BlurView
          style={{ flex: 1 }}
          blurType="dark"
          blurAmount={20}
          reducedTransparencyFallbackColor="white"

        /> */}
            </BottomSheetBackdrop>
        ),
        []
    )

    // If the user is already authenticated, skip the login screen entirely.
    useEffect(() => {
        if (user) {
            router.replace("/(app)")
        }
    }, [user])

    // Auto-expand the email BottomSheet when the screen mounts so the form
    // is immediately visible without requiring a button tap.
    useEffect(() => {
        const timer = setTimeout(() => openLogin(), 300)
        return () => clearTimeout(timer)
    }, [])

    useEffect(() => {
        let interval: any
        if (sendCode.isSuccess) {
            interval = setInterval(() => {
                setTimer(lastTimerCount => {
                    lastTimerCount <= 1 && timerCount > 0 && clearInterval(interval)
                    return lastTimerCount - 1
                })
            }, 1000) //each count lasts for a second
        }

        //cleanup the interval on complete
        return () => clearInterval(interval)
    }, [step, sendCode.isSuccess]);

    useEffect(() => {
        // signIn({
        //     sessionId: "clrs6n4p900011caxijbfcpt7",
        //     user: {
        //         about: null,
        //         email: "francowerner-pc@hotmail.com",
        //         id: "clnqajc0w0000uc6c3e03bpuh",
        //         image: null,
        //         locale: "en-US",
        //         name: "Franco Werner",
        //         zoneinfo: "America/Argentina/Buenos_Aires"
        //     }
        // })
        // signIn({
        //     sessionId: "clrw5gerc0001vcznif8uvqlr",
        //     user: {
        //         about: null,
        //         email: "gonzalomorales1001@gmail.com",
        //         id: "clrw5ger80000vczngx8jh7t0",
        //         image: "https://d1uydgebs34vim.cloudfront.net/static/default.jpg",
        //         locale: "en-US",
        //         name: "Gonzalo Morales",
        //         zoneinfo: "America/Argentina/Buenos_Aires"
        //     }
        // })
        // router.replace("/home/")
    }, [])

    useEffect(() => {
        if (codeForm.watch('code').length === 5) {
            console.log("codeForm.getValues()")
            Keyboard.dismiss()
            codeForm.handleSubmit(onCodeSubmit, onCodeError)()
        }
    }, [codeForm.watch('code')])

    useEffect(() => {

    }, [])


    return (
        <View style={{ flex: 1, flexDirection: 'column' }}>
            <StatusBar animated={true} backgroundColor='#00000000' />
            <ImageBackground
                contentFit='cover'
                contentPosition={'center'}
                style={{ display: "flex", flex: 1, justifyContent: "center", alignItems: "center" }}
                source={require("../../assets/login-bg.png")} >
                <View style={{ paddingTop: insets.top }} />
                <View style={{ flex: 1, width: "100%" }} className='flex-1 h-full w-full items-center justify-center gap-5'>
                    <Text style={{ textTransform: "capitalize", color: colors.text, fontSize: 60, fontWeight: "800", alignItems: 'center' }}>
                        Forevent
                    </Text>
                    <View style={{ height: 75, width: 75 }}>
                        <Logo fill={colors.text} />
                    </View>
                    <View className='absolute bottom-24'>
                        <Pressable className="items-center justify-center" style={{ borderRadius: 50, borderColor: colors.text, borderWidth: 1 }} onPress={() => {
                            openLogin()
                        }}>
                            <Text style={{ color: colors.text, paddingVertical: 10, paddingHorizontal: 20, fontSize: 16 }}>
                                INICIAR SESIÓN / REGISTRO
                            </Text>
                        </Pressable>
                    </View>
                    <BottomSheet
                        ref={loginBottomSheetRef}
                        key="login"
                        onClose={() => {
                            // Keyboard.dismiss()
                            setStep(0)
                        }}
                        enableDynamicSizing={true}
                        snapPoints={loginSnapPoints}
                        enablePanDownToClose={true}
                        animateOnMount={true}
                        backdropComponent={renderBackdrop}
                        keyboardBlurBehavior='none'
                        keyboardBehavior="interactive"
                        android_keyboardInputMode='adjustResize'
                        backgroundStyle={{ backgroundColor: '#000' }}
                        index={-1}
                        handleIndicatorStyle={{ backgroundColor: '#fff' }}
                    >
                        <BottomSheetScrollView
                            keyboardShouldPersistTaps="always"
                            keyboardDismissMode={"interactive"}
                            overScrollMode={"never"}
                            style={{ paddingHorizontal: 20 }}
                        >
                            <Text numberOfLines={2} style={{ fontWeight: "800", fontSize: 25, lineHeight: 50, letterSpacing: -1, color: colors.text }}>
                                INICIAR SESIÓN / REGISTRO
                            </Text>
                            <Text numberOfLines={2} style={{ color: '#ddd', marginBottom: 10 }}>
                                Necesitamos tu correo electrónico para verificar tu cuenta y mantener tus entradas seguras
                            </Text>
                            <BottomSheetView>
                                <FormProvider {...emailForm}>
                                    <Controller
                                        control={emailForm.control}
                                        name="email"
                                        render={({
                                            field: { onChange, onBlur, value },
                                            fieldState: { error },
                                        }) => {
                                            return (
                                                <TextInput
                                                    bottomSheet={Platform.OS === "ios"}
                                                    label="Correo electrónico"
                                                    placeholder="email@email.com"
                                                    keyboardType="email-address"
                                                    autoComplete="email"
                                                    onBlur={onBlur}
                                                    value={value}
                                                    onChangeText={onChange}
                                                    errorMessage={error?.message}
                                                />
                                            );
                                        }}
                                    />
                                    <View className="mb-5" />
                                    <Pressable className='w-full rounded-full flex items-center justify-center h-12' style={{
                                        borderWidth: 1,
                                        borderColor: "#FFD25B",
                                        shadowColor: "#FFD25B",
                                        shadowOpacity: 0.5,
                                        shadowRadius: 10,
                                    }} onPress={emailForm.handleSubmit(onEmailSubmit, onEmailError)}
                                    >
                                        {sendCode.isPending ?
                                            <ActivityIndicator color={colors.text} size='small' />
                                            :
                                            <Text style={{ textTransform: "uppercase" }} className="text-white text-lg font-semibold ">
                                                Siguiente
                                            </Text>
                                        }
                                    </Pressable>
                                    {!!sendError && (
                                        <Text style={{
                                            color: '#ff4d4d',
                                            marginTop: 10,
                                            fontSize: 13,
                                            textAlign: 'center',
                                        }}>
                                            ⚠ {sendError}
                                        </Text>
                                    )}
                                </FormProvider>

                                {/* ── Separador "o" ── */}
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 16 }}>
                                    <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.18)' }} />
                                    <Text style={{ color: 'rgba(255,255,255,0.55)', marginHorizontal: 12, fontSize: 12, letterSpacing: 1 }}>
                                        O
                                    </Text>
                                    <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.18)' }} />
                                </View>

                                {/* ── Botón Continuar con Google ── */}
                                <Pressable
                                    onPress={handleGoogleSignIn}
                                    disabled={googleLoading || signInWithGoogle.isPending}
                                    style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: 12,
                                        backgroundColor: '#ffffff',
                                        borderRadius: 999,
                                        height: 48,
                                        paddingHorizontal: 16,
                                        opacity: googleLoading || signInWithGoogle.isPending ? 0.6 : 1,
                                    }}
                                >
                                    {googleLoading || signInWithGoogle.isPending ? (
                                        <ActivityIndicator color="#000" size="small" />
                                    ) : (
                                        <>
                                            <AntDesign name="google" size={18} color="#000" />
                                            <Text style={{ color: '#000', fontSize: 15, fontWeight: '600' }}>
                                                Continuar con Google
                                            </Text>
                                        </>
                                    )}
                                </Pressable>
                            </BottomSheetView>
                            <View style={{ height: 50 }} />
                        </BottomSheetScrollView>
                    </BottomSheet>
                    <BottomSheet
                        ref={codeBottomSheetRef}
                        key="code"
                        onClose={() => {
                            // Keyboard.dismiss()
                            setStep(0)
                        }}
                        enableDynamicSizing={true}
                        snapPoints={codeSnapPoints}
                        enablePanDownToClose={true}
                        animateOnMount={true}
                        backdropComponent={renderBackdrop}
                        keyboardBehavior='interactive'
                        android_keyboardInputMode='adjustResize'
                        backgroundStyle={{ backgroundColor: '#000' }}
                        index={-1}
                        handleIndicatorStyle={{ backgroundColor: '#fff' }}
                    >
                        <BottomSheetScrollView
                            keyboardShouldPersistTaps="always"
                            keyboardDismissMode={"interactive"}
                            overScrollMode={"never"}
                            scrollEnabled={false}
                            style={{ paddingHorizontal: 20 }}
                        >
                            <View style={{ height: 5 }} />
                            <Text style={{ fontSize: 30, marginBottom: 0, letterSpacing: -1, color: colors.text, fontWeight: '800' }} numberOfLines={2}>
                                TE ENVIAMOS UN CODIGO
                            </Text>
                            <Text style={{ color: '#ccc' }}>
                                Para mayor seguridad, te enviamos el codigo de inicio de sesión por correo electrónico.
                            </Text>
                            <FormProvider {...codeForm}>
                                <Controller
                                    control={codeForm.control}
                                    name="code"
                                    render={({
                                        field: { onChange, onBlur, value },
                                        fieldState: { error },
                                    }) => {
                                        return (
                                            <CodeField
                                                ref={ref}
                                                cellCount={CELL_COUNT}
                                                rootStyle={{
                                                    height: CELL_SIZE,
                                                    justifyContent: 'center',
                                                    borderWidth: 1,
                                                    borderRadius: 2.5,
                                                    marginTop: 10,
                                                    borderColor: colors.outline,
                                                }}
                                                keyboardType="number-pad"
                                                textContentType="oneTimeCode"
                                                autoComplete="one-time-code"
                                                renderCell={renderCell}
                                                value={value}
                                                onBlur={onBlur}
                                                onChangeText={onChange}
                                            />
                                        );
                                    }}
                                />
                                {!!codeForm.getFieldState("code").error && (
                                    <Text className='font-bold font-lg' style={{ color: '#ff0020', marginTop: 6 }}>
                                        {codeForm.getFieldState("code").error?.message}
                                    </Text>
                                )}
                                <View className="mb-2" />
                                <BottomSheetView style={{ justifyContent: 'space-between' }}>
                                    <BottomSheetView style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', gap: 20, marginVertical: 20 }}>
                                        <SimpleLineIcons name="screen-smartphone" size={24} style={{ padding: 0, margin: 0 }} color={colors.text} />
                                        <Pressable onPress={() => {
                                            setTimer(60)
                                            sendCode.mutate({ email: emailForm.watch('email') })
                                        }} disabled={timerCount > 0} style={{ alignItems: 'flex-start', justifyContent: 'flex-start' }}>
                                            <Text style={{ color: colors.text }}>
                                                Solicita un nuevo codigo
                                            </Text>
                                            {timerCount > 0 &&
                                                <Text style={{ color: colors.primaryAdmin, fontWeight: '600' }}>
                                                    Disponible de nuevo en <Text>{timerCount}</Text> segundos
                                                </Text>
                                            }
                                        </Pressable>
                                    </BottomSheetView>
                                    <View style={{ height: 1, backgroundColor: colors.outline }} />
                                    <BottomSheetView style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', gap: 20, marginVertical: 20 }}>
                                        <MaterialCommunityIcons name="help-circle-outline" size={24} style={{ padding: 0, margin: 0 }} color={colors.text} />
                                        <BottomSheetView style={{ alignItems: 'flex-start', justifyContent: 'flex-start' }}>
                                            <Text style={{ color: colors.text }}>
                                                Necesito ayuda
                                            </Text>
                                        </BottomSheetView>
                                    </BottomSheetView>
                                </BottomSheetView>
                                <Pressable className='w-full rounded-full flex items-center justify-center h-12' style={{
                                    borderWidth: 1,
                                    borderColor: "#FFD25B",
                                    shadowColor: "#FFD25B",
                                    shadowOpacity: 0.5,
                                    shadowRadius: 10,
                                }}
                                    onPress={() => {
                                        Keyboard.dismiss()
                                        codeForm.handleSubmit(onCodeSubmit, onCodeError)()
                                    }}>
                                    {login.isPending ?
                                        <ActivityIndicator color={colors.text} size='small' />
                                        :
                                        <Text style={{ textTransform: "uppercase" }} className="text-white text-lg font-semibold ">
                                            Iniciar sesión
                                        </Text>
                                    }
                                </Pressable>
                                <View className="mb-5" />
                            </FormProvider>
                            <View style={{ height: 75 }} />
                        </BottomSheetScrollView>
                    </BottomSheet>

                </View>
            </ImageBackground>
        </View>
    )
}

export default Page