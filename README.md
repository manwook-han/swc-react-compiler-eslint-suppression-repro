# swc React Compiler: `eslintSuppressionRules` has no effect

`jsc.transform.reactCompiler.eslintSuppressionRules` is accepted by `@swc/core`, but it can never change the output.

The React Compiler port that swc uses only reads ESLint suppression comments when
`environment.validateExhaustiveMemoizationDependencies` or `environment.validateHooksUsage` is off. Both default to
`true`, and swc's `reactCompiler.environment` only accepts `enableFunctionOutlining`. So a component with
`// eslint-disable-next-line react-hooks/exhaustive-deps` is always compiled, whatever `eslintSuppressionRules` says.

`babel-plugin-react-compiler@1.0.0` (the current `latest` on npm) always honors the suppression and skips the
component. There is no swc config that reproduces that behavior.

## Run

```sh
npm install
npm run repro
```

## Result (`@swc/core@1.16.22`, Node 22, macOS arm64)

```
babel-plugin-react-compiler@1.0.0 (defaults)                                           skipped (bailed out on the suppression)
babel-plugin-react-compiler@experimental (defaults)                                    compiled
babel-plugin-react-compiler@experimental + validateExhaustiveMemoizationDependencies: false skipped (bailed out on the suppression)
@swc/core@1.16.22 reactCompiler: true                                                  compiled
@swc/core@1.16.22 reactCompiler: { eslintSuppressionRules }                            compiled
@swc/core@1.16.22 reactCompiler: { environment: { validateExhaustiveMemoizationDependencies: false } } error: Failed to deserialize buffer as swc::config::Options
```

## Where it comes from

- React main, `Entrypoint/Program.ts`: suppressions are looked up with `null` rules when
  `validateExhaustiveMemoizationDependencies && validateHooksUsage`.
- `react_compiler` 0.1.0, `entrypoint/program.rs`: the same condition; `find_program_suppressions` ignores ESLint
  comments when the rule list is `None`.
- swc, `crates/swc/src/config/mod.rs`: `ReactCompilerEnvironmentConfig` only has `enable_function_outlining`.
