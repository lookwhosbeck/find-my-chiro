import { Header } from '@/app/components/Header';
import { Footer } from '@/app/components/Footer';
import { MovynLogo } from '@/app/components/MovynLogo';
import styles from './page.module.css';

export default function AboutPage() {
  return (
    <div className="page-with-header flex min-h-screen flex-col">
      <Header surface="onLight" />

      <div className={styles.splash}>
        <div className={styles.logoWrap}>
          <MovynLogo />
        </div>
        <p className="text-lg text-muted-foreground">Check back soon, more to come!</p>
      </div>

      <Footer />
    </div>
  );
}
