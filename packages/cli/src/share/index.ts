/**
 * Share module - URL encoding utilities for sharing analysis results
 */

// Types
export type {
  ShareableResult,
  CompactResult,
  EncodedPayload,
  ShareableReport,
  DecodedReport,
} from "./types.js";
export {
  VERDICT_TO_NUMBER,
  NUMBER_TO_VERDICT,
  toShareableResult,
  fromShareableResult,
} from "./types.js";

// URL codec functions
export { encodeReport, decodeReport, toBase64Url, fromBase64Url } from "./urlCodec.js";
