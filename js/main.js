/* =========================================================
   Portfolio — main.js
   ========================================================= */

document.addEventListener('DOMContentLoaded', () => {
  initHomeScrollTransition();
  initRevealOnScroll();
  initNavActiveState();
  initScrollIndicator();
  initProjectArchive();
});

/* ---------------------------------------------------------
   1) Home — scroll transition
   Home을 벗어나며 스크롤할수록 3D 스테이지를 축소 + Fade Out.
   (마우스에 따른 회전/기울임은 Spline 씬 자체가 처리하므로
    여기서는 별도의 tilt 로직을 두지 않는다.)
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
   2) 섹션 등장 애니메이션 (IntersectionObserver)
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
   3) Navigation 활성화 (IntersectionObserver)
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
   4) Scroll indicator 클릭 시 About으로 이동
--------------------------------------------------------- */
function initScrollIndicator() {
  const indicator = document.getElementById('scrollIndicator');
  if (!indicator) return;

  indicator.addEventListener('click', () => {
    document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' });
  });
}

/* ---------------------------------------------------------
   5) Project Archive — hover는 CSS로 처리, 클릭은 여기서 열고/닫기
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
