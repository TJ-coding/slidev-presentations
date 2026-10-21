// ============================================================================
// d3-figure-embedder.js — TEMPLATE for an animated D3 figure that a Slidev
// deck can mount live and drive with the slide's →/← clicks.
//
// Copy this pattern into <slug>/<slug>-figure.js (classic script, no imports —
// it is loaded with a <script> tag AFTER d3, and reads the d3 global).
// The full procedure lives in ../references/d3-live-figures.md.
//
// The FIVE enabling properties of this contract:
//   1. Every stage event's `apply(e)` is a PURE function of progress e ∈ [0,1]
//      — nothing tweens on its own. This is what makes ← (reverse playback)
//      possible: the same apply runs with e going 1 → 0.
//   2. Stage 1 is the RESTING frame — rendered synchronously in clicks mode,
//      so a freshly mounted slide shows a complete figure with zero clicks.
//   3. The controller (next/prev/jumpTo) reads only function-scoped state
//      (script/anims/animTimer/stage) — hoisted above their closures.
//   4. AT MOST ONE playback runs at a time: a new command stops the previous
//      playback and clears its queued events before starting. Two overlapping
//      animation sets rewrite the same elements and the final frame depends on
//      which timer happens to finish last — that is how the audience and the
//      presenter window settled on DIFFERENT frames ("out of sync" bug).
//   5. NO module-level mutable RENDER state (e.g. a `let TILT` at file scope).
//      Presenter mode mounts the figure several times in one window (current
//      panel + next-frame preview + overview); a shared variable makes one
//      instance's animation write another instance's geometry.
// ============================================================================
(function () {
  "use strict";

  // ---- your figure's constants & data --------------------------------------
  const W = 1598, H = 630;                       // canvas (presentation-wide figure)
  const RAW_DATA = { /* … your data … */ };

  function draw(data, container = "#figure", opts = {}) {
    const d3 = opts.d3 ?? window.d3;
    const svg = d3.select(container).append("svg")
      .attr("viewBox", `0 0 ${W} ${H}`);
    const root = svg.append("g");
    // … build ALL marks/labels up front, at their HIDDEN start state …
    // any animated render state (a camera tilt, a scale factor, …) must live
    // HERE, per instance — never at module scope (property 5).

    // ---- stage timeline (clicks mode) / ticker (auto mode) -------------------
    const anims = [];
    let animTimer = null;
    let playing = false;
    let pending = false;
    let stage = 1;
    const script = [];   // { stage, delay, dur, ease, apply } — the full timeline

    // the ONLY way to mutate the figure: progress-based applies
    function animate(stage, delay, dur, ease, apply) {
      script.push({ stage, delay, dur, ease, apply });
    }
    // e.g. animate(2, 600, 700, d3.easeCubicOut, e => sel.attr("opacity", e));

    // render every event of a stage-set at a fixed progress (no animation)
    function renderTo(n, p) {
      for (const e of script)
        if (e.stage <= n) e.apply(e.ease(p));
    }

    // settled frame: everything at its end state (?static, exports, serialize)
    function finishAll() {
      stopPlayback();
      for (const e of script) e.apply(e.ease(1));
    }

    const STATIC = opts.static ?? new URLSearchParams(location.search).has("static");
    const STEPS = opts.steps ?? "auto";

    if (STATIC) {
      finishAll();
    } else {
      // hide whatever the timeline hasn't revealed yet (no lingering stubs)
      // … e.g. eraEls.forEach(({card}) => card.attr("opacity", 0));

      if (STEPS === "clicks") {
        renderTo(1, 1);            // stage 1 IS the resting frame — show it now
      } else {
        // 'auto': play the whole timeline on load (standalone hero page)
        const now = Date.now();
        for (const e of script) anims.push({ ...e, t0: now + e.delay });
        startTimer();
      }
    }

    // ---- ticker (shared by forward and backward playback) --------------------
    function stopTimer() {
      if (animTimer) { animTimer.stop(); animTimer = null; }
    }
    // Cancel any in-flight playback AND its queued events. Every new command
    // (next/prev/jumpTo) calls this first — property 4.
    function stopPlayback() {
      stopTimer();
      anims.length = 0;
      playing = false;
      pending = false;
    }
    function startTimer() {
      stopTimer();                 // never let two intervals coexist
      animTimer = d3.interval(tickAll, 30);
    }
    function tickAll() {
      const now = Date.now();
      for (let i = anims.length - 1; i >= 0; i--) {
        const a = anims[i];
        if (now < a.t0) continue;
        const u = Math.min(1, (now - a.t0) / a.dur);
        a.apply(a.ease(u));        // u === 1 applies the exact final frame
        if (u >= 1) anims.splice(i, 1);
      }
      if (!anims.length) {
        stopTimer();
        playing = false;
        if (pending) { pending = false; next(); }
      }
    }

    // ---- playback primitives -------------------------------------------------
    function playStage(n) {                        // forward: staggered by `delay`
      stopPlayback();
      const now = Date.now();
      for (const e of script)
        if (e.stage === n) anims.push({ ...e, t0: now + e.delay });
      playing = true;
      startTimer();
    }
    function playStageBackward(n) {                // backward: progress 1 → 0,
      const evs = script.filter(e => e.stage === n);   // stagger MIRRORED —
      if (!evs.length) return false;             // last in, first out
      stopPlayback();
      const T = Math.max(...evs.map(e => e.delay + e.dur));
      const now = Date.now();
      for (const e of evs)
        anims.push({
          t0: now + (T - e.delay - e.dur), dur: e.dur,
          ease: u => u,                          // driver is linear; the event's
          apply: u => e.apply(e.ease(1 - u)),    // own ease is applied inside
        });
      playing = true;
      startTimer();
      return true;
    }

    // ---- the controller ------------------------------------------------------
    // next(): play the next stage forward. Queue an advance if one is playing.
    function next() {
      if (STATIC || STEPS !== "clicks") return false;
      if (!script.some(e => e.stage === stage + 1)) return false;  // exhausted
      if (playing) { pending = true; return false; }
      stage += 1;
      playStage(stage);
      return true;
    }
    // prev(): play the CURRENT stage backwards (← on the slide). False = caller
    // should jumpTo() instead: at stage 1, or mid-flight (never reverse from a
    // partial state — settle instantly).
    function prev() {
      if (STATIC || STEPS !== "clicks") return false;
      if (stage <= 1) return false;
      if (playing) {
        stopPlayback();
        jumpTo(stage);             // settle at the current target; the host's
        return false;              // jumpTo(n + 1) then lands exactly
      }
      stage -= 1;
      return playStageBackward(stage + 1);
    }
    // jumpTo(n): render EXACTLY stages 1..n — stages > n reset to their START
    // state. (Forgetting the reset is the classic back-navigation bug: later
    // stages linger on screen after ←.)
    function jumpTo(n) {
      if (STATIC || STEPS !== "clicks") return;
      stopPlayback();              // a jump is authoritative — never race it
      for (const e of script)
        e.apply(e.stage <= n ? e.ease(1) : e.ease(0));
      stage = n;
    }

    // ---- exports for the standalone hero page (optional) ---------------------
    function serialize() { /* … clone svg, XMLSerializer … */ }
    // document.getElementById("dl-svg")?.addEventListener(…)

    return { next, prev, jumpTo, stage: () => stage,
             // hosts use busy() to decide when it is safe to resync
             busy: () => playing && animTimer !== null,
             cleanup: () => { stopTimer(); anims.length = 0; playing = false; } };
  }

  // ---- mounting: standalone page + embedders --------------------------------
  function mount(container, opts = {}) {
    const el = typeof container === "string" ? document.querySelector(container) : container;
    if (!el) return null;
    return draw(RAW_DATA, el, opts);
  }
  if (typeof document !== "undefined" && document.getElementById("figure")) {
    mount(document.getElementById("figure"));   // standalone hero page auto-mounts
  }
  if (typeof window !== "undefined") {
    window.FigureEmbedder = { mount };          // ← rename to your figure's API name
  }
})();
