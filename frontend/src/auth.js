import {
  signInWithRedirect,
  signOut as amplifySignOut,
  getCurrentUser,
  fetchAuthSession,
  fetchUserAttributes,
} from "aws-amplify/auth";

export const signIn = () => signInWithRedirect({ provider: "Cognito" });
export const signOut = () => amplifySignOut();

// Process ?code=... on /callback and hydrate tokens
export const completeAuth = () => fetchAuthSession();

export async function currentUser() {
  try {
    return await getCurrentUser();
  } catch {
    return null;
  }
}

export async function currentEmail() {
  try {
    const attrs = await fetchUserAttributes();
    return attrs?.email ?? null;
  } catch {
    return null;
  }
}
