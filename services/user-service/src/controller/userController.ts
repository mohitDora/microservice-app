import type { Request, Response } from "express";
import userModel from "../models/userModel.js";
import { generateToken } from "../utils/jwt.js";
import { hashPassword, comparePassword } from "../utils/password.js";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { z } from 'zod';
import { verifyToken } from "../utils/jwt.js";

// Validation Schemas
const registerSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters').max(100),
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters')
});

const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required')
});

const idParamSchema = z.object({
  id: z.string().uuid('Invalid user id')
});

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email('Invalid email').optional(),
  password: z.string().min(8, 'Password must be at least 8 characters').optional()
}).refine((data) => Object.keys(data).length > 0, {
  message: 'At least one field is required to update',
});

export const registerUser = async (req: Request, res: Response) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: parsed.error.flatten()
    });
  }
  const { name, email, password } = parsed.data;

  try {
    const userExists = await userModel.findUnique({
      where: { email: email },
    });

    if (userExists) {
      return res
        .status(400)
        .json({ message: "User with this email already exists." });
    }

    const hashedPassword = await hashPassword(password);

    const newUser = await userModel.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    const token = generateToken(newUser);

    console.log(`User registered: ${JSON.stringify(newUser)}`);
    res.status(201).json({
      message: "User registered successfully.",
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
      },
      token: token,
    });
  } catch (error: any) {
    console.error("Error registering user:", error.message);

    if (
      error instanceof PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return res
        .status(400)
        .json({ message: "A user with this email already exists." });
    }
    res.status(500).json({ message: "Server error during registration." });
  }
};

export const loginUser = async (req: Request, res: Response) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: parsed.error.flatten()
    });
  }
  const { email, password } = parsed.data;

  try {
    const user = await userModel.findUnique({
      where: { email: email },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid password." });
    }

    const token = generateToken(user);

    console.log(`User logged in: ${JSON.stringify(user)}`);
    res.status(200).json({
      message: "User logged in successfully.",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      token: token,
    });
  } catch (error: any) {
    console.error("Error logging in user:", error.message);
    res.status(500).json({ message: "Server error during login." });
  }
};

export const validateToken = async (req: Request, res: Response) => {
  let token: string | undefined;

  // Extract token from Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ message: 'Authentication token missing.' });
  }

  try {
    const decoded = verifyToken(token);

    if (!decoded || !decoded.id) {
      return res.status(403).json({ message: 'Invalid or expired token.' });
    }

    // Optionally, check if the user still exists in the DB
    const user = await userModel.findUnique({
      where: { id: decoded.id },
      select: { id: true } // Only fetch ID to keep it lightweight
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found for this token.' });
    }

    // If valid, set the X-User-Id header for Nginx to capture
    res.set('X-User-Id', user.id);
    // Return 200 OK with minimal body, Nginx only cares about the status and headers
    res.status(200).json({ message: 'Token is valid.' });

  } catch (error: any) {
    console.error('Token validation failed:', error.message);
    return res.status(403).json({ message: 'Invalid or expired token.' });
  }
};

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await userModel.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    res.status(200).json(users);
  } catch (error: any) {
    console.error("Error fetching all users:", error.message);
    res.status(500).json({ message: "Server error fetching users." });
  }
};

export const getUserById = async (req: Request, res: Response) => {
  try {
    const params = idParamSchema.safeParse(req.params);
    if (!params.success) {
      return res.status(400).json({ message: 'Invalid user id' });
    }
    const userId = params.data.id;
    const user = await userModel.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }
    res.status(200).json(user);
  } catch (error: any) {
    console.error("Error fetching user by ID:", error.message);
    res.status(500).json({ message: "Server error fetching user." });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  try {
    const params = idParamSchema.safeParse(req.params);
    if (!params.success) {
      return res.status(400).json({ message: 'Invalid user id' });
    }
    const userIdToUpdate = params.data.id;
    const body = updateSchema.safeParse(req.body);
    if (!body.success) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: body.error.flatten()
      });
    }
    const { name, email, password } = body.data;

    if (!req.user || req.user.id !== userIdToUpdate) {
      return res
        .status(403)
        .json({ message: "Forbidden: You can only update your own profile." });
    }

    if (email) {
      const userExists = await userModel.findUnique({
        where: { email: email },
      });
      if (userExists && userExists.id !== userIdToUpdate) {
        return res
          .status(400)
          .json({ message: "User with this email already exists." });
      }
    }

    const updateData: { name?: string; email?: string; password?: string } = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (password) {
      const hashedPassword = await hashPassword(password);
      updateData.password = hashedPassword;
    }

    if (Object.keys(updateData).length === 0) {
      return res
        .status(400)
        .json({ message: "No valid fields provided for update." });
    }

    const updatedUser = await userModel.update({
      where: { id: userIdToUpdate },
      data: updateData,
    });

    // Exclude password before returning
    const { password: _, ...safeUser } = updatedUser;

    console.log(`User updated: ${JSON.stringify(safeUser)}`);
    res.status(200).json(safeUser);
  } catch (error: any) {
    console.error("Error updating user:", error.message);

    if (error.code === "P2025") {
      return res.status(404).json({ message: "User not found." });
    }
    if (error.code === "P2002" && error.meta?.target?.includes("email")) {
      return res
        .status(400)
        .json({ message: "Email already in use by another user." });
    }

    res.status(500).json({ message: "Server error updating user." });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const params = idParamSchema.safeParse(req.params);
    if (!params.success) {
      return res.status(400).json({ message: 'Invalid user id' });
    }
    const userIdToDelete = params.data.id;

    if (!req.user || req.user.id !== userIdToDelete) {
      return res
        .status(403)
        .json({ message: "Forbidden: You can only delete your own profile." });
    }

    await userModel.delete({
      where: { id: userIdToDelete },
    });

    console.log(`User deleted: ID ${userIdToDelete}`);
    res.status(204).json({ message: "User deleted successfully." });
  } catch (error: any) {
    console.error("Error deleting user:", error.message);
    if (
      error instanceof PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return res.status(404).json({ message: "User not found." });
    }
    res.status(500).json({ message: "Server error deleting user." });
  }
};
