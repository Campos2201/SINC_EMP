// Função utilitária para logout
export async function logout() {
  console.log('🔐 Iniciando logout...');
  
  try {
    // Chamar a API de logout para remover o cookie httpOnly
    const response = await fetch('/api/logout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      console.log('✅ Logout realizado via API');
    } else {
      console.error('❌ Erro na API de logout:', response.status);
    }
  } catch (error) {
    console.error('❌ Erro ao chamar API de logout:', error);
  }
  
  // Limpar qualquer dado armazenado localmente
  try {
    localStorage.clear();
    sessionStorage.clear();
    console.log('✅ LocalStorage e SessionStorage limpos');
  } catch (error) {
    console.error('Erro ao limpar storage:', error);
  }
  
  // Pequeno delay para garantir que a API foi processada
  await new Promise(resolve => setTimeout(resolve, 200));
  
  // Forçar reload da página para garantir que o middleware seja executado
  console.log('🔄 Redirecionando para login...');
  window.location.href = '/';
}

// Função simples de logout direto (fallback)
export function logoutDirect() {
  // Redirecionar para uma página que força o logout
  window.location.href = '/api/logout';
}

// Função para verificar se o usuário está logado
export function isAuthenticated(): boolean {
  const cookies = document.cookie.split('; ');
  const tokenCookie = cookies.find(row => row.startsWith('auth_token='));
  return !!tokenCookie && tokenCookie.split('=')[1] !== '';
}

// Função para obter informações do token atual
export function getTokenInfo() {
  try {
    const cookies = document.cookie.split('; ');
    const tokenCookie = cookies.find(row => row.startsWith('auth_token='));
    
    if (!tokenCookie) {
      return null;
    }
    
    const token = tokenCookie.split('=')[1];
    const tokenParts = token.split('.');
    
    if (tokenParts.length !== 3) {
      return null;
    }
    
    const payload = JSON.parse(atob(tokenParts[1]));
    return {
      token,
      payload,
      isExpired: payload.exp * 1000 < Date.now(),
      expiresAt: new Date(payload.exp * 1000),
      timeLeft: Math.max(0, payload.exp * 1000 - Date.now())
    };
  } catch (error) {
    console.error('Erro ao obter informações do token:', error);
    return null;
  }
}