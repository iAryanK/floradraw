import { NextFunction, Request, Response } from "express";
import { JWT_SECRET } from "@repo/backend-common/config";
import jwt from "jsonwebtoken";

export function middleware(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.split(" ")[1] ?? "";

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    if (decoded) {
      // @ts-ignore - update the structure of the request object in express
      req.userId = decoded.userId;
      next();
    }
  } catch (error) {
    res.status(401).send("Unauthorized");
  }
}
