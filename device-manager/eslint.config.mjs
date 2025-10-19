import eslint from "@eslint/js";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsparser from "@typescript-eslint/parser";
import importPlugin from "eslint-plugin-import";
import unicornPlugin from "eslint-plugin-unicorn";

export default [
  // Base ESLint recommended rules
  eslint.configs.recommended,

  // TypeScript configuration
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        project: "./tsconfig.json",
      },
      globals: {
        // Node.js globals
        console: "readonly",
        process: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        Buffer: "readonly",
        global: "readonly",
      },
    },
    plugins: {
      "@typescript-eslint": tseslint,
      import: importPlugin,
      unicorn: unicornPlugin,
    },
    settings: {
      "import/resolver": {
        typescript: {
          //alwaysTryTypes: true,
          project: "./tsconfig.json",
        },
        node: {
          extensions: [".js", ".jsx", ".ts", ".tsx"],
        },
      },
    },
    rules: {
      // ===== LINE LENGTH & FORMATTING =====
      "max-len": [
        "error",
        {
          code: 180,
          tabWidth: 2,
          ignoreUrls: true,
          ignoreStrings: true,
          ignoreTemplateLiterals: true,
          ignoreRegExpLiterals: true,
          ignoreComments: true,
        },
      ],

      // ===== TYPESCRIPT RULES =====
      //   "@typescript-eslint/no-unused-vars": [
      //     "error",
      //     {
      //       argsIgnorePattern: "^_",
      //       varsIgnorePattern: "^_",
      //       ignoreRestSiblings: true,
      //     },
      //   ],
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/explicit-module-boundary-types": "off",
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-non-null-assertion": "warn",
      "@typescript-eslint/prefer-nullish-coalescing": "error",
      "@typescript-eslint/prefer-optional-chain": "error",
      "@typescript-eslint/no-unnecessary-type-assertion": "error",

      // ===== IMPORT ORGANIZATION & SORTING =====
      "import/order": [
        "error",
        {
          groups: [
            "builtin", // Node.js built-in modules
            "external", // npm packages
            "internal", // Internal modules (using paths mapping)
            "parent", // ../
            "sibling", // ./
            "index", // ./index
            "type", // Type-only imports
          ],
          "newlines-between": "always",
          alphabetize: {
            order: "asc",
            caseInsensitive: true,
          },
          pathGroupsExcludedImportTypes: ["type"],
          pathGroups: [
            {
              pattern: "@/**",
              group: "internal",
              position: "before",
            },
            {
              pattern: "../../**",
              group: "parent",
              position: "before",
            },
            {
              pattern: "../**",
              group: "parent",
              position: "after",
            },
          ],
        },
      ],
      "import/no-unresolved": "error",
      "import/no-cycle": "error",
      "import/no-self-import": "error",
      "import/no-useless-path-segments": "error",
      "import/prefer-default-export": "off",
      "import/extensions": [
        "error",
        "ignorePackages",
        {
          ts: "never",
          tsx: "never",
          js: "never",
          jsx: "never",
        },
      ],

      // ===== FILE NAMING CONVENTIONS =====
      //   "unicorn/filename-case": [
      //     "error",
      //     {
      //       cases: {
      //         camelCase: true,
      //         pascalCase: true,
      //       },
      //       ignore: [
      //         /^[A-Z_]+\.md$/, // README.md, CHANGELOG.md
      //         /^\..*$/, // .env, .gitignore
      //         /docker-compose/, // docker-compose.yml
      //       ],
      //     },
      //   ],

      // ===== GENERAL CODE QUALITY =====
      "no-console": "off", // Allow console for debugging in backend
      "no-debugger": "error",
      "no-alert": "error",
      "prefer-const": "error",
      "no-var": "error",
      "object-shorthand": "error",
      "prefer-template": "error",
      "template-curly-spacing": ["error", "never"],
      "no-multiple-empty-lines": [
        "error",
        {
          max: 2,
          maxEOF: 1,
          maxBOF: 0,
        },
      ],
      //"eol-last": ["error", "always"],
      //"comma-dangle": ["error", "always-multiline"],
      //"quote-props": ["error", "as-needed"],
      //quotes: ["error", "single", { avoidEscape: true }],
      //semi: ["error", "always"],

      // ===== NAMING CONVENTIONS =====
      "@typescript-eslint/naming-convention": [
        "error",
        {
          selector: "interface",
          format: ["PascalCase"],
        },
        {
          selector: "typeAlias",
          format: ["PascalCase"],
        },
        {
          selector: "enum",
          format: ["PascalCase"],
        },
        {
          selector: "class",
          format: ["PascalCase"],
        },
        {
          selector: "function",
          format: ["camelCase"],
        },
        {
          selector: "variable",
          format: ["camelCase", "UPPER_CASE"],
          leadingUnderscore: "allow",
        },
        {
          selector: "parameter",
          format: ["camelCase"],
          leadingUnderscore: "allow",
        },
      ],

      // ===== UNICORN RULES (Additional Quality) =====
      "unicorn/prefer-node-protocol": "error",
      "unicorn/prefer-module": "error",
      "unicorn/no-array-for-each": "off", // Allow forEach
      "unicorn/prevent-abbreviations": "off", // Allow abbreviations
      "unicorn/no-null": "off", // Allow null
    },
  },

  // Specific restriction for lib files - they should not import from application modules
  {
    files: ["lib/**/*.ts", "lib/**/*.js"],
    rules: {
      "import/no-restricted-paths": [
        "error",
        {
          zones: [
            {
              target: "lib/**/*",
              from: "shared/**/*",
              message: "lib/ files should not import from shared/ - use environment variables or pass config explicitly",
            },
            {
              target: "lib/**/*",
              from: "@/shared/**/*",
              message: "lib/ files should not import from @/shared/ - use environment variables or pass config explicitly",
            },
            {
              target: "lib/**/*",
              from: "admin/**/*",
              message: "lib/ files should not import from admin/ - lib should be generic and reusable",
            },
            {
              target: "lib/**/*",
              from: "@/admin/**/*",
              message: "lib/ files should not import from @/admin/ - lib should be generic and reusable",
            },
            {
              target: "lib/**/*",
              from: "modules/**/*",
              message: "lib/ files should not import from modules/ - lib should be generic and reusable",
            },
            {
              target: "lib/**/*",
              from: "@/modules/**/*",
              message: "lib/ files should not import from @/modules/ - lib should be generic and reusable",
            },
          ],
        },
      ],
    },
  },

  // Specific overrides for test files
  {
    files: ["**/*.test.ts", "**/*.spec.ts", "**/test-*.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "no-console": "off",
      "max-len": ["error", { code: 200 }], // Longer lines in tests
    },
  },

  // Specific overrides for config files
  {
    files: ["*.config.ts", "*.config.js", "eslint.config.mjs"],
    rules: {
      "unicorn/filename-case": "off",
      "import/no-default-export": "off",
    },
  },

  // Ignore certain files and directories
  {
    ignores: [
      "node_modules/**",
      "dist/**",
      "build/**",
      ".next/**",
      "coverage/**",
      "*.min.js",
      "lib/db/_backup_for_migration/**", // Ignore backup files
      ".mongo-data/**", // Ignore MongoDB data
      "docker-compose.yml", // Ignore Docker compose
      "*.log", // Ignore log files
      ".env*", // Ignore environment files
      "admin/**",
    ],
  },
];
