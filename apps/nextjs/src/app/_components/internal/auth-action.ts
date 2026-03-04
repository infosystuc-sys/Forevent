// app/actions.ts

"use server";

import { signIn, signOut } from '@forevent/auth';
import { LoginFormFields } from './login-form';

export async function handleInternalSignIn(data: LoginFormFields) {
  // console.log("data server action", data);
  await signIn("credentials", { email: data.email, password: data.password, internal: true, redirect: false, callbackUrl: "" })
}

export async function handleInternalSignOut() {
  await signOut({ redirectTo: '/login' })
}