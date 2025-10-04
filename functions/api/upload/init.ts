// /functions/api/upload/init.ts
// Returns a one-time R2 presigned URL for direct browser upload.
//
// Security notes:
// - We sanitize filename.
// - We restrict MIME types.
// - We enforce a short expiry.
// - We set the Content-Type header in the signature so clients must match it.

const ALLOWED_TYPES = new Set([
  // images
  "image/jpeg", "image/png", "image/webp", "image/gif",
  // videos (add/remove as you like)
  "video/mp4", "video/webm"
]);

const MAX_MB_IMAGE = 10;    // soft client-side guard (enforce in frontend too)
const MAX_MB_VIDEO = 200;   // adjust as you need

export const onRequestPost: PagesFunction<{ FANWALL_BUCKET: R2Bucket }> = async ({ request, env }) => {
  try {
    // 1) Parse JSON body
    const { filename, contentType, sizeBytes } = await request.json();

    // 2) Validate inputs
    if (!filename || typeof filename !== "string") {
      return new Response("filename required", { status: 400 });
    }
    if (!contentType || typeof contentType !== "string") {
      return new Response("contentType required", { status: 400 });
    }
    if (!ALLOWED_TYPES.has(contentType)) {
      return new Response("unsupported contentType", { status: 415 });
    }

    // (Optional) size gate (best-effort; true enforcement happens at upload edge or via chunking)
    if (typeof sizeBytes === "number") {
      const mb = sizeBytes / (1024 * 1024);
      const isImage = contentType.startsWith("image/");
      const limit = isImage ? MAX_MB_IMAGE : MAX_MB_VIDEO;
      if (mb > limit) {
        return new Response(`file too large; limit ${limit} MB`, { status: 413 });
      }
    }

    // 3) Sanitize filename to avoid weird characters
    const safe = filename.replace(/[^\w.\-]/g, "_").slice(0, 120);

    // 4) Build an object key (path) inside your bucket
    //    Example: uploads/1730680451000-9f90b4a4-clip.mp4
    const key = `uploads/${Date.now()}-${crypto.randomUUID()}-${safe}`;

    // 5) Create a presigned PUT URL valid for 5 minutes
    const uploadURL = await env.FANWALL_BUCKET.createPresignedUrl({
      key,
      method: "PUT",
      expiresIn: 60 * 5, // seconds
      headers: { "Content-Type": contentType }
    });

    // 6) Return info to the client
    return Response.json({ uploadURL, objectKey: key });
  } catch (err) {
    return new Response("bad request", { status: 400 });
  }
};
