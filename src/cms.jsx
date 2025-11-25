/**
 * CMS Entry Point - Preact Application
 */

import { render } from 'preact';
import { App } from '../js/cms/components/App.jsx';
import '../css/cms.css';

// Mount the Preact app
const rootElement = document.getElementById('cms-root');
if (rootElement) {
    render(<App />, rootElement);
} else {
    console.error('CMS root element not found');
}
