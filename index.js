const puppeteer = require("puppeteer");
const readWrite = require("fs");
const fileHelper = require("./FileHelper.js");

let username;
let password;
let productTitle;
let sku;
let price;
let itemCost;
let shippingCost;
let pickPackCost;

startBot();

async function startBot() {
  try {
    const browser = await puppeteer.launch({
      headless: false,
      args: ["--start-maximized"],
      defaultViewport: null,
    });
    const page = await browser.newPage();
    await setBotConfigs(page);
    await login(page);
    for (let pageNumber = 79; pageNumber <= 100; pageNumber++) {
      console.log(pageNumber);
      await navigateToProductsPage(page, pageNumber);
      await scrapePage(page);
    }
  } catch (e) {
    console.log(e);
  }
}

async function setBotConfigs(page) {
  let botConfigs;

  readWrite.readFile("botConfigs.json", (error, credentials) => {
    if (error) throw error;
    botConfigs = JSON.parse(credentials);
  });

  await page.waitForNetworkIdle();

  username = botConfigs.username;
  password = botConfigs.password;
}

async function login(page) {
  await page.goto(`https://dashboard.repricer.com/login?next=%2F`);
  await page.type('input[name="username"]', `${username}`, {
    delay: 250,
  });
  await page.type('input[name="password"]', `${password}`, {
    delay: 250,
  });
  await page.click('button[type="submit"]');
}

async function navigateToProductsPage(page, pageNumber) {
  await page.goto(
    `https://dashboard-1.repricer.com/repricer?order=sku&orderdir=1&page=${pageNumber}`,
    {
      timeout: 60000,
    }
  );
  await page.waitForSelector('span[id="paginationLine"]');
  await page.click('span[id="paginationLine"]');
  await page.click('a[href="/data/session/ipp?idx=3"]');
}

async function scrapePage(page) {
  await page.waitForSelector('tr[data-target="/repricer/get-detail/"]');

  let products = await page.$$('tr[data-target="/repricer/get-detail/"]');

  for (let counter = 0; counter < products.length; counter++) {
    try {
      let clickArea = await page.$$('td[class="product-name"]');
      await clickArea[counter].click({ delay: 1000 });
      await page.waitForSelector(
        'div[class="popout-header product-custom__header"]'
      );
      let titleText = await page.$(
        'div[class="popout-header product-custom__header"] div h4'
      );

      productTitle = await (
        await titleText.getProperty("textContent")
      ).jsonValue();

      let skuText = await page.$('a[title="Filter by SKU"]');
      sku = await (await skuText.getProperty("textContent")).jsonValue();

      let priceText = await page.$(
        'span[class="text-strong profit-container__item__value"]'
      );
      price = await (await priceText.getProperty("textContent")).jsonValue();

      let minPriceText = await page.$(
        'input[class="form-control js-min-price"]'
      );
      let minPrice = await (
        await minPriceText.getProperty("value")
      ).jsonValue();

      let maxPriceText = await page.$(
        'input[class="form-control js-max-price"]'
      );
      let maxPrice = await (
        await maxPriceText.getProperty("value")
      ).jsonValue();

      await getProductCosts(page);

      fileHelper.writeToJsonFile(
        productTitle,
        sku,
        price,
        minPrice,
        maxPrice,
        itemCost,
        shippingCost,
        pickPackCost
      );

      console.log(
        `${productTitle} ${sku} ${minPrice} ${maxPrice} ${itemCost} ${shippingCost} ${pickPackCost}`
      );
      await closeModal(page);
    } catch (e) {
      if (productTitle) {
        fileHelper.writeToJsonFile(productTitle, sku, price, 0, 0, 0, 0, 0);
      } else {
        console.log("Something error'd");
      }
      await closeModal(page);
    }
  }
}

async function getProductCosts(page) {
  await page.waitForSelector('td[class="product-costs-trigger"]');
  await page.click('td[class="product-costs-trigger"]', { delay: 1000 });

  await page.waitForSelector('input[name="import_unit_cost"]');
  let itemCostText = await page.$('input[name="import_unit_cost"]');
  itemCost = await (await itemCostText.getProperty("value")).jsonValue();

  let shippingCostText = await page.$('input[name="import_shipping_cost"]');
  shippingCost = await (
    await shippingCostText.getProperty("value")
  ).jsonValue();

  let pickPackCostText = await page.$('input[name="import_pickpack_cost"]');
  pickPackCost = await (
    await pickPackCostText.getProperty("value")
  ).jsonValue();
}

async function closeModal(page) {
  await page.waitForSelector('a[class="btn-close js-ajax-view-details-close"]');
  await page.click('a[class="btn-close js-ajax-view-details-close"]', {
    delay: 1000,
  });
}
