/**
 * URL encoding/decoding utilities using lz-string compression
 * Produces URL-safe compressed strings for sharing analysis results
 */

import LZString from "lz-string";
import type { EncodedPayload, ShareableReport, DecodedReport } from "./types.js";
import { toShareableResult, fromShareableResult } from "./types.js";

/**
 * Encode an AnalysisReport to a URL-safe compressed string
 *
 * Pipeline:
 * 1. Convert AnalysisReport to compact EncodedPayload (array format)
 * 2. JSON stringify
 * 3. Compress with lz-string
 * 4. Encode to base64url (URL-safe)
 *
 * @param report - The analysis report to encode (with optional projectName)
 * @returns URL-safe compressed string
 */
export function encodeReport(report: ShareableReport): string {
  // Convert to compact format
  const payload = toShareableResult(report);

  // JSON stringify (no pretty printing for size)
  const json = JSON.stringify(payload);

  // Compress with lz-string (compressToEncodedURIComponent produces URL-safe output)
  const compressed = LZString.compressToEncodedURIComponent(json);

  return compressed;
}

/**
 * Decode a URL-safe compressed string back to an AnalysisReport
 *
 * Pipeline:
 * 1. Decompress from base64url using lz-string
 * 2. JSON parse
 * 3. Convert EncodedPayload back to AnalysisReport
 *
 * @param encoded - The URL-safe compressed string
 * @returns The decoded AnalysisReport with projectName
 * @throws Error if decoding fails
 */
export function decodeReport(encoded: string): DecodedReport {
  // Decompress
  const json = LZString.decompressFromEncodedURIComponent(encoded);

  if (!json) {
    throw new Error("Failed to decompress encoded report: invalid data");
  }

  // Parse JSON
  let payload: EncodedPayload;
  try {
    payload = JSON.parse(json) as EncodedPayload;
  } catch {
    throw new Error("Failed to parse decompressed report: invalid JSON");
  }

  // Validate basic structure (v3 format: [projectName, redundant[], required[]])
  if (
    !Array.isArray(payload) ||
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- Runtime validation of untrusted JSON
    payload.length !== 3 ||
    !Array.isArray(payload[1]) ||
    !Array.isArray(payload[2])
  ) {
    throw new Error("Invalid payload structure");
  }

  // Convert back to full report
  return fromShareableResult(payload);
}

/**
 * Encode to base64url format (URL-safe base64)
 * Replaces: + → -, / → _, removes trailing =
 *
 * Note: This is provided as a utility but encodeReport/decodeReport
 * use lz-string's compressToEncodedURIComponent which already produces
 * URL-safe output.
 *
 * @param input - String to encode
 * @returns Base64url encoded string
 */
export function toBase64Url(input: string): string {
  // Use Buffer for Node.js environment
  const base64 = Buffer.from(input, "utf-8").toString("base64");

  // Convert to base64url: replace non-URL-safe chars and remove padding
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * Decode from base64url format
 *
 * @param input - Base64url encoded string
 * @returns Decoded string
 */
export function fromBase64Url(input: string): string {
  // Restore base64 format
  let base64 = input.replace(/-/g, "+").replace(/_/g, "/");

  // Add padding if needed
  const padding = base64.length % 4;
  if (padding === 2) {
    base64 += "==";
  } else if (padding === 3) {
    base64 += "=";
  }

  return Buffer.from(base64, "base64").toString("utf-8");
}
