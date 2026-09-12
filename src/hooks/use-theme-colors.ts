import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

/**
 * ApexCharts needs literal colour strings - `var()` does not resolve inside SVG
 * presentation attributes - so read the theme's CSS variables (stored as the
 * Tailwind-style "R G B" triples in assets/scss/_variables.scss) and hand the
 * charts real rgb() values. Re-reads whenever the switcher changes the theme.
 */

const FALLBACKS: Record<string, string> = {
    primary: 'rgb(132, 90, 223)',
    secondary: 'rgb(35, 183, 229)',
    success: 'rgb(38, 191, 148)',
    warning: 'rgb(245, 184, 73)',
    info: 'rgb(73, 182, 245)',
    danger: 'rgb(230, 83, 60)',
};

const TOKENS = Object.keys(FALLBACKS);

function readColors(): Record<string, string> {
    if (typeof window === 'undefined') return { ...FALLBACKS };

    const styles = getComputedStyle(document.documentElement);
    const result: Record<string, string> = {};

    TOKENS.forEach((token) => {
        const raw = styles.getPropertyValue(`--${token}`).trim();
        const parts = raw.split(/[\s,]+/).filter(Boolean);
        result[token] = parts.length === 3 ? `rgb(${parts.join(', ')})` : FALLBACKS[token];
    });

    return result;
}

export function useThemeColors() {
    // Depend on the switcher's state so a theme change re-reads the variables.
    const themeKey = useSelector((state: any) => `${state?.colorPrimary ?? ''}|${state?.class ?? ''}`);
    const [colors, setColors] = useState<Record<string, string>>(() => readColors());

    useEffect(() => {
        // The <style> block in Rootwrapper is applied by Helmet after render.
        const frame = requestAnimationFrame(() => setColors(readColors()));
        return () => cancelAnimationFrame(frame);
    }, [themeKey]);

    return colors;
}

export default useThemeColors;
