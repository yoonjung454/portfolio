// 대나무숲 장면: 물리 엔진(Matter.js) + 캔버스 렌더링을 모두 관리한다.
// UI(입력창)와는 완전히 분리되어 있고, main.js가 spawnWorry()를 호출해 새 고민을 던져 넣는다.
//
// ES 모듈(import/export)을 쓰지 않는 평범한 전역 스크립트다 — file://로 더블클릭해서
// 열어도 CORS에 막히지 않도록 하기 위함. IIFE로 감싸 내부 변수가 전역을 오염시키지 않게 하고,
// 완성된 Forest 클래스만 window.BambooForest 네임스페이스에 노출한다.
window.BambooForest = window.BambooForest || {};

(function () {
  const { Engine, World, Bodies, Body, Mouse, MouseConstraint, Events, Vector } = Matter;

// 구형 브라우저 대비 roundRect 폴리필
if (!CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
    if (typeof r === "number") r = { tl: r, tr: r, br: r, bl: r };
    this.moveTo(x + r.tl, y);
    this.lineTo(x + w - r.tr, y);
    this.arcTo(x + w, y, x + w, y + r.tr, r.tr);
    this.lineTo(x + w, y + h - r.br);
    this.arcTo(x + w, y + h, x + w - r.br, y + h, r.br);
    this.lineTo(x + r.bl, y + h);
    this.arcTo(x, y + h, x, y + h - r.bl, r.bl);
    this.lineTo(x, y + r.tl);
    this.arcTo(x, y, x + r.tl, y, r.tl);
    return this;
  };
}

// ---------- 튜닝 값 ----------
const PAPER_W = 108;
const PAPER_H = 76;
const FADE_IN_MS = 260;
const FADE_START_MS = 90 * 1000; // 1분 30초부터 서서히 투명해짐
const LIFETIME_MS = 180 * 1000; // 3분이 되면 사라짐
const MAX_ACTIVE = 40;

const STRONG_BAMBOO_SPEED = 7; // 이 이상으로 부딪히면 "강한 충돌"로 인정
const BAMBOO_HIT_COOLDOWN = 380;
const MIN_PAPER_SCALE = 0.5;
const PAPER_SCALE_STEP = 0.87;

const PANDA_STRONG_SPEED = 7.2; // 이 이상으로 부딪히면 넘어짐 (약한 충돌엔 반응하지 않음)
const PANDA_HIT_COOLDOWN = 500;
const FALLEN_DURATION = 1300;
const RECOVER_DURATION = 520;
const EATING_DURATION = 950; // 판다가 고민을 받아서 먹는 데 걸리는 시간

const POND_SOAK_MS = 1500; // 연못에 이만큼 잠겨 있으면 젖어서 사라짐
const DIRT_RATE = 0.00055; // 흙바닥에서 문질러질 때 초당 더러워지는 정도(속도에 비례)

// 판다를 던졌을 때(mode: "thrown") 관련 값
const PANDA_SETTLE_SPEED = 0.5; // 이보다 느려지면 "멈췄다"고 판단
const PANDA_SETTLE_HOLD_MS = 350; // 그 상태가 이만큼 유지되면 돌아가기 시작
const PANDA_MAX_THROWN_MS = 6000; // 아무리 굴러다녀도 이 시간이 지나면 강제로 복귀 시작
const PANDA_WALK_SPEED = 260; // px/초, 원래 자리로 걸어 돌아오는 속도

const PANDA_BLACK = "#2c2a28";

// 마우스로 잡을 수 없는(=배경/장애물) 바디에 붙이는 충돌 카테고리.
// Matter.js의 MouseConstraint는 isStatic 여부와 무관하게 먼저 추가된 바디 순서로 클릭을
// 판정하므로, 대나무/바닥/판다 뒤에 종이가 겹쳐 있으면 카테고리로 걸러주지 않는 한
// 종이 대신 배경이 먼저 잡혀버린다.
const NON_DRAGGABLE_CATEGORY = 0x0002;

// ---------- 유틸 ----------
function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}
function randRange(min, max) {
  return min + Math.random() * (max - min);
}
function hashRand(seed) {
  const x = Math.sin(seed) * 43758.5453123;
  return x - Math.floor(x);
}
function hashString(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h) + 1;
}
function easeOutBack(t) {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  const x = t - 1;
  return 1 + c3 * x * x * x + c1 * x * x;
}
function easeInOutQuad(t) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}
function wrapText(ctx, text, maxWidth) {
  const paragraphs = String(text).split("\n");
  const lines = [];
  for (const para of paragraphs) {
    let current = "";
    for (const ch of para) {
      const test = current + ch;
      if (current && ctx.measureText(test).width > maxWidth) {
        lines.push(current);
        current = ch;
      } else {
        current = test;
      }
    }
    lines.push(current);
  }
  return lines;
}
function drawSparkleStar(ctx, x, y, r, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.beginPath();
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2;
    ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    ctx.lineTo(Math.cos(a + Math.PI / 4) * r * 0.3, Math.sin(a + Math.PI / 4) * r * 0.3);
  }
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
}
function computeOpacity(age) {
  if (age < FADE_IN_MS) return age / FADE_IN_MS;
  if (age >= FADE_START_MS) {
    return Math.max(0, 1 - (age - FADE_START_MS) / (LIFETIME_MS - FADE_START_MS));
  }
  return 1;
}
function pointInEllipse(pos, ellipse) {
  const dx = (pos.x - ellipse.x) / ellipse.rx;
  const dy = (pos.y - ellipse.y) / ellipse.ry;
  return dx * dx + dy * dy <= 1;
}
function hexToRgb(hex) {
  const v = parseInt(hex.slice(1), 16);
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
}
function mixColor(hexA, hexB, t) {
  const a = hexToRgb(hexA);
  const b = hexToRgb(hexB);
  const r = Math.round(a[0] + (b[0] - a[0]) * t);
  const g = Math.round(a[1] + (b[1] - a[1]) * t);
  const bl = Math.round(a[2] + (b[2] - a[2]) * t);
  return `rgb(${r},${g},${bl})`;
}

