'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Home, ShoppingCart, LogOut, FileText, BarChart2 } from 'lucide-react';
import { logout } from '../../../lib/auth';

// Tipagem das Props
interface SidebarProps {
  userType: 'adm';
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isSidebarOpen,
  setIsSidebarOpen,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const [nomeUsuario, setNomeUsuario] = useState<string>('');
  const [userRole, setUserRole] = useState<string>('');
  
  useEffect(() => {
    if (isSidebarOpen) {
      fetchUsuarioAtual();
    }
  }, [isSidebarOpen]);

  const fetchUsuarioAtual = async () => {
    try {
      const response = await fetch('/api/usuario/atual');
      if (response.ok) {
        const data = await response.json();
        console.log('Dados do usuário:', data);
        if (data.name) {
          // Pegar apenas o primeiro nome
          const primeiroNome = data.name.split(' ')[0];
          setNomeUsuario(primeiroNome);
        } else {
          setNomeUsuario('Administrador');
        }
        if (data.role) {
          setUserRole(data.role);
        }
      } else {
        setNomeUsuario('Administrador');
      }
    } catch (error) {
      console.error('Erro ao buscar usuário:', error);
      setNomeUsuario('Administrador');
    }
  };
  
  const menuItems = [
    { icon: Home, label: 'Início', route: '/adm' },
    { icon: ShoppingCart, label: 'Remessa', route: '/adm/remessa' },
    { icon: BarChart2, label: 'Reserva Financeira', route: '/adm/reserva' },
    { icon: FileText, label: 'Relatórios', route: '/adm/relatorios' }
  ];

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className={`${isSidebarOpen ? 'w-80' : 'w-0'} bg-green-800 text-white transition-all duration-300 overflow-hidden flex-shrink-0`}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-xl font-bold"> Sistema Financeiro</h1>
        </div>
        
        <div className="mb-6 p-3 bg-green-700 rounded-lg">
          <p className="text-lg font-medium">Usuário: {nomeUsuario}</p>
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
              <div className="flex items-center space-x-3 min-w-0">
                <item.icon size={20} className="flex-shrink-0" />
                <span>{item.label}</span>
              </div>
            </button>
          ))}
        </nav>

        <button
          onClick={handleLogout}
          className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-green-700 mt-8 transition-colors"
        >
          <LogOut size={20} className="flex-shrink-0" />
          <span>Sair</span>
        </button>
      </div>
    </div>
  );
};