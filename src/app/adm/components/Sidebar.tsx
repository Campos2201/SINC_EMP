'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Home, ShoppingCart, BarChart3, LogOut, FileText, BarChart2, Settings, Bell } from 'lucide-react';
import { logout } from '../../../lib/auth';

// Tipagem das Props
interface SidebarProps {
  userType: 'adm' | 'peao';
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  userType,
  isSidebarOpen,
  setIsSidebarOpen,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const [naoLidas, setNaoLidas] = useState(0);
  const [nomeUsuario, setNomeUsuario] = useState<string>(userType === 'adm' ? 'Administrador' : 'Peão');
  
  useEffect(() => {
    if (isSidebarOpen) {
      fetchNaoLidas();
      fetchUsuarioAtual();
      const interval = setInterval(fetchNaoLidas, 30000); // Atualiza a cada 30 segundos
      
      // Escutar evento de atualização de notificações
      const handleNotificacoesAtualizadas = (event: CustomEvent) => {
        setNaoLidas(event.detail.naoLidas || 0);
      };
      
      window.addEventListener('notificacoesAtualizadas', handleNotificacoesAtualizadas as EventListener);
      
      return () => {
        clearInterval(interval);
        window.removeEventListener('notificacoesAtualizadas', handleNotificacoesAtualizadas as EventListener);
      };
    }
  }, [isSidebarOpen]);

  const fetchUsuarioAtual = async () => {
    try {
      const response = await fetch('/api/usuario/atual');
      if (response.ok) {
        const data = await response.json();
        if (data.name) {
          // Pegar apenas o primeiro nome
          const primeiroNome = data.name.split(' ')[0];
          setNomeUsuario(primeiroNome);
        }
      }
    } catch (error) {
      console.error('Erro ao buscar usuário:', error);
    }
  };

  const fetchNaoLidas = async () => {
    try {
      const response = await fetch('/api/notificacoes?apenasNaoLidas=true');
      if (response.ok) {
        const data = await response.json();
        setNaoLidas(data.naoLidas || 0);
      }
    } catch (error) {
      console.error('Erro ao buscar notificações:', error);
    }
  };
  
  const menuItems = userType === 'adm'
    ? [
        { icon: Home, label: 'Início', route: '/adm' },
        { icon: ShoppingCart, label: 'Vendas', route: '/adm/vendas' },
        { icon: BarChart2, label: 'Análise Vendas', route: '/adm/vendas/analise' },
        { icon: BarChart3, label: 'Lotes', route: '/adm/lote' },
        { icon: FileText, label: 'Relatórios', route: '/adm/relatorios' },
        { icon: Settings, label: 'Configurações', route: '/adm/configuracoes' },
        { icon: Bell, label: 'Notificações', route: '/adm/notificacoes', badge: naoLidas }
      ]
    : [
        { icon: Home, label: 'Início', route: '/adm' },
        { icon: BarChart3, label: 'Lotes', route: '/adm/lote' }
      ];

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className={`${isSidebarOpen ? 'w-64' : 'w-0'} bg-green-800 text-white transition-all duration-300 overflow-hidden flex-shrink-0`}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-xl font-bold">🐄 Sistema Gado</h1>
        </div>
        
        <div className="mb-6 p-3 bg-green-700 rounded-lg">
          <p className="text-sm font-semibold">Tipo de Usuário</p>
          <p className="text-lg">{nomeUsuario}</p>
        </div>

        <nav className="space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.route}
              onClick={() => {
                router.push(item.route);
                // Opcional: Fechar sidebar em telas pequenas após clique
                if (window.innerWidth < 768) {
                  setIsSidebarOpen(false);
                }
              }}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${
                pathname === item.route ? 'bg-green-600' : 'hover:bg-green-700'
              }`}
            >
              <div className="flex items-center space-x-3">
                <item.icon size={20} />
                <span>{item.label}</span>
              </div>
              {item.badge && item.badge > 0 && (
                <span className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full min-w-[20px] text-center">
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        <button
          onClick={handleLogout}
          className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-green-700 mt-8 transition-colors"
        >
          <LogOut size={20} />
          <span>Sair</span>
        </button>
      </div>
    </div>
  );
};