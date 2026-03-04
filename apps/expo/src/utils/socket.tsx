import { io } from "socket.io-client";

// const WS_URL = "http://192.168.1.24:4200"
const WS_URL = "ws://wssforevent.fly.dev"

export const socket = io(WS_URL, { transports: ['websocket'], autoConnect: false });