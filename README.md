# blaze-double-roulette-crawler
A SPA crawler that watches Blaze Double roulette https://blaze.com/pt/games/double

##  Instalation

```sh
npm i @gustavonovaes/blaze-double-roulette-crawler
```

## Usage

Code example:

```js 

const { watchRoulette }  = require("@gustavonovaes/blaze-double-roulette-crawler");

const watchOptions = {
  waitMs: 1000, // Waits 1s between each read
  includeNumber: true, // Reads the number 
  viewPort: { width: 360, height: 740 }, // viewPort for screenshot
  chatScreenshot: true, // Takes a screenshot of chat section
};

watchRoulette(async ({ roulette, screenshotFilepath }) => {
  console.log(roulette);  // [{ color: "red", number: 1 }, { color: "white", number: 0 }, ...]
  console.log(screenshotFilepath); // /tmp/screenshot.png
}, watchOptions);
```