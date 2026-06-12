
Sistema web para gestão de pequeno negócios.
---

## 1. Sobre o Projeto

O SINC EMP é uma plataforma desenvolvida para facilitar o gerenciamento de pequenos negócios.
---

## 2. Tecnologias

- Next.js 15 (App Router)
- React 19
- TypeScript
- Prisma (MySQL)
- Tailwind CSS
- Recharts
- JWT

---

## 2. Requisitos

- Node.js 20+
- MySQL 8+
- npm ou yarn

---

## 3. Instalação

### 3.1 Clonar o repositório
```bash
git clone <url-do-repositorio>
```

### 3.2 Instalar dependências
```bash
npm install
```

### 3.3 Configurar variáveis de ambiente

Crie um arquivo **.env.local**:

```env
# Banco de dados
DATABASE_URL="mysql://"seu_banco":SUA_SENHA@127.0.0.1:3306/sinc_emp"

# JWT
JWT_SECRET="uma_chave_secreta_muito_segura_aqui"

# URL pública da aplicação
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

---

## 4. Banco de Dados

### Rodar migrações
```bash
npx prisma migrate dev
```

### Gerar cliente Prisma
```bash
npx prisma generate
```

---

## 5. Executando o Projeto

```bash
npm run dev
```

A aplicação ficará disponível em **http://localhost:3000**  
(O Next.js escolherá outra porta automaticamente se necessário.)

---

## 6. Build de Produção

```bash
npm run build
npm start
```

---

### 7. Executar migrações em produção
```bash
npx prisma migrate deploy
```

---

## 8. Criar Usuário

```sql
INSERT INTO User (name, email, senha, role)
VALUES ('Admin', 'admin@example.com', 'admin123', 'admin');
```

(Em produção, usar hash de senha.)

---

## 9. Estrutura do Projeto

- `/src/app/api` – rotas da API  
- `/src/app/(auth)` – autenticação  
- `/src/app/adm` – dashboard administrativo  
- `/src/app/peao` – módulo operacional  
- `/src/generated/prisma` – cliente Prisma  

---

## 10. Contribuição

```bash
git checkout dev
git pull
git checkout -b feature/minha-feature
```

Após finalizar:

```bash
git add .
git commit -m "Descrição da feature"
git push origin feature/minha-feature
```

Criar PR → branch `dev`.

---
