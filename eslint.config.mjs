import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import prettierPlugin from 'eslint-plugin-prettier';

const cleanedGlobals = Object.fromEntries(
    Object.entries(globals.browser).map(([key, value]) => [key.trim(), value])
);

export default [
    {
        ignores: [
            'dist',
            'public',
            'src/components/keenicons/assets',
        ],
    },
    {
        files: ['**/*.{ts,tsx}'],
        languageOptions: {
            parser: tsParser,
            ecmaVersion: 2020,
            globals: cleanedGlobals,
        },
        plugins: {
            '@typescript-eslint': tsPlugin,
            'react-hooks': reactHooks,
            'react-refresh': reactRefresh,
            prettier: prettierPlugin,
        },
        rules: {
            ...reactHooks.configs.recommended.rules,
            'react-refresh/only-export-components': [
                'warn',
                { allowConstantExport: true },
            ],
            '@typescript-eslint/no-unused-vars': ['error'],
            'prettier/prettier': 'warn'
        },
    },
    {
        files: ['**/*.tsx', '**/*.ts'],
        languageOptions: {
            ecmaVersion: 2020,
            sourceType: 'module',
            globals: cleanedGlobals,
        },
        rules: {
            ...js.configs.recommended.rules,
            'no-unused-vars': 'warn',
            '@typescript-eslint/no-unused-vars': 'off',
            'react/react-in-jsx-scope': 'off',
            '@typescript-eslint/explicit-function-return-type': 'off',
            '@typescript-eslint/strict-boolean-expressions': 'off',
            '@typescript-eslint/consistent-type-imports': 'off',
            '@typescript-eslint/no-floating-promises': 'off',
            '@typescript-eslint/naming-convention': 'off',
            '@typescript-eslint/restrict-template-expressions': 'off',
            '@typescript-eslint/restrict-plus-operands': 'off',
            'prettier/prettier': 'warn',
        },
    },
];
