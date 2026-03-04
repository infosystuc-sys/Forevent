import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Slot } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SessionProvider } from "~/context/auth";

import { TRPCProvider } from "~/utils/api";

import "../styles.css";

import { useColorScheme } from "nativewind";
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AVPlaybackStatus, ResizeMode, Video } from "expo-av";
import { View, useWindowDimensions } from "react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet } from "react-native";
import { SplashScreen } from "expo-router";
import { Animated } from "react-native";
import * as SecureStore from 'expo-secure-store';
import {
  useFonts,
  Montserrat_700Bold,
  Montserrat_800ExtraBold,
} from '@expo-google-fonts/montserrat';
import WelcomeScreen, { HIDE_WELCOME_KEY } from "~/components/WelcomeScreen";

export function SplashVideo({ onLoaded, onFinish }: { onLoaded: () => void, onFinish: () => void }) {
  const video = useRef(null);
  const [lastStatus, setStatus] = useState<AVPlaybackStatus | any>({});
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  return (
    <Video
      ref={video}
      style={StyleSheet.absoluteFill}
      source={require("../assets/loading.mp4")}
      shouldPlay={!(lastStatus.isLoaded && lastStatus.didJustFinish)}
      isLooping={true}

      resizeMode={ResizeMode.CONTAIN}
      onPlaybackStatusUpdate={(status) => {
        if (status.isLoaded) {
          if (lastStatus.isLoaded !== status.isLoaded) {
            onLoaded();
          }
          if (status.didJustFinish) {
            onFinish();
          }
        }
        setStatus(() => status);
      }}
    />
  );
}

// Instruct SplashScreen not to hide yet, we want to do this manually
SplashScreen.preventAutoHideAsync()

function AnimatedSplashScreen({ children, fontsLoaded }: { children: React.ReactNode; fontsLoaded: boolean }) {
  const animation = useMemo(() => new Animated.Value(1), []);
  const [isVideoLoaded, setVideoLoaded] = useState(false);
  const [isSplashVideoComplete, setSplashVideoComplete] = useState(false);
  const [isSplashAnimationComplete, setAnimationComplete] = useState(false);
  const isAppReady = fontsLoaded && isVideoLoaded;

  useEffect(() => {
    if (isAppReady && isSplashVideoComplete) {
      Animated.timing(animation, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => setAnimationComplete(true));
    }
  }, [isAppReady, isSplashVideoComplete]);

  useEffect(() => {
    if (fontsLoaded && isVideoLoaded) {
      SplashScreen.hideAsync().catch(() => {})
    }
  }, [fontsLoaded, isVideoLoaded])

  const onImageLoaded = useCallback(() => {
    setVideoLoaded(true)
  }, [])

  const videoElement = useMemo(() => {
    return (
      <SplashVideo
        onLoaded={onImageLoaded}
        onFinish={() => {
          setSplashVideoComplete(true);
        }}

      />
    );
  }, [onImageLoaded, setSplashVideoComplete]);

  return (
    <View style={{ flex: 1 }}>
      {isAppReady && children}
      {!isSplashAnimationComplete && (
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: "#000000",
              opacity: animation,
            },
          ]}
        >
          {videoElement}
        </Animated.View>
      )}
    </View>
  );
}
// ─── Welcome Gate ────────────────────────────────────────────────────────────
// Lee SecureStore (más seguro que AsyncStorage) una sola vez tras el splash.
// · null  → leyendo  (el splash todavía está visible, no rendea nada)
// · true  → mostrar WelcomeScreen
// · false → saltar directo a la app (usuario ya la vio y tildó "no mostrar")
function WelcomeGate({ children }: { children: React.ReactNode }) {
  const [showWelcome, setShowWelcome] = useState<boolean | null>(null)

  useEffect(() => {
    SecureStore.getItemAsync(HIDE_WELCOME_KEY).then(val => {
      setShowWelcome(val !== 'true')
    })
  }, [])

  if (showWelcome === null) return null

  if (showWelcome) {
    return <WelcomeScreen onContinue={() => setShowWelcome(false)} />
  }

  return <>{children}</>
}

// This is the main layout of the app
// It wraps your pages with the providers they need
export default function RootLayout() {
  const { colorScheme } = useColorScheme();
  const [fontsLoaded] = useFonts({
    Montserrat_700Bold,
    Montserrat_800ExtraBold,
  });

  return (
    <TRPCProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SessionProvider>
          <ThemeProvider value={DarkTheme}>
            <AnimatedSplashScreen fontsLoaded={fontsLoaded ?? false}>
              <WelcomeGate>
                <Slot />
              </WelcomeGate>
            </AnimatedSplashScreen>
          </ThemeProvider>
        </SessionProvider>
        <StatusBar />
      </GestureHandlerRootView>
    </TRPCProvider >
  );
}
