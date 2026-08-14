"use client";

import {
  BookOpen,
  ChevronDown,
  CircleAlert,
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
  Tag,
  Target,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { MediaLibraryModal } from "@/components/admin/MediaLibraryModal";
import panel from "@/components/admin/admin-panel.module.css";
import styles from "@/components/admin/product-form.module.css";
import { extractApiError } from "@/lib/client/errors";
import {
  emptyQuizTags,
  QUIZ_DURATIONS,
  QUIZ_FORMATS,
  QUIZ_GOALS,
  QUIZ_PRIORITIES,
  QUIZ_STAGES,
  type QuizTags,
} from "@/lib/hairQuiz";

type CategoryOption = { _id: string; label: string };
type Item = {
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
  options: Option[];
};
type StageProductOption = { id: string; slug: string; name: string };
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
  status: "draft" | "active" | "archived";
  variantGroup?: string;
  variantLabel?: string;
  variantOrder?: number;
  quizTags?: QuizTags;
  translations?: { en?: { name?: string; shortDescription?: string; description?: string; howToUseDescription?: string } };
};

const emptyItem = (): Item => ({
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

const navItems = [
  ["basic", Info, "Thông tin cơ bản"],
  ["pricing", Tag, "Giá & tồn kho"],
  ["description", FileText, "Mô tả"],
  ["images", Images, "Ảnh sản phẩm"],
  ["stages", Layers, "Ảnh giai đoạn"],
  ["causes", CircleAlert, "Nguyên nhân"],
  ["howto", BookOpen, "Hướng dẫn dùng"],
  ["kit", Package, "Chi tiết: Thành phần bộ"],
  ["journey", Route, "Lộ trình điều trị"],
  ["specs", ListChecks, "Thông số"],
  ["blocks", LayoutGrid, "Nội dung tùy biến"],
  ["variants", SlidersHorizontal, "Biến thể"],
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

function ItemEditor({
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
            <select
              value={selectValue}
              onChange={(event) => {
                const selected = options.find(
                  (product) => product.id === event.target.value,
                );
                onChange({
                  targetProductId: selected?.id ?? "",
                  targetProductSlug: selected?.slug ?? "",
                });
              }}
            >
              <option value="">— Chọn sản phẩm —</option>
              {options.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </select>
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
  children,
}: {
  id: string;
  icon: LucideIcon;
  title: string;
  description?: string;
  badge?: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={panel.panel} id={id}>
      <button
        type="button"
        className={styles.sectionHeader}
        onClick={() => setOpen((value) => !value)}
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
          className={`${styles.chevron} ${open ? styles.chevronOpen : ""}`}
        />
      </button>
      {open && <div className={styles.sectionBody}>{children}</div>}
    </div>
  );
}

export function ProductForm({ initial }: { initial?: ProductInitial }) {
  const router = useRouter();
  const productId = initial?._id;
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [stageProducts, setStageProducts] = useState<StageProductOption[]>([]);
  const [name, setName] = useState(initial?.name ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
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
  function toggleQuizTag(dimension: keyof QuizTags, value: string) {
    setQuizTags((current) => {
      const list = current[dimension];
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
    fetch("/api/commerce/products?status=all")
      .then((response) => response.json())
      .then((body) =>
        setStageProducts(
          (body.data ?? [])
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
        ),
      );
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
  async function submit() {
    setMessage("");
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
        contentBlocks: blocks,
        optionGroups: groups,
        quizTags,
        status,
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
      setMessage(productId ? "Đã cập nhật sản phẩm." : "Đã tạo sản phẩm mới.");
      if (!productId) router.push(`/admin/products/${body.data._id}`);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Lưu sản phẩm thất bại",
      );
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
      defaultOpen={list.length > 0}
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

  const canSave = Boolean(name && slug && sku && categoryIds.length && price);

  return (
    <div className={styles.layout}>
      <div className={styles.main}>
        <Section
          id="basic"
          icon={Info}
          title="Thông tin cơ bản"
          description="Tên, đường dẫn và mã sản phẩm"
        >
          <div className={panel.grid2}>
            <label>
              Tên sản phẩm
              <input
                value={name}
                onChange={(event) => {
                  const value = event.target.value;
                  setName(value);
                  const nextSlug = slugify(value);
                  if (!productId) setSlug(nextSlug);
                  if (!productId && !skuTouched) setSku(generateSku(nextSlug));
                }}
              />
            </label>
            <div>
              <span className={panel["admin-field-label"]}>Đường dẫn (slug)</span>
              <div className={styles.slugPreview}>
                <span>/san-pham/</span>
                <b>{slug || "sẽ tự sinh từ tên sản phẩm"}</b>
              </div>
              <p className={styles.fieldHint}>
                {productId
                  ? "Đường dẫn được giữ nguyên để không làm hỏng link đã chia sẻ, kể cả khi bạn đổi tên."
                  : "Tự động tạo từ tên sản phẩm, không cần nhập tay."}
              </p>
            </div>
            <label>
              SKU
              <div className={styles.skuRow}>
                <input
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
        >
          <div className={panel.grid3}>
            <label>
              Giá gốc (đ)
              <input
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
          id="description"
          icon={FileText}
          title="Mô tả sản phẩm"
          description="Hiện trên thẻ sản phẩm và trang chi tiết"
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
          defaultOpen={Boolean(enName || enShortDescription || enDescription || enHowToUse)}
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

        <Section
          id="images"
          icon={Images}
          title="Ảnh sản phẩm"
          description="Ảnh đầu tiên sẽ là ảnh chính"
          badge={images.length ? `${images.length}` : undefined}
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
                  {index === 0 && (
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
          id="stages"
          icon={Layers}
          title="Giai đoạn sản phẩm"
          description="Ảnh + tên giai đoạn — bấm vào sẽ chuyển thẳng sang đúng sản phẩm của giai đoạn đó"
          badge={stageImages.length ? `${stageImages.length}` : undefined}
          defaultOpen={stageImages.length > 0}
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
          defaultOpen={Boolean(
            howToUse.title || howToUse.description || howToUse.image,
          )}
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
          id="variants"
          icon={SlidersHorizontal}
          title="Biến thể / các bước lựa chọn"
          description="Ví dụ giai đoạn, độ tuổi, thời gian, quy cách gói"
          badge={groups.length ? `${groups.length}` : undefined}
          defaultOpen={groups.length > 0}
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
              </div>
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
                Nhập giá riêng (đ) cho từng lựa chọn nếu lựa chọn đó có giá khác giá gốc — ví dụ chai
                100ml giữ nguyên, chai 500ml nhập giá riêng cao hơn. Để trống ô giá nếu lựa chọn đó
                dùng đúng giá gốc, hệ thống sẽ không ép bạn phải điền.
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
                    placeholder="Giá riêng"
                    title="Giá riêng cho lựa chọn này — để trống nếu dùng đúng giá gốc phía trên"
                    value={
                      option.priceAdjustment
                        ? Math.round(Number(price || 0) + option.priceAdjustment)
                        : ""
                    }
                    onChange={(event) => {
                      const raw = event.target.value;
                      const nextAdjustment =
                        raw === "" ? 0 : Number(raw) - Number(price || 0);
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
          id="quiz"
          icon={Target}
          title="Gắn thẻ cho bài test tóc"
          description="Dùng để bài test tự động gợi ý đúng sản phẩm này — không bắt buộc, để trống nếu sản phẩm không liên quan đến rụng tóc"
        >
          <p className={styles.fieldHint} style={{ marginBottom: 16 }}>
            Chọn tất cả các trường hợp mà sản phẩm này phù hợp. Không cần chọn hết mọi ô — bỏ trống
            một mục nghĩa là mục đó không ảnh hưởng đến việc gợi ý, không phải là loại trừ sản phẩm.
          </p>
          <TagChipGroup
            title="Mục tiêu phù hợp"
            options={QUIZ_GOALS}
            selected={quizTags.goals}
            onToggle={(value) => toggleQuizTag("goals", value)}
          />
          <TagChipGroup
            title="Giai đoạn rụng tóc phù hợp"
            options={QUIZ_STAGES}
            selected={quizTags.stages}
            onToggle={(value) => toggleQuizTag("stages", value)}
          />
          <TagChipGroup
            title="Thời gian rụng tóc phù hợp"
            options={QUIZ_DURATIONS}
            selected={quizTags.durations}
            onToggle={(value) => toggleQuizTag("durations", value)}
          />
          <TagChipGroup
            title="Hình thức điều trị"
            options={QUIZ_FORMATS}
            selected={quizTags.formats}
            onToggle={(value) => toggleQuizTag("formats", value)}
          />
          <TagChipGroup
            title="Phù hợp ưu tiên của khách"
            options={QUIZ_PRIORITIES}
            selected={quizTags.priorities}
            onToggle={(value) => toggleQuizTag("priorities", value)}
          />
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
            <button
              className={panel.saveButton}
              disabled={saving || !canSave}
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
            {!canSave && (
              <p
                style={{ fontSize: 11, color: "var(--admin-faint)", margin: 0 }}
              >
                Cần điền tên, slug, SKU, danh mục và giá trước khi lưu.
              </p>
            )}
          </div>
        </div>

        <div className={styles.sidebarCard}>
          <h3>Tổ chức</h3>
          <div className={styles.saveRow}>
            <label>
              Danh mục (chọn một hoặc nhiều)
              <div
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
