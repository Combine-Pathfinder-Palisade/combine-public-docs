import React from 'react';

interface DownloadButtonProps {
  file: string;
  label?: string;
}

const DownloadButton: React.FC<DownloadButtonProps> = ({ file, label = 'Download' }) => {
  return (
    <a
      href={file}
      download
      className="button button--secondary"
      style={{ margin: '1rem 0', display: 'inline-block' }}
    >
      {label}
    </a>
  );
};

export default DownloadButton;
