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

const mongoClient = new MongoClient(process.env.DATABASE_URL);

const currentTime = dayjs().format("HH:mm:ss");

let db;

try {
  mongoClient.connect((err) => {return console.log(err)});
  db = mongoClient.db();

  console.log(`${currentTime}: Conectado com o banco de dados`);

  app.listen(PORT, ()=> {
    console.log(`Servidor rodando na porta ${PORT}, juntamente ao Mongo!`)
  });
  
}catch (err) {
  console.log(err.message);
}

// setInterval(async () => {
//   const tempoAway = new Date(Date.now() - 10000);
//   const participantesRemovidos = await db.collection("participants").find({
//     lastStatus: { $lt: tempoAway },
//   }).toArray();

//   if (participantesRemovidos.length > 0) {
//     const currentTime = dayjs().format("HH:mm:ss");
//     await db.collection("participants").deleteMany({
//       lastStatus: { $lt: tempoAway },
//     });

//     const messages = participantesRemovidos.map((participant) => ({
//       from: participant.name,
//       to: "Todos",
//       text: "Saiu da sala...",
//       type: "status",
//       time: currentTime,
//     }));

//     await db.collection("messages").insertMany(messages);
//   }
// }, 15000);

app.post("/participants", async (req, res) => {
  try {
    const { name } = req.body;

    const userSchema = joi.object({
      name: joi.string().required(),
    });

    const validation = userSchema.validate({name}, { abortEarly: false });

    if (validation.error) {
      const errors = validation.error.details.map((detail) => detail.message);
      return res.status(422).send(errors);
    }

    const user = await db.collection("participants").findOne({ name });

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

app.get("/participants", async(req, res) => {
  try {
    res.send(await db.collection("participants").find().toArray());
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
});

app.post("/messages", async (req, res) => {
  try {
    const { to, text, type } = req.body;
    const from = req.headers.user; 

    const messageSchema = joi.object({
      to: joi.string().required(),
      text: joi.string().required(),
      type: joi.string().valid("message", "private_message").required(),
    });

    const validation = messageSchema.validate({ to, text, type }, { abortEarly: false });

    if (validation.error) {
      const errors = validation.error.details.map((detail) => detail.message);
      return res.status(422).send(errors);
    }

    const participant = await db.collection("participants").findOne({ name: from });
    if (!participant) {
      return res.sendStatus(422).send("Invalid participant");
    }

    const message = {
      from,
      to,
      text,
      type,
      time: currentTime,
    };

    await db.collection("messages").insertOne(message);

    res.sendStatus(201);

  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
});

app.get("/messages", async(req, res) => {
  try {

    res.send(await db.collection("messages").find().toArray());

  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
});

app.post("/status", async(req, res) => {
  try {
    const {name} = req.headers.user

    if(!name) {
      return res.sendStatus(404)
    }
    await db.collection("participants").findOneAndUpdate( {name}, { lastStatus: Date.now()} )
    res.sendStatus(200)
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
});
