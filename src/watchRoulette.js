const puppeteer = require("puppeteer-extra");
const { tmpdir } = require("os");
const path = require("path");

const StealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteer.use(StealthPlugin());

const parseRouletteFromElements = require("./utils/parseRouletteFromElements");
const isSameRouletteColors = require("./utils/isSameRouletteColors");
const delay = require("./utils/delay");

const GAME_URL = "https://blaze.com/pt/games/double";
const TIMEOUT = 5000;
const BROWSER_FETCHER_VERSION = "818858";
const ROULETTE_LENGTH = 16;
const SCREENSHOT_FILE_NAME = "screnshot.png";

const puppeteerLaunchOptions = {
  args: [
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--disable-gpu",
    "--no-first-run",
  ],
  defaultViewport: null,
  timeout: TIMEOUT,
  headless: true,
};

const screenshotFilepath = path.join(tmpdir(), SCREENSHOT_FILE_NAME);
const browserFetcher = puppeteer.createBrowserFetcher();
const defaultOptios = {
  waitMs: 5000,
  chatScreenshot: false,
  includeNumber: false,
  proxyServer: "",
  proxyUsername: "",
  proxyPassword: "",
  viewPort: { width: 360, height: 740 }
};

const watchRoulette = async (callback, options) => {
  const {
    waitMs,
    chatScreenshot,
    includeNumber,
    proxyServer,
    proxyUsername,
    proxyPassword,
    viewPort
  } = { ...defaultOptios, ...options };

  if (proxyServer) {
    puppeteerLaunchOptions.args.push(`--proxy-server=${proxyServer}`);
  }

  const revisionInfo = await browserFetcher.download(BROWSER_FETCHER_VERSION);
  const browser = await puppeteer.launch({
    ...puppeteerLaunchOptions,
    executablePath: revisionInfo.executablePath,
  });

  const closeBrowser = async () => {
    await browser.close();
    process.exit(0);
  };

  process.on("SIGINT", closeBrowser);
  process.on("SIGTERM", closeBrowser);

  try {
    const page = await browser.newPage();
    page.setViewport(viewPort);
    await page.setDefaultNavigationTimeout(0);

    if (proxyUsername && proxyPassword) {
      await page.authenticate({ username: proxyUsername, password: proxyPassword });
    }

    await page.goto(GAME_URL, {
      waitUntil: "networkidle2",
      timeout: 0,
    });

    await page.$eval("#open-chat", btn => btn.click());

    let lastRoulette = [];

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const elements = await page.$$(".roulette-previous .sm-box");

      if (elements) {
        // Elements are find in reverse order
        const reverseElements = elements.reverse().slice(-ROULETTE_LENGTH);
        const roulette = await parseRouletteFromElements(reverseElements, includeNumber);

        const rouletteSlice = roulette.slice(-16);
        const hasChanged = !isSameRouletteColors(rouletteSlice, lastRoulette);

        if (hasChanged) {
          if (chatScreenshot) {
            // Scroll chat to end
            await page.$eval(".fast-forward", btn => btn.click()).catch(() => { });
            await page.screenshot({
              path: screenshotFilepath,
              fullPage: true
            });
          }

          callback({
            roulette,
            screenshotFilepath: chatScreenshot ? screenshotFilepath : false,
          });
        }

        lastRoulette = rouletteSlice;
      }

      await delay(waitMs);
    }
  } catch (error) {
    console.error("ERROR: ", error.message);
    callback([]);
  } finally {
    closeBrowser();
  }
};

module.exports = watchRoulette;