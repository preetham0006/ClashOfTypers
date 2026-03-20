import { PrismaClient } from "@prisma/client";
import type { CreateRoomInput } from "./validators/room.validators.js";

const prisma = new PrismaClient();

function generateRoomCode(length = 6): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";

  for (let index = 0; index < length; index += 1) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }

  return code;
}

async function createUniqueRoomCode(): Promise<string> {
  let attempts = 0;

  while (attempts < 10) {
    const code = generateRoomCode();
    const existing = await prisma.room.findUnique({ where: { code } });

    if (!existing) {
      return code;
    }

    attempts += 1;
  }

  throw new Error("Unable to generate unique room code");
}

export async function createRoomForUser(userId: string, input: CreateRoomInput) {
  const code = await createUniqueRoomCode();

  return prisma.room.create({
    data: {
      code,
      creatorId: userId,
      durationSec: input.durationSec,
      bestOf: input.bestOf,
      maxPlayers: 10,
      participants: {
        create: {
          userId
        }
      }
    },
    include: {
      creator: {
        select: {
          id: true,
          username: true,
          email: true
        }
      },
      participants: {
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true
            }
          }
        }
      }
    }
  });
}

export function getRoomByCode(roomCode: string) {
  return prisma.room.findUnique({
    where: { code: roomCode.toUpperCase() },
    include: {
      creator: {
        select: {
          id: true,
          username: true,
          email: true
        }
      },
      participants: {
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true
            }
          }
        },
        orderBy: {
          joinedAt: "asc"
        }
      }
    }
  });
}

export async function joinRoomByCode(userId: string, roomCode: string) {
  const room = await getRoomByCode(roomCode);

  if (!room) {
    return { error: "Room not found" as const };
  }

  if (!room.isActive) {
    return { error: "Room is inactive" as const };
  }

  const alreadyJoined = room.participants.some((participant: { userId: string }) => participant.userId === userId);
  if (alreadyJoined) {
    return { room };
  }

  if (room.participants.length >= room.maxPlayers) {
    return { error: "Room is full" as const };
  }

  await prisma.roomParticipant.create({
    data: {
      roomId: room.id,
      userId
    }
  });

  const updatedRoom = await getRoomByCode(roomCode);
  return { room: updatedRoom! };
}

export async function leaveRoomByCode(userId: string, roomCode: string) {
  const room = await getRoomByCode(roomCode);

  if (!room) {
    return { error: "Room not found" as const };
  }

  const participant = room.participants.find((entry: { userId: string }) => entry.userId === userId);
  if (!participant) {
    return { error: "You are not in this room" as const };
  }

  await prisma.roomParticipant.delete({
    where: {
      roomId_userId: {
        roomId: room.id,
        userId
      }
    }
  });

  if (room.creatorId === userId) {
    await prisma.room.update({
      where: { id: room.id },
      data: {
        isActive: false
      }
    });
  }

  return { success: true as const };
}

export async function getRecentMatchesForRoom(roomCode: string, limit = 10) {
  const room = await prisma.room.findUnique({
    where: { code: roomCode.toUpperCase() },
    select: { id: true }
  });

  if (!room) {
    return { error: "Room not found" as const };
  }

  const matches = await prisma.match.findMany({
    where: {
      roomId: room.id,
      status: "COMPLETED"
    },
    orderBy: {
      endedAt: "desc"
    },
    take: limit,
    include: {
      rounds: {
        orderBy: { roundNumber: "asc" },
        include: {
          stats: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true
                }
              }
            },
            orderBy: [
              { correctCharacters: "desc" },
              { accuracy: "desc" }
            ]
          }
        }
      }
    }
  });

  return { matches };
}

export async function getRecentMatchesForUser(userId: string, limit = 10) {
  const matches = await prisma.match.findMany({
    where: {
      status: "COMPLETED",
      rounds: {
        some: {
          stats: {
            some: {
              userId
            }
          }
        }
      }
    },
    orderBy: {
      endedAt: "desc"
    },
    take: limit,
    include: {
      room: {
        select: {
          id: true,
          code: true
        }
      },
      rounds: {
        orderBy: { roundNumber: "asc" },
        include: {
          stats: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true
                }
              }
            },
            orderBy: [
              { correctCharacters: "desc" },
              { accuracy: "desc" }
            ]
          }
        }
      }
    }
  });

  return { matches };
}
