import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

async function getPrisma() {
  const mod = await import("../../../generated/prisma");
  const { PrismaClient } = mod as { PrismaClient: any };
  const g = globalThis as unknown as { prisma?: InstanceType<typeof PrismaClient> };
  g.prisma = g.prisma || new PrismaClient();
  return g.prisma;
}

// GET - Buscar configuração
export async function GET(req: NextRequest) {
  try {
    const prisma = await getPrisma();
    const { searchParams } = new URL(req.url);
    const chave = searchParams.get('chave');

    if (chave) {
      // Buscar configuração específica
      try {
        const config = await prisma.configuracao.findUnique({
          where: { chave }
        });
        // Se não encontrou, retorna objeto com valor null (não é erro)
        return NextResponse.json(config || { chave, valor: null });
      } catch (dbError: any) {
        // Se a tabela não existe ainda, retorna objeto vazio
        if (dbError.code === 'P2021' || dbError.message?.includes('does not exist')) {
          return NextResponse.json({ chave, valor: null });
        }
        throw dbError;
      }
    }

    // Buscar todas as configurações
    try {
      const configs = await prisma.configuracao.findMany();
      return NextResponse.json(configs);
    } catch (dbError: any) {
      // Se a tabela não existe ainda, retorna array vazio
      if (dbError.code === 'P2021' || dbError.message?.includes('does not exist')) {
        return NextResponse.json([]);
      }
      throw dbError;
    }
  } catch (err: any) {
    console.error("API /api/configuracoes GET error:", err);
    // Se a tabela não existe, retorna objeto vazio com status 200
    const chave = new URL(req.url).searchParams.get('chave');
    if (err.code === 'P2021' || err.message?.includes('does not exist') || err.message?.includes('Unknown table')) {
      return NextResponse.json({ chave: chave || null, valor: null });
    }
    return NextResponse.json(
      { message: err?.message || "Erro no servidor", chave: chave || null, valor: null },
      { status: 500 }
    );
  }
}

// PUT - Atualizar ou criar configuração
export async function PUT(req: NextRequest) {
  try {
    const prisma = await getPrisma();
    const body = await req.json();
    const { chave, valor } = body;

    if (!chave || valor === undefined) {
      return NextResponse.json(
        { message: "chave e valor são obrigatórios" },
        { status: 400 }
      );
    }

    try {
      // Upsert: atualiza se existe, cria se não existe
      const config = await prisma.configuracao.upsert({
        where: { chave },
        update: { valor: String(valor) },
        create: { chave, valor: String(valor) }
      });

      return NextResponse.json(config, { status: 200 });
    } catch (dbError: any) {
      // Se a tabela não existe, retorna erro informativo
      if (dbError.code === 'P2021' || dbError.message?.includes('does not exist') || dbError.message?.includes('Unknown table')) {
        return NextResponse.json(
          { 
            message: "A tabela de configurações ainda não foi criada. Execute a migração do Prisma: npx prisma migrate dev --name add_configuracao",
            error: "TABLE_NOT_EXISTS"
          },
          { status: 500 }
        );
      }
      throw dbError;
    }
  } catch (err: any) {
    console.error("API /api/configuracoes PUT error:", err);
    return NextResponse.json(
      { 
        message: err?.message || "Erro no servidor",
        error: err?.code || "UNKNOWN_ERROR"
      },
      { status: 500 }
    );
  }
}

