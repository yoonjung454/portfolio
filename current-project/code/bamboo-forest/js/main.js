// ES 모듈을 쓰지 않는 평범한 전역 스크립트다 — file://로 더블클릭해서 열어도 되도록.
// index.html에서 supabaseClient.js, forest.js가 이 스크립트보다 먼저 로드되어
// window.BambooForest에 backend/Forest를 채워둔 상태여야 한다.
const { backend, Forest } = window.BambooForest;

const POLL_INTERVAL_MS = 6000;
const SUBMIT_COOLDOWN_MS = 1500; // 연속 제출 자체는 막지 않고, 실수로 중복 클릭되는 것만 방지

const canvas = document.getElementById("scene");
const hint = document.getElementById("ambient-hint");
const configBadge = document.getElementById("config-badge");
const activeCountEl = document.getElementById("active-count");

const loadingOverlay = document.getElementById("loading-overlay");
const loadingText = document.getElementById("loading-text");

const wrapper = document.querySelector(".composer-wrapper");
const fab = document.getElementById("composer-fab");
const form = document.getElementById("release-form");
const input = document.getElementById("release-input");
const button = document.getElementById("release-button");
const status = document.getElementById("release-status");

const seenIds = new Set();
let lastSeenISO = backend.windowStartISO();
let cooldownUntil = 0;

function setStatus(text, visible) {
  status.textContent = text || "";
  status.classList.toggle("visible", !!visible && !!text);
}

function openComposer() {
  wrapper.classList.add("open");
  input.focus();
}
function closeComposer() {
  wrapper.classList.remove("open");
}

fab.addEventListener("click", () => {
  if (wrapper.classList.contains("open")) closeComposer();
  else openComposer();
});

document.addEventListener("click", (e) => {
  if (!wrapper.contains(e.target) && wrapper.classList.contains("open")) {
    closeComposer();
  }
});

input.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    form.requestSubmit();
  }
});

input.addEventListener("input", () => {
  input.style.height = "auto";
  input.style.height = Math.min(70, input.scrollHeight) + "px";
});

async function handleSubmit(e) {
  e.preventDefault();
  const text = input.value.trim();
  if (!text) return;

  const now = Date.now();
  if (now < cooldownUntil) {
    const remain = Math.ceil((cooldownUntil - now) / 1000);
    setStatus(`숲이 마음을 정리하는 중이에요... ${remain}초만 기다려주세요`, true);
    return;
  }

  button.disabled = true;
  try {
    const row = await backend.submit(text.slice(0, backend.maxLength));
    seenIds.add(row.id);
    forest.spawnWorry(row);
    input.value = "";
    input.style.height = "auto";
    closeComposer();
    cooldownUntil = Date.now() + SUBMIT_COOLDOWN_MS;
    setStatus("놓아주었어요 🍃", true);
    setTimeout(() => setStatus("", false), 2200);
  } catch (err) {
    console.error("[대나무숲] 등록 실패:", err);
    setStatus("잠시 후 다시 시도해주세요", true);
    setTimeout(() => setStatus("", false), 2500);
  } finally {
    button.disabled = false;
  }
}
form.addEventListener("submit", handleSubmit);

// ---------- 안내 문구 자동 숨김 ----------
setTimeout(() => hint.classList.add("faded"), 6000);

// ---------- Supabase 설정 여부 배지 ----------
if (!backend.isConfigured) {
  configBadge.hidden = false;
}

// ---------- 숲 초기화 ----------
const forest = new Forest(canvas);
forest.start();

// Gaegu 폰트가 아직 로딩 중이어도 렌더 루프는 즉시 시작한다 (fonts.ready를 기다리면
// 네트워크 상태에 따라 무한정 대기하며 화면이 완전히 안 그려지는 문제가 생길 수 있음).
// 폰트는 로딩되는 대로 다음 프레임부터 자연스럽게 반영된다.

// ---------- 초기 로드 + 폴링 (실시간 구독 대신 주기적으로 다시 읽어옴) ----------
async function loadInitial() {
  const rows = await backend.fetchSince(lastSeenISO);
  for (const row of rows) {
    if (seenIds.has(row.id)) continue;
    seenIds.add(row.id);
    forest.spawnWorry(row);
  }
  if (rows.length) lastSeenISO = rows[rows.length - 1].created_at;
}

async function pollNew() {
  const rows = await backend.fetchSince(lastSeenISO);
  for (const row of rows) {
    if (seenIds.has(row.id)) continue;
    seenIds.add(row.id);
    forest.spawnWorry(row);
  }
  if (rows.length) lastSeenISO = rows[rows.length - 1].created_at;
}

// ---------- 로딩 오버레이 ----------
// 초기 데이터를 불러오는 동안 "로딩중"임을 알리고, 너무 오래 걸리면 문구를 바꿔준다.
// 네트워크가 완전히 멈춰버리는 최악의 경우에도 화면이 영영 가려지지 않도록 강제 해제 시간을 둔다.
let overlayHidden = false;
function hideLoadingOverlay() {
  if (overlayHidden) return;
  overlayHidden = true;
  loadingOverlay.classList.add("hidden");
}
const slowNoticeTimer = setTimeout(() => {
  if (!overlayHidden) loadingText.textContent = "로딩이 조금 길어지고 있어요...";
}, 4000);
const forceHideTimer = setTimeout(() => {
  if (!overlayHidden) {
    console.warn("[대나무숲] 초기 로드가 너무 오래 걸려 로딩 화면을 강제로 닫습니다.");
    hideLoadingOverlay();
  }
}, 12000);

loadInitial()
  .catch((err) => console.error("[대나무숲] 초기 로드 실패:", err))
  .finally(() => {
    clearTimeout(slowNoticeTimer);
    clearTimeout(forceHideTimer);
    hideLoadingOverlay();
  });

setInterval(pollNew, POLL_INTERVAL_MS);

// ---------- 활성 개수 표시 ----------
setInterval(() => {
  const n = forest.getActiveCount();
  activeCountEl.textContent = n > 0 ? `숲에 머무는 마음 ${n}개` : "";
}, 1000);
