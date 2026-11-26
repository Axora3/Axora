import * as T from "three";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { loadIllustratedHands, poseIllustratedHand } from "./illustrated-rig.js";
import { alignPaintedHands } from "./painted-contact.js";

const owners = new WeakMap();
let serial = 0;

/**
 * Adapt the existing illustrated rig to persistent document scroll.
 * No pin, spacer, global CSS, scroll proxy, nested scroller or standalone UI.
 */
export function createHandsBackground(canvas, host, hero) {
  owners.get(canvas)?.dispose();
  const renderer = new T.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, innerWidth < 700 ? 1.5 : 2));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = T.SRGBColorSpace;
  renderer.toneMapping = T.NoToneMapping;

  const scene = new T.Scene();
  const camera = new T.OrthographicCamera(0, 1, 0, 1, 0.1, 100);
  camera.position.z = 10;
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  const state = { p: 0 };
  const id = `axora-hands-${++serial}`;
  function focalY() { return viewport.h * (viewport.mobile ? 0.68 : 0.60); }
  let hands = [], trigger, tween, frame = 0, dead = false, last = -1;
  let viewport = { w: 1, h: 1, mobile: false };

  host.dataset.state = "loading";
  host.dataset.instance = id;

  function paint() {
    frame = 0;
    if (dead) return;
    const visible = !document.hidden;
    const p = motion.matches ? 0.75 : T.MathUtils.clamp(state.p, 0, 1);
    if (!hands.length || (last === p && visible)) return;
    if (!visible) return; // Pause rendering while the browser tab is hidden.
    last = p;
    const { w, h, mobile } = viewport;
    for (const hand of hands) poseIllustratedHand(hand, p, mobile, w, h);
    const contact = alignPaintedHands(scene, hands, p, w, h, mobile, renderer.getPixelRatio(), focalY());
    renderer.render(scene, camera);
    host.dataset.progress = p.toFixed(6);
    host.dataset.tipDistance = contact.distance.toFixed(6);
    host.dataset.joints = JSON.stringify(hands.map((hand) => hand.fingers.flatMap((finger) => finger.bones.map((bone) => bone.rotation.z))));
    host.dataset.reducedMotion = String(motion.matches);
    host.dataset.triggerCount = String(ScrollTrigger.getAll().filter((item) => String(item.vars.id || "").startsWith("axora-hands-")).length);
    host.dataset.state = "ready";
  }

  function requestPaint() {
    if (!dead && !frame) frame = requestAnimationFrame(paint);
  }

  function resize() {
    if (dead) return;
    const w = host.clientWidth, h = host.clientHeight;
    if (!w || !h) return;
    viewport = { w, h, mobile: w < 700 };
    camera.right = w;
    camera.bottom = h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
    last = -1;
    requestPaint();
  }

  function scrollRange() {
    return Math.max(1, Math.min(innerHeight * 1.5, document.documentElement.scrollHeight - innerHeight));
  }

  function connectScroll() {
    trigger?.kill();
    tween?.kill();
    if (!gsap.core.globals().ScrollTrigger) gsap.registerPlugin(ScrollTrigger);
    tween = gsap.fromTo(state, { p: 0 }, { p: 1, duration: 1, ease: "none", paused: true, immediateRender: false, onUpdate: requestPaint });
    trigger = ScrollTrigger.create({
      id,
      trigger: hero,
      start: 0,
      end: () => `+=${scrollRange()}`,
      animation: tween,
      scrub: motion.matches ? true : 0.65,
      pin: false,
      invalidateOnRefresh: true,
      onRefresh: () => {
        host.dataset.scrollStart = String(trigger?.start ?? 0);
        host.dataset.scrollEnd = String(trigger?.end ?? 0);
        last = -1;
        requestPaint();
      },
    });
    state.p = trigger.progress;
    host.dataset.scrollStart = String(trigger.start);
    host.dataset.scrollEnd = String(trigger.end);
    last = -1;
    requestPaint();
  }

  const sizeObserver = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(() => {
    resize();
    trigger?.refresh();
  });
  sizeObserver?.observe(host);
  sizeObserver?.observe(hero);
  addEventListener("scroll", requestPaint, { passive: true });
  addEventListener("resize", resize, { passive: true });
  document.addEventListener("visibilitychange", requestPaint);
  motion.addEventListener("change", connectScroll);

  function releaseHands(list) {
    for (const hand of list) {
      hand.mesh.geometry.dispose();
      hand.mesh.material.map.dispose();
      hand.edgeTexture.dispose();
      hand.mesh.material.dispose();
      hand.mesh.skeleton.dispose();
    }
  }

  function dispose() {
    if (dead) return;
    dead = true;
    if (frame) cancelAnimationFrame(frame);
    trigger?.kill();
    tween?.kill();
    sizeObserver?.disconnect();
    removeEventListener("scroll", requestPaint);
    removeEventListener("resize", resize);
    document.removeEventListener("visibilitychange", requestPaint);
    motion.removeEventListener("change", connectScroll);
    canvas.removeEventListener("webglcontextlost", lostContext);
    releaseHands(hands);
    renderer.dispose();
    if (owners.get(canvas)?.dispose === dispose) owners.delete(canvas);
  }

  function lostContext(event) {
    event.preventDefault();
    host.dataset.state = "unavailable";
    host.hidden = true;
    dispose();
  }
  canvas.addEventListener("webglcontextlost", lostContext);

  const ready = loadIllustratedHands(renderer).then((loaded) => {
    if (dead) { releaseHands(loaded); return; }
    hands = loaded;
    for (const hand of hands) scene.add(hand.group);
    resize();
    connectScroll();
  }).catch((error) => {
    host.dataset.state = "unavailable";
    host.hidden = true;
    dispose();
    throw error;
  });

  const runtime = { ready, dispose };
  owners.set(canvas, runtime);
  return runtime;
}

