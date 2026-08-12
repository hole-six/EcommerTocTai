import { readFile } from "node:fs/promises";
import bcrypt from "bcryptjs";
import mongoose, { Schema } from "mongoose";

async function loadEnv() {
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
}
await loadEnv();
if (!process.env.MONGODB_URI)
  throw new Error("MONGODB_URI is required in .env.local");

const categorySchema = new Schema(
  {
    parent: { type: Schema.Types.ObjectId, default: null, index: true },
    name: String,
    slug: { type: String, unique: true },
    description: String,
    image: String,
    bannerImage: String,
    detailFields: [Schema.Types.Mixed],
    isActive: Boolean,
    sortOrder: Number,
  },
  { timestamps: true },
);
const productSchema = new Schema(
  {
    category: { type: Schema.Types.ObjectId, ref: "Category" },
    name: String,
    slug: { type: String, unique: true },
    shortDescription: String,
    description: String,
    price: Number,
    salePrice: Number,
    inventory: Number,
    reservedInventory: { type: Number, default: 0 },
    sku: { type: String, unique: true },
    images: [String],
    specifications: { type: Map, of: Schema.Types.Mixed },
    specificationRows: [Schema.Types.Mixed],
    optionGroups: [Schema.Types.Mixed],
    contentBlocks: [Schema.Types.Mixed],
    stageImages: [Schema.Types.Mixed],
    howToUse: Schema.Types.Mixed,
    rootCauses: [Schema.Types.Mixed],
    treatmentKit: [Schema.Types.Mixed],
    treatmentJourney: [Schema.Types.Mixed],
    status: String,
    variantGroup: String,
    variantLabel: String,
    variantOrder: Number,
  },
  { timestamps: true, minimize: false },
);
const userSchema = new Schema(
  {
    fullName: String,
    email: { type: String, unique: true, sparse: true },
    phone: { type: String, unique: true },
    passwordHash: String,
    role: String,
    addresses: [Schema.Types.Mixed],
  },
  { timestamps: true },
);
const couponSchema = new Schema(
  {
    code: { type: String, unique: true },
    type: String,
    value: Number,
    minOrderValue: Number,
    maxDiscount: Number,
    usageLimit: Number,
    usedCount: Number,
    expiresAt: Date,
    isActive: Boolean,
  },
  { timestamps: true },
);
const orderSchema = new Schema(
  {
    orderNumber: { type: String, unique: true },
    user: Schema.Types.ObjectId,
    customer: Schema.Types.Mixed,
    shippingAddress: Schema.Types.Mixed,
    items: [Schema.Types.Mixed],
    subtotal: Number,
    shippingFee: Number,
    discount: Number,
    total: Number,
    status: String,
    paymentStatus: String,
    paymentMethod: String,
    inventoryState: String,
  },
  { timestamps: true },
);
const reviewSchema = new Schema(
  {
    product: { type: Schema.Types.ObjectId, index: true },
    user: Schema.Types.ObjectId,
    guestName: String,
    guestPhone: String,
    order: { type: Schema.Types.ObjectId, required: true },
    rating: Number,
    title: String,
    body: String,
    isPublished: Boolean,
  },
  { timestamps: true },
);
const Category =
  mongoose.models.Category ?? mongoose.model("Category", categorySchema);
const Product =
  mongoose.models.Product ?? mongoose.model("Product", productSchema);
const User = mongoose.models.User ?? mongoose.model("User", userSchema);
const Coupon = mongoose.models.Coupon ?? mongoose.model("Coupon", couponSchema);
const Order = mongoose.models.Order ?? mongoose.model("Order", orderSchema);
const Review = mongoose.models.Review ?? mongoose.model("Review", reviewSchema);

