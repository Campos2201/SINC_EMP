'use client';

import React, { useState, useEffect } from 'react';
import { Bell, Send, X, Check, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

interface Notificacao {
  id: number;
  titulo: string;
  mensagem: string;
  lida: boolean;
  tipo: string;
  createdAt: string;
  remetente: {
    id: number;
    name: string;
    role: string;
  };
  destinatario?: {
    id: number;
    name: string;
    role: string;
  };
  lote?: {
    id: number;
    codigo: string;
  };
  boi?: {
    id: number;
  };
  respostaDe?: {
    id: number;
    titulo: string;
    mensagem: string;
    remetente: {
      id: number;
      name: string;
    };
  };
  respostas?: Notificacao[];
}

export default function NotificacoesPage() {
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [naoLidas, setNaoLidas] = useState(0);
  const [loading, setLoading] = useState(true);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [formulario, setFormulario] = useState({
    destinatarioId: '',
    titulo: '',
    mensagem: '',
    respostaDeId: null as number | null
  });
  const [respondendoId, setRespondendoId] = useState<number | null>(null);
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [enviando, setEnviando] = useState(false);
  const [usuarioAtualId, setUsuarioAtualId] = useState<number | null>(null);

  useEffect(() => {
    fetchNotificacoes();
    fetchUsuarios();
    fetchUsuarioAtual();
  }, []);

  const fetchUsuarioAtual = async () => {
    try {
      const response = await fetch('/api/usuario/atual');
      if (response.ok) {
        const data = await response.json();
        setUsuarioAtualId(data.id);
      }
    } catch (error) {
      console.error('Erro ao buscar usuário atual:', error);
    }
  };

  const fetchNotificacoes = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/notificacoes');
      if (!response.ok) throw new Error('Erro ao carregar notificações');
      const data = await response.json();
      console.log('Notificações recebidas:', data.notificacoes);
      // Garantir que respostas estejam aninhadas corretamente
      const notificacoesComRespostas = data.notificacoes.map((notif: Notificacao) => {
        // Se esta notificação tem respostas, garantir que elas estejam incluídas
        if (notif.respostas && notif.respostas.length > 0) {
          console.log(`Notificação ${notif.id} tem ${notif.respostas.length} respostas`);
        }
        return notif;
      });
      setNotificacoes(notificacoesComRespostas);
      setNaoLidas(data.naoLidas);
    } catch (error) {
      console.error('Erro:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsuarios = async () => {
    try {
      const response = await fetch('/api/usuarios?role=peao');
      if (!response.ok) throw new Error('Erro ao carregar usuários');
      const data = await response.json();
      setUsuarios(data);
    } catch (error) {
      console.error('Erro:', error);
    }
  };

  const marcarComoLida = async (id: number) => {
    try {
      const response = await fetch(`/api/notificacoes/${id}`, {
        method: 'PUT'
      });
      if (response.ok) {
        const data = await response.json();
        setNaoLidas(data.naoLidas || 0);
        // Disparar evento para atualizar sidebar
        window.dispatchEvent(new CustomEvent('notificacoesAtualizadas', { detail: { naoLidas: data.naoLidas } }));
        // Recarregar lista para remover mensagem lida
        await fetchNotificacoes();
      }
    } catch (error) {
      console.error('Erro:', error);
    }
  };


  const iniciarResposta = (notificacao: Notificacao) => {
    setRespondendoId(notificacao.id);
    setFormulario({
      destinatarioId: String(notificacao.remetente.id),
      titulo: notificacao.titulo.startsWith('Re:') ? notificacao.titulo : `Re: ${notificacao.titulo}`,
      mensagem: '',
      respostaDeId: notificacao.id
    });
    setMostrarFormulario(true);
  };

  const enviarNotificacao = async () => {
    if ((!formulario.destinatarioId && !formulario.respostaDeId) || !formulario.titulo || !formulario.mensagem) {
      alert('Preencha todos os campos');
      return;
    }

    try {
      setEnviando(true);
      const response = await fetch('/api/notificacoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titulo: formulario.titulo,
          mensagem: formulario.mensagem,
          destinatarioId: parseInt(formulario.destinatarioId),
          tipo: 'mensagem',
          respostaDeId: formulario.respostaDeId
        })
      });

      if (response.ok) {
        setFormulario({ destinatarioId: '', titulo: '', mensagem: '', respostaDeId: null });
        setRespondendoId(null);
        setMostrarFormulario(false);
        await fetchNotificacoes();
        alert('Notificação enviada com sucesso!');
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Erro desconhecido' }));
        console.error('Erro detalhado:', errorData);
        alert('Erro ao enviar notificação: ' + (errorData.message || 'Erro desconhecido'));
      }
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao enviar notificação: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
    } finally {
      setEnviando(false);
    }
  };

  const formatarData = (data: string) => {
    return new Date(data).toLocaleString('pt-BR');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-gray-600">Carregando notificações...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Bell className="h-8 w-8" />
            Notificações
            {naoLidas > 0 && (
              <span className="bg-red-600 text-white text-sm font-bold px-3 py-1 rounded-full">
                {naoLidas} não lidas
              </span>
            )}
          </h1>
          <p className="text-gray-600 mt-2">Comunicação com peões e alertas do sistema</p>
        </div>
        <button
          onClick={() => setMostrarFormulario(!mostrarFormulario)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Send size={20} />
          Nova Mensagem
        </button>
      </div>

      {mostrarFormulario && (
        <div className="bg-white p-6 rounded-lg shadow border">
          <h2 className="text-xl font-semibold mb-4">
            {formulario.respostaDeId ? 'Responder Mensagem' : 'Enviar Mensagem para Peão'}
          </h2>
          <div className="space-y-4">
            {!formulario.respostaDeId && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Destinatário
                </label>
                <select
                  value={formulario.destinatarioId}
                  onChange={(e) => setFormulario({ ...formulario, destinatarioId: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  <option value="">Selecione um peão</option>
                  {usuarios.map(usuario => (
                    <option key={usuario.id} value={usuario.id}>
                      {usuario.name} ({usuario.email})
                    </option>
                  ))}
                </select>
              </div>
            )}
            {formulario.respostaDeId && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                Respondendo para: {usuarios.find(u => u.id === parseInt(formulario.destinatarioId))?.name || 'Usuário'}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Título
              </label>
              <input
                type="text"
                value={formulario.titulo}
                onChange={(e) => setFormulario({ ...formulario, titulo: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="Ex: Alerta sobre lote A"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mensagem
              </label>
              <textarea
                value={formulario.mensagem}
                onChange={(e) => setFormulario({ ...formulario, mensagem: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg min-h-[120px]"
                placeholder="Digite sua mensagem..."
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={enviarNotificacao}
                disabled={enviando}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
              >
                {enviando ? 'Enviando...' : 'Enviar'}
              </button>
              <button
                onClick={() => {
                  setMostrarFormulario(false);
                  setFormulario({ destinatarioId: '', titulo: '', mensagem: '', respostaDeId: null });
                  setRespondendoId(null);
                }}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow border">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold">Todas as Notificações</h2>
        </div>
        <div className="divide-y">
          {notificacoes.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              Nenhuma notificação encontrada.
            </div>
          ) : (
            notificacoes
              .filter(notif => !notif.respostaDe) // Mostrar apenas notificações principais
              .map((notif) => (
                <div key={notif.id} className="border-b last:border-b-0">
                  <div
                    className={`p-6 hover:bg-gray-50 transition-colors ${
                      !notif.lida ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          {notif.tipo === 'alerta_animal' && (
                            <AlertTriangle className="h-5 w-5 text-red-600" />
                          )}
                          <h3 className={`font-semibold ${!notif.lida ? 'text-blue-900' : 'text-gray-900'}`}>
                            {notif.titulo}
                          </h3>
                          {!notif.lida && (
                            <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                              Nova
                            </span>
                          )}
                        </div>
                        <p className="text-gray-700 mb-2 whitespace-pre-wrap">{notif.mensagem}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span>De: {notif.remetente.name} ({notif.remetente.role})</span>
                          {notif.destinatario && (
                            <>
                              <span>•</span>
                              <span>Para: {notif.destinatario.name}</span>
                            </>
                          )}
                          <span>•</span>
                          <span>{formatarData(notif.createdAt)}</span>
                          {notif.lote && (
                            <>
                              <span>•</span>
                              <Link
                                href={`/adm/lote/${notif.lote.id}`}
                                className="text-blue-600 hover:underline"
                              >
                                Lote: {notif.lote.codigo}
                              </Link>
                            </>
                          )}
                          {notif.boi && (
                            <>
                              <span>•</span>
                              <span>Boi #{notif.boi.id}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        {notif.destinatario && notif.destinatario.id === usuarioAtualId && (
                          <button
                            onClick={() => iniciarResposta(notif)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                            title="Responder"
                          >
                            <Send size={18} />
                          </button>
                        )}
                        {!notif.lida && (
                          <button
                            onClick={() => marcarComoLida(notif.id)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded"
                            title="Marcar como lida"
                          >
                            <Check size={20} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Mostrar respostas */}
                  {notif.respostas && notif.respostas.length > 0 && (
                    <div className="bg-gray-50 pl-8 border-l-4 border-gray-300">
                      {notif.respostas.map((resposta) => (
                        <div
                          key={resposta.id}
                          className={`p-4 border-b last:border-b-0 ${
                            !resposta.lida ? 'bg-blue-50' : ''
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs text-gray-500">↳</span>
                                <span className="text-sm font-medium text-gray-700">
                                  {resposta.remetente.name}
                                </span>
                                {!resposta.lida && (
                                  <span className="bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded-full">
                                    Nova
                                  </span>
                                )}
                              </div>
                              <p className="text-gray-700 text-sm mb-1 whitespace-pre-wrap">{resposta.mensagem}</p>
                              <div className="text-xs text-gray-500">
                                {formatarData(resposta.createdAt)}
                              </div>
                            </div>
                            <div className="flex gap-2 ml-4">
                              {resposta.destinatario && resposta.destinatario.id === usuarioAtualId && (
                                <button
                                  onClick={() => iniciarResposta(resposta)}
                                  className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                                  title="Responder"
                                >
                                  <Send size={16} />
                                </button>
                              )}
                              {!resposta.lida && (
                                <button
                                  onClick={() => marcarComoLida(resposta.id)}
                                  className="p-1.5 text-green-600 hover:bg-green-50 rounded"
                                  title="Marcar como lida"
                                >
                                  <Check size={16} />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
          )}
        </div>
      </div>
    </div>
  );
}

