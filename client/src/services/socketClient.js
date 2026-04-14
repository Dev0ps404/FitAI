import { io } from "socket.io-client";

let socket;

export function getSocketClient() {
  if (!socket) {
    socket = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:5000", {
      autoConnect: false,
      transports: ["websocket"],
      withCredentials: true,
    });
  }

  return socket;
}
