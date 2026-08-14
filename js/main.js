/* =========================================================
   Portfolio — main.js
   ========================================================= */

document.addEventListener('DOMContentLoaded', () => {
  initIntro();
  initNavDocking();
  initNavDescExpand();
  initRevealOnScroll();
  initNavActiveState();
  initScrollIndicator();
  initProjectArchive();
  initCurrentProjectLog();
  initCurrentProjectCarousel();
  initSkillsRadar();
  initExperienceWheel();
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

/* ---------------------------------------------------------
   0-1) Navigation 바 — Home에서는 아래쪽(어두운 톤)에 떠 있다가,
   스크롤해서 Home을 벗어나면 화면 맨 위로 이동하며 밝은 톤으로 바뀐다.
--------------------------------------------------------- */
function initNavDocking() {
  const navbar = document.getElementById('navbar');
  const home = document.getElementById('home');
  if (!navbar || !home) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      // Home이 화면에 60% 이상 보이는 동안은 "Home 안" 상태, 그 밖은 "도킹" 상태
      navbar.classList.toggle('is-docked', entry.intersectionRatio < 0.6);
    });
  }, { threshold: [0, 0.6, 1] });

  observer.observe(home);
  positionHomeNav();
  window.addEventListener('resize', positionHomeNav);
}

/*
  Home 화면에 있을 때, nav 바가 정확히 태그라인("I build ideas into systems.")과
  Projects 보기 버튼 사이 중간에 오도록 실제 위치를 재서 --home-nav-top으로 넣어준다.
  (화면 크기마다 두 요소 사이 간격이 달라서, 고정된 %값 대신 직접 측정한다)
*/
function positionHomeNav() {
  const navbar = document.getElementById('navbar');
  const tagline = document.querySelector('.home-tagline');
  const cta = document.querySelector('.home-cta');
  if (!navbar || !tagline || !cta) return;

  const taglineRect = tagline.getBoundingClientRect();
  const ctaRect = cta.getBoundingClientRect();
  const midpoint = (taglineRect.bottom + ctaRect.top) / 2;

  navbar.style.setProperty('--home-nav-top', `${midpoint}px`);
}

