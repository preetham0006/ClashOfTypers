import cors from "cors";
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { env } from "./config/env.js";
import { authRoutes } from "./auth/routes/auth.routes.js";

const app = express();
const httpServer = createServer(app);

app.use(cors({ origin: env.CORS_ORIGIN }));
app.use(express.json());
app.use("/auth", authRoutes);

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok", service: "clashoftypers-server" });
});

const io = new Server(httpServer, {
  cors: {
    origin: env.CORS_ORIGIN,
    methods: ["GET", "POST"]
  }
});

io.on("connection", (socket) => {
  socket.emit("server:hello", { message: "Connected to ClashOfTypers socket server" });

  socket.on("disconnect", () => {
    // Placeholder for room cleanup and presence handling.
  });
});

httpServer.listen(env.PORT, () => {
  console.log(`Server running on http://localhost:${env.PORT}`);
});
