import type { Server } from "socket.io";
import { getRoomByCode } from "../rooms/room.service.js";

let socketServer: Server | null = null;

export function setSocketServer(io: Server) {
  socketServer = io;
}

export function emitRoomEvent(roomCode: string, eventName: string, payload: unknown) {
  if (!socketServer) {
    return;
  }

  socketServer.to(`room:${roomCode.toUpperCase()}`).emit(eventName, payload);
}

export async function emitRoomUpdate(roomCode: string) {
  if (!socketServer) {
    return;
  }

  const normalizedCode = roomCode.toUpperCase();
  const room = await getRoomByCode(normalizedCode);

  if (!room) {
    return;
  }

  socketServer.to(`room:${normalizedCode}`).emit("room:update", { room });
}
