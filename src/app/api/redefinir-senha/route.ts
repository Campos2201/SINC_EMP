import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    // importa Prisma dinamicamente
    const mod = await import("../../../generated/prisma");
    const { PrismaClient } = mod as { PrismaClient: any };

    const g = globalThis as unknown as { prisma?: InstanceType<typeof PrismaClient> };
    g.prisma = g.prisma || new PrismaClient();
    const prisma = g.prisma;

    const body = await req.json();
    const { token, novaSenha } = body || {};

    if (!token || !novaSenha) {
      return NextResponse.json(
        { message: "Token e nova senha são obrigatórios" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findFirst({
      where: { resetToken: token },
    });

    if (!user) {
      return NextResponse.json(
        { message: "Token inválido ou expirado" },
        { status: 400 }
      );
    }

    // Atualiza senha e limpa token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        senha: novaSenha,     // sem hash, igual ao login/cadastro atual
        resetToken: null,
      },
    });

    return NextResponse.json({ message: "Senha redefinida com sucesso" });
  } catch (err: any) {
    console.error("API /api/redefinir-senha error:", err);
    return NextResponse.json(
      { message: err?.message || "Erro no servidor" },
      { status: 500 }
    );
  }
}
