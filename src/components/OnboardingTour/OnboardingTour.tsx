import { useEffect } from 'react';
import 'shepherd.js/dist/css/shepherd.css';
import './onboarding-tour.css';

const TOUR_KEY = 'combine-docs-tour-v1-seen';

export default function OnboardingTour() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (localStorage.getItem(TOUR_KEY)) return;

    import('shepherd.js').then(({ default: Shepherd }) => {
      const tour = new Shepherd.Tour({
        useModalOverlay: true,
        defaultStepOptions: {
          cancelIcon: { enabled: true },
          scrollTo: false,
          classes: 'combine-tour-step',
        },
      });

      tour.addStep({
        id: 'welcome',
        title: 'Welcome to Combine Docs! 👋',
        text: `Here you'll find everything you need to get up and running with Combine — guides, references, and more.<br><br>Let's show you around!`,
        buttons: [
          {
            text: 'Skip',
            classes: 'shepherd-button-secondary',
            action: () => tour.cancel(),
          },
          {
            text: "Let's go! 🚀",
            classes: 'shepherd-button-primary',
            action: () => tour.next(),
          },
        ],
      });

      tour.addStep({
        id: 'start-here',
        title: 'Start Here',
        text: `New to Combine? <strong>Start Here</strong> we have guides that will walk you through everything — from common pitfalls to example codes.<br><br><strong>Click the button</strong> to continue.`,
        attachTo: { element: 'a[href="/category/start-here"]', on: 'bottom' },
        canClickTarget: true,
        buttons: [],
        advanceOn: { selector: 'a[href="/category/start-here"]', event: 'click' },
      });

      tour.addStep({
        id: 'search',
        title: 'Search Is Your Best Friend 🔍',
        text: `Before reaching out, try searching! Look up <em>"EKS"</em>, <em>"Security Group"</em>, <em>"Certificate"</em>, or anything else you're curious about.`,
        attachTo: { element: '.navbar__search', on: 'bottom' },
        buttons: [
          {
            text: 'Got it! ✓',
            classes: 'shepherd-button-primary',
            action: () => tour.complete(),
          },
        ],
        beforeShowPromise() {
          return new Promise((resolve) => setTimeout(resolve, 600));
        },
        when: {
          show() {
            document.querySelector('.navbar__search')?.classList.add('tour-search-sparkle');
          },
          hide() {
            document.querySelector('.navbar__search')?.classList.remove('tour-search-sparkle');
          },
        },
      });

      tour.on('cancel', () => localStorage.setItem(TOUR_KEY, 'true'));
      tour.on('complete', () => localStorage.setItem(TOUR_KEY, 'true'));

      const timer = setTimeout(() => tour.start(), 800);
      return () => clearTimeout(timer);
    });
  }, []);

  return null;
}
