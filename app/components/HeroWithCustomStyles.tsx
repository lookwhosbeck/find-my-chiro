import { Box } from '@radix-ui/themes';
import styles from './HeroWithCustomStyles.module.css';

export const HeroWithCustomStyles = () => (
  <Box className={styles.heroContainer} p="9">
    <h1>Custom Hero Section</h1>
    <p>This demonstrates using CSS Modules with Radix Themes</p>
  </Box>
);

