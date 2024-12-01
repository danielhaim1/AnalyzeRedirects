import fs from 'fs';
import path from 'path';

const defaultUrlsPath = path.resolve('./sets/urls.json');
let URLS = [];

try {
    const data = fs.readFileSync(defaultUrlsPath, 'utf8');
    URLS = JSON.parse(data);
} catch (error) {
    if (process.env.NODE_ENV !== 'test') {
        console.error(`Failed to load URLs from ${defaultUrlsPath}:`, error.message);
        process.exit(1);
    } else {
        URLS = [];
    }
}

export class AnalyzeRedirectUtils {
    /**
     * Analyze redirects for duplicates and conflicts.
     * @param {Array} urlList - List of URL objects with Old_URL and New_URL.
     * @returns {Object} - Analysis results: duplicates and conflicts.
     */
    static analyzeRedirects(urlList, priorityUrl = null) {
        const processed = [];
        const duplicateEntries = {};
        const wildcardSuggestions = [];

        urlList.forEach(({ Old_URL, New_URL }) => {
            const cleanedOldUrl = AnalyzeRedirectUtils.cleanUrl(Old_URL);
            const pattern = AnalyzeRedirectUtils.generateRedirectMatch(cleanedOldUrl, New_URL);
            processed.push({ Old_URL: cleanedOldUrl, New_URL, Pattern: pattern });

            if (!duplicateEntries[cleanedOldUrl]) {
                duplicateEntries[cleanedOldUrl] = [];
            }
            duplicateEntries[cleanedOldUrl].push(New_URL);
        });

        const duplicates = Object.keys(duplicateEntries).filter((key) => duplicateEntries[key].length > 1);
        const conflicts = {};

        duplicates.forEach((key) => {
            const uniqueNewUrls = Array.from(new Set(duplicateEntries[key]));
            if (uniqueNewUrls.length > 1) {
                conflicts[key] = uniqueNewUrls;

                if (priorityUrl && uniqueNewUrls.includes(priorityUrl)) {
                    conflicts[key] = [priorityUrl];
                }
            }
        });

        Object.keys(duplicateEntries).forEach((key) => {
            if (key.includes('/category/')) {
                const wildcardPattern = key.replace(/\/category\/.*/, '/category/(.*)');
                if (!wildcardSuggestions.includes(`RedirectMatch 301 ^${wildcardPattern}$ https://example.com/category/`)) {
                    wildcardSuggestions.push(`RedirectMatch 301 ^${wildcardPattern}$ https://example.com/category/`);
                }
            }
        });

        return { processed, duplicates, conflicts, wildcardSuggestions };
    }

    /**
     * Clean a URL: ensures a trailing slash (for directories) and removes query parameters.
     * @param {string} url - URL to clean.
     * @returns {string} - Cleaned URL.
     */
    static cleanUrl(url) {
        let cleanUrl = url.split(/[?#]/)[0]; // Remove query parameters
        cleanUrl = cleanUrl.replace(/\/\/+/, '/'); // Remove double slashes
        if (!cleanUrl.endsWith("/") && !/\.\w+$/.test(cleanUrl)) {
            cleanUrl += "/"; // Add trailing slash if not a file
        }
        return cleanUrl.replace(/\/+$/, '/'); // Ensure exactly one trailing slash for non-files
    }

    /**
     * Generate the appropriate RedirectMatch pattern.
     * @param {string} oldUrl - The cleaned old URL.
     * @param {string} newUrl - The target new URL.
     * @returns {string} - RedirectMatch rule.
     */
    static generateRedirectMatch(oldUrl, newUrl) {
        // Ensure no double slashes and correctly append `/?$` if necessary
        const cleanedOldUrl = oldUrl.replace(/\/+$/, ''); // Remove trailing slashes for normalization
        const isFile = /\.(jpeg|jpg|png|gif|pdf|docx?|xlsx?|pptx?|txt)$/i.test(cleanedOldUrl);
        const escapedOldUrl = cleanedOldUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        return isFile
            ? `RedirectMatch 301 ^${escapedOldUrl}$ ${newUrl}` // Exact match for files
            : `RedirectMatch 301 ^${escapedOldUrl}/?$ ${newUrl}`; // Allow optional trailing slash
    }

    /**
     * Generate RedirectMatch rules for a given URL list.
     * @param {Array} urlList - List of URL objects with Old_URL and New_URL.
     * @returns {Array} - List of RedirectMatch patterns.
     */
    static generateRedirectMatchRules(urlList) {
        return urlList.map(({ Old_URL, New_URL }) => {
            const cleanedUrl = AnalyzeRedirectUtils.cleanUrl(Old_URL);
            const pattern = AnalyzeRedirectUtils.generateRedirectMatch(cleanedUrl, New_URL);
            return { Old_URL: cleanedUrl, New_URL, Pattern: pattern };
        });
    }

    /**
     * Normalize and analyze redirects.
     * @param {Array} [customUrls=URLS] - URL data to analyze.
     * @returns {Object} - Analysis results including processed rules.
     */
    static normalizeAndAnalyze(customUrls = URLS) {
        const normalizedUrls = customUrls.map(({ Old_URL, New_URL }) => ({
            Old_URL: AnalyzeRedirectUtils.cleanUrl(Old_URL),
            New_URL,
        }));

        return AnalyzeRedirectUtils.analyzeRedirects(normalizedUrls);
    }
}
