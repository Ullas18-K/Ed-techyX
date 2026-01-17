import React, { useState, useEffect } from 'react';
import { useTranslationStore } from '@/lib/translationStore';

interface TranslateProps {
    children: string | string[];
}

/**
 * Translate Component
 * Wraps text that needs dynamic translation.
 * Shows the original text initially and updates when translated.
 */
export const Translate: React.FC<TranslateProps> = ({ children }) => {
    const { currentLanguage, translate } = useTranslationStore();
    const textToTranslate = Array.isArray(children) ? children.join('') : children;
    const [translatedText, setTranslatedText] = useState(textToTranslate);

    useEffect(() => {
        let isMounted = true;

        if (currentLanguage === 'en') {
            setTranslatedText(textToTranslate);
            return;
        }

        const performTranslation = async () => {
            const result = await translate(textToTranslate);
            if (isMounted) {
                setTranslatedText(result as string);
            }
        };

        performTranslation();

        return () => {
            isMounted = false;
        };
    }, [textToTranslate, currentLanguage, translate]);

    return <>{translatedText}</>;
};
