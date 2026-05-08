import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

async function getPrisma() {
  const mod = await import("../../../generated/prisma");
  const { PrismaClient } = mod as { PrismaClient: any };
  const g = globalThis as unknown as { prisma?: InstanceType<typeof PrismaClient> };
  g.prisma = g.prisma || new PrismaClient();
  return g.prisma;
}

async function getUserIdFromToken(req: NextRequest): Promise<number | null> {
  try {
    const token = req.cookies.get("auth_token")?.value;
    if (!token) return null;
    
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    return payload.id as number;
  } catch {
    return null;
  }
}

// GET - Listar notificações do usuário logado
export async function GET(req: NextRequest) {
  try {
    const prisma = await getPrisma();
    const userId = await getUserIdFromToken(req);
    
    if (!userId) {
      return NextResponse.json({ message: "Não autenticado" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const apenasNaoLidas = searchParams.get("apenasNaoLidas") === "true";

    // Buscar notificações principais (sem respostaDeId)
    // Mostrar apenas:
    // 1. Notificações onde o usuário é destinatário (mensagens recebidas)
    // 2. Notificações onde o usuário é remetente mas tem respostas (para ver a conversa completa)
    const where: any = {
      respostaDeId: null, // Apenas notificações principais
      OR: [
        { destinatarioId: userId }, // Mensagens recebidas
        { remetenteId: userId } // Mensagens enviadas (serão filtradas depois se não tiverem respostas)
      ]
    };

    if (apenasNaoLidas) {
      where.lida = false;
      // Para não lidas, só contar as que o usuário recebeu
      where.destinatarioId = userId;
    }

    const notificacoes = await prisma.notificacao.findMany({
      where,
      include: {
        remetente: {
          select: {
            id: true,
            name: true,
            role: true
          }
        },
        destinatario: {
          select: {
            id: true,
            name: true,
            role: true
          }
        },
        lote: {
          select: {
            id: true,
            codigo: true
          }
        },
        boi: {
          select: {
            id: true
          }
        },
        respostaDe: {
          select: {
            id: true,
            titulo: true,
            mensagem: true,
            remetente: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        respostas: {
          include: {
            remetente: {
              select: {
                id: true,
                name: true,
                role: true
              }
            },
            destinatario: {
              select: {
                id: true,
                name: true,
                role: true
              }
            }
          },
          orderBy: {
            createdAt: 'asc'
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const naoLidas = await prisma.notificacao.count({
      where: {
        destinatarioId: userId,
        lida: false
      }
    });

    // Agrupar notificações: principais e suas respostas
    // Para cada principal, buscar TODAS as respostas da thread (para mostrar conversa completa)
    const principaisComRespostas = await Promise.all(
      notificacoes.map(async (principal) => {
        // Buscar TODAS as respostas desta notificação principal (thread completa)
        const respostas = await prisma.notificacao.findMany({
          where: {
            respostaDeId: principal.id
          },
          include: {
            remetente: {
              select: {
                id: true,
                name: true,
                role: true
              }
            },
            destinatario: {
              select: {
                id: true,
                name: true,
                role: true
              }
            }
          },
          orderBy: {
            createdAt: 'asc'
          }
        });
        
        // Filtrar respostas: mostrar apenas as não lidas ou as que o usuário enviou (para contexto)
        const respostasFiltradas = respostas.filter((r: any) => {
          // Se o usuário é destinatário, mostrar apenas se não estiver lida
          if (r.destinatarioId === userId) {
            return !r.lida;
          }
          // Se o usuário é remetente, sempre mostrar (para contexto da conversa)
          if (r.remetenteId === userId) {
            return true;
          }
          return false;
        });
        
        return {
          ...principal,
          respostas: respostasFiltradas
        };
      })
    );

    // Filtrar: mostrar apenas notificações onde:
    // 1. O usuário é destinatário (mensagens recebidas) E (não está lida OU tem respostas não lidas), OU
    // 2. O usuário é remetente mas tem pelo menos uma resposta não lida (para ver a conversa completa)
    const notificacoesFiltradas = principaisComRespostas.filter(notif => {
      // Verificar se tem respostas não lidas
      const temRespostasNaoLidas = notif.respostas && notif.respostas.some((r: any) => 
        r.destinatarioId === userId && !r.lida
      );
      
      // Se o usuário é destinatário
      if (notif.destinatarioId === userId) {
        // Mostrar se não estiver lida OU se tiver respostas não lidas
        return !notif.lida || temRespostasNaoLidas;
      }
      // Se o usuário é remetente, mostrar apenas se tiver respostas não lidas
      if (notif.remetenteId === userId) {
        return temRespostasNaoLidas;
      }
      return false;
    });

    return NextResponse.json({
      notificacoes: notificacoesFiltradas,
      naoLidas
    }, { status: 200 });
  } catch (err: any) {
    console.error("API /api/notificacoes GET error:", err);
    return NextResponse.json({ message: err?.message || "Erro no servidor" }, { status: 500 });
  }
}

// POST - Criar nova notificação
export async function POST(req: NextRequest) {
  try {
    const prisma = await getPrisma();
    const remetenteId = await getUserIdFromToken(req);
    
    if (!remetenteId) {
      return NextResponse.json({ message: "Não autenticado" }, { status: 401 });
    }

    const body = await req.json();
    const { titulo, mensagem, tipo, destinatarioId, loteId, boiId, respostaDeId } = body;

    if (!titulo || !mensagem) {
      return NextResponse.json({ message: "Título e mensagem são obrigatórios" }, { status: 400 });
    }

    // Converter IDs para números
    let destinatarioIdNum: number | null = destinatarioId ? parseInt(destinatarioId) : null;
    const loteIdNum = loteId ? parseInt(loteId) : null;
    const boiIdNum = boiId ? parseInt(boiId) : null;

    // Se for uma resposta, buscar a notificação original para copiar loteId e boiId se necessário
    let loteIdFinal = loteIdNum;
    let boiIdFinal = boiIdNum;
    let tipoFinal = tipo || 'mensagem';
    
    if (respostaDeId) {
      const notificacaoOriginal = await prisma.notificacao.findUnique({
        where: { id: parseInt(respostaDeId) },
        select: { loteId: true, boiId: true, tipo: true, remetenteId: true, titulo: true }
      });
      
      if (!notificacaoOriginal) {
        return NextResponse.json({ message: "Notificação original não encontrada" }, { status: 404 });
      }
      
      // Se não foram fornecidos, usar os da notificação original
      if (!loteIdFinal) loteIdFinal = notificacaoOriginal.loteId;
      if (!boiIdFinal) boiIdFinal = notificacaoOriginal.boiId;
      tipoFinal = notificacaoOriginal.tipo;
      
      // O destinatário da resposta deve ser o remetente da notificação original
      destinatarioIdNum = notificacaoOriginal.remetenteId;
    }

    // Validar destinatário
    if (!destinatarioIdNum || isNaN(destinatarioIdNum)) {
      return NextResponse.json({ message: "ID do destinatário inválido" }, { status: 400 });
    }

    // Verificar se o destinatário existe
    const destinatario = await prisma.user.findUnique({
      where: { id: destinatarioIdNum }
    });

    if (!destinatario) {
      return NextResponse.json({ message: "Destinatário não encontrado" }, { status: 404 });
    }

    const notificacao = await prisma.notificacao.create({
      data: {
        titulo: respostaDeId ? `Re: ${titulo}` : titulo,
        mensagem,
        tipo: tipoFinal,
        remetenteId,
        destinatarioId: destinatarioIdNum,
        loteId: loteIdFinal,
        boiId: boiIdFinal,
        respostaDeId: respostaDeId ? parseInt(respostaDeId) : null
      },
      include: {
        remetente: {
          select: {
            id: true,
            name: true,
            role: true
          }
        },
        lote: {
          select: {
            id: true,
            codigo: true
          }
        },
        boi: {
          select: {
            id: true
          }
        }
      }
    });

    return NextResponse.json(notificacao, { status: 201 });
  } catch (err: any) {
    console.error("API /api/notificacoes POST error:", err);
    console.error("Erro completo:", JSON.stringify(err, null, 2));
    
    // Mensagem de erro mais detalhada
    let errorMessage = "Erro no servidor";
    if (err?.code === 'P2003') {
      errorMessage = "Erro de referência: verifique se o destinatário, lote ou boi existem";
    } else if (err?.code === 'P2002') {
      errorMessage = "Violação de constraint única";
    } else if (err?.message) {
      errorMessage = err.message;
    }
    
    return NextResponse.json({ message: errorMessage, error: err?.code || 'UNKNOWN' }, { status: 500 });
  }
}

