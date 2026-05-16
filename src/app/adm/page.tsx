import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV === 'development') {
  globalForPrisma.prisma = prisma;
}

async function getUserIdFromToken(): Promise<number | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    const secretValue = process.env.JWT_SECRET;
    if (!token || !secretValue) return null;

    const secret = new TextEncoder().encode(secretValue);
    const { payload } = await jwtVerify(token, secret);
    return payload.id as number;
  } catch {
    return null;
  }
}

async function fetchRemessaAtual() {
  const userId = await getUserIdFromToken();
  if (!userId) return null;

  try {
    const remessa = await prisma.remessa.findFirst({
      where: {
        userId,
        unicoAberto: true,
      },
      include: {
        movimentacoes: true,
      },
      orderBy: [{ ano: 'desc' }, { mes: 'desc' }],
    });

    if (!remessa) return null;

    const totalGastosSaida = remessa.movimentacoes
      .filter((mov) => mov.tipo === 'SAIDA')
      .reduce((acc, mov) => acc + Number(mov.valor), 0);

    const totalGanhosEntrada = remessa.movimentacoes
      .filter((mov) => mov.tipo === 'ENTRADA')
      .reduce((acc, mov) => acc + Number(mov.valor), 0);

    return {
      mes: remessa.mes,
      ano: remessa.ano,
      status: remessa.status,
      totalGastosSaida,
      totalGanhosEntrada,
    };
  } catch (error) {
    console.error('Erro ao buscar remessa atual:', error);
    return null;
  }
}

async function fetchReservaSaldo() {
  const userId = await getUserIdFromToken();
  if (!userId) return 0;

  try {
    const [entradas, saidas] = await Promise.all([
      prisma.reserva.aggregate({
        _sum: { valor: true },
        where: { tipo: 'ENTRADA', userId }
      }),
      prisma.reserva.aggregate({
        _sum: { valor: true },
        where: { tipo: 'SAIDA', userId }
      })
    ]);

    const totalEntrada = Number(entradas._sum.valor || 0);
    const totalSaida = Number(saidas._sum.valor || 0);
    return totalEntrada - totalSaida;
  } catch (error) {
    console.error('Erro ao calcular saldo da reserva:', error);
    return 0;
  }
}

export default async function AdminHomePage() {
  const remessaAtual = await fetchRemessaAtual();
  const saldoReservaLiquido = await fetchReservaSaldo();
  const totalGastosDaRemessaAtual = remessaAtual ? remessaAtual.totalGastosSaida : 0;
  const totalGanhosDaRemessaAtual = remessaAtual ? remessaAtual.totalGanhosEntrada : 0;
  const saldoDaRemessa = totalGanhosDaRemessaAtual - totalGastosDaRemessaAtual;

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-800">Dashboard</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-600">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Remessa Atual</h3>
          <p className="text-3xl font-bold text-green-600">
            {remessaAtual ? `${String(remessaAtual.mes).padStart(2, '0')}/${remessaAtual.ano}` : 'Sem remessa'}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {remessaAtual ? 'Remessa aberta' : 'Nenhuma remessa cadastrada'}
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-600">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Gastos Totais da Remessa Atual</h3>
          <p className="text-3xl font-bold text-blue-600">
            R$ {totalGastosDaRemessaAtual.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {remessaAtual ? 'Soma das movimentações SAIDA' : 'Nenhuma remessa aberta'}
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-yellow-600">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Ganhos Totais da Remessa Atual</h3>
          <p className="text-3xl font-bold text-yellow-600">
            R$ {totalGanhosDaRemessaAtual.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {remessaAtual ? 'Soma das movimentações ENTRADA' : 'Nenhuma remessa aberta'}
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-gray-600">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Saldo da Remessa Atual</h3>
          <p className={`text-3xl font-bold ${saldoDaRemessa >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            R$ {saldoDaRemessa.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {remessaAtual ? 'Ganhos menos gastos da remessa' : 'Nenhuma remessa aberta'}
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-purple-600">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Reserva Financeira</h3>
          <p className="text-3xl font-bold text-purple-600">
            R$ {saldoReservaLiquido.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Quantidade de Dinheiro disponível na reserva financeira
          </p>
        </div>
      </div>
    </div>
  );
}
