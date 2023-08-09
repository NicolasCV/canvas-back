const express = require("express");
const fs = require("fs");
const http = require("http");
const WebSocket = require("ws");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

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
    fs.writeFileSync(canvasDataFilePath, JSON.stringify(data), "utf8");
  } catch (error) {
    console.error("Error saving canvas data:", error.message);
  }
}

let canvasData = loadCanvasData();

wss.on("connection", (socket) => {
  console.log("Client connected");
  // Send existing canvas data to the new client
  socket.send(canvasData);

  socket.on("message", (data) => {
    console.log("Received:", data);
    console.log("ye");
    console.log(data);
    canvasData = data;
    saveCanvasData(canvasData);

    wss.clients.forEach((client) => {
      if (client !== socket && client.readyState === WebSocket.OPEN) {
        client.send(canvasData);
      }
    });
  });

  socket.on("close", () => {
    console.log("Client disconnected");
  });
});

wss.on("error", (error) => {
  console.error("WebSocket error:", error);
});

server.listen(3000, () => {
  console.log("Server is listening on port 3000");
});
