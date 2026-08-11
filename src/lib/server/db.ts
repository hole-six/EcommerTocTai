import mongoose from "mongoose";

const mongoUri = process.env.MONGODB_URI;

type CachedConnection = { connection: typeof mongoose | null; promise: Promise<typeof mongoose> | null };
const globalMongoose = globalThis as typeof globalThis & { mongoose?: CachedConnection };
const cached = globalMongoose.mongoose ?? { connection: null, promise: null };
globalMongoose.mongoose = cached;

export async function connectDb() {
  if (!mongoUri) throw new Error("MONGODB_URI is not configured. Add it to .env.local before using commerce APIs.");
  if (cached.connection) return cached.connection;
  cached.promise ??= mongoose.connect(mongoUri!, { dbName: process.env.MONGODB_DB ?? "toc_tai" });
  cached.connection = await cached.promise;
  return cached.connection;
}
