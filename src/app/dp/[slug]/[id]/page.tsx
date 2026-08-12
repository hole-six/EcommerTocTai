import { redirect } from "next/navigation";

export default async function LegacyProductPage({ params }: PageProps<"/dp/[slug]/[id]">) {
  const { slug } = await params;
  redirect(`/san-pham/${slug}`);
}
