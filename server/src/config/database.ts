// server/src/config/database.ts
import mongoose from "mongoose";

import { env } from "./env.js";

let databaseState: "connected" | "unconfigured" | "disconnected" = "unconfigured";

export function getDatabaseState() {
  return databaseState;
}

export async function connectDatabase() {
  if (!env.MONGODB_URI) {
    databaseState = "unconfigured";
    return false;
  }

  try {
    await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5_000,
      maxPoolSize: 10,
    });
    databaseState = "connected";
    console.log(`✅ MongoDB connected: ${mongoose.connection.name}`);
    return true;
  } catch (error) {
    databaseState = "disconnected";
    console.error("MongoDB connection failed:", error);
    return false;
  }
}

export async function closeDatabase() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  databaseState = "disconnected";
}

export function isDatabaseReady() {
  return databaseState === "connected" && mongoose.connection.readyState === 1;
}