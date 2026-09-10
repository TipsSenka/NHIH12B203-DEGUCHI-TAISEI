export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;
    const origin = request.headers.get("Origin");
    const allowedOrigins = (env.ALLOWED_ORIGIN || "*").split(",").map((value) => value.trim()).filter(Boolean);
    const isAllowedOrigin = !origin || allowedOrigins.includes("*") || allowedOrigins.includes(origin);

    const corsHeaders = {
      ...(origin ? { "access-control-allow-origin": origin } : {}),
      "access-control-allow-methods": "GET, OPTIONS",
      "access-control-allow-headers": "Content-Type",
      "vary": "Origin",
    };

    if (!isAllowedOrigin) {
      return jsonResponse({ error: "Origin is not allowed" }, corsHeaders, 403);
    }

    if (method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    if (path === "/api" && method === "GET") {
      return jsonResponse({ name: "senka-api", status: "ok", endpoints: ["/api/course", "/api/hello?name=山田", "/api/fortune", "/api/events"] }, corsHeaders);
    }

    if (path === "/api/course" && method === "GET") {
      return jsonResponse(
        {
          course: "Cloudflare Workers 開発演習",
          instructor: "出口 大生",
          topics: ["Workers 基礎", "Pages 連携", "デプロイ運用", "カスタムドメイン"],
        },
        corsHeaders
      );
    }

    if (path === "/api/hello" && method === "GET") {
      const name = url.searchParams.get("name");
      if (!name || name.trim() === "") {
        return jsonResponse(
          { error: "name パラメータが必要です" },
          corsHeaders,
          400
        );
      }
      return jsonResponse(
        { message: `こんにちは、${name}さん！` },
        corsHeaders
      );
    }

    if (path === "/api/fortune" && method === "GET") {
      const fortunes = [
        "大吉", "中吉", "小吉", "吉", "末吉", "凶", "大凶"
      ];
      const fortune = fortunes[Math.floor(Math.random() * fortunes.length)];
      return jsonResponse({ fortune }, corsHeaders);
    }

    if (path === "/api/events" && method === "GET") {
      return jsonResponse(
        {
          events: [
            { id: 1, title: "キックオフ", date: "2026-09-01" },
            { id: 2, title: "中間発表", date: "2026-10-15" },
            { id: 3, title: "最終成果報告", date: "2026-12-20" },
          ],
        },
        corsHeaders
      );
    }

    return jsonResponse({ error: "Not Found" }, corsHeaders, 404);
  },
};

function jsonResponse(data, headers, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "content-type": "application/json;charset=UTF-8",
      ...headers,
    },
  });
}