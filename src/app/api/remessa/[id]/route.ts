import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { PrismaClient, Prisma, RemessaStatus } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV === "development") {
  globalForPrisma.prisma = prisma;
}

async function getUserIdFromToken(req: NextRequest): Promise<number | null> {
  try {
    const token = req.cookies.get("auth_token")?.value;
    const secretValue = process.env.JWT_SECRET;
    if (!token || !secretValue) return null;

    const secret = new TextEncoder().encode(secretValue);
    const { payload } = await jwtVerify(token, secret);
    return payload.id as number;
  } catch {
    return null;
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = await getUserIdFromToken(req);
    if (!userId) {
      return NextResponse.json({ message: "Não autenticado" }, { status: 401 });
    }

    const remessaId = Number(params.id);
    if (!remessaId) {
      return NextResponse.json({ message: "ID da remessa inválido" }, { status: 400 });
    }

    const remessa = await prisma.remessa.findFirst({
      where: {
        id: remessaId,
        userId,
      },
    });

    if (!remessa) {
      return NextResponse.json({ message: "Remessa não encontrada" }, { status: 404 });
    }

    if (remessa.status === RemessaStatus.FECHADO) {
      return NextResponse.json({ message: "Remessa já está fechada" }, { status: 400 });
    }

    const updatedRemessa = await prisma.remessa.update({
      where: { id: remessaId },
      data: {
        status: RemessaStatus.FECHADO,
        unicoAberto: null,
      },
    });

    return NextResponse.json(updatedRemessa, { status: 200 });
  } catch (err: any) {
    console.error("API /api/remessa/[id] PUT error:", err);
    return NextResponse.json({ message: err?.message || "Erro ao fechar remessa" }, { status: 500 });
  }
}
