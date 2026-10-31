import { registerHooks } from "node:module";
import { resolve } from "./rewrite-js-to-ts.js";

registerHooks({ resolve });
