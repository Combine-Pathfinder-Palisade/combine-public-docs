import React, {type ReactNode} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useBaseUrl from '@docusaurus/useBaseUrl';
import type {Props} from '@theme/NotFound/Content';
import Heading from '@theme/Heading';
import BrokenRobot from './BrokenRobot';
import styles from './styles.module.css';

export default function NotFoundContent({className}: Props): ReactNode {
  return (
    <main className={clsx('container margin-vert--xl', className)}>
      {/* Points at the navbar search box. Hidden on narrow screens where the
          navbar collapses and the arrow would aim at nothing. */}
      <div className={styles.searchPointer} aria-hidden="true">
        <svg
          className={styles.searchArrow}
          viewBox="0 0 120 130"
          fill="none"
          xmlns="http://www.w3.org/2000/svg">
          <path
            d="M8 116C44 116 84 100 84 37"
            stroke="currentColor"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeDasharray="9 8"
          />
          <path
            d="M74 34 84 18 94 34"
            stroke="currentColor"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span className={styles.searchLabel}>Search up here!</span>
      </div>

      <div className="row">
        <div className={clsx('col col--8 col--offset-2', styles.content)}>
          <BrokenRobot className={styles.robot} />

          <Heading as="h1" className="hero__title">
            Page Not Found?!
          </Heading>

          <p className={styles.lead}>
            Sorry! This site changes a lot as we are rapidly adding new
            documentation to support our Combine customers.
          </p>
          <p className={styles.lead}>
            Please try searching for what you&rsquo;re looking for in the top
            right &mdash; I guarantee it&rsquo;ll probably be there.
          </p>

          <p>
            <Link
              className="button button--primary button--lg"
              to={useBaseUrl('/')}>
              Back to the docs home
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
