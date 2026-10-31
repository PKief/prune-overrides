#!/usr/bin/env node

import { parseOptions } from "../cli/options.js";
import { run } from "../cli/run.js";
import { logger } from "../util/logger.js";
import { ExitCode } from "../config/constants.js";

try {
  process.exitCode = await run(parseOptions());
} catch (error) {
  logger.error(error instanceof Error ? error.message : String(error));
  process.exitCode = ExitCode.ERROR;
}
