import { Redirect, router } from "expo-router";
import { useEffect } from "react";
import Loading from "~/components/loading";
import { useSession } from "~/context/auth";
import { api } from "~/utils/api";

export default function Index() {
	const { signIn, signOut, session, user, isLoading } = useSession()
	const validateSession = api.mobile.auth.validateSession.useMutation({
		onSuccess: (res) => {
			signIn(res)
			router.replace("/(app)")
		},
		onError: () => {
			void signOut()
			router.replace('/(auth)/login')
		}
	})

	useEffect(() => {
		if (isLoading) return
		// Ya hay user hidratado en memoria → confiamos en SecureStore y saltamos la validación.
		if (user) {
			router.replace("/(app)")
			return
		}
		// Hay session token pero falta user → revalidar contra backend.
		if (session) {
			validateSession.mutate({ sessionId: session })
			return
		}
		router.replace('/(auth)/login')
	}, [isLoading, user, session])

	return <Loading />;
};
