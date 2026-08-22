import { defineConfig, configDefaults } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    // Sem isto, o glob padrão do Vitest desce recursivamente em
    // .claude/worktrees/** e .worktrees/** — outros git worktrees deste
    // mesmo repo, checados em branches diferentes (ex.: experiencia-completa)
    // ou criados como workspace isolado para execução de planos — e roda os
    // testes deles sob o binário/config daqui, o que já causou falhas
    // espúrias (matchers de jest-dom não resolvidos, node_modules divergente
    // entre worktrees) e contagens de teste infladas e inconsistentes. Ambos
    // os diretórios são ignorados pelo git (.gitignore) mas não pelo glob de
    // testes por padrão.
    exclude: [...configDefaults.exclude, '.claude/**', '.worktrees/**'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
