// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// The dev-only devtools source injector adds `data-tsd-source` to every JSX element.
// React Three Fiber treats dashed props as nested paths and crashes, so strip it from 3D scene files.
const stripTsdSourceFrom3D = {
  name: "astra:strip-tsd-source-r3f",
  enforce: "post" as const,
  transform(code: string, id: string) {
    if (id.includes("node_modules") || !code.includes("data-tsd-source")) return;
    if (!code.includes("@react-three/")) return;
    // Remove the whole attribute/property; delete one adjacent comma so object literals stay valid.
    const out = code
      .replace(/ data-tsd-source="[^"]*"/g, "")
      .replace(/"data-tsd-source":\s*"[^"]*"\s*,\s*/g, "")
      .replace(/,\s*"data-tsd-source":\s*"[^"]*"/g, "")
      .replace(/\{\s*"data-tsd-source":\s*"[^"]*"\s*\}/g, "{}");
    return { code: out, map: null };
  },
};

// ASTRA_STANDALONE=1 builds the offline laptop package: every route is prerendered
// to static HTML so a tiny local file server can run the whole app without internet.
const STANDALONE = !!process.env.ASTRA_STANDALONE;
const STANDALONE_PAGES = [
  "/",
  "/dashboard",
  "/monitor",
  "/emergency",
  "/alerts",
  "/analytics",
  "/routines",
  "/quest",
  "/wellbeing",
  "/environments",
  "/learn",
  "/learn/human-research",
  "/profile",
];
const BASE_PATH = process.env.ASTRA_BASE_PATH ?? "/";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
    ...(STANDALONE
      ? {
          prerender: { enabled: true, failOnError: false },
          pages: STANDALONE_PAGES.map((path) => ({ path, prerender: { enabled: true } })),
        }
      : {}),
  },
  vite: { base: BASE_PATH, plugins: [stripTsdSourceFrom3D] },
});
