import styles from "./SiteChrome.module.css";
import { FacebookIcon, InstagramIcon, XIcon, YoutubeIcon } from "./SocialIcons";

export function SiteFooter() {
  return (
    <footer className={`${styles.root} ${styles.footer}`}>
      <div className={styles.footerInner}>
        <div className={styles.footerTop}>
          <div className={styles.textLogo}>TÓC<i>TAI</i><small>STUDIO</small></div>
          <div className={styles.appBadges}><span>Routine chăm sóc tóc cá nhân hóa</span></div>
        </div>
        <div className={styles.linkGroup}><a href="/hair-matters">Giải pháp tóc rụng</a><a href="/beard-matters">Chăm sóc da đầu</a><a href="/nutrition-matters">Phục hồi tóc</a></div>
        <div className={styles.linkGroup}><a href="/refunds-policy">Đổi trả & hoàn tiền</a><a href="/contact-us">Liên hệ</a><a href="/privacy-policy">Chính sách bảo mật</a></div>
        <div className={styles.linkGroup}><a href="/faq">Câu hỏi thường gặp</a><a href="/about-us">Về Tóc Tai</a><a href="/sitemap">Sơ đồ website</a><a href="/terms-and-conditions">Điều khoản sử dụng</a><a href="/blog">Tạp chí tóc</a></div>
        <div className={styles.footerBottom}>© 2026 Tóc Tai Studio. All rights reserved.<a href="/terms-and-conditions">Điều khoản dịch vụ</a></div>
        <div className={styles.socials}><a href="https://facebook.com" aria-label="Facebook"><FacebookIcon size={16} /></a><a href="https://instagram.com" aria-label="Instagram"><InstagramIcon size={16} /></a><a href="https://twitter.com" aria-label="X"><XIcon size={16} /></a><a href="https://youtube.com" aria-label="YouTube"><YoutubeIcon size={16} /></a></div>
      </div>
    </footer>
  );
}
