import { Redirect, router } from "expo-router";
import { useEffect } from "react";
import Loading from "~/components/loading";
import { useSession } from "~/context/auth";
import { getString, removeStoreData } from "~/lib/storage";
import { api } from "~/utils/api";

export default function Index() {
	const { signIn, session } = useSession()
	const validateSession = api.mobile.auth.validateSession.useMutation({
		onSuccess: (res) => {
			console.log("success validate")
			signIn(res)
			router.replace("/(app)")
		},
		onError: () => {
			removeStoreData('user')
			removeStoreData('session')
			router.replace('/(auth)/login')
		}
	})

	useEffect(() => {
		const valid = async () => {
			const session = await getString("session")
			console.log("effect", session)
			if (session) { validateSession.mutate({ sessionId: session }) } else { router.replace('/(auth)/login') }
		}
		valid()
	}, [])
	
	return <Loading />;
};

