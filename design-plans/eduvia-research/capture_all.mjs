import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const PORT = 9222;
const USER_DATA_DIR = '/tmp/brave-cdp-all';

const PAGES = [
  { name: '01_home', url: 'https://eduvia.tokotema.xyz/template-kit/home/' },
  { name: '02_about_us', url: 'https://eduvia.tokotema.xyz/template-kit/about-us/' },
  { name: '03_courses', url: 'https://eduvia.tokotema.xyz/template-kit/courses/' },
  { name: '04_course_details', url: 'https://eduvia.tokotema.xyz/template-kit/course-details/' },
  { name: '05_pricing', url: 'https://eduvia.tokotema.xyz/template-kit/pricing/' },
  { name: '06_teachers', url: 'https://eduvia.tokotema.xyz/template-kit/teachers/' },
  { name: '07_testimonials', url: 'https://eduvia.tokotema.xyz/template-kit/testimonials/' },
  { name: '08_help_center', url: 'https://eduvia.tokotema.xyz/template-kit/help-center/' },
  { name: '09_contact_us', url: 'https://eduvia.tokotema.xyz/template-kit/contact-us/' },
  { name: '10_404', url: 'https://eduvia.tokotema.xyz/template-kit/404/' },
];

const braveProcess = spawn('brave-browser', [
  '--headless=new',
  '--no-sandbox',
  '--disable-gpu',
  `--user-data-dir=${USER_DATA_DIR}`,
  `--remote-debugging-port=${PORT}`,
  'about:blank'
], { stdio: 'ignore' });

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

async function capturePage(client, { name, url }, outDir) {
  console.log(`\n=== Capturing ${name}: ${url} ===`);
  await client.send('Page.enable');
  await client.send('Runtime.enable');

  const loaded = new Promise(resolve => {
    const onLoaded = () => resolve();
    client.on('Page.loadEventFired', onLoaded);
  });

  await client.send('Page.navigate', { url });
  await loaded;

  // Wait 3s for fonts and assets to finish rendering
  await sleep(3000);

  // Evaluate the real page height by inspecting the bottom of the footer or last element
  const heightRes = await client.send('Runtime.evaluate', {
    expression: `
      (() => {
        const footer = document.querySelector('footer') || document.querySelector('.elementor-location-footer');
        if (footer) {
          const rect = footer.getBoundingClientRect();
          return Math.ceil(rect.bottom + window.scrollY);
        }
        return Math.ceil(Math.max(
          document.body.scrollHeight,
          document.documentElement.scrollHeight,
          document.body.offsetHeight
        ));
      })()
    `,
    returnByValue: true
  });

  let scrollHeight = heightRes.result.value || 3000;
  // Fallback sanity clamp
  if (scrollHeight < 800) scrollHeight = 2000;
  if (scrollHeight > 10000) scrollHeight = 8500;
  console.log(`Computed content height: ${scrollHeight}px`);

  // Set viewport
  await client.send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: scrollHeight,
    deviceScaleFactor: 1,
    mobile: false
  });

  await sleep(600);

  const screenshot = await client.send('Page.captureScreenshot', {
    format: 'png',
    clip: {
      x: 0,
      y: 0,
      width: 1440,
      height: scrollHeight,
      scale: 1
    }
  });

  const outPath = path.join(outDir, `${name}.png`);
  fs.writeFileSync(outPath, Buffer.from(screenshot.data, 'base64'));
  console.log(`Saved: ${outPath} (${(screenshot.data.length * 0.75 / 1024).toFixed(1)} KB)`);

  // Also capture mobile viewport (390px width)
  const mobileHeightRes = await client.send('Runtime.evaluate', {
    expression: `
      (() => {
        window.scrollTo(0, 0);
        const footer = document.querySelector('footer') || document.querySelector('.elementor-location-footer');
        if (footer) {
          return Math.ceil(footer.getBoundingClientRect().bottom + window.scrollY);
        }
        return Math.ceil(document.body.scrollHeight);
      })()
    `,
    returnByValue: true
  });
  let mobileHeight = mobileHeightRes.result.value || 4500;
  if (mobileHeight < 1000) mobileHeight = 3500;
  if (mobileHeight > 14000) mobileHeight = 11000;

  await client.send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: mobileHeight,
    deviceScaleFactor: 2,
    mobile: true
  });

  await sleep(600);

  const mobileScreenshot = await client.send('Page.captureScreenshot', {
    format: 'png',
    clip: {
      x: 0,
      y: 0,
      width: 390,
      height: mobileHeight,
      scale: 1
    }
  });

  const mobileOutPath = path.join(outDir, `${name}_mobile.png`);
  fs.writeFileSync(mobileOutPath, Buffer.from(mobileScreenshot.data, 'base64'));
  console.log(`Saved mobile: ${mobileOutPath} (${(mobileScreenshot.data.length * 0.75 / 1024).toFixed(1)} KB)`);
}

