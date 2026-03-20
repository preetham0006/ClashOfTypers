import cors from "cors";
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { env } from "./config/env.js";
import { authRoutes } from "./auth/routes/auth.routes.js";
import { roomRoutes } from "./rooms/routes/room.routes.js";
import { verifyAuthToken } from "./auth/utils/jwt.js";
import { emitRoomUpdate, setSocketServer } from "./socket/socket-state.js";
import { getMatchState, submitTypingProgress } from "./match/game-engine.js";

const roomPresence = new Map<string, Map<string, number>>();

function emitPresence(roomCode: string) {
  const normalizedCode = roomCode.toUpperCase();
  const presence = roomPresence.get(normalizedCode);
  const connectedUserIds = presence ? Array.from(presence.keys()) : [];

  io.to(`room:${normalizedCode}`).emit("room:presence", {
    roomCode: normalizedCode,
    connectedUserIds
  });
}

function addPresence(roomCode: string, userId: string) {
  const normalizedCode = roomCode.toUpperCase();
  const roomMap = roomPresence.get(normalizedCode) ?? new Map<string, number>();
  roomMap.set(userId, (roomMap.get(userId) ?? 0) + 1);
  roomPresence.set(normalizedCode, roomMap);
  emitPresence(normalizedCode);
}

function removePresence(roomCode: string, userId: string) {
  const normalizedCode = roomCode.toUpperCase();
  const roomMap = roomPresence.get(normalizedCode);

  if (!roomMap) {
    return;
  }

  const next = (roomMap.get(userId) ?? 0) - 1;
  if (next <= 0) {
    roomMap.delete(userId);
  } else {
    roomMap.set(userId, next);
  }

  if (roomMap.size === 0) {
    roomPresence.delete(normalizedCode);
  }

  emitPresence(normalizedCode);
}

const app = express();
const httpServer = createServer(app);

app.use(cors({ origin: env.CORS_ORIGIN }));
app.use(express.json());
app.use("/auth", authRoutes);
app.use("/rooms", roomRoutes);

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok", service: "clashoftypers-server" });
});

const io = new Server(httpServer, {
  cors: {
    origin: env.CORS_ORIGIN,
    methods: ["GET", "POST"]
  }
});

setSocketServer(io);

io.use((socket, next) => {
  const token = typeof socket.handshake.auth?.token === "string" ? socket.handshake.auth.token : null;

  if (!token) {
    next(new Error("Unauthorized"));
    return;
  }

  try {
    const payload = verifyAuthToken(token);
    socket.data.authUser = {
      userId: payload.sub,
      email: payload.email,
      username: payload.username
    };
    next();
  } catch {
    next(new Error("Unauthorized"));
  }
});

io.on("connection", (socket) => {
  const subscribedRooms = new Set<string>();
  socket.emit("server:hello", { message: "Connected to ClashOfTypers socket server" });

  socket.on("room:subscribe", async (payload: { roomCode?: string }) => {
    const roomCode = (payload.roomCode ?? "").toUpperCase();

    if (!roomCode) {
      return;
    }

    await socket.join(`room:${roomCode}`);

    if (!subscribedRooms.has(roomCode)) {
      subscribedRooms.add(roomCode);
      addPresence(roomCode, socket.data.authUser.userId as string);
    }

    await emitRoomUpdate(roomCode);

    const matchState = getMatchState(roomCode, socket.data.authUser.userId as string);
    if (matchState) {
      socket.emit("room:matchState", {
        roomCode,
        ...matchState
      });
    }

    emitPresence(roomCode);
  });

  socket.on("room:unsubscribe", async (payload: { roomCode?: string }) => {
    const roomCode = (payload.roomCode ?? "").toUpperCase();

    if (!roomCode) {
      return;
    }

    await socket.leave(`room:${roomCode}`);

    if (subscribedRooms.has(roomCode)) {
      subscribedRooms.delete(roomCode);
      removePresence(roomCode, socket.data.authUser.userId as string);
    }
  });

  socket.on(
    "room:typingProgress",
    (payload: { roomCode?: string; typedLength?: number; correctCharacters?: number; mistakes?: number }) => {
      const roomCode = (payload.roomCode ?? "").toUpperCase();
      const userId = socket.data.authUser?.userId as string | undefined;

      if (!roomCode || !userId) {
        return;
      }

      const result = submitTypingProgress(roomCode, userId, {
        typedLength: Number(payload.typedLength ?? 0),
        correctCharacters: Number(payload.correctCharacters ?? 0),
        mistakes: Number(payload.mistakes ?? 0)
      });

      if (result?.error) {
        socket.emit("room:progressRejected", { roomCode, reason: result.error });
      }
    }
  );

  socket.on("disconnect", () => {
    const userId = socket.data.authUser?.userId as string | undefined;

    if (!userId) {
      return;
    }

    for (const roomCode of subscribedRooms) {
      removePresence(roomCode, userId);
    }
  });
});

httpServer.listen(env.PORT, () => {
  console.log(`Server running on http://localhost:${env.PORT}`);
});
