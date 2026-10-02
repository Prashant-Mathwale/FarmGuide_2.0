/**
 * Sanitizes user input text by stripping HTML tags and scripts
 * @param {string} text
 * @returns {string}
 */
function sanitizeText(text) {
    if (!text || typeof text !== 'string') return '';
    return text
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<[^>]+>/g, '')
        .trim();
}

module.exports = { sanitizeText };
