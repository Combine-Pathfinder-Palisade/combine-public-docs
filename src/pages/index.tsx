import Layout from '@theme/Layout';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

import Header from '../components/Header/Header';
import WhatIsCombine from '../components/WhatIsCombine/WhatIsCombine';
import PillarsSection from '../components/PillarsSection/PillarsSection';
import SupportSection from '../components/SupportSection/SupportSection';

export default function Home() {
  const { siteConfig } = useDocusaurusContext();
  return (
    <Layout title={`Hello from ${siteConfig.title}`} description="Explore Combine Docs">
      <Header />
      <main>
        <WhatIsCombine />
        <PillarsSection />
        <SupportSection />
      </main>
    </Layout>
  );
}
