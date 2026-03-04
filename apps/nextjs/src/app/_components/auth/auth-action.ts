"use server";

import { signIn, signOut } from "@forevent/auth";
import { LoginFormFields } from "./login-form";

export async function handleSignIn(data: LoginFormFields) {
  await signIn("credentials", {
    email: data.email,
    password: data.password,
    internal: false,
    redirect: false,
    callbackUrl: "",
  });
}

export async function handleGoogleSignIn() {
  await signIn("google", { redirectTo: "/v1" });
}

export async function handleSignOut() {
  await signOut({ redirectTo: "/login" });
}
