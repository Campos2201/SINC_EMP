import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import jwt from "jsonwebtoken";
import { PrismaClient, Tipo } from "@prisma/client";

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

    const payload = jwt.verify(token, secretValue) as { id?: number };
    return typeof payload.id === "number" ? payload.id : null;
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

    const reservas = await prisma.reserva.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            name: true,
          },
        },
      },
    });

    return NextResponse.json(reservas, { status: 200 });
  } catch (err: any) {
    console.error("API /api/reserva GET error:", err);
    return NextResponse.json({ message: err?.message || "Erro ao buscar reserva" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserIdFromToken(req);
    if (!userId) {
      return NextResponse.json({ message: "Não autenticado" }, { status: 401 });
    }

    const body = await req.json();
    const tipo = String(body.tipo || "ENTRADA") as Tipo;
    const valor = Number(body.valor);

    if (!['ENTRADA', 'SAIDA'].includes(tipo)) {
      return NextResponse.json({ message: "Tipo inválido" }, { status: 400 });
    }

    if (Number.isNaN(valor) || valor <= 0) {
      return NextResponse.json({ message: "Valor inválido" }, { status: 400 });
    }

    const reserva = await prisma.reserva.create({
      data: {
        tipo,
        valor,
        userId,
      },
    });

    return NextResponse.json(reserva, { status: 201 });
  } catch (err: any) {
    console.error("API /api/reserva POST error:", err);
    return NextResponse.json({ message: err?.message || "Erro ao criar reserva" }, { status: 500 });
  }
}
