"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

interface FormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: string;
}

export default function PastoSmartAuth() {
  const router = useRouter();

  const [isLogin, setIsLogin] = useState<boolean>(true);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "admin",
  });
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLogin) {
      if (!isValidEmail(formData.email)) {
        alert("Informe um e‑mail válido para cadastro.");
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        alert("As senhas não conferem.");
        return;
      }
    } else {
      if (formData.email.includes("@") && !isValidEmail(formData.email)) {
        alert("E-mail inválido.");
        return;
      }
    }

    try {
      setLoading(true);

      const payload = {
        ...formData,
        isLogin,
        email: String(formData.email).trim().toLowerCase(), // normaliza email
      };

      const res = await fetch("/api/cadastro", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });

      const body = await res.json().catch(() => ({ message: res.statusText || "Erro" }));

      if (!res.ok) {
        alert("Erro: " + (body.message || "Resposta do servidor não OK"));
        return;
      }

      console.log("Resposta do servidor:", body);

      // comportamento pós-sucesso:
      if (!isLogin) {
        // cadastro: limpar formulário e voltar para tela de login
        setFormData({
          name: "",
          email: "",
          password: "",
          confirmPassword: "",
          role: "",
        });
        setIsLogin(true);
        alert("Cadastro realizado com sucesso.");
        return;
      }

      // login: redirecionar baseado no tipo de usuário
      alert("Login realizado.");
      if (body.userRole === 'admin') {
        router.push("/adm");
      } else {
        router.push("/");
      }  
     
    } catch (err) {
      console.error(err);
      alert("Falha ao comunicar com o servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="grid md:grid-cols-2 gap-0">
          {/* Lado Esquerdo - Logo e Branding */}
          <div className="bg-white p-8 flex flex-col items-center justify-center border-r-4 border-green-600">
            <div className="mb-4">
              <div className="w-96 h-96 rounded-lg p-2 flex items-center justify-center">
                {/* Logo from public/logo.webp */}
                <Image
                  src="/logo.webp"
                  alt="Logotipo SINC"
                  width={384}
                  height={384}
                  className="w-full h-full object-contain"
                  priority
                />
              </div>
            </div>
            <div className="text-center">
              <p className="text-black text-2xl mt-2">Soluções Financeira</p>
            </div>
          </div>

          {/* Lado Direito - Formulário */}
          <div className="p-12 flex flex-col justify-center">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-green-700 text-center mb-2">
                {isLogin ? "Seja bem vindo a SINC!" : "Crie sua conta na SINC!"}
              </h2>
            </div>

            <div className="mb-8">
              <h3 className="text-lg text-black text-center mb-6">
                {isLogin ? "Efetue seu login" : "Preencha os dados para se cadastrar"}
              </h3>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Formulário de Cadastro */}
                {!isLogin && (
                  <>
                    <div>
                      <input
                        type="text"
                        name="name"
                        placeholder="Nome completo"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-green-600 focus:outline-none transition-colors"
                        required
                      />
                    </div>
                  </>
                )}

                {/* Campos comuns */}
                <div>
                  <input
                    type={isLogin ? "text" : "email"}
                    name="email"
                    placeholder={isLogin ? "E-mail" : "E-mail"}
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-green-600 focus:outline-none transition-colors"
                    required
                  />
                </div>

                <div>
                  <input
                    type="password"
                    name="password"
                    placeholder="Senha"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-green-600 focus:outline-none transition-colors"
                    required
                    minLength={6}
                  />
                </div>

                {/* Confirmar senha apenas no cadastro */}
                {!isLogin && (
                  <div>
                    <input
                      type="password"
                      name="confirmPassword"
                      placeholder="Confirme sua senha"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-green-600 focus:outline-none transition-colors"
                      required
                      minLength={6}
                    />
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full bg-green-700 hover:bg-green-800 text-white font-bold py-3 rounded-lg transition-colors duration-200 shadow-lg disabled:opacity-50"
                  disabled={loading}
                >
                  {loading ? "Enviando..." : isLogin ? "Acessar" : "Cadastrar"}
                </button>
              </form>

              {/* Links de navegação */}
              <div className="mt-6 text-center">
                {isLogin ? (
                  <>
                    
                    

                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <p className="text-black mb-2">Ainda não tem uma conta?</p>
                      <button
                        onClick={() => {
                          setIsLogin(false);
                          setFormData((prev) => ({ ...prev, password: "", confirmPassword: "" }));
                        }}
                        className="text-green-600 hover:text-green-700 font-bold text-lg"
                      >
                        Cadastre-se agora
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <p className="text-black mb-2">Já tem uma conta?</p>
                    <button
                      onClick={() => {
                        setIsLogin(true);
                        setFormData((prev) => ({ ...prev, password: "", confirmPassword: "" }));
                      }}
                      className="text-green-600 hover:text-green-700 font-bold text-lg"
                    >
                      Faça login
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
