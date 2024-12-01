import { AnalyzeRedirectUtils } from './util.analyze.js';

export class AnalyzeRedirectsManager {
    constructor(selectors = {}) {
        this.selectors = selectors;
    }

    /**
     * Perform a complete analysis of the URLs dynamically loaded from `urls.json`.
     * @returns {Object} - Analysis results.
     */
    analyze() {
        return AnalyzeRedirectUtils.normalizeAndAnalyze();
    }

    /**
     * Custom analysis with a given URL list.
     * @param {Array} customUrls - List of custom URL objects with Old_URL and New_URL.
     * @returns {Object} - Analysis results.
     */
    customAnalyze(customUrls) {
        const normalizedUrls = customUrls.map(({ Old_URL, New_URL }) => ({
            Old_URL: AnalyzeRedirectUtils.cleanUrl(Old_URL),
            New_URL: New_URL,
        }));
        return AnalyzeRedirectUtils.analyzeRedirects(normalizedUrls);
    }
}
