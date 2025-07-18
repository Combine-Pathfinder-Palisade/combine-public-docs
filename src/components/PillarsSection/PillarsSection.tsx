import styles from './PillarsSection.module.css';

const pillars = [
  {
    icon: '/img/airgap.png',
    pillarTitle: 'Air-Gapping',
    description: 'Combine blocks and reports all internet-bound calls.',
  },
  {
    icon: '/img/service.png',
    pillarTitle: 'Service Parity',
    description: 'Combine reflects classified cloud service availability.',
  },
  {
    icon: '/img/control.png',
    pillarTitle: 'Access Control',
    description: 'Combine is aligned with government cloud permissions.',
  },
  {
    icon: '/img/endpoints.png',
    pillarTitle: 'Customer Endpoints',
    description: 'Combine rewrites calls for secure classified endpoints.',
  },
];

export default function PillarsSection() {
  return (
    <section className={styles.pillars}>
      <div className="container">
        <h2 className={styles.heading}>Four Pillars of Combine</h2>
        <div className={styles.pillarGrid}>
          {pillars.map((pillar, index) => (
            <div key={index} className={styles.flipCard}>
              <div className={styles.flipCardInner}>
                <div className={styles.flipCardFront}>
                  <img
                    src={pillar.icon}
                    alt={pillar.pillarTitle}
                    className={styles.iconImage}
                  />
                  <div className={styles.pillarTitle}>{pillar.pillarTitle}</div>
                </div>
                <div className={styles.flipCardBack}>
                  <p>{pillar.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
