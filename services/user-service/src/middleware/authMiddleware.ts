import type { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt.js";
import userModel from "../models/userModel.js"; // Import the Prisma User client

const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let token: string | undefined;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res
      .status(401)
      .json({ message: "Access Denied: No token provided." });
  }

  try {
    const decoded = verifyToken(token);

    if (!decoded || !decoded.id) {
      return res
        .status(403)
        .json({ message: "Access Denied: Invalid or expired token." });
    }

    const currentUser = await userModel.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!currentUser) {
      return res
        .status(404)
        .json({ message: "User not found for this token." });
    }
    req.user = currentUser;
    next();
  } catch (error: any) {
    console.error("Auth middleware error:", error.message);
    res.status(500).json({ message: "Server error during authentication." });
  }
};

export default authenticateToken;
