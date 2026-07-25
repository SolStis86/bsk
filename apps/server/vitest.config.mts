import path from 'path';
import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        include: ['src/**/*.spec.ts'],
        exclude: ['**/node_modules/**', '**/dist/**'],
    },
    plugins: [
        swc.vite({
            jsc: {
                transform: {
                    useDefineForClassFields: false,
                },
            },
        }),
    ],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
});
