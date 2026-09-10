/**
 * backend : 架空データを返す学科紹介API（Cloudflare Workers）
 * 本番URL: https://backend.tatataise091403.workers.dev
 *
 * フレームワークを使わない「バニラJavaScript」で書いています。
 * 使っているのは標準文法と Web API（Request / Response / URL）だけです。
 *
 * エンドポイント一覧
 *   GET /                 … Worker自体の稼働確認（/api と同じ）
 *   GET /api              … APIの稼働確認とエンドポイント一覧
 *   GET /api/course       … 学科紹介（架空データ）
 *   GET /api/hello        … 時間帯の挨拶（?name=山田 で名前付き挨拶）
 *   GET /api/fortune      … おみくじ（ランダム）
 *   GET /api/events       … イベント一覧（配列）
 *   上記以外              … 404
 */

// ============================================================
// CORS 設定
// ------------------------------------------------------------
// ローカル開発中は "*"（すべてのオリジンを許可）にしています。
// 本番公開後は、Pages の公開URLだけに限定してください。
//   例: const ALLOWED_ORIGINS = ["https://<your-project>.pages.dev"];
//   独自ドメインも使う場合は配列に追加します。
//   例: ["https://<your-project>.pages.dev", "https://<custom-domain>"]
// ※ 詳しくは doc/Cloudflareデプロイ後_変更点チェックリスト.md の「2.」を参照
// ============================================================
const ALLOWED_ORIGINS = ["*"];

// 名前付き挨拶で受け付ける名前の最大文字数（入力チェック用）
const NAME_MAX_LENGTH = 20;

// ============================================================
// 架空データ（実在の学科・個人情報は含めない）
// ============================================================
const COURSE = {
  course: "IT",
  message: "Hello Workers",
  name: "情報技術科（架空）",
  description: "Webの仕組みから、クラウドへの公開までを学ぶ架空の学科です。",
  years: 2,
  subjects: ["HTML / CSS", "JavaScript", "Git / GitHub", "Cloudflare Pages / Workers"],
  status: "稼働中"
};

const EVENTS = [
  { id: 1, date: "2026-10-17", title: "オープンキャンパス", place: "本館 3F 実習室" },
  { id: 2, date: "2026-11-07", title: "Webアプリ作品発表会", place: "講堂" },
  { id: 3, date: "2026-12-05", title: "Cloudflare Workers 体験講座", place: "オンライン" },
  { id: 4, date: "2027-02-20", title: "卒業制作展", place: "本館 1F ギャラリー" }
];

const FORTUNES = [
  { fortune: "大吉", message: "書いたコードが一度で動く日。どんどん試そう。" },
  { fortune: "中吉", message: "小さくコミットすると良いことがあります。" },
  { fortune: "小吉", message: "エラーメッセージの中にヒントがあります。" },
  { fortune: "吉", message: "カンマと引用符をもう一度見直してみよう。" },
  { fortune: "末吉", message: "焦らず、ローカルで確認してからプッシュしよう。" },
  { fortune: "凶", message: "今日はURLの打ち間違いに注意。落ち着けば大丈夫。" }
];

// ============================================================
// Worker の入口
// ============================================================
export default {
  async fetch(request) {
    try {
      // await を付けておくと、将来 handleRequest を async にしても例外をここで捕まえられる
      return await handleRequest(request);
    } catch (error) {
      // ログにも個人情報や入力値は出さない。レスポンスに内部情報（スタック等）は返さない。
      console.error("Unhandled error:", error instanceof Error ? error.name : "UnknownError");
      return jsonResponse(
        request,
        { error: "サーバーでエラーが発生しました。時間をおいて再度お試しください。" },
        500
      );
    }
  }
};

// ============================================================
// ルーティング（URLのpathnameで処理を分ける）
// ============================================================
function handleRequest(request) {
  const url = new URL(request.url);

  // 許可していないオリジン（別サイト）からの呼び出しは拒否する
  const origin = request.headers.get("Origin");
  if (origin !== null && !isAllowedOrigin(origin)) {
    return jsonResponse(request, { error: "このオリジンからのアクセスは許可されていません。" }, 403);
  }

  // ブラウザが送るプリフライト（事前確認）リクエスト
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(request) });
  }

  // このAPIは読み取り専用なので GET / HEAD だけ受け付ける
  if (request.method !== "GET" && request.method !== "HEAD") {
    return jsonResponse(
      request,
      { error: "このメソッドは使えません。GETでアクセスしてください。" },
      405,
      { allow: "GET, HEAD, OPTIONS" }
    );
  }

  // 末尾のスラッシュは取り除いて判定する（/api/course/ も /api/course として扱う）
  const path = url.pathname.length > 1 ? url.pathname.replace(/\/+$/, "") : url.pathname;

  switch (path) {
    case "/":
    case "/api":
      return handleIndex(request);
    case "/api/course":
      return jsonResponse(request, COURSE);
    case "/api/hello":
      return handleHello(request, url);
    case "/api/fortune":
      return handleFortune(request);
    case "/api/events":
      return jsonResponse(request, { count: EVENTS.length, events: EVENTS });
    default:
      return jsonResponse(request, { error: "ページが見つかりません。URLを確認してください。" }, 404);
  }
}

