import { AnalyzeRedirectsManager } from './src/index.js';

const AnalyzeRedirects = {
    AnalyzeRedirectsManager
};

// Export for Node.js environment
if (typeof module === 'object' && module.exports) {
    module.exports = AnalyzeRedirects;
}

// Export for AMD environment
if (typeof define === 'function' && define.amd) {
    define('AnalyzeRedirects', [], function() {
        return AnalyzeRedirects;
    });
}

// Export for web environment
if (typeof window === 'object') {
    window.AnalyzeRedirects = AnalyzeRedirects;
}
