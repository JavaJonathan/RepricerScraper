const readWrite = require("fs");

exports.writeToJsonFile = (
  title,
  sku,
  price,
  minPrice,
  maxPrice,
  itemCost,
  shippingCost,
  pickPackCost
) => {
  let product = {
    title,
    sku,
    price,
    minPrice,
    maxPrice,
    itemCost,
    shippingCost,
    pickPackCost,
  };
  if (!readWrite.existsSync("RepricerProducts.json")) {
    readWrite.writeFileSync("RepricerProducts.json", JSON.stringify([product]));
  } else {
    let products = readWrite.readFileSync("RepricerProducts.json");

    products = JSON.parse(products);

    if (recordExists(product, products)) return;

    products.push(product);

    readWrite.writeFileSync("RepricerProducts.json", JSON.stringify(products));
  }
};

const recordExists = (productToBeAdded, products) =>
  products.some((product) => product.sku === productToBeAdded.sku);
