#!/usr/bin/env node

import { createProgram, parseOptions } from "../src/cli/options.js";
import { run } from "../src/cli/run.js";

const program = createProgram();
program.parse();

const options = parseOptions(program);
const exitCode = await run(options);

process.exit(exitCode);
