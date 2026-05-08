import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

async function getPrisma() {
  const mod = await import("../../../../generated/prisma");
  const { PrismaClient } = mod as { PrismaClient: any };
  const g = globalThis as unknown as { prisma?: InstanceType<typeof PrismaClient> };
  g.prisma = g.prisma || new PrismaClient();
  return g.prisma;
}

async function getUserIdFromToken(req: NextRequest): Promise<number | null> {
  try {
    const token = req.cookies.get("auth_token")?.value;
    if (!token) return null;
    
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    return payload.id as number;
  } catch {
    return null;
  }
}

// GET - Obter informações do usuário atual
export async function GET(req: NextRequest) {
  try {
    const prisma = await getPrisma();
    const userId = await getUserIdFromToken(req);
    
    if (!userId) {
      return NextResponse.json({ message: "Não autenticado" }, { status: 401 });
    }

    const usuario = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    });

    if (!usuario) {
      return NextResponse.json({ message: "Usuário não encontrado" }, { status: 404 });
    }

    return NextResponse.json(usuario, { status: 200 });
  } catch (err: any) {
    console.error("API /api/usuario/atual GET error:", err);
    return NextResponse.json({ message: err?.message || "Erro no servidor" }, { status: 500 });
  }
}

