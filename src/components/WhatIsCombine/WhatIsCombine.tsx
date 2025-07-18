import Link from '@docusaurus/Link';
import styles from './WhatIsCombine.module.css';

export default function WhatIsCombine() {
    return (
      <section className={styles.combineSection}>
        <div className={styles.container}>
          <img className={styles.combineIcon} src="/img/logo.png"/>
          <h2 className={styles.title}>What is Combine?</h2>
          <p className={styles.description}>
            Software written for the commercial, unclassified clouds will not work in the classified cloud regions.
            Combine overcomes this problem by providing a sandbox environment that emulates the classified,
            air-gapped cloud regions.
          </p>
          <div className={styles.buttonGroup}>
            <Link className={styles.primaryButton} to="/category/start-here-">Docs</Link>
            <a className={styles.secondaryButton} href="mailto:service-request@sequoiainc.com">Contact Us</a>
          </div>
        </div>
      </section>
    );
  }