import { auth } from './firebase-config';

export async function getAuthToken(): Promise<string | null> {
  try {
    const user = auth.currentUser;
    if (!user) {
      console.error("No authenticated user found");
      return null;
    }
    return await user.getIdToken(true); // Force refresh the token
  } catch (error) {
    console.error("Error getting auth token:", error);
    return null;
  }
}

export async function getCurrentUser() {
  return auth.currentUser;
}
