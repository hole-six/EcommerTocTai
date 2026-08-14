import { readFile } from "node:fs/promises";
import bcrypt from "bcryptjs";
import mongoose, { Schema } from "mongoose";

for (const filename of [".env.local", ".env"]) {
  try {
    const text = await readFile(filename, "utf8");
    for (const line of text.split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Z][A-Z0-9_]*)\s*=\s*(.*?)\s*$/);
      if (match && !process.env[match[1]])
        process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, "");
    }
  } catch {}
}

const email =
  process.env.ADMIN_EMAIL ??
  process.env.ADMIN_EMAILS?.split(",")[0]?.trim() ??
  "admin@carewise.local";
const phone = process.env.ADMIN_PHONE ?? "0900000000";
const username = process.env.ADMIN_USERNAME ?? "admin";
const password = process.env.ADMIN_PASSWORD ?? "admin123456";

if (!process.env.MONGODB_URI)
  throw new Error("Missing MONGODB_URI in .env.local.");

const address = new Schema(
  {
    recipientName: String,
    phone: String,
    province: String,
    district: String,
    ward: String,
    addressLine: String,
    isDefault: Boolean,
  },
  { _id: true },
);

const schema = new Schema(
  {
    fullName: String,
    username: { type: String, lowercase: true, unique: true, sparse: true },
    email: { type: String, lowercase: true, unique: true, sparse: true },
    phone: { type: String, unique: true },
    passwordHash: String,
    role: String,
    isActive: { type: Boolean, default: true },
    addresses: [address],
  },
  { timestamps: true },
);

const User = mongoose.models.User ?? mongoose.model("User", schema);

await mongoose.connect(process.env.MONGODB_URI, {
  dbName: process.env.MONGODB_DB ?? "toc_tai",
  serverSelectionTimeoutMS: 5000,
});

const user = await User.findOneAndUpdate(
  { $or: [{ username }, { email: email.toLowerCase() }, { phone }] },
  {
    fullName: process.env.ADMIN_NAME ?? "Quan tri vien CareWise",
    username,
    email: email.toLowerCase(),
    phone,
    passwordHash: await bcrypt.hash(password, 12),
    role: "admin",
    isActive: true,
  },
  { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
);

await mongoose.disconnect();

console.log(`Admin ready: ${user.username}`);
console.log(`Password: ${password}`);
