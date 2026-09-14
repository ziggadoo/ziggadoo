"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function admin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");
  const { data: p } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (p?.role !== "admin") throw new Error("Admins only");
  return supabase;
}

function bust(venueId: string, slug: string) { revalidatePath(`/admin/venues/${venueId}`); revalidatePath(`/v/${slug}`); revalidatePath("/"); }

/** Sets (or clears, with null) the venue's main image. Saved immediately, no need to press Save on the form. */
export async function setHero(venueId: string, slug: string, url: string | null) {
  const supabase = await admin();
  const { error } = await supabase.from("venues").update({ hero_image_url: url }).eq("id", venueId);
  if (error) throw new Error(error.message);
  bust(venueId, slug);
}

export async function insertPhoto(venueId: string, slug: string, url: string, caption: string | null, sortOrder: number) {
  const supabase = await admin();
  const { data, error } = await supabase.from("venue_photos").insert({ venue_id: venueId, storage_path: url, caption, is_community: false, status: "approved", sort_order: sortOrder }).select("id").single();
  if (error) throw new Error(error.message);
  bust(venueId, slug);
  return data.id as string;
}

export async function updatePhoto(venueId: string, slug: string, photoId: string, patch: { storage_path?: string; caption?: string | null; sort_order?: number }) {
  const supabase = await admin();
  const { error } = await supabase.from("venue_photos").update(patch).eq("id", photoId);
  if (error) throw new Error(error.message);
  bust(venueId, slug);
}

export async function deletePhotoRecord(venueId: string, slug: string, photoId: string) {
  const supabase = await admin();
  const { error } = await supabase.from("venue_photos").delete().eq("id", photoId);
  if (error) throw new Error(error.message);
  bust(venueId, slug);
}

export async function reorderPhotos(venueId: string, slug: string, ids: string[]) {
  const supabase = await admin();
  for (let i = 0; i < ids.length; i++) {
    const { error } = await supabase.from("venue_photos").update({ sort_order: i + 1 }).eq("id", ids[i]);
    if (error) throw new Error(error.message);
  }
  bust(venueId, slug);
}
