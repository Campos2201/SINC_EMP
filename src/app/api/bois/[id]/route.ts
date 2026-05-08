import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

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

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const mod = await import("../../../../generated/prisma");
    const { PrismaClient } = mod as { PrismaClient: any };

    const g = globalThis as unknown as { prisma?: InstanceType<typeof PrismaClient> };
    g.prisma = g.prisma || new PrismaClient();
    const prisma = g.prisma;

    const _params = await params;
    const boiId = parseInt(_params.id);
    if (isNaN(boiId)) {
      return NextResponse.json({ message: "ID do boi inválido" }, { status: 400 });
    }

    const body = await req.json();
    const { peso, status, alerta, anotacoes } = body || {};

    // Buscar o boi atual para comparar
    const boiAtual = await prisma.boi.findUnique({
      where: { id: boiId },
      include: { Lote: true }
    });

    if (!boiAtual) {
      return NextResponse.json({ message: "Boi não encontrado" }, { status: 404 });
    }

    const data: any = {};
    if (typeof peso !== 'undefined') data.peso = parseFloat(peso);
    if (typeof status !== 'undefined') data.status = status;
    if (typeof alerta !== 'undefined') data.alerta = alerta ?? null;
    if (typeof anotacoes !== 'undefined') data.anotacoes = anotacoes ?? null;

    const updated = await prisma.boi.update({
      where: { id: boiId },
      data,
      include: { Lote: true }
    });

    // Se um peão criou/atualizou um alerta ou anotação, enviar notificação para todos os admins
    const userId = await getUserIdFromToken(req);
    if (userId) {
      const usuario = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true }
      });

      // Verificar se é um peão e se criou/atualizou alerta ou anotação
      const tinhaAlerta = boiAtual.alerta;
      const tinhaAnotacao = boiAtual.anotacoes;
      const temAlertaAgora = updated.alerta;
      const temAnotacaoAgora = updated.anotacoes;

      if (usuario?.role === 'peao' && (temAlertaAgora || temAnotacaoAgora) && (!tinhaAlerta && !tinhaAnotacao)) {
        // Buscar informações completas do usuário
        const usuarioCompleto = await prisma.user.findUnique({
          where: { id: userId },
          select: { name: true }
        });

        // Buscar todos os administradores
        const admins = await prisma.user.findMany({
          where: { role: 'admin' },
          select: { id: true }
        });

        // Enviar notificação para cada admin
        for (const admin of admins) {
          await prisma.notificacao.create({
            data: {
              titulo: `Alerta em Animal - Lote ${updated.Lote.codigo}`,
              mensagem: `O peão ${usuarioCompleto?.name || 'um peão'} criou um alerta/anotação no Boi #${boiId} do Lote ${updated.Lote.codigo}. ${temAlertaAgora ? `Alerta: ${temAlertaAgora}` : ''} ${temAnotacaoAgora ? `Anotação: ${temAnotacaoAgora.substring(0, 100)}${temAnotacaoAgora.length > 100 ? '...' : ''}` : ''}`,
              tipo: 'alerta_animal',
              remetenteId: userId,
              destinatarioId: admin.id,
              loteId: updated.Lote.id,
              boiId: boiId
            }
          });
        }
      }
    }

    // Se peso foi atualizado, sincroniza a última entrada de histórico de peso
    if (Object.prototype.hasOwnProperty.call(data, 'peso')) {
      const latest = await prisma.pesoHistorico.findFirst({
        where: { boiId },
        orderBy: { dataPesagem: 'desc' }
      });

      if (latest) {
        await prisma.pesoHistorico.update({
          where: { id: latest.id },
          data: {
            peso: updated.peso
          }
        });
      } else {
        // Caso não exista histórico (edge case), cria um
        await prisma.pesoHistorico.create({
          data: {
            peso: updated.peso,
            dataPesagem: new Date(),
            boiId: updated.id,
            loteId: (updated as any).loteId
          }
        });
      }
    }

    return NextResponse.json({ message: 'Boi atualizado com sucesso', boi: updated }, { status: 200 });
  } catch (err: any) {
    console.error("API /api/bois/[id] PUT error:", err);
    return NextResponse.json({ message: err?.message || "Erro no servidor" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const mod = await import("../../../../generated/prisma");
    const { PrismaClient } = mod as { PrismaClient: any };

    const g = globalThis as unknown as { prisma?: InstanceType<typeof PrismaClient> };
    g.prisma = g.prisma || new PrismaClient();
    const prisma = g.prisma;

    const _params = await params;
    const boiId = parseInt(_params.id);
    if (isNaN(boiId)) {
      return NextResponse.json({ message: "ID do boi inválido" }, { status: 400 });
    }

    // Buscar o boi para obter loteId (usado para mensagem)
    const boi = await prisma.boi.findUnique({
      where: { id: boiId }
    });

    if (!boi) {
      return NextResponse.json({ message: "Boi não encontrado" }, { status: 404 });
    }

    // Deletar todas as pesagens (histórico de peso) deste boi
    await prisma.pesoHistorico.deleteMany({
      where: { boiId: boiId }
    });

    // Deletar o boi
    const deleted = await prisma.boi.delete({
      where: { id: boiId }
    });

    return NextResponse.json(
      { message: 'Boi removido com sucesso', boiId: deleted.id },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("API /api/bois/[id] DELETE error:", err);
    return NextResponse.json({ message: err?.message || "Erro no servidor" }, { status: 500 });
  }
}


