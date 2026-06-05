import jwt from "jsonwebtoken";

const secret = process.env.JWT_SECRET as string;

export function generateToken(payload: object) {
  return jwt.sign(payload, secret, { expiresIn: "1h" }); // token válido por 1 hora
}

export function verifyToken(token: string) {
  try {
    return jwt.verify(token, secret);
  } catch {
    return null;
  }
}
