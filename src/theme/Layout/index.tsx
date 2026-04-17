import React from 'react';
import Layout from '@theme-original/Layout';
import type LayoutType from '@theme/Layout';
import type { WrapperProps } from '@docusaurus/types';
import { useLocation } from '@docusaurus/router';
import AzureBanner from '@site/src/components/AzureBanner';

type Props = WrapperProps<typeof LayoutType>;

export default function LayoutWrapper(props: Props): JSX.Element {
  const { pathname } = useLocation();
  const showAzureBanner = /^\/combine-azure(\/|$)/i.test(pathname);

  return (
    <>
      {showAzureBanner && <AzureBanner />}
      <Layout {...props} />
    </>
  );
}
