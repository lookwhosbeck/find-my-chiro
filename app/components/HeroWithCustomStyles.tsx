import styles from './HeroWithCustomStyles.module.css';

export const HeroWithCustomStyles = () => (
  <div className={`${styles.heroContainer} p-9`}>
    <h1>Custom Hero Section</h1>
    <p>This demonstrates using CSS Modules with the design system</p>
  </div>
);
