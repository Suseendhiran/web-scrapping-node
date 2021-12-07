import request from "request-promise";
import cheerio from "cheerio";
import { products, client } from "./index.js";

// (async () => {
//   let productsData = [];
//   const response = await request();
// })();
function amazonScrapper($, category) {
  let amazonProducts = [];
  $(".s-asin").each((i, el) => {
    const id = $(el).attr("data-asin");

    const name = $(el).find("h2 span").text();
    const price = $(el).find(".a-text-price span").next().text();
    const priceWithOffer = $(el).find(".a-price-whole").text();

    const rating = $(el).find(".a-spacing-top-micro span").attr("aria-label");
    const image = $(el).find(".s-image").attr("src");
    const link =
      "https://www.amazon.in" + $(el).find(".a-link-normal").attr("href");
    "https://www.amazon.in" + $(el).find(".a-link-normal").attr("href");
    const data = {
      id,
      name,
      price,
      priceWithOffer,
      rating,
      image,
      link,
      category,
      source: "Amazon",
    };
    amazonProducts.push(data);
  });
  return amazonProducts;
}
function flipkartScrapper($, category) {
  let flipkartProducts = [];
  $("._1AtVbE").each((i, el) => {
    const id = i;
    const name = $(el).find("._4rR01T").text();
    const price = $(el).find("._3I9_wc").text();
    const priceWithOffer = $(el).find("._30jeq3").text();
    const rating = $(el).find("._3LWZlK").text();
    const image = $(el).find("._396cs4").attr("src");
    const link = $(el).find("._1fQZEK").attr("href");
    const data = {
      id,
      name,
      price,
      priceWithOffer: priceWithOffer,
      rating: `${rating} out of 5`,
      image,
      link: `https://www.flipkart.com${link}`,
      category,
      source: "Flipkart",
    };

    if (name) flipkartProducts.push(data);
  });
  return flipkartProducts;
}
function snapDealScrapper($, category) {
  let snapDealProducts = [];
  $(".favDp").each((i, el) => {
    const id = i;
    const name = $(el).find(".product-title").text();
    const price = $(el).find(".product-desc-price").text();
    const priceWithOffer = $(el).find(".product-price").text();
    const ratingWidth = $(el).find(".filled-stars").attr("style");
    const image = $(el).find("img").attr("src");
    const link = $(el).find(".dp-widget-link").attr("href");

    function calcuateRating(width) {
      let rating = 0;

      if (width) {
        rating = parseInt(width.match(/\d{1,2}[\,\.]{1}\d{1,2}/g)) / 20;
      }

      return rating;
    }
    const data = {
      id,
      name,
      price,
      priceWithOffer: priceWithOffer,
      rating: `${calcuateRating(ratingWidth)} out of 5`,
      image,
      link,
      category,
      source: "Snapdeal",
    };

    if (name) snapDealProducts.push(data);
  });
  return snapDealProducts;
}
export async function getAmazonResponse(category) {
  const amazonResponse = await request({
    uri: `https://www.amazon.in/s?k=${category}&ref=nb_sb_noss_2`,
  });
  const $ = cheerio.load(amazonResponse);
  let products = amazonScrapper($, category);
  client.db("scrapper").collection("products").insertMany(products);
}
export async function getFlipkartResponse(category) {
  const flipkartResponse = await request({
    uri: `https://www.flipkart.com/search?q=${category}&otracker=search&otracker1=search&marketplace=FLIPKART&as-show=on&as=off`,
  });

  const $ = cheerio.load(flipkartResponse);
  let products = flipkartScrapper($, category);

  client.db("scrapper").collection("products").insertMany(products);
}
export async function getSnapdealResponse(category) {
  const snapdealResponse = await request({
    uri: `https://www.snapdeal.com/search?keyword=${category}&santizedKeyword=sonytv&catId=0&categoryId=0&suggested=false&vertical=p&noOfResults=20&searchState=&clickSrc=go_header&lastKeyword=&prodCatId=&changeBackToAll=false&foundInAll=false&categoryIdSearched=&cityPageUrl=&categoryUrl=&url=&utmContent=&dealDetail=&sort=rlvncy`,
  });

  const $ = cheerio.load(snapdealResponse);
  let products = snapDealScrapper($, category);
  client.db("scrapper").collection("products").insertMany(products);
}
