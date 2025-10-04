// DEBUG version: more explicit error messages to diagnose 400s.

const ALLOWED_TYPES = new Set([
  "image/jpeg", "image/png", "image/webp", "image/gif",
  "video/mp4", "video/webm"
]);

const MAX_MB_IMAGE = 10;
const MAX_MB_VIDEO = 200;

export const onRequestPost: PagesFunction<{ FANWALL_BUCKET: R2Bucket }> = async ({ request, env }) => {
  // Require JSON content-type
  const ctReq = request.headers.get("Content-Type") || "";
  if (!ctReq.toLowerCase().includes("application/json")) {
    return new Response("expected application/json request", { status: 400 });
  }

  let body: any;
  try {
    body = await request.json();
  } catch (e) {
    return new Response("could not parse JSON body", { status: 400 });
  }

  const { filename, contentType, sizeBytes } = body || {};

  if (typeof filename !== "string" || !filename) {
    return new Response("filename required (string)", { status: 400 });
  }
  if (typeof contentType !== "string" || !contentType) {
    return new Response("contentType required (string)", { status: 400 });
  }
  if (!ALLOWED_TYPES.has(contentType)) {
    return new Response(
      "unsupported contentType; allowed: " + Array.from(ALLOWED_TYPES).join(", "),
      { status: 415 }
    );
  }
  if (sizeBytes != null && typeof sizeBytes !== "number") {
    return new Response("sizeBytes must be a number if provided", { status: 400 });
  }

  // Optional size gate
  if (typeof sizeBytes === "number") {
    const mb = sizeBytes / (1024 * 1024);
    const limit = contentType.startsWith("image/") ? MAX_MB_IMAGE : MAX_MB_VIDEO;
    if (mb > limit) {
      return new Response(`file too large; limit ${limit} MB`, { status: 413 });
    }
  }

  // Sanitize filename
  const safe = filename.replace(/[^\w.\-]/g, "_").slice(0, 120);
  const key = `uploads/${Date.now()}-${crypto.randomUUID()}-${safe}`;

  try {
    const uploadURL = await env.FANWALL_BUCKET.createPresignedUrl({
      key,
      method: "PUT",
      expiresIn: 60 * 5,
      headers: { "Content-Type": contentType }
    });
    return Response.json({ uploadURL, objectKey: key });
  } catch (e: any) {
    // If binding name is wrong or bucket missing, this will surface here
    return new Response("failed to create presigned URL: " + (e?.message || e), { status: 500 });
  }
};

// Optional: handle accidental GETs more gracefully
export const onRequestGet: PagesFunction = async () =>
  new Response("Use POST with JSON: { filename, contentType, sizeBytes }", { status: 405 });
