import { NextResponse } from "next/server";
import { sendPasswordResetEmail } from "@/src/lib/sendemail";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: "E-mail é obrigatório." },
        { status: 400 }
      );
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      "http://localhost:3000";

    const resetLink = `${baseUrl}/recuperar-senha?email=${encodeURIComponent(
      email
    )}`;

    await sendPasswordResetEmail(email, resetLink);

    return NextResponse.json({ success: true, message: "E-mail enviado!" });
  } catch (err) {
    console.error("Erro ao processar pedido de recuperação:", err);
    return NextResponse.json(
      { error: "Erro interno ao enviar e-mail" },
      { status: 500 }
    );
  }
}
