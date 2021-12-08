import express from "express";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import cors from "cors";
import {
  getFlipkartResponse,
  getSnapdealResponse,
  getAmazonResponse,
} from "./scrappers.js";

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
const categories = ["mobiles", "laptops"];
const websites = ["amazon", "flipkart", "snapdeal"];

setInterval(() => {
  dropAllCollections();
  categories.forEach((category) => {
    dataScrapper(category);
  });
}, [43200000]);
//dropAllCollections();
// categories.forEach((category) => {
//   dataScrapper(category);
// });

//12 hrs = 43200000
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
  const limit = 10;
  const response = {};
  delete query.page;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;

  const productsCount = await client
    .db("scrapper")
    .collection("products")
    .find({})
    .count();
  if (endIndex < productsCount) {
    response.hasNext = true;
  }
  if (page > 1) {
    response.hasPrevious = true;
  }
  //console.log("skip", startIndex);
  let products = [];
  if (page) {
    products = await client
      .db("scrapper")
      .collection("products")
      .find(query)
      .limit(limit)
      .skip(startIndex + 1)
      .toArray();
  } else {
    products = products = await client
      .db("scrapper")
      .collection("products")
      .find({
        source: query.source,
        name: { $regex: query.name, $options: "$i" },
      })
      .toArray();
  }

  //console.log(products.length, productsCount, endIndex);
  response.results = products;
  res.send(response);
});
