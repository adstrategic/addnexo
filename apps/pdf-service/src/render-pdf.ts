import puppeteer, { type Browser, type PDFOptions } from "puppeteer";

const DEFAULT_TIMEOUT_MS = 30_000;
const DEFAULT_MAX_CONCURRENCY = 4;

let browserInstance: Browser | null = null;
let activeRenders = 0;
const waitQueue: Array<() => void> = [];

function getTimeoutMs(): number {
  const raw = Number(process.env.PDF_RENDER_TIMEOUT_MS);
  return Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_TIMEOUT_MS;
}

function getMaxConcurrency(): number {
  const raw = Number(process.env.PUPPETEER_MAX_CONCURRENCY);
  if (!Number.isFinite(raw) || raw < 1) {
    return DEFAULT_MAX_CONCURRENCY;
  }
  return Math.floor(raw);
}

function shouldBlockExternalRequests(): boolean {
  return process.env.PDF_BLOCK_EXTERNAL_REQUESTS?.toLowerCase() === "true";
}

function allowRequest(url: string): boolean {
  return (
    url.startsWith("about:") ||
    url.startsWith("data:") ||
    url.startsWith("blob:")
  );
}

async function acquireRenderSlot(): Promise<() => void> {
  const max = getMaxConcurrency();
  if (activeRenders < max) {
    activeRenders += 1;
    return () => {
      activeRenders -= 1;
      const wake = waitQueue.shift();
      if (wake) wake();
    };
  }

  await new Promise<void>((resolve) => {
    waitQueue.push(resolve);
  });
  activeRenders += 1;
  return () => {
    activeRenders -= 1;
    const wake = waitQueue.shift();
    if (wake) wake();
  };
}

export async function getBrowser(): Promise<Browser> {
  if (browserInstance?.connected) {
    return browserInstance;
  }

  const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH ?? undefined;
  browserInstance = await puppeteer.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
    headless: true,
    ...(executablePath ? { executablePath } : {}),
  });

  browserInstance.on("disconnected", () => {
    browserInstance = null;
  });

  return browserInstance;
}

export async function renderHtmlToPdfBuffer(
  html: string,
  options?: { documentType?: string; pdfOptions?: PDFOptions },
): Promise<Buffer> {
  const startedAt = Date.now();
  const release = await acquireRenderSlot();
  const timeout = getTimeoutMs();
  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    if (shouldBlockExternalRequests()) {
      await page.setRequestInterception(true);
      page.on("request", (request) => {
        if (allowRequest(request.url())) {
          void request.continue();
          return;
        }
        void request.abort();
      });
    }

    await page.setContent(html, {
      timeout,
      // Puppeteer's setContent does not support the networkidle* values; "load"
      // waits for the load event (images, fonts, etc.) which is what we need here.
      waitUntil: "load",
    });

    const pdfBuffer = await page.pdf({
      format: "Letter",
      margin: {
        top: "0",
        right: "0",
        bottom: "0",
        left: "0",
      },
      printBackground: true,
      timeout,
      ...(options?.pdfOptions ?? {}),
    });

    return Buffer.from(pdfBuffer);
  } finally {
    await page.close().catch(() => {
      // noop
    });
    release();
    console.info(
      JSON.stringify({
        durationMs: Date.now() - startedAt,
        documentType: options?.documentType ?? "unknown",
        event: "pdf.render.completed",
      }),
    );
  }
}
