import type { Application, Request, Response, NextFunction } from "express";
import express from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import userRoutes from "./routes/userRoutes.js";
import cors from "cors";

dotenv.config();

const prisma = new PrismaClient();

const app: Application = express();
const PORT: number = parseInt(process.env.PORT || "3000", 10);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(
  cors({
    origin: "http://localhost:4000",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use("/api/users", userRoutes);

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

app.listen(PORT, () => {
  console.log(`User Service running on port ${PORT}`);
});

process.on("beforeExit", async () => {
  await prisma.$disconnect();
});
