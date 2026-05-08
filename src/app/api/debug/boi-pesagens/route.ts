import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    // Singleton global para hot-reload em dev
    const g = globalThis as unknown as { prisma: any };
    if (!g.prisma) {
      const mod = await import("../../../../generated/prisma");
      const { PrismaClient } = mod as { PrismaClient: any };
      g.prisma = new PrismaClient();
    }
    const prisma = g.prisma;

    // Buscar um boi e suas pesagens para debug
    const boi = await prisma.boi.findFirst({
      include: {
        PesoHistorico: {
          orderBy: { dataPesagem: 'desc' }
        }
      }
    });

    if (!boi) {
      return NextResponse.json({ message: "Nenhum boi encontrado" }, { status: 404 });
    }

    const pesagens = boi.PesoHistorico.map((p: any) => ({
      id: p.id,
      peso: p.peso,
      dataPesagem: p.dataPesagem,
      timestamp: new Date(p.dataPesagem).getTime()
    }));

    return NextResponse.json({ 
      boi: {
        id: boi.id,
        pesoAtual: boi.peso
      },
      pesagens,
      pesagemMaisRecente: pesagens[0] || null
    }, { status: 200 });
  } catch (err: any) {
    console.error("Erro ao buscar dados de debug:", err);
    return NextResponse.json({ message: err?.message || "Erro no servidor" }, { status: 500 });
  }
}