import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import crypto from "crypto";
import { sendEmail } from "@/lib/sendemail";

export async function POST(req: NextRequest) {
  try {
    // importa Prisma dinamicamente
    const mod = await import("../../../generated/prisma");
    const { PrismaClient } = mod as { PrismaClient: any };

    const g = globalThis as unknown as { prisma?: InstanceType<typeof PrismaClient> };
    g.prisma = g.prisma || new PrismaClient();
    const prisma = g.prisma;

    const body = await req.json();
    const { email } = body || {};

    if (!email) {
      return NextResponse.json({ message: "E-mail é obrigatório" }, { status: 400 });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      // Retornamos 200 para não expor se o e-mail existe
      return NextResponse.json({ message: "Se o e-mail existir, enviaremos o link" });
    }

    // gera token aleatório seguro
    const resetToken = crypto.randomBytes(32).toString("hex");

    // salva no banco
    await prisma.user.update({
      where: { email: normalizedEmail },
      data: { resetToken },
    });

    // link para redefinição
    const resetUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/redefinir-senha/${resetToken}`;

    // envia e-mail
    await sendEmail(
      normalizedEmail,
      "Recuperação de Senha - PastoSmart",
      `
      <p>Você solicitou a recuperação de senha.</p>
      <p>Clique no link abaixo para redefinir sua senha:</p>
      <p><a href="${resetUrl}" target="_blank">${resetUrl}</a></p>
      <br/>
      <p>Se você não fez essa solicitação, ignore este e-mail.</p>
      `
    );

    return NextResponse.json({
      message: "Se o e-mail existir, enviaremos o link",
    });
  } catch (err: any) {
    console.error("API /api/recuperar-senha error:", err);
    return NextResponse.json(
      { message: err?.message || "Erro no servidor" },
      { status: 500 }
    );
  }
}
