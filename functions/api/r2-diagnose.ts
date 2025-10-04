export const onRequestGet: PagesFunction<{ FANWALL_BUCKET: R2Bucket }> = async ({ env }) => {
  try {
    if (!env.FANWALL_BUCKET) {
      return new Response("❌ FANWALL_BUCKET is undefined — binding not injected", { status: 500 });
    }

    const list = await env.FANWALL_BUCKET.list({ limit: 3 });
    const names = list.objects.map(o => o.key);
    return Response.json({ ok: true, objects: names });
  } catch (err) {
    return new Response("❌ R2 list failed: " + (err as any)?.message, { status: 500 });
  }
};
