import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // importa o Prisma Client dinamicamente
    const mod = await import("../../../../../generated/prisma");
    const { PrismaClient } = mod as { PrismaClient: any };

    // singleton para hot-reload em dev
    const g = globalThis as unknown as { prisma?: InstanceType<typeof PrismaClient> };
    g.prisma = g.prisma || new PrismaClient();
    const prisma = g.prisma;

    const { id } = await params;
    const loteId = parseInt(id);

    if (isNaN(loteId)) {
      return NextResponse.json({ message: "ID do lote inválido" }, { status: 400 });
    }

    const body = await req.json();
    const { bois } = body || {};

    if (!bois || !Array.isArray(bois) || bois.length === 0) {
      return NextResponse.json({ message: "Lista de bois é obrigatória" }, { status: 400 });
    }

    // Verificar se o lote existe
    const lote = await prisma.lote.findUnique({
      where: { id: loteId }
    });

    if (!lote) {
      return NextResponse.json({ message: "Lote não encontrado" }, { status: 404 });
    }

    // Validar dados dos bois
    for (const boi of bois) {
      if (!boi.peso || isNaN(parseFloat(boi.peso)) || parseFloat(boi.peso) <= 0) {
        return NextResponse.json({ message: "Peso do boi deve ser um número positivo" }, { status: 400 });
      }
    }

    // Criar os bois no banco de dados
    const boisCriados = await Promise.all(
      bois.map(boi => 
        prisma.boi.create({
          data: {
            peso: parseFloat(boi.peso),
            status: boi.status || 'Ativo',
            alerta: boi.alerta || null,
            loteId: loteId
          }
        })
      )
    );

    // Criar histórico de peso inicial para cada boi
    await Promise.all(
      boisCriados.map(boi =>
        prisma.pesoHistorico.create({
          data: {
            peso: boi.peso,
            dataPesagem: new Date(),
            boiId: boi.id,
            loteId: loteId
          }
        })
      )
    );

    return NextResponse.json({ 
      message: `${boisCriados.length} bois adicionados com sucesso ao lote`,
      bois: boisCriados.map(boi => ({
        id: boi.id,
        peso: boi.peso,
        status: boi.status,
        alerta: boi.alerta
      }))
    }, { status: 201 });
  } catch (err: any) {
    console.error("API /api/lotes/[id]/bois POST error:", err);
    return NextResponse.json({ message: err?.message || "Erro no servidor" }, { status: 500 });
  }
}