class Forest {
  constructor(canvasEl) {
    this.canvasEl = canvasEl;
    this.ctx = canvasEl.getContext("2d");

    this.engine = Engine.create();
    this.engine.gravity.y = 1.0;
    this.world = this.engine.world;

    this.activeWorries = [];
    this.particles = [];
    this.messages = [];
    this.bambooStalks = [];
    this.bambooBodies = [];
    this.rocks = [];
    this.grass = [];

    this.panda = {
      x: 0,
      groundY: 0,
      anchorX: 0,
      anchorY: 0,
      scale: 1,
      state: "idle",
      timer: 0,
      fallDir: 1,
      lastHitAt: 0,
      blinkUntil: 0,
      nextBlinkAt: Date.now() + 2000 + Math.random() * 2000,
      gaze: { x: 0, y: 0 },
      // 던지기/복귀 관련 상태
      mode: "anchored", // "anchored" | "thrown" | "returning"
      settleTimer: 0,
      thrownTimer: 0,
      returnFrom: { x: 0, y: 0 },
      returnProgress: 0,
    };

    this.lastTime = 0;
    this._loop = this._loop.bind(this);
    this.handleResize = this.handleResize.bind(this);

    window.addEventListener("resize", this.handleResize);
    this.handleResize();

    this._setupMouse();
    this._setupCollisions();
  }

  // ---------- 초기화 / 리사이즈 ----------
  handleResize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvasEl.width = Math.round(this.width * dpr);
    this.canvasEl.height = Math.round(this.height * dpr);
    this.canvasEl.style.width = this.width + "px";
    this.canvasEl.style.height = this.height + "px";
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Matter.Mouse는 canvas의 실제 버퍼 크기(width/height, dpr배 확대됨)와 화면상
    // 표시 크기(clientWidth/clientHeight)의 비율을 data-pixel-ratio 속성값으로 나눠
    // 좌표를 보정한다. 이 속성을 안 맞춰주면 dpr>1인 화면(대부분의 노트북/모니터)에서
    // 클릭 좌표가 실제 위치와 어긋나 종이를 잡을 수 없게 된다.
    this.canvasEl.setAttribute("data-pixel-ratio", dpr);
    if (this.mouse) this.mouse.pixelRatio = dpr;

    this.groundHeight = clamp(this.height * 0.16, 90, 150);
    this.groundY = this.height - this.groundHeight;

