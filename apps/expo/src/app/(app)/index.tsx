import { Redirect } from "expo-router";

// Role-selector screen removed: all users go directly to the home tab.
// The employee/guild flow remains accessible via Settings → Organizaciones.
export default function Index() {
  return <Redirect href="/(app)/home/(tabs)" />;
}
