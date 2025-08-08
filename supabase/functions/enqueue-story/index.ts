// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface PageInput {
  page_number: number; // 1-based
  storageUrl: string;
}

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    const body = await req.json().catch(() => ({}));
    const { storyId, pageInputs } = body as { storyId?: string; pageInputs?: PageInput[] };

    if (!storyId || !Array.isArray(pageInputs) || pageInputs.length === 0) {
      return new Response("Missing storyId or pageInputs[]", { status: 400 });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
      auth: { persistSession: false },
      global: { headers: { "X-Client-Info": "enqueue-story" } },
    });

    // Ensure story exists & get current character version
    const { data: story, error: storyErr } = await admin
      .from("stories")
      .select("id, character_version, character_sheet")
      .eq("id", storyId)
      .single();

    if (storyErr || !story) {
      return new Response("Story not found", { status: 404 });
    }

    // Prepare jobs with 1-based page_number and payload storageUrl
    const jobs = pageInputs.map((p) => ({
      story_id: storyId,
      page_number: p.page_number,
      character_version: story.character_version as number,
      status: "queued",
      payload: { storageUrl: p.storageUrl },
    }));

    const { error: upErr } = await admin
      .from("story_page_jobs")
      .upsert(jobs as any, { onConflict: "story_id,page_number", ignoreDuplicates: true });
    if (upErr) {
      return new Response("Failed to enqueue pages: " + upErr.message, { status: 500 });
    }

    // Kick worker for this story and await to guarantee scheduling
    const invokeUrl = `${SUPABASE_URL}/functions/v1/page-worker`;
    const resp = await fetch(invokeUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SERVICE_ROLE}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ storyId }),
    });

    if (!resp.ok) {
      const txt = await resp.text();
      return new Response("Failed to kick worker: " + txt, { status: 500 });
    }

    return new Response(
      JSON.stringify({ ok: true, enqueued: jobs.length }),
      { headers: { "content-type": "application/json" } },
    );
  } catch (e) {
    return new Response((e as Error).message, { status: 500 });
  }
});

