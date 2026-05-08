import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

async function getPrisma() {
  const mod = await import("../../../generated/prisma");
  const { PrismaClient } = mod as { PrismaClient: any };
  const g = globalThis as unknown as { prisma?: InstanceType<typeof PrismaClient> };
  g.prisma = g.prisma || new PrismaClient();
  return g.prisma;
}

function parseLocalDate(iso?: string | null): Date | null {
  if (!iso) return null;
  const parts = iso.split('-').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return null;
  const [y, m, d] = parts;
  return new Date(y, m - 1, d); // cria no fuso local
}

export async function GET() {
  try {
    const prisma = await getPrisma();
    // Retorna todos os lotes (incluindo vendidos) para consulta de datas
    const lotes = await prisma.lote.findMany({
      orderBy: { id: "desc" },
      include: { bois: true },
    });

    // retorna dados — cálculo de nextReforco é feito no frontend
    return NextResponse.json(lotes);
  } catch (err: any) {
    console.error("API /api/lotes GET error:", err);
    return NextResponse.json({ message: err?.message || "Erro no servidor" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const prisma = await getPrisma();
    const body = await req.json();
    const { codigo, chegada, custo, vacinado, data_vacinacao, gasto_alimentacao } = body || {};

    if (!codigo || !chegada || custo == null) {
      return NextResponse.json({ message: "codigo, chegada e custo são obrigatórios" }, { status: 400 });
    }

    const chegadaDate = parseLocalDate(chegada);
    const dataVacinDate = parseLocalDate(data_vacinacao);

    // Validar que as datas não sejam futuras
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    if (chegadaDate) {
      const chegadaCheck = new Date(chegadaDate);
      chegadaCheck.setHours(0, 0, 0, 0);
      if (chegadaCheck > hoje) {
        return NextResponse.json({ message: "A data de chegada não pode ser futura" }, { status: 400 });
      }
    }
    
    if (vacinado && dataVacinDate) {
      const vacinacaoCheck = new Date(dataVacinDate);
      vacinacaoCheck.setHours(0, 0, 0, 0);
      if (vacinacaoCheck > hoje) {
        return NextResponse.json({ message: "A data de vacinação não pode ser futura" }, { status: 400 });
      }
    }

    const created = await prisma.lote.create({
      data: {
        codigo,
        chegada: chegadaDate,
        custo: Number(custo),
        gasto_alimentacao: gasto_alimentacao == null ? 0 : Number(gasto_alimentacao),
        vacinado: !!vacinado,
        data_vacinacao: vacinado ? dataVacinDate : null,
      },
      include: { bois: true },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (err: any) {
    console.error("API /api/lotes POST error:", err);
    return NextResponse.json({ message: err?.message || "Erro no servidor" }, { status: 500 });
  }
}
