import { SiteHeader } from "@/components/sites/manmatters-com-61d14dee/shared/SiteHeader";
import { SiteFooter } from "@/components/sites/manmatters-com-61d14dee/shared/SiteFooter";

export default function PolicyLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main style={{ minHeight: "calc(100vh - 200px)", padding: "120px 20px 60px", maxWidth: "800px", margin: "0 auto", color: "#18345a" }}>
        {children}
      </main>
      <SiteFooter />
    </>
  );
}
