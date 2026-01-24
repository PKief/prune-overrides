# Coding Patterns

Project-specific conventions and utilities.

## Error Handling

Use custom error classes from `src/util/errors.ts`:

```typescript
import { PackageJsonError } from "../util/errors.js";

if (!packageJson.overrides) {
  throw new PackageJsonError("No overrides found");
}
```

See [architecture.md](./architecture.md#error-handling) for the full list of error classes.

## Logging

Use the logger from `src/util/logger.ts`:

```typescript
import { logger } from "../util/logger.js";

logger.debug("Detailed info"); // Only shown with --verbose
logger.info("Normal output");
logger.success("Something worked");
logger.warn("Warning");
logger.error("Error");
```

## Child Process Execution

Always use `src/util/exec.ts`, never call `child_process` directly:

```typescript
import { exec, execSafe } from "../util/exec.js";

// Throws on failure
const result = await exec("npm ls", { cwd: "/path" });

// Returns { success: false } on failure
const result = await execSafe("npm ls", { cwd: "/path" });
```
