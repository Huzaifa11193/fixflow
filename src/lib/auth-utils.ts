import { supabase } from "./supabase";

export async function getSession() {
  if (!supabase) return null;
  try {
    const { data } = await supabase.auth.getSession();
    return data.session;
  } catch {
    return null;
  }
}

export async function getCurrentUser() {
  if (!supabase) return null;
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user;
  } catch {
    return null;
  }
}

export async function getUserProfile() {
  if (!supabase) return null;
  try {
    const user = await getCurrentUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error && error.code !== "PGRST116") throw error;
    return data || null;
  } catch {
    return null;
  }
}

export async function updateUserProfile(
  updates: Record<string, unknown>
) {
  if (!supabase) return { error: "Supabase not configured" };
  try {
    const user = await getCurrentUser();
    if (!user) return { error: "Not authenticated" };

    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", user.id)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { error: String(error) };
  }
}

export async function changePassword(newPassword: string) {
  if (!supabase) return { error: "Supabase not configured" };
  try {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { error: String(error) };
  }
}

export async function signOut() {
  if (!supabase) return { error: "Supabase not configured" };
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { error: null };
  } catch (error) {
    return { error: String(error) };
  }
}
