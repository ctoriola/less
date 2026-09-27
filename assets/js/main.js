/* ==========================================================================
   Lord, Saint, Sinner — site behaviour
   ========================================================================== */

document.documentElement.classList.remove("no-js");

/* ---------- Header: scrolled state + mobile menu ---------- */

(function header() {
  const headerEl = document.querySelector(".site-header");
  const toggle = document.querySelector(".menu-toggle");
  if (!headerEl) return;

  const onScroll = () => headerEl.classList.toggle("is-scrolled", window.scrollY > 24);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  if (toggle) {
    toggle.addEventListener("click", () => {
      const open = document.body.classList.toggle("nav-open");
      toggle.setAttribute("aria-expanded", String(open));
    });
    document.querySelectorAll(".nav a").forEach((a) =>
      a.addEventListener("click", () => {
        document.body.classList.remove("nav-open");
        toggle.setAttribute("aria-expanded", "false");
      })
    );
  }
})();

/* ---------- Reveal on scroll ---------- */

(function reveal() {
  const items = document.querySelectorAll(".reveal");
  if (!("IntersectionObserver" in window)) {
    items.forEach((el) => el.classList.add("is-visible"));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    },
    { rootMargin: "0px 0px -8% 0px" }
  );
  items.forEach((el) => io.observe(el));
})();

/* ---------- Filters (artists, releases, events, news) ---------- */

(function filters() {
  document.querySelectorAll("[data-filters]").forEach((group) => {
    const scope = document.querySelector(group.dataset.filters);
    if (!scope) return;
    const buttons = group.querySelectorAll(".filter-btn");
    buttons.forEach((btn) =>
      btn.addEventListener("click", () => {
        const value = btn.dataset.value;
        buttons.forEach((b) => {
          b.classList.toggle("is-active", b === btn);
          b.setAttribute("aria-pressed", String(b === btn));
        });
        scope.querySelectorAll("[data-filter-item]").forEach((item) => {
          const tags = item.dataset.filterItem.split(" ");
          item.classList.toggle("is-hidden", value !== "all" && !tags.includes(value));
        });
      })
    );
  });
})();

/* ---------- Forms (client-side only demo) ---------- */

(function forms() {
  document.querySelectorAll("form[data-validate]").forEach((form) => {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      let valid = true;
      form.querySelectorAll("[required]").forEach((field) => {
        const error = field.closest(".field")?.querySelector(".error");
        const ok = field.type === "checkbox" ? field.checked : field.checkValidity() && field.value.trim() !== "";
        if (error) error.textContent = ok ? "" : field.dataset.error || "This field is required.";
        if (!ok) valid = false;
      });
      if (!valid) return;
      form.classList.add("is-sent");
      form.querySelector(".form-success")?.focus();
      form.reset();
    });
  });

  document.querySelectorAll("form.newsletter").forEach((form) => {
    const note = form.parentElement.querySelector(".newsletter-note");
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const input = form.querySelector("input[type=email]");
      if (!input.checkValidity() || !input.value) {
        if (note) note.textContent = "Please enter a valid email address.";
        return;
      }
      if (note) note.textContent = "You're on the list. First drop lands in your inbox soon.";
      form.reset();
    });
  });
})();

/* ---------- Footer year ---------- */

