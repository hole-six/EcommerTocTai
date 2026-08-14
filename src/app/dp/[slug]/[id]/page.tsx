import { permanentRedirect } from "next/navigation";

export default async function LegacyProductPage({ params }: PageProps<"/dp/[slug]/[id]">) {
  const { slug } = await params;
  permanentRedirect(`/san-pham/${slug}`);
}