const parents = [
  [
    "Tóc & Da đầu",
    "toc-da-dau",
    "Giải pháp chuyên sâu cho tóc mỏng, rụng tóc và da đầu.",
  ],
  ["Râu & Mặt", "rau-mat", "Chăm sóc râu, da mặt và ngoại hình nam giới."],
  ["Dinh dưỡng", "dinh-duong", "Vitamin và sản phẩm hỗ trợ sức khỏe mỗi ngày."],
  [
    "Hiệu suất nam giới",
    "hieu-suat-nam-gioi",
    "Giải pháp cho năng lượng, thể lực và phong độ.",
  ],
  [
    "Da & Chăm sóc cá nhân",
    "da-cham-soc-ca-nhan",
    "Routine chăm sóc da và cơ thể đơn giản, hiệu quả.",
  ],
  [
    "Vệ sinh nam giới",
    "ve-sinh-nam-gioi",
    "Sản phẩm vệ sinh dịu nhẹ cho nhu cầu hằng ngày.",
  ],
];
const children = [
  ["Tóc mọc lại", "toc-moc-lai", "toc-da-dau"],
  ["Chống rụng tóc", "chong-rung-toc", "toc-da-dau"],
  ["Chăm sóc da đầu", "cham-soc-da-dau", "toc-da-dau"],
  ["Mọc râu", "moc-rau", "rau-mat"],
  ["Chăm sóc râu", "cham-soc-rau", "rau-mat"],
  ["Chăm sóc da mặt", "cham-soc-da-mat", "rau-mat"],
  ["Vitamin & khoáng chất", "vitamin-khoang-chat", "dinh-duong"],
  ["Thể thao", "the-thao", "dinh-duong"],
  ["Năng lượng", "nang-luong", "hieu-suat-nam-gioi"],
  ["Sinh lý nam", "sinh-ly-nam", "hieu-suat-nam-gioi"],
  ["Sữa rửa mặt", "sua-rua-mat", "da-cham-soc-ca-nhan"],
  ["Routine chăm sóc da", "routine-cham-soc-da", "da-cham-soc-ca-nhan"],
  ["Vệ sinh cơ thể", "ve-sinh-co-the", "ve-sinh-nam-gioi"],
  ["Vệ sinh nhạy cảm", "ve-sinh-nhay-cam", "ve-sinh-nam-gioi"],
];
const products = [
  [
    "Minoxifin + Nourish Hair Growth Kit",
    "minoxifin-nourish-hair-growth-kit",
    "minoxifin-nourish",
    "toc-moc-lai",
    1198000,
    1348000,
    "Tóc mọc lại · Routine chuyên gia",
  ],
  [
    "Hair Gummies Biotin & Zinc",
    "hair-gummies-biotin-zinc",
    "minoxifin-nourish",
    "chong-rung-toc",
    399000,
    449000,
    "Biotin, Zinc và vitamin cho tóc chắc khỏe",
  ],
  [
    "Hair Gummies + Minoxidil Stage 2 Kit",
    "stage-2-hair-regrowth-kit",
    "minoxifin-nourish",
    "toc-moc-lai",
    1198000,
    1348000,
    "Giải pháp cho tóc mỏng và đường chân tóc lùi",
  ],
  [
    "Beard Growth Kit",
    "beard-growth-kit",
    "beard-growth-kit",
    "moc-rau",
    899000,
    999000,
    "Routine giúp râu trông dày và đều hơn",
  ],
  [
    "Beard Growth Serum",
    "beard-growth-serum",
    "beard-growth-kit",
    "cham-soc-rau",
    499000,
    549000,
    "Serum chăm sóc vùng râu hằng ngày",
  ],
  [
    "Creatine Monohydrate Powder",
    "creatine-monohydrate-powder",
    "creatine",
    "the-thao",
    699000,
    799000,
    "Bổ sung creatine cho routine tập luyện",
  ],
  [
    "Shilajit Gummies",
    "shilajit-gummies",
    "shilajit",
    "nang-luong",
    599000,
    699000,
    "Gummies hỗ trợ năng lượng và sức bền",
  ],
  [
    "Men's Face Wash for Oily Skin",
    "mens-face-wash-oily-skin",
    "face-wash",
    "sua-rua-mat",
    299000,
    349000,
    "Làm sạch dầu thừa mà không gây khô da",
  ],
  [
    "Daily Face Care Routine",
    "daily-face-care-routine",
    "face-wash",
    "routine-cham-soc-da",
    699000,
    799000,
    "Routine 2 bước cho da sạch và cân bằng",
  ],
  [
    "Swash Intimate Wash 120ml",
    "swash-intimate-wash-120ml",
    "swash",
    "ve-sinh-nhay-cam",
    249000,
    299000,
    "Vệ sinh dịu nhẹ, pH cân bằng",
  ],
  [
    "Body Care & Hygiene Kit",
    "body-care-hygiene-kit",
    "swash",
    "ve-sinh-co-the",
    449000,
    499000,
    "Bộ chăm sóc cơ thể tiện lợi hằng ngày",
  ],
  [
    "Advanced Hair Care Routine",
    "advanced-hair-care-routine",
    "minoxifin-nourish",
    "cham-soc-da-dau",
    1499000,
    1699000,
    "Routine chuyên sâu cho da đầu và tóc",
  ],
  [
    "Oil Control Face Serum",
    "oil-control-face-serum",
    "face-wash",
    "cham-soc-da-mat",
    429000,
    499000,
    "Serum cân bằng dầu và chăm sóc bề mặt da",
  ],
  [
    "Daily Multivitamin Men",
    "daily-multivitamin-men",
    "shilajit",
    "vitamin-khoang-chat",
    359000,
    429000,
    "Vitamin và khoáng chất thiết yếu mỗi ngày",
  ],
  [
    "Zinc & Magnesium Recovery",
    "zinc-magnesium-recovery",
    "creatine",
    "vitamin-khoang-chat",
    389000,
    459000,
    "Hỗ trợ phục hồi sau tập luyện và giấc ngủ",
  ],
  [
    "Men's Vitality Support",
    "mens-vitality-support",
    "shilajit",
    "sinh-ly-nam",
    649000,
    749000,
    "Công thức hỗ trợ năng lượng và phong độ nam giới",
  ],
  [
    "Beard & Face Complete Routine",
    "beard-face-complete-routine",
    "beard-growth-kit",
    "cham-soc-da-mat",
    799000,
    949000,
    "Routine râu và da mặt gọn trong một bộ",
  ],
];

