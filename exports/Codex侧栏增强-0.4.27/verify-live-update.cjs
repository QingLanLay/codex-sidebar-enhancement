'use strict';
const port = Number(process.argv[2]);
const expected = process.argv[3];

async function main() {
  if (!Number.isInteger(port) || port < 1024 || port > 65535 || !expected) throw new Error('Invalid probe arguments');
  const response = await fetch(`http://127.0.0.1:${port}/json/list`, { signal: AbortSignal.timeout(3000) });
  if (!response.ok) throw new Error('Codex debug endpoint unavailable');
  const targets = await response.json();
  const target = targets.find(entry => entry.type === 'page' && entry.url === 'app://-/index.html' && entry.webSocketDebuggerUrl);
  if (!target) throw new Error('Codex app page not found');
  const socket = new WebSocket(target.webSocketDebuggerUrl);
  const version = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => { socket.close(); reject(new Error('CDP connection timed out')); }, 3000);
    socket.addEventListener('open', () => socket.send(JSON.stringify({
      id: 1,
      method: 'Runtime.evaluate',
      params: { expression: 'window.__sidebarToggleProbe?.version||""', returnByValue: true }
    })));
    socket.addEventListener('message', event => {
      const message = JSON.parse(event.data);
      if (message.id !== 1) return;
      clearTimeout(timer);
      socket.close();
      resolve(message.result?.result?.value || '');
    });
    socket.addEventListener('error', () => {
      clearTimeout(timer);
      reject(new Error('CDP connection failed'));
    });
  });
  if (version !== expected) {
    process.exitCode = 1;
    return;
  }
  console.log('LIVE_OK');
}

main().catch(() => { process.exitCode = 1; });
