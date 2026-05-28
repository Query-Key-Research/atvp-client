/**
 * @file EvidenceGate.js
 * @description Enforces the ATVP evidence gate: structured proof is required
 * before a case can be confirmed. Boolean flags are rejected.
 *
 * Required evidence shape:
 *   { command: string, exitCode: 0, output: string }
 */

import { AtvpError } from './HttpTransport.js';

/**
 * Validates and attaches evidence to a case confirmation.
 */
export class EvidenceGate {
  /**
   * Validate evidence object. Returns the evidence if valid;
   * throws AtvpError if invalid.
   *
   * @param {Object} evidence
   * @param {string} evidence.command   — the command that was run
   * @param {number} evidence.exitCode  — must be exactly 0
   * @param {string} evidence.output    — verifiable output (non-empty)
   * @returns {Object} validated evidence
   */
  static validate(evidence) {
    if (evidence === null || evidence === undefined) {
      throw new AtvpError(
        'Evidence is required before case confirmation. Provide { command, exitCode, output }.',
        { step: 'evidence' }
      );
    }

    if (typeof evidence !== 'object') {
      throw new AtvpError(
        `Evidence must be an object, received ${typeof evidence}`,
        { step: 'evidence' }
      );
    }

    const { command, exitCode, output } = evidence;

    if (typeof command !== 'string' || command.length === 0) {
      throw new AtvpError(
        'Evidence.command must be a non-empty string (the command that was run).',
        { step: 'evidence' }
      );
    }

    if (typeof exitCode !== 'number') {
      throw new AtvpError(
        `Evidence.exitCode must be a number (exactly 0), received ${typeof exitCode}`,
        { step: 'evidence' }
      );
    }

    if (exitCode !== 0) {
      throw new AtvpError(
        `Evidence.exitCode must be exactly 0 (success), received ${exitCode}. ` +
        'Confirmation is blocked when the evidence command fails.',
        { step: 'evidence' }
      );
    }

    if (typeof output !== 'string' || output.length === 0) {
      throw new AtvpError(
        'Evidence.output must be a non-empty string (verifiable command output).',
        { step: 'evidence' }
      );
    }

    return { command, exitCode, output };
  }

  /**
   * Convenience: run a shell command and capture output as evidence.
   * This is a Node.js-only helper (uses child_process).
   *
   * @param {string} command  — shell command to execute
   * @returns {Promise<Object>} evidence object ready for confirm()
   */
  static async capture(command) {
    const { exec } = await import('node:child_process');
    const { promisify } = await import('node:util');
    const execAsync = promisify(exec);

    try {
      const { stdout, stderr } = await execAsync(command, { timeout: 60000 });
      return {
        command,
        exitCode: 0,
        output: stdout || stderr || '',
      };
    } catch (err) {
      return {
        command,
        exitCode: err.code ?? 1,
        output: err.stdout || err.stderr || err.message || '',
      };
    }
  }
}
