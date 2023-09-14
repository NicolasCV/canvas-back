const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const fs = require("fs");
const cors = require("cors");

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

function saveCanvasData(data) {
  try {
    fs.writeFileSync(canvasDataFilePath, data, "utf8");
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

server.listen(3000, () => {
  console.log("Server is listening on port 3000");
});
