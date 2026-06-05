# PastoSmart

Sistema web para gestão de gado, incluindo controle de lotes, pesagens, vacinações, vendas e alertas automatizados.

---

## 1. Sobre o Projeto

O PastoSmart é uma plataforma desenvolvida para facilitar o gerenciamento de propriedades pecuárias. As principais funcionalidades incluem:

- **Gestão de Lotes e Animais**
- **Histórico de Pesagens**
- **Controle de Vacinação**
- **Registro de Vendas e Cálculo de Lucro**
- **Alertas por Peso Médio**
- **Gráficos e Relatórios**
- **Recuperação de Senha via E-mail**

Níveis de acesso:

- **Administrador** — controle total do sistema  
- **Peão** — acesso restrito às operações diárias

---

## 2. Tecnologias

- Next.js 15 (App Router)
- React 19
- TypeScript
- Prisma (MySQL)
- Tailwind CSS
- Recharts
- JWT
- Nodemailer

---

## 3. Requisitos

- Node.js 20+
- MySQL 8+
- npm ou yarn

---

## 4. Instalação

### 4.1 Clonar o repositório
```bash
git clone <url-do-repositorio>
cd PastoSmart
```

### 4.2 Instalar dependências
```bash
npm install
```

### 4.3 Configurar variáveis de ambiente

Crie um arquivo **.env.local**:

```env
# Banco de dados
DATABASE_URL="mysql://root:SUA_SENHA@127.0.0.1:3306/pastosmart_db"

# JWT
JWT_SECRET="uma_chave_secreta_muito_segura_aqui"

# E-mail (recuperação de senha)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=noreplypastosmart@gmail.com
EMAIL_PASS=wilszwcbtzdslqlo
EMAIL_FROM=noreplypastosmart@gmail.com

# URL pública da aplicação
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

---

## 5. Banco de Dados

### Rodar migrações
```bash
npx prisma migrate dev
```

### Gerar cliente Prisma
```bash
npx prisma generate
```

---

## 6. Executando o Projeto

```bash
npm run dev
```

A aplicação ficará disponível em **http://localhost:3000**  
(O Next.js escolherá outra porta automaticamente se necessário.)

---

## 7. Build de Produção

```bash
npm run build
npm start
```

---

## 8. Deploy (Vercel)

### 1. Instalar CLI
```bash
npm i -g vercel
```

### 2. Login
```bash
vercel login
```

### 3. Deploy do projeto
```bash
vercel
```

### 4. Configurar variáveis de ambiente na Vercel

| Variável | Descrição |
|----------|-----------|
| DATABASE_URL | Conexão MySQL |
| JWT_SECRET | Chave JWT |
| EMAIL_HOST | SMTP |
| EMAIL_PORT | Porta |
| EMAIL_USER | Conta de envio |
| EMAIL_PASS | Senha de app |
| EMAIL_FROM | Remetente |
| NEXT_PUBLIC_BASE_URL | URL pública |

### 5. Executar migrações em produção
```bash
npx prisma migrate deploy
```

---

## 9. Recuperação de Senha – Fluxo

1. Usuário solicita redefinição em **/recuperar-senha**  
2. Sistema envia e-mail com token  
3. Usuário acessa **/redefinir-senha/[token]**  
4. Senha é atualizada  

---

## 10. Criar Administrador Inicial

```sql
INSERT INTO User (name, email, senha, role)
VALUES ('Admin', 'admin@example.com', 'admin123', 'admin');
```

(Em produção, usar hash de senha.)

---

## 11. Estrutura do Projeto

- `/src/app/api` – rotas da API  
- `/src/app/(auth)` – autenticação  
- `/src/app/adm` – dashboard administrativo  
- `/src/app/peao` – módulo operacional  
- `/src/generated/prisma` – cliente Prisma  

---

## 12. Contribuição

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