import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    // Singleton global para hot-reload em dev
    const g = globalThis as unknown as { prisma: any };
    if (!g.prisma) {
      const mod = await import("../../../../generated/prisma");
      const { PrismaClient } = mod as { PrismaClient: any };
      g.prisma = new PrismaClient();
    }
    const prisma = g.prisma;

    // Buscar todos os bois
    const bois = await prisma.boi.findMany({
      select: { id: true }
    });

    const resultados = [];

    for (const boi of bois) {
      // Buscar a pesagem mais recente deste boi
      const pesagemMaisRecente = await prisma.pesoHistorico.findFirst({
        where: { boiId: boi.id },
        orderBy: { dataPesagem: 'desc' }
      });

      if (pesagemMaisRecente) {
        // Atualizar o peso do boi
        await prisma.boi.update({
          where: { id: boi.id },
          data: { peso: pesagemMaisRecente.peso }
        });

        resultados.push({
          boiId: boi.id,
          pesoAtualizado: pesagemMaisRecente.peso,
          dataPesagem: pesagemMaisRecente.dataPesagem
        });
      }
    }

    return NextResponse.json({ 
      message: "Pesos recalculados com sucesso",
      resultados 
    }, { status: 200 });
  } catch (err: any) {
    console.error("Erro ao recalcular pesos:", err);
    return NextResponse.json({ message: err?.message || "Erro no servidor" }, { status: 500 });
  }
}