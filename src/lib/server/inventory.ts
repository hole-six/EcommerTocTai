import { isValidObjectId } from "mongoose";
import { CatalogProduct } from "@/models/CatalogProduct";
import { Order } from "@/models/Order";
import { Product } from "@/models/Product";

type OrderLine = { product?: unknown; catalogProductId?: string; quantity?: number };
type InventoryState = "reserved" | "committed" | "released" | "returned";
const quantityOf = (line: OrderLine) => Math.max(1, Number(line.quantity ?? 0));
const productIdOf = (line: OrderLine) => line.product ? String(line.product) : "";
const isCatalog = (line: OrderLine) => !productIdOf(line) && Boolean(line.catalogProductId);
const available = (quantity: number) => ({ $expr: { $gte: [{ $subtract: [{ $ifNull: ["$inventory", 0] }, { $ifNull: ["$reservedInventory", 0] }] }, quantity] } });

export class InventoryError extends Error { constructor(message: string, public readonly code: "OUT_OF_STOCK" | "BUSY") { super(message); } }

async function reserveLine(line: OrderLine) {
  const quantity = quantityOf(line);
  if (isCatalog(line)) return CatalogProduct.findOneAndUpdate({ id: line.catalogProductId, status: "active", ...available(quantity) }, { $inc: { reservedInventory: quantity } }, { new: true });
  const id = productIdOf(line);
  if (!isValidObjectId(id)) return null;
  return Product.findOneAndUpdate({ _id: id, status: "active", ...available(quantity) }, { $inc: { reservedInventory: quantity } }, { new: true });
}
async function releaseLine(line: OrderLine) {
  const quantity = quantityOf(line);
  if (isCatalog(line)) return CatalogProduct.updateOne({ id: line.catalogProductId, reservedInventory: { $gte: quantity } }, { $inc: { reservedInventory: -quantity } });
  const id = productIdOf(line); if (!isValidObjectId(id)) return null;
  return Product.updateOne({ _id: id, reservedInventory: { $gte: quantity } }, { $inc: { reservedInventory: -quantity } });
}
async function commitLine(line: OrderLine) {
  const quantity = quantityOf(line);
  if (isCatalog(line)) return CatalogProduct.updateOne({ id: line.catalogProductId, inventory: { $gte: quantity }, reservedInventory: { $gte: quantity } }, { $inc: { inventory: -quantity, reservedInventory: -quantity } });
  const id = productIdOf(line); if (!isValidObjectId(id)) return null;
  return Product.updateOne({ _id: id, inventory: { $gte: quantity }, reservedInventory: { $gte: quantity } }, { $inc: { inventory: -quantity, reservedInventory: -quantity } });
}
async function returnLine(line: OrderLine) {
  const quantity = quantityOf(line);
  if (isCatalog(line)) return CatalogProduct.updateOne({ id: line.catalogProductId }, { $inc: { inventory: quantity } });
  const id = productIdOf(line); if (!isValidObjectId(id)) return null;
  return Product.updateOne({ _id: id }, { $inc: { inventory: quantity } });
}

export async function reserveOrder(orderId: string) {
  const order = await Order.findOneAndUpdate({ _id: orderId, inventoryState: "none" }, { $set: { inventoryState: "reserving" } }, { new: true }).lean();
  if (!order) throw new InventoryError("Đơn đang được xử lý tồn kho.", "BUSY");
  const reserved: OrderLine[] = [];
  try { for (const line of order.items as OrderLine[]) { if (!await reserveLine(line)) throw new InventoryError("Một hoặc nhiều sản phẩm vừa hết hàng.", "OUT_OF_STOCK"); reserved.push(line); } await Order.updateOne({ _id: orderId, inventoryState: "reserving" }, { $set: { inventoryState: "reserved" } }); }
  catch (error) { await Promise.all(reserved.map(releaseLine)); await Order.updateOne({ _id: orderId }, { $set: { inventoryState: "none" } }); throw error; }
}

export async function settleOrderInventory(orderId: string, next: InventoryState) {
  const expected = next === "committed" ? "reserved" : next === "released" ? "reserved" : "committed";
  const locking = next === "committed" ? "committing" : next === "released" ? "releasing" : "returning";
  const order = await Order.findOneAndUpdate({ _id: orderId, inventoryState: expected }, { $set: { inventoryState: locking } }, { new: true }).lean();
  if (!order) return false;
  const lines = order.items as OrderLine[];
  const apply = next === "committed" ? commitLine : next === "released" ? releaseLine : returnLine;
  const undo = next === "committed" ? async (line: OrderLine) => { const quantity = quantityOf(line); if (isCatalog(line)) return CatalogProduct.updateOne({ id: line.catalogProductId }, { $inc: { inventory: quantity, reservedInventory: quantity } }); const id = productIdOf(line); return isValidObjectId(id) ? Product.updateOne({ _id: id }, { $inc: { inventory: quantity, reservedInventory: quantity } }) : null; } : next === "released" ? reserveLine : async (line: OrderLine) => { const quantity = quantityOf(line); if (isCatalog(line)) return CatalogProduct.updateOne({ id: line.catalogProductId, inventory: { $gte: quantity } }, { $inc: { inventory: -quantity } }); const id = productIdOf(line); return isValidObjectId(id) ? Product.updateOne({ _id: id, inventory: { $gte: quantity } }, { $inc: { inventory: -quantity } }) : null; };
  const done: OrderLine[] = [];
  try { for (const line of lines) { const result = await apply(line); if (!result || !("modifiedCount" in result) || result.modifiedCount !== 1) throw new InventoryError("Không thể đồng bộ tồn kho cho đơn này.", "OUT_OF_STOCK"); done.push(line); } await Order.updateOne({ _id: orderId, inventoryState: locking }, { $set: { inventoryState: next } }); return true; }
  catch (error) { await Promise.all(done.map(undo)); await Order.updateOne({ _id: orderId }, { $set: { inventoryState: expected } }); throw error; }
}
