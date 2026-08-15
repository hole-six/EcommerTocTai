export type ProductPricing = {
  price: number;
  salePrice?: number | null;
  compareAtPrice?: number | null;
};

export const formatProductPrice = (value: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);

export const getProductSalePrice = (product: ProductPricing) =>
  typeof product.salePrice === "number" ? product.salePrice : product.price;

export const getProductOriginalPrice = (product: ProductPricing) => {
  const salePrice = getProductSalePrice(product);
  const originalPrice =
    typeof product.compareAtPrice === "number"
      ? product.compareAtPrice
      : typeof product.salePrice === "number"
        ? product.price
        : undefined;

  return typeof originalPrice === "number" && originalPrice > salePrice
    ? originalPrice
    : undefined;
};

export const getProductDiscountPercent = (product: ProductPricing) => {
  const salePrice = getProductSalePrice(product);
  const originalPrice = getProductOriginalPrice(product);
  if (!originalPrice) return 0;
  return Math.round((1 - salePrice / originalPrice) * 100);
};
