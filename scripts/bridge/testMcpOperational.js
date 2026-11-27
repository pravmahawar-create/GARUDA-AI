/**
 * 🦅 GARUDA BRIDGE — MCP OPERATIONAL VALIDATION PROBE
 * Validates stdio JSON-RPC tool discovery, execution, and error handling.
 */

const cp = require('child_process');
const path = require('path');
const fs = require('fs');

const ROOT_DIR = path.resolve(__dirname, '..', '..');
const MCP_SCRIPT = path.join(ROOT_DIR, 'scripts', 'mcp', 'garudaMcpServer.js');

function runMcpProbe() {
  return new Promise((resolve, reject) => {
    const p = cp.spawn('node', [MCP_SCRIPT], { cwd: ROOT_DIR });

    let stdoutBuffer = '';
    let stderrBuffer = '';
    const responses = {};

    p.stdout.on('data', (d) => {
      stdoutBuffer += d.toString();
      const lines = stdoutBuffer.split('\n');
      stdoutBuffer = lines.pop(); // keep last incomplete line

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        try {
          const json = JSON.parse(trimmed);
          if (json.id !== undefined) {
            responses[json.id] = json;
          }
        } catch (e) {
          console.error('[PROBE PARSE ERROR]', e.message, trimmed);
        }
      }
    });

    p.stderr.on('data', (d) => {
      stderrBuffer += d.toString();
      if (stderrBuffer.includes('Sovereign Agent Server ready on stdio') && !p._ready) {
        p._ready = true;
        // Step 1: Initialize
        p.stdin.write(JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05' } }) + '\n');
        // Step 2: tools/list
        p.stdin.write(JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} }) + '\n');
        // Step 3: tools/call garuda_system_status (valid)
        p.stdin.write(JSON.stringify({ jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'garuda_system_status', arguments: {} } }) + '\n');
        // Step 4: tools/call garuda_invalid_tool (unknown tool error handling)
        p.stdin.write(JSON.stringify({ jsonrpc: '2.0', id: 4, method: 'tools/call', params: { name: 'garuda_invalid_tool', arguments: {} } }) + '\n');
        // Step 5: tools/call garuda_review_code with missing args (arg validation error handling)
        p.stdin.write(JSON.stringify({ jsonrpc: '2.0', id: 5, method: 'tools/call', params: { name: 'garuda_review_code', arguments: {} } }) + '\n');

        setTimeout(() => {
          p.kill();
          resolve(responses);
        }, 1500);
      }
    });

    p.on('error', reject);
  });
}

if (require.main === module) {
  runMcpProbe().then(res => {
    console.log(JSON.stringify(res, null, 2));
    process.exit(0);
  }).catch(err => {
    console.error('Probe failed:', err);
    process.exit(1);
  });
}

module.exports = { runMcpProbe };