const manifest = JSON.parse(
  await readFile(
    "public/sites/manmatters-com-61d14dee/product-assets/manifest.json",
    "utf8",
  ),
);
const assetsFor = (key) =>
  manifest.assets
    .filter(
      (asset) =>
        asset.product === key &&
        !/logo|search|profile|cart|icon/i.test(asset.localPath),
    )
    .map((asset) => asset.localPath)
    .slice(0, 12);
const item = (title, description, image = "", extra = {}) => ({
  title,
  description,
  image,
  ...extra,
});
function richContent(name, key) {
  const images = assetsFor(key);
  const image = images[0] ?? "";
  return {
    images,
    shortDescription: name,
    description: `${name} được thiết kế theo routine đơn giản, dễ duy trì. Sử dụng đều đặn theo hướng dẫn để theo dõi sự thay đổi và điều chỉnh phù hợp với nhu cầu cá nhân.\n\nSản phẩm được lựa chọn theo tiêu chí thành phần rõ ràng, trải nghiệm tiện lợi và phù hợp với routine chăm sóc hiện đại.`,
    specifications: {
      "Thương hiệu": "Tóc Tai",
      "Đối tượng": "Nam giới",
      "Dạng sản phẩm": "Routine chăm sóc",
      "Xuất xứ": "Chính hãng",
      "Bảo quản": "Nơi khô ráo, tránh ánh nắng",
    },
    specificationRows: [
      { name: "Thương hiệu", value: "Tóc Tai" },
      { name: "Đối tượng", value: "Nam giới" },
      { name: "Dạng sản phẩm", value: "Routine chăm sóc" },
      { name: "Dung tích / quy cách", value: "Theo từng sản phẩm" },
    ],
    stageImages: [
      item(
        "Stage 1 · Tóc mỏng",
        "Bắt đầu với routine nền tảng để chăm sóc da đầu.",
        images[1] ?? image,
      ),
      item(
        "Stage 2 · Đường chân tóc",
        "Tập trung cho tình trạng tóc mỏng và đường chân tóc.",
        images[2] ?? image,
      ),
      item(
        "Stage 3 · Mật độ tóc",
        "Duy trì routine đều đặn và theo dõi tiến triển.",
        images[3] ?? image,
      ),
      item(
        "Stage 4 · Chăm sóc chuyên sâu",
        "Kết hợp chăm sóc da đầu và lối sống lành mạnh.",
        images[4] ?? image,
      ),
    ],
    howToUse: item(
      "How to use",
      "Dùng theo liều lượng ghi trên bao bì. Duy trì đều đặn mỗi ngày và theo dõi phản hồi của cơ thể.",
      images[5] ?? image,
    ),
    rootCauses: [
      item(
        "Dinh dưỡng",
        "Chế độ ăn thiếu một số vi chất có thể ảnh hưởng đến tóc và da.",
        images[6] ?? image,
      ),
      item(
        "Di truyền / hormone",
        "Các yếu tố nội sinh có thể tác động đến mật độ và chu kỳ tóc.",
        images[7] ?? image,
      ),
      item(
        "Lối sống",
        "Căng thẳng, thiếu ngủ và chăm sóc chưa phù hợp cũng cần được cải thiện.",
        images[8] ?? image,
      ),
    ],
    treatmentKit: [
      item(
        "Sản phẩm chính",
        "Thành phần trọng tâm của routine, sử dụng theo hướng dẫn.",
        images[9] ?? image,
      ),
      item(
        "Dưỡng chất hỗ trợ",
        "Bổ sung dưỡng chất để routine cân bằng và dễ duy trì.",
        images[10] ?? image,
      ),
    ],
    treatmentJourney: [
      item(
        "Sau 2 tháng",
        "Bắt đầu hình thành thói quen và theo dõi tình trạng tóc/da.",
        images[3] ?? image,
        { period: "2 months" },
      ),
      item(
        "Sau 3 tháng",
        "Duy trì đều đặn để quan sát sự thay đổi rõ hơn.",
        images[4] ?? image,
        { period: "3 months" },
      ),
      item(
        "Sau 6 tháng",
        "Đánh giá lại routine và điều chỉnh theo nhu cầu.",
        images[5] ?? image,
        { period: "6 months" },
      ),
    ],
    contentBlocks: [
      item(
        "Expert designed",
        "Công thức và nội dung được trình bày rõ ràng để bạn dễ bắt đầu.",
        images[6] ?? image,
      ),
      item(
        "Daily routine",
        "Thiết kế gọn để tích hợp vào thói quen chăm sóc mỗi ngày.",
        images[7] ?? image,
      ),
    ],
    optionGroups: [
      {
        id: "duration",
        title: "Chọn thời gian sử dụng",
        code: "duration",
        required: true,
        displayType: "button",
        options: [
          {
            id: "1-month",
            label: "1 Month",
            value: "1-month",
            image: images[1] ?? image,
          },
          {
            id: "2-months",
            label: "2 Months",
            value: "2-months",
            image: images[2] ?? image,
            priceAdjustment: 99000,
          },
          {
            id: "3-months",
            label: "3 Months",
            value: "3-months",
            image: images[3] ?? image,
            priceAdjustment: 199000,
          },
        ],
      },
    ],
  };
}

