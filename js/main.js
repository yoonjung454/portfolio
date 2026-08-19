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
  initProjectFullScreenJump();
  initProjectNavbarHide();
  initProjectCalendar();
  initSkillsRadar();
  initExperienceWheel();
  initSectionBgRobot('aboutBgRobot', 'about');
  initSectionBgRobot('contactBgRobot', 'contact');
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
function initProjectNavbarHide() {
  const navbar = document.getElementById('navbar');
  const projectSection = document.getElementById('current-project');

  if (!navbar || !projectSection) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {

      if (entry.isIntersecting && entry.intersectionRatio >= 0.35) {
        navbar.classList.add('is-project-hidden');
      } else {
        navbar.classList.remove('is-project-hidden');
      }

    });
  }, {
    threshold: [0, 0.35, 0.6, 1]
  });

  observer.observe(projectSection);
}
function initProjectFullScreenJump() {
  const projectLinks = document.querySelectorAll('a[href="#current-project"]');
  const projectSection = document.getElementById('current-project');

  if (!projectLinks.length || !projectSection) return;

  projectLinks.forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();

      window.scrollTo({
        top: projectSection.offsetTop,
        behavior: 'smooth'
      });
    });
  });
}
/* ---------------------------------------------------------
   4) Projects — 진행 중 + 완료 프로젝트 통합 캘린더 타임라인
   원래 있던 "Current Project"의 날짜별 실습 기록과 "Project Archive"의
   폴더별 완료 프로젝트를, 하나의 맥 창 스타일 달력 안에서 함께 보여준다.
   왼쪽에서 카테고리/연도/월로 필터링하고, 가운데 타임라인에서 날짜를 고르면
   오른쪽에 그날 활성 상태였던 프로젝트 카드가 쌓여서 나타난다.
--------------------------------------------------------- */
function initProjectCalendar() {
  const categoryList = document.getElementById('categoryList');
  const yearList = document.getElementById('yearList');
  const monthList = document.getElementById('monthList');
  const timelineMonthTitle = document.getElementById('timelineMonthTitle');
  const todayButton = document.getElementById('todayButton');
  const timelineScroll = document.getElementById('timelineScroll');
  const timelineDays = document.getElementById('timelineDays');
  const timelineEvents = document.getElementById('timelineEvents');
  const timelineCursor = document.getElementById('timelineCursor');
  const selectedDateLabel = document.getElementById('selectedDateLabel');
  const nowProjects = document.getElementById('nowProjects');
  if (!categoryList || !yearList || !monthList || !timelineDays || !nowProjects) return;

  /* ----- 데이터: 원래 Current Project(피지컬AI 일경험) + Project Archive(공정실습·
     산학공동연구·소모임·진로멘토링)에 있던 내용을 그대로 옮겨온 것 ----- */
  const PROJECTS = {
    'physical-ai': {
      name: '피지컬AI 일경험 프로젝트', category: 'experience',
      tech: ['HTML', 'CSS', 'JavaScript', 'Python']
    },
    'process-practicum': {
      name: '공정실습', category: 'academic',
      tech: ['반도체 공정 실습 장비', '보고서 작성']
    },
    'industry-academia': {
      name: '산학공동연구', category: 'academic',
      tech: ['CAN 통신', '차량 제어 패널 설계/테스트 툴']
    },
    club: {
      name: '소모임', category: 'personal',
      tech: []
    },
    mentoring: {
      name: '진로멘토링 3회차', category: 'experience',
      tech: ['Adobe Premiere Pro']
    }
  };

  // 카테고리: 학교 수업/실습 관련(ACADEMIC), 개인 활동(PERSONAL), 대외 경험 프로그램(EXPERIENCE)
  const CATEGORIES = {
    academic: { label: 'ACADEMIC', color: '#5E8CE6' },
    personal: { label: 'PERSONAL', color: '#A78BFA' },
    experience: { label: 'EXPERIENCE', color: '#64B5A7' }
  };
  const CATEGORY_ORDER = ['academic', 'personal', 'experience'];

  // 프로젝트 고유의 색을 따로 갖게 하지 않고, 소속 카테고리 색을 그대로 물려받게 한다 —
  // 그래야 카테고리 체크박스뿐 아니라 타임라인 바·카드 포인트·관련 자료 목록까지
  // "이 프로젝트는 어느 카테고리인지"가 항상 같은 색으로 일관되게 보인다.
  // soft는 그 색을 옅게 깐 배경용(예: 타임라인 바 채우기)으로, 카테고리 색에서 자동으로 계산한다.
  function hexToRgba(hex, alpha) {
    const n = parseInt(hex.slice(1), 16);
    return 'rgba(' + [(n >> 16) & 255, (n >> 8) & 255, n & 255].join(', ') + ', ' + alpha + ')';
  }
  Object.keys(PROJECTS).forEach((key) => {
    const proj = PROJECTS[key];
    const catColor = CATEGORIES[proj.category].color;
    proj.color = catColor;
    proj.soft = hexToRgba(catColor, 0.16);
  });
  const MONTHS = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];

  const LOGS = [
    {
      key: 'physical-ai', status: 'in-progress',
      startYear: 2026, startMonth: 8, startDay: 4, endYear: null, endMonth: null,
      org: '미래내일 일경험 · 청년 피지컬AI 1기',
      generalDesc: '웹 프론트엔드부터 파이썬까지, 단계별 실습으로 채워가는 청년 일경험형 교육 프로그램',
      days: [
        { day: 4, title: 'HTML 마크업 실습 (폼, 테이블, 회원가입 페이지)',
          related: [{ label: '회원가입 폼 실습 (HTML 테이블·폼)', href: 'current-project/code/day1-signup/index.html' }] },
        { day: 5, title: 'CSS 스타일링 실습 (내부 스타일시트, 이력서 페이지 제작)',
          images: ['current-project/images/day3-resume-result.png'],
          related: [
            { label: '이력서 작성 실습 (HTML 테이블·폼)', href: 'current-project/code/day3-resume/index.html' },
            { label: '실습 결과 캡처 — 이력서 페이지', href: 'current-project/images/day3-resume-result.png' }
          ] },
        { day: 6, title: 'JavaScript 기초(연산자·조건문·반복문) 학습, 프로필 카드 페이지 제작',
          images: ['current-project/images/day4-profilecard-result.png'],
          related: [
            { label: '프로필 카드 페이지 실습 (HTML/CSS)', href: 'current-project/code/day4-profilecard/index.html' },
            { label: '실습 결과 캡처 — 프로필 카드 페이지', href: 'current-project/images/day4-profilecard-result.png' }
          ] },
        { day: 7, title: '개인 기획서(STUDY.OS) 작성, AI 도구 트렌드 조사 보고서 작성',
          related: [
            { label: '개인 기획서 — STUDY.OS 프로젝트 계획서', href: 'https://github.com/yoonjung454/portfolio/blob/main/current-project/docs/STUDY.OS_프로젝트계획서.md' },
            { label: 'AI 도구 트렌드 조사 보고서', href: 'https://github.com/yoonjung454/portfolio/blob/main/current-project/docs/AI도구_트렌드_보고서.md' }
          ] },
        { day: 10, title: 'Python 기초 문법 학습 시작 (변수, 자료형, 연산자)',
          related: [{ label: 'Python 기초 문법 노트북 (변수 · 자료형 · 연산자)', href: 'https://github.com/yoonjung454/portfolio/blob/main/current-project/code/notebooks/0810_python-basics.ipynb' }] },
        { day: 11, title: 'Python 조건문 · 반복문 실습',
          related: [{ label: 'Python 조건문 · 반복문 노트북', href: 'https://github.com/yoonjung454/portfolio/blob/main/current-project/code/notebooks/0811_control-flow.ipynb' }] },
        { day: 13, title: '1주차 출석 확인서류 제출, 실습 자료 정리', related: null },
        { day: 14, title: '개인 포트폴리오 사이트 만들기',
          images: [
            'current-project/images/day14/portfolio-site-1.png',
            'current-project/images/day14/portfolio-site-2.png',
            'current-project/images/day14/portfolio-site-3.png'
          ],
          related: [{ label: '개인 포트폴리오 사이트 (지금 만들고 있는 이 사이트)', href: 'https://github.com/yoonjung454/portfolio' }] },
        { day: 18, title: '미니 장바구니 웹앱 제작 (FastAPI + SQLite 백엔드, Next.js 프론트엔드)',
          images: ['current-project/images/day18-mini-cart-result.png'],
          related: [
            { label: '미니 장바구니 프로젝트 코드', href: 'https://github.com/yoonjung454/portfolio/tree/main/current-project/code/Day11' },
            { label: '실습 결과 캡처 — 미니 장바구니 화면', href: 'current-project/images/day18-mini-cart-result.png' }
          ] },
        { day: 19, title: 'apiapp2 vs app.py 비교분석 — 날씨·대기질 API 연습 코드와 완성본 비교',
          related: [
            { label: '외출 판정 도구 코드 (지오코딩 + 날씨/대기질 동시 요청, 스레드·타임아웃 처리)', href: 'https://github.com/yoonjung454/portfolio/blob/main/current-project/code/2026-08-19/app.py' },
            { label: 'API 연습 코드 모음 (날씨/대기질 API 호출 단계별 실습)', href: 'https://github.com/yoonjung454/portfolio/tree/main/current-project/code/2026-08-19/apiapp2' },
            { label: 'app.py와 손코딩으로 작성한 내용 비교분석', href: 'https://github.com/yoonjung454/portfolio/blob/main/current-project/code/2026-08-19/app.py와 손코딩으로 작성한 내용 비교분석.md' }
          ] },
        { day: 19, title: '대나무숲 웹사이트 제작 (Matter.js 인터랙티브 + Supabase 연동)',
          images: [
            'current-project/images/supabase연동/SQL_editor.png',
            'current-project/images/supabase연동/table_editor.png',
            'current-project/images/supabase연동/testSQL_editor.png'
          ],
          related: [
            { label: '대나무숲 웹사이트 코드', href: 'https://github.com/yoonjung454/portfolio/tree/main/current-project/code/2026-08-19/bamboo-forest' },
            { label: 'Supabase 연동 (SQL 스키마 + RLS 정책)', href: 'https://github.com/yoonjung454/portfolio/blob/main/current-project/code/2026-08-19/bamboo-forest/supabase/schema.sql' }
          ] }
      ]
    },
    {
      key: 'process-practicum', status: 'done',
      startYear: 2026, startMonth: 5, endYear: 2026, endMonth: 6,
      desc: '반도체 공정(포토 공정 등) 실습 후 작성한 실험·실습 보고서. 조원들과 함께 실습 진행 및 보고서 공동 작성.',
      related: [
        { label: '반도체 공정 실습 보고서', href: 'archive/process-practicum/semiconductor-process-report.pdf' },
        { label: '포토 공정 실험 보고서', href: 'archive/process-practicum/photo-process-report.pdf' }
      ]
    },
    {
      key: 'industry-academia', status: 'done',
      startYear: 2026, startMonth: 5, endYear: 2026, endMonth: 6,
      desc: '기업 현장 문제 해결을 위한 산학공동연구 프로젝트 — 한성모빌리티와 함께 진행 (2026-1학기). 차량 제어 패널·CAN 통신 관련 프로젝트 참여 및 결과 정리.',
      images: ['archive/industry-academia/panel-result.png'],
      related: [
        { label: '프로젝트 결과보고서', href: 'archive/industry-academia/hansung-mobility-final-report.pdf' },
        { label: '프로젝트 포스터', href: 'archive/industry-academia/hansung-mobility-poster.pdf' }
      ]
    },
    {
      key: 'club', status: 'in-progress',
      startYear: 2026, startMonth: 3, endYear: null, endMonth: null,
      desc: '소모임 활동 기록 (미팅 내용 정리)',
      related: [
        { label: '소모임 소개', href: 'archive/club/club-overview.docx' },
        { label: '소모임 미팅 내용', href: 'archive/club/meeting-notes.docx' }
      ]
    },
    {
      key: 'mentoring', status: 'in-progress',
      startYear: 2025, startMonth: 1, startDay: 13, endYear: 2025, endMonth: 1,
      desc: '진로멘토링 3회차 — 창업가 인터뷰 영상 촬영·편집 프로젝트. 담당 역할: 인터뷰 영상 편집(컷 편집, 색 보정, 자막). 원본 영상 용량이 커서 이 아카이브에는 파일을 올리지 않음 (편집 진행 중).',
      related: null
    }
  ];

  const YEARS = [2025, 2026, 2027];
  const DAY_HEIGHT = 76;

  const now = new Date();
  const TODAY_YEAR = now.getFullYear();
  const TODAY_MONTH = now.getMonth() + 1;
  const TODAY_DAY = now.getDate();

  function pad(n) { return String(n).padStart(2, '0'); }
  function monthIndex(year, month) { return year * 12 + (month - 1); }
  function daysInMonth(year, month) { return new Date(year, month, 0).getDate(); }
  function statusLabel(status) { return status === 'in-progress' ? 'IN PROGRESS' : 'DONE'; }
  function periodLabel(e) {
    const start = e.startYear + '.' + pad(e.startMonth) + (e.startDay ? '.' + pad(e.startDay) : '');
    const end = e.endYear === null
      ? '진행중'
      : e.endYear + '.' + pad(e.endMonth) + (e.endDay ? '.' + pad(e.endDay) : '');
    return start + ' ~ ' + end;
  }
  function expandLog(l) {
    return l.days.map((d) => Object.assign({}, l, d));
  }

  const TODAY_IDX = monthIndex(TODAY_YEAR, TODAY_MONTH);
  const enabledCategories = {};
  CATEGORY_ORDER.forEach((k) => { enabledCategories[k] = true; });

  let selectedYear = TODAY_YEAR, selectedMonth = TODAY_MONTH, selectedDay = TODAY_DAY;

  // 하루 날짜에 실제로 활성인 기록들. days 배열이 없는 로그는 활성 기간 전체를 채우고,
  // days 배열이 있는 로그는 그 날짜와 정확히 일치하는 항목만 낸다.
  function activeEntriesOn(year, month, day) {
    const idx = monthIndex(year, month);
    let out = [];
    LOGS.forEach((l) => {
      if (!enabledCategories[PROJECTS[l.key].category]) return;
      const s = monthIndex(l.startYear, l.startMonth);
      const e = l.endYear === null ? TODAY_IDX : monthIndex(l.endYear, l.endMonth);
      if (idx < s || idx > e) return;
      if (l.endYear === null && idx === TODAY_IDX && day > TODAY_DAY) return; // 진행중이어도 오늘 이후는 없음
      if (l.days) {
        out = out.concat(expandLog(l).filter((entry) => entry.day === day));
      } else {
        out.push(l);
      }
    });
    return out;
  }

  function cardKey(e) { return e.key + '|' + e.startYear + '|' + e.startMonth + '|' + (e.day || 0); }

  function relatedRowsHtml(list) {
    if (!list || !list.length) return '';
    return '<div class="related-list">' + list.map((r) =>
      '<a class="related-row" href="' + r.href + '" target="_blank" rel="noopener">' +
      '<svg aria-hidden="true"><use href="#icon-folder"></use></svg><span>' + r.label + '</span></a>'
    ).join('') + '</div>';
  }

  function renderCard(e) {
    const proj = PROJECTS[e.key];
    const key = cardKey(e);
    // 스크린샷이 여러 장이면(예: 08.14 포트폴리오 사이트 3장) 원래 있던 사진
    // 슬라이드쇼처럼 겹쳐두고 JS가 자동으로 크로스페이드시킨다 (아래 renderProjectsForDate 참고).
    const thumbHtml = (e.images && e.images.length)
      ? '<div class="card-thumb">' + e.images.map((src, i) =>
          '<img src="' + src + '" alt="' + proj.name + ' 관련 이미지 ' + (i + 1) + '" loading="lazy"' + (i === 0 ? ' class="is-active"' : '') + '>'
        ).join('') + '</div>'
      : '';

    if (e.day) {
      const isActualToday = e.startYear === TODAY_YEAR && e.startMonth === TODAY_MONTH && e.day === TODAY_DAY;
      const dayLabel = isActualToday ? '오늘 교육 내용' : '이날의 교육 내용';
      const metaLine = '기간 · ' + periodLabel(e) + (e.org ? '&nbsp;&nbsp;·&nbsp;&nbsp;참여 기관 · ' + e.org : '');
      const dotsHtml = e.days.map((d) =>
        '<button type="button" class="log-dot' + (d.day === e.day ? ' is-active' : '') + '" ' +
        'data-jump-year="' + e.startYear + '" data-jump-month="' + e.startMonth + '" data-jump-day="' + d.day + '"></button>'
      ).join('');
      const firstDay = e.days[0].day, lastDay = e.days[e.days.length - 1].day;

      return '<article class="now-card" data-card-key="' + key + '" data-proj-key="' + e.key + '"><div class="now-card-body">' +
        '<span class="card-status">' + statusLabel(e.status) + '</span>' +
        '<h3 class="card-title">' + proj.name + '</h3>' +
        '<p class="card-meta">' + metaLine + '</p>' +
        '<p class="card-description">' + e.generalDesc + '</p>' +
        '<hr class="card-divider">' +
        thumbHtml +
        '<p class="card-today"><span class="card-today-label">' + dayLabel + '</span>' + e.title + '</p>' +
        '<div class="log-strip">' + dotsHtml + '</div>' +
        '<div class="log-strip-range"><span>' + pad(e.startMonth) + '.' + pad(firstDay) + '</span><span>' + pad(e.startMonth) + '.' + pad(lastDay) + '</span></div>' +
        relatedRowsHtml(e.related) +
      '</div></article>';
    }

    const tech = e.tech || proj.tech;
    return '<article class="now-card" data-card-key="' + key + '" data-proj-key="' + e.key + '"><div class="now-card-body">' +
      '<span class="card-status">' + statusLabel(e.status) + '</span>' +
      '<h3 class="card-title">' + proj.name + '</h3>' +
      '<p class="card-period">' + periodLabel(e) + '</p>' +
      '<p class="card-description">' + e.desc + '</p>' +
      (tech && tech.length ? '<div class="card-tags">' + tech.map((t) => '<span>' + t + '</span>').join('') + '</div>' : '') +
      thumbHtml +
      relatedRowsHtml(e.related) +
    '</div></article>';
  }

  const STACK_STEP = 28; // 뒤 카드의 폴더 탭이 앞 카드 위로 살짝씩 더 보이게 하는 간격(px)

  // 카드 배경(=위쪽 폴더 탭 색)은 카드마다 돌아가며 칠하는 대신, 그 카드가 어떤
  // 프로젝트인지에 맞춰 타임라인 바와 같은 색으로 칠한다. 다른 프로젝트로 전환되면
  // (.now-card의 background-color transition을 통해) 색이 자연스럽게 바뀐다.
  // --card-bg에는 (반투명한 soft가 아니라) 불투명해 보이도록 CSS의 color-mix가 흰색과
  // 섞을 수 있게 프로젝트 고유의 진한 색(proj.color)을 그대로 넣어준다.
  function layoutNowCards() {
    const cards = nowProjects.querySelectorAll('.now-card');
    const total = cards.length;
    // .now-projects 자체가 이제 (.detail-top을 제외한) 남는 세로 공간을 flex:1로
    // 전부 차지하므로, 그 실제 픽셀 높이를 기준으로 카드 높이를 계산한다.
    const containerH = nowProjects.clientHeight;
    cards.forEach((card, pos) => {
      // 카드가 1장뿐이면 뒤에 아무것도 없으니 탭이 보일 여백도 필요 없다(top:0) —
      // 이때 height는 containerH 그대로라 카드가 영역을 꽉 채운다.
      // 카드가 여러 장이면, 맨 앞 카드만 실제 장수만큼 아래로 내려가서 그 위로
      // 뒤 카드들의 탭이 층층이 드러나 보이게 하고, 내려간 만큼 높이를 줄여서
      // 모든 카드의 "아래쪽 끝"이 항상 같은 선(= .now-projects의 바닥)에 맞도록 한다.
      // (그 바닥은 .project-detail의 padding-bottom만큼 바깥 프레임과 이미 떨어져 있어
      // 카드가 프레임 맨 아래에 완전히 붙지는 않는다.)
      const top = (total - 1 - pos) * STACK_STEP;
      const proj = PROJECTS[card.dataset.projKey];
      card.style.top = top + 'px';
      if (containerH > 0) card.style.height = Math.max(containerH - top, 160) + 'px';
      card.style.setProperty('--card-bg', proj.color);
      card.style.setProperty('--card-accent', proj.color);
      card.style.zIndex = String(cards.length - pos);
      card.dataset.front = pos === 0 ? 'true' : 'false';
    });
  }

  // 창 크기가 바뀌면(특히 세로 높이) .now-projects의 실제 높이도 바뀌므로,
  // 카드 높이를 다시 계산해서 항상 화면 높이에 맞게 유지한다.
  let resizeRAF = null;
  window.addEventListener('resize', () => {
    if (resizeRAF) cancelAnimationFrame(resizeRAF);
    resizeRAF = requestAnimationFrame(layoutNowCards);
  });
  function bringCardFront(card) {
    if (card.dataset.front === 'true') return;
    nowProjects.insertBefore(card, nowProjects.firstChild);
    layoutNowCards();
  }

  let thumbTimers = [];
  function clearThumbTimers() {
    thumbTimers.forEach(clearInterval);
    thumbTimers = [];
  }

  function renderProjectsForDate(year, month, day) {
    clearThumbTimers(); // 카드가 다시 그려지기 전에, 이전 날짜의 슬라이드쇼 타이머부터 정리해서 안 쓰는 타이머가 계속 쌓이지 않게 한다
    const active = activeEntriesOn(year, month, day).sort((a, b) => (b.day || 0) - (a.day || 0));
    if (!active.length) {
      nowProjects.innerHTML = '<p class="now-empty">이 날의 기록은 없습니다.</p>';
      return;
    }
    nowProjects.innerHTML = active.map(renderCard).join('');
    nowProjects.querySelectorAll('.now-card').forEach((card) => {
      card.addEventListener('click', () => bringCardFront(card));
    });
    nowProjects.querySelectorAll('.log-dot').forEach((dot) => {
      dot.addEventListener('click', (e) => {
        e.stopPropagation();
        selectDate(Number(dot.dataset.jumpYear), Number(dot.dataset.jumpMonth), Number(dot.dataset.jumpDay));
      });
    });
    // 스크린샷이 여러 장인 썸네일은, 원래 있던 대표 사진 슬라이드쇼처럼 한 장씩 자동으로 크로스페이드된다
    nowProjects.querySelectorAll('.card-thumb').forEach((thumb) => {
      const imgs = Array.from(thumb.querySelectorAll('img'));
      if (imgs.length < 2) return;
      let idx = imgs.findIndex((img) => img.classList.contains('is-active'));
      if (idx < 0) idx = 0;
      thumbTimers.push(setInterval(() => {
        imgs[idx].classList.remove('is-active');
        idx = (idx + 1) % imgs.length;
        imgs[idx].classList.add('is-active');
      }, 1800));
    });
    layoutNowCards();
  }

  function updateTodayCursor(year, month) {
    if (year === TODAY_YEAR && month === TODAY_MONTH) {
      timelineCursor.style.display = 'block';
      timelineCursor.style.top = ((TODAY_DAY - 1) * DAY_HEIGHT + DAY_HEIGHT / 2) + 'px';
    } else {
      timelineCursor.style.display = 'none';
    }
  }

  function selectDate(year, month, day) {
    selectedYear = year; selectedMonth = month; selectedDay = day;
    setActiveButtons();

    timelineDays.querySelectorAll('.timeline-day').forEach((el) => el.classList.remove('is-selected'));
    const row = timelineDays.querySelector('.timeline-day[data-day="' + day + '"]');
    if (row && timelineScroll) {
      row.classList.add('is-selected');
      // row.scrollIntoView()는 이 안(.timeline-scroll)만이 아니라 페이지 전체까지
      // 스크롤시켜서 화면이 위로 확 튀는 문제가 있었다. 그래서 이 작은 내부 스크롤
      // 영역의 scrollTop만 직접 계산해서 옮긴다 — 바깥 페이지는 그대로 둔 채로.
      const target = row.offsetTop - (timelineScroll.clientHeight - row.offsetHeight) / 2;
      timelineScroll.scrollTo({ top: Math.max(0, target), behavior: 'smooth' });
    }

    renderProjectsForDate(year, month, day);
    selectedDateLabel.textContent = new Date(year, month - 1, day).toLocaleString('en', { month: 'long', day: 'numeric', year: 'numeric' });
  }

  function computeProjectSegments(year, month) {
    const idx = monthIndex(year, month);
    const segments = [];

    LOGS.forEach((l) => {
      if (!enabledCategories[PROJECTS[l.key].category]) return;
      const s = monthIndex(l.startYear, l.startMonth);
      const e = l.endYear === null ? TODAY_IDX : monthIndex(l.endYear, l.endMonth);
      if (idx < s || idx > e) return;

      if (l.days) {
        const recorded = l.days.map((d) => d.day);
        const startDay = Math.min.apply(null, recorded);
        const endDay = (l.endYear === null && idx === TODAY_IDX) ? TODAY_DAY : Math.max.apply(null, recorded);
        segments.push({ key: l.key, startDay, endDay, dots: recorded });
      } else {
        const monthEndDay = daysInMonth(year, month);
        const cappedEndDay = (l.endYear === null && idx === TODAY_IDX) ? Math.min(TODAY_DAY, monthEndDay) : monthEndDay;
        segments.push({ key: l.key, startDay: 1, endDay: cappedEndDay, dots: null });
      }
    });

    const order = [];
    segments.slice().sort((a, b) => a.startDay - b.startDay).forEach((seg) => {
      if (order.indexOf(seg.key) === -1) order.push(seg.key);
    });
    segments.forEach((seg) => { seg.col = order.indexOf(seg.key); });
    segments.numCols = order.length;
    return segments;
  }

  const BAR_WIDTH = 56; // 간트차트 느낌의 얇은 바 폭 — 열이 여러 개면 그보다는 좁게 줄어든다

  function renderTimelineEvents(year, month) {
    timelineEvents.innerHTML = '';
    const segments = computeProjectSegments(year, month);
    const numCols = segments.numCols || 1;
    const colLeftExpr = (col) => col + ' * (100% / ' + numCols + ')';
    const barWidthExpr = 'min(' + BAR_WIDTH + 'px, calc(100% / ' + numCols + ' - 8px))';

    segments.forEach((seg) => {
      const proj = PROJECTS[seg.key];

      const block = document.createElement('div');
      block.className = 'event-block';
      block.title = proj.name; // 바 폭이 좁아 이름이 잘릴 수 있어, hover 시 전체 이름을 볼 수 있도록
      block.style.setProperty('--proj-color', proj.color);
      block.style.setProperty('--proj-soft', proj.soft);
      block.style.top = ((seg.startDay - 1) * DAY_HEIGHT + 3) + 'px';
      block.style.height = ((seg.endDay - seg.startDay + 1) * DAY_HEIGHT - 6) + 'px';
      block.style.left = 'calc(' + colLeftExpr(seg.col) + ' + 4px)';
      block.style.width = barWidthExpr;
      block.textContent = proj.name;
      block.addEventListener('click', ((startDay, endDay, y, m) => (e) => {
        e.stopPropagation();
        const rect = e.currentTarget.getBoundingClientRect();
        const frac = (e.clientY - rect.top) / rect.height;
        const day = startDay + Math.floor(frac * (endDay - startDay + 1));
        selectDate(y, m, Math.min(endDay, Math.max(startDay, day)));
      })(seg.startDay, seg.endDay, year, month));
      timelineEvents.appendChild(block);

      if (seg.dots) {
        seg.dots.forEach((day) => {
          const mark = document.createElement('div');
          mark.className = 'event-day-mark';
          mark.title = proj.name;
          mark.style.setProperty('--proj-color', proj.color);
          mark.style.top = ((day - 1) * DAY_HEIGHT + 3) + 'px';
          mark.style.height = (DAY_HEIGHT - 6) + 'px';
          mark.style.left = 'calc(' + colLeftExpr(seg.col) + ' + 4px)';
          mark.style.width = barWidthExpr;
          mark.addEventListener('click', ((y, m, d) => (e) => { e.stopPropagation(); selectDate(y, m, d); })(year, month, day));
          timelineEvents.appendChild(mark);
        });
      }
    });
  }

  function buildTimeline(year, month) {
    timelineDays.innerHTML = '';
    timelineMonthTitle.textContent = new Date(year, month - 1).toLocaleString('en', { month: 'long', year: 'numeric' });

    const totalDays = daysInMonth(year, month);
    for (let day = 1; day <= totalDays; day++) {
      const row = document.createElement('div');
      row.className = 'timeline-day' + (year === TODAY_YEAR && month === TODAY_MONTH && day === TODAY_DAY ? ' is-today' : '');
      row.dataset.day = day;
      const weekday = new Date(year, month - 1, day).toLocaleString('en', { weekday: 'short' });
      row.innerHTML = '<div class="day-label"><strong>' + day + '</strong>' + weekday + '</div><div class="day-content"></div>';
      row.addEventListener('click', ((y, m, d) => () => selectDate(y, m, d))(year, month, day));
      timelineDays.appendChild(row);
    }
    renderTimelineEvents(year, month);
    updateTodayCursor(year, month);
  }

  function renderCategoryList() {
    categoryList.innerHTML = '';
    CATEGORY_ORDER.forEach((key) => {
      const cat = CATEGORIES[key];
      const item = document.createElement('label');
      item.className = 'category-item';
      item.innerHTML =
        '<input type="checkbox" checked data-category="' + key + '">' +
        '<span class="category-swatch" style="--cat-color:' + cat.color + '"></span>' +
        '<span>' + cat.label + '</span>';
      categoryList.appendChild(item);
    });
    categoryList.querySelectorAll('input[type="checkbox"]').forEach((input) => {
      input.addEventListener('change', () => {
        const key = input.dataset.category;
        enabledCategories[key] = input.checked;
        input.closest('.category-item').classList.toggle('is-off', !input.checked);
        buildTimeline(selectedYear, selectedMonth);
        renderProjectsForDate(selectedYear, selectedMonth, selectedDay);
      });
    });
  }

  function renderYearButtons() {
    yearList.innerHTML = '';
    YEARS.forEach((y) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'year-btn'; b.textContent = y;
      b.addEventListener('click', () => {
        selectedYear = y;
        buildTimeline(selectedYear, selectedMonth);
        selectDate(selectedYear, selectedMonth, (y === TODAY_YEAR && selectedMonth === TODAY_MONTH) ? TODAY_DAY : 1);
      });
      yearList.appendChild(b);
    });
  }

  function renderMonthButtons() {
    monthList.innerHTML = '';
    MONTHS.forEach((name, i) => {
      const m = i + 1;
      const b = document.createElement('button');
      b.type = 'button'; b.dataset.month = m; b.textContent = name;
      b.addEventListener('click', () => {
        selectedMonth = m;
        buildTimeline(selectedYear, selectedMonth);
        selectDate(selectedYear, selectedMonth, (selectedYear === TODAY_YEAR && m === TODAY_MONTH) ? TODAY_DAY : 1);
      });
      monthList.appendChild(b);
    });
  }

  function setActiveButtons() {
    yearList.querySelectorAll('.year-btn').forEach((b) => b.classList.toggle('active', Number(b.textContent) === selectedYear));
    monthList.querySelectorAll('button').forEach((b) => b.classList.toggle('active', Number(b.dataset.month) === selectedMonth));
  }

  todayButton?.addEventListener('click', () => {
    selectedYear = TODAY_YEAR; selectedMonth = TODAY_MONTH;
    buildTimeline(selectedYear, selectedMonth);
    selectDate(TODAY_YEAR, TODAY_MONTH, TODAY_DAY);
  });

  // 타임라인/상세 패널 폭 조절 (구분선 드래그)
  (() => {
    const archiveCalendar = document.querySelector('.archive-calendar');
    const resizer = document.getElementById('calendarResizer');
    if (!archiveCalendar || !resizer) return;
    let timelineW = 300;
    let dragging = false, startX = 0, startW = 0;

    function apply() { archiveCalendar.style.setProperty('--timeline-w', timelineW + 'px'); }
    apply();

    resizer.addEventListener('pointerdown', (e) => {
      dragging = true; startX = e.clientX; startW = timelineW;
      resizer.classList.add('is-dragging');
      resizer.setPointerCapture(e.pointerId);
      document.body.style.userSelect = 'none';
    });
    resizer.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      timelineW = Math.min(520, Math.max(220, startW + (e.clientX - startX)));
      apply();
    });
    function endDrag(e) {
      if (!dragging) return;
      dragging = false;
      resizer.classList.remove('is-dragging');
      document.body.style.userSelect = '';
      try { resizer.releasePointerCapture(e.pointerId); } catch (err) {}
    }
    resizer.addEventListener('pointerup', endDrag);
    resizer.addEventListener('pointercancel', endDrag);
  })();

  renderCategoryList();
  renderYearButtons();
  renderMonthButtons();
  buildTimeline(selectedYear, selectedMonth);
  selectDate(selectedYear, selectedMonth, selectedDay);
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

/* ---------------------------------------------------------
   11) 섹션 배경 로봇 (About / Contact)
   해당 섹션에 도달하면 배경에 은은하게 떠오르고, 다른 섹션으로
   넘어가면(위로든 아래로든) 다시 사라진다.
--------------------------------------------------------- */
function initSectionBgRobot(imgId, sectionId) {
  const robot = document.getElementById(imgId);
  const section = document.getElementById(sectionId);
  if (!robot || !section) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      robot.classList.toggle('is-visible', entry.isIntersecting);
    });
  }, { threshold: 0.4 });

  observer.observe(section);
}
