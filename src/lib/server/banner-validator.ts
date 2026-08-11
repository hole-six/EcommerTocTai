import { z } from "zod";

export const bannerSchema = z.object({ placement: z.enum(["home_hero", "home_promo", "category"]).default("home_hero"), image: z.string().min(1), mobileImage: z.string().default(""), alt: z.string().min(2).max(160), title: z.string().max(160).default(""), subtitle: z.string().max(400).default(""), ctaLabel: z.string().max(80).default("Khám phá ngay"), ctaHref: z.string().max(500).default("/shop/all"), isActive: z.boolean().default(true), sortOrder: z.number().int().min(0).default(0) });
