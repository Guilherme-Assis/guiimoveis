/// <reference types="vite/client" />

declare module "framer-motion" {
  // Aliased to ./lib/motion-shim.tsx — re-export its types loosely.
  export const motion: any;
  export const m: any;
  export const AnimatePresence: any;
  export const LazyMotion: any;
  export const domAnimation: any;
  export const domMax: any;
  const _default: any;
  export default _default;
}
