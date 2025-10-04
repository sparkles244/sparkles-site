// Cloudflare Pages Function that checks if R2 is connected
export const onRequestGet: PagesFunction<{ FANWALL_BUCKET: R2Bucket }> = async ({ env }) => {
  // Make a unique file name
  const key = `healthchecks/${Date.now()}.txt`;

  // 1. Write a tiny file into your R2 bucket
  await env.FANWALL_BUCKET.put(key, "hello from sparkles.dance", {
    httpMetadata: { contentType: "text/plain" }
  });

  // 2. Read the same file back
  const obj = await env.FANWALL_BUCKET.get(key);
  const text = obj ? await obj.text() : "(missing)";

  // 3. Send a JSON response to the browser
  return new Response(JSON.stringify({ ok: true, key, text }), {
    headers: { "Content-Type": "application/json" }
  });
};