async function extractDesignTokens(client) {
  console.log(`\n=== Extracting Design Tokens from Home ===`);
  const tokensRes = await client.send('Runtime.evaluate', {
    expression: `
      (() => {
        // Collect all computed styles from important elements
        const headings = [...document.querySelectorAll('h1, h2, h3, h4, h5')];
        const buttons = [...document.querySelectorAll('a.elementor-button, button, .tp-button')];
        const allElements = [...document.querySelectorAll('*')];
        
        const colors = new Set();
        const fonts = new Set();
        const fontSizes = new Set();
        
        allElements.forEach(el => {
          const s = getComputedStyle(el);
          if (s.color) colors.add(s.color);
          if (s.backgroundColor && s.backgroundColor !== 'rgba(0, 0, 0, 0)') colors.add(s.backgroundColor);
          if (s.fontFamily) fonts.add(s.fontFamily);
          if (s.fontSize) fontSizes.add(s.fontSize);
        });

        const headingStyles = headings.slice(0, 8).map(h => ({
          tag: h.tagName,
          text: h.textContent.trim().slice(0, 60),
          fontFamily: getComputedStyle(h).fontFamily,
          fontSize: getComputedStyle(h).fontSize,
          fontWeight: getComputedStyle(h).fontWeight,
          lineHeight: getComputedStyle(h).lineHeight,
          color: getComputedStyle(h).color
        }));

        const buttonStyles = buttons.slice(0, 6).map(b => ({
          text: b.textContent.trim(),
          backgroundColor: getComputedStyle(b).backgroundColor,
          color: getComputedStyle(b).color,
          borderRadius: getComputedStyle(b).borderRadius,
          padding: getComputedStyle(b).padding,
          fontWeight: getComputedStyle(b).fontWeight
        }));

        return {
          uniqueFonts: [...fonts],
          headingStyles,
          buttonStyles,
          sampleColors: [...colors].slice(0, 30)
        };
      })()
    `,
    returnByValue: true
  });

  return tokensRes.result.value;
}

async function main() {
  const outDir = path.resolve('design-plans/eduvia-research/screenshots');
  fs.mkdirSync(outDir, { recursive: true });

  const page = await waitForCdp();
  const client = new CdpClient(page.webSocketDebuggerUrl);
  await client.connect();

  for (const p of PAGES) {
    try {
      await capturePage(client, p, outDir);
    } catch (err) {
      console.error(`Error capturing ${p.name}:`, err.message);
    }
  }

  // Extract design tokens from home page
  await client.send('Page.navigate', { url: PAGES[0].url });
  await sleep(2000);
  const tokens = await extractDesignTokens(client);
  fs.writeFileSync('design-plans/eduvia-research/design_tokens.json', JSON.stringify(tokens, null, 2));
  console.log(`Tokens written to design-plans/eduvia-research/design_tokens.json`);

  client.close();
  braveProcess.kill();
  console.log('\nAll captures completed successfully!');
}

main().catch(err => {
  console.error(err);
  braveProcess.kill();
  process.exit(1);
});
