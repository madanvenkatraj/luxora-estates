/**
 * Bootstrap for the LUXORA ESTATES API / production server.
 *
 * In production a host injects PORT — that wins. API_PORT keeps dev
 * parity (the Vite dev app owns 3000; this file never touches it), and
 * 4000 is the historical default. In production NODE_ENV the same app
 * also serves dist/ statically (see app.ts).
 */
import { createApp, startServer } from "./app";

const PORT = Number(process.env.PORT ?? process.env.API_PORT ?? 4000);
const app = createApp();
const server = startServer(app, PORT);

function shutdown(): void {
  server.close(() => process.exit(0));
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);