import styles from './SupportSection.module.css';

export default function SupportSection() {
  return (
    <section className={styles.support}>
      <div className={styles.supportContainer}>
        <div className={styles.supportText}>
          <h2 className={styles.supportHeading}>Need Support?</h2>
          <p className={styles.supportParagraph}>
            We are here to help! Reach out to our team and let’s get you moving from low to high.
          </p>
          <a className={styles.supportButton} href="mailto:service-request@sequoiainc.com">Contact Us</a>
        </div>
        <div className={styles.supportIcons}>
          <img src="/img/email.png" alt="Email" />
          <img src="/img/slack.png" alt="Slack" />
          <img src="/img/teams.png" alt="Teams" />
        </div>
      </div>
    </section>
  );
}