document.querySelectorAll("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));

/* ---------- Player: a small WebAudio synth standing in for real audio ---------- */

(function player() {
  const TRACKS = [
    { title: "Halfway", artist: "Lord, Saint, Sinner", duration: 204, root: 57, prog: [0, 8, 3, 10], bpm: 96 },
    { title: "Hide", artist: "Lord, Saint, Sinner", duration: 221, root: 55, prog: [0, 5, 3, 7], bpm: 78 },
    { title: "FU money", artist: "Lord, Saint, Sinner", duration: 178, root: 52, prog: [0, 3, 8, 10], bpm: 112 },
    { title: "Neva Chop White Jeans", artist: "Lord, Saint, Sinner", duration: 190, root: 60, prog: [0, 9, 5, 7], bpm: 88 },
    { title: "ZA ODA", artist: "Lord, Saint, Sinner", duration: 212, root: 50, prog: [0, 10, 8, 7], bpm: 104 },
  ];

  const root = document.documentElement;
  const q = (sel) => document.querySelectorAll(sel);
  if (!document.querySelector("[data-player-toggle]")) return;

  let index = 0;
  let playing = false;
  let elapsed = 0;
  let lastTick = 0;
  let raf = 0;
  let ctx = null;
  let master = null;
  let schedulerTimer = 0;
  let nextBeatTime = 0;
  let beat = 0;

  const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
  const midiToHz = (m) => 440 * Math.pow(2, (m - 69) / 12);

  function render() {
    const t = TRACKS[index];
    q("[data-player-title]").forEach((el) => (el.textContent = t.title));
    q("[data-player-artist]").forEach((el) => (el.textContent = t.artist));
    q("[data-player-duration]").forEach((el) => (el.textContent = fmt(t.duration)));
    q("[data-player-current]").forEach((el) => (el.textContent = fmt(elapsed)));
    q("[data-player-bar]").forEach((el) => (el.style.width = `${(elapsed / t.duration) * 100}%`));
    q("[data-player-toggle]").forEach((el) => el.setAttribute("aria-label", playing ? "Pause" : "Play"));
    root.classList.toggle("is-playing", playing);
  }

  function ensureAudio() {
    if (ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.0;
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 1800;
    master.connect(filter).connect(ctx.destination);
  }

  function voice(freq, start, length, type, gain) {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.setValueAtTime(0, start);
    g.gain.linearRampToValueAtTime(gain, start + Math.min(0.08, length / 4));
    g.gain.exponentialRampToValueAtTime(0.0001, start + length);
    osc.connect(g).connect(master);
    osc.start(start);
    osc.stop(start + length + 0.05);
  }

  function kick(start) {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.frequency.setValueAtTime(140, start);
    osc.frequency.exponentialRampToValueAtTime(42, start + 0.18);
    g.gain.setValueAtTime(0.5, start);
    g.gain.exponentialRampToValueAtTime(0.0001, start + 0.3);
    osc.connect(g).connect(master);
    osc.start(start);
    osc.stop(start + 0.32);
  }

  function schedule() {
    const t = TRACKS[index];
    const spb = 60 / t.bpm;
    while (nextBeatTime < ctx.currentTime + 0.2) {
      const bar = Math.floor(beat / 4) % t.prog.length;
      const chordRoot = t.root + t.prog[bar];
      if (beat % 4 === 0) {
        const minor = [0, 3, 7, 10];
        minor.forEach((iv) => {
          voice(midiToHz(chordRoot + iv), nextBeatTime, spb * 4, "sawtooth", 0.035);
          voice(midiToHz(chordRoot + iv) * 1.004, nextBeatTime, spb * 4, "triangle", 0.03);
        });
        voice(midiToHz(chordRoot - 24), nextBeatTime, spb * 3.5, "sine", 0.22);
      }
      kick(nextBeatTime);
      const arp = [0, 7, 12, 15, 19, 15, 12, 7];
      voice(midiToHz(chordRoot + 12 + arp[(beat * 2) % 8]), nextBeatTime, spb * 0.45, "triangle", 0.05);
      voice(midiToHz(chordRoot + 12 + arp[(beat * 2 + 1) % 8]), nextBeatTime + spb / 2, spb * 0.45, "triangle", 0.04);
      nextBeatTime += spb;
      beat++;
    }
  }

  function tick(now) {
    if (!playing) return;
    elapsed += Math.max(0, now - lastTick) / 1000;
    lastTick = now;
    if (elapsed >= TRACKS[index].duration) {
      change(1);
      return;
    }
    render();
    raf = requestAnimationFrame(tick);
  }

  function play() {
    ensureAudio();
    playing = true;
    if (ctx) {
      ctx.resume();
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.setTargetAtTime(0.55, ctx.currentTime, 0.2);
      nextBeatTime = ctx.currentTime + 0.05;
      clearInterval(schedulerTimer);
      schedulerTimer = setInterval(schedule, 50);
      schedule();
    }
    lastTick = performance.now();
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(tick);
    render();
  }

  function pause() {
    playing = false;
    cancelAnimationFrame(raf);
    clearInterval(schedulerTimer);
    if (ctx) master.gain.setTargetAtTime(0, ctx.currentTime, 0.08);
    render();
  }

  function change(dir) {
    const wasPlaying = playing;
    index = (index + dir + TRACKS.length) % TRACKS.length;
    elapsed = 0;
    beat = 0;
    if (wasPlaying) {
      pause();
      play();
    } else render();
  }

  q("[data-player-toggle]").forEach((b) => b.addEventListener("click", () => (playing ? pause() : play())));
  q("[data-player-prev]").forEach((b) => b.addEventListener("click", () => change(-1)));
  q("[data-player-next]").forEach((b) => b.addEventListener("click", () => change(1)));
  q("[data-play-track]").forEach((b) =>
    b.addEventListener("click", () => {
      index = Number(b.dataset.playTrack) % TRACKS.length;
      elapsed = 0;
      beat = 0;
      if (playing) pause();
      play();
    })
  );

  document.addEventListener("keydown", (e) => {
    if (e.code === "Space" && e.target === document.body) {
      e.preventDefault();
      playing ? pause() : play();
    }
  });

  elapsed = 64;
  render();
})();

/* ---------- 3D phone: holds a tilted pose, turns right as the page scrolls, drag / swipe / arrow keys to spin ---------- */

(function phone3d() {
  const wrap = document.querySelector("[data-phone3d]");
  const rig = wrap && wrap.querySelector(".phone3d");
  if (!rig) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const REST_X = 28;
  const REST_Y = 22;
  const MIN_X = -35;
  const MAX_X = 60;
  const SCROLL_TURN = 360; // degrees turned on the way from mid-screen to the top of the viewport
  const IDLE_AFTER = 4000;
  const DRAG_THRESHOLD = 4;

  // Build the stacked rings that give the rounded edge and camera plateau their depth.
  const depth = parseFloat(getComputedStyle(wrap).getPropertyValue("--d")) || 30;
  const edge = rig.querySelector(".phone-edge");
  const RINGS = 15;
  const tones = ["#b9b9bf", "#8e8e94", "#6c6c71", "#5d5d62", "#6c6c71", "#8e8e94", "#b9b9bf"];
  for (let i = 0; i < RINGS; i++) {
    const f = i / (RINGS - 1);
    const ring = document.createElement("i");
    ring.className = "ring";
    ring.style.setProperty("--z", `${(f - 0.5) * (depth - 2)}px`);
    ring.style.setProperty("--ring", tones[Math.round(f * (tones.length - 1))]);
    edge.prepend(ring);
  }
  const cam = rig.querySelector(".phone-cam");
  [1, 2, 3].forEach((n) => {
    const ring = document.createElement("i");
    ring.className = "phone-cam-ring";
    ring.setAttribute("aria-hidden", "true");
    ring.style.setProperty("--z", `${-depth / 2 - n}px`);
    rig.insertBefore(ring, cam);
  });

  let rx = REST_X;
  let ry = REST_Y;
  let vx = 0;
  let vy = 0;
  let dragging = false;
  let pointerId = null;
  let startX = 0;
  let startY = 0;
  let lastX = 0;
  let lastY = 0;
  let lastMove = 0;
  let moved = false;
  let suppressClick = false;
  let lastInteraction = -Infinity;
  let visible = true;
  let raf = 0;
  let clock = 0;
  let spin = 0; // scroll-driven turn, added on top of the pose

  const rad = (d) => (d * Math.PI) / 180;
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  const L = [-0.42, -0.5, 0.76]; // light from upper left, in front

  // Brightness of a face with outward normal n after rotateX(rx) rotateY(ry).
  function lit(n, cx, sx, cy, sy) {
    const x1 = n[0] * cy + n[2] * sy;
    const y1 = n[1];
    const z1 = -n[0] * sy + n[2] * cy;
    const y2 = y1 * cx - z1 * sx;
    const z2 = y1 * sx + z1 * cx;
    return (0.55 + 0.75 * Math.max(0, x1 * L[0] + y2 * L[1] + z2 * L[2])).toFixed(3);
  }

  // Hold the pose until the phone reaches the middle of the screen, then turn right
  // until it has scrolled up to the top of the viewport.
  function scrollTarget() {
    if (reduceMotion.matches) return 0;
    const half = window.innerHeight / 2;
    const center = wrap.getBoundingClientRect().top + window.scrollY + rig.offsetHeight / 2;
    const start = Math.max(0, center - half);
    return clamp((window.scrollY - start) / Math.max(1, center - start), 0, 1) * SCROLL_TURN;
  }

  function apply() {
    const y = ry + spin;
    const cy = Math.cos(rad(y));
    const sy = Math.sin(rad(y));
    const cx = Math.cos(rad(rx));
    const sx = Math.sin(rad(rx));
    const turn = ((((y - REST_Y + 180) % 360) + 360) % 360) - 180;
    rig.style.setProperty("--rx", `${rx.toFixed(2)}deg`);
    rig.style.setProperty("--ry", `${y.toFixed(2)}deg`);
    rig.style.setProperty("--sheen", `${clamp(50 - turn * 0.9, -40, 140).toFixed(1)}%`);
    rig.style.setProperty("--lit-l", lit([-1, 0, 0], cx, sx, cy, sy));
    rig.style.setProperty("--lit-r", lit([1, 0, 0], cx, sx, cy, sy));
    rig.style.setProperty("--lit-t", lit([0, -1, 0], cx, sx, cy, sy));
    rig.style.setProperty("--lit-b", lit([0, 1, 0], cx, sx, cy, sy));
    wrap.style.setProperty("--shadow-sx", (0.45 + 0.55 * Math.abs(cy)).toFixed(3));
  }

  function frame(now) {
    raf = 0;
    const dt = Math.min(0.05, clock ? (now - clock) / 1000 : 0.016);
    clock = now;
    const calm = reduceMotion.matches;
    let settled = !dragging;

    if (!dragging) {
      if (!calm && (Math.abs(vx) > 0.01 || Math.abs(vy) > 0.01)) {
        ry += vy * dt * 60;
        rx = clamp(rx + vx * dt * 60, MIN_X, MAX_X);
        const decay = Math.pow(0.94, dt * 60);
        vx *= decay;
        vy *= decay;
        settled = false;
      } else {
        vx = vy = 0;
        const idle = now - lastInteraction > IDLE_AFTER;
        const ease = 1 - Math.pow(idle ? 0.96 : 0.93, dt * 60);
        rx += (REST_X - rx) * ease;
        if (Math.abs(REST_X - rx) > 0.05) settled = false;
        else rx = REST_X;
        if (idle) {
          // Return to the resting pose by the shortest way, never unwinding whole turns.
          const base = Math.round((ry - REST_Y) / 360) * 360 + REST_Y;
          ry += (base - ry) * ease;
          if (Math.abs(base - ry) > 0.05) settled = false;
          else ry = base;
        } else if (lastInteraction > 0) settled = false; // wait out the idle delay
      }
    }

    const target = scrollTarget();
    spin += (target - spin) * (calm ? 1 : 1 - Math.pow(0.85, dt * 60));
    if (Math.abs(target - spin) > 0.05) settled = false;
    else spin = target;

    apply();
    if (!settled) schedule();
  }

  function schedule() {
    if (raf || !visible || document.hidden) return;
    raf = requestAnimationFrame(frame);
  }

  function touch() {
    lastInteraction = performance.now();
    wrap.classList.add("has-spun");
  }

  wrap.addEventListener("pointerdown", (e) => {
    if (e.button !== 0 || dragging) return;
    pointerId = e.pointerId;
    startX = lastX = e.clientX;
    startY = lastY = e.clientY;
    lastMove = performance.now();
    moved = false;
    vx = vy = 0;
  });

  wrap.addEventListener("pointermove", (e) => {
    if (e.pointerId !== pointerId) return;
    if (!dragging) {
      if (Math.hypot(e.clientX - startX, e.clientY - startY) < DRAG_THRESHOLD) return;
      dragging = moved = true;
      wrap.classList.add("is-dragging");
      try { wrap.setPointerCapture(pointerId); } catch (_) { /* pointer already gone */ }
    }
    const now = performance.now();
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    const frames = Math.max(1, (now - lastMove) / 16.7);
    ry += dx * 0.5;
    rx = clamp(rx - dy * 0.3, MIN_X, MAX_X);
    vy = (dx * 0.5) / frames;
    vx = (-dy * 0.3) / frames;
    lastX = e.clientX;
    lastY = e.clientY;
    lastMove = now;
    touch();
    schedule();
  });

  function endDrag(e) {
    if (e.pointerId !== pointerId) return;
    pointerId = null;
    if (!dragging) return;
    dragging = false;
    wrap.classList.remove("is-dragging");
    if (performance.now() - lastMove > 80) vx = vy = 0; // released after holding still
    suppressClick = moved;
    touch();
    schedule();
  }
  wrap.addEventListener("pointerup", endDrag);
  wrap.addEventListener("pointercancel", endDrag);
  wrap.addEventListener("lostpointercapture", endDrag);

  // A drag that started on a player button should not also press it.
  wrap.addEventListener(
    "click",
    (e) => {
      if (!suppressClick) return;
      suppressClick = false;
      e.preventDefault();
      e.stopPropagation();
    },
    true
  );
  wrap.addEventListener("dragstart", (e) => e.preventDefault());

  wrap.addEventListener("dblclick", (e) => {
    if (e.target.closest("button")) return;
    ry = Math.round((ry - REST_Y) / 360) * 360 + REST_Y;
    rx = REST_X;
    vx = vy = 0;
    touch();
    schedule();
  });

  wrap.addEventListener("keydown", (e) => {
    if (e.target !== wrap) return;
    const step = e.shiftKey ? 45 : 15;
    const keys = { ArrowLeft: [0, -step], ArrowRight: [0, step], ArrowUp: [step / 2, 0], ArrowDown: [-step / 2, 0] };
    const k = keys[e.key];
    if (!k) return;
    e.preventDefault();
    rx = clamp(rx + k[0], MIN_X, MAX_X);
    ry += k[1];
    vx = vy = 0;
    touch();
    apply();
    schedule();
  });

  if ("IntersectionObserver" in window) {
    new IntersectionObserver((entries) => {
      visible = entries[0].isIntersecting;
      clock = 0;
      schedule();
    }).observe(wrap);
  }
  document.addEventListener("visibilitychange", () => {
    clock = 0;
    schedule();
  });
  reduceMotion.addEventListener?.("change", schedule);
  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", schedule);

  spin = scrollTarget();
  apply();
  schedule();
})();
