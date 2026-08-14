/* =========================================================
   Portfolio — main.js
   ========================================================= */

document.addEventListener('DOMContentLoaded', () => {
  initHomeParallax();
  initHomeScrollTransition();
  initRevealOnScroll();
  initNavActiveState();
  initScrollIndicator();
  initProjectArchive();
});

/* ---------------------------------------------------------
   1) Home — mouse parallax / tilt
   마우스 위치에 따라 Spline 프레임을 살짝 기울이고,
   주변 floating-tag 요소들을 서로 다른 속도로 움직인다.
--------------------------------------------------------- */
function initHomeParallax() {
  const stage = document.getElementById('home3dStage');
  const splineWrap = document.getElementById('splineWrap');
  const tags = document.querySelectorAll('.floating-tag');
  if (!stage || !splineWrap) return;

  const MAX_TILT = 6; // deg
  const MAX_TAG_MOVE = 26; // px

  stage.addEventListener('mousemove', (e) => {
    const rect = stage.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5; // -0.5 ~ 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5;

    // 중앙 프레임: 마우스 반대 방향으로 살짝 회전 (오른쪽으로 움직이면 오브젝트도 오른쪽으로 도는 느낌)
    const rotateY = x * MAX_TILT * 2;
    const rotateX = -y * MAX_TILT * 2;
    splineWrap.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;

    // 주변 요소: 각자 data-depth 비율만큼 반대 방향으로 이동해서 레이어 깊이감 표현
    tags.forEach((tag) => {
      const depth = parseFloat(tag.dataset.depth) || 0.5;
      const moveX = x * MAX_TAG_MOVE * depth;
      const moveY = y * MAX_TAG_MOVE * depth;
      tag.style.transform = `translate(${moveX}px, ${moveY}px)`;
    });
  });

  stage.addEventListener('mouseleave', () => {
    splineWrap.style.transform = 'rotateX(0deg) rotateY(0deg)';
    tags.forEach((tag) => { tag.style.transform = 'translate(0, 0)'; });
  });
}

/* ---------------------------------------------------------
   2) Home — scroll transition
   Home을 벗어나며 스크롤할수록 3D 스테이지를 축소 + Fade Out.
--------------------------------------------------------- */
function initHomeScrollTransition() {
  const homeSection = document.getElementById('home');
  const stage = document.getElementById('home3dStage');
  if (!homeSection || !stage) return;

  const update = () => {
    const rect = homeSection.getBoundingClientRect();
    const homeHeight = rect.height || window.innerHeight;

    // Home 상단이 화면 위로 올라간 만큼을 0~1 진행률로 변환
    const progress = Math.min(Math.max(-rect.top / (homeHeight * 0.8), 0), 1);

    const scale = 1 - progress * 0.3;
    const opacity = 1 - progress;
    const translateY = progress * 60;

    stage.style.transform = `scale(${scale}) translateY(-${translateY}px)`;
    stage.style.opacity = String(opacity);
  };

  window.addEventListener('scroll', update, { passive: true });
  update();
}

/* ---------------------------------------------------------
   3) 섹션 등장 애니메이션 (IntersectionObserver)
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
   4) Navigation 활성화 (IntersectionObserver)
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
   5) Scroll indicator 클릭 시 About으로 이동
--------------------------------------------------------- */
function initScrollIndicator() {
  const indicator = document.getElementById('scrollIndicator');
  if (!indicator) return;

  indicator.addEventListener('click', () => {
    document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' });
  });
}

/* ---------------------------------------------------------
   6) Project Archive — hover는 CSS로 처리, 클릭은 여기서 열고/닫기
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
