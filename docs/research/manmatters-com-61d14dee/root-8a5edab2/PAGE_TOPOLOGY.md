# Page topology — / (home)

Rebuilt 2026-08-11 with real browser extraction (Chrome MCP). Design system: MiSansLatin font (self-hosted, 3 weights), navy #143461 / blue #22548a primary, yellow #f6ca4c accent, light-blue tints #f2f7fc/#ebf0f5/#d0def1, link blue #0876e3.

1. Promo topbar (navy, non-sticky — scrolls away): "Use MM Wallet and save upto 30%" + Download App button.
2. Sticky white header (`position: sticky; top:0; z-index:10`, native CSS — no JS scroll listener needed): logo, nav (Login/Home/Choose Product▾/All Products/Honest Reports/Hair Assessment), search/profile/cart icons.
3. Hero: 4-slide carousel, full-bleed banner PNGs with headline text baked into the image (not HTML overlay) — only the CTA button + dot nav are HTML. Auto-rotates every 4.8s, CSS opacity crossfade (0.6s).
4. Stat bar: rounded gradient card, "10L+ Indian Men on the Platform | 250+ Experts for Consultation".
5. Explore By Concerns: 4-photo grid (Hair/Beard/Skin/Nutrition), real model photos, dark gradient bottom overlay, name + chevron.
6. Trust marquee: infinite CSS-animated horizontal ticker, 6 badges (Third Party Lab Tested, Clinically Tested, Scientifically Backed, Clean Ingredients, Expert Formulated, NABL Lab Tested).
7. Our Bestsellers: 6 category pills (Nutrition/Hair/Beard/Performance/Hygiene/Skin, click-driven), product grid — real data captured for Nutrition tab (6 SKUs w/ real prices/ratings/images). Other 5 tabs' real product sets deferred to the /shop/* category-page build (task tracked separately) since they duplicate that data.
8. "Don't Leave Hair Loss to Guesswork": gradient card, 4 numbered steps, CTA button.
9. "Real Men. Real Reviews.": 5 real customer-review screenshot images, horizontal scroll.
10. "Built with Leading Experts.": dark navy banner (expert headshot photo could not be located as a discrete `<img>` — likely virtualized/lazy asset; approximated with text-only banner).
11. FAQ accordion: 4 real Q&A pairs, click-to-expand.
12. Footer: logo + app store badges, 3 link groups (Hair/Beard/Nutrition Matters · Returns/Contact/Privacy · FAQs/About/SiteMap/Terms/Blog), copyright, social icons.

All assets are real, downloaded from the live site (see `scripts/download-assets-manmatters-com-61d14dee-root-8a5edab2.ps1`).
