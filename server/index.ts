/**
 * Bootstrap for the LUXORA ESTATES API.
 *
 * Binds API_PORT env or 4000 — the Vite dev app owns 3000 and this file
 * never touches it.
 */
import { createApp, startServer } from "./app";

const PORT = Number(process.env.API_PORT ?? 4000);
const app = createApp();
const server = startServer(app, PORT);

function shutdown(): void {
  server.close(() => process.exit(0));
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);