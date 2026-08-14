/* =========================================================
   Portfolio — main.js
   ========================================================= */

document.addEventListener('DOMContentLoaded', () => {
  initIntro();
  initRevealOnScroll();
  initNavActiveState();
  initScrollIndicator();
  initProjectArchive();
  initCurrentProjectLog();
});

/* ---------------------------------------------------------
   0) 첫 진입 인트로 — 암전 → 로봇 등장 → 텍스트 등장 순서로 연출
--------------------------------------------------------- */
function initIntro() {
  const overlay = document.getElementById('introOverlay');
  const homeContent = document.querySelector('.home-content');
  if (!overlay) return;

  // 잠깐 암전을 유지한 뒤 걷어내서 3D 로봇이 먼저 드러나게 한다
  setTimeout(() => {
    overlay.classList.add('is-hidden');
  }, 300);

  // 오버레이가 걷히기 시작하고 조금 지난 뒤에 텍스트가 뒤이어 올라오며 등장
  if (homeContent) {
    setTimeout(() => {
      homeContent.classList.add('is-in');
    }, 900);
  }
}

/* 3D 오브젝트는 Home 섹션 안에 그대로 배치되어 있어서(position: absolute),
   Home을 스크롤해서 벗어나면 Home과 함께 자연스럽게 화면 밖으로 사라진다.
   별도의 JS 도킹/추적 로직은 두지 않는다.
   (마우스에 따른 회전/기울임 역시 Spline 씬 자체가 처리한다.) */

/* ---------------------------------------------------------
   1) 섹션 등장 애니메이션 (IntersectionObserver)
--------------------------------------------------------- */
function initRevealOnScroll() {
  const targets = document.querySelectorAll('.reveal');
  if (!targets.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  targets.forEach((el) => observer.observe(el));
}

/* ---------------------------------------------------------
   2) Navigation 활성화 (IntersectionObserver)
--------------------------------------------------------- */
function initNavActiveState() {
  const sections = document.querySelectorAll('main .section');
  const navLinks = document.querySelectorAll('.nav-link');
  if (!sections.length || !navLinks.length) return;

  const linkFor = (id) => document.querySelector(`.nav-link[data-nav="${id}"]`);

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        navLinks.forEach((link) => link.classList.remove('active'));
        const link = linkFor(entry.target.id);
        if (link) link.classList.add('active');
      }
    });
  }, { rootMargin: '-45% 0px -45% 0px', threshold: 0 });

  sections.forEach((section) => observer.observe(section));
}

/* ---------------------------------------------------------
   3) Scroll indicator 클릭 시 About으로 이동
--------------------------------------------------------- */
function initScrollIndicator() {
  const indicator = document.getElementById('scrollIndicator');
  if (!indicator) return;

  indicator.addEventListener('click', () => {
    document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' });
  });
}

/* ---------------------------------------------------------
   4) Project Archive — hover는 CSS로 처리, 클릭은 여기서 열고/닫기
--------------------------------------------------------- */
function initProjectArchive() {
  const headers = document.querySelectorAll('.project-tab-header');

  headers.forEach((header) => {
    header.addEventListener('click', () => {
      const tab = header.closest('.project-tab');
      const isOpen = tab.classList.contains('is-open');

      // 이미 열려있던 다른 프로젝트는 닫아서 한 번에 하나만 펼쳐지게 한다
      document.querySelectorAll('.project-tab.is-open').forEach((openTab) => {
        if (openTab !== tab) {
          openTab.classList.remove('is-open');
          openTab.querySelector('.project-tab-header').setAttribute('aria-expanded', 'false');
        }
      });

      tab.classList.toggle('is-open', !isOpen);
      header.setAttribute('aria-expanded', String(!isOpen));
    });
  });
}

/* ---------------------------------------------------------
   5) Current Project — 진행 로그 슬라이더 + 연동된 관련 자료
   원본 <ul class="cp-log-list"> 항목을 그대로 데이터로 사용해서,
   슬라이더(바)를 좌우로 움직이면 그 위치에 해당하는 날짜의
   로그 내용이 표시창에 나타난다. 동시에 "관련 자료" 목록도
   각 항목의 data-day 값을 기준으로 그 날짜에 해당하는 것만 남기고 숨긴다.
--------------------------------------------------------- */
function initCurrentProjectLog() {
  const log = document.getElementById('cpLog');
  const slider = document.getElementById('cpLogSlider');
  const list = document.getElementById('cpLogList');
  const displayDate = document.getElementById('cpLogDisplayDate');
  const displayText = document.getElementById('cpLogDisplayText');
  if (!log || !slider || !list || !displayDate || !displayText) return;

  const entries = Array.from(list.querySelectorAll('li'));
  if (!entries.length) return;

  slider.max = String(entries.length - 1);

  const fileItems = Array.from(document.querySelectorAll('#cpFileList > li'));
  const emptyMessage = document.getElementById('cpFilesEmpty');

  const render = (index) => {
    const entry = entries[index];
    if (!entry) return;
    displayDate.textContent = entry.dataset.date || '';
    displayText.textContent = entry.querySelector('.cp-log-text')?.textContent || '';

    // 관련 자료: 이 날짜(index)에 해당하는 항목만 보여주고 나머지는 숨긴다
    let visibleCount = 0;
    fileItems.forEach((item) => {
      const isMatch = item.dataset.day === String(index);
      item.hidden = !isMatch;
      if (isMatch) visibleCount += 1;
    });
    emptyMessage?.classList.toggle('is-visible', visibleCount === 0);
  };

  slider.addEventListener('input', () => render(Number(slider.value)));

  // 로그 목록 자체는 오래된 순(왼→오)으로 두되, 처음 화면에는 가장 최근 항목이 먼저 보이도록
  // 슬라이더를 맨 오른쪽(가장 최근)에서 시작한다.
  const latestIndex = entries.length - 1;
  slider.value = String(latestIndex);
  render(latestIndex);
  log.classList.add('is-enhanced'); // JS가 정상 동작할 때만 슬라이더 UI로 전환
}
