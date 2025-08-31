import {
  signInWithRedirect,
  signOut as amplifySignOut,
  getCurrentUser,
  fetchAuthSession,
  fetchUserAttributes,
} from "aws-amplify/auth";

export async function signIn() {
  await signInWithRedirect();
}

export async function signOut() {
  await amplifySignOut();
}

export async function getUser() {
  try {
    return await getCurrentUser(); // { userId, username, ... }
  } catch {
    return null;
  }
}

export async function getAccessToken() {
  const { tokens } = await fetchAuthSession();
  return tokens?.accessToken?.toString() ?? null;
}

// optional if you want email in Navbar
export async function getEmail() {
  try {
    const attrs = await fetchUserAttributes();
    return attrs?.email ?? null;
  } catch {
    return null;
  }
}
