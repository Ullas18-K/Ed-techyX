import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useAuthStore } from './authStore';

interface TranslationState {
    currentLanguage: string;
    cache: Record<string, string>; // hash_lang -> translation
    setLanguage: (lang: string) => void;
    translate: (text: string | string[]) => Promise<string | string[]>;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:9000/api';

// Translation Queue for Batching
let pendingTranslations: Map<string, { resolve: (val: string) => void, reject: (err: any) => void }> = new Map();
let translationTimeout: any = null;

const processQueue = async (targetLanguage: string) => {
    if (pendingTranslations.size === 0) return;

    const currentQueue = pendingTranslations;
    pendingTranslations = new Map();
    translationTimeout = null;

    const textsToTranslate = Array.from(currentQueue.keys());
    console.log(`🌐 [Batch] Requesting translation for ${textsToTranslate.length} items to ${targetLanguage}...`);

    try {
        const token = useAuthStore.getState().token;
        const response = await fetch(`${API_URL}/translate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                text: textsToTranslate,
                targetLanguage
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        if (!data.success) throw new Error(data.message || 'Translation failed');

        const translations = Array.isArray(data.translatedText) ? data.translatedText : [data.translatedText];

        // Update cache in the store after batch completes
        const newCache: Record<string, string> = {};

        textsToTranslate.forEach((original, i) => {
            const translated = translations[i];
            const handler = currentQueue.get(original);
            if (handler) {
                handler.resolve(translated);
                newCache[`${original}_${targetLanguage}`] = translated;
            }
        });

        return newCache;
    } catch (error) {
        console.error('❌ [Batch] Translation Error:', error);
        currentQueue.forEach((handler, original) => {
            handler.resolve(original); // Fallback to original
        });
        return {};
    }
};

export const useTranslationStore = create<TranslationState>()(
    persist(
        (set, get) => ({
            currentLanguage: 'en',
            cache: {},

            setLanguage: (lang: string) => {
                console.log(`🌐 [Store] Setting language to: ${lang}`);
                set({ currentLanguage: lang });
                // Note: Cache stays, components will re-trigger translate
            },

            translate: async (text: string | string[]): Promise<string | string[]> => {
                const { currentLanguage, cache } = get();

                if (currentLanguage === 'en' || !text) {
                    return text;
                }

                const isArray = Array.isArray(text);
                const texts = isArray ? text : [text];
                const results = new Array(texts.length).fill(null);
                const missingIndices: number[] = [];

                texts.forEach((t, i) => {
                    const key = `${t}_${currentLanguage}`;
                    if (cache[key]) {
                        results[i] = cache[key];
                    } else {
                        missingIndices.push(i);
                    }
                });

                if (missingIndices.length > 0) {
                    const promises = missingIndices.map(index => {
                        const original = texts[index];
                        return new Promise<string>((resolve, reject) => {
                            pendingTranslations.set(original, { resolve, reject });
                        });
                    });

                    // Set/Reset timeout
                    if (!translationTimeout) {
                        translationTimeout = setTimeout(async () => {
                            const newCacheEntries = await processQueue(currentLanguage);
                            set({ cache: { ...get().cache, ...newCacheEntries } });
                        }, 50); // 50ms batching window
                    }

                    const translatedResults = await Promise.all(promises);
                    translatedResults.forEach((val, i) => {
                        results[missingIndices[i]] = val;
                    });
                }

                return isArray ? results : results[0];
            }
        }),
        {
            name: 'translation-storage',
            partialize: (state) => ({ currentLanguage: state.currentLanguage, cache: state.cache }),
        }
    )
);
