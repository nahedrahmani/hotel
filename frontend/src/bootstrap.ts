import * as bootstrap from 'bootstrap';

declare global {
    interface Window {
        bootstrap: typeof bootstrap;
    }
}

if (typeof window !== 'undefined') {
    window.bootstrap = bootstrap;
}

export {};
