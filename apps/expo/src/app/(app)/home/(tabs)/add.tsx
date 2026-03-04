import { Redirect } from 'expo-router'

// Esta pantalla nunca se muestra — el FAB del tab bar
// navega directamente a la categoría de eventos.
export default function AddScreen() {
    return <Redirect href="/(app)/home/(tabs)" />
}
