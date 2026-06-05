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

// PUT - Marcar notificação como lida
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const prisma = await getPrisma();
    const userId = await getUserIdFromToken(req);
    
    if (!userId) {
      return NextResponse.json({ message: "Não autenticado" }, { status: 401 });
    }

    const { id } = await params;
    const notificacaoId = parseInt(id);

    if (isNaN(notificacaoId)) {
      return NextResponse.json({ message: "ID inválido" }, { status: 400 });
    }

    // Verificar se a notificação pertence ao usuário
    const notificacao = await prisma.notificacao.findUnique({
      where: { id: notificacaoId }
    });

    if (!notificacao) {
      return NextResponse.json({ message: "Notificação não encontrada" }, { status: 404 });
    }

    if (notificacao.destinatarioId !== userId) {
      return NextResponse.json({ message: "Não autorizado" }, { status: 403 });
    }

    const atualizada = await prisma.notificacao.update({
      where: { id: notificacaoId },
      data: { lida: true },
      include: {
        remetente: {
          select: {
            id: true,
            name: true,
            role: true
          }
        },
        lote: {
          select: {
            id: true,
            codigo: true
          }
        },
        boi: {
          select: {
            id: true
          }
        }
      }
    });

    // Retornar também o contador atualizado de não lidas
    const naoLidas = await prisma.notificacao.count({
      where: {
        destinatarioId: userId,
        lida: false
      }
    });

    return NextResponse.json({ notificacao: atualizada, naoLidas }, { status: 200 });
  } catch (err: any) {
    console.error("API /api/notificacoes/[id] PUT error:", err);
    return NextResponse.json({ message: err?.message || "Erro no servidor" }, { status: 500 });
  }
}

// DELETE - Deletar notificação
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const prisma = await getPrisma();
    const userId = await getUserIdFromToken(req);
    
    if (!userId) {
      return NextResponse.json({ message: "Não autenticado" }, { status: 401 });
    }

    const { id } = await params;
    const notificacaoId = parseInt(id);

    if (isNaN(notificacaoId)) {
      return NextResponse.json({ message: "ID inválido" }, { status: 400 });
    }

    // Verificar se a notificação pertence ao usuário
    const notificacao = await prisma.notificacao.findUnique({
      where: { id: notificacaoId }
    });

    if (!notificacao) {
      return NextResponse.json({ message: "Notificação não encontrada" }, { status: 404 });
    }

    if (notificacao.destinatarioId !== userId) {
      return NextResponse.json({ message: "Não autorizado" }, { status: 403 });
    }

    await prisma.notificacao.delete({
      where: { id: notificacaoId }
    });

    return NextResponse.json({ message: "Notificação deletada" }, { status: 200 });
  } catch (err: any) {
    console.error("API /api/notificacoes/[id] DELETE error:", err);
    return NextResponse.json({ message: err?.message || "Erro no servidor" }, { status: 500 });
  }
}

