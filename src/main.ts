import './styles/index.css';
import './styles/components.css';
import { App } from './app';

// Defer init until after first paint to avoid "Layout was forced before the page was fully loaded"
// when external styles (e.g. Google Fonts) are still loading.
requestAnimationFrame(() => {
  new App();
});
