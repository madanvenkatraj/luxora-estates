/**
 * Starts the full LUXORA ESTATES dev stack as one process group:
 *   - API server (Express, port 4000) via tsx
 *   - Frontend dev server (Vite, port 3000, proxies /api -> 4000)
 *
 * Used by the platform's "Start application" workflow so the Run button
 * boots both halves together. If either child exits, the launcher exits
 * too so the platform restarts the pair cleanly instead of half a stack.
 */
import { spawn } from "node:child_process";

const children = [];

function start(name, scriptPath, extraArgs = []) {
  const child = spawn(process.execPath, [scriptPath, ...extraArgs], {
    stdio: ["ignore", "pipe", "pipe"],
    env: process.env,
  });
  child.stdout.on("data", (chunk) => {
    process.stdout.write(`[${name}] ${chunk}`);
  });
  child.stderr.on("data", (chunk) => {
    process.stderr.write(`[${name}] ${chunk}`);
  });
  let shuttingDown = false;
  child.on("exit", (code) => {
    if (shuttingDown) return;
    shuttingDown = true;
    process.stderr.write(`[${name}] exited with code ${code ?? 1}\n`);
    // Process-group semantics: when one half dies, take the other down
    // with it so no orphaned child holds a port.
    for (const sibling of children) {
      if (sibling !== child && sibling.exitCode === null) sibling.kill("SIGTERM");
    }
    process.exit(code ?? 1);
  });
  children.push(child);
}

start("api", "node_modules/tsx/dist/cli.mjs", ["server/index.ts"]);
// The web half inherits PORT (the preview harness sets it); vite and the
// proxy read API_PORT themselves, so the halves always agree.
start(
  "web",
  "node_modules/vite/bin/vite.js",
  ["--port", process.env.PORT ?? "3000"],
);

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    for (const child of children) child.kill(signal);
    process.exit(0);
  });
}

/** Keep the parent alive while children run; children pipe output and
 * their exit handlers terminate the parent. */
setInterval(() => {}, 60_000);