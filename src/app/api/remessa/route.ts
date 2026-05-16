import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { PrismaClient, Prisma, RemessaStatus } from "@prisma/client";

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

export async function GET(req: NextRequest) {
  try {
    const userId = await getUserIdFromToken(req);
    if (!userId) {
      return NextResponse.json({ message: "Não autenticado" }, { status: 401 });
    }

    const abertaParam = req.nextUrl.searchParams.get('aberta');

    const remessas = abertaParam === 'true'
      ? await prisma.remessa.findMany({
          where: {
            userId,
            unicoAberto: true,
          },
          include: {
            movimentacoes: true,
            _count: {
              select: { movimentacoes: true },
            },
          },
          orderBy: { createdAt: "desc" },
        })
      : await prisma.remessa.findMany({
          where: { userId },
          include: {
            movimentacoes: true,
            _count: {
              select: { movimentacoes: true },
            },
          },
          orderBy: { createdAt: "desc" },
        });

    return NextResponse.json(remessas, { status: 200 });
  } catch (err: any) {
    console.error("API /api/remessa GET error:", err);
    return NextResponse.json({ message: err?.message || "Erro ao buscar remessas" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserIdFromToken(req);
    if (!userId) {
      return NextResponse.json({ message: "Não autenticado" }, { status: 401 });
    }

    const body = await req.json();
    const mes = Number(body.mes);
    const ano = Number(body.ano);
    const status = "ABERTO" as RemessaStatus;

    if (!mes || mes < 1 || mes > 12) {
      return NextResponse.json({ message: "Mês inválido" }, { status: 400 });
    }

    if (!ano || ano < 2000) {
      return NextResponse.json({ message: "Ano inválido" }, { status: 400 });
    }

    // Verificar se já existe uma remessa aberta
    const remessaAbertaExistente = await prisma.remessa.findFirst({
      where: {
        userId,
        unicoAberto: true,
      },
    });

    if (remessaAbertaExistente) {
      return NextResponse.json(
        { message: "Já existe uma remessa aberta. Feche a remessa atual antes de criar uma nova." },
        { status: 409 }
      );
    }

    const remessa = await prisma.remessa.create({
      data: {
        mes,
        ano,
        status,
        userId,
        unicoAberto: true,
      },
    });

    return NextResponse.json(remessa, { status: 201 });
  } catch (err: any) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json(
        { message: "Já existe remessa para esse mês/ano." },
        { status: 409 }
      );
    }

    console.error("API /api/remessa POST error:", err);
    return NextResponse.json({ message: err?.message || "Erro ao criar remessa" }, { status: 500 });
  }
}
