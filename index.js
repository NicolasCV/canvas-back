const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const fs = require("fs");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: { origin: "*" },
});

io.on("connect_error", (err) => {
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
    fs.writeFileSync(canvasDataFilePath, JSON.stringify(data), "utf8");
  } catch (error) {
    console.error("Error saving canvas data:", error.message);
  }
}

let canvasData = loadCanvasData();

io.on("connection", (socket) => {
  console.log("Client connected");

  socket.emit("canvasData", canvasData);

  socket.on("message", (data) => {
    console.log("Message received:", data);
    canvasData = data;
    saveCanvasData(canvasData);

    io.emit("canvasData", canvasData);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});

io.on("error", (error) => {
  console.error("Socket.io error:", error);
});

server.listen(3000, () => {
  console.log("Server is listening on port 3000");
});
