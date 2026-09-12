// Flat config: the template shipped a v8 `.eslintrc.json` but depends on
// ESLint 9, which only reads this format.
import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

/**
 * Files that came with the Ynex template. They are left as the vendor wrote
 * them, so the rules their style trips are downgraded here rather than
 * repo-wide - application code is still held to the full set.
 */
const VENDORED = [
    'src/@spk/**',
    'src/components/common/switcher/**',
    'src/components/common/sidebar/**',
    'src/components/common/modal-search/**',
    'src/components/common/backtotop/**',
    'src/components/ui/data/switcherdata/**',
    'src/container/error/**',
    'src/pages/**',
];

export default tseslint.config(
    { ignores: ['dist', 'node_modules', 'src/assets'] },
    {
        extends: [js.configs.recommended, ...tseslint.configs.recommended],
        files: ['**/*.{ts,tsx}'],
        languageOptions: {
            ecmaVersion: 2020,
            globals: globals.browser,
        },
        plugins: {
            'react-hooks': reactHooks,
            'react-refresh': reactRefresh,
        },
        rules: {
            ...reactHooks.configs.recommended.rules,
            'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
            // The template's layout and theme code leans on `any` throughout.
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
        },
    },
    {
        files: VENDORED,
        rules: {
            'prefer-const': 'off',
            'no-var': 'off',
            'no-empty': 'off',
            'no-case-declarations': 'off',
            'no-prototype-builtins': 'off',
            '@typescript-eslint/no-unused-expressions': 'off',
            '@typescript-eslint/no-empty-object-type': 'off',
            'react-hooks/exhaustive-deps': 'off',
            'react-refresh/only-export-components': 'off',
        },
    },
);
