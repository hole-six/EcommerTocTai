"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ChevronDown,
  ChevronRight,
  Menu,
  Plus,
  Search,
  ShoppingBag,
  UserRound,
  X,
  ClipboardList,
  Package,
  Stethoscope,
  CalendarCheck,
} from "lucide-react";
import { FacebookIcon, InstagramIcon, XIcon, YoutubeIcon } from "../shared/SocialIcons";
import { useEffect, useState } from "react";
import styles from "./ManMattersHome.module.css";

const asset = "/sites/manmatters-com-61d14dee/root-8a5edab2/";

const heroSlides = [
  { image: "hero-wellness.png", alt: "Shop Man Matters men's wellness products", cta: "Shop Now", href: "/shop/all" },
  { image: "hero-creatine.png", alt: "Man Matters Creatine and Electrolyte supplement", cta: "Shop Now", href: "/shop/nutrition" },
  { image: "hero-hair.png", alt: "Monsoon causing more hair fall — know what your hair needs", cta: "Take Hair Test", href: "/pages/hair-form-assessment" },
  { image: "hero-assessment.png", alt: "Take the free Man Matters hair assessment", cta: "Take Hair Test", href: "/pages/hair-form-assessment" },
];

const concerns = [
  { name: "Hair", alt: "Men's hair care and regrowth solutions", image: "concern-hair.png", href: "/hair-matters" },
  { name: "Beard", alt: "Men's beard growth and grooming solutions", image: "concern-beard.png", href: "/beard-matters" },
  { name: "Skin", alt: "Men's skin care solutions", image: "concern-skin.png", href: "/skin-matters" },
  { name: "Nutrition", alt: "Men's nutrition and wellness supplements", image: "concern-nutrition.png", href: "/nutrition-matters" },
];

const trustBadges = ["Third Party Lab Tested", "Clinically Tested", "Scientifically Backed", "Clean Ingredients", "Expert Formulated", "NABL Lab Tested"];

const nutritionProducts = [
  { tag: "Complete performance & recovery supplement", name: "Creatine + Electrolyte", price: "₹549", original: "₹749", rating: "4.5", image: "product-electrolyte.jpg" },
  { tag: "High Intensity Workouts | Building Lean Muscle Mass | Cognitive Function", name: "Micronised Creatine Monohydrate (125g - Mixed Fruit Flavour)", price: "₹449", original: "₹599", rating: "4.5", image: "product-creatine.jpg" },
  { tag: "Strength and Endurance", name: "Shilajit Gummies (1 Month Pack)", price: "₹899", original: "₹999", rating: "4.5", image: "product-shilajit.png" },
  { tag: "Better Sleep and Reduced Stress", name: "Advanced Magnesium Gummies 60N", price: "₹949", original: "₹999", rating: "4.7", image: "product-magnesium.jpg" },
  { tag: "Muscle Pain and Recovery", name: "10% Magnesium Body Lotion - 200 ml", price: "₹399", original: "", rating: "4.5", image: "product-lotion.png" },
  { tag: "Strength and Endurance", name: "Shilajit Gummies Advanced (1 Month Pack)", price: "₹999", original: "₹1099", rating: "4.6", image: "product-shilajit-advanced.png" },
];

const categories = ["Nutrition", "Hair", "Beard", "Performance", "Hygiene", "Skin"];

const steps = [
  { icon: ClipboardList, label: "Take the Hair Test", n: "01" },
  { icon: Package, label: "Get a stage-matched kit", n: "02" },
  { icon: Stethoscope, label: "Consult an expert", n: "03" },
  { icon: CalendarCheck, label: "See results in 5-6 months", n: "04" },
];

const reviews = ["review-1.png", "review-2.png", "review-3.png", "review-4.png", "review-5.png"];

