import { defineConfig, configDefaults } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    // Sem isto, o glob padrão do Vitest desce recursivamente em
    // .claude/worktrees/** — outros git worktrees deste mesmo repo, checados
    // em branches diferentes (ex.: experiencia-completa) — e roda os testes
    // deles sob o binário/config daqui, o que já causou falhas espúrias
    // (matchers de jest-dom não resolvidos) e contagens de teste infladas e
    // inconsistentes. .claude/ é ignorado pelo git (.gitignore) mas não pelo
    // glob de testes por padrão.
    exclude: [...configDefaults.exclude, '.claude/**'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
