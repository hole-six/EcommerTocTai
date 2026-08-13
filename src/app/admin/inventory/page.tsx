import { redirect } from "next/navigation";

export default function AdminInventoryRedirect() {
  redirect("/admin/products");
}
