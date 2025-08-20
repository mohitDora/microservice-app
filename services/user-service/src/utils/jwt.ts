import jwt from "jsonwebtoken";

const jwtSecret: string = process.env.JWT_SECRET || "fallback_secret_if_not_set";

type JwtUser = { id: string };

export const generateToken = (user: JwtUser): string => {
  return jwt.sign({ id: user.id }, jwtSecret, { expiresIn: "1h" });
};

export const verifyToken = (token: string): jwt.JwtPayload | null => {
  try {
    const decoded = jwt.verify(token, jwtSecret) as jwt.JwtPayload;
    return decoded;
  } catch (error: any) {
    console.error("JWT verification failed:", error.message);
    return null;
  }
};
