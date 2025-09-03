import {
  signInWithRedirect,
  signOut as amplifySignOut,
  getCurrentUser,
  fetchAuthSession,
  fetchUserAttributes,
} from "aws-amplify/auth";

export async function signIn() {
  try {
    console.log("signInWithRedirect starting...");
    await signInWithRedirect({
      provider: "Cognito", // Explicitly specify provider
    });
  } catch (error) {
    console.error("signInWithRedirect error:", error);
    throw error;
  }
}

export async function signOut() {
  try {
    await amplifySignOut();
  } catch (error) {
    console.error("Sign out error:", error);
    throw error;
  }
}

export async function getUser() {
  try {
    const user = await getCurrentUser();
    console.log("Current user:", user);
    return user;
  } catch (error) {
    console.log("No current user:", error.message);
    return null;
  }
}

export async function getAccessToken() {
  try {
    const { tokens } = await fetchAuthSession();
    return tokens?.accessToken?.toString() ?? null;
  } catch (error) {
    console.error("Error fetching access token:", error);
    return null;
  }
}

export async function getEmail() {
  try {
    const attrs = await fetchUserAttributes();
    return attrs?.email ?? null;
  } catch (error) {
    console.error("Error fetching email:", error);
    return null;
  }
}
