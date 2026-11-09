// @ts-check
// Configurazione di ESLint nel formato a elenco, stesse regole di Agora.
// Il file e' .cjs perche' package.json di GestyWeb ha "type": "module": con
// l'estensione .js i require() qui sotto non funzionerebbero.
//
// Differenze da Agora:
// - il lint gira con "eslint ." (script lint, strumenti\verifica.cmd) e non con
//   "ng lint", quindi cartelle generate e dipendenze si escludono qui sotto;
// - zng/ e' la libreria condivisa (OUT/20261028-libreria-angular-zng): si
//   controlla nel suo progetto, non qui;
// - prefer-on-push-component-change-detection e' spenta: i componenti di
//   GestyWeb non sono ancora tutti OnPush. Si riaccende come errore quando lo
//   saranno, come in Agora.
const eslint = require('@eslint/js');
const { defineConfig } = require('eslint/config');
const tseslint = require('typescript-eslint');
const angular = require('angular-eslint');
const prettierRecommended = require('eslint-plugin-prettier/recommended');
const simpleImportSort = require('eslint-plugin-simple-import-sort');

module.exports = defineConfig([
  {
    ignores: ['dist/**', '.angular/**', 'node_modules/**', 'public/**', 'projects/**/*', 'zng/**'],
  },
  {
    plugins: {
      'simple-import-sort': simpleImportSort,
    },
    rules: {
      'sort-imports': 'off',
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
    },
  },
  {
    files: ['**/*.ts'],
    extends: [
      eslint.configs.recommended,
      tseslint.configs.recommended,
      angular.configs.tsRecommended,
      prettierRecommended,
    ],
    processor: angular.processInlineTemplates,
    rules: {
      '@angular-eslint/directive-selector': [
        'error',
        {
          type: 'attribute',
          prefix: 'app',
          style: 'camelCase',
        },
      ],
      '@angular-eslint/component-selector': [
        'error',
        {
          type: 'element',
          prefix: 'app',
          style: 'kebab-case',
        },
      ],
      '@typescript-eslint/no-explicit-any': 'off',
      // Il trattino basso in testa dichiara inutilizzato di proposito un
      // parametro richiesto dalla firma o un campo tolto con il resto
      // ({ campo: _x, ...resto }).
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
      '@angular-eslint/prefer-inject': 'off',
      '@angular-eslint/prefer-on-push-component-change-detection': 'off',
    },
  },
  {
    files: ['**/*.html'],
    extends: [angular.configs.templateRecommended, angular.configs.templateAccessibility],
    // Le tre regole di accessibilita' restano avvisi: sistemarle cambia il
    // comportamento delle schermate (etichette, tastiera, focus) e va fatto
    // pagina per pagina, non in blocco con la configurazione.
    rules: {
      '@angular-eslint/template/label-has-associated-control': 'warn',
      '@angular-eslint/template/click-events-have-key-events': 'warn',
      '@angular-eslint/template/interactive-supports-focus': 'warn',
    },
  },
]);
