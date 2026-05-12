# Changelog — SGA Project

## [Unreleased] — Modularização do módulo Users

### Contexto
O projeto estava em processo de modularização, extraindo a lógica monolítica de `server.js` para módulos separados. Autenticação, banco de dados e auditoria já haviam sido extraídos. Este ciclo completou a modularização do módulo **users**, implementando o CRUD completo.

---

### Adicionado

#### `backend/src/utils/generatePassword.js` *(novo)*
- Extração da função `generateRandomPassword()` que estava inline em `usersController.js` com um `TODO` explícito de remoção.
- Caracteres ambíguos (0/O, 1/l/I) excluídos propositalmente para facilitar leitura de senhas geradas.

#### `backend/src/utils/validators.js` *(novo)*
Centraliza todas as funções de validação de entrada do módulo users:

| Função | Descrição |
|---|---|
| `validateRequiredFields(fields, data)` | Verifica presença de campos obrigatórios; retorna mensagem descritiva ou `null` |
| `isValidEmail(email)` | Valida formato de e-mail via regex |
| `isValidRole(role)` | Verifica se o perfil está entre os 5 definidos em `constants/permissions.js` |
| `isValidUsername(username)` | 3–50 chars, letras/números/ponto/underscore |
| `isValidCPF(cpf)` | Valida CPF brasileiro: formato, dígitos verificadores e sequências inválidas |

#### `backend/src/repositories/userRepository.js` — novos métodos
| Método | SQL |
|---|---|
| `findAll({ role, is_active, search })` | `SELECT` com filtros dinâmicos, sem `password_hash`, ordenado por `full_name` |
| `update(id, fields)` | `UPDATE` dos campos editáveis + `updated_at = NOW()` |
| `updatePassword(id, hash)` | `UPDATE password_hash` + seta `must_change_password = TRUE` |
| `setActiveStatus(id, bool)` | `UPDATE is_active` |
| `deleteById(id)` | `DELETE` permanente |

#### `backend/src/services/usersService.js` — novos métodos
| Método | Descrição |
|---|---|
| `list(filters)` | Normaliza query params (ex.: `is_active` string → boolean) e chama `findAll` |
| `getById(id)` | Retorna usuário sanitizado (sem `password_hash`); lança 404 se não encontrado |
| `update(id, data, ...)` | Preserva campos omitidos via `??`, checa unicidade de e-mail se alterado, loga `user_updated` |
| `resetPassword(id, ...)` | Gera senha aleatória, faz hash bcrypt, seta `must_change_password`, loga `user_password_reset` |
| `activate(id, ...)` | Seta `is_active = true`, loga `user_activated` |
| `deactivate(id, ...)` | Seta `is_active = false`, loga `user_deactivated` |
| `remove(id, ...)` | Verifica existência (404), deleta, loga `user_deleted` |

Todas as operações de escrita registram entrada na tabela `audit_logs`.

#### `backend/src/controllers/usersController.js` — alterações
- Handler `list` implementado (estava vazio).
- Handlers adicionados: `getById`, `update`, `resetPassword`, `activate`, `deactivate`, `remove`.
- Validações de entrada via `validators.js` aplicadas em `register` e `update`:
  - campos obrigatórios, formato de e-mail, role válido, CPF (se informado).
- `generateRandomPassword` removido do controller e substituído por import de `utils/generatePassword.js`.

#### `backend/src/routes/usersRoute.js` — alterações
- `GET /list` substituído por `GET /` (REST idiomático, alinhado com o frontend).
- Middleware `adminOnly` extraído como variável local para evitar repetição.
- Rotas adicionadas:

| Método | Rota | Handler |
|---|---|---|
| `GET` | `/` | `list` |
| `GET` | `/:id` | `getById` |
| `PUT` | `/:id` | `update` |
| `PATCH` | `/:id/reset-password` | `resetPassword` |
| `PATCH` | `/:id/activate` | `activate` |
| `PATCH` | `/:id/deactivate` | `deactivate` |
| `DELETE` | `/:id` | `remove` |

#### `frontend/src/services/userService.ts` — alterações
- `getUsers()`: URL corrigida para `GET /users` (alinhada com nova rota); resposta ajustada de `response.data` para `response.data.users`; aceita `UserListFilters` como parâmetro opcional.
- `registerUser()`: tipo de retorno corrigido para `{ user, generatedPassword? }`.
- Funções adicionadas: `getUserById`, `resetUserPassword`, `activateUser`, `deactivateUser`.
- Interfaces exportadas: `UserListFilters`, `ResetPasswordResponse`.

#### `frontend/src/App.tsx` — correção de bug
- `fetchUsers`: tipo da resposta axios corrigido de `User[]` para `{ users: User[] }` e extração de `response.data.users` — corrigia `TypeError: users.map is not a function` na aba Configurações.

---

### Removido

#### `backend/src/server.js`
- Removidos ~19.000 linhas de código comentado (monólito legado em processo de extração).
- Arquivo agora contém apenas a função `startServer()` ativa (17 linhas).

---

### Testes realizados (fluxo manual via HTTP)

| # | Operação | Endpoint | Resultado |
|---|---|---|---|
| 1 | Login | `POST /api/auth/login` | ✅ Token JWT retornado |
| 2 | Listar usuários | `GET /api/users` | ✅ Array com usuários existentes |
| 3 | Criar usuário | `POST /api/users/register` | ✅ Usuário criado com senha gerada |
| 4 | Buscar por ID | `GET /api/users/:id` | ✅ Usuário retornado |
| 5 | Atualizar | `PUT /api/users/:id` | ✅ Campos atualizados |
| 6 | Desativar | `PATCH /api/users/:id/deactivate` | ✅ `is_active = false` |
| 7 | Ativar | `PATCH /api/users/:id/activate` | ✅ `is_active = true` |
| 8 | Reset de senha | `PATCH /api/users/:id/reset-password` | ✅ Nova senha gerada e `must_change_password = true` |
| 9 | Deletar | `DELETE /api/users/:id` | ✅ Usuário removido |
| 10 | 404 pós-delete | `GET /api/users/:id` | ✅ HTTP 404 |
| 11 | Validação e-mail | `POST /api/users/register` | ✅ HTTP 400 com e-mail inválido |
| 12 | Validação role | `POST /api/users/register` | ✅ HTTP 400 com role inválido |
