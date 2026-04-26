import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

interface Props {
  message?: string;
  onRetry: () => void;
  variant?: "inline" | "fullscreen";
}

/**
 * Banner de error reutilizable para queries que fallan.
 * Hace visible el problema al usuario en lugar de mostrar datos vacíos / cacheados,
 * que es lo que pasaba en MIUI cuando el sistema cortaba el refetch silenciosamente.
 */
export default function ErrorBanner({ message, onRetry, variant = "inline" }: Props) {
  const text =
    message ??
    "No pudimos cargar la información. Verificá tu conexión y volvé a intentar.";

  if (variant === "fullscreen") {
    return (
      <View style={styles.fullscreenWrap}>
        <MaterialCommunityIcons name="cloud-off-outline" size={48} color="#ff00ff" />
        <Text style={styles.fullscreenTitle}>No se pudo cargar</Text>
        <Text style={styles.fullscreenSub}>{text}</Text>
        <Pressable style={styles.retryBtn} onPress={onRetry}>
          <MaterialCommunityIcons name="refresh" size={16} color="#fff" />
          <Text style={styles.retryBtnText}>Reintentar</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.inlineWrap}>
      <MaterialCommunityIcons
        name="alert-circle-outline"
        size={18}
        color="#ffcc00"
      />
      <Text style={styles.inlineText}>{text}</Text>
      <Pressable style={styles.inlineBtn} onPress={onRetry}>
        <Text style={styles.inlineBtnText}>Reintentar</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  inlineWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginHorizontal: 16,
    marginVertical: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "rgba(255,204,0,0.10)",
    borderWidth: 1,
    borderColor: "rgba(255,204,0,0.30)",
    borderRadius: 10,
  },
  inlineText: {
    color: "#ffcc00",
    fontSize: 12,
    flex: 1,
    lineHeight: 17,
  },
  inlineBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "rgba(255,204,0,0.20)",
    borderRadius: 8,
  },
  inlineBtnText: {
    color: "#ffcc00",
    fontSize: 11,
    fontWeight: "700",
  },
  fullscreenWrap: {
    flex: 1,
    backgroundColor: "#0d1233",
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
    paddingHorizontal: 32,
  },
  fullscreenTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  fullscreenSub: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  retryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#ff00ff",
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  retryBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
});
