// server/src/realtime/socket.ts
import type { Server as HttpServer } from "http";
import { Server as SocketServer } from "socket.io";

import { env } from "../config/env.js";

export function attachSocket(server: HttpServer) {
  const io = new SocketServer(server, {
    cors: { origin: env.APP_ORIGIN, credentials: true },
  });

  io.on("connection", (socket) => {
    socket.on("track:join", (trackingCode: string) => {
      if (typeof trackingCode !== "string" || trackingCode.length > 32) return;
      socket.join(`delivery:${trackingCode.toUpperCase()}`);
    });

    socket.on("track:leave", (trackingCode: string) => {
      socket.leave(`delivery:${trackingCode.toUpperCase()}`);
    });
  });

  return io;
}