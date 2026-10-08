'use strict';
const port = Number(process.argv[2]);
const expected = process.argv[3];

async function inspect(target) {
  const address = new URL(target.webSocketDebuggerUrl);
  if (address.protocol !== 'ws:' || address.hostname !== '127.0.0.1' || address.port !== String(port)) throw new Error('Non-local debugger rejected');
  return new Promise((resolve, reject) => {
    const socket = new WebSocket(address.href);
    const timer = setTimeout(() => finish(new Error('CDP connection timed out')), 3000);
    let settled = false;
    function finish(error, value) {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      socket.close();
      if (error) reject(error); else resolve(value);
    }
    socket.addEventListener('open', () => socket.send(JSON.stringify({
      id: 1, method: 'Runtime.evaluate',
      params: { expression: '({version:window.__sidebarToggleProbe?.version||"",disposed:!!window.__sidebarToggleProbe?.disposed,runtimeConnected:!!window.__sidebarToggleProbe?.runtimeConnected})', returnByValue: true }
    })));
    socket.addEventListener('message', event => {
      try {
        const message = JSON.parse(event.data);
        if (message.id !== 1) return;
        if (message.error || message.result?.exceptionDetails) return finish(new Error('Probe evaluation failed'));
        finish(null, message.result?.result?.value);
      } catch (error) { finish(error); }
    });
    socket.addEventListener('error', () => finish(new Error('CDP connection failed')));
    socket.addEventListener('close', () => { if (!settled) finish(new Error('CDP connection closed')); });
  });
}

async function main() {
  if (!Number.isInteger(port) || port < 1024 || port > 65535 || !expected) throw new Error('Invalid probe arguments');
  const response = await fetch(`http://127.0.0.1:${port}/json/list`, { signal: AbortSignal.timeout(3000) });
  if (!response.ok) throw new Error('Codex debug endpoint unavailable');
  const targets = (await response.json()).filter(entry => entry.type === 'page' && entry.url?.startsWith('app://-/') && !/quick-chat|prewarm|avatar-overlay/i.test(entry.url) && entry.webSocketDebuggerUrl);
  if (!targets.length) throw new Error('Codex app page not found');
  for (const target of targets) {
    try {
      const probe = await inspect(target);
      if (probe?.version !== expected || probe.disposed) continue;
      console.log(`LIVE_OK version=${probe.version} runtime=${probe.runtimeConnected?'connected':'pending'}`);
      return;
    } catch {} // A closing/obsolete window must not hide another current window.
  }
  throw new Error('Updated probe not loaded');
}
main().catch(() => { process.exitCode = 1; });