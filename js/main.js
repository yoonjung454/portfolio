/* =========================================================
   Portfolio — main.js
   ========================================================= */

document.addEventListener('DOMContentLoaded', () => {
  initHomeDocking();
  initRevealOnScroll();
  initNavActiveState();
  initScrollIndicator();
  initProjectArchive();
});

/* ---------------------------------------------------------
   1) Home — 3D 오브젝트 도킹
   Home에 있을 때는 화면 전체를 채우다가, 아래로 스크롤해서
   Home을 벗어나면 우측 하단으로 작게 도킹되어 이후 모든 섹션에서
   계속 옆에 떠 있는 상태를 유지한다 (전체 사이트에 일관된 3D 요소).

   (마우스에 따른 회전/기울임은 Spline 씬 자체가 처리하므로
    여기서는 별도의 tilt 로직을 두지 않는다.)
--------------------------------------------------------- */
function initHomeDocking() {
  const homeSection = document.getElementById('home');
  const stage = document.getElementById('home3dStage');
  if (!homeSection || !stage) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      // Home이 화면에 절반 이상 보이면 풀스크린, 그렇지 않으면 도킹
      stage.classList.toggle('docked', entry.intersectionRatio < 0.5);
    });
  }, { threshold: [0, 0.5, 1] });

  observer.observe(homeSection);
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
