import path from 'path';
import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        include: ['src/**/*.e2e-spec.ts'],
        exclude: ['**/node_modules/**', '**/dist/**'],
        testTimeout: 60_000,
        hookTimeout: 60_000,
        typecheck: {
            tsconfig: path.join(__dirname, 'tsconfig.e2e.json'),
        },
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
});