    this._buildScenery();
    this._rebuildBoundaries();
  }

  _buildScenery() {
    // 연못 (좌측 하단)
    const pondRx = Math.min(120, this.width * 0.14);
    this.pond = {
      x: Math.max(90, this.width * 0.13),
      y: this.groundY + this.groundHeight * 0.4,
      rx: pondRx,
      ry: pondRx * 0.4,
    };

    // 돌 몇 개
    this.rocks = [
      { x: this.pond.x + this.pond.rx * 0.9, y: this.groundY + this.groundHeight * 0.7, size: 15, rotation: 0.3 },
      { x: this.pond.x - this.pond.rx * 0.7, y: this.groundY + this.groundHeight * 0.55, size: 10, rotation: -0.2 },
      { x: this.width * 0.55, y: this.groundY + this.groundHeight * 0.75, size: 13, rotation: 0.5 },
    ];

    // 풀 무더기
    const grassCount = Math.round(this.width / 55);
    this.grass = [];
    for (let i = 0; i < grassCount; i++) {
      this.grass.push({
        x: randRange(0, this.width),
        phase: Math.random() * Math.PI * 2,
        h: randRange(6, 16),
        color: Math.random() < 0.5 ? "#8fbf6f" : "#a9d488",
      });
    }

    // 대나무 (판다가 앉아있을 우측 모서리는 비워둠)
    const usableLeft = this.width * 0.08;
    const usableRight = this.width * 0.78;
    const count = clamp(Math.round((usableRight - usableLeft) / 200), 3, 7);
    this.bambooStalks = [];
    for (let i = 0; i < count; i++) {
      const t = count === 1 ? 0.5 : i / (count - 1);
      this.bambooStalks.push({
        x: usableLeft + t * (usableRight - usableLeft) + randRange(-24, 24),
        width: randRange(15, 23),
        segCount: 5 + Math.floor(Math.random() * 3),
        swayPhase: Math.random() * Math.PI * 2,
        swaySpeed: randRange(0.45, 0.9),
      });
    }

    // 판다의 "제자리" 위치 (우측 모서리, 화면 크기에 따라 살짝 스케일)
    this.panda.scale = clamp(this.width / 1100, 0.75, 1.15);
    this.panda.anchorX = this.width - Math.min(130, this.width * 0.13);
    this.panda.anchorY = this.groundY + 6;
    // 던져지거나 돌아가는 중이 아니면(=평소) 제자리 좌표를 바로 반영한다.
    if (this.panda.mode === "anchored") {
      this.panda.x = this.panda.anchorX;
      this.panda.groundY = this.panda.anchorY;
    }
  }

  _rebuildBoundaries() {
    const old = [this.groundBody, this.wallLeft, this.wallRight, ...this.bambooBodies].filter(Boolean);
    if (old.length) World.remove(this.world, old);

    this.groundBody = Bodies.rectangle(
      this.width / 2,
      this.groundY + this.groundHeight / 2 + 20,
      this.width + 200,
      this.groundHeight + 40,
      { isStatic: true, friction: 0.8 }
    );
    this.wallLeft = Bodies.rectangle(-10, this.height / 2, 20, this.height * 2, { isStatic: true, restitution: 0.3 });
    this.wallRight = Bodies.rectangle(this.width + 10, this.height / 2, 20, this.height * 2, {
      isStatic: true,
      restitution: 0.3,
    });

    this.bambooBodies = this.bambooStalks.map((s) => {
      const body = Bodies.rectangle(s.x, this.groundY - 250, s.width, 700, {
        isStatic: true,
        friction: 0.4,
        restitution: 0.5,
      });
      body.isBamboo = true;
      return body;
    });

    // 판다 몸체는 한 번만 만들어 계속 재사용한다 (던져지거나 돌아오는 중에 리사이즈로
    // 사라지지 않도록 — 대신 위치는 매 프레임 _updatePanda에서 관리한다).
    if (!this.pandaBody) {
      const pr = 40 * this.panda.scale;
      this.pandaBody = Bodies.circle(this.panda.anchorX, this.panda.anchorY - 30 * this.panda.scale, pr, {
        // 종이와 같은 이유로 restitution은 낮게 — 안 그러면 던져진 판다가 잡을 때/바닥에서 떨림
        restitution: 0.2,
        friction: 0.6,
        frictionAir: 0.025,
        density: 0.0025,
      });
      this.pandaBody.isPanda = true;
      World.add(this.world, this.pandaBody);
    }

    // 배경 바디들은 마우스로 잡히지 않도록 별도 카테고리 부여 (물리 충돌 자체는 그대로 유지됨).
    // 판다는 일부러 기본 카테고리로 남겨둬서 마우스로 잡아 던질 수 있게 한다.
    for (const b of [this.groundBody, this.wallLeft, this.wallRight, ...this.bambooBodies]) {
      b.collisionFilter.category = NON_DRAGGABLE_CATEGORY;
    }

    World.add(this.world, [this.groundBody, this.wallLeft, this.wallRight, ...this.bambooBodies]);
  }

  _setupMouse() {
    const mouse = Mouse.create(this.canvasEl);
    const mouseConstraint = MouseConstraint.create(this.engine, {
      mouse,
      constraint: { stiffness: 0.15, damping: 0.32, render: { visible: false } },
    });
    // 배경(대나무/바닥)은 마우스로 집을 수 없게 제외 — 종이와 판다만 잡힘
    mouseConstraint.collisionFilter.mask = 0xffffffff & ~NON_DRAGGABLE_CATEGORY;
    World.add(this.world, mouseConstraint);
    this.mouse = mouse;
    this.mouseConstraint = mouseConstraint;

    Events.on(mouseConstraint, "startdrag", (e) => {
      // 판다를 직접 잡으면 "던지기 모드"로 전환 — 이후 물리 법칙을 그대로 따르다가
      // (_updatePanda에서) 멈추면 자동으로 제자리를 향해 걸어서 돌아간다.
      if (e.body === this.pandaBody) {
        this.panda.mode = "thrown";
        this.panda.state = "idle";
      }
    });

    // 잡고 있던 고민을 판다 근처에 살며시 놓으면(=건네주면) 판다가 먹는다.
    // (세게 던져서 부딪히는 것과는 별개 — 그건 collisionStart에서 넘어짐으로 처리)
    Events.on(mouseConstraint, "enddrag", (e) => {
      const body = e.body;
      const worry = body && body.worryRef;
      if (!worry || worry.dissolving) return;
      const mouthX = this.panda.x;
      const mouthY = this.panda.groundY - 30 * this.panda.scale;
      const dist = Math.hypot(body.position.x - mouthX, body.position.y - mouthY);
      const feedRadius = 64 * this.panda.scale;
      if (dist < feedRadius) {
        this._feedToPanda(worry);
      }
    });
  }

  _setupCollisions() {
    Events.on(this.engine, "collisionStart", (evt) => {
      const now = Date.now();
      for (const pair of evt.pairs) {
        this._handlePossibleImpact(pair.bodyA, pair.bodyB, now);
        this._handlePossibleImpact(pair.bodyB, pair.bodyA, now);
      }
    });
  }

  _handlePossibleImpact(a, b, now) {
    const worry = a.worryRef;
    if (!worry || worry.dissolving) return;
    const speed = Vector.magnitude(worry.body.velocity);

    if (b.isBamboo) {
      if (speed > STRONG_BAMBOO_SPEED && now - worry.lastHitAt > BAMBOO_HIT_COOLDOWN) {
        worry.lastHitAt = now;
        worry.hitCount += 1;
        const newScale = Math.max(MIN_PAPER_SCALE, worry.scale * PAPER_SCALE_STEP);
        if (newScale < worry.scale) {
          const factor = newScale / worry.scale;
          Body.scale(worry.body, factor, factor);
          worry.scale = newScale;
        }
        // 부딪힐 때마다 살짝 찌그러진 채로 눌러붙는다 (말풍선이 우그러지는 느낌)
        worry.squashX = Math.max(0.7, worry.squashX * randRange(0.9, 0.97));
        worry.squashY = Math.min(1.35, worry.squashY * randRange(1.03, 1.1));
      }
    } else if (b.isPanda) {
      if (now - this.panda.lastHitAt > PANDA_HIT_COOLDOWN) {
        this.panda.lastHitAt = now;
        this._reactPanda(speed);
      }
    }
  }

  // ---------- 공개 API ----------
  start() {
    requestAnimationFrame(this._loop);
  }

  spawnWorry(row) {
    if (this.activeWorries.length >= MAX_ACTIVE) {
      const oldest = this.activeWorries.shift();
      if (oldest) this._dissolveWorry(oldest, "forest");
    }

    const createdAtMs = row.created_at ? new Date(row.created_at).getTime() : Date.now();
    const x = randRange(this.width * 0.14, this.width * 0.7);
    const y = randRange(-140, -40);
    const angle = randRange(-0.3, 0.3);

    const body = Bodies.rectangle(x, y, PAPER_W, PAPER_H, {
      // restitution을 낮게 유지 — 너무 높으면 바닥에 닿을 때마다 튕기고,
      // 드래그 중엔 "당기는 힘"과 "밀어내는 충돌"이 매 프레임 부딪혀 떨리게(jitter) 된다.
      // 대나무에 세게 던졌을 때 튕겨나가는 손맛은 속도(STRONG_BAMBOO_SPEED) 자체로 충분히 남는다.
      restitution: 0.16,
      friction: 0.6,
      frictionAir: 0.02,
      density: 0.0018,
      angle,
      chamfer: { radius: 5 },
    });

    const worry = {
      id: row.id,
      content: row.content,
      body,
      createdAtMs,
      hitCount: 0,
      scale: 1,
      squashX: 1,
      squashY: 1,
      lastHitAt: 0,
      seed: hashString(String(row.id)),
      dissolving: false,
      opacity: 0,
      dirt: 0,
      wetTimer: 0,
      tailSide: Math.random() < 0.5 ? -1 : 1,
    };
    body.worryRef = worry;

    World.add(this.world, body);
    this.activeWorries.push(worry);
    return worry;
  }

  getActiveCount() {
    return this.activeWorries.length;
  }

  // ---------- 루프 ----------
  _loop(timestamp) {
    if (!this.lastTime) this.lastTime = timestamp;
    let dt = timestamp - this.lastTime;
    this.lastTime = timestamp;
    dt = Math.min(dt, 40);

    // 한 프레임에서 예기치 못한 에러가 나더라도 화면 전체가 멈춰버리지 않도록,
    // 콘솔에만 로그를 남기고 다음 프레임으로 계속 진행한다.
    try {
      Engine.update(this.engine, dt);

      this._updateWorries(dt);
      this._updateParticles(dt);
      this._updateMessages(dt);
      this._updatePanda(dt);

      this._render();
    } catch (err) {
      console.error("[대나무숲] 렌더 루프 에러:", err);
    }

    requestAnimationFrame(this._loop);
  }

  _updateWorries(dt) {
    const now = Date.now();
    const draggedBody = this.mouseConstraint ? this.mouseConstraint.body : null;

    for (let i = this.activeWorries.length - 1; i >= 0; i--) {
      const w = this.activeWorries[i];

      // 판다에게 먹혔거나(_feedToPanda) 다른 이유로 이미 사라짐 처리된 경우 정리만 한다.
      if (w.dissolving) {
        this.activeWorries.splice(i, 1);
        continue;
      }

      const age = now - w.createdAtMs;
      if (age >= LIFETIME_MS) {
        this._dissolveWorry(w, "forest");
        this.activeWorries.splice(i, 1);
        continue;
      }
      w.opacity = computeOpacity(age);

      // 연못에 빠져 있으면 서서히 젖어서 사라진다.
      if (pointInEllipse(w.body.position, this.pond)) {
        w.wetTimer += dt;
        if (w.wetTimer >= POND_SOAK_MS) {
          this._dissolveWorry(w, "pond");
          this.activeWorries.splice(i, 1);
          continue;
        }
      } else if (w.wetTimer > 0) {
        w.wetTimer = Math.max(0, w.wetTimer - dt * 1.5); // 연못 밖으로 나오면 서서히 마름
      }

      if (draggedBody === w.body) {
        // 잡고 있는 채로 흙바닥(대나무숲 바닥)에 문지르면 더러워진다.
        if (w.body.position.y > this.groundY - 6) {
          const speed = Vector.magnitude(w.body.velocity);
          if (speed > 0.3) {
            w.dirt = Math.min(1, w.dirt + dt * DIRT_RATE * speed);
          }
        }

        // 잡은 채로 판다 근처까지 가져가면 — 놓지 않아도 그 자리에서 바로 먹는다.
        const mouthX = this.panda.x;
        const mouthY = this.panda.groundY - 30 * this.panda.scale;
        const dist = Math.hypot(w.body.position.x - mouthX, w.body.position.y - mouthY);
        if (dist < 64 * this.panda.scale) {
          this._feedToPanda(w);
          // 사라진 물체를 계속 붙들고 있지 않도록 마우스 잡기를 강제로 풀어준다.
          this.mouseConstraint.body = null;
          this.mouseConstraint.constraint.bodyB = null;
        }
      }
    }
  }

  _dissolveWorry(w, fate) {
    w.dissolving = true;
    World.remove(this.world, w.body);
    this._spawnDissolveEffect(w.body.position.x, w.body.position.y, fate);
  }

  _spawnDissolveEffect(x, y, fate) {
    if (fate === "pond") {
      const count = 10 + Math.floor(Math.random() * 4);
      for (let i = 0; i < count; i++) {
        const angle = -Math.random() * Math.PI - Math.PI / 4; // 위쪽으로 튀는 물방울
        const speed = 0.5 + Math.random() * 1.1;
        this.particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed * 0.7,
          vy: Math.sin(angle) * speed,
          rotation: 0,
          vr: 0,
          size: 3 + Math.random() * 4,
          life: 0,
          maxLife: 650 + Math.random() * 450,
          type: "droplet",
        });
      }
      this.messages.push({
        x,
        y: y - 30,
        text: "고민이 물에 젖어 사라졌어요",
        life: 0,
        maxLife: 2200,
      });
      return;
    }

    const count = 9 + Math.floor(Math.random() * 5);
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.5 + Math.random() * 1.3;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.1,
        rotation: Math.random() * Math.PI * 2,
        vr: (Math.random() - 0.5) * 0.15,
        size: 4 + Math.random() * 5,
        life: 0,
        maxLife: 1100 + Math.random() * 900,
        type: Math.random() < 0.55 ? "leaf" : "light",
      });
    }
    this.messages.push({
      x,
      y: y - 34,
      text: "이 고민은 숲이 가져갔어요",
      life: 0,
      maxLife: 2300,
    });
  }

  /** 잡고 있던 고민을 판다 근처에 놓으면 호출됨 — 판다가 냠냠 먹는다. */
  _feedToPanda(worry) {
    if (worry.dissolving) return;
    worry.dissolving = true;
    World.remove(this.world, worry.body);

    const mouthX = this.panda.x;
    const mouthY = this.panda.groundY - 24 * this.panda.scale;

    this.panda.state = "eating";
    this.panda.timer = 0;

    for (let i = 0; i < 6; i++) {
      const angle = randRange(0, Math.PI * 2);
      const speed = randRange(0.4, 1.1);
      this.particles.push({
        x: mouthX,
        y: mouthY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 0.6,
        rotation: 0,
        vr: randRange(-0.1, 0.1),
        size: 3 + Math.random() * 3,
        life: 0,
        maxLife: 500 + Math.random() * 300,
        type: "light",
      });
    }
    this.messages.push({
      x: mouthX,
      y: mouthY - 40,
      text: "냠냠, 판다가 먹어버렸어요",
      life: 0,
      maxLife: 1800,
    });
  }

  _updateParticles(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += dt;
      if (p.life >= p.maxLife) {
        this.particles.splice(i, 1);
        continue;
      }
      const step = dt / 16.6;
      if (p.type === "leaf") {
        p.vy += 0.01 * step;
        p.x += (p.vx + Math.sin(p.life / 220)) * step;
        p.y += p.vy * step;
      } else if (p.type === "droplet") {
        p.vy += 0.025 * step; // 물방울은 중력을 받아 다시 떨어짐
        p.x += p.vx * step;
        p.y += p.vy * step;
      } else if (p.type === "heart") {
        p.x += (p.vx + Math.sin(p.life / 200) * 0.3) * step;
        p.y += p.vy * step;
      } else {
        p.vy -= 0.004 * step;
        p.x += p.vx * step;
        p.y += p.vy * step;
      }
      p.rotation += p.vr * step;
    }
  }

  _updateMessages(dt) {
    for (let i = this.messages.length - 1; i >= 0; i--) {
      const m = this.messages[i];
      m.life += dt;
      if (m.life >= m.maxLife) {
        this.messages.splice(i, 1);
        continue;
      }
      m.y -= 0.012 * dt;
    }
  }

  _reactPanda(speed) {
    const p = this.panda;
    if (p.state === "fallen" || p.state === "eating") return;
    if (speed > PANDA_STRONG_SPEED) {
      p.state = "fallen";
      p.timer = 0;
      p.fallDir = Math.random() < 0.5 ? -1 : 1;
    }
    // 살짝 스치는 정도의 약한 충돌에는 반응하지 않는다 (움찔하는 모션 없앰)
  }

  _updatePanda(dt) {
    const p = this.panda;
    p.timer += dt;
    const now = Date.now();

    // ---------- 던지기 / 복귀 상태 머신 ----------
    // 마우스로 잡고 있는 동안은 물리 엔진이 그대로 위치/회전을 몰아가므로 건드리지 않고,
    // 잡고 있지 않을 때만 우리가 위치를 관리한다(제자리 고정 또는 걸어서 복귀).
    const isDraggingPanda = this.mouseConstraint && this.mouseConstraint.body === this.pandaBody;

    if (p.mode === "anchored") {
      if (!isDraggingPanda) {
        // 평소엔 물리 흔들림 없이 제자리에 가만히 앉아있게 매 프레임 고정한다.
        Body.setPosition(this.pandaBody, { x: p.anchorX, y: p.anchorY - 30 * p.scale });
        Body.setVelocity(this.pandaBody, { x: 0, y: 0 });
        Body.setAngle(this.pandaBody, 0);
        Body.setAngularVelocity(this.pandaBody, 0);
        p.x = p.anchorX;
        p.groundY = p.anchorY;
      }
    } else if (p.mode === "thrown") {
      p.x = this.pandaBody.position.x;
      p.groundY = this.pandaBody.position.y + 30 * p.scale;

      if (!isDraggingPanda) {
        const speed = Vector.magnitude(this.pandaBody.velocity);
        p.settleTimer = speed < PANDA_SETTLE_SPEED ? p.settleTimer + dt : 0;
        p.thrownTimer += dt;
        if (p.settleTimer > PANDA_SETTLE_HOLD_MS || p.thrownTimer > PANDA_MAX_THROWN_MS) {
          p.mode = "returning";
          p.settleTimer = 0;
          p.thrownTimer = 0;
          p.returnFrom = { x: p.x, y: p.groundY };
          p.returnProgress = 0;
        }
      }
    } else if (p.mode === "returning") {
      if (isDraggingPanda) {
        // 걸어서 돌아가는 도중에 다시 붙잡으면 즉시 물리(던지기)로 넘긴다
        p.mode = "thrown";
      } else {
        const dist = Math.hypot(p.anchorX - p.returnFrom.x, p.anchorY - p.returnFrom.y);
        const duration = Math.max(400, (dist / PANDA_WALK_SPEED) * 1000);
        p.returnProgress = Math.min(1, p.returnProgress + dt / duration);
        const t = easeInOutQuad(p.returnProgress);
        p.x = p.returnFrom.x + (p.anchorX - p.returnFrom.x) * t;
        p.groundY = p.returnFrom.y + (p.anchorY - p.returnFrom.y) * t;
        Body.setPosition(this.pandaBody, { x: p.x, y: p.groundY - 30 * p.scale });
        Body.setVelocity(this.pandaBody, { x: 0, y: 0 });
        Body.setAngle(this.pandaBody, 0);
        Body.setAngularVelocity(this.pandaBody, 0);
        if (p.returnProgress >= 1) {
          p.mode = "anchored";
        }
      }
    }

    if (isDraggingPanda) {
      // 잡혀서 끌려다니는 중에는 넘어짐/식사 등 스크립트 애니메이션과 겹치지 않게 한다
      p.mode = "thrown";
      if (p.state !== "idle") p.state = "idle";
    }

    if (p.state === "fallen" && p.timer > FALLEN_DURATION) {
      p.state = "recovering";
      p.timer = 0;
    } else if (p.state === "recovering" && p.timer > RECOVER_DURATION) {
      p.state = "idle";
      p.timer = 0;
    } else if (p.state === "eating" && p.timer > EATING_DURATION) {
      p.state = "idle";
      p.timer = 0;
    }

    // 커서(손)를 판다 근처에 가져다 대면 웃으며 하트를 뿜는다.
    // 넘어짐/식사 중이거나, 고민을 잡고 있거나, 판다 자신이 제자리에 없을 때는 방해하지 않는다 —
    // 쓰다듬기는 "평소 앉아있을 때"만 자연스럽다.
    const isHoldingWorry = !!(this.mouseConstraint && this.mouseConstraint.body && this.mouseConstraint.body !== this.pandaBody);
    if (isHoldingWorry && p.state === "petted") {
      // 쓰다듬는 중에 고민을 집어 들면 즉시 원래 표정으로 되돌린다
      p.state = "idle";
    } else if (
      p.mode === "anchored" &&
      !isHoldingWorry &&
      (p.state === "idle" || p.state === "petted")
    ) {
      const mousePos = this.mouse ? this.mouse.position : null;
      const headCx = p.x;
      const headCy = p.groundY - 34 * p.scale;
      const hovering =
        !!mousePos && Math.hypot(mousePos.x - headCx, mousePos.y - headCy) < 58 * p.scale;

      if (hovering && p.state !== "petted") {
        p.state = "petted";
        p.heartTimer = 0;
      } else if (!hovering && p.state === "petted") {
        p.state = "idle";
      }

      if (p.state === "petted") {
        p.heartTimer -= dt;
        if (p.heartTimer <= 0) {
          p.heartTimer = 420 + Math.random() * 200;
          this.particles.push({
            x: headCx + randRange(-14, 14) * p.scale,
            y: headCy - 20 * p.scale,
            vx: randRange(-0.15, 0.15),
            vy: -0.55 - Math.random() * 0.3,
            rotation: 0,
            vr: 0,
            size: 9 + Math.random() * 4,
            life: 0,
            maxLife: 900 + Math.random() * 400,
            type: "heart",
          });
        }
      }
    }

    if (!p.blinkUntil && now > p.nextBlinkAt) {
      p.blinkUntil = now + 140;
    } else if (p.blinkUntil && now > p.blinkUntil) {
      p.blinkUntil = 0;
      p.nextBlinkAt = now + 2200 + Math.random() * 2600;
    }

    const headX = p.x;
    const headY = p.groundY - 40 * p.scale;
    let nearestDx = 0,
      nearestDy = 0,
      nearestDist = 260,
      found = false;
    for (const w of this.activeWorries) {
      const dx = w.body.position.x - headX;
      const dy = w.body.position.y - headY;
      const d = Math.hypot(dx, dy);
      if (d < nearestDist) {
        nearestDist = d;
        nearestDx = dx;
        nearestDy = dy;
        found = true;
      }
    }
    if (found) {
      const mag = Math.max(1, nearestDist);
      p.gaze.x = clamp(nearestDx / mag, -1, 1) * 0.9;
      p.gaze.y = clamp(nearestDy / mag, -1, 1) * 0.9;
    } else {
      p.gaze.x = Math.sin(now / 2200) * 0.3;
      p.gaze.y = Math.cos(now / 2800) * 0.15;
    }
  }

  // ---------- 렌더링 ----------
  _render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);
    this._drawSky(ctx);
    this._drawGround(ctx);
    this._drawPond(ctx);
    this._drawRocks(ctx);
    this._drawGrassTufts(ctx);
    for (const stalk of this.bambooStalks) this._drawBambooStalk(ctx, stalk);
    this._drawPanda(ctx);
    for (const w of this.activeWorries) this._drawBubble(ctx, w);
    this._drawParticles(ctx);
    this._drawMessages(ctx);
  }

  _drawSky(ctx) {
    const grad = ctx.createLinearGradient(0, 0, 0, this.height);
    grad.addColorStop(0, "#fbf6e6");
    grad.addColorStop(0.55, "#f3ecd2");
    grad.addColorStop(1, "#dcebc4");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, this.width, this.height);
  }

  _drawGround(ctx) {
    const grad = ctx.createLinearGradient(0, this.groundY, 0, this.height);
    grad.addColorStop(0, "#c9a87c");
    grad.addColorStop(1, "#8a6240");
    ctx.fillStyle = grad;
    ctx.fillRect(0, this.groundY, this.width, this.height - this.groundY);
  }

  _drawPond(ctx) {
    const p = this.pond;
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(p.x, p.y, p.rx, p.ry, 0, 0, Math.PI * 2);
    const grad = ctx.createRadialGradient(p.x - p.rx * 0.3, p.y - p.ry * 0.3, 4, p.x, p.y, p.rx);
    grad.addColorStop(0, "#eef6e4");
    grad.addColorStop(1, "#cfe8c9");
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = "rgba(140,120,80,0.25)";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = "#8fbf6f";
    ctx.beginPath();
    ctx.ellipse(p.x - p.rx * 0.3, p.y + p.ry * 0.25, 12, 6, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(p.x + p.rx * 0.25, p.y - p.ry * 0.2, 9, 5, -0.3, 0, Math.PI * 2);
    ctx.fill();

    const s = (Math.sin(Date.now() / 900) + 1) / 2;
    ctx.globalAlpha = 0.35 + s * 0.3;
    ctx.beginPath();
    ctx.ellipse(p.x + p.rx * 0.15, p.y - p.ry * 0.4, 5, 2.5, 0.4, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
    ctx.restore();
  }

  _drawRocks(ctx) {
    for (const r of this.rocks) {
      ctx.save();
      ctx.translate(r.x, r.y);
      ctx.rotate(r.rotation);
      ctx.beginPath();
      ctx.ellipse(0, 0, r.size, r.size * 0.72, 0, 0, Math.PI * 2);
      const grad = ctx.createLinearGradient(-r.size, -r.size, r.size, r.size);
      grad.addColorStop(0, "#c9c0ab");
      grad.addColorStop(1, "#9c9078");
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.strokeStyle = "rgba(90,75,55,0.3)";
      ctx.stroke();
      ctx.restore();
    }
  }

  _drawGrassTufts(ctx) {
    const now = Date.now();
    for (const g of this.grass) {
      ctx.save();
      ctx.translate(g.x, this.groundY);
      ctx.strokeStyle = g.color;
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      for (let i = -1; i <= 1; i++) {
        const sway = Math.sin(now / 700 + g.phase + i) * 3;
        ctx.beginPath();
        ctx.moveTo(i * 4, 2);
        ctx.quadraticCurveTo(i * 4 + sway, -g.h * 0.6, i * 4 + sway * 1.4, -(18 + g.h));
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  _drawBambooStalk(ctx, s) {
    const now = Date.now();
    const swayAngle = Math.sin(now / 1000 * s.swaySpeed + s.swayPhase) * 0.035;
    const segLen = 90;
    const totalHeight = s.segCount * segLen;

    ctx.save();
    ctx.translate(s.x, this.groundY + 4);
    ctx.rotate(swayAngle);

    for (let i = 0; i < s.segCount; i++) {
      const yTop = -(i + 1) * segLen;
      const yBottom = -i * segLen;
      const grad = ctx.createLinearGradient(-s.width / 2, 0, s.width / 2, 0);
      grad.addColorStop(0, "#7fb85f");
      grad.addColorStop(0.5, "#a9d488");
      grad.addColorStop(1, "#6fa64f");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(-s.width / 2, yTop, s.width, segLen + 2, 4);
      ctx.fill();

      // 마디
      ctx.fillStyle = "rgba(90, 130, 60, 0.55)";
      ctx.fillRect(-s.width / 2 - 1, yBottom - 4, s.width + 2, 4);
    }

    // 꼭대기 잎
    ctx.fillStyle = "#7fb85f";
    for (let i = 0; i < 3; i++) {
      const a = -0.5 + i * 0.4;
      ctx.save();
      ctx.translate(0, -totalHeight);
      ctx.rotate(a);
      ctx.beginPath();
      ctx.ellipse(0, -18, 6, 20, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    ctx.restore();
  }

  _drawPanda(ctx) {
    const p = this.panda;
    const now = Date.now();
    const walking = p.mode === "returning";
    const flying = p.mode === "thrown" && !(this.mouseConstraint && this.mouseConstraint.body === this.pandaBody);
    const bob = p.state === "idle" && p.mode === "anchored" ? Math.sin(now / 600) * 2.2 : 0;

    ctx.save();
    ctx.translate(p.x, p.groundY + bob);

    let rotation = 0;
    let squashX = 1;
    let squashY = 1;

    if (p.state === "fallen") {
      const t = Math.min(1, p.timer / 260);
      rotation = easeOutBack(t) * (Math.PI / 2) * 0.85 * p.fallDir;
    } else if (p.state === "recovering") {
      const t = Math.min(1, p.timer / RECOVER_DURATION);
      rotation = (1 - easeInOutQuad(t)) * (Math.PI / 2) * 0.85 * p.fallDir;
    } else if (p.state === "eating") {
      const t = Math.min(1, p.timer / EATING_DURATION);
      squashY = 1 - Math.abs(Math.sin(t * Math.PI * 3)) * 0.05;
    }

    // 잡혀서 날아가거나 던져진 채 굴러다니는 동안은 실제 물리 회전을 그대로 반영해
    // 데굴데굴 구르는 느낌을 준다 (제자리/복귀 중엔 회전을 0으로 고정해두므로 영향 없음).
    if (this.pandaBody) rotation += this.pandaBody.angle;

    ctx.rotate(rotation);
    ctx.scale(squashX * p.scale, squashY * p.scale);

    // 그림자
    ctx.beginPath();
    ctx.ellipse(0, 8, 44, 11, 0, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(80,60,30,0.18)";
    ctx.fill();

    // 몸통
    ctx.beginPath();
    ctx.ellipse(0, -34, 40, 38, 0, 0, Math.PI * 2);
    ctx.fillStyle = "#fbfaf5";
    ctx.fill();
    ctx.strokeStyle = "rgba(60,50,35,0.25)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // 귀
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.arc(side * 30, -70, 12, 0, Math.PI * 2);
      ctx.fillStyle = PANDA_BLACK;
      ctx.fill();
    }

    // 팔/다리 (걸어서 돌아가는 중엔 좌우로 번갈아 뒤뚱거림)
    for (const side of [-1, 1]) {
      const waddle = walking ? Math.sin(now / 90 + side * Math.PI) * 4 : 0;
      ctx.beginPath();
      ctx.ellipse(side * 24, 4 + waddle, 12, 9, 0, 0, Math.PI * 2);
      ctx.fillStyle = PANDA_BLACK;
      ctx.fill();
    }

    // 눈 주변 패치
    const eyeY = -40;
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.ellipse(side * 16, eyeY, 11, 14, side * 0.15, 0, Math.PI * 2);
      ctx.fillStyle = PANDA_BLACK;
      ctx.fill();
    }

    // 눈 (붕 날아가는 중엔 살짝 크게 — 놀란 게 아니라 신나서/얼떨결에 그런 표정)
    for (const side of [-1, 1]) {
      const ex = side * 16;
      const ey = eyeY + 1;
      if (p.blinkUntil && !flying) {
        ctx.beginPath();
        ctx.moveTo(ex - 5, ey);
        ctx.lineTo(ex + 5, ey);
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 2;
        ctx.stroke();
        continue;
      }
      const r = flying ? 6.2 : 5;
      ctx.beginPath();
      ctx.arc(ex, ey, r, 0, Math.PI * 2);
      ctx.fillStyle = "#fff";
      ctx.fill();

      const pupilOffset = flying ? 1.6 : 2.6;
      ctx.beginPath();
      ctx.arc(ex + p.gaze.x * pupilOffset, ey + p.gaze.y * pupilOffset, flying ? 2.6 : 2.2, 0, Math.PI * 2);
      ctx.fillStyle = PANDA_BLACK;
      ctx.fill();
    }

    // 코
    ctx.beginPath();
    ctx.ellipse(0, -28, 4, 3, 0, 0, Math.PI * 2);
    ctx.fillStyle = PANDA_BLACK;
    ctx.fill();

    const petted = p.state === "petted";
    const eating = p.state === "eating";

    // 볼 홍조 (쓰다듬어줄 때)
    if (petted) {
      ctx.fillStyle = "rgba(240,140,140,0.45)";
      for (const side of [-1, 1]) {
        ctx.beginPath();
        ctx.ellipse(side * 27, -26, 6, 4, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 입
    if (eating) {
      // 냠냠 씹는 입 (크게 열렸다 닫혔다)
      const t = Math.min(1, p.timer / EATING_DURATION);
      const chew = Math.abs(Math.sin(t * Math.PI * 3));
      ctx.beginPath();
      ctx.ellipse(0, -20, 7, 3 + chew * 8, 0, 0, Math.PI * 2);
      ctx.fillStyle = "#5a4632";
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.moveTo(-6, -22);
      if (petted) {
        ctx.quadraticCurveTo(0, -12, 6, -22); // 활짝 웃는 입
      } else {
        ctx.quadraticCurveTo(0, -18, 6, -22);
      }
      ctx.strokeStyle = "rgba(60,50,35,0.5)";
      ctx.lineWidth = 1.4;
      ctx.stroke();
    }

    ctx.restore();

    // 어질어질 별
    if (p.state === "fallen") {
      const t = p.timer / FALLEN_DURATION;
      for (let i = 0; i < 3; i++) {
        const a = t * 4 + (i * Math.PI * 2) / 3;
        const sx = Math.cos(a) * 26 * p.scale;
        const sy = -95 * p.scale + Math.sin(a) * 8;
        drawSparkleStar(ctx, sx, sy, 6, "#e7c65a");
      }
    }

    ctx.restore();
  }

  _drawBubble(ctx, w) {
    const { body } = w;
    const { x, y } = body.position;
    const angle = body.angle;
    const baseW = PAPER_W * w.scale;
    const baseH = PAPER_H * w.scale;
    // 대나무에 부딪힐 때마다 조금씩 눌리고 찌그러진 채로 굳는다
    const width = baseW * w.squashX;
    const height = baseH * w.squashY;
    const wetProgress = clamp(w.wetTimer / POND_SOAK_MS, 0, 1);
    const dirt = clamp(w.dirt, 0, 1);

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.globalAlpha = clamp(w.opacity, 0, 1);

    ctx.shadowColor = "rgba(20,30,20,0.3)";
    ctx.shadowBlur = 9 * w.scale;
    ctx.shadowOffsetY = 4 * w.scale;

    // 말풍선 몸통 + 아래쪽 꼬리
    const r = Math.min(width, height) * 0.32;
    const tailW = width * 0.22;
    const tailH = height * 0.3;
    const tailX = w.tailSide * width * 0.18;

    ctx.beginPath();
    ctx.moveTo(-width / 2 + r, -height / 2);
    ctx.lineTo(width / 2 - r, -height / 2);
    ctx.arcTo(width / 2, -height / 2, width / 2, -height / 2 + r, r);
    ctx.lineTo(width / 2, height / 2 - r);
    ctx.arcTo(width / 2, height / 2, width / 2 - r, height / 2, r);
    ctx.lineTo(tailX + tailW / 2, height / 2);
    ctx.lineTo(tailX, height / 2 + tailH);
    ctx.lineTo(tailX - tailW / 2, height / 2);
    ctx.lineTo(-width / 2 + r, height / 2);
    ctx.arcTo(-width / 2, height / 2, -width / 2, height / 2 - r, r);
    ctx.lineTo(-width / 2, -height / 2 + r);
    ctx.arcTo(-width / 2, -height / 2, -width / 2 + r, -height / 2, r);
    ctx.closePath();

    const grad = ctx.createLinearGradient(-width / 2, -height / 2, width / 2, height / 2);
    if (wetProgress > 0.02) {
      grad.addColorStop(0, mixColor("#fbf6ea", "#93a8a3", wetProgress));
      grad.addColorStop(1, mixColor("#efe6d2", "#77897f", wetProgress));
    } else {
      grad.addColorStop(0, "#fbf6ea");
      grad.addColorStop(1, "#efe6d2");
    }
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.shadowColor = "transparent";
    ctx.strokeStyle = "rgba(120,100,70,0.28)";
    ctx.lineWidth = 1.4;
    ctx.stroke();

    // 흙 얼룩 (문지를수록 진해짐)
    if (dirt > 0.03) {
      const smudgeCount = Math.round(2 + dirt * 4);
      for (let i = 0; i < smudgeCount; i++) {
        const sx = (hashRand(w.seed * 3.1 + i * 9.3) - 0.5) * width * 0.7;
        const sy = (hashRand(w.seed * 5.7 + i * 2.9) - 0.5) * height * 0.55;
        const sr = (4 + hashRand(w.seed * 7.1 + i) * 5) * w.scale;
        ctx.beginPath();
        ctx.ellipse(sx, sy, sr, sr * 0.7, hashRand(w.seed + i) * Math.PI, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(110,82,50,${0.12 + dirt * 0.28})`;
        ctx.fill();
      }
    }

    // 글자 (너무 구겨지거나 젖으면 안 보이게)
    if (w.scale > MIN_PAPER_SCALE + 0.08 && wetProgress < 0.65) {
      ctx.fillStyle = "#4a4030";
      const fontSize = Math.max(11, 15 * w.scale);
      ctx.font = `${fontSize}px 'Gaegu', sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const lines = wrapText(ctx, w.content, width - 16 * w.scale);
      const lineHeight = fontSize * 1.15;
      const startY = -((lines.length - 1) * lineHeight) / 2;
      lines.slice(0, 5).forEach((line, i) => {
        ctx.fillText(line, 0, startY + i * lineHeight);
      });
    }

    ctx.restore();
  }

  _drawParticles(ctx) {
    for (const p of this.particles) {
      const alpha = 1 - p.life / p.maxLife;
      ctx.save();
      ctx.globalAlpha = clamp(alpha, 0, 1);
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      if (p.type === "leaf") {
        ctx.fillStyle = "#7fb85f";
        ctx.beginPath();
        ctx.ellipse(0, 0, p.size, p.size * 0.55, 0, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === "droplet") {
        ctx.fillStyle = "rgba(205,232,220,0.9)";
        ctx.beginPath();
        ctx.ellipse(0, 0, p.size * 0.55, p.size, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "rgba(140,170,150,0.4)";
        ctx.lineWidth = 1;
        ctx.stroke();
      } else if (p.type === "heart") {
        ctx.font = `${p.size * 2}px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("💛", 0, 0);
      } else {
        const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, p.size * 1.6);
        grad.addColorStop(0, "rgba(255,240,190,0.95)");
        grad.addColorStop(1, "rgba(255,240,190,0)");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, p.size * 1.6, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  _drawMessages(ctx) {
    for (const m of this.messages) {
      const t = m.life / m.maxLife;
      let alpha;
      if (t < 0.15) alpha = t / 0.15;
      else if (t > 0.7) alpha = 1 - (t - 0.7) / 0.3;
      else alpha = 1;

      ctx.save();
      ctx.globalAlpha = clamp(alpha, 0, 1);
      ctx.font = "16px 'Gaegu', sans-serif";
      ctx.fillStyle = "#5c6b3f";
      ctx.textAlign = "center";
      ctx.fillText(m.text, m.x, m.y);
      ctx.restore();
    }
  }
}

  window.BambooForest.Forest = Forest;
})();
