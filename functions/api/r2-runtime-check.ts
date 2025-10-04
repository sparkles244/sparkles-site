export const onRequestGet: PagesFunction<{ FANWALL_BUCKET: R2Bucket }> = async ({ env }) => {
  const bucketHas = {
    typeOfBucket: typeof env.FANWALL_BUCKET,
    hasCreatePresignedUrl: typeof (env.FANWALL_BUCKET as any)?.createPresignedUrl
  };
  return new Response(JSON.stringify(bucketHas, null, 2), {
    headers: { "Content-Type": "application/json" }
  });
};
