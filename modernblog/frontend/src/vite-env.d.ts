/// <reference types="vite/client" />

// CSS module declarations
declare module '*.css' {
  const css: { [key: string]: string };
  export default css;
}

// Allow importing CSS directly (side-effect imports)
declare module '*.css' {}

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
