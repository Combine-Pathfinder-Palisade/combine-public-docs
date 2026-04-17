import React from 'react';

export default function AzureBanner(): JSX.Element {
  return (
    <div
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 9999,
        background: '#4578e6',
        color: '#fff',
        padding: '0.75rem 1rem',
        textAlign: 'center',
        boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
      }}
    >
      Please be aware that Azure is experiencing a severe shortage of Compute
      resources. Please reach out to the{' '}
      <a
        href="mailto:service-request@sequoiainc.com"
        style={{ color: '#fff', textDecoration: 'underline' }}
      >
        combine team
      </a>{' '}
      for more information, or how this might affect you.
    </div>
  );
}
