import Image from "next/image";
import styles from "./SiteChrome.module.css";
import { FacebookIcon, InstagramIcon, XIcon, YoutubeIcon } from "./SocialIcons";

const asset = "/sites/manmatters-com-61d14dee/root-8a5edab2/";

export function SiteFooter() {
  return (
    <footer className={`${styles.root} ${styles.footer}`}>
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
  );
}
