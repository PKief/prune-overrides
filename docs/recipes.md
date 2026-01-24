# Common Tasks

Step-by-step guides for frequent modifications.

## Adding a New CLI Option

1. Add option in `src/cli/options.ts`:
   - Add to Command setup (`.option(...)`)
   - Add to `CliOptions` interface
2. Handle option in `src/cli/run.ts`
3. Update README.md with new option

## Modifying the Analysis Algorithm

1. Make changes in `src/analyzer/analyzeSingle.ts`
2. Add tests in `tests/analyzer/`
3. Test manually with `--verbose` flag on a real project
4. Update `docs/architecture.md` if behavior changes

## Adding a New Error Type

1. Add error class in `src/util/errors.ts`
2. Export from `src/index.ts`
3. Use in relevant module

## Testing

```bash
# Run all tests
npm test

# Run specific test file
npm test -- tests/util/semver.test.ts

# Run with coverage
npm run test:coverage

# Manual testing with verbose output
node dist/bin/prune-overrides.js --verbose --cwd /path/to/project
```
