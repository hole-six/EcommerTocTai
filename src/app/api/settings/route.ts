import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/server/auth";
import { connectDb } from "@/lib/server/db";
import { apiError } from "@/lib/server/http";
import { imageItem } from "@/lib/server/validators";
import { DEFAULT_QUIZ_CONFIG, normalizeQuizConfig } from "@/lib/hairQuiz";
import { Settings } from "@/models/Settings";

const quizOptionSchema = z.object({
  value: z.string().trim().min(1).max(80),
  label: z.string().trim().min(1).max(160),
  hint: z.string().trim().max(300).optional().default(""),
});
const quizQuestionSchema = z.object({
  id: z.string().trim().min(1).max(80).regex(/^[a-z0-9_-]+$/),
  title: z.string().trim().min(1).max(220),
  eyebrow: z.string().trim().max(80).optional().default(""),
  hint: z.string().trim().max(500).optional().default(""),
  options: z.array(quizOptionSchema).min(1).max(20),
  weight: z.number().int().min(1).max(10).default(1),
  allowSkip: z.boolean().default(false),
  skipValue: z.string().trim().max(80).optional().default(""),
});
const quizConfigSchema = z.object({
  title: z.string().trim().max(160).optional().default(DEFAULT_QUIZ_CONFIG.title ?? ""),
  lead: z.string().trim().max(500).optional().default(DEFAULT_QUIZ_CONFIG.lead ?? ""),
  questions: z.array(quizQuestionSchema).min(1).max(20),
});
const settingsSchema = z.object({
  shippingFee: z.number().int().min(0).max(1000000),
  freeShippingThreshold: z.number().int().min(0).max(100000000),
  faqs: z.array(imageItem).max(50),
  whyChooseUs: z.array(imageItem).max(20),
  quizConfig: quizConfigSchema,
});

export async function GET() {
  try {
    await connectDb();
    const settings = await Settings.findOneAndUpdate(
      { key: "store" },
      { $setOnInsert: { key: "store" } },
      { new: true, upsert: true },
    ).lean();
    return NextResponse.json({
      data: {
        shippingFee: settings.shippingFee,
        freeShippingThreshold: settings.freeShippingThreshold,
        faqs: settings.faqs ?? [],
        whyChooseUs: settings.whyChooseUs ?? [],
        quizConfig: normalizeQuizConfig(settings.quizConfig),
      },
    });
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    await requireAdmin();
    const data = settingsSchema.partial().parse(await request.json());
    await connectDb();
    const settings = await Settings.findOneAndUpdate(
      { key: "store" },
      { $set: data, $setOnInsert: { key: "store" } },
      { new: true, upsert: true },
    );
    return NextResponse.json({
      data: {
        shippingFee: settings.shippingFee,
        freeShippingThreshold: settings.freeShippingThreshold,
        faqs: settings.faqs ?? [],
        whyChooseUs: settings.whyChooseUs ?? [],
        quizConfig: normalizeQuizConfig(settings.quizConfig),
      },
    });
  } catch (error) {
    return apiError(error);
  }
}
