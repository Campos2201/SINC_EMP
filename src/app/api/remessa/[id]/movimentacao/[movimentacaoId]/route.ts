import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { PrismaClient, Tipo } from "@prisma/client";

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

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string; movimentacaoId: string }> }
) {
  try {
    const userId = await getUserIdFromToken(req);
    if (!userId) {
      return NextResponse.json({ message: "Não autenticado" }, { status: 401 });
    }

    const { id, movimentacaoId } = await context.params;
    const remessaId = Number(id);
    const movimentacaoDbId = Number(movimentacaoId);

    if (!remessaId || !movimentacaoDbId) {
      return NextResponse.json({ message: "ID inválido" }, { status: 400 });
    }

    const body = await req.json();
    const tipo = String(body.tipo || "ENTRADA") as Tipo;
    const descricao = String(body.descricao || "").trim();
    const valor = Number(body.valor);

    if (!['ENTRADA', 'SAIDA'].includes(tipo)) {
      return NextResponse.json({ message: "Tipo inválido" }, { status: 400 });
    }

    if (!descricao) {
      return NextResponse.json({ message: "Descrição é obrigatória" }, { status: 400 });
    }

    if (isNaN(valor) || valor <= 0) {
      return NextResponse.json({ message: "Valor inválido" }, { status: 400 });
    }

    const movimentacao = await prisma.movimentacao.findFirst({
      where: {
        id: movimentacaoDbId,
        remessaId,
        remessa: {
          userId,
        },
      },
    });

    if (!movimentacao) {
      return NextResponse.json({ message: "Movimentação não encontrada" }, { status: 404 });
    }

    const updatedMovimentacao = await prisma.movimentacao.update({
      where: { id: movimentacaoDbId },
      data: {
        tipo,
        descricao,
        valor,
      },
    });

    return NextResponse.json(updatedMovimentacao, { status: 200 });
  } catch (err: any) {
    console.error("API /api/remessa/[id]/movimentacao/[movimentacaoId] PUT error:", err);
    return NextResponse.json({ message: err?.message || "Erro ao atualizar movimentação" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string; movimentacaoId: string }> }
) {
  try {
    const userId = await getUserIdFromToken(req);
    if (!userId) {
      return NextResponse.json({ message: "Não autenticado" }, { status: 401 });
    }

    const { id, movimentacaoId } = await context.params;
    const remessaId = Number(id);
    const movimentacaoDbId = Number(movimentacaoId);

    if (!remessaId || !movimentacaoDbId) {
      return NextResponse.json({ message: "ID inválido" }, { status: 400 });
    }

    const movimentacao = await prisma.movimentacao.findFirst({
      where: {
        id: movimentacaoDbId,
        remessaId,
      },
      include: {
        remessa: true,
      },
    });

    if (!movimentacao) {
      return NextResponse.json({ message: "Movimentação não encontrada" }, { status: 404 });
    }

    if (movimentacao.remessa.status === 'FECHADO') {
      return NextResponse.json({ message: "Não é possível excluir movimentações de remessas fechadas" }, { status: 403 });
    }

    await prisma.movimentacao.delete({
      where: { id: movimentacaoDbId },
    });

    return NextResponse.json({ message: "Movimentação excluída com sucesso" }, { status: 200 });
  } catch (err: any) {
    console.error("API /api/remessa/[id]/movimentacao/[movimentacaoId] DELETE error:", err);
    return NextResponse.json({ message: err?.message || "Erro ao excluir movimentação" }, { status: 500 });
  }
}
