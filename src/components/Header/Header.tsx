import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Heading from '@theme/Heading';

import styles from './Header.module.css';

export default function Header() {
  const { siteConfig } = useDocusaurusContext();
  return (
    <header className={clsx(styles.heroBanner)}>
      <img src="/img/forest-bg.jpg" className={styles.heroBg} alt="Forest Background" />
      <div className={styles.heroContent}>
        <Heading as="h1" className={styles.heroTitle}>
          Welcome to the Combine Documentation
        </Heading>

        <div className={styles.buttonGroup}>
          <Link className={styles.primaryButton} to="/category/start-here">
            Start Here
          </Link>
        </div>
      </div>
    </header>
  );
}