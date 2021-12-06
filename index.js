import express from "express";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import {
  getFlipkartResponse,
  getSnapdealResponse,
  getAmazonResponse,
} from "./scrappers.js";

const app = express();
app.listen(5000);
app.use(express.json());
dotenv.config();

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
  getFlipkartResponse(category);
  getSnapdealResponse(category);
  getAmazonResponse(category);
}
function dropAllCollections() {
  websites.forEach((website) => {
    client.db("scrapper").collection(website).drop();
  });
}
//dropAllCollections();

app.get("/products", async (req, res) => {
  const query = req.query;
  console.log(query);
  let amazonProducts = [];
  let flipkartProducts = [];
  let snapdealProducts = [];
  amazonProducts = await client
    .db("scrapper")
    .collection("amazon")
    .find(query)
    .toArray();
  flipkartProducts = await client
    .db("scrapper")
    .collection("flipkart")
    .find(query)
    .toArray();
  snapdealProducts = await client
    .db("scrapper")
    .collection("snapdeal")
    .find(query)
    .toArray();

  res.send([...amazonProducts, ...flipkartProducts, ...snapdealProducts]);
});
