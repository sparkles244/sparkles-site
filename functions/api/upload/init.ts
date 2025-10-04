// /functions/api/upload/init.ts
// Creates a presigned upload URL for R2 (images + videos)

const ALLOWED_TYPES = new Set([
  "image/jpeg", "image/png", "image/webp", "image/gif",
  "video/mp4", "video/webm"
]);

export const onRequestPost: PagesFunction<{ FANWALL_BUCKET: R2Bucket }> =
async ({ request, env }) => {
  try {
    // 1️⃣ Ensure the request is JSON
    const ct = request.headers.get("content-type") || "";
    if (!ct.includes("application/json")) {
      return new Response("Expected application/json", { status: 400 });
    }

    // 2️⃣ Parse the body
    const { filename, contentType } = await request.json();

    // 3️⃣ Validate inputs
    if (!filename || typeof filename !== "string") {
      return new Response("Missing filename", { status: 400 });
    }
    if (!contentType || typeof contentType !== "string") {
      return new Response("Missing contentType", { status: 400 });
    }
    if (!ALLOWED_TYPES.has(contentType)) {
      return new Response(
        "Unsupported contentType: " + contentType,
        { status: 415 }
      );
    }

    // 4️⃣ Sanitize filename
    const safe = filename.replace(/[^\w.\-]/g, "_").slice(0, 120);
    const key = `uploads/${Date.now()}-${crypto.randomUUID()}-${safe}`;

    // 5️⃣ Create the presigned URL
    const uploadURL = await env.FANWALL_BUCKET.createPresignedUrl({
      key,
      method: "PUT",
      expiresIn: 60 * 5, // 5 minutes
      headers: { "Content-Type": contentType }
    });

    // 6️⃣ Respond with JSON
    return Response.json({ uploadURL, objectKey: key });

  } catch (err: any) {
    // helpful debugging output
    return new Response(
      "Init failed: " + (err?.message || String(err)),
      { status: 500 }
    );
  }
};

// Optional: handle GET to show simple message
export const onRequestGet: PagesFunction = async () =>
  new Response("Use POST { filename, contentType }", { status: 405 });
