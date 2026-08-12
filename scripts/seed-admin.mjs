import { readFile } from "node:fs/promises";
import bcrypt from "bcryptjs";
import mongoose, { Schema } from "mongoose";

for (const filename of [".env.local", ".env"]) { try { const text = await readFile(filename, "utf8"); for (const line of text.split(/\r?\n/)) { const match = line.match(/^\s*([A-Z][A-Z0-9_]*)\s*=\s*(.*?)\s*$/); if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, ""); } } catch {} }
const email = process.env.ADMIN_EMAIL ?? process.env.ADMIN_EMAILS?.split(",")[0]?.trim();
const phone = process.env.ADMIN_PHONE; const password = process.env.ADMIN_PASSWORD;
if (!process.env.MONGODB_URI || !email || !phone || !password) throw new Error("Cần MONGODB_URI, ADMIN_EMAIL, ADMIN_PHONE và ADMIN_PASSWORD.");
const address = new Schema({ recipientName: String, phone: String, province: String, district: String, ward: String, addressLine: String, isDefault: Boolean }, { _id: true });
const schema = new Schema({ fullName: String, email: { type: String, lowercase: true, unique: true, sparse: true }, phone: { type: String, unique: true }, passwordHash: String, role: String, addresses: [address] }, { timestamps: true });
const User = mongoose.models.User ?? mongoose.model("User", schema);
await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.MONGODB_DB ?? "toc_tai" });
const user = await User.findOneAndUpdate({ $or: [{ email: email.toLowerCase() }, { phone }] }, { fullName: process.env.ADMIN_NAME ?? "Quản trị viên Tóc Tai", email: email.toLowerCase(), phone, passwordHash: await bcrypt.hash(password, 12), role: "admin" }, { upsert: true, returnDocument: "after", setDefaultsOnInsert: true });
await mongoose.disconnect(); console.log(`Admin ready: ${user.email} (${user.phone})`);
