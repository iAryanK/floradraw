import express from "express";
import jwt from "jsonwebtoken";
import { middleware } from "./middleware";
import { JWT_SECRET } from "@repo/backend-common/config";
import {
  CreateRoomSchema,
  CreateUserSchema,
  SigninSchema,
} from "@repo/common/types";

const app = express();

app.use(express.json());

app.post("/signup", (req, res) => {
  const data = CreateUserSchema.safeParse(req.body);
  if (!data.success) {
    res.json({
      message: "incorrect inputs",
    });
    return;
  }
  // db call to create user

  res.status(201).json({ userId: 123 });
});

app.post("/login", (req, res) => {
  const data = SigninSchema.safeParse(req.body);
  if (!data.success) {
    res.json({
      message: "incorrect inputs",
    });
    return;
  }

  const userId = 1;
  const token = jwt.sign(
    {
      userId,
    },
    JWT_SECRET
  );

  res.status(200).send("User logged in");
});

app.post("/room", middleware, (req, res) => {
  const data = CreateRoomSchema.safeParse(req.body);
  if (!data.success) {
    res.json({
      message: "incorrect inputs",
    });
    return;
  }

  res.status(201).send("Room created");
});

app.listen(3001);
