export type ProductStatus = "draft" | "active" | "archived";

export type ContentBlockType =
  | "richText" | "featureGrid" | "benefitCards" | "ingredientCards"
  | "howToUse" | "stepTimeline" | "treatmentJourney" | "comparisonTable"
  | "certifications" | "faq" | "reviews" | "recommendations"
  | "bundleContents" | "lifestyleFit" | "thingsToNote" | "additionalInformation";

export type VisibilityRule = { field: string; operator: "equals" | "notEquals" | "contains"; value: string };

export type ProductOption = { id: string; label: string; value: string; description?: string; imageUrl?: string; priceAdjustment?: number };
export type ProductOptionGroup = {
  id: string; title: string; code: string; required: boolean;
  selectionType: "single" | "multiple"; displayType: "radio" | "card" | "button" | "dropdown";
  options: ProductOption[];
};
export type ProductVariant = {
  id: string; sku: string; title: string; price: number; compareAtPrice?: number;
  inventory: number; optionValues: Record<string, string>;
};

export type ProductBlock = {
  id: string; type: ContentBlockType; title?: string; subtitle?: string;
  data: Record<string, unknown>; visibility?: VisibilityRule[]; sortOrder: number; isActive: boolean;
};

export type CatalogProduct = {
  id: string; slug: string; sku: string; name: string; category: string; status: ProductStatus;
  shortDescription: string; price: number; compareAtPrice?: number; inventory: number;
  rating?: number; reviewCount?: number; soldCount?: number; images: string[];
  optionGroups: ProductOptionGroup[]; variants: ProductVariant[]; blocks: ProductBlock[];
  seo?: { title?: string; description?: string };
};
