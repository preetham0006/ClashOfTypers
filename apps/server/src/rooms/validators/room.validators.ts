import { z } from "zod";

export const roomDurationOptions = [30, 60, 120] as const;
export const roomBestOfOptions = [1, 3, 5] as const;

export const createRoomSchema = z.object({
  durationSec: z.union([z.literal(30), z.literal(60), z.literal(120)]),
  bestOf: z.union([z.literal(1), z.literal(3), z.literal(5)])
});

export const joinRoomSchema = z.object({
  roomCode: z.string().min(4).max(20)
});

export type CreateRoomInput = z.infer<typeof createRoomSchema>;
export type JoinRoomInput = z.infer<typeof joinRoomSchema>;
