import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { PrismaClient, Prisma, RemessaStatus, Tipo } from "@prisma/client";

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

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getUserIdFromToken(req);
    if (!userId) {
      return NextResponse.json({ message: "Não autenticado" }, { status: 401 });
    }

    const { id } = await context.params;
    const remessaId = Number(id);
    if (!remessaId) {
      return NextResponse.json({ message: "ID da remessa inválido" }, { status: 400 });
    }

    const body = await req.json();
    const tipo = String(body.tipo || "ENTRADA") as Tipo;
    const descricao = String(body.descricao || "").trim();
    const valor = Number(body.valor);

    if (!['ENTRADA', 'SAIDA'].includes(tipo)) {
      return NextResponse.json({ message: "Tipo inválido" }, { status: 400 });
    }

    if (!descricao) {
      return NextResponse.json({ message: "Descrição/Referente é obrigatório" }, { status: 400 });
    }

    if (!valor || isNaN(valor) || valor <= 0) {
      return NextResponse.json({ message: "Valor inválido" }, { status: 400 });
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
      return NextResponse.json({ message: "Não é possível adicionar movimentação a uma remessa fechada" }, { status: 400 });
    }

    const movimentacao = await prisma.movimentacao.create({
      data: {
        descricao,
        tipo,
        valor,
        remessaId,
      },
    });

    return NextResponse.json(movimentacao, { status: 201 });
  } catch (err: any) {
    console.error("API /api/remessa/[id]/movimentacao POST error:", err);
    return NextResponse.json({ message: err?.message || "Erro ao criar movimentação" }, { status: 500 });
  }
}
