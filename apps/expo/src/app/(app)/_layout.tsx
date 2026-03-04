import { Redirect, Stack } from 'expo-router';
import Loading from '~/components/loading';
import { useSession } from '~/context/auth';

export const screenOptionStyle = {
    headerShown: false,
};

export default function AppLayout() {
    const { isLoading, user } = useSession();

    // Wait for SecureStore to finish reading before deciding where to redirect.
    if (isLoading) {
        return <Loading />;
    }

    // No authenticated user — go straight to login, bypassing the session
    // re-validator at "/" to avoid an unnecessary round-trip.
    if (!user) {
        return <Redirect href="/(auth)/login" />;
    }

    return <Stack screenOptions={{ headerShown: false }} />;
}