/* ---------------------------------------------------------
   0-2) 메뉴 클릭 시, 그 메뉴 옆으로 간격이 벌어지며 한국어 설명이 펼쳐진다.
   한 번에 하나만 펼쳐지도록, 다른 메뉴를 클릭하면 이전 것은 접힌다.
--------------------------------------------------------- */
function initNavDescExpand() {
  const links = document.querySelectorAll('.nav-link');
  if (!links.length) return;

  links.forEach((link) => {
    link.addEventListener('click', () => {
      const alreadyExpanded = link.classList.contains('is-expanded');

      links.forEach((other) => other.classList.remove('is-expanded'));

      if (!alreadyExpanded) {
        link.classList.add('is-expanded');
      }
    });
  });
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

   부드러운 움직임을 위해:
   - 트랙 채움(--fill)과 지나온 눈금(is-passed)은 드래그하는 동안 매 프레임 즉시 갱신 (버벅임 없이 손끝을 그대로 따라오도록)
   - 표시창 내용(날짜/배지/텍스트)은 값이 "실제로 바뀔 때"만 짧게 크로스페이드 (드래그 중 매 픽셀마다 깜빡이지 않도록)
--------------------------------------------------------- */
function initCurrentProjectLog() {
  const log = document.getElementById('cpLog');
  const slider = document.getElementById('cpLogSlider');
  const list = document.getElementById('cpLogList');
  const display = document.getElementById('cpLogDisplay');
  const displayDate = document.getElementById('cpLogDisplayDate');
  const displayText = document.getElementById('cpLogDisplayText');
  const badge = document.getElementById('cpLogBadge');
  const ticksBox = document.getElementById('cpLogTicks');
  if (!log || !slider || !list || !display || !displayDate || !displayText) return;

  const entries = Array.from(list.querySelectorAll('li'));
  if (!entries.length) return;

  const latestIndex = entries.length - 1;
  slider.max = String(latestIndex);

  const ticks = ticksBox ? Array.from(ticksBox.querySelectorAll('span')) : [];
  const fileItems = Array.from(document.querySelectorAll('#cpFileList > li'));
  const emptyMessage = document.getElementById('cpFilesEmpty');

  let currentIndex = null;
  let fadeTimer = null;

  // 트랙 채움 + 눈금은 값이 바뀔 때마다 즉시(부드럽게) 갱신 — 드래그의 손맛을 위해 지연 없음
  const updateTrack = (index) => {
    const percent = latestIndex === 0 ? 100 : (index / latestIndex) * 100;
    slider.style.setProperty('--fill', `${percent}%`);
    ticks.forEach((tick, i) => tick.classList.toggle('is-passed', i <= index));
  };

  const updateContent = (index) => {
    const entry = entries[index];
    if (!entry) return;
    displayDate.textContent = entry.dataset.date || '';
    displayText.textContent = entry.querySelector('.cp-log-text')?.textContent || '';

    // 지금 보고 있는 게 최신 기록인지 과거 기록인지 배지로 구분해준다
    if (badge) {
      const isLatest = index === latestIndex;
      badge.textContent = isLatest ? 'NEW' : '과거 기록';
      badge.classList.toggle('is-latest', isLatest);
    }

    // 관련 자료: 이 날짜(index)에 해당하는 항목만 보여주고 나머지는 숨긴다
    let visibleCount = 0;
    fileItems.forEach((item) => {
      const isMatch = item.dataset.day === String(index);
      item.hidden = !isMatch;
      if (isMatch) visibleCount += 1;
    });
    emptyMessage?.classList.toggle('is-visible', visibleCount === 0);
  };

  const render = (index, animate) => {
    updateTrack(index);

    if (index === currentIndex) return;
    currentIndex = index;

    if (!animate) {
      updateContent(index);
      return;
    }

    // 짧게 가라앉듯 사라졌다가, 새 내용으로 바뀐 뒤 다시 떠오르며 나타난다
    clearTimeout(fadeTimer);
    display.classList.add('is-changing');
    fadeTimer = setTimeout(() => {
      updateContent(index);
      display.classList.remove('is-changing');
    }, 160);
  };

  slider.addEventListener('input', () => render(Number(slider.value), true));

  // 로그 목록 자체는 오래된 순(왼→오)으로 두되, 처음 화면에는 가장 최근 항목이 먼저 보이도록
  // 슬라이더를 맨 오른쪽(가장 최근)에서 시작한다.
  slider.value = String(latestIndex);
  render(latestIndex, false);
  log.classList.add('is-enhanced'); // JS가 정상 동작할 때만 슬라이더 UI로 전환
}

/* ---------------------------------------------------------
   6) Current Project — 대표 사진 슬라이드쇼
   여러 장의 사진이 같은 자리에 겹쳐 있다가, 한 장씩 서서히 사라지고
   다음 사진이 떠오르며 자동으로 바뀐다 (CSS opacity 전환 + setInterval).
--------------------------------------------------------- */
function initCurrentProjectCarousel() {
  const photos = Array.from(document.querySelectorAll('#cpPhotoCarousel .cp-photo'));
  if (photos.length < 2) return;

  let index = photos.findIndex((photo) => photo.classList.contains('is-active'));
  if (index < 0) index = 0;

  setInterval(() => {
    photos[index].classList.remove('is-active');
    index = (index + 1) % photos.length;
    photos[index].classList.add('is-active');
  }, 3500);
}

/* ---------------------------------------------------------
   7) Skills — 오각형 능력치 차트
   스크롤해서 화면에 들어오면 도형이 그려지는 애니메이션을 1번만 재생하고,
   각 꼭짓점(축)에 마우스를 올리거나 포커스하면 그 분야에서 실제로 써본
   기술 목록을 말풍선으로 보여준다.
--------------------------------------------------------- */
function initSkillsRadar() {
  const wrap = document.getElementById('skillsRadarWrap');
  if (!wrap) return;

  // 스크롤해서 화면에 들어오면 그려지고, 화면 밖으로 나가면(위로든 아래로든) 다시 지워진다.
  // (스크롤 페이드용 .reveal/.is-visible 클래스와 겹치지 않도록 별도의 .is-drawn 클래스를 쓴다)
  const drawObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      wrap.classList.toggle('is-drawn', entry.isIntersecting);
    });
  }, { threshold: 0.35 });
  drawObserver.observe(wrap);

  // 각 축에 마우스를 올리면(또는 키보드 포커스) 그 분야의 실제 기술 목록을 말풍선으로 표시
  const tooltip = document.getElementById('skillsTooltip');
  const tooltipTitle = document.getElementById('skillsTooltipTitle');
  const tooltipSkills = document.getElementById('skillsTooltipSkills');
  const points = wrap.querySelectorAll('.radar-point');
  if (!tooltip || !tooltipTitle || !tooltipSkills || !points.length) return;

  const showTooltip = (point) => {
    const dot = point.querySelector('.radar-point-dot');
    if (!dot) return;

    tooltipTitle.textContent = point.dataset.title || '';
    tooltipSkills.textContent = point.dataset.skills || '';

    // SVG 점의 실제 화면 좌표를 구해서, 그 바로 위에 말풍선을 띄운다
    const dotRect = dot.getBoundingClientRect();
    const wrapRect = wrap.getBoundingClientRect();
    tooltip.style.left = `${dotRect.left + dotRect.width / 2 - wrapRect.left}px`;
    tooltip.style.top = `${dotRect.top - wrapRect.top}px`;
    tooltip.classList.add('is-visible');
  };

  const hideTooltip = () => tooltip.classList.remove('is-visible');

  points.forEach((point) => {
    point.addEventListener('mouseenter', () => showTooltip(point));
    point.addEventListener('mouseleave', hideTooltip);
    point.addEventListener('focus', () => showTooltip(point));
    point.addEventListener('blur', hideTooltip);
  });
}

