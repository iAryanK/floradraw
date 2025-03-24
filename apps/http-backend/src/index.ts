import express from "express";
import jwt from "jsonwebtoken";
import { middleware } from "./middleware";
import { JWT_SECRET } from "@repo/backend-common/config";
import {
  CreateRoomSchema,
  CreateUserSchema,
  SigninSchema,
} from "@repo/common/types";
import { prismaClient } from "@repo/db/client";

const app = express();

app.use(express.json());

app.post("/signup", async (req, res) => {
  try {
    const data = CreateUserSchema.safeParse(req.body);
    if (!data.success) {
      res.json({
        message: "incorrect inputs",
      });
      return;
    }

    const user = await prismaClient.user.create({
      data: {
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
      },
    });

    res.json({ userId: user.id });
  } catch (error) {
    console.log("[CREATE USER ERROR]", error);
    throw new Error("failed to create user");
  }
});

app.post("/login", async (req, res) => {
  const data = SigninSchema.safeParse(req.body);
  if (!data.success) {
    res.json({
      message: "incorrect inputs",
    });
    return;
  }

  const user = await prismaClient.user.findUnique({
    where: {
      email: req.body.email,
    },
  });

  if (!user) {
    res.json({
      message: "user doesn't exist",
    });
    return;
  }

  if (user.password !== req.body.password) {
    res.json({
      message: "Invalid credentials",
    });
    return;
  }

  const token = jwt.sign(
    {
      id: user.id,
    },
    JWT_SECRET
  );

  res.status(200).send({ token });
});

app.post("/room", middleware, async (req, res) => {
  const data = CreateRoomSchema.safeParse(req.body);
  if (!data.success) {
    res.json({
      message: "incorrect inputs",
    });
    return;
  }

  try {
    const room = await prismaClient.room.create({
      data: {
        slug: req.body.name,
        // @ts-ignore
        adminId: req.userId,
      },
    });
    res.send({ roomId: room.id });
  } catch (error) {
    console.log("[CREATE ROOM ERROR]", error);
    throw new Error("failed to create room");
  }
});

app.get("/chat/:roomId", middleware, async (req, res) => {
  const roomId = Number(req.params.roomId);

  const messages = await prismaClient.chat.findMany({
    where: {
      roomId: roomId,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 50,
  });

  res.json({
    messages,
  });
});

app.listen(3001);
