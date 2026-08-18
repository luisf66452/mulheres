import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Worktree de sessões anteriores (git worktree independente, com seu
    // próprio checkout/branch/node_modules) — não faz parte deste worktree e
    // não deve ser varrido por lint/typecheck daqui.
    ".claude/worktrees/**",
  ]),
]);

export default eslintConfig;
