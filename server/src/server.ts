// server/src/server.ts
import { createServer } from "node:http";
// import { Server as SocketServer } from "socket.io";

import { createApp } from "./app.js";
import { connectDatabase } from "./config/database.js";
import { env } from "./config/env.js";
import { attachSocket } from "./realtime/socket.js";

async function start() {
  const databaseConnected = await connectDatabase();
  if (!databaseConnected) {
    console.warn(
      "MongoDB is not configured or unavailable; account writes will return 503.",
    );
  }

  const app = createApp();
  const httpServer = createServer(app);
  attachSocket(httpServer);

  // const io = new SocketServer(httpServer, {
  //   cors: { origin: env.APP_ORIGIN, credentials: true },
  // });

  // io.on("connection", (socket) => {
  //   socket.emit("system:ready", {
  //     service: "abuja-messenger",
  //     timestamp: new Date().toISOString(),
  //   });
  //   socket.on("delivery:join", (trackingCode: string) => {
  //     if (typeof trackingCode === "string" && trackingCode.trim()) {
  //       socket.join(`delivery:${trackingCode.trim().toUpperCase()}`);
  //     }
  //   });
  //   socket.on("delivery:leave", (trackingCode: string) => {
  //     if (typeof trackingCode === "string" && trackingCode.trim()) {
  //       socket.leave(`delivery:${trackingCode.trim().toUpperCase()}`);
  //     }
  //   });
  // });

  httpServer.listen(env.PORT, "0.0.0.0", () => {
    console.log(`🚀 Abuja Messenger API on http://0.0.0.0:${env.PORT}`);
  });
}

start().catch((error) => {
  console.error("Unable to start Abuja Messenger", error);
  process.exit(1);
});