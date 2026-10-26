/// <reference types="vite/client" />

/* Ambient declarations so side-effect CSS imports type-check in every
   TypeScript context, including language services that do not load
   vite/client's wildcard module declarations from tsconfig "types". */

declare module "*.css" {
  const css: string;
  export default css;
}

declare module "*.svg" {
  const src: string;
  export default src;
}

declare module "*.png" {
  const src: string;
  export default src;
}

declare module "*.jpg" {
  const src: string;
  export default src;
}

declare module "*.webp" {
  const src: string;
  export default src;
}
