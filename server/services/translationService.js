import { TranslationServiceClient } from '@google-cloud/translate';
import NodeCache from 'node-cache';
import crypto from 'crypto';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cache: 24 hours TTL, check every 1 hour
const cache = new NodeCache({ stdTTL: 86400, checkperiod: 3600 });

// Lazy initialized client
let translationClient = null;

const getTranslationClient = () => {
    if (translationClient) return translationClient;

    const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    const projectId = process.env.GCP_PROJECT_ID;

    console.log('🌐 Initializing Translation Service...');
    console.log(`📍 Project ID: ${projectId || 'MISSING'}`);
    console.log(`🔑 Credentials Path: ${credentialsPath || 'MISSING'}`);

    try {
        translationClient = new TranslationServiceClient();
        console.log('✅ Translation Client initialized successfully');
        return translationClient;
    } catch (error) {
        console.error('❌ Failed to initialize Translation Client:', error);
        throw error;
    }
};

const getProjectId = () => process.env.GCP_PROJECT_ID;
const getLocation = () => process.env.GCP_LOCATION || 'global';

/**
 * Hash text + target language for cache key
 */
const getCacheKey = (text, targetLanguage) => {
    return crypto.createHash('md5').update(`${text}_${targetLanguage}`).digest('hex');
};

/**
 * Translate a single string or an array of strings
 * @param {string|string[]} text - Text to translate
 * @param {string} targetLanguage - Target language code (hi, kn, ml, en)
 * @param {string} sourceLanguage - Source language code (default: en)
 * @returns {Promise<string|string[]>} - Translated text
 */
export const translateText = async (text, targetLanguage, sourceLanguage = 'en') => {
    if (!text || targetLanguage === sourceLanguage) {
        return text;
    }

    const isArray = Array.isArray(text);
    const textsToTranslate = isArray ? text : [text];

    // 1. Check Cache
    const results = new Array(textsToTranslate.length).fill(null);
    const missingIndices = [];
    const missingTexts = [];

    textsToTranslate.forEach((t, index) => {
        if (!t || t.trim() === '') {
            results[index] = t;
            return;
        }
        const key = getCacheKey(t, targetLanguage);
        const cached = cache.get(key);
        if (cached) {
            results[index] = cached;
        } else {
            missingIndices.push(index);
            missingTexts.push(t);
        }
    });

    // 2. Translate Missing Texts
    if (missingTexts.length > 0) {
        try {
            const client = getTranslationClient();
            const projectId = getProjectId();
            const location = getLocation();

            if (!projectId) {
                console.warn('⚠️ GCP_PROJECT_ID is not set. Skipping translation.');
                return text;
            }

            const request = {
                parent: `projects/${projectId}/locations/${location}`,
                contents: missingTexts,
                mimeType: 'text/plain',
                sourceLanguageCode: sourceLanguage,
                targetLanguageCode: targetLanguage,
            };

            const [response] = await client.translateText(request);

            response.translations.forEach((translation, i) => {
                const translatedText = translation.translatedText;
                const originalIndex = missingIndices[i];
                results[originalIndex] = translatedText;

                // Save to cache
                const key = getCacheKey(missingTexts[i], targetLanguage);
                cache.set(key, translatedText);
            });
        } catch (error) {
            console.error('❌ Translation Error:', error);
            // Fallback to original text for failed translations
            missingIndices.forEach((originalIndex, i) => {
                results[originalIndex] = missingTexts[i];
            });
        }
    }

    return isArray ? results : results[0];
};

/**
 * Efficiently translate an entire object by batching all strings found within it.
 */
export const translateObject = async (obj, targetLanguage) => {
    if (targetLanguage === 'en' || !obj) return obj;

    try {
        // 1. Collect all strings and their paths
        const translations = []; // { path, original }

        function collectStrings(node, path = []) {
            if (typeof node === 'string') {
                if (/[a-zA-Z]/.test(node) && node.length > 1) {
                    translations.push({ path, original: node });
                }
            } else if (Array.isArray(node)) {
                node.forEach((item, i) => collectStrings(item, [...path, i]));
            } else if (typeof node === 'object' && node !== null) {
                for (const key in node) {
                    collectStrings(node[key], [...path, key]);
                }
            }
        }

        collectStrings(obj);

        if (translations.length === 0) return obj;

        // 2. Extract texts and translate in batch
        const texts = translations.map(t => t.original);
        const translatedTexts = await translateText(texts, targetLanguage);

        // 3. Reconstruct object with translated strings
        const newObj = JSON.parse(JSON.stringify(obj));

        translations.forEach((t, i) => {
            let current = newObj;
            for (let j = 0; j < t.path.length - 1; j++) {
                current = current[t.path[j]];
            }
            current[t.path[t.path.length - 1]] = translatedTexts[i];
        });

        return newObj;
    } catch (error) {
        console.error('❌ translateObject Error:', error);
        return obj; // Fallback to original
    }
};
