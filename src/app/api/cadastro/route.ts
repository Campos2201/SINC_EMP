import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
// import bcrypt from "bcryptjs"; // manter comentado por enquanto

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV === "development") {
  globalForPrisma.prisma = prisma;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { isLogin, name, email, password, role } = body || {};

    if (!email || !password) {
      return NextResponse.json({ message: "email e senha são obrigatórios" }, { status: 400 });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const jwtSecret = process.env.JWT_SECRET;

    if (isLogin) {
      const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
      if (!user) return NextResponse.json({ message: "Usuário não encontrado" }, { status: 401 });

      const match = user.senha === password; // ainda em texto plano (só dev)
      if (!match) return NextResponse.json({ message: "Senha incorreta" }, { status: 401 });

      if (!jwtSecret) {
        return NextResponse.json({ message: "JWT_SECRET não está configurado" }, { status: 500 });
      }

      // gera token JWT
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        jwtSecret,
        { expiresIn: "2h" }
      );

      // cria cookie com o token
      const response = NextResponse.json({
        message: "Login OK",
        userId: user.id,
        userRole: user.role,
      });

      response.cookies.set("auth_token", token, {
        httpOnly: true,
        sameSite: "strict",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        maxAge: 2 * 60 * 60, // 2h
      });

      return response;
    }


    // cadastro
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return NextResponse.json({ message: "E-mail inválido" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) return NextResponse.json({ message: "E-mail já cadastrado" }, { status: 409 });

    const user = await prisma.user.create({
      data: {
        name: String(name ?? ""),
        email: normalizedEmail,
        senha: String(password), // texto plano só em dev
        role: String(role ?? "admin"),
      },
      select: { id: true },
    });

    return NextResponse.json({ message: "Usuário criado", userId: user.id }, { status: 201 });
  } catch (err: any) {
    console.error("API /api/cadastro error:", err);
    return NextResponse.json({ message: err?.message || "Erro no servidor" }, { status: 500 });
  }
}