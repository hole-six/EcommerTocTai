"use client";

import {
  BookOpen,
  ChevronDown,
  CircleAlert,
  Copy,
  ExternalLink,
  FileText,
  Images,
  ImagePlus,
  Info,
  LayoutGrid,
  Languages,
  Layers,
  ListChecks,
  Package,
  Plus,
  RefreshCw,
  Route,
  SlidersHorizontal,
  Sparkles,
  Star,
  Tag,
  Target,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { MediaLibraryModal } from "@/components/admin/MediaLibraryModal";
import { SearchableSelect } from "@/components/admin/SearchableSelect";
import panel from "@/components/admin/admin-panel.module.css";
import styles from "@/components/admin/product-form.module.css";
import { showToast } from "@/components/ui/Toast";
import { extractApiError } from "@/lib/client/errors";
import {
  DEFAULT_QUIZ_CONFIG,
  emptyQuizTags,
  normalizeQuizConfig,
  type QuizConfig,
  type QuizTags,
} from "@/lib/hairQuiz";

type CategoryOption = { _id: string; label: string };
export type Item = {
  id?: string;
  targetProductId?: string;
  targetProductSlug?: string;
  title: string;
  description: string;
  image: string;
  label: string;
  period: string;
  name: string;
  value: string;
  type?: string;
};
type Option = Item & { id: string; priceAdjustment: number };
type OptionGroup = {
  id: string;
  title: string;
  code: string;
  required: boolean;
  displayType: "card" | "button" | "radio" | "dropdown";
  pricingMode?: "replace" | "addon";
  options: Option[];
};
type StageProductOption = { id: string; slug: string; name: string };
type CopySourceProduct = ProductInitial & {
  _id?: string;
  id?: string;
  sku?: string;
};
type AdditionalInfoRow = { name: string; value: string };
type AdditionalInfoGroup = { title: string; rows: AdditionalInfoRow[] };
export type ProductInitial = {
  _id?: string;
  category: (string | { _id: string })[];
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  price: number;
  salePrice?: number;
  inventory: number;
  sku: string;
  images: string[];
  specifications?: Record<string, string | number | boolean>;
  specificationRows?: Item[];
  optionGroups?: OptionGroup[];
  contentBlocks?: Item[];
  stageImages?: Item[];
  howToUse?: Item;
  rootCauses?: Item[];
  detailHighlights?: Item[];
  treatmentKit?: Item[];
  treatmentJourney?: Item[];
  additionalInfo?: AdditionalInfoGroup[];
  status: "draft" | "active" | "archived";
  isBestSeller?: boolean;
  variantGroup?: string;
  variantLabel?: string;
  variantOrder?: number;
  quizTags?: QuizTags;
  translations?: { en?: { name?: string; shortDescription?: string; description?: string; howToUseDescription?: string } };
};
type ProductFormDraft = {
  name: string;
  slug: string;
  categoryIds: string[];
  sku: string;
  price: string;
  salePrice: string;
  discountPercent: string;
  inventory: string;
  status: ProductInitial["status"];
  shortDescription: string;
  description: string;
  images: string[];
  specs: Item[];
  stageImages: Item[];
  rootCauses: Item[];
  detailHighlights: Item[];
  treatmentKit: Item[];
  journey: Item[];
  additionalInfo: AdditionalInfoGroup[];
  howToUse: Item;
  blocks: Item[];
  groups: OptionGroup[];
  quizTags: QuizTags;
  enName: string;
  enShortDescription: string;
  enDescription: string;
  enHowToUse: string;
};

export const emptyItem = (): Item => ({
  title: "",
  description: "",
  image: "",
  label: "",
  period: "",
  name: "",
  value: "",
});
const emptyOption = (): Option => ({
  ...emptyItem(),
  id: `option-${Date.now()}-${Math.random()}`,
  priceAdjustment: 0,
});
const emptyGroup = (): OptionGroup => ({
  id: `group-${Date.now()}-${Math.random()}`,
  title: "",
  code: "",
  required: false,
  displayType: "card",
  options: [emptyOption()],
});
const copyId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random()}`;
const cloneItems = <T extends { image?: string }>(items?: T[]) =>
  (items ?? []).map((item) => ({ ...item }));
const cloneAdditionalInfo = (groups?: AdditionalInfoGroup[]) =>
  (groups ?? []).map((group) => ({
    title: group.title ?? "",
    rows: (group.rows ?? []).map((row) => ({
      name: row.name ?? "",
      value: row.value ?? "",
    })),
  }));
const cloneOptionGroups = (groups?: OptionGroup[]) =>
  (groups ?? []).map((group) => ({
    ...group,
    id: copyId("group"),
    options: (group.options ?? []).map((option) => ({
      ...option,
      id: copyId("option"),
    })),
  }));
const slugify = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
const generateSku = (slugValue: string) => {
  const initialsFromSlug = slugValue
    .split("-")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 6)
    .toUpperCase();
  const random = Math.floor(1000 + Math.random() * 9000);
  return `${initialsFromSlug || "SP"}-${random}`;
};
const statusLabel = {
  draft: "Bản nháp",
  active: "Đang bán",
  archived: "Ngừng bán",
} as const;
const NEW_PRODUCT_DRAFT_KEY = "toctai_admin_product_new_draft";

const navItems = [
  ["images", Images, "Ảnh sản phẩm"],
  ["copyContent", Copy, "Copy content"],
  ["basic", Info, "Thông tin cơ bản"],
  ["pricing", Tag, "Giá & tồn kho"],
  ["stages", Layers, "Ảnh giai đoạn"],
  ["variants", SlidersHorizontal, "Biến thể"],
  ["description", FileText, "Mô tả"],
  ["causes", CircleAlert, "Nguyên nhân"],
  ["howto", BookOpen, "Hướng dẫn dùng"],
  ["kit", Package, "Chi tiết: Thành phần bộ"],
  ["journey", Route, "Lộ trình điều trị"],
  ["specs", ListChecks, "Thông số"],
  ["blocks", LayoutGrid, "Nội dung tùy biến"],
  ["additionalInfo", Info, "Thông tin bổ sung"],
  ["quiz", Target, "Gắn thẻ bài test tóc"],
  ["quiz", Target, "Gắn thẻ bài test tóc"],
] as const;

export function UploadField({
  value,
  onChange,
  label = "Chọn ảnh",
}: {
  value: string;
  onChange: (value: string) => void;
  label?: string;
}) {
  const [libraryOpen, setLibraryOpen] = useState(false);
  return (
    <div className={panel["admin-upload"]}>
      {value && (
        <div className={panel["admin-upload-preview"]}>
          <img src={value} alt="" />
          <button
            type="button"
            onClick={() => onChange("")}
            aria-label="Xóa ảnh"
          >
            <Trash2 size={14} />
          </button>
        </div>
      )}
      <button
        type="button"
        className={panel["admin-upload-button"]}
        onClick={() => setLibraryOpen(true)}
      >
        <ImagePlus size={14} /> {value ? "Đổi ảnh" : label}
      </button>
      {libraryOpen && (
        <MediaLibraryModal
          initialSelected={value ? [value] : []}
          onClose={() => setLibraryOpen(false)}
          onSelect={(urls) => onChange(urls[0] ?? "")}
        />
      )}
    </div>
  );
}

function TagChipGroup({
  title,
  hint,
  options,
  selected,
  onToggle,
}: {
  title: string;
  hint?: string;
  options: { value: string; label: string; hint?: string }[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <div className={styles.tagGroup}>
      <p className={styles.tagGroupTitle}>{title}</p>
      {hint && <p className={styles.fieldHint}>{hint}</p>}
      <div className={styles.tagChips}>
        {options.map((option) => {
          const active = selected.includes(option.value);
          return (
            <button
              type="button"
              key={option.value}
              className={`${styles.tagChip} ${active ? styles.tagChipActive : ""}`}
              title={option.hint}
              onClick={() => onToggle(option.value)}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function ItemEditor({
  item,
  onChange,
  onRemove,
  heading = "Nội dung",
}: {
  item: Item;
  onChange: (patch: Partial<Item>) => void;
  onRemove: () => void;
  heading?: string;
}) {
  return (
    <div className={panel["admin-repeat-card"]}>
      <div className={panel["admin-repeat-head"]}>
        <b>{heading}</b>
        <button type="button" className={panel.dangerButton} onClick={onRemove}>
          <Trash2 size={14} /> Xóa
        </button>
      </div>
      <div className={panel.grid2}>
        <div className={panel.grid2}>
          <label>
            Tiêu đề
            <input
              value={item.title}
              onChange={(event) => onChange({ title: event.target.value })}
            />
          </label>
          <label>
            Nhãn / mốc thời gian
            <input
              value={item.label || item.period}
              onChange={(event) =>
                onChange({
                  label: event.target.value,
                  period: event.target.value,
                })
              }
            />
          </label>
          <label style={{ gridColumn: "1 / -1" }}>
            Mô tả
            <textarea
              rows={3}
              value={item.description || item.value}
              onChange={(event) =>
                onChange({
                  description: event.target.value,
                  value: event.target.value,
                })
              }
            />
          </label>
          <label>
            Tên hiển thị
            <input
              value={item.name}
              onChange={(event) => onChange({ name: event.target.value })}
            />
          </label>
          <label>
            Giá trị
            <input
              value={item.value}
              onChange={(event) => onChange({ value: event.target.value })}
            />
          </label>
          <div>
            <span className={panel["admin-field-label"]}>Ảnh minh họa</span>
            <UploadField
              value={item.image}
              onChange={(image) => onChange({ image })}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

const SELF_TARGET = "__self__";

function StageEditor({
  item,
  index,
  productOptions,
  currentId,
  currentSlug,
  currentName,
  onChange,
  onRemove,
}: {
  item: Item;
  index: number;
  productOptions: StageProductOption[];
  currentId?: string;
  currentSlug: string;
  currentName: string;
  onChange: (patch: Partial<Item>) => void;
  onRemove: () => void;
}) {
  const [libraryOpen, setLibraryOpen] = useState(false);
  const selfOption: StageProductOption = {
    id: currentId || SELF_TARGET,
    slug: currentSlug || SELF_TARGET,
    name: currentName
      ? `${currentName} (sản phẩm đang tạo)`
      : "Sản phẩm này (đang tạo)",
  };
  const options = [selfOption, ...productOptions];
  const isSelf = Boolean(
    currentSlug && item.targetProductSlug === currentSlug,
  );
  const selectValue = isSelf ? selfOption.id : (item.targetProductId ?? "");
  return (
    <div className={panel["admin-repeat-card"]}>
      <div className={panel["admin-repeat-head"]}>
        <b>Giai đoạn {index + 1}</b>
        <button type="button" className={panel.dangerButton} onClick={onRemove}>
          <Trash2 size={14} /> Xóa
        </button>
      </div>
      <div className={styles.stageCard}>
        {item.image ? (
          <div className={styles.stageImagePreview}>
            <img src={item.image} alt="" />
            <button
              type="button"
              onClick={() => onChange({ image: "" })}
              aria-label="Xóa ảnh"
            >
              <Trash2 size={13} />
            </button>
            <button
              type="button"
              className={styles.stageImageChange}
              onClick={() => setLibraryOpen(true)}
            >
              Đổi ảnh
            </button>
          </div>
        ) : (
          <button
            type="button"
            className={styles.stageImageEmpty}
            onClick={() => setLibraryOpen(true)}
          >
            <ImagePlus size={22} /> Tải ảnh giai đoạn
          </button>
        )}
        <div className={styles.stageFields}>
          <label>
            Tên giai đoạn
            <input
              value={item.title}
              onChange={(event) => onChange({ title: event.target.value })}
              placeholder="VD: Giai đoạn 1 - Mới rụng tóc"
            />
          </label>
          <label>
            Sản phẩm liên kết
            <SearchableSelect
              value={selectValue}
              onChange={(value) => {
                const selected = options.find((product) => product.id === value);
                onChange({
                  targetProductId: selected?.id ?? "",
                  targetProductSlug: selected?.slug ?? "",
                });
              }}
              options={options.map((product) => ({
                value: product.id,
                label: product.name,
                keywords: product.slug,
              }))}
              placeholder="Chọn sản phẩm liên kết"
              searchPlaceholder="Tìm tên hoặc slug sản phẩm..."
              clearLabel="Không liên kết sản phẩm"
            />
          </label>
        </div>
      </div>
      {libraryOpen && (
        <MediaLibraryModal
          initialSelected={item.image ? [item.image] : []}
          onClose={() => setLibraryOpen(false)}
          onSelect={(urls) => onChange({ image: urls[0] ?? "" })}
        />
      )}
    </div>
  );
}

function Section({
  id,
  icon: Icon,
  title,
  description,
  badge,
  defaultOpen = true,
  expandSignal = 0,
  children,
}: {
  id: string;
  icon: LucideIcon;
  title: string;
  description?: string;
  badge?: string;
  defaultOpen?: boolean;
  expandSignal?: number;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [dismissedSignal, setDismissedSignal] = useState(0);
  const isOpen = open || expandSignal > dismissedSignal;
  function toggleOpen() {
    if (isOpen) {
      setOpen(false);
      setDismissedSignal(expandSignal);
      return;
    }
    setOpen(true);
  }
  return (
    <div className={panel.panel} id={id}>
      <button
        type="button"
        className={styles.sectionHeader}
        onClick={toggleOpen}
      >
        <span className={styles.sectionIcon}>
          <Icon size={16} />
        </span>
        <span className={styles.sectionMeta}>
          <b>{title}</b>
          {description && <span>{description}</span>}
        </span>
        {badge && <span className={styles.sectionBadge}>{badge}</span>}
        <ChevronDown
          size={16}
          className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ""}`}
        />
      </button>
      {isOpen && <div className={styles.sectionBody}>{children}</div>}
    </div>
  );
}

