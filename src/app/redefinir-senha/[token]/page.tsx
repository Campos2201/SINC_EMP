"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function RedefinirSenhaPage() {
  const { token } = useParams();
  const router = useRouter();

  const [senha, setSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [loading, setLoading] = useState(false);

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();

    if (senha.length < 6) {
      alert("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    if (senha !== confirmar) {
      alert("As senhas não conferem.");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/redefinir-senha", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, novaSenha: senha }),
    });

    const body = await res.json();

    setLoading(false);

    if (!res.ok) {
      alert("Erro: " + body.message);
      return;
    }

    alert("Senha redefinida com sucesso! Faça login.");
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white shadow-xl p-8 rounded-xl w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6 text-green-700">
          Redefinir Senha
        </h1>

        {!token ? (
          <p className="text-center text-red-600">Token inválido.</p>
        ) : (
          <form onSubmit={enviar} className="space-y-5">
            <input
              type="password"
              placeholder="Nova senha"
              className="w-full p-3 border-2 border-gray-300 rounded-lg"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
            />

            <input
              type="password"
              placeholder="Confirmar senha"
              className="w-full p-3 border-2 border-gray-300 rounded-lg"
              value={confirmar}
              onChange={(e) => setConfirmar(e.target.value)}
              required
            />

            <button
              className="w-full bg-green-700 hover:bg-green-800 text-white font-bold py-3 rounded-lg"
              disabled={loading}
            >
              {loading ? "Enviando..." : "Redefinir Senha"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
