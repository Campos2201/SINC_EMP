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

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getUserIdFromToken(req);
    if (!userId) {
      return NextResponse.json({ message: "Não autenticado" }, { status: 401 });
    }

    const { id } = await context.params;
    const reservaId = Number(id);
    if (!reservaId) {
      return NextResponse.json({ message: "ID inválido" }, { status: 400 });
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

    const reserva = await prisma.reserva.findUnique({ where: { id: reservaId } });
    if (!reserva) {
      return NextResponse.json({ message: "Reserva não encontrada" }, { status: 404 });
    }

    const updatedReserva = await prisma.reserva.update({
      where: { id: reservaId },
      data: {
        tipo,
        valor,
      },
    });

    return NextResponse.json(updatedReserva, { status: 200 });
  } catch (err: any) {
    console.error("API /api/reserva/[id] PUT error:", err);
    return NextResponse.json({ message: err?.message || "Erro ao atualizar reserva" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getUserIdFromToken(req);
    if (!userId) {
      return NextResponse.json({ message: "Não autenticado" }, { status: 401 });
    }

    const { id } = await context.params;
    const reservaId = Number(id);
    if (!reservaId) {
      return NextResponse.json({ message: "ID inválido" }, { status: 400 });
    }

    const reserva = await prisma.reserva.findUnique({ where: { id: reservaId } });
    if (!reserva) {
      return NextResponse.json({ message: "Reserva não encontrada" }, { status: 404 });
    }

    await prisma.reserva.delete({ where: { id: reservaId } });
    return NextResponse.json({ message: "Reserva removida" }, { status: 200 });
  } catch (err: any) {
    console.error("API /api/reserva/[id] DELETE error:", err);
    return NextResponse.json({ message: err?.message || "Erro ao deletar reserva" }, { status: 500 });
  }
}
