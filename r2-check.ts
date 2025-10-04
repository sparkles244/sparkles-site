export const onRequestGet: PagesFunction<{ FANWALL_BUCKET: R2Bucket }> = async ({ env }) => {
  try {
    const list = await env.FANWALL_BUCKET.list({ limit: 5 });
    const names = list.objects.map(o => o.key);
    return Response.json({ ok: true, sample: names });
  } catch (err) {
    return new Response("R2 test failed: " + (err as any)?.message, { status: 500 });
  }
};
