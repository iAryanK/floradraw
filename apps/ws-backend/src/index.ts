import { WebSocketServer } from "ws";
import { JWT_SECRET } from "./config";
import { JwtPayload } from "jsonwebtoken";
import jwt from "jsonwebtoken";

const wss = new WebSocketServer({ port: 8000 });

wss.on("connection", function connection(ws, request) {
  const url = request.url;

  if (!url) return;

  const queryParams = new URLSearchParams(url.split("?")[1]);
  const token = queryParams.get("token") ?? "";

  const decoded = jwt.verify(token, JWT_SECRET);

  if (!decoded || !(decoded as JwtPayload).userId) {
    ws.close();
    return;
  }
  ws.on("message", function message(data) {
    ws.send(`pong`);
  });
});
