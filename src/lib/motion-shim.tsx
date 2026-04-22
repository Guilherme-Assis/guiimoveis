import { createElement, forwardRef, Fragment, type ElementType, type ReactNode } from "react";

/**
 * Lightweight drop-in replacement for framer-motion.
 * Strips animation-only props (initial, animate, exit, transition, variants, whileHover, whileInView, viewport, layout, etc.)
 * and renders the underlying element with a CSS fade-in class for entrance animations.
 *
 * This eliminates ~42KB of unused JS from the initial bundle while preserving the visual feel.
 */

const ANIM_PROPS = new Set([
  "initial",
  "animate",
  "exit",
  "transition",
  "variants",
  "whileHover",
  "whileTap",
  "whileFocus",
  "whileDrag",
  "whileInView",
  "viewport",
  "layout",
  "layoutId",
  "drag",
  "dragConstraints",
  "dragElastic",
  "dragMomentum",
  "onAnimationStart",
  "onAnimationComplete",
  "onUpdate",
  "custom",
  "style",
]);

function stripMotionProps(props: Record<string, any>) {
  const cleaned: Record<string, any> = {};
  let hasInitial = false;
  let hasAnimate = false;
  for (const key in props) {
    if (key === "initial") {
      hasInitial = props[key] !== false;
      continue;
    }
    if (key === "animate") {
      hasAnimate = !!props[key];
      continue;
    }
    if (ANIM_PROPS.has(key)) continue;
    cleaned[key] = props[key];
  }
  // Preserve style if it was passed
  if (props.style) cleaned.style = props.style;
  // Add a soft fade-in class when component declares an entrance animation
  if (hasInitial && hasAnimate) {
    cleaned.className = [cleaned.className, "motion-fade-in"].filter(Boolean).join(" ");
  }
  return cleaned;
}

const cache = new Map<string, any>();

function makeMotion(tag: ElementType): any {
  const key = String(tag);
  if (cache.has(key)) return cache.get(key)!;
  const Comp = forwardRef<any, any>((props, ref) => {
    const cleaned = stripMotionProps(props);
    return createElement(tag as any, { ...cleaned, ref });
  });
  (Comp as any).displayName = `motion.${key}`;
  cache.set(key, Comp);
  return Comp;
}

// Proxy: motion.div, motion.section, motion.h1 ... all return a stripped component.
// IMPORTANT: ignore symbol props and ESM/Promise/React internals so dynamic import()
// and React element type checks don't mistake this object for a thenable or component.
const PASSTHROUGH = new Set([
  "then", // critical: ESM dynamic import checks .then — returning a function makes it look like a Promise
  "default",
  "__esModule",
  "$$typeof",
  "prototype",
  "constructor",
  "toString",
  "valueOf",
  "length",
  "name",
  "displayName",
  "render",
]);

export const motion: any = new Proxy(
  {},
  {
    get: (_t, prop) => {
      if (typeof prop !== "string") return undefined;
      if (PASSTHROUGH.has(prop)) return undefined;
      return makeMotion(prop as any);
    },
    has: () => false,
  }
);

export function AnimatePresence({ children }: { children?: ReactNode }) {
  return createElement(Fragment, null, children);
}

export const LazyMotion = ({ children }: { children?: ReactNode; features?: any }) => createElement(Fragment, null, children);
export const domAnimation = {};
export const domMax = {};
export const m = motion;

// Default export must mirror the motion proxy itself so `import m from "framer-motion"; m.div` works
export default motion;
