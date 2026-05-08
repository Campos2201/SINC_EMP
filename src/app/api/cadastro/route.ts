import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import jwt from "jsonwebtoken";
// import bcrypt from "bcryptjs"; // manter comentado por enquanto

export async function POST(req: NextRequest) {
  try {
    // importa o Prisma Client dinamicamente (evita erro "@prisma/client did not initialize yet")
    const mod = await import("../../../generated/prisma");
    const { PrismaClient } = mod as { PrismaClient: any };

    // singleton para hot-reload em dev
    const g = globalThis as unknown as { prisma?: InstanceType<typeof PrismaClient> };
    g.prisma = g.prisma || new PrismaClient();
    const prisma = g.prisma;

    const body = await req.json();
    const { isLogin, name, email, password, role } = body || {};

    if (!email || !password) {
      return NextResponse.json({ message: "email e senha são obrigatórios" }, { status: 400 });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    if (isLogin) {
      const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
      if (!user) return NextResponse.json({ message: "Usuário não encontrado" }, { status: 401 });

      const match = user.senha === password; // ainda em texto plano (só dev)
      if (!match) return NextResponse.json({ message: "Senha incorreta" }, { status: 401 });

      // gera token JWT
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET!,
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
        name: name,
        email: normalizedEmail,
        senha: password, // texto plano só em dev
        role: role,
      },
      select: { id: true },
    });

    return NextResponse.json({ message: "Usuário criado", userId: user.id }, { status: 201 });
  } catch (err: any) {
    console.error("API /api/cadastro error:", err);
    return NextResponse.json({ message: err?.message || "Erro no servidor" }, { status: 500 });
  }
}