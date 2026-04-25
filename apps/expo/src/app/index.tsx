import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import Loading from "~/components/loading";
import { useSession } from "~/context/auth";
import { api } from "~/utils/api";

export default function Index() {
	const { signIn, signOut, session, user, isLoading } = useSession()
	// "idle" mientras decidimos; luego uno de los destinos.
	// Usamos <Redirect> declarativo en vez de router.replace imperativo para evitar
	// "Attempted to navigate before mounting the Root Layout" — el router recién está
	// "ready" después del primer render del Slot.
	const [target, setTarget] = useState<"app" | "login" | null>(null)

	const validateSession = api.mobile.auth.validateSession.useMutation({
		onSuccess: (res) => {
			signIn(res)
			setTarget("app")
		},
		onError: () => {
			void signOut()
			setTarget("login")
		}
	})

	useEffect(() => {
		if (isLoading) return
		if (user) {
			setTarget("app")
			return
		}
		if (session) {
			validateSession.mutate({ sessionId: session })
			return
		}
		setTarget("login")
	}, [isLoading, user, session])

	if (target === "app") return <Redirect href="/(app)" />
	if (target === "login") return <Redirect href="/(auth)/login" />
	return <Loading />;
};
