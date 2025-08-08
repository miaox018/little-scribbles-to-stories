// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

async function invokeSelf(body: any) {
  const url = `${SUPABASE_URL}/functions/v1/page-worker`;
  return fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${SERVICE_ROLE}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405 });
    }
    const { storyId } = await req.json().catch(() => ({}));
    if (!storyId) return new Response("Missing storyId", { status: 400 });

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
      auth: { persistSession: false },
      global: { headers: { "X-Client-Info": "page-worker" } },
    });

    // Claim next job FIFO for this story
    const { data: job, error: claimErr } = await admin.rpc("claim_next_story_page_job", { p_story_id: storyId });
    if (claimErr) return new Response("Claim error: " + claimErr.message, { status: 500 });
    if (!job) {
      // Finalize story when no queued jobs
      const { data: pages, error: statErr } = await admin
        .from("story_pages")
        .select("transformation_status")
        .eq("story_id", storyId);

      if (!statErr) {
        const completed = (pages || []).filter((r: any) => r.transformation_status === "completed").length;
        const failed = (pages || []).filter((r: any) => r.transformation_status === "failed").length;
        const total = completed + failed;

        const status = total === 0 ? "failed" : failed === 0 ? "completed" : completed === 0 ? "failed" : "partial";
        const description =
          status === "completed"
            ? `Story completed successfully with ${completed} pages.`
            : status === "failed"
            ? `Story processing failed: All ${failed} pages failed to process.`
            : `Story partially completed: ${completed} successful, ${failed} failed pages. You can regenerate the failed pages.`;

        await admin
          .from("stories")
          .update({ status, total_pages: total, description, updated_at: new Date().toISOString() })
          .eq("id", storyId);
      }

      return new Response(JSON.stringify({ ok: true, message: "No queued jobs" }), {
        headers: { "content-type": "application/json" },
      });
    }

    // Load story + sheet
    const { data: story, error: storyErr } = await admin
      .from("stories")
      .select("id, character_version, character_sheet")
      .eq("id", storyId)
      .single();
    if (storyErr || !story) {
      await admin.rpc("finish_story_page_job", { p_job_id: job.id, p_success: false, p_error: "Story not found" });
      return new Response("Story not found", { status: 404 });
    }
    if (!story.character_sheet || Object.keys(story.character_sheet || {}).length === 0) {
      await admin.rpc("finish_story_page_job", { p_job_id: job.id, p_success: false, p_error: "Character sheet missing" });
      return new Response("Character sheet missing", { status: 400 });
    }

    let ok = false, errMsg = "";
    try {
      // TODO: integrate your real one-page renderer:
      // - Read original page storageUrl from job.payload.storageUrl (if needed)
      // - Use story.character_sheet + story.character_version
      // - Write generated assets to storage and insert/update story_pages
      // - Ensure story_pages.character_version = story.character_version
      // Placeholder success for scaffolding:
      ok = true;
    } catch (e) {
      ok = false;
      errMsg = (e as Error)?.message ?? String(e);
      console.error("render error", e);
    }

    await admin.rpc("finish_story_page_job", {
      p_job_id: job.id,
      p_success: ok,
      p_error: ok ? null : errMsg,
    });

    if (ok) {
      // Chain next page synchronously
      const resp = await invokeSelf({ storyId });
      if (!resp.ok) {
        console.error("Failed to invoke next page-worker", await resp.text());
      }
    }

    return new Response(
      JSON.stringify({ ok, jobId: job.id, page_number: job.page_number }),
      { headers: { "content-type": "application/json" } },
    );
  } catch (e) {
    return new Response((e as Error).message, { status: 500 });
  }
});

