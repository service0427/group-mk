import { getAssetFromKV } from '@cloudflare/kv-asset-handler';

// 와일드카드 라우트 처리를 포함한 기본 정적 사이트 워커
addEventListener('fetch', event => {
    event.respondWith(handleEvent(event));
});

async function handleEvent(event) {
    try {
        // KV 스토어에서 정적 자산 제공
        return await getAssetFromKV(event);
    } catch (e) {
        // 자산을 찾을 수 없으면 SPA 모드에서 index.html 제공
        let notFoundResponse = await getAssetFromKV(event, {
            mapRequestToAsset: req => new Request(`${new URL(req.url).origin}/index.html`, req),
        });

        return new Response(notFoundResponse.body, {
            ...notFoundResponse,
            status: 200,
        });
    }
}