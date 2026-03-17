import { io } from "socket.io-client";

const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL ?? "http://localhost:4000";

export function createSocket(token: string) {
  return io(socketUrl, {
    autoConnect: false,
    auth: {
      token
    }
  });
}
