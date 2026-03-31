import { Redirect } from "expo-router";
import React from "react";
import { ActivityIndicator, View } from "react-native";
import { useSession } from "~/context/auth";
import { api } from "~/utils/api";

export default function Index() {
  const { user } = useSession();

  const employeeStatus = api.mobile.auth.checkEmployeeStatus.useQuery(
    { userId: user?.id ?? "" },
    { enabled: !!user?.id, retry: 1 },
  );

  // Still loading employee status — show a brief spinner on the dark background
  if (employeeStatus.isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: "#002447", justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#13a8fe" />
      </View>
    );
  }

  // User has active employee assignments → show role selection
  if (employeeStatus.data?.isEmployee) {
    return <Redirect href="/(app)/role-selection" />;
  }

  // Regular user → go straight to home
  return <Redirect href="/(app)/home/(tabs)" />;
}
