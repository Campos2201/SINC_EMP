// Tipagens compartilhadas do sistema de controle de gado

export interface Boi {
    id: number;
    peso: number;
}

export interface Lote {
    id: number;
    nome: string;
    dataChegada: string;
    custo: number;
    vacinado: boolean;
    dataVacinacao: string | null;
    bois: Boi[];
}

export interface Venda {
    id: number;
    loteId: number;
    loteName: string;
    data: string;
    valor: number;
}

export interface Usuario {
    id: number;
    nome: string;
    tipo: 'adm' | 'peao';
    email?: string;
}

// Tipos utilitários
export type BoiSemId = Omit<Boi, 'id'>;
export type LoteSemId = Omit<Lote, 'id'>;
export type VendaSemId = Omit<Venda, 'id'>;

// Interfaces para gráficos
export interface DadosGrafico {
    nome: string;
    valor: number;
    [key: string]: string | number;
}

export interface EstatisticasLote {
    pesoMedio: number;
    pesoTotal: number;
    boisVacinados: number;
    percentualVacinacao: number;
    custoTotal: number;
    custoPorBoi: number;
    custoPorKg: number;
}