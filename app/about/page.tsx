import { Flex, Text } from '@radix-ui/themes';
import { Header } from '@/app/components/Header';
import { Footer } from '@/app/components/Footer';
import { MovynLogo } from '@/app/components/MovynLogo';
import styles from './page.module.css';

export default function AboutPage() {
  return (
    <Flex direction="column" style={{ minHeight: '100vh' }} className="page-with-header">
      <Header surface="onLight" />

      <div className={styles.splash}>
        <div className={styles.logoWrap}>
          <MovynLogo />
        </div>
        <Text size="5" color="gray">
          Check back soon, more to come!
        </Text>
      </div>

      <Footer />
    </Flex>
  );
}
