import { z } from "zod";

export function onlyProvidedFields<T extends Record<string, unknown>>(
  parsed: T,
  raw: unknown,
) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return parsed;
  const source = raw as Record<string, unknown>;
  return Object.fromEntries(
    Object.entries(parsed).filter(([key]) =>
      Object.prototype.hasOwnProperty.call(source, key),
    ),
  ) as Partial<T>;
}

const phone = z
  .string()
  .transform((value) => value.replace(/\s/g, ""))
  .pipe(
    z
      .string()
      .regex(
        /^(0|\+84)(3|5|7|8|9)[0-9]{8}$/,
        "Số điện thoại Việt Nam không hợp lệ",
      ),
  );
export const addressSchema = z.object({
  recipientName: z.string().min(2).max(80),
  phone,
  province: z.string().min(2),
  district: z.string().max(100).default(""),
  ward: z.string().min(2),
  addressLine: z.string().trim().max(300).default(""),
});
export const registerSchema = z.object({
  fullName: z.string().min(2).max(80),
  email: z.string().email("Email không hợp lệ"),
  phone,
  password: z.string().min(8).max(100),
});
export const forgotPasswordSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
});
export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8).max(100),
});
export const loginSchema = z
  .object({
    phone: z.string().min(3).max(100).optional(),
    email: z.string().email().optional(),
    password: z.string().min(8),
  })
  .refine(
    (value) => value.phone || value.email,
    "Cần số điện thoại hoặc email",
  );
export const categorySchema = z.object({
  parent: z.string().length(24).nullable().optional(),
  name: z.string().min(2).max(100),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  description: z.string().max(1000).default(""),
  image: z.string().min(0).default(""),
  bannerImage: z.string().min(0).default(""),
  detailFields: z
    .array(
      z.object({
        key: z.string().regex(/^[a-z0-9_]+$/),
        label: z.string().min(1),
        type: z.enum(["text", "number", "select", "boolean"]),
        required: z.boolean().default(false),
        options: z.array(z.string()).default([]),
      }),
    )
    .default([]),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().min(0).default(0),
});
const imageItem = z
  .object({
    image: z.string().default(""),
    title: z.string().default(""),
    description: z.string().default(""),
    label: z.string().default(""),
    period: z.string().default(""),
    name: z.string().default(""),
    value: z.string().default(""),
  })
  .passthrough();
const optionGroup = z
  .object({
    id: z.string(),
    title: z.string(),
    code: z.string(),
    required: z.boolean().default(false),
    displayType: z
      .enum(["card", "button", "radio", "dropdown"])
      .default("card"),
    options: z
      .array(
        imageItem.extend({
          id: z.string(),
          priceAdjustment: z.number().default(0),
        }),
      )
      .default([]),
  })
  .passthrough();
const quizTags = z
  .object({
    goals: z.array(z.string()).default([]),
    stages: z.array(z.string()).default([]),
    durations: z.array(z.string()).default([]),
    formats: z.array(z.string()).default([]),
    priorities: z.array(z.string()).default([]),
  })
  .default(() => ({ goals: [], stages: [], durations: [], formats: [], priorities: [] }));
const productBaseSchema = z.object({
    category: z.array(z.string().length(24)).min(1),
    name: z.string().min(2).max(180),
    slug: z.string().regex(/^[a-z0-9-]+$/),
    shortDescription: z.string().max(300).default(""),
    description: z.string().max(10000).default(""),
    price: z.number().int().min(0),
    salePrice: z.number().int().min(0).optional(),
    inventory: z.number().int().min(0),
    sku: z.string().min(3).max(60),
    images: z.array(z.string()).max(40).default([]),
    specifications: z
      .record(z.string(), z.union([z.string(), z.number(), z.boolean()]))
      .default({}),
    specificationRows: z
      .array(
        imageItem.extend({
          type: z
            .enum(["text", "number", "boolean", "list", "image"])
            .default("text"),
        }),
      )
      .default([]),
    optionGroups: z.array(optionGroup).default([]),
    quizTags,
    contentBlocks: z.array(z.record(z.string(), z.unknown())).default([]),
    stageImages: z.array(imageItem).default([]),
    howToUse: z.record(z.string(), z.unknown()).default({}),
    rootCauses: z.array(imageItem).default([]),
    detailHighlights: z.array(imageItem).default([]),
    treatmentKit: z.array(imageItem).default([]),
    treatmentJourney: z.array(imageItem).default([]),
    status: z.enum(["draft", "active", "archived"]).default("draft"),
    translations: z
      .object({
        en: z
          .object({
            name: z.string().max(180).default(""),
            shortDescription: z.string().max(300).default(""),
            description: z.string().max(10000).default(""),
            howToUseDescription: z.string().max(2000).default(""),
          })
          .partial()
          .default({}),
      })
      .partial()
      .default({}),
    variantGroup: z.string().max(80).default(""),
    variantLabel: z.string().max(40).default(""),
    variantOrder: z.number().int().default(0),
  });

export const productSchema = productBaseSchema
  .refine(
    (data) => data.salePrice === undefined || data.salePrice <= data.price,
    {
      path: ["salePrice"],
      message: "Giá bán thực tế không thể cao hơn giá gốc",
    },
  );
export const productPatchSchema = productBaseSchema.partial().refine(
  (data) =>
    data.salePrice === undefined ||
    data.price === undefined ||
    data.salePrice <= data.price,
  {
    path: ["salePrice"],
    message: "GiÃ¡ bÃ¡n thá»±c táº¿ khÃ´ng thá»ƒ cao hÆ¡n giÃ¡ gá»‘c",
  },
);
export const orderSchema = z.object({
  customer: z.object({
    fullName: z.string().min(2).max(80),
    phone,
    email: z.string().email().optional(),
  }),
  shippingAddress: addressSchema,
  items: z
    .array(
      z.object({
        productId: z.string().min(1).max(100),
        quantity: z.number().int().min(1).max(20),
        variantId: z.string().max(100).optional(),
        options: z
          .array(
            z.object({
              groupCode: z.string().max(80),
              optionValue: z.string().max(120),
            }),
          )
          .default([]),
      }),
    )
    .min(1)
    .max(50),
  note: z.string().max(500).default(""),
  paymentMethod: z.enum(["cod", "bank_transfer"]).default("cod"),
  saveAddress: z.boolean().default(false),
  couponCode: z.string().min(1).max(30).optional(),
});
export const reviewSchema = z.object({
  productId: z.string().length(24),
  rating: z.number().int().min(1).max(5),
  title: z.string().max(120).default(""),
  body: z.string().min(10).max(2000),
  guestName: z.string().min(2).max(80).optional(),
  guestPhone: phone.optional(),
});
export const couponSchema = z.object({
  code: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[A-Za-z0-9_-]+$/, "Chỉ gồm chữ, số, - và _"),
  type: z.enum(["percent", "fixed"]).default("percent"),
  value: z.number().positive(),
  minOrderValue: z.number().min(0).default(0),
  maxDiscount: z.number().min(0).optional(),
  usageLimit: z.number().int().min(1).optional(),
  expiresAt: z.string().optional(),
  isActive: z.boolean().default(true),
});
export const profileSchema = z.object({
  fullName: z.string().min(2).max(80).optional(),
  email: z.string().email().optional(),
});
export const updatePhoneSchema = z.object({
  phone,
  currentPassword: z.string().min(1),
});
export const accountAddressSchema = addressSchema.extend({
  isDefault: z.boolean().default(false),
});
export const accountAddressUpdateSchema = addressSchema
  .partial()
  .extend({ isDefault: z.boolean().optional() });