/* ---------------------------------------------------------
   10) Experience — 세로 원통 다이얼(Wheel Selector)
   가운데 항목이 가장 크고 선명하고, 위/아래로 멀어질수록 작아지며
   뒤로 말려 들어가듯 보인다. 화살표나 마우스 휠이 아니라, 마우스로
   직접 잡고 드래그해서 원통을 돌리는 방식으로만 회전시킨다.
--------------------------------------------------------- */
function initExperienceWheel() {
  const wheel = document.getElementById('expWheel');
  const list = document.getElementById('expWheelList');
  const visualImage = document.getElementById('expVisualImage');
  const visualEmoji = document.getElementById('expVisualEmoji');
  const visualInfo = document.getElementById('expVisualInfo');
  const visualTitle = document.getElementById('expVisualTitle');
  const visualDate = document.getElementById('expVisualDate');
  const visualDesc = document.getElementById('expVisualDesc');
  if (!wheel || !list || !visualImage) return;

  const items = Array.from(list.querySelectorAll('.exp-wheel-item'));
  const total = items.length;
  if (!total) return;

  let activeIndex = 0;
  let dragOffset = 0; // 드래그하는 동안의 소수 단위 이동량(아직 확정된 칸 이동이 아님)
  let isDragging = false;
  let dragStartY = 0;
  let dragMoved = false;

  const SPACING = 62; // 항목 사이의 세로 간격(px)

  // 각 항목을 중심(활성 항목 + 드래그 중인 소수 오프셋)에서의 거리에 따라
  // 이동/축소/회전/블러시켜서 원통 표면에 감겨 있는 듯한 모습을 만든다.
  function layout(virtualIndex) {
    items.forEach((item, i) => {
      const diff = i - virtualIndex;
      const absDiff = Math.abs(diff);
      const translateY = diff * SPACING;
      const translateX = -Math.pow(absDiff, 1.3) * 5;
      const translateZ = -absDiff * 26;
      const rotateX = Math.max(Math.min(diff * -16, 48), -48);
      const scale = Math.max(1 - absDiff * 0.22, 0.46);
      const opacity = Math.max(1 - absDiff * 0.32, 0.12);
      const blur = Math.min(absDiff * 0.5, 1.6);

      item.style.transform =
        `translateY(calc(-50% + ${translateY}px)) translateX(${translateX}px) translateZ(${translateZ}px) rotateX(${rotateX}deg) scale(${scale})`;
      item.style.opacity = String(opacity);
      item.style.filter = blur ? `blur(${blur}px)` : 'none';
      item.style.zIndex = String(100 - absDiff);
      item.classList.toggle('is-active', Math.round(diff) === 0);
      item.setAttribute('aria-selected', Math.round(diff) === 0 ? 'true' : 'false');
    });
  }

  // 오른쪽 비주얼을 살짝 줄어들며 사라졌다가, 내용이 바뀐 뒤 다시 커지며 나타나는
  // 크로스페이드로 전환한다.
  function updateVisual(item) {
    visualImage.classList.add('is-changing');
    visualInfo.classList.add('is-changing');

    setTimeout(() => {
      visualImage.className = `exp-visual-image exp-visual-image--${item.dataset.index} is-changing`;
      visualEmoji.textContent = item.dataset.emoji || '';
      visualTitle.textContent = item.textContent.trim();
      visualDate.textContent = item.dataset.date || '';
      visualDesc.textContent = item.dataset.desc || '';

      // 강제 리플로우 — is-changing을 곧바로 떼어내도 transition이 다시 걸리도록 함
      void visualImage.offsetWidth;
      visualImage.classList.remove('is-changing');
      visualInfo.classList.remove('is-changing');
    }, 200);
  }

  function goTo(index) {
    const next = Math.max(0, Math.min(total - 1, index));
    wheel.classList.remove('is-dragging');
    layout(next);
    if (next === activeIndex) return;
    activeIndex = next;
    updateVisual(items[activeIndex]);
  }

  // 마우스/터치로 직접 잡고 위아래로 끌면 원통이 그만큼 따라 돌고,
  // 손을 떼는 순간 가장 가까운 항목으로 스냅된다. 손가락을 거의 움직이지 않고 뗐다면
  // (=클릭) 그 항목(회색으로 흐려진 항목 포함)이 바로 중앙으로 온다.
  //
  // 주의: setPointerCapture를 쓰면 이후의 pointerup 이벤트는 실제로 커서 아래 있는
  // <li>가 아니라 이 wheel 엘리먼트로 리타깃되기 때문에, 개별 항목에 click 리스너를
  // 다는 방식은 동작하지 않는다. 그래서 pointerdown 시점에 눌린 항목을 미리 기억해뒀다가
  // pointerup에서 직접 사용한다.
  let pointerDownItem = null;

  function onPointerDown(e) {
    isDragging = true;
    dragMoved = false;
    dragStartY = e.clientY;
    dragOffset = 0;
    pointerDownItem = e.target.closest ? e.target.closest('.exp-wheel-item') : null;
    wheel.classList.add('is-dragging');
    wheel.setPointerCapture?.(e.pointerId);
  }

  function onPointerMove(e) {
    if (!isDragging) return;
    const deltaY = e.clientY - dragStartY;
    if (Math.abs(deltaY) > 4) dragMoved = true;
    const raw = -deltaY / SPACING;
    dragOffset = Math.max(-activeIndex, Math.min(total - 1 - activeIndex, raw));
    layout(activeIndex + dragOffset);
  }

  function onPointerUp() {
    if (!isDragging) return;
    isDragging = false;
    const steps = Math.round(dragOffset);
    dragOffset = 0;

    if (!dragMoved && pointerDownItem) {
      // 거의 움직이지 않고 손을 뗌 = 클릭. 회색으로 흐려진 항목이라도 그 항목을 바로 중앙으로.
      goTo(Number(pointerDownItem.dataset.index));
    } else {
      goTo(activeIndex + steps);
    }
    pointerDownItem = null;
    dragMoved = false;
  }

  wheel.addEventListener('pointerdown', onPointerDown);
  wheel.addEventListener('pointermove', onPointerMove);
  wheel.addEventListener('pointerup', onPointerUp);
  wheel.addEventListener('pointerleave', onPointerUp);
  wheel.addEventListener('pointercancel', onPointerUp);

  // 화살표/휠 없이도 키보드로는 접근할 수 있도록 최소한의 대체 수단만 남겨둔다
  wheel.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') { e.preventDefault(); goTo(activeIndex + 1); }
    if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') { e.preventDefault(); goTo(activeIndex - 1); }
  });

  layout(activeIndex);

  // 처음 화면에 나타날 때도 대표 비주얼이 한 번 살짝 커지며 등장하는 효과를 재생
  visualImage.classList.add('is-changing');
  visualInfo.classList.add('is-changing');
  requestAnimationFrame(() => {
    setTimeout(() => {
      visualImage.classList.remove('is-changing');
      visualInfo.classList.remove('is-changing');
    }, 60);
  });
}
