import { readFileSync } from 'node:fs';
import babel from '@babel/core';
import swc from '@swc/core';

const filename = 'input.jsx';
const source = readFileSync(new URL('./input.jsx', import.meta.url), 'utf8');

// The compiler memoizes a component by importing its runtime cache helper.
const isCompiled = code => code.includes('react/compiler-runtime');

const viaBabel = (pluginName, options = {}) =>
  babel.transformSync(source, {
    filename,
    babelrc: false,
    configFile: false,
    parserOpts: { plugins: ['jsx'] },
    plugins: [[pluginName, options]],
  }).code;

const viaSwc = reactCompiler =>
  swc.transformSync(source, {
    filename,
    jsc: {
      parser: { syntax: 'ecmascript', jsx: true },
      transform: { react: { runtime: 'automatic' }, reactCompiler },
    },
  }).code;

const run = (label, compile) => {
  let result;
  try {
    result = isCompiled(compile()) ? 'compiled' : 'skipped (bailed out on the suppression)';
  } catch (error) {
    result = `error: ${String(error.message ?? error).split('\n')[0]}`;
  }
  console.log(`${label.padEnd(86)} ${result}`);
};

const rules = ['react-hooks/exhaustive-deps', 'react-hooks/rules-of-hooks'];

run('babel-plugin-react-compiler@1.0.0 (defaults)', () => viaBabel('babel-plugin-react-compiler'));
run('babel-plugin-react-compiler@experimental (defaults)', () => viaBabel('babel-plugin-react-compiler-experimental'));
run('babel-plugin-react-compiler@experimental + validateExhaustiveMemoizationDependencies: false', () =>
  viaBabel('babel-plugin-react-compiler-experimental', {
    environment: { validateExhaustiveMemoizationDependencies: false },
  })
);
run(`@swc/core@${swc.version} reactCompiler: true`, () => viaSwc(true));
run(`@swc/core@${swc.version} reactCompiler: { eslintSuppressionRules }`, () =>
  viaSwc({ eslintSuppressionRules: rules })
);
run(`@swc/core@${swc.version} reactCompiler: { environment: { validateExhaustiveMemoizationDependencies: false } }`, () =>
  viaSwc({ environment: { validateExhaustiveMemoizationDependencies: false } })
);
