#!/usr/bin/env node

import { parseOptions } from "../cli/options.js";
import { run } from "../cli/run.js";

const options = parseOptions();
const exitCode = await run(options);

process.exit(exitCode);
