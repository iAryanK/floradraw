import { WebSocket, WebSocketServer } from "ws";
import { JWT_SECRET } from "@repo/backend-common/config";
import { JwtPayload } from "jsonwebtoken";
import jwt from "jsonwebtoken";
import { prismaClient } from "@repo/db/client";

const wss = new WebSocketServer({ port: 8080 });

interface User {
  userId: string;
  rooms: string[];
  ws: WebSocket;
}

const users: User[] = [];

const checkUser = (token: string): string | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    if (!decoded || !(decoded as JwtPayload).id) {
      return null;
    }

    // @ts-ignore
    return decoded.id;
  } catch (error) {
    return null;
  }
};

wss.on("connection", function connection(ws: WebSocket, request) {
  const url = request.url;

  if (!url) return;

  const queryParams = new URLSearchParams(url.split("?")[1]);
  const token = queryParams.get("token") ?? "";

  const userId = checkUser(token);
  if (!userId) {
    ws.close();
    return;
  }

  users.push({
    userId,
    rooms: [],
    ws,
  });

  ws.on("message", async function message(data) {
    const parsedData = JSON.parse(data.toString());

    // {type:"join_room", roomId:"123"}
    if (parsedData.type === "join_room") {
      const user = users.find((x) => x.ws === ws);

      user?.rooms.push(parsedData.roomId);
    }

    // {type:"leave_room", roomId:"123"}
    if (parsedData.type === "leave_room") {
      const user = users.find((x) => x.ws === ws);

      if (!user) return;

      user.rooms = user?.rooms.filter((roomId) => roomId !== parsedData.roomId);
    }

    // { type:"chat", roomId:"123", message:"Hello" }
    if (parsedData.type === "chat") {
      const roomId = parsedData.roomId;
      const message = parsedData.message;

      await prismaClient.chat.create({
        data: {
          message,
          roomId,
          userId,
        },
      });

      users.forEach((user) => {
        if (user.rooms.includes(roomId)) {
          user.ws.send(JSON.stringify({ type: "chat", message, roomId }));
        }
      });
    }
  });
});
