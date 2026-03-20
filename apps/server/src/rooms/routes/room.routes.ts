import { Router } from "express";
import type { AuthenticatedRequest } from "../../auth/middleware/auth.middleware.js";
import { authMiddleware } from "../../auth/middleware/auth.middleware.js";
import {
  createRoomForUser,
  getRoomByCode,
  getRecentMatchesForRoom,
  getRecentMatchesForUser,
  joinRoomByCode,
  leaveRoomByCode
} from "../room.service.js";
import { createRoomSchema, joinRoomSchema } from "../validators/room.validators.js";
import { emitRoomUpdate } from "../../socket/socket-state.js";
import { startMatch } from "../../match/game-engine.js";

export const roomRoutes = Router();

roomRoutes.post("/", authMiddleware, async (req: AuthenticatedRequest, res) => {
  const parsed = createRoomSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ message: "Invalid request", errors: parsed.error.flatten() });
    return;
  }

  const userId = req.authUser?.userId;
  if (!userId) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const room = await createRoomForUser(userId, parsed.data);
    await emitRoomUpdate(room.code);
    res.status(201).json({ room });
  } catch {
    res.status(500).json({ message: "Failed to create room" });
  }
});

roomRoutes.post("/join", authMiddleware, async (req: AuthenticatedRequest, res) => {
  const parsed = joinRoomSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ message: "Invalid request", errors: parsed.error.flatten() });
    return;
  }

  const userId = req.authUser?.userId;
  if (!userId) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const result = await joinRoomByCode(userId, parsed.data.roomCode);

  if (result.error) {
    const statusCode = result.error === "Room not found" ? 404 : 400;
    res.status(statusCode).json({ message: result.error });
    return;
  }

  await emitRoomUpdate(result.room.code);
  res.status(200).json({ room: result.room });
});

roomRoutes.get("/me/matches", authMiddleware, async (req: AuthenticatedRequest, res) => {
  const userId = req.authUser?.userId;

  if (!userId) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const limitValue = Number(req.query.limit ?? 10);
  const limit = Number.isFinite(limitValue) ? Math.max(1, Math.min(20, Math.floor(limitValue))) : 10;

  const result = await getRecentMatchesForUser(userId, limit);
  res.status(200).json(result);
});

roomRoutes.get("/:code", authMiddleware, async (req: AuthenticatedRequest, res) => {
  const rawCode = req.params.code;
  const roomCode = (Array.isArray(rawCode) ? rawCode[0] : rawCode ?? "").toUpperCase();

  if (!roomCode) {
    res.status(400).json({ message: "Room code is required" });
    return;
  }

  const room = await getRoomByCode(roomCode);

  if (!room) {
    res.status(404).json({ message: "Room not found" });
    return;
  }

  res.status(200).json({ room });
});

roomRoutes.get("/:code/matches", authMiddleware, async (req: AuthenticatedRequest, res) => {
  const rawCode = req.params.code;
  const roomCode = (Array.isArray(rawCode) ? rawCode[0] : rawCode ?? "").toUpperCase();

  if (!roomCode) {
    res.status(400).json({ message: "Room code is required" });
    return;
  }

  const limitValue = Number(req.query.limit ?? 10);
  const limit = Number.isFinite(limitValue) ? Math.max(1, Math.min(20, Math.floor(limitValue))) : 10;

  const result = await getRecentMatchesForRoom(roomCode, limit);

  if ("error" in result) {
    res.status(404).json({ message: result.error });
    return;
  }

  res.status(200).json(result);
});

roomRoutes.post("/:code/leave", authMiddleware, async (req: AuthenticatedRequest, res) => {
  const userId = req.authUser?.userId;

  if (!userId) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const rawCode = req.params.code;
  const roomCode = Array.isArray(rawCode) ? rawCode[0] : rawCode ?? "";

  if (!roomCode) {
    res.status(400).json({ message: "Room code is required" });
    return;
  }

  const result = await leaveRoomByCode(userId, roomCode);

  if ("error" in result) {
    const statusCode = result.error === "Room not found" ? 404 : 400;
    res.status(statusCode).json({ message: result.error });
    return;
  }

  await emitRoomUpdate(roomCode);
  res.status(200).json({ message: "Left room successfully" });
});

roomRoutes.post("/:code/start", authMiddleware, async (req: AuthenticatedRequest, res) => {
  const userId = req.authUser?.userId;

  if (!userId) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const rawCode = req.params.code;
  const roomCode = (Array.isArray(rawCode) ? rawCode[0] : rawCode ?? "").toUpperCase();

  if (!roomCode) {
    res.status(400).json({ message: "Room code is required" });
    return;
  }

  const result = await startMatch(roomCode, userId);

  if ("error" in result) {
    const statusCode = result.error === "Room not found" ? 404 : 400;
    res.status(statusCode).json({ message: result.error });
    return;
  }

  res.status(200).json({ match: result });
});