await mongoose.connect(process.env.MONGODB_URI, {
  dbName: process.env.MONGODB_DB ?? "toc_tai",
});
const parentIds = new Map();
for (let index = 0; index < parents.length; index += 1) {
  const [name, slug, description] = parents[index];
  const doc = await Category.findOneAndUpdate(
    { slug },
    {
      name,
      slug,
      parent: null,
      description,
      image: assetsFor("minoxifin-nourish")[0] ?? "",
      bannerImage: assetsFor("minoxifin-nourish")[1] ?? "",
      detailFields: [
        {
          key: "concern",
          label: "Nhu cầu",
          type: "select",
          options: ["Mới bắt đầu", "Đang duy trì", "Chuyên sâu"],
        },
      ],
      isActive: true,
      sortOrder: index,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
  parentIds.set(slug, doc._id);
}
await Category.updateMany(
  {
    slug: {
      $in: ["toc", "rau", "suc-khoe-the-hinh", "hieu-suat", "da", "ve-sinh"],
    },
  },
  { $set: { isActive: false } },
);
const childIds = new Map();
for (let index = 0; index < children.length; index += 1) {
  const [name, slug, parentSlug] = children[index];
  const doc = await Category.findOneAndUpdate(
    { slug },
    {
      name,
      slug,
      parent: parentIds.get(parentSlug),
      description: `Danh mục ${name.toLowerCase()} thuộc nhóm ${parentSlug}.`,
      image: assetsFor("minoxifin-nourish")[2] ?? "",
      bannerImage: assetsFor("minoxifin-nourish")[3] ?? "",
      detailFields: [
        { key: "routine", label: "Routine đề xuất", type: "text" },
        {
          key: "duration",
          label: "Thời gian sử dụng",
          type: "select",
          options: ["1 tháng", "3 tháng", "6 tháng"],
        },
      ],
      isActive: true,
      sortOrder: index,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
  childIds.set(slug, doc._id);
}
for (let index = 0; index < products.length; index += 1) {
  const [
    name,
    slug,
    assetKey,
    childSlug,
    salePrice,
    originalPrice,
    shortDescription,
  ] = products[index];
  const content = richContent(name, assetKey);
  const doc = {
    name,
    slug,
    sku: `TT-${String(index + 1).padStart(4, "0")}`,
    category: childIds.get(childSlug),
    price: originalPrice,
    salePrice,
    inventory: 100 + index * 7,
    reservedInventory: 0,
    status: "active",
    variantGroup:
      childSlug.includes("toc") || childSlug === "moc-rau"
        ? "hair-care-stages"
        : "",
    variantLabel: childSlug,
    variantOrder: index,
    ...content,
    contentBlocks: content.contentBlocks,
  };
  await Product.findOneAndUpdate({ slug }, doc, {
    upsert: true,
    new: true,
    setDefaultsOnInsert: true,
  });
  console.log(`Seeded ${name}`);
}
const allProducts = await Product.find().select("_id slug").lean();
const productBySlug = new Map(
  allProducts.map((product) => [product.slug, product]),
);
const hairStages = [
  "hair-gummies-biotin-zinc",
  "stage-2-hair-regrowth-kit",
  "minoxifin-nourish-hair-growth-kit",
  "advanced-hair-care-routine",
];
for (const product of await Product.find({ status: "active" })) {
  const links = hairStages
    .map((slug) => productBySlug.get(slug))
    .filter(Boolean);
  const stages = (product.stageImages ?? []).map((stage, index) => {
    const target = links[index] ?? product;
    return {
      ...stage,
      targetProductId: target._id.toString(),
      targetProductSlug: target.slug,
    };
  });
  await Product.updateOne(
    { _id: product._id },
    { $set: { stageImages: stages } },
  );
}
const passwordHash = await bcrypt.hash("customer123", 10);
const demoUsers = [
  ["Nguyễn Minh Anh", "0901234567", "minh.anh@example.com", "Hà Nội"],
  ["Trần Quốc Huy", "0912345678", "quoc.huy@example.com", "Hồ Chí Minh"],
  ["Lê Hoàng Nam", "0987654321", "hoang.nam@example.com", "Đà Nẵng"],
  ["Phạm Gia Bảo", "0934567890", "gia.bao@example.com", "Hà Nội"],
  ["Đỗ Đức Long", "0968123456", "duc.long@example.com", "Cần Thơ"],
  ["Vũ Thanh Tùng", "0978123456", "thanh.tung@example.com", "Hải Phòng"],
];
for (const [fullName, phone, email, province] of demoUsers)
  await User.findOneAndUpdate(
    { phone },
    {
      $set: {
        fullName,
        phone,
        email,
        passwordHash,
        role: "customer",
        addresses: [
          {
            recipientName: fullName,
            phone,
            province,
            district: "",
            ward: "Phường trung tâm",
            addressLine: "Số 25 Đường Mẫu",
            isDefault: true,
          },
        ],
      },
    },
    { upsert: true, setDefaultsOnInsert: true },
  );
const coupons = [
  {
    code: "WELCOME10",
    type: "percent",
    value: 10,
    minOrderValue: 300000,
    maxDiscount: 100000,
    usageLimit: 500,
    usedCount: 18,
    isActive: true,
  },
  {
    code: "TOCTAI15",
    type: "percent",
    value: 15,
    minOrderValue: 800000,
    maxDiscount: 200000,
    usageLimit: 200,
    usedCount: 37,
    isActive: true,
  },
  {
    code: "FREESHIP",
    type: "fixed",
    value: 30000,
    minOrderValue: 299000,
    maxDiscount: null,
    usageLimit: 1000,
    usedCount: 92,
    isActive: true,
  },
  {
    code: "COMBO100",
    type: "fixed",
    value: 100000,
    minOrderValue: 1200000,
    maxDiscount: null,
    usageLimit: 100,
    usedCount: 11,
    isActive: true,
  },
  {
    code: "HETHANG",
    type: "percent",
    value: 20,
    minOrderValue: 500000,
    maxDiscount: 150000,
    usageLimit: 50,
    usedCount: 50,
    isActive: false,
  },
];
for (const coupon of coupons)
  await Coupon.findOneAndUpdate(
    { code: coupon.code },
    { $set: { ...coupon, expiresAt: new Date("2027-12-31") } },
    { upsert: true, setDefaultsOnInsert: true },
  );
const reviewers = await User.find({
  phone: { $in: demoUsers.map((user) => user[1]) },
})
  .select("_id fullName phone email addresses")
  .lean();
const reviewTemplates = [
  [
    5,
    "Sản phẩm rất đáng tiền",
    "Dùng đều đặn thấy trải nghiệm tốt, đóng gói cẩn thận và hướng dẫn rõ ràng. Mình sẽ tiếp tục duy trì routine này.",
  ],
  [
    5,
    "Hiệu quả và dễ dùng",
    "Chất lượng tốt, kết cấu dễ sử dụng mỗi ngày. Sau một thời gian mình thấy thói quen chăm sóc thay đổi tích cực hơn.",
  ],
  [
    5,
    "Sẽ mua lại",
    "Giao hàng nhanh, sản phẩm đúng mô tả và phù hợp với nhu cầu của mình. Rất hài lòng với trải nghiệm tổng thể.",
  ],
  [
    4,
    "Trải nghiệm tốt",
    "Sản phẩm dễ dùng, thông tin minh bạch và chất lượng ổn. Mình sẽ theo dõi thêm trong routine dài hạn.",
  ],
];
let reviewIndex = 0;
for (const product of await Product.find({ status: "active" })
  .select("_id name sku salePrice price images")
  .lean()) {
  for (let offset = 0; offset < 3; offset += 1) {
    const reviewer = reviewers[reviewIndex % reviewers.length];
    const [rating, title, body] =
      reviewTemplates[reviewIndex % reviewTemplates.length];
    const orderNumber = `TT-REVIEW-${String(reviewIndex + 1).padStart(3, "0")}`;
    const unitPrice = product.salePrice ?? product.price;
    const order = await Order.findOneAndUpdate(
      { orderNumber },
      {
        $set: {
          orderNumber,
          user: reviewer._id,
          customer: {
            fullName: reviewer.fullName,
            phone: reviewer.phone,
            email: reviewer.email,
          },
          shippingAddress: reviewer.addresses?.[0] ?? {
            recipientName: reviewer.fullName,
            phone: reviewer.phone,
            province: "Hà Nội",
            district: "",
            ward: "Phường trung tâm",
            addressLine: "25 Đường Mẫu",
          },
          items: [
            {
              product: product._id,
              name: product.name,
              sku: product.sku,
              quantity: 1,
              unitPrice,
              image: product.images?.[0] ?? "",
            },
          ],
          subtotal: unitPrice,
          shippingFee: 0,
          discount: 0,
          total: unitPrice,
          status: "completed",
          paymentStatus: "paid",
          paymentMethod: "bank_transfer",
          inventoryState: "committed",
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    await Review.findOneAndUpdate(
      { product: product._id, order: order._id },
      {
        $set: {
          product: product._id,
          order: order._id,
          user: reviewer._id,
          guestName: "",
          guestPhone: "",
          rating,
          title,
          body,
          isPublished: true,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    reviewIndex += 1;
  }
}
await mongoose.disconnect();
console.log(
  `Seed complete: ${parents.length} parent categories, ${children.length} child categories, ${products.length} products, ${demoUsers.length} customer accounts, ${coupons.length} coupons and ${reviewIndex} published reviews.`,
);
