import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { nitro } from "nitro/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [
    tanstackStart({
      // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR
      // error wrapper). nitro/vite builds the deployment output from this.
      server: { entry: "server" },
    }),
    // Produces the host's deployment output. The preset is auto-detected from the
    // build environment (VERCEL=1 on Vercel), which writes .vercel/output.
    nitro(),
    viteReact(),
    tailwindcss(),
    tsconfigPaths(),
  ],
});
