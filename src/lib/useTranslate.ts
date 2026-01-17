import { useTranslationStore } from './translationStore';

/**
 * Hook for translating strings in code (e.g. tooltips, toasts)
 */
export const useTranslate = () => {
    const { currentLanguage, translate } = useTranslationStore();

    const t = async (text: string | string[]) => {
        return await translate(text);
    };

    return { t, currentLanguage };
};
