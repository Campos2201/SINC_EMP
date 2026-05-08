import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

async function getPrisma() {
  const mod = await import("../../../../generated/prisma");
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
  return new Date(y, m - 1, d);
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> } // <-- mudado para Promise
) {
  try {
    const { id } = await params; // <-- await aqui
    const prisma = await getPrisma();
    const loteId = parseInt(id);

    if (isNaN(loteId)) {
      return NextResponse.json({ message: "ID do lote inválido" }, { status: 400 });
    }

    const lote = await prisma.lote.findUnique({
      where: { id: loteId },
      include: {
        bois: {
          orderBy: {
            id: 'asc'
          }
        },
        _count: {
          select: {
            bois: true
          }
        }
      }
    });

    if (!lote) {
      return NextResponse.json({ message: "Lote não encontrado" }, { status: 404 });
    }

    const pesoTotal = lote.bois.reduce((acc: number, boi: { peso: number }) => acc + boi.peso, 0);
    const pesoMedio = lote.bois.length > 0 ? pesoTotal / lote.bois.length : 0;
    
    const loteComEstatisticas = {
      id: lote.id,
      codigo: lote.codigo,
      chegada: lote.chegada,
      custo: lote.custo,
      data_venda: (lote as any).data_venda,
      vacinado: lote.vacinado,
      data_vacinacao: lote.data_vacinacao,
      gasto_alimentacao: (lote as any).gasto_alimentacao ?? null,
      quantidadeBois: lote._count?.bois ?? lote.bois.length,
      pesoMedio: pesoMedio,
      pesoTotal: pesoTotal,
      bois: lote.bois.map((boi: { id: number; peso: number; status: string; alerta: string | null; anotacoes: string | null }) => ({
        id: boi.id,
        peso: boi.peso,
        status: boi.status,
        alerta: boi.alerta,
        anotacoes: boi.anotacoes
      }))
    };

    return NextResponse.json(loteComEstatisticas, { status: 200 });
  } catch (err: any) {
    console.error("API /api/lotes/[id] GET error:", err);
    return NextResponse.json({ message: err?.message || "Erro no servidor" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> } // <-- mudado para Promise
) {
  try {
    const { id } = await params; // <-- await aqui
    const prisma = await getPrisma();
    const loteId = parseInt(id);

    if (isNaN(loteId)) {
      return NextResponse.json({ message: "ID do lote inválido" }, { status: 400 });
    }

    const body = await req.json();
    const { codigo, chegada, custo, vacinado, data_vacinacao, gasto_alimentacao } = body || {};

    // Validar que as datas não sejam futuras
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    if (typeof chegada !== 'undefined' && chegada) {
      const chegadaDate = parseLocalDate(chegada);
      if (chegadaDate) {
        const chegadaCheck = new Date(chegadaDate);
        chegadaCheck.setHours(0, 0, 0, 0);
        if (chegadaCheck > hoje) {
          return NextResponse.json({ message: "A data de chegada não pode ser futura" }, { status: 400 });
        }
      }
    }
    
    if (typeof data_vacinacao !== 'undefined' && data_vacinacao) {
      const vacinacaoDate = parseLocalDate(data_vacinacao);
      if (vacinacaoDate) {
        const vacinacaoCheck = new Date(vacinacaoDate);
        vacinacaoCheck.setHours(0, 0, 0, 0);
        if (vacinacaoCheck > hoje) {
          return NextResponse.json({ message: "A data de vacinação não pode ser futura" }, { status: 400 });
        }
      }
    }

    const data: any = {};
    if (typeof codigo !== 'undefined') data.codigo = codigo;
    if (typeof chegada !== 'undefined') data.chegada = chegada ? parseLocalDate(chegada) : null;
    if (typeof custo !== 'undefined') data.custo = custo === null ? null : parseFloat(custo);
    if (typeof vacinado !== 'undefined') data.vacinado = Boolean(vacinado);
    if (typeof data_vacinacao !== 'undefined') data.data_vacinacao = data_vacinacao ? parseLocalDate(data_vacinacao) : null;
    if (typeof gasto_alimentacao !== 'undefined') data.gasto_alimentacao = gasto_alimentacao === null ? 0 : Number(gasto_alimentacao);

    const updated = await prisma.lote.update({
      where: { id: loteId },
      data,
      include: { bois: true }
    });

    return NextResponse.json({ message: 'Lote atualizado com sucesso', lote: updated }, { status: 200 });
  } catch (err: any) {
    console.error("API /api/lotes/[id] PUT error:", err);
    return NextResponse.json({ message: err?.message || "Erro no servidor" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> } // <-- mudado para Promise
) {
  try {
    const { id } = await params; // <-- await aqui
    const prisma = await getPrisma();
    const loteId = parseInt(id);

    if (isNaN(loteId)) {
      return NextResponse.json({ message: "ID do lote inválido" }, { status: 400 });
    }

    await prisma.lote.delete({ where: { id: loteId } });
    return NextResponse.json({ message: "Deletado" });
  } catch (err: any) {
    console.error("API /api/lotes/[id] DELETE error:", err);
    return NextResponse.json({ message: err?.message || "Erro no servidor" }, { status: 500 });
  }
}