export function ProductForm({ initial }: { initial?: ProductInitial }) {
  const router = useRouter();
  const productId = initial?._id;
  const nameRef = useRef<HTMLInputElement>(null);
  const slugRef = useRef<HTMLInputElement>(null);
  const skuRef = useRef<HTMLInputElement>(null);
  const priceRef = useRef<HTMLInputElement>(null);
  const salePriceRef = useRef<HTMLInputElement>(null);
  const inventoryRef = useRef<HTMLInputElement>(null);
  const categoryRef = useRef<HTMLDivElement>(null);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [stageProducts, setStageProducts] = useState<StageProductOption[]>([]);
  const [copyProducts, setCopyProducts] = useState<CopySourceProduct[]>([]);
  const [copySourceId, setCopySourceId] = useState("");
  const [contentCopySignal, setContentCopySignal] = useState(0);
  const [name, setName] = useState(initial?.name ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(initial?.slug));
  const [categoryIds, setCategoryIds] = useState<string[]>(
    (initial?.category ?? []).map((entry) =>
      typeof entry === "string" ? entry : entry._id,
    ),
  );
  function toggleCategory(id: string) {
    setCategoryIds((current) =>
      current.includes(id)
        ? current.filter((value) => value !== id)
        : [...current, id],
    );
  }
  const [sku, setSku] = useState(initial?.sku ?? "");
  const [skuTouched, setSkuTouched] = useState(Boolean(initial?.sku));
  const [price, setPrice] = useState(String(initial?.price ?? ""));
  const [salePrice, setSalePrice] = useState(
    initial?.salePrice ? String(initial.salePrice) : "",
  );
  const [discountPercent, setDiscountPercent] = useState(() =>
    initial?.salePrice && initial.price > 0
      ? String(Math.round((1 - initial.salePrice / initial.price) * 100))
      : "0",
  );
  const [inventory, setInventory] = useState(String(initial?.inventory ?? "0"));
  const [status, setStatus] = useState<ProductInitial["status"]>(
    initial?.status ?? "draft",
  );
  const [isBestSeller, setIsBestSeller] = useState(Boolean(initial?.isBestSeller));
  const [shortDescription, setShortDescription] = useState(
    initial?.shortDescription ?? "",
  );
  const [description, setDescription] = useState(initial?.description ?? "");
  const [images, setImages] = useState<string[]>(initial?.images ?? []);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [specs, setSpecs] = useState<Item[]>(
    initial?.specificationRows?.length
      ? initial.specificationRows
      : Object.entries(initial?.specifications ?? {}).map(([key, value]) => ({
          ...emptyItem(),
          name: key,
          value: String(value),
          type: "text",
        })),
  );
  const [stageImages, setStageImages] = useState<Item[]>(
    initial?.stageImages ?? [],
  );
  const [rootCauses, setRootCauses] = useState<Item[]>(
    initial?.rootCauses ?? [],
  );
  const [detailHighlights, setDetailHighlights] = useState<Item[]>(
    initial?.detailHighlights ?? [],
  );
  const [enName, setEnName] = useState(initial?.translations?.en?.name ?? "");
  const [enShortDescription, setEnShortDescription] = useState(initial?.translations?.en?.shortDescription ?? "");
  const [enDescription, setEnDescription] = useState(initial?.translations?.en?.description ?? "");
  const [enHowToUse, setEnHowToUse] = useState(initial?.translations?.en?.howToUseDescription ?? "");
  const [treatmentKit, setTreatmentKit] = useState<Item[]>(
    initial?.treatmentKit ?? [],
  );
  const [journey, setJourney] = useState<Item[]>(
    initial?.treatmentJourney ?? [],
  );
  const [additionalInfo, setAdditionalInfo] = useState<AdditionalInfoGroup[]>(
    initial?.additionalInfo ?? [],
  );
  const [howToUse, setHowToUse] = useState<Item>(
    initial?.howToUse ?? emptyItem(),
  );
  const [blocks, setBlocks] = useState<Item[]>(initial?.contentBlocks ?? []);
  const [groups, setGroups] = useState<OptionGroup[]>(
    initial?.optionGroups ?? [],
  );
  const [quizTags, setQuizTags] = useState<QuizTags>(
    initial?.quizTags ?? emptyQuizTags(),
  );
  const [quizConfig, setQuizConfig] = useState<QuizConfig>(DEFAULT_QUIZ_CONFIG);
  function toggleQuizTag(dimension: keyof QuizTags, value: string) {
    setQuizTags((current) => {
      const list = current[dimension] ?? [];
      return {
        ...current,
        [dimension]: list.includes(value)
          ? list.filter((entry) => entry !== value)
          : [...list, value],
      };
    });
  }
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [validationSignal, setValidationSignal] = useState(0);
  const shouldPersistDraft = !productId;
  const [draftReady, setDraftReady] = useState(!shouldPersistDraft);

  useEffect(() => {
    if (!shouldPersistDraft) return;
    try {
      const raw = localStorage.getItem(NEW_PRODUCT_DRAFT_KEY);
      if (!raw) return;
      const draft = JSON.parse(raw) as Partial<ProductFormDraft>;
      setName(draft.name ?? "");
      setSlug(draft.slug ?? "");
      setSlugTouched(Boolean(draft.slug));
      setCategoryIds(draft.categoryIds ?? []);
      setSku(draft.sku ?? "");
      setSkuTouched(Boolean(draft.sku));
      setPrice(draft.price ?? "");
      setSalePrice(draft.salePrice ?? "");
      setDiscountPercent(draft.discountPercent ?? "0");
      setInventory(draft.inventory ?? "0");
      setStatus(draft.status ?? "draft");
      setShortDescription(draft.shortDescription ?? "");
      setDescription(draft.description ?? "");
      setImages(draft.images ?? []);
      setSpecs(draft.specs ?? []);
      setStageImages(draft.stageImages ?? []);
      setRootCauses(draft.rootCauses ?? []);
      setDetailHighlights(draft.detailHighlights ?? []);
      setTreatmentKit(draft.treatmentKit ?? []);
      setJourney(draft.journey ?? []);
      setAdditionalInfo(draft.additionalInfo ?? []);
      setHowToUse(draft.howToUse ?? emptyItem());
      setBlocks(draft.blocks ?? []);
      setGroups(draft.groups ?? []);
      setQuizTags(draft.quizTags ?? emptyQuizTags());
      setEnName(draft.enName ?? "");
      setEnShortDescription(draft.enShortDescription ?? "");
      setEnDescription(draft.enDescription ?? "");
      setEnHowToUse(draft.enHowToUse ?? "");
      setMessage("Đã khôi phục bản nháp sản phẩm đang tạo.");
    } catch {
      localStorage.removeItem(NEW_PRODUCT_DRAFT_KEY);
    } finally {
      setDraftReady(true);
    }
  }, [shouldPersistDraft]);

  useEffect(() => {
    if (!shouldPersistDraft || !draftReady) return;
    const draft: ProductFormDraft = {
      name,
      slug,
      categoryIds,
      sku,
      price,
      salePrice,
      discountPercent,
      inventory,
      status,
      shortDescription,
      description,
      images,
      specs,
      stageImages,
      rootCauses,
      detailHighlights,
      treatmentKit,
      journey,
      additionalInfo,
      howToUse,
      blocks,
      groups,
      quizTags,
      enName,
      enShortDescription,
      enDescription,
      enHowToUse,
    };
    try {
      localStorage.setItem(NEW_PRODUCT_DRAFT_KEY, JSON.stringify(draft));
    } catch {
      // Ignore storage failures; the form should still be usable.
    }
  }, [
    additionalInfo,
    blocks,
    categoryIds,
    description,
    detailHighlights,
    discountPercent,
    enDescription,
    enHowToUse,
    enName,
    enShortDescription,
    groups,
    howToUse,
    images,
    inventory,
    journey,
    name,
    price,
    quizTags,
    rootCauses,
    salePrice,
    draftReady,
    shouldPersistDraft,
    shortDescription,
    sku,
    slug,
    specs,
    stageImages,
    status,
    treatmentKit,
  ]);

  useEffect(() => {
    fetch("/api/categories?tree=true")
      .then((response) => response.json())
      .then((body) => {
        const options: CategoryOption[] = [];
        for (const root of body.data ?? []) {
          options.push({ _id: root._id, label: root.name });
          for (const child of root.children ?? [])
            options.push({ _id: child._id, label: `— ${child.name}` });
        }
        setCategories(options);
      });
  }, []);
  useEffect(() => {
    fetch("/api/settings", { cache: "no-store" })
      .then((response) => response.json())
      .then((body) => setQuizConfig(normalizeQuizConfig(body.data?.quizConfig)))
      .catch(() => setQuizConfig(DEFAULT_QUIZ_CONFIG));
  }, []);
  useEffect(() => {
    fetch("/api/commerce/products?status=all")
      .then((response) => response.json())
      .then((body) => {
        const products = (body.data ?? []) as CopySourceProduct[];
        setCopyProducts(
          products.filter(
            (product) => String(product._id ?? product.id) !== productId,
          ),
        );
        setStageProducts(
          products
            .filter((product) => product.status === "active")
            .map(
              (product: {
                _id?: string;
                id?: string;
                slug: string;
                name: string;
              }) => ({
                id: String(product._id ?? product.id),
                slug: product.slug,
                name: product.name,
              }),
            )
            .filter((product: StageProductOption) => product.id !== productId),
        );
      });
  }, [productId]);
  function updateList(
    list: Item[],
    setList: (next: Item[]) => void,
    index: number,
    patch: Partial<Item>,
  ) {
    setList(
      list.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...patch } : item,
      ),
    );
  }
  // Storefront (ProductDetailClient) và API tạo đơn đều tính giá lựa chọn theo
  // công thức (salePrice ?? price) + priceAdjustment. Form phải quy đổi trên
  // đúng nền giá đó, nếu không admin gõ 350.000 mà khách lại thấy giá khác.
  const optionBasePrice = Number(salePrice || price || 0);

  function updateOriginalPrice(value: string) {
    setPrice(value);
    const original = Number(value);
    const percent = Number(discountPercent);
    if (original > 0 && percent > 0)
      setSalePrice(String(Math.round(original * (1 - percent / 100))));
  }
  function applyDiscount(value: string) {
    setDiscountPercent(value);
    const original = Number(price);
    const percent = Number(value);
    if (original > 0 && percent > 0)
      setSalePrice(String(Math.round(original * (1 - percent / 100))));
    if (value === "0") setSalePrice("");
  }
  function updateSalePrice(value: string) {
    setSalePrice(value);
    const original = Number(price);
    const actual = Number(value);
    if (original > 0 && actual > 0 && actual <= original)
      setDiscountPercent(String(Math.round((1 - actual / original) * 100)));
    if (!value) setDiscountPercent("0");
  }
  function copyContentFromProduct() {
    const source = copyProducts.find(
      (product) => String(product._id ?? product.id) === copySourceId,
    );
    if (!source) {
      showToast("Vui lòng chọn sản phẩm cần copy nội dung.", "error");
      return;
    }
    const copiedSpecs = source.specificationRows?.length
      ? cloneItems(source.specificationRows)
      : Object.entries(source.specifications ?? {}).map(([key, value]) => ({
          ...emptyItem(),
          name: key,
          value: String(value),
          type: "text",
        }));

    setShortDescription(source.shortDescription ?? "");
    setDescription(source.description ?? "");
    setImages([...(source.images ?? [])]);
    setSpecs(copiedSpecs);
    setStageImages(cloneItems(source.stageImages));
    setRootCauses(cloneItems(source.rootCauses));
    setDetailHighlights(cloneItems(source.detailHighlights));
    setTreatmentKit(cloneItems(source.treatmentKit));
    setJourney(cloneItems(source.treatmentJourney));
    setBlocks(cloneItems(source.contentBlocks));
    setHowToUse({ ...(source.howToUse ?? emptyItem()) });
    setAdditionalInfo(cloneAdditionalInfo(source.additionalInfo));
    setGroups(cloneOptionGroups(source.optionGroups));
    setQuizTags(source.quizTags ?? emptyQuizTags());
    setEnName(source.translations?.en?.name ?? "");
    setEnShortDescription(source.translations?.en?.shortDescription ?? "");
    setEnDescription(source.translations?.en?.description ?? "");
    setEnHowToUse(source.translations?.en?.howToUseDescription ?? "");
    setContentCopySignal(Date.now());
    window.requestAnimationFrame(() =>
      document.getElementById("description")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      }),
    );
    showToast(`Đã copy nội dung và ảnh từ "${source.name}".`, "success");
  }

  function focusValidationTarget(
    sectionId: string,
    target: { current: HTMLElement | null },
  ) {
    const nextSignal = Date.now();
    setValidationSignal(nextSignal);
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        const element = target.current ?? document.getElementById(sectionId);
        element?.scrollIntoView({ behavior: "smooth", block: "center" });
        target.current?.focus({ preventScroll: true });
      });
    });
  }

  function validateBeforeSubmit() {
    const original = Number(price);
    const actual = salePrice ? Number(salePrice) : undefined;
    const stock = Number(inventory);
    const errors: {
      message: string;
      sectionId: string;
      target: { current: HTMLElement | null };
    }[] = [];

    if (name.trim().length < 2)
      errors.push({
        message: "Tên sản phẩm cần ít nhất 2 ký tự.",
        sectionId: "basic",
        target: nameRef,
      });
    if (!/^[a-z0-9-]+$/.test(slug.trim()))
      errors.push({
        message: "Slug chỉ được gồm chữ thường, số và dấu gạch ngang.",
        sectionId: "basic",
        target: slugRef,
      });
    if (sku.trim().length < 3)
      errors.push({
        message: "SKU cần ít nhất 3 ký tự.",
        sectionId: "basic",
        target: skuRef,
      });
    if (!categoryIds.length)
      errors.push({
        message: "Cần chọn ít nhất một danh mục.",
        sectionId: "category-picker",
        target: categoryRef,
      });
    if (!price || !Number.isInteger(original) || original < 0)
      errors.push({
        message: "Giá gốc phải là số nguyên từ 0 trở lên.",
        sectionId: "pricing",
        target: priceRef,
      });
    if (actual !== undefined && (!Number.isInteger(actual) || actual < 0))
      errors.push({
        message: "Giá bán thực tế phải là số nguyên từ 0 trở lên.",
        sectionId: "pricing",
        target: salePriceRef,
      });
    if (actual !== undefined && Number.isFinite(original) && actual > original)
      errors.push({
        message: "Giá bán thực tế không thể cao hơn giá gốc.",
        sectionId: "pricing",
        target: salePriceRef,
      });
    if (inventory === "" || !Number.isInteger(stock) || stock < 0)
      errors.push({
        message: "Tồn kho phải là số nguyên từ 0 trở lên.",
        sectionId: "pricing",
        target: inventoryRef,
      });

    setValidationErrors(errors.map((error) => error.message));
    if (errors.length) {
      const messageText = `Thiếu hoặc sai thông tin: ${errors
        .map((error) => error.message)
        .join(" ")}`;
      setMessage(messageText);
      showToast(messageText, "error");
      focusValidationTarget(errors[0].sectionId, errors[0].target);
      return false;
    }
    return true;
  }

  async function submit() {
    setMessage("");
    setValidationErrors([]);
    if (!validateBeforeSubmit()) return;
    const original = Number(price);
    const actual = salePrice ? Number(salePrice) : undefined;
    if (actual !== undefined && actual > original) {
      setMessage("Giá bán thực tế không thể cao hơn giá gốc.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        category: categoryIds,
        name,
        slug,
        shortDescription,
        description,
        price: original,
        salePrice: actual,
        inventory: Number(inventory),
        sku,
        images: images.filter(Boolean),
        specifications: Object.fromEntries(
          specs
            .filter((item) => item.name.trim())
            .map((item) => [item.name.trim(), item.value]),
        ),
        specificationRows: specs,
        stageImages,
        howToUse,
        rootCauses,
        detailHighlights,
        translations: {
          en: {
            name: enName.trim(),
            shortDescription: enShortDescription.trim(),
            description: enDescription.trim(),
            howToUseDescription: enHowToUse.trim(),
          },
        },
        treatmentKit,
        treatmentJourney: journey,
        additionalInfo,
        contentBlocks: blocks,
        optionGroups: groups,
        quizTags,
        status,
        isBestSeller,
        variantGroup: initial?.variantGroup ?? "",
        variantLabel: initial?.variantLabel ?? "",
        variantOrder: initial?.variantOrder ?? 0,
      };
      const response = await fetch(
        productId
          ? `/api/commerce/products/${productId}`
          : "/api/commerce/products",
        {
          method: productId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const body = await response.json();
      if (!response.ok) throw new Error(extractApiError(body, "Lưu sản phẩm thất bại"));
      const successMessage = productId ? "Đã cập nhật sản phẩm." : "Đã tạo sản phẩm mới.";
      setMessage(successMessage);
      showToast(successMessage, "success");
      if (!productId) {
        localStorage.removeItem(NEW_PRODUCT_DRAFT_KEY);
        router.push(`/admin/products/${body.data._id}`);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Lưu sản phẩm thất bại";
      setMessage(errorMessage);
      showToast(errorMessage, "error");
    } finally {
      setSaving(false);
    }
  }

  const repeat = (
    id: string,
    icon: LucideIcon,
    title: string,
    hint: string,
    list: Item[],
    setList: (next: Item[]) => void,
    heading: string,
  ) => (
    <Section
      id={id}
      icon={icon}
      title={title}
      description={hint}
      badge={list.length ? `${list.length}` : undefined}
      defaultOpen={!productId}
      expandSignal={formExpandSignal}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginBottom: list.length ? 14 : 0,
        }}
      >
        <button
          type="button"
          className={panel.secondaryButton}
          onClick={() => setList([...list, emptyItem()])}
        >
          <Plus size={14} /> Thêm dòng
        </button>
      </div>
      {list.map((item, index) => (
        <ItemEditor
          key={index}
          item={item}
          heading={`${heading} ${index + 1}`}
          onChange={(patch) => updateList(list, setList, index, patch)}
          onRemove={() =>
            setList(list.filter((_, itemIndex) => itemIndex !== index))
          }
        />
      ))}
      {!list.length && (
        <p className={panel.empty} style={{ padding: "20px 0" }}>
          Chưa có nội dung. Bấm &quot;Thêm dòng&quot; để bắt đầu.
        </p>
      )}
    </Section>
  );

  const formExpandSignal = Math.max(contentCopySignal, validationSignal);
  const copyOptions = copyProducts.map((product) => ({
    value: String(product._id ?? product.id),
    label: product.name,
    description: product.sku || product.slug,
    keywords: `${product.slug ?? ""} ${product.sku ?? ""}`,
  }));

  return (
    <div className={styles.layout}>
      <div className={styles.main}>
        <Section
          id="images"
          icon={Images}
          title="Ảnh sản phẩm"
          description="Ảnh đầu tiên là ảnh chính — bấm ★ trên ảnh khác để đặt làm ảnh chính"
          badge={images.length ? `${images.length}` : undefined}
          defaultOpen
        >
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginBottom: images.length ? 14 : 0,
            }}
          >
            <button
              type="button"
              className={panel.secondaryButton}
              onClick={() => setGalleryOpen(true)}
            >
              <Images size={14} /> Chọn ảnh từ thư viện
            </button>
          </div>
          {images.length > 0 ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill,minmax(84px,1fr))",
                gap: 10,
              }}
            >
              {images.map((image, index) => (
                <div
                  key={image + index}
                  style={{
                    position: "relative",
                    aspectRatio: "1",
                    borderRadius: 9,
                    overflow: "hidden",
                    border: "1px solid var(--admin-border)",
                    background: "var(--admin-soft)",
                  }}
                >
                  <img
                    src={image}
                    alt=""
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setImages(
                        images.filter((_, itemIndex) => itemIndex !== index),
                      )
                    }
                    aria-label="Xóa ảnh"
                    style={{
                      position: "absolute",
                      top: 4,
                      right: 4,
                      width: 20,
                      height: 20,
                      borderRadius: "50%",
                      background: "rgba(0,0,0,.6)",
                      color: "#fff",
                      display: "grid",
                      placeItems: "center",
                      border: 0,
                      cursor: "pointer",
                    }}
                  >
                    <Trash2 size={11} />
                  </button>
                  {index === 0 ? (
                    <span
                      style={{
                        position: "absolute",
                        bottom: 4,
                        left: 4,
                        background: "var(--admin-blue)",
                        color: "#fff",
                        fontSize: 9,
                        fontWeight: 700,
                        padding: "2px 6px",
                        borderRadius: 4,
                      }}
                    >
                      Ảnh chính
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() =>
                        setImages([
                          image,
                          ...images.filter((_, itemIndex) => itemIndex !== index),
                        ])
                      }
                      aria-label="Đặt làm ảnh chính"
                      title="Đặt làm ảnh chính"
                      style={{
                        position: "absolute",
                        bottom: 4,
                        left: 4,
                        width: 20,
                        height: 20,
                        borderRadius: "50%",
                        background: "rgba(0,0,0,.6)",
                        color: "#fff",
                        display: "grid",
                        placeItems: "center",
                        border: 0,
                        cursor: "pointer",
                      }}
                    >
                      <Star size={11} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className={panel.empty} style={{ padding: "20px 0" }}>
              Chưa có ảnh nào. Bấm &quot;Chọn ảnh từ thư viện&quot; để thêm.
            </p>
          )}
        </Section>

        <Section
          id="copyContent"
          icon={Copy}
          title="Copy nhanh nội dung & ảnh"
          description="Chọn một sản phẩm đã có để copy phần nội dung, ảnh và media liên quan"
          defaultOpen={!productId}
          expandSignal={formExpandSignal}
        >
          <div className={panel.grid2}>
            <label style={{ gridColumn: "1 / -1" }}>
              Sản phẩm nguồn
              <SearchableSelect
                value={copySourceId}
                onChange={setCopySourceId}
                options={copyOptions}
                placeholder="Chọn hoặc gõ tên sản phẩm để tìm"
                searchPlaceholder="Tìm theo tên, slug hoặc SKU..."
                emptyLabel="Không tìm thấy sản phẩm phù hợp"
                clearLabel="Bỏ chọn sản phẩm"
                disabled={!copyOptions.length}
              />
            </label>
            <div
              style={{
                gridColumn: "1 / -1",
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <p className={styles.fieldHint} style={{ margin: 0 }}>
                Copy mô tả, thông số, biến thể, các khối nội dung, bản EN, thẻ bài test, ảnh sản phẩm và ảnh trong nội dung. Tên, slug, SKU, giá, tồn kho và danh mục được giữ nguyên.
              </p>
              <button
                type="button"
                className={panel.secondaryButton}
                onClick={copyContentFromProduct}
                disabled={!copySourceId}
              >
                <Copy size={14} /> Copy nội dung & ảnh
              </button>
            </div>
          </div>
        </Section>

        <Section
          id="basic"
          icon={Info}
          title="Thông tin cơ bản"
          description="Tên, đường dẫn và mã sản phẩm"
          defaultOpen={!productId}
          expandSignal={formExpandSignal}
        >
          <div className={panel.grid2}>
            <label>
              Tên sản phẩm
              <input
                ref={nameRef}
                aria-invalid={validationErrors.some((error) =>
                  error.includes("Tên sản phẩm"),
                )}
                value={name}
                onChange={(event) => {
                  const value = event.target.value;
                  setName(value);
                  const nextSlug = slugify(value);
                  if (!slugTouched) setSlug(nextSlug);
                  if (!productId && !skuTouched) setSku(generateSku(nextSlug));
                }}
              />
            </label>
            <label>
              Đường dẫn (slug)
              <div className={styles.skuRow}>
                <input
                  ref={slugRef}
                  aria-invalid={validationErrors.some((error) =>
                    error.includes("Slug"),
                  )}
                  value={slug}
                  onChange={(event) => {
                    setSlugTouched(true);
                    setSlug(slugify(event.target.value));
                  }}
                  placeholder="tu-dong-sinh-tu-ten"
                />
                <button
                  type="button"
                  className={panel.secondaryButton}
                  onClick={() => {
                    setSlugTouched(false);
                    setSlug(slugify(name));
                  }}
                >
                  <RefreshCw size={13} /> Tự sinh
                </button>
              </div>
              <p className={styles.fieldHint}>
                /san-pham/{slug || "..."}
                {" — "}
                {productId
                  ? "Sửa cẩn thận: đổi link sẽ làm hỏng các link đã chia sẻ trước đó."
                  : "Tự động tạo từ tên, có thể sửa tay."}
              </p>
            </label>
            <label>
              SKU
              <div className={styles.skuRow}>
                <input
                  ref={skuRef}
                  aria-invalid={validationErrors.some((error) =>
                    error.includes("SKU"),
                  )}
                  value={sku}
                  onChange={(event) => {
                    setSkuTouched(true);
                    setSku(event.target.value.toUpperCase());
                  }}
                  placeholder="VD: DGRT-1042"
                />
                <button
                  type="button"
                  className={panel.secondaryButton}
                  onClick={() => {
                    setSkuTouched(true);
                    setSku(generateSku(slug || slugify(name)));
                  }}
                >
                  <RefreshCw size={13} /> Tạo mã
                </button>
              </div>
              <p className={styles.fieldHint}>
                Mã quản lý kho nội bộ (SKU) dùng để đối soát tồn kho và đơn hàng, khách hàng
                không nhìn thấy mã này. Có thể để hệ thống tự tạo hoặc bấm &quot;Tạo mã&quot;
                để đổi mã khác.
              </p>
            </label>
          </div>
        </Section>

        <Section
          id="pricing"
          icon={Tag}
          title="Giá & tồn kho"
          description="Giá gốc, giá bán thực tế và số lượng trong kho"
          defaultOpen={!productId}
          expandSignal={formExpandSignal}
        >
          <div className={panel.grid3}>
            <label>
              Giá gốc (đ)
              <input
                ref={priceRef}
                aria-invalid={validationErrors.some((error) =>
                  error.includes("Giá gốc"),
                )}
                min="0"
                type="number"
                value={price}
                onChange={(event) => updateOriginalPrice(event.target.value)}
              />
            </label>
            <label>
              Giảm giá
              <select
                value={discountPercent}
                onChange={(event) => applyDiscount(event.target.value)}
              >
                <option value="0">Không giảm</option>
                <option value="5">Giảm 5%</option>
                <option value="10">Giảm 10%</option>
                <option value="15">Giảm 15%</option>
                <option value="20">Giảm 20%</option>
                <option value="25">Giảm 25%</option>
                <option value="30">Giảm 30%</option>
                <option value="40">Giảm 40%</option>
                <option value="50">Giảm 50%</option>
              </select>
            </label>
            <label>
              Giá bán thực tế (đ)
              <input
                ref={salePriceRef}
                aria-invalid={validationErrors.some((error) =>
                  error.includes("Giá bán thực tế"),
                )}
                min="0"
                max={price || undefined}
                type="number"
                value={salePrice}
                onChange={(event) => updateSalePrice(event.target.value)}
                placeholder="Bằng giá gốc nếu không giảm"
              />
            </label>
            <label>
              Tồn kho
              <input
                ref={inventoryRef}
                aria-invalid={validationErrors.some((error) =>
                  error.includes("Tồn kho"),
                )}
                type="number"
                value={inventory}
                onChange={(event) => setInventory(event.target.value)}
              />
            </label>
          </div>
          <p className={styles.priceHint}>
            Giá gốc là giá trước giảm. Chọn phần trăm để tự tính giá bán thực
            tế, hoặc nhập giá bán thực tế để hệ thống tự quy ra phần trăm.
          </p>
        </Section>

        <Section
          id="stages"
          icon={Layers}
          title="Giai đoạn sản phẩm"
          description="Ảnh + tên giai đoạn — bấm vào sẽ chuyển thẳng sang đúng sản phẩm của giai đoạn đó"
          badge={stageImages.length ? `${stageImages.length}` : undefined}
          defaultOpen={!productId}
          expandSignal={formExpandSignal}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginBottom: stageImages.length ? 14 : 0,
            }}
          >
            <button
              type="button"
              className={panel.secondaryButton}
              onClick={() => setStageImages([...stageImages, emptyItem()])}
            >
              <Plus size={14} /> Thêm giai đoạn
            </button>
          </div>
          {stageImages.map((item, index) => (
            <StageEditor
              key={index}
              index={index}
              item={item}
              productOptions={stageProducts}
              currentId={productId}
              currentSlug={slug}
              currentName={name}
              onChange={(patch) =>
                updateList(stageImages, setStageImages, index, patch)
              }
              onRemove={() =>
                setStageImages(
                  stageImages.filter((_, itemIndex) => itemIndex !== index),
                )
              }
            />
          ))}
          {!stageImages.length && (
            <p className={panel.empty} style={{ padding: "20px 0" }}>
              Chưa có giai đoạn nào. Mỗi giai đoạn chỉ cần 3 thứ: ảnh, tên giai đoạn và
              sản phẩm sẽ mở ra khi bấm vào.
            </p>
          )}
        </Section>

        <Section
          id="variants"
          icon={SlidersHorizontal}
          title="Biến thể / các bước lựa chọn"
          description="Ví dụ giai đoạn, độ tuổi, thời gian, quy cách gói"
          badge={groups.length ? `${groups.length}` : undefined}
          defaultOpen={!productId}
          expandSignal={formExpandSignal}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginBottom: groups.length ? 14 : 0,
            }}
          >
            <button
              type="button"
              className={panel.secondaryButton}
              onClick={() => setGroups([...groups, emptyGroup()])}
            >
              <Plus size={14} /> Thêm nhóm
            </button>
          </div>
          {groups.map((group, groupIndex) => (
            <div className={panel["admin-repeat-card"]} key={group.id}>
              <div className={panel["admin-repeat-head"]}>
                <b>Nhóm {groupIndex + 1}</b>
                <button
                  type="button"
                  className={panel.dangerButton}
                  onClick={() =>
                    setGroups(groups.filter((_, index) => index !== groupIndex))
                  }
                >
                  <Trash2 size={14} /> Xóa nhóm
                </button>
              </div>
              <div className={panel.grid3}>
                <label>
                  Tên bước
                  <input
                    value={group.title}
                    onChange={(event) =>
                      setGroups(
                        groups.map((item, index) =>
                          index === groupIndex
                            ? { ...item, title: event.target.value }
                            : item,
                        ),
                      )
                    }
                  />
                </label>
                <label>
                  Mã nhóm
                  <input
                    value={group.code}
                    onChange={(event) =>
                      setGroups(
                        groups.map((item, index) =>
                          index === groupIndex
                            ? { ...item, code: event.target.value }
                            : item,
                        ),
                      )
                    }
                  />
                </label>
                <label>
                  Kiểu hiển thị
                  <select
                    value={group.displayType}
                    onChange={(event) =>
                      setGroups(
                        groups.map((item, index) =>
                          index === groupIndex
                            ? {
                                ...item,
                                displayType: event.target
                                  .value as OptionGroup["displayType"],
                              }
                            : item,
                        ),
                      )
                    }
                  >
                    <option value="card">Thẻ ảnh</option>
                    <option value="button">Nút</option>
                    <option value="radio">Nút chọn</option>
                    <option value="dropdown">Danh sách thả xuống</option>
                  </select>
                </label>
                <label>
                  Kiểu tính giá
                  <select
                    value={group.pricingMode ?? "replace"}
                    onChange={(event) =>
                      setGroups(
                        groups.map((item, index) =>
                          index === groupIndex
                            ? {
                                ...item,
                                pricingMode: event.target
                                  .value as OptionGroup["pricingMode"],
                              }
                            : item,
                        ),
                      )
                    }
                  >
                    <option value="replace">Thay giá gốc (gói/gói cước)</option>
                    <option value="addon">Cộng thêm giá gốc (phụ kiện/topping)</option>
                  </select>
                </label>
              </div>
              <p className={styles.fieldHint} style={{ marginTop: -6 }}>
                {(group.pricingMode ?? "replace") === "addon"
                  ? "Chọn lựa chọn trong nhóm này sẽ CỘNG thêm giá của nó vào tổng, giữ nguyên giá gốc — dùng cho phụ kiện/bổ sung thêm."
                  : "Chọn lựa chọn trong nhóm này sẽ THAY giá gốc bằng giá riêng của lựa chọn đó — dùng cho gói/thời hạn sử dụng."}
              </p>
              <label className={panel["admin-checkbox"]}>
                <input
                  type="checkbox"
                  checked={group.required}
                  onChange={(event) =>
                    setGroups(
                      groups.map((item, index) =>
                        index === groupIndex
                          ? { ...item, required: event.target.checked }
                          : item,
                      ),
                    )
                  }
                />{" "}
                Bắt buộc chọn
              </label>
              <p className={styles.fieldHint}>
                {(group.pricingMode ?? "replace") === "addon"
                  ? "Nhập số tiền (đ) sẽ được CỘNG THÊM vào giá gốc khi khách chọn lựa chọn đó. Để trống hoặc 0 nếu lựa chọn đó không cộng thêm gì (VD: \"Không có\")."
                  : `Ô giá là SỐ TIỀN KHÁCH PHẢI TRẢ khi chọn lựa chọn đó — nhập đúng con số bạn muốn khách thấy. Mặc định bằng giá bán hiện tại${optionBasePrice > 0 ? ` (${optionBasePrice.toLocaleString("vi-VN")}đ)` : ""}; ví dụ 1 hộp giữ nguyên, 2 hộp nhập giá cao hơn. Lưu ý: sửa giá gốc hoặc giá khuyến mãi phía trên sẽ kéo theo giá của các lựa chọn, kiểm tra lại các ô này sau khi đổi giá.`}
              </p>
              {group.options.map((option, optionIndex) => (
                <div className={panel["admin-option-row"]} key={option.id}>
                  <input
                    placeholder="Tên lựa chọn"
                    value={option.label || option.title}
                    onChange={(event) =>
                      setGroups(
                        groups.map((item, index) =>
                          index === groupIndex
                            ? {
                                ...item,
                                options: item.options.map(
                                  (current, childIndex) =>
                                    childIndex === optionIndex
                                      ? {
                                          ...current,
                                          label: event.target.value,
                                          title: event.target.value,
                                          value: event.target.value,
                                        }
                                      : current,
                                ),
                              }
                            : item,
                        ),
                      )
                    }
                  />
                  <input
                    type="number"
                    placeholder={
                      (group.pricingMode ?? "replace") === "addon"
                        ? "Giá cộng thêm"
                        : "Giá khách trả"
                    }
                    title={
                      (group.pricingMode ?? "replace") === "addon"
                        ? "Số tiền cộng thêm vào giá bán khi chọn lựa chọn này — để trống nếu không cộng thêm"
                        : "Giá khách phải trả khi chọn lựa chọn này"
                    }
                    value={
                      (group.pricingMode ?? "replace") === "addon"
                        ? option.priceAdjustment || ""
                        : optionBasePrice > 0
                          ? Math.round(optionBasePrice + option.priceAdjustment)
                          : ""
                    }
                    onChange={(event) => {
                      const raw = event.target.value;
                      const addonMode = (group.pricingMode ?? "replace") === "addon";
                      const nextAdjustment = raw === ""
                        ? 0
                        : addonMode
                          ? Number(raw)
                          : Number(raw) - optionBasePrice;
                      setGroups(
                        groups.map((item, index) =>
                          index === groupIndex
                            ? {
                                ...item,
                                options: item.options.map(
                                  (current, childIndex) =>
                                    childIndex === optionIndex
                                      ? { ...current, priceAdjustment: nextAdjustment }
                                      : current,
                                ),
                              }
                            : item,
                        ),
                      );
                    }}
                  />
                  <UploadField
                    value={option.image}
                    onChange={(image) =>
                      setGroups(
                        groups.map((item, index) =>
                          index === groupIndex
                            ? {
                                ...item,
                                options: item.options.map(
                                  (current, childIndex) =>
                                    childIndex === optionIndex
                                      ? { ...current, image }
                                      : current,
                                ),
                              }
                            : item,
                        ),
                      )
                    }
                    label="Tải ảnh lên"
                  />
                  <button
                    type="button"
                    className={panel.dangerButton}
                    onClick={() =>
                      setGroups(
                        groups.map((item, index) =>
                          index === groupIndex
                            ? {
                                ...item,
                                options: item.options.filter(
                                  (_, childIndex) => childIndex !== optionIndex,
                                ),
                              }
                            : item,
                        ),
                      )
                    }
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                className={panel.ghostButton}
                onClick={() =>
                  setGroups(
                    groups.map((item, index) =>
                      index === groupIndex
                        ? { ...item, options: [...item.options, emptyOption()] }
                        : item,
                    ),
                  )
                }
              >
                <Plus size={14} /> Thêm lựa chọn
              </button>
            </div>
          ))}
          {!groups.length && (
            <p className={panel.empty} style={{ padding: "20px 0" }}>
              Chưa có nhóm biến thể nào.
            </p>
          )}
        </Section>

        <Section
          id="description"
          icon={FileText}
          title="Mô tả sản phẩm"
          description="Hiện trên thẻ sản phẩm và trang chi tiết"
          defaultOpen={!productId}
          expandSignal={formExpandSignal}
        >
          <div className={panel.grid2}>
            <label style={{ gridColumn: "1 / -1" }}>
              Mô tả ngắn
              <input
                value={shortDescription}
                onChange={(event) => setShortDescription(event.target.value)}
              />
            </label>
            <label style={{ gridColumn: "1 / -1" }}>
              Mô tả chi tiết
              <textarea
                rows={6}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
            </label>
          </div>
        </Section>

        <Section
          id="translation"
          icon={Languages}
          title="Bản tiếng Anh (English)"
          description="Tuỳ chọn — khách sẽ chuyển được VI / EN ở trang chi tiết sản phẩm. Để trống thì tự dùng bản tiếng Việt."
          badge={enName || enShortDescription || enDescription ? "Đã có" : undefined}
          defaultOpen={!productId}
          expandSignal={formExpandSignal}
        >
          <div className={panel.grid2}>
            <label style={{ gridColumn: "1 / -1" }}>
              Tên sản phẩm (EN)
              <input value={enName} onChange={(event) => setEnName(event.target.value)} placeholder={name || "Product name in English"} />
            </label>
            <label style={{ gridColumn: "1 / -1" }}>
              Mô tả ngắn (EN)
              <input value={enShortDescription} onChange={(event) => setEnShortDescription(event.target.value)} placeholder={shortDescription || "Short description in English"} />
            </label>
            <label style={{ gridColumn: "1 / -1" }}>
              Mô tả chi tiết (EN)
              <textarea rows={6} value={enDescription} onChange={(event) => setEnDescription(event.target.value)} placeholder="Detailed description in English" />
            </label>
            <label style={{ gridColumn: "1 / -1" }}>
              Hướng dẫn sử dụng (EN)
              <textarea rows={3} value={enHowToUse} onChange={(event) => setEnHowToUse(event.target.value)} placeholder="How to use, in English" />
            </label>
          </div>
        </Section>

        {repeat(
          "causes",
          CircleAlert,
          "Nguyên nhân",
          "Giải thích nguyên nhân của vấn đề",
          rootCauses,
          setRootCauses,
          "Nguyên nhân",
        )}
        {repeat(
          "detailHighlights",
          Sparkles,
          "Điểm nổi bật (icon)",
          "Dãy icon + chú thích ngắn hiện ở cuối tab Chi tiết (VD: Không tác dụng phụ, Công thức khoa học...)",
          detailHighlights,
          setDetailHighlights,
          "Điểm nổi bật",
        )}

        <Section
          id="howto"
          icon={BookOpen}
          title="Hướng dẫn sử dụng"
          description="Cách dùng sản phẩm"
          defaultOpen={!productId}
          expandSignal={formExpandSignal}
        >
          <ItemEditor
            item={howToUse}
            onChange={(patch) => setHowToUse({ ...howToUse, ...patch })}
            onRemove={() => setHowToUse(emptyItem())}
            heading="Hướng dẫn"
          />
        </Section>

        {repeat(
          "kit",
          Package,
          "Thành phần bộ sản phẩm (hiện trong tab Chi tiết)",
          "Danh sách sản phẩm trong bộ — hiện ở tab \"Chi tiết\" trên trang sản phẩm (VD: Sản phẩm chính, Dưỡng chất hỗ trợ)",
          treatmentKit,
          setTreatmentKit,
          "Thành phần",
        )}
        {repeat(
          "journey",
          Route,
          "Lộ trình điều trị",
          "Các giai đoạn sử dụng theo thời gian",
          journey,
          setJourney,
          "Giai đoạn",
        )}
        {repeat(
          "specs",
          ListChecks,
          "Thông số sản phẩm",
          "Thông số kỹ thuật mở rộng",
          specs,
          setSpecs,
          "Thông số",
        )}
        {repeat(
          "blocks",
          LayoutGrid,
          "Nội dung tùy biến",
          "Khối nội dung tự do khác",
          blocks,
          setBlocks,
          "Khối",
        )}
        <Section
          id="additionalInfo"
          icon={Info}
          title="Thông tin bổ sung"
          description="Nhiều danh mục, mỗi danh mục có bảng nhãn/giá trị riêng — khách bấm chọn danh mục để xem, hiện phía dưới phần đánh giá"
          badge={additionalInfo.length ? `${additionalInfo.length}` : undefined}
          defaultOpen={!productId}
          expandSignal={formExpandSignal}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginBottom: additionalInfo.length ? 14 : 0,
            }}
          >
            <button
              type="button"
              className={panel.secondaryButton}
              onClick={() =>
                setAdditionalInfo([...additionalInfo, { title: "", rows: [] }])
              }
            >
              <Plus size={14} /> Thêm danh mục
            </button>
          </div>
          {additionalInfo.map((group, groupIndex) => (
            <div className={panel["admin-repeat-card"]} key={groupIndex}>
              <div className={panel["admin-repeat-head"]}>
                <b>Danh mục {groupIndex + 1}</b>
                <button
                  type="button"
                  className={panel.dangerButton}
                  onClick={() =>
                    setAdditionalInfo(
                      additionalInfo.filter((_, index) => index !== groupIndex),
                    )
                  }
                >
                  <Trash2 size={14} /> Xóa danh mục
                </button>
              </div>
              <label>
                Tên danh mục (VD: Kẹo dẻo Biotin cho tóc (30 viên))
                <input
                  value={group.title}
                  onChange={(event) =>
                    setAdditionalInfo(
                      additionalInfo.map((item, index) =>
                        index === groupIndex
                          ? { ...item, title: event.target.value }
                          : item,
                      ),
                    )
                  }
                />
              </label>
              {group.rows.map((row, rowIndex) => (
                <div
                  key={rowIndex}
                  style={{ display: "flex", gap: 8, marginTop: 8 }}
                >
                  <input
                    placeholder="Nhãn (VD: Khối lượng tịnh)"
                    style={{ flex: 1 }}
                    value={row.name}
                    onChange={(event) =>
                      setAdditionalInfo(
                        additionalInfo.map((item, index) =>
                          index === groupIndex
                            ? {
                                ...item,
                                rows: item.rows.map((current, rowChildIndex) =>
                                  rowChildIndex === rowIndex
                                    ? { ...current, name: event.target.value }
                                    : current,
                                ),
                              }
                            : item,
                        ),
                      )
                    }
                  />
                  <input
                    placeholder="Giá trị (VD: 60 ml)"
                    style={{ flex: 1 }}
                    value={row.value}
                    onChange={(event) =>
                      setAdditionalInfo(
                        additionalInfo.map((item, index) =>
                          index === groupIndex
                            ? {
                                ...item,
                                rows: item.rows.map((current, rowChildIndex) =>
                                  rowChildIndex === rowIndex
                                    ? { ...current, value: event.target.value }
                                    : current,
                                ),
                              }
                            : item,
                        ),
                      )
                    }
                  />
                  <button
                    type="button"
                    className={panel.dangerButton}
                    onClick={() =>
                      setAdditionalInfo(
                        additionalInfo.map((item, index) =>
                          index === groupIndex
                            ? {
                                ...item,
                                rows: item.rows.filter(
                                  (_, rowChildIndex) => rowChildIndex !== rowIndex,
                                ),
                              }
                            : item,
                        ),
                      )
                    }
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                className={panel.ghostButton}
                style={{ marginTop: 10 }}
                onClick={() =>
                  setAdditionalInfo(
                    additionalInfo.map((item, index) =>
                      index === groupIndex
                        ? { ...item, rows: [...item.rows, { name: "", value: "" }] }
                        : item,
                    ),
                  )
                }
              >
                <Plus size={14} /> Thêm dòng
              </button>
            </div>
          ))}
          {!additionalInfo.length && (
            <p className={panel.empty} style={{ padding: "20px 0" }}>
              Chưa có danh mục nào. Bấm &quot;Thêm danh mục&quot; để bắt đầu — mỗi danh
              mục là 1 tab, khách bấm chọn để xem bảng thông tin riêng.
            </p>
          )}
        </Section>

        <Section
          id="quiz"
          icon={Target}
          title="Gắn thẻ cho bài test tóc"
          description="Dùng để bài test tự động gợi ý đúng sản phẩm này — không bắt buộc, để trống nếu sản phẩm không liên quan đến rụng tóc"
          defaultOpen={!productId}
          expandSignal={formExpandSignal}
        >
          <p className={styles.fieldHint} style={{ marginBottom: 16 }}>
            Chọn tất cả các trường hợp mà sản phẩm này phù hợp. Không cần chọn hết mọi ô — bỏ trống
            một mục nghĩa là mục đó không ảnh hưởng đến việc gợi ý, không phải là loại trừ sản phẩm.
          </p>
          {quizConfig.questions.map((question) => (
            <TagChipGroup
              key={question.id}
              title={question.title}
              hint={question.hint}
              options={question.options}
              selected={quizTags[question.id] ?? []}
              onToggle={(value) => toggleQuizTag(question.id, value)}
            />
          ))}
          <a href="/admin/surveys" className={styles.previewLink} style={{ justifyContent: "flex-start" }}>
            Chỉnh bộ câu hỏi khảo sát <ExternalLink size={12} />
          </a>
        </Section>
      </div>

      <div className={styles.sidebar}>
        <div className={styles.sidebarCard}>
          <h3>Lưu &amp; xuất bản</h3>
          <div className={styles.saveRow}>
            <label>
              Trạng thái
              <select
                value={status}
                onChange={(event) =>
                  setStatus(event.target.value as ProductInitial["status"])
                }
              >
                {Object.entries(statusLabel).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className={panel["admin-checkbox"]}>
              <input
                type="checkbox"
                checked={isBestSeller}
                onChange={(event) => setIsBestSeller(event.target.checked)}
              />{" "}
              ⭐ Sản phẩm bán chạy — ưu tiên hiển thị lên đầu ở mọi trang có
              sản phẩm (trang chủ, danh mục...)
            </label>
            <button
              className={panel.saveButton}
              disabled={saving}
              onClick={() => void submit()}
            >
              {saving
                ? "Đang lưu..."
                : productId
                  ? "Cập nhật sản phẩm"
                  : "Tạo sản phẩm"}
            </button>
            {productId && (
              <a
                href={`/san-pham/${slug}`}
                target="_blank"
                rel="noreferrer"
                className={styles.previewLink}
              >
                Xem trang sản phẩm <ExternalLink size={12} />
              </a>
            )}
            {message && (
              <p className={panel.message} style={{ margin: 0 }}>
                {message}
              </p>
            )}
            {validationErrors.length > 0 && (
              <div className={styles.validationBox}>
                <b>Cần kiểm tra lại trước khi lưu:</b>
                <ul>
                  {validationErrors.map((error) => (
                    <li key={error}>{error}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        <div className={styles.sidebarCard} id="category-picker">
          <h3>Tổ chức</h3>
          <div className={styles.saveRow}>
            <label>
              Danh mục (chọn một hoặc nhiều)
              <div
                ref={categoryRef}
                tabIndex={-1}
                aria-invalid={validationErrors.some((error) =>
                  error.includes("danh mục"),
                )}
                style={{
                  display: "grid",
                  gap: 6,
                  maxHeight: 220,
                  overflowY: "auto",
                  border: "1px solid var(--admin-border, #eaecf0)",
                  borderRadius: 8,
                  padding: 8,
                }}
              >
                {categories.map((option) => (
                  <label
                    key={option._id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      fontSize: 12.5,
                      fontWeight: 500,
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={categoryIds.includes(option._id)}
                      onChange={() => toggleCategory(option._id)}
                    />
                    {option.label}
                  </label>
                ))}
              </div>
              <span style={{ fontSize: 11, color: "var(--admin-faint, #98a2b3)" }}>
                {categoryIds.length} danh mục đã chọn
              </span>
            </label>
          </div>
        </div>

        <div className={styles.sidebarCard}>
          <h3>Điều hướng nhanh</h3>
          <nav className={styles.navList}>
            {navItems.map(([id, Icon, label]) => (
              <a key={id} href={`#${id}`}>
                <Icon size={14} /> {label}
              </a>
            ))}
          </nav>
        </div>
      </div>

      {galleryOpen && (
        <MediaLibraryModal
          multiple
          initialSelected={images}
          onClose={() => setGalleryOpen(false)}
          onSelect={(urls) => setImages(urls)}
        />
      )}
    </div>
  );
}
