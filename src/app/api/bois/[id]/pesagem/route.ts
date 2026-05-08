import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function parseLocalDate(iso?: string | null): Date | null {
  if (!iso) return null;
  const parts = iso.split('-').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return null;
  const [y, m, d] = parts;
  return new Date(y, m - 1, d);
}

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
    const boiId = parseInt(id);

    if (isNaN(boiId)) {
      return NextResponse.json({ message: "ID do boi inválido" }, { status: 400 });
    }

    const body = await req.json();
    const { peso, dataPesagem } = body || {};

    if (!peso || isNaN(parseFloat(peso)) || parseFloat(peso) <= 0) {
      return NextResponse.json({ message: "Peso deve ser um número positivo" }, { status: 400 });
    }

    // Validar data de pesagem (não pode ser futura)
    let dataPesagemDate: Date;
    if (dataPesagem) {
      const parsedDate = parseLocalDate(dataPesagem);
      if (!parsedDate) {
        return NextResponse.json({ message: "Data de pesagem inválida" }, { status: 400 });
      }
      dataPesagemDate = parsedDate;
      
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      dataPesagemDate.setHours(0, 0, 0, 0);
      
      if (dataPesagemDate > hoje) {
        return NextResponse.json({ message: "A data de pesagem não pode ser futura" }, { status: 400 });
      }
      
      // Garantir que a data seja salva corretamente no banco
      // Criar uma nova data UTC com os mesmos valores de ano, mês e dia
      // Isso evita problemas de timezone ao salvar
      const year = dataPesagemDate.getFullYear();
      const month = dataPesagemDate.getMonth();
      const day = dataPesagemDate.getDate();
      // Criar como UTC para garantir consistência
      dataPesagemDate = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
    } else {
      // Se não foi fornecida, usa a data de hoje no timezone local
      const hoje = new Date();
      const year = hoje.getFullYear();
      const month = hoje.getMonth();
      const day = hoje.getDate();
      dataPesagemDate = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
    }

    // Verificar se o boi existe e buscar o loteId
    const boi = await prisma.boi.findUnique({
      where: { id: boiId },
      include: { Lote: true }
    });

    if (!boi) {
      return NextResponse.json({ message: "Boi não encontrado" }, { status: 404 });
    }

    // Criar registro no histórico de peso
    const pesagem = await prisma.pesoHistorico.create({
      data: {
        peso: parseFloat(peso),
        dataPesagem: dataPesagemDate,
        boiId: boiId,
        loteId: boi.loteId
      }
    });

    // Buscar TODAS as pesagens do boi para encontrar a mais recente
    const todasPesagens = await prisma.pesoHistorico.findMany({
      where: { boiId: boiId }
    });

    // Ordenar manualmente por data para garantir que funcione corretamente
    const pesagensOrdenadas = todasPesagens.sort((a: any, b: any) => {
      const dataA = new Date(a.dataPesagem).getTime();
      const dataB = new Date(b.dataPesagem).getTime();
      return dataB - dataA; // Ordem decrescente (mais recente primeiro)
    });

    console.log('=== DEBUG PESAGENS ===');
    console.log('Todas as pesagens do boi:', pesagensOrdenadas.map((p: any) => ({
      id: p.id,
      peso: p.peso,
      dataPesagem: p.dataPesagem,
      timestamp: new Date(p.dataPesagem).getTime(),
      dataFormatada: new Date(p.dataPesagem).toLocaleDateString('pt-BR')
    })));

    const pesagemMaisRecente = pesagensOrdenadas[0]; // Primeira da lista = mais recente
    console.log('Pesagem mais recente selecionada:', pesagemMaisRecente);

    // Atualizar o peso atual do boi com o peso da pesagem mais recente
    if (pesagemMaisRecente) {
      const resultado = await prisma.boi.update({
        where: { id: boiId },
        data: { peso: pesagemMaisRecente.peso }
      });
      console.log(`✅ Peso do boi ${boiId} atualizado para: ${pesagemMaisRecente.peso}kg`);
      console.log('Resultado da atualização:', resultado);
    } else {
      console.log('❌ Nenhuma pesagem encontrada para atualizar');
    }
    console.log('======================');

    return NextResponse.json({ 
      message: "Pesagem registrada com sucesso",
      pesagem: {
        id: pesagem.id,
        peso: pesagem.peso,
        dataPesagem: pesagem.dataPesagem
      }
    }, { status: 201, headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate' } });
  } catch (err: any) {
    console.error("API /api/bois/[id]/pesagem POST error:", err);
    return NextResponse.json({ message: err?.message || "Erro no servidor" }, { status: 500 });
  }
}

export async function GET(
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
    const boiId = parseInt(id);

    if (isNaN(boiId)) {
      return NextResponse.json({ message: "ID do boi inválido" }, { status: 400 });
    }

    // Buscar histórico de pesagens do boi
    const historico = await prisma.pesoHistorico.findMany({
      where: { boiId: boiId },
      orderBy: { dataPesagem: 'asc' }
    });

    // Buscar informações do boi
    const boi = await prisma.boi.findUnique({
      where: { id: boiId },
      include: { Lote: true }
    });

    if (!boi) {
      return NextResponse.json({ message: "Boi não encontrado" }, { status: 404 });
    }

    // Formatar datas corretamente para evitar problemas de timezone
    // Como salvamos como UTC, precisamos usar métodos UTC para extrair
    const formatarDataParaISO = (date: Date) => {
      const d = new Date(date);
      // Usar UTC para extrair a data que foi salva como UTC
      const year = d.getUTCFullYear();
      const month = String(d.getUTCMonth() + 1).padStart(2, '0');
      const day = String(d.getUTCDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    return NextResponse.json({
      boi: {
        id: boi.id,
        peso: boi.peso,
        status: boi.status,
        alerta: boi.alerta,
        anotacoes: boi.anotacoes,
        lote: {
          id: boi.Lote.id,
          codigo: boi.Lote.codigo
        }
      },
      historico: historico.map((p: any) => ({
        id: p.id,
        peso: p.peso,
        dataPesagem: formatarDataParaISO(p.dataPesagem)
      }))
    }, { status: 200, headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate' } });
  } catch (err: any) {
    console.error("API /api/bois/[id]/pesagem GET error:", err);
    return NextResponse.json({ message: err?.message || "Erro no servidor" }, { status: 500 });
  }
}
