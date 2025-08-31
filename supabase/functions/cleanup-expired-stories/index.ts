// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Deletes all storage objects under a story's folder
async function deleteStoryStorage(admin: any, userId: string, storyId: string) {
  const bucket = admin.storage.from("story-images");
  const prefix = `${userId}/${storyId}`;

  // List possible folders we used
  const subPrefixes = [
    `${prefix}/original/`,
    `${prefix}/generated/`,
    `${prefix}/temp/`,
    `${prefix}/`,
  ];

  for (const p of subPrefixes) {
    const { data } = await bucket.list(p, { limit: 1000 });
    if (!data || data.length === 0) continue;
    const paths = data.map((f: any) => `${p}${f.name}`);
    await bucket.remove(paths);
  }
}

Deno.serve(async (req) => {
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
    auth: { persistSession: false },
    global: { headers: { "X-Client-Info": "cleanup-expired-stories" } },
  });

  try {
    let includeCancelledOnce = false;
    let cancelledHours = 24; // default
    try {
      const body = await req.json();
      includeCancelledOnce = !!body?.includeCancelledOnce;
      if (body?.cancelledHours && Number(body.cancelledHours) > 0) {
        cancelledHours = Number(body.cancelledHours);
      }
    } catch { /* no body provided (scheduled run) */ }

    // 7 days expiration for any story NOT in ('saved','processing')
    const sevenDaysAgoIso = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: stories, error } = await admin
      .from("stories")
      .select("id, user_id, status, description, updated_at")
      .not("status", "in", "(saved,processing)")
      .lte("updated_at", sevenDaysAgoIso);

    if (error) throw error;

    let toDelete = (stories || []).filter((s: any) => s.description !== "saved_to_library");

    // Optionally add cancelled>24h (one-time invocation)
    if (includeCancelledOnce) {
      const { data: cancelled } = await admin
        .from("stories")
        .select("id, user_id, status, description, updated_at")
        .eq("status", "cancelled")
        .lte("updated_at", new Date(Date.now() - cancelledHours * 60 * 60 * 1000).toISOString());
      if (cancelled && cancelled.length) {
        toDelete = toDelete.concat(cancelled);
      }
    }

    let deleted = 0;

    for (const s of toDelete) {
      // Delete storage assets
      await deleteStoryStorage(admin, s.user_id, s.id);

      // Delete DB rows in order: pages -> jobs -> story
      await admin.from("story_pages").delete().eq("story_id", s.id);
      await admin.from("story_page_jobs").delete().eq("story_id", s.id);
      await admin.from("stories").delete().eq("id", s.id);
      deleted++;
    }

    return new Response(JSON.stringify({ deleted, includeCancelledOnce }), {
      headers: { "content-type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500 });
  }
});

