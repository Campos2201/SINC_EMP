import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const secret = new TextEncoder().encode(process.env.JWT_SECRET);

export async function middleware(req: NextRequest) {
  const token = req.cookies.get("auth_token")?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  try {
    const { payload } = await jwtVerify(token, secret);

    // Verifica se o usuário tem permissão
    const pathname = req.nextUrl.pathname;

    if (pathname.startsWith("/adm") && payload.role !== "admin") {
      return NextResponse.redirect(new URL("/", req.url));
    }
    
    // Token válido → deixa seguir
    return NextResponse.next();
  } catch (err) {
    console.error("JWT inválido:", err);
    return NextResponse.redirect(new URL("/", req.url));
  }
}

export const config = {
  matcher: ["/adm/:path*"], // protege essa rota
};