// ============================================================
// 各エンドポイントの処理
// ============================================================

// GET / , GET /api
function handleIndex(request) {
  return jsonResponse(request, {
    name: "backend",
    status: "稼働中",
    message: "学科紹介APIは正常に動いています。",
    endpoints: [
      { path: "/api/course", description: "学科紹介（架空データ）" },
      { path: "/api/hello?name=山田", description: "時間帯に合わせた名前付き挨拶" },
      { path: "/api/fortune", description: "おみくじ" },
      { path: "/api/events", description: "イベント一覧" }
    ]
  });
}

// GET /api/hello , GET /api/hello?name=山田
function handleHello(request, url) {
  const hour = getJapanHour();
  const greeting = getGreeting(hour);

  // name パラメーターがそもそも無い場合は、名前なしの挨拶を返す
  if (!url.searchParams.has("name")) {
    return jsonResponse(request, {
      message: `${greeting}、Workers！`,
      greeting,
      hour,
      timeZone: "Asia/Tokyo"
    });
  }

  // name パラメーターがある場合は、長さと形式をチェックする
  const name = url.searchParams.get("name").trim();

  if (name === "") {
    return jsonResponse(request, { error: "name を入力してください。" }, 400);
  }
  if ([...name].length > NAME_MAX_LENGTH) {
    return jsonResponse(request, { error: `name は${NAME_MAX_LENGTH}文字以内で入力してください。` }, 400);
  }
  if (/[\u0000-\u001F\u007F]/.test(name)) {
    return jsonResponse(request, { error: "name に使えない文字が含まれています。" }, 400);
  }

  return jsonResponse(request, {
    message: `${name}さん、${greeting}！`,
    name,
    greeting,
    hour,
    timeZone: "Asia/Tokyo"
  });
}

// GET /api/fortune
function handleFortune(request) {
  const index = Math.floor(Math.random() * FORTUNES.length);
  const picked = FORTUNES[index];

  return jsonResponse(request, {
    fortune: picked.fortune,
    message: picked.message,
    date: getJapanDateString()
  });
}

// ============================================================
// 時刻まわり（Workers は UTC で動くため、日本時間 = UTC+9 に変換する）
// ============================================================
function getJapanTime() {
  return new Date(Date.now() + 9 * 60 * 60 * 1000);
}

function getJapanHour() {
  return getJapanTime().getUTCHours();
}

function getJapanDateString() {
  return getJapanTime().toISOString().slice(0, 10); // 例: "2026-09-10"
}

function getGreeting(hour) {
  if (hour >= 5 && hour < 11) {
    return "おはようございます";
  }
  if (hour >= 11 && hour < 18) {
    return "こんにちは";
  }
  return "こんばんは";
}

// ============================================================
// レスポンス作成（JSON + CORS ヘッダー）
// ============================================================
function jsonResponse(request, data, status = 200, extraHeaders = {}) {
  return Response.json(data, {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
      ...corsHeaders(request),
      ...extraHeaders
    }
  });
}

function isAllowedOrigin(origin) {
  return ALLOWED_ORIGINS.includes("*") || ALLOWED_ORIGINS.includes(origin);
}

function corsHeaders(request) {
  const headers = {
    "access-control-allow-methods": "GET, HEAD, OPTIONS",
    "access-control-allow-headers": "Content-Type",
    "access-control-max-age": "86400"
  };

  if (ALLOWED_ORIGINS.includes("*")) {
    headers["access-control-allow-origin"] = "*";
    return headers;
  }

  // オリジンを限定している場合は、許可リストにあるオリジンだけを返す
  const origin = request.headers.get("Origin");
  if (origin !== null && ALLOWED_ORIGINS.includes(origin)) {
    headers["access-control-allow-origin"] = origin;
  }
  headers["vary"] = "Origin";
  return headers;
}
