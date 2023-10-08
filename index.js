const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const fs = require("fs");
const cors = require("cors");
const { MongoClient } = require("mongodb");

const app = express();
app.use(cors({ origin: "*" }));

const server = http.createServer(app);

const wss = new WebSocket.Server({ server });

wss.on("connect_error", (err) => {
  console.log(`connect_error due to ${err.message}`);
});

const canvasDataFilePath = "canvas-data.json";

function loadCanvasData() {
  try {
    const data = fs.readFileSync(canvasDataFilePath, "utf8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Error loading canvas data:", error.message);
    return [];
  }
}

const mongoURI =
  "mongodb+srv://ad:passpass123@spiralcluster.q6k2weq.mongodb.net/?retryWrites=true&w=majority";

const dbName = "Canvas";
const collectionName = "Data";

async function saveCanvasDataToMongo(data) {
  try {
    const client = new MongoClient(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    await client.connect();

    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    // Add a "created_at" timestamp
    const now = new Date();
    const document = { data, created_at: now };

    await collection.insertOne(document);

    console.log("Canvas data saved to MongoDB.");

    client.close();
  } catch (error) {
    console.error("Error saving canvas data to MongoDB:", error.message);
  }
}

async function saveCanvasData(data) {
  try {
    fs.writeFileSync(canvasDataFilePath, data, "utf8");

    await saveCanvasDataToMongo(data);
  } catch (error) {
    console.error("Error saving canvas data:", error.message);
  }
}

wss.on("connection", (socket, req) => {
  console.log("Client connected");
  socket.send(JSON.stringify(loadCanvasData()));

  socket.on("message", (message) => {
    let messageString;
    if (typeof message === "string") {
      messageString = message;
    } else if (message instanceof Buffer) {
      messageString = message.toString("utf8");
    }

    saveCanvasData(messageString);

    wss.clients.forEach((client) => {
      if (client !== socket && client.readyState === WebSocket.OPEN) {
        client.send(messageString);
      }
    });
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});

wss.on("error", (error) => {
  console.error("Errorsino:", error);
});

const canvasLink = "https://canvas-app-gules.vercel.app/";

app.get("/", (req, res) => {
  res.redirect(canvasLink);
});

const port = 8080;
server.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
