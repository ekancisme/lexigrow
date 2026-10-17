import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const PORT = 9222;
const USER_DATA_DIR = '/tmp/brave-cdp-shot';

// Launch Brave in headless mode with remote debugging
const braveProcess = spawn('brave-browser', [
  '--headless=new',
  '--no-sandbox',
  '--disable-gpu',
  `--user-data-dir=${USER_DATA_DIR}`,
  `--remote-debugging-port=${PORT}`,
  'about:blank'
], { stdio: 'ignore' });

// Ensure cleanup on exit
process.on('exit', () => braveProcess.kill());
process.on('SIGINT', () => { braveProcess.kill(); process.exit(); });

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitForCdp() {
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/list`);
      if (res.ok) {
        const list = await res.json();
        if (list.length > 0) return list[0];
      }
    } catch (e) {}
    await sleep(300);
  }
  throw new Error('CDP not ready');
}

class CdpClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.ws = null;
    this.id = 1;
    this.callbacks = new Map();
    this.eventListeners = new Map();
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.wsUrl);
      this.ws.onopen = () => resolve();
      this.ws.onerror = reject;
      this.ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.id && this.callbacks.has(msg.id)) {
          const cb = this.callbacks.get(msg.id);
          this.callbacks.delete(msg.id);
          if (msg.error) cb.reject(new Error(msg.error.message));
          else cb.resolve(msg.result);
        } else if (msg.method && this.eventListeners.has(msg.method)) {
          for (const listener of this.eventListeners.get(msg.method)) {
            listener(msg.params);
          }
        }
      };
    });
  }

  async send(method, params = {}) {
    const id = this.id++;
    return new Promise((resolve, reject) => {
      this.callbacks.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  on(event, handler) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(handler);
  }

  close() {
    if (this.ws) this.ws.close();
  }
}

async function captureFullPage(client, url, outputPath, width = 1440) {
  console.log(`Navigating to ${url}...`);
  await client.send('Page.enable');
  await client.send('DOM.enable');
  await client.send('CSS.enable');

  const loaded = new Promise(resolve => {
    const onLoaded = () => {
      resolve();
    };
    client.on('Page.loadEventFired', onLoaded);
  });

  await client.send('Page.navigate', { url });
  await loaded;

  // Wait extra 2s for animations, webfonts, and layouts to settle
  await sleep(2500);

  // Get total document dimensions
  const layout = await client.send('Page.getLayoutMetrics');
  const scrollHeight = Math.ceil(layout.cssContentSize.height);
  console.log(`Document size: ${width}x${scrollHeight}`);

  // Set viewport to cover entire height
  await client.send('Emulation.setDeviceMetricsOverride', {
    width: width,
    height: scrollHeight,
    deviceScaleFactor: 1,
    mobile: false
  });

  await sleep(500);

  const screenshot = await client.send('Page.captureScreenshot', {
    format: 'png',
    captureBeyondViewport: true
  });

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, Buffer.from(screenshot.data, 'base64'));
  console.log(`Saved screenshot to ${outputPath} (${(screenshot.data.length * 0.75 / 1024).toFixed(1)} KB)`);
}

async function main() {
  const target = process.argv[2];
  const out = process.argv[3];
  const width = parseInt(process.argv[4] || '1440', 10);

  const page = await waitForCdp();
  const client = new CdpClient(page.webSocketDebuggerUrl);
  await client.connect();

  await captureFullPage(client, target, out, width);
  client.close();
  braveProcess.kill();
}

main().catch(err => {
  console.error(err);
  braveProcess.kill();
  process.exit(1);
});