const faqs = [
  {
    q: "What is Man Matters?",
    a: "Man Matters is India's leading science-backed men's health platform focused on providing clinically credible solutions across hair care, beard growth, nutrition, sleep, and wellness. Built around doctor consultations and evidence-led formulations, the platform has helped over 10 lakh Indian men address hair loss and other health concerns over the past six years.",
  },
  {
    q: "Are Man Matters products safe to use?",
    a: "Yes. Every formulation goes through ingredient-level clinical review before it's added to a product, and active ingredient levels are tested for consistency and purity. Prescription-only treatments require a valid prescription and doctor consultation. Always check the product label, and consult a doctor if you have an existing health condition.",
  },
  {
    q: "Does Man Matters actually work?",
    a: "Results depend on the concern, the product, and consistency of use — outcomes vary by individual. Every formulation is backed by clinical evidence and developed with category experts, and each concern comes with a realistic timeline rather than a blanket promise.",
  },
  {
    q: "Are Man Matters products doctor-recommended?",
    a: "Every formulation is developed with domain experts and research scientists — involved from the start. Prescription treatments are additionally reviewed by a registered medical practitioner before they're recommended to you.",
  },
  {
    q: "What concerns can I use Man Matters for?",
    a: "Man Matters covers concerns such as: hair (loss, thinning, dandruff), skin, beard growth and grooming, and nutrition and supplements. Pick your concern on the homepage, and the platform recommends products built for it — no browsing a generic catalogue, no guessing what's relevant to you.",
  },
];

export function ManMattersHome() {
  const [slide, setSlide] = useState(0);
  const [activeCategory, setActiveCategory] = useState("Nutrition");
  const [cart, setCart] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    const timer = window.setInterval(() => setSlide((value) => (value + 1) % heroSlides.length), 4800);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <main className={styles.page}>
      <div className={styles.promo}>
        Use MM Wallet and save upto 30%
        <button>Download App</button>
      </div>

      <div className={styles.headerWrap}>
        <header className={styles.header}>
          <button className={styles.menuButton} onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">
            {menuOpen ? <X /> : <Menu />}
          </button>
          <Link href="/">
            <Image className={styles.logo} src={`${asset}logo.png`} alt="Man Matters" width={150} height={41} priority />
          </Link>
          <nav className={`${styles.nav} ${menuOpen ? styles.open : ""}`}>
            <a href="/login">Login</a>
            <Link href="/">Home</Link>
            <button>
              Choose Product <ChevronDown size={14} />
            </button>
            <a href="/shop/all">All Products</a>
            <a href="/habit/honest-report">Honest Reports</a>
            <a href="/pages/hair-form-assessment">Hair Assessment</a>
          </nav>
          <div className={styles.actions}>
            <button aria-label="Search">
              <Search size={20} />
            </button>
            <button aria-label="Profile">
              <UserRound size={20} />
            </button>
            <button className={styles.bag} aria-label="Cart" onClick={() => setCart((v) => v + 1)}>
              <ShoppingBag size={20} />
              {cart > 0 && <b>{cart}</b>}
            </button>
          </div>
        </header>
      </div>

      <section className={styles.hero}>
        {heroSlides.map((s, index) => (
          <Image
            key={s.image}
            className={`${styles.heroImage} ${index === slide ? styles.activeSlide : ""}`}
            src={`${asset}${s.image}`}
            alt={s.alt}
            width={1440}
            height={692}
            priority={index === 0}
          />
        ))}
        <a className={styles.heroCta} href={heroSlides[slide].href}>
          {heroSlides[slide].cta}
        </a>
        <div className={styles.dots}>
          {heroSlides.map((s, index) => (
            <button key={s.image} onClick={() => setSlide(index)} className={index === slide ? styles.activeDot : ""} aria-label={`Show slide ${index + 1}`} />
          ))}
        </div>
      </section>

      <section className={styles.statBar}>
        <div className={styles.statBarInner}>
          <div>
            <b>10L+</b>
            <span>Indian Men on the Platform</span>
          </div>
          <div className={styles.statDivider} />
          <div>
            <b>250+</b>
            <span>Experts for Consultation</span>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <h1 className={styles.sectionHeading}>Explore By Concerns</h1>
        <div className={styles.concernGrid}>
          {concerns.map((c) => (
            <a href={c.href} className={styles.concern} key={c.name}>
              <Image src={`${asset}${c.image}`} alt={c.alt} width={640} height={800} />
              <div className={styles.concernLabel}>
                <span>{c.name}</span>
                <ChevronRight color="#fff" size={20} />
              </div>
            </a>
          ))}
        </div>
      </section>

      <div className={styles.marqueeWrap}>
        <div className={styles.marquee}>
          {[...trustBadges, ...trustBadges].map((label, i) => (
            <span key={i}>
              ✦ {label}
            </span>
          ))}
        </div>
      </div>

      <section id="shop" className={`${styles.section} ${styles.shop}`}>
        <h2>Our Bestsellers</h2>
        <div className={styles.categoryRow}>
          {categories.map((category) => (
            <button key={category} onClick={() => setActiveCategory(category)} className={activeCategory === category ? styles.selectedCategory : ""}>
              {category}
            </button>
          ))}
        </div>
        <div className={styles.productGrid}>
          {(activeCategory === "Nutrition" ? nutritionProducts : nutritionProducts).map((p) => (
            <article className={styles.product} key={p.name}>
              <div className={styles.productImage}>
                <Image src={`${asset}${p.image}`} alt={p.name} width={800} height={800} />
              </div>
              <div className={styles.productBody}>
                <p>{p.tag}</p>
                <h3>{p.name}</h3>
                <div className={styles.priceRow}>
                  <strong>{p.price}</strong>
                  {p.original && <del>{p.original}</del>}
                  <em>★ {p.rating}</em>
                </div>
                <button onClick={() => setCart((v) => v + 1)}>
                  <Plus size={16} /> ADD
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.guessworkCard}>
          <h2>Don&apos;t Leave Hair Loss to Guesswork</h2>
          <div className={styles.stepsGrid}>
            {steps.map((s) => (
              <div className={styles.step} key={s.label}>
                <s.icon size={28} />
                <span>{s.label}</span>
                <em>{s.n}</em>
              </div>
            ))}
          </div>
          <a className={styles.guessworkCta} href="/pages/hair-form-assessment">
            Take the hair test <ChevronRight size={16} />
          </a>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionHeading}>Real Men. Real Reviews.</h2>
        <div className={styles.reviews}>
          {reviews.map((r) => (
            <Image key={r} src={`${asset}${r}`} alt="Review from a Man Matters customer" width={500} height={735} />
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.experts}>
          <h2>Built with Leading Experts.</h2>
          <p>Specialists with decades of combined experience, committed to clinical rigor and long-term results.</p>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionHeading}>Frequently Asked Questions</h2>
        <div className={styles.faq}>
          {faqs.map((f, i) => (
            <div className={`${styles.faqItem} ${openFaq === i ? styles.faqOpen : ""}`} key={f.q}>
              <button onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                {f.q}
                <ChevronDown size={18} />
              </button>
              <div className={styles.faqAnswer}>
                <p>{f.a}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerTop}>
            <Image src={`${asset}logo.png`} alt="Man Matters" width={150} height={41} />
            <div className={styles.appBadges}>
              <a href="https://play.google.com/store">
                <Image src={`${asset}app-google.png`} alt="Get it on Google Play" width={130} height={40} />
              </a>
              <a href="https://apps.apple.com">
                <Image src={`${asset}app-apple.png`} alt="Download on the App Store" width={130} height={44} />
              </a>
            </div>
          </div>
          <div className={styles.linkGroup}>
            <a href="/hair-matters">Hair Matters</a>
            <a href="/beard-matters">Beard Matters</a>
            <a href="/nutrition-matters">Nutrition Matters</a>
          </div>
          <div className={styles.linkGroup}>
            <a href="/refunds-policy">Returns & Refunds</a>
            <a href="/contact-us">Contact Us</a>
            <a href="/privacy-policy">Privacy Policy</a>
          </div>
          <div className={styles.linkGroup}>
            <a href="/faq">FAQs</a>
            <a href="/about-us">About Us</a>
            <a href="/sitemap">Site Map</a>
            <a href="/terms-and-conditions">Terms & Conditions</a>
            <a href="/blog">Blog</a>
          </div>
          <div className={styles.footerBottom}>
            © 2020-25 Mosaic Wellness PVT LTD. All rights reserved.
            <a href="/terms-and-conditions">Terms of Service</a>
          </div>
          <div className={styles.socials}>
            <a href="https://facebook.com" aria-label="Facebook">
              <FacebookIcon size={16} />
            </a>
            <a href="https://instagram.com" aria-label="Instagram">
              <InstagramIcon size={16} />
            </a>
            <a href="https://twitter.com" aria-label="X">
              <XIcon size={16} />
            </a>
            <a href="https://youtube.com" aria-label="YouTube">
              <YoutubeIcon size={16} />
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}
