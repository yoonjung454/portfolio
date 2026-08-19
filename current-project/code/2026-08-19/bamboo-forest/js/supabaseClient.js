// Supabase 연동 레이어.
// config.js에 값이 채워져 있지 않으면 "로컬 전용 모드"로 동작한다 (다른 사람과는 공유되지 않지만
// 사이트 자체는 정상적으로 작동함 — 개발/미리보기 단계에서 유용).
//
// ES 모듈(import/export)을 쓰지 않는 평범한 전역 스크립트다 — file://로 더블클릭해서
// 열어도 CORS에 막히지 않도록 하기 위함. window.BambooForest 네임스페이스에 결과를 담는다.
window.BambooForest = window.BambooForest || {};

(function () {
  const cfg = window.BAMBOO_FOREST_CONFIG || {};
  const { SUPABASE_URL, SUPABASE_ANON_KEY } = cfg;

  const looksConfigured =
    !!SUPABASE_URL &&
    !!SUPABASE_ANON_KEY &&
    !SUPABASE_URL.includes("YOUR-PROJECT-REF") &&
    !SUPABASE_ANON_KEY.includes("YOUR-ANON");

  let client = null;
  if (looksConfigured) {
    try {
      client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    } catch (err) {
      console.error("[대나무숲] Supabase 클라이언트 생성 실패:", err);
    }
  }

  const TABLE = "confessions";
  const MAX_LENGTH = 120;
  const SHARE_WINDOW_MINUTES = 4; // 클라이언트 수명(3분)보다 여유있게

  function localId() {
    return `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  const backend = {
    isConfigured: !!client,
    maxLength: MAX_LENGTH,

    /** 새 고민을 등록한다. 미설정 상태면 로컬에서만 존재하는 임시 row를 만들어 돌려준다. */
    async submit(content) {
      if (!client) {
        return { id: localId(), content, created_at: new Date().toISOString() };
      }
      const { data, error } = await client
        .from(TABLE)
        .insert({ content })
        .select()
        .single();
      if (error) throw error;
      return data;
    },

    /** 주어진 시각 이후에 등록된 고민들을 가져온다. */
    async fetchSince(isoTimestamp) {
      if (!client) return [];
      const { data, error } = await client
        .from(TABLE)
        .select("*")
        .gt("created_at", isoTimestamp)
        .order("created_at", { ascending: true });
      if (error) {
        console.error("[대나무숲] 목록을 불러오지 못했습니다:", error.message);
        return [];
      }
      return data || [];
    },

    /** 폴링 시작점으로 쓸 "지금으로부터 N분 전" ISO 문자열 */
    windowStartISO() {
      return new Date(Date.now() - SHARE_WINDOW_MINUTES * 60 * 1000).toISOString();
    },
  };

  window.BambooForest.backend = backend;
})();
