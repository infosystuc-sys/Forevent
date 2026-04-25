import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useState } from "react";
import {
  Linking,
  Modal,
  NativeModules,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

const PROMPT_DISMISSED_KEY = "device_optimization_prompt_dismissed_v1";
const PACKAGE_NAME = "com.ssitgroup.forevent";

/**
 * Devuelve true si el device es Xiaomi/Redmi/POCO (todos corren MIUI/HyperOS).
 * Lee desde Platform.constants (RN 0.62+, no requiere expo-device).
 */
function isMiuiDevice(): boolean {
  if (Platform.OS !== "android") return false;
  const constants = (Platform as unknown as { constants?: { Manufacturer?: string; Brand?: string } }).constants;
  const manufacturer = (constants?.Manufacturer ?? "").toLowerCase();
  const brand = (constants?.Brand ?? "").toLowerCase();
  return ["xiaomi", "redmi", "poco"].some(
    (m) => manufacturer.includes(m) || brand.includes(m),
  );
}

/**
 * Lanza el diálogo nativo de Android para que el usuario excluya la app de la
 * optimización de batería con un solo toque. Si el intent no funciona (algunos
 * OEMs lo bloquean), cae al settings genérico de la app.
 */
async function openBatteryOptimizationSettings() {
  try {
    // Primero intentamos el intent específico (modal nativo, 1 tap)
    await Linking.sendIntent(
      "android.settings.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS",
      [{ key: "data", value: `package:${PACKAGE_NAME}` }],
    );
  } catch {
    try {
      // Fallback 1: lista global de battery optimization
      await Linking.sendIntent("android.settings.IGNORE_BATTERY_OPTIMIZATION_SETTINGS");
    } catch {
      // Fallback 2: settings de la app
      void Linking.openSettings();
    }
  }
}

/**
 * Modal que aparece en el primer arranque para pedirle al user que permita
 * ejecución libre de la app. Contiene:
 *   - Botón rápido (intent nativo) para todos los Android
 *   - Instrucciones extendidas específicas de MIUI cuando se detecta Xiaomi
 *
 * Se muestra una sola vez. Después de aceptar/rechazar queda guardado en SecureStore.
 */
export default function DeviceOptimizationPrompt() {
  const [visible, setVisible] = useState(false);
  const [showMiuiSteps, setShowMiuiSteps] = useState(false);

  useEffect(() => {
    if (Platform.OS !== "android") return;
    SecureStore.getItemAsync(PROMPT_DISMISSED_KEY)
      .then((value) => {
        if (!value) setVisible(true);
      })
      .catch(() => {
        // Si SecureStore falla, mostramos igual el prompt — mejor pedir dos
        // veces que perder al user de Xiaomi por restricciones del OS.
        setVisible(true);
      });
  }, []);

  function dismiss() {
    setVisible(false);
    void SecureStore.setItemAsync(PROMPT_DISMISSED_KEY, "1").catch(
      () => undefined,
    );
  }

  async function handleAllow() {
    await openBatteryOptimizationSettings();
    // Damos un pequeño tiempo para que la setting se persista, después cerramos.
    setTimeout(dismiss, 500);
  }

  if (Platform.OS !== "android") return null;

  const miui = isMiuiDevice();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={dismiss}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <ScrollView contentContainerStyle={styles.modalScroll}>
            <View style={styles.iconWrap}>
              <MaterialCommunityIcons name="rocket-launch" size={36} color="#ff00ff" />
            </View>

            <Text style={styles.title}>Para que Forevent ande sin cortes</Text>
            <Text style={styles.subtitle}>
              Algunos celulares cortan la app cuando estás navegando, lo que hace
              que tus tickets, favoritos o compras no se actualicen. Permitinos
              uso libre para que esto no te pase.
            </Text>

            <Pressable style={styles.primaryBtn} onPress={handleAllow}>
              <MaterialCommunityIcons name="check-circle" size={18} color="#fff" />
              <Text style={styles.primaryBtnText}>Permitir uso libre</Text>
            </Pressable>

            {miui && (
              <Pressable
                style={styles.secondaryBtn}
                onPress={() => setShowMiuiSteps((s) => !s)}
              >
                <MaterialCommunityIcons
                  name={showMiuiSteps ? "chevron-up" : "chevron-down"}
                  size={16}
                  color="#13a8fe"
                />
                <Text style={styles.secondaryBtnText}>
                  {showMiuiSteps ? "Ocultar" : "Tu Xiaomi necesita pasos extra"}
                </Text>
              </Pressable>
            )}

            {miui && showMiuiSteps && (
              <View style={styles.stepsBox}>
                <Text style={styles.stepsTitle}>En tu Xiaomi también activá:</Text>
                <Step n={1} text="Ajustes → Apps → Forevent → Ahorro de batería → Sin restricciones" />
                <Step n={2} text="Ajustes → Apps → Forevent → Inicio automático → Activado" />
                <Step n={3} text="Ajustes → Apps → Forevent → Datos en segundo plano → Activado" />
                <Step n={4} text="Ajustes → Batería → Optimización → Forevent → No optimizar" />

                <Pressable style={styles.openSettingsBtn} onPress={() => void Linking.openSettings()}>
                  <Text style={styles.openSettingsText}>Abrir Ajustes de la app</Text>
                </Pressable>
              </View>
            )}

            <Pressable style={styles.skipBtn} onPress={dismiss}>
              <Text style={styles.skipBtnText}>Ahora no</Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function Step({ n, text }: { n: number; text: string }) {
  return (
    <View style={styles.stepRow}>
      <View style={styles.stepNum}>
        <Text style={styles.stepNumText}>{n}</Text>
      </View>
      <Text style={styles.stepText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modal: {
    width: "100%",
    maxWidth: 420,
    maxHeight: "85%",
    backgroundColor: "#1a2050",
    borderRadius: 20,
    overflow: "hidden",
  },
  modalScroll: {
    padding: 24,
    gap: 14,
    alignItems: "center",
  },
  iconWrap: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "rgba(255,0,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  title: {
    color: "#fff",
    fontSize: 19,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 2,
  },
  subtitle: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 19,
    marginBottom: 8,
  },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#ff00ff",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    width: "100%",
    justifyContent: "center",
  },
  primaryBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  secondaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 8,
  },
  secondaryBtnText: {
    color: "#13a8fe",
    fontSize: 13,
    fontWeight: "600",
  },
  stepsBox: {
    width: "100%",
    backgroundColor: "rgba(19,168,254,0.08)",
    borderWidth: 1,
    borderColor: "rgba(19,168,254,0.25)",
    borderRadius: 12,
    padding: 14,
    gap: 10,
  },
  stepsTitle: {
    color: "#13a8fe",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.4,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  stepRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
  },
  stepNum: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#13a8fe",
    alignItems: "center",
    justifyContent: "center",
  },
  stepNumText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "800",
  },
  stepText: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 12,
    lineHeight: 17,
    flex: 1,
  },
  openSettingsBtn: {
    paddingVertical: 10,
    alignItems: "center",
    backgroundColor: "rgba(19,168,254,0.20)",
    borderRadius: 8,
    marginTop: 4,
  },
  openSettingsText: {
    color: "#13a8fe",
    fontSize: 12,
    fontWeight: "700",
  },
  skipBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  skipBtnText: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 13,
  },
});
