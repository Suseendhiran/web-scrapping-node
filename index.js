import express from "express";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import cors from "cors";
import {
  getFlipkartResponse,
  getSnapdealResponse,
  getAmazonResponse,
} from "./scrappers.js";
import { queryBuilder } from "./queryBuilder.js";

const app = express();

app.use(express.json());
app.use(cors());
dotenv.config();

app.listen(process.env.PORT);

//const MONGO_URL = "mongodb://localhost";

const MONGO_URL = process.env.MONGO_URL;

async function createConnection() {
  const client = new MongoClient(MONGO_URL);
  await client.connect();
  console.log("Mongodb Connected");
  return client;
}

export const client = await createConnection();

export let products = [];
const categories = ["mobiles", "laptops"]; // categories can be added in this array which will add new category while scrapping every 12 hrs
const websites = ["amazon", "flipkart", "snapdeal"];

setInterval(() => {
  dropAllCollections(); //drop collection
  categories.forEach((category) => {
    dataScrapper(category);
  });
}, [43200000]);
//12 hrs = 43200000

// dropAllCollections();
// categories.forEach((category) => {
//   dataScrapper(category);
// });

//scrap data for different categories
function dataScrapper(category) {
  getAmazonResponse(category);
  getFlipkartResponse(category);
  getSnapdealResponse(category);
}
function dropAllCollections() {
  // websites.forEach((website) => {
  //   client.db("scrapper").collection(website).drop();
  // });
  client.db("scrapper").collection("products").drop();
}
//dropAllCollections();
app.get("/", (req, res) => {
  res.send("Welcome to Ecommerce scrapper");
});
app.get("/products", async (req, res) => {
  const query = req.query;
  const page = parseInt(query.page);
  const limit = query.limit ? parseInt(query.limit) : 0;

  const response = {};
  delete query.page;
  delete query.limit;
  const startIndex = page ? (page - 1) * limit + 1 : 0;
  const endIndex = page * limit;

  const productsCount = await client
    .db("scrapper")
    .collection("products")
    .find(queryBuilder(query))
    .count();

  if (endIndex < productsCount) {
    response.hasNext = true;
  }
  if (page > 1) {
    response.hasPrevious = true;
  }

  let products = [];
  const findQuery = queryBuilder(query);

  products = products = await client
    .db("scrapper")
    .collection("products")
    .find(findQuery)
    .limit(limit)
    .skip(startIndex)
    .toArray();

  //console.log(products.length, productsCount, endIndex);
  response.results = products;
  response.totalCount = productsCount;
  res.send(response);
});
