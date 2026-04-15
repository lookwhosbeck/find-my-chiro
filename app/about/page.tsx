import { Header } from '@/app/components/Header';
import { Footer } from '@/app/components/Footer';
import { MarketingShell } from '@/app/components/MarketingShell';
import { MovynLogo } from '@/app/components/MovynLogo';
import styles from './page.module.css';

export default function AboutPage() {
  return (
    <MarketingShell className="page-with-header">
      <Header surface="onLight" />

      <div className={styles.splash}>
        <div className={styles.logoWrap}>
          <MovynLogo />
        </div>
        <p className="text-lg text-muted-foreground">Check back soon, more to come!</p>
      </div>

      <Footer />
    </MarketingShell>
  );
}
