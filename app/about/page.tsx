import { Flex, Text } from '@radix-ui/themes';
import { Header } from '@/app/components/Header';
import { Footer } from '@/app/components/Footer';
import { FindMyChiroLogo } from '@/app/components/FindMyChiroLogo';
import styles from './page.module.css';

export default function AboutPage() {
  return (
    <Flex direction="column" style={{ minHeight: '100vh' }} className="page-with-header">
      <Header surface="onLight" />

      <div className={styles.splash}>
        <div className={styles.logoWrap}>
          <FindMyChiroLogo />
        </div>
        <Text size="5" color="gray">
          Check back soon, more to come!
        </Text>
      </div>

      <Footer />
    </Flex>
  );
}
