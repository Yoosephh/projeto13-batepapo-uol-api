import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { MongoClient } from "mongodb";
import joi from "joi";
import dayjs from "dayjs";

const app = express();
const PORT = 5000;
app.use(cors());
app.use(express.json());
dotenv.config();
app.listen(PORT);

const mongoClient = new MongoClient(process.env.DATABASE_URL);

const dayjs = require("dayjs");

const currentTime = dayjs().format("HH:mm:ss");

let db;

try {
  await mongoClient.connect();
  db = mongoClient.db();
} catch (err) {
  res.send(err.message);
}
app.post("/participants", async (req, res) => {
  try {
    const { name } = req.body;

    const userSchema = joi.object({
      name: joi.string().required(),
    });

    const validation = userSchema.validate(name, { abortEarly: false });

    if (validation.error) {
      const errors = validation.error.details.map((detail) => detail.message);
      return res.status(422).send(errors);
    }

    const user = await db.collection("participants").findOne({ name: name });
    if (user) {
      return res.sendStatus(409);
    } else {
      await db
        .collection("participants")
        .insertOne({ name: name, lastStatus: Date.now() });
      await db
        .collection("messages")
        .insertOne({
          from: name,
          to: "Todos",
          text: "Entra na sala...",
          type: "status",
          time: currentTime,
        });

      res.sendStatus(201);
    }
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
});

app.get("/participants", (req, res) => {
  try {
    res.send(db.collection("participants").find());
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
});

app.post("/messages", (req, res) => {
  try {
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
});

app.get("/messages", (req, res) => {
  try {

    res.send(db.collection("messages").find());

  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
});

app.post("/status", (req, res) => {
  try {
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
});
