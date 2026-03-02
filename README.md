# NoKanban - Visual Studio Code Extension

<div align="center">

![NoKanban Logo](https://img.shields.io/badge/NoKanban-Task%20Management-blue?style=for-the-badge)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![VS Code API](https://img.shields.io/badge/VS%20Code-API-007ACC?style=for-the-badge&logo=visual-studio-code)](https://code.visualstudio.com/api)

**Sistema de gerenciamento de tarefas integrado ao VS Code com sincronização multi-plataforma**

[Características](#características) • [Instalação](#instalação) • [Arquitetura](#arquitetura) • [Configuração](#configuração) • [API](#api-interna) • [Contribuindo](#contribuindo)

</div>

---

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Características](#características)
- [Arquitetura](#arquitetura)
- [Instalação](#instalação)
- [Configuração](#configuração)
- [Uso Avançado](#uso-avançado)
- [API Interna](#api-interna)
- [Princípios de Design](#princípios-de-design)
- [Desenvolvimento](#desenvolvimento)
- [Troubleshooting](#troubleshooting)
- [Roadmap](#roadmap)
- [Contribuindo](#contribuindo)
- [Licença](#licença)

---

## 🎯 Visão Geral

**NoKanban** é uma extensão para Visual Studio Code e Cursor IDE que implementa um sistema robusto de gerenciamento de tarefas diretamente na sidebar do editor. A solução foi projetada seguindo princípios de **Clean Code**, **SOLID** e padrões modernos de arquitetura, oferecendo sincronização em tempo real com múltiplas plataformas.

### Por que NoKanban?

- ✅ **Zero context-switching**: Gerencie tarefas sem sair do editor
- 🔄 **Sincronização distribuída**: GitHub Gist, Discord, Telegram
- 🛡️ **Type-safe**: Totalmente tipado com TypeScript
- 🎨 **Adaptável**: Respeita o tema do VS Code
- 📦 **Backup automático**: Sistema de versionamento local integrado
- 🚀 **Performance**: Operações assíncronas com fail-fast pattern

---

## ✨ Características

### Core Features

#### 🎯 Gerenciamento de Tarefas
- **CRUD completo** de tarefas com interface intuitiva
- **Subtarefas aninhadas** com controle independente de estado
- **Sistema de prioridades** (High, Medium, Low) com indicadores visuais
- **Anotações por tarefa** com suporte a markdown
- **Filtros e busca** em tempo real
- **Contadores dinâmicos** no badge da sidebar

#### 🔄 Sincronização Multi-Plataforma

##### GitHub Gist Integration
```typescript
// Autenticação via OAuth do VS Code
// Criação/atualização automática de Gist privado
// Versionamento nativo do GitHub
```

##### Discord Webhooks
```typescript
// Envio de relatórios formatados
// Suporte a markdown nativo do Discord
// Anti-spam com verificação de mudanças
```

##### Telegram Bot API
```typescript
// Notificações em HTML formatado
// Chat ID customizável
// Background sync silencioso
```

#### 💾 Sistema de Backup

```typescript
interface BackupConfig {
  enabled: boolean;
  intervalMinutes: number;  // Padrão: 30 minutos
  maxBackups: number;       // Padrão: 10 arquivos
  location: ".nokanban-backups/"; // Workspace ou global
}
```

**Características do Backup:**
- Backup automático a cada N minutos (configurável)
- Rotação automática de arquivos antigos
- Formato JSON versionado
- Timestamp ISO 8601 nos nomes de arquivo
- Guard clause para evitar backups vazios

#### 📤 Import/Export

Formatos suportados:
- **JSON** (recomendado): Preserva metadados completos
- **Markdown**: Formato legível para humanos
- **TXT**: Formato simples para compatibilidade

---

## 🏗️ Arquitetura

### Estrutura de Módulos

```
src/
├── extension.ts              # Entry point, dependency injection
├── types.ts                  # Type definitions centralizadas
├── storage.ts                # Abstração do Memento API
├── webviewHtml.ts           # UI Component (Webview)
│
├── features/
│   ├── autoBackup.ts        # Backup automático local
│   ├── exportImport.ts      # Serialização de dados
│   ├── gistSync.ts          # GitHub OAuth & API
│   ├── discordSync.ts       # Discord Webhooks
│   └── telegramSync.ts      # Telegram Bot API
│
├── services/
│   ├── NotificationService.ts   # Unified notification layer
│   └── messageBuilder.ts        # Formatação multi-plataforma
│
└── utils/
    └── sanitize.ts          # XSS prevention
```

### Design Patterns Implementados

#### 1. **Strategy Pattern** - Message Formatters
```typescript
interface ChatFormatter {
  bold(text: string): string;
  strike(text: string): string;
  italic(text: string): string;
  escape(text: string): string;
  quotePrefix: string;
}

// Implementações específicas para Discord, Telegram, etc.
const discordFormatter: ChatFormatter = { /* ... */ };
const telegramFormatter: ChatFormatter = { /* ... */ };
```

#### 2. **Repository Pattern** - Storage Abstraction
```typescript
export function getSavedTasks(state: vscode.Memento): Task[] {
  return state.get<Task[]>("todoList", []) ?? [];
}

export async function saveSyncState(
  state: vscode.Memento,
  platform: "discord" | "telegram",
  tasks: Task[]
): Promise<void> {
  const snapshot = JSON.stringify(tasks);
  await state.update(`lastSyncedState_${platform}`, snapshot);
}
```

#### 3. **Factory Pattern** - Webview Content Generation
```typescript
export function getWebviewContent(params: WebviewContentParams): string {
  // Gera HTML dinamicamente com state injection seguro
  // Previne XSS via sanitization
  // Respeita CSP do VS Code
}
```

#### 4. **Observer Pattern** - Webview Communication
```typescript
// Extension → Webview
webview.postMessage({ command: "updateTasks", tasks: [...] });

// Webview → Extension
webview.onDidReceiveMessage((data) => {
  this._handleWebviewMessage(data);
});
```

### Fluxo de Dados

```
User Action → Webview → Extension Host → Command Router
                                              ↓
                ┌─────────────────────────────┼─────────────────────┐
                ↓                             ↓                     ↓
         Memento Storage              GitHub API           Discord/Telegram
                ↓                             ↓                     ↓
          Auto Backup                   Gist Update         Channel Message
                ↓
        .nokanban-backups/
                ↓
          Badge Update → Webview
```

---

## 🚀 Instalação

### Via Marketplace
```bash
# Em breve
code --install-extension publisher.nokanban
```

### Manual (Development)

1. **Clone o repositório:**
```bash
git clone https://github.com/your-username/nokanban.git
cd nokanban
```

2. **Instale dependências:**
```bash
npm install
# ou
yarn install
```

3. **Compile o TypeScript:**
```bash
npm run compile
# ou
npm run watch  # para desenvolvimento
```

4. **Debug no VS Code:**
   - Pressione `F5` para abrir uma nova janela do VS Code com a extensão carregada
   - Ou use o comando `Developer: Reload Window` após mudanças

### Dependências

```json
{
  "engines": {
    "vscode": "^1.85.0"
  },
  "devDependencies": {
    "@types/vscode": "^1.85.0",
    "@types/node": "^20.x",
    "typescript": "^5.3.0"
  }
}
```

---

## ⚙️ Configuração

### Configurações do Workspace

#### GitHub Gist
1. Use o comando `NoKanban: Autenticar GitHub`
2. Autorize a extensão via OAuth
3. Escopo `gist` será automaticamente solicitado

#### Discord Webhook
```json
{
  "nokanban.discordWebhookUrl": "https://discord.com/api/webhooks/YOUR_WEBHOOK_ID/YOUR_WEBHOOK_TOKEN"
}
```

**Como obter o Webhook:**
1. Discord → Configurações do Servidor → Integrações
2. Webhooks → Novo Webhook
3. Copie a URL do Webhook

#### Telegram Bot
```json
{
  "nokanban.telegramBotToken": "123456789:ABCdefGHIjklMNOpqrsTUVwxyz",
  "nokanban.telegramChatId": "-1001234567890"
}
```

**Como obter as credenciais:**
1. Telegram → [@BotFather](https://t.me/botfather)
2. `/newbot` e siga instruções
3. Copie o token fornecido
4. Para Chat ID:
   - Adicione o bot ao grupo/canal
   - Envie mensagem de teste
   - Acesse: `https://api.telegram.org/bot<TOKEN>/getUpdates`
   - Procure por `"chat":{"id":-1234...}`

#### Auto Backup
```json
{
  "nokanban.autoBackupEnabled": true,
  "nokanban.autoBackupInterval": 30
}
```

### Configuração Global vs Workspace

A extensão salva credenciais de forma inteligente:
- **Workspace ativo**: Configurações no `.vscode/settings.json`
- **Sem workspace**: Configurações globais do VS Code

```typescript
const target = hasWorkspace
  ? vscode.ConfigurationTarget.Workspace
  : vscode.ConfigurationTarget.Global;
```

---

## 🎓 Uso Avançado

### Comandos da Paleta

| Comando | Atalho | Descrição |
|---------|--------|-----------|
| `NoKanban: Limpar Todas as Tarefas` | - | Remove todas as tarefas e notas |
| `NoKanban: Exportar Dados` | - | Salva tarefas em JSON/MD/TXT |
| `NoKanban: Importar Dados` | - | Carrega tarefas de arquivo JSON |
| `NoKanban: Enviar para Discord` | - | Sincronização manual do Discord |
| `NoKanban: Enviar para Telegram` | - | Sincronização manual do Telegram |
| `NoKanban: Push para Gist` | - | Upload manual para GitHub |
| `NoKanban: Pull do Gist` | - | Download manual do GitHub |
| `NoKanban: Enviar Report` | - | Notificação unificada para todas plataformas |

### Formato de Exportação JSON

```json
{
  "version": "2.0",
  "exportedAt": "2025-06-15T10:30:00.000Z",
  "tasks": [
    {
      "text": "Implementar autenticação",
      "done": false,
      "priority": "high",
      "note": "Usar OAuth 2.0",
      "isExpanded": true,
      "isNoteExpanded": false,
      "subtasks": [
        {
          "text": "Configurar provider",
          "done": true
        },
        {
          "text": "Implementar refresh token",
          "done": false
        }
      ]
    }
  ]
}
```

### Anti-Spam Mechanism

A extensão implementa verificação de mudanças para evitar sincronizações desnecessárias:

```typescript
export function hasTasksChanged(
  state: vscode.Memento,
  platform: "discord" | "telegram",
  currentTasks: Task[]
): boolean {
  const lastState = state.get<string>(`lastSyncedState_${platform}`);
  const currentState = JSON.stringify(currentTasks);
  return lastState !== currentState;
}
```

**Comportamento:**
- ✅ Sincronização manual: Sempre executa
- ⚡ Sincronização automática: Apenas se houver mudanças
- 🔄 Background sync: A cada N minutos (configurável)

---

## 🔌 API Interna

### Type Definitions

```typescript
interface Task {
  text: string;
  done: boolean;
  priority?: "high" | "medium" | "low";
  note?: string;
  isExpanded?: boolean;
  isNoteExpanded?: boolean;
  subtasks?: Subtask[];
}

interface Subtask {
  text: string;
  done: boolean;
}

interface StorageData {
  todoList: Task[];
}
```

### Storage API

```typescript
// Leitura
const tasks = getSavedTasks(state);

// Escrita
await state.update("todoList", tasks);

// Verificação de mudanças
const changed = hasTasksChanged(state, "discord", tasks);

// Snapshot para comparação
await saveSyncState(state, "discord", tasks);
```

### Message Builder API

```typescript
const message = buildUnifiedSummary(tasks, formatter);

// Retorna:
// 📅 Status Report do Projeto - 15/06/2025
// 📊 Progresso: [████████░░] 80% (8/10 tarefas)
//
// 📌 PENDÊNCIAS:
// > 🔴 [ ] Tarefa crítica
// > 🟡 [ ] Tarefa média
// ...
```

### Notification Service

```typescript
class NotificationService {
  constructor() {
    // Injeção automática de dependências via vscode.workspace.getConfiguration
  }

  public async sendProjectStatus(message: string): Promise<void> {
    // Dispara requisições em paralelo
    await Promise.all([
      this.notifyDiscord(message),
      this.notifyTelegram(message)
    ]);
  }
}
```

---

## 🎨 Princípios de Design

### Clean Code Practices

#### 1. Guard Clauses
```typescript
export async function performAutoBackup(state: vscode.Memento): Promise<void> {
  const tasks = getSavedTasks(state);
  
  // Early return para casos inválidos
  if (!tasks || tasks.length === 0) {
    return;
  }
  
  // Lógica principal apenas se necessário
  await createBackup(tasks);
}
```

#### 2. Single Responsibility Principle
Cada módulo tem uma responsabilidade clara:
- `storage.ts` → Persistência de dados
- `messageBuilder.ts` → Formatação de mensagens
- `gistSync.ts` → Integração GitHub
- `NotificationService.ts` → Envio de notificações

#### 3. Dependency Injection
```typescript
constructor(
  private readonly _globalState: vscode.Memento,
  private readonly _workspaceState: vscode.Memento
) {
  // Estados injetados, não criados internamente
}
```

#### 4. Fail-Fast Pattern
```typescript
private async notifyDiscord(message: string): Promise<void> {
  if (!this.discordWebhookUrl) {
    console.warn("NoKanban: Discord Webhook URL não configurada.");
    return; // Falha rápida sem exceções
  }
  
  try {
    await fetch(/* ... */);
  } catch (error) {
    console.error("NoKanban: Erro ao enviar para Discord", error);
  }
}
```

#### 5. Type Safety
```typescript
// Tipagem estrita em toda a codebase
export type NotifyView = (
  command: string,
  data?: Record<string, unknown>
) => void;

// Uso de enums para valores fixos
platform: "discord" | "telegram"
```

### Security Best Practices

#### XSS Prevention
```typescript
export function sanitizeForJson(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r")
    .replace(/\t/g, "\\t");
}
```

#### CSP Compliance
```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'none'; 
               style-src ${webview.cspSource} 'unsafe-inline'; 
               script-src ${webview.cspSource};">
```

---

## 🛠️ Desenvolvimento

### Estrutura do Projeto

```bash
nokanban/
├── .vscode/
│   ├── launch.json          # Debug configurations
│   └── tasks.json           # Build tasks
├── src/
│   ├── extension.ts         # Main entry point
│   ├── types.ts             # Type definitions
│   ├── storage.ts           # Storage utilities
│   ├── webviewHtml.ts       # UI component
│   ├── autoBackup.ts        # Backup feature
│   ├── exportImport.ts      # Data serialization
│   ├── gistSync.ts          # GitHub integration
│   ├── discordSync.ts       # Discord integration
│   ├── telegramSync.ts      # Telegram integration
│   ├── messageBuilder.ts    # Message formatting
│   └── NotificationService.ts # Notification layer
├── package.json             # Extension manifest
├── tsconfig.json            # TypeScript config
└── README.md                # Este arquivo
```

### Scripts NPM

```json
{
  "scripts": {
    "vscode:prepublish": "npm run compile",
    "compile": "tsc -p ./",
    "watch": "tsc -watch -p ./",
    "lint": "eslint src --ext ts",
    "test": "node ./out/test/runTest.js"
  }
}
```

### Workflow de Debug

1. **Abra o projeto no VS Code**
2. **Pressione F5** ou use `Run > Start Debugging`
3. **Uma nova janela do VS Code abrirá** com a extensão carregada
4. **Defina breakpoints** no código TypeScript
5. **Interaja com a extensão** para ativar os breakpoints

### Testes

```typescript
// TODO: Implementar testes unitários
// Cobertura desejada:
// - storage.ts: 100%
// - messageBuilder.ts: 100%
// - Integrações: Mocks das APIs externas
```

---

## 🐛 Troubleshooting

### Problemas Comuns

#### Sincronização GitHub não funciona
```
Erro: Token inválido ou expirado
```
**Solução:**
1. Desconecte do Gist via comando
2. Reconecte usando `NoKanban: Autenticar GitHub`
3. Verifique se o escopo `gist` foi autorizado

#### Discord/Telegram não recebe mensagens
```
Erro: Webhook/Bot não configurado
```
**Solução:**
1. Verifique se as configurações estão no escopo correto (Workspace vs Global)
2. Teste as credenciais manualmente via curl:
```bash
# Discord
curl -X POST "YOUR_WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d '{"content":"Teste"}'

# Telegram
curl "https://api.telegram.org/botYOUR_TOKEN/sendMessage?chat_id=YOUR_CHAT_ID&text=Teste"
```

#### Backup automático não está funcionando
**Checklist:**
- [ ] `autoBackupEnabled` está `true`?
- [ ] O intervalo está configurado corretamente?
- [ ] Há tarefas no sistema? (Guard clause previne backups vazios)
- [ ] Verifique a pasta `.nokanban-backups/` no workspace

### Logs e Debug

```typescript
// Console logs disponíveis em:
// View → Output → NoKanban

console.log("NoKanban: Operação iniciada");
console.error("NoKanban: Erro ao executar", error);
```

---

## 🗺️ Roadmap

### v1.1.0 - Performance & Polish
- [ ] Lazy loading de tarefas (virtualização)
- [ ] Debounce na busca/filtros
- [ ] Testes unitários com 80%+ cobertura
- [ ] Telemetria anônima opcional

### v1.2.0 - Collaboration
- [ ] Real-time sync via WebSockets
- [ ] Comentários em tarefas
- [ ] Atribuição de responsáveis
- [ ] Activity feed

### v1.3.0 - Advanced Features
- [ ] Gantt chart visualization
- [ ] Time tracking integrado
- [ ] Drag & drop para reordenação
- [ ] Tags customizáveis
- [ ] Filtros avançados (regex, saved filters)

### v2.0.0 - Enterprise
- [ ] API REST para integrações
- [ ] Webhooks customizáveis
- [ ] SSO / LDAP support
- [ ] Audit logs
- [ ] Multi-workspace support

---

## 🤝 Contribuindo

Contribuições são muito bem-vindas! Por favor, siga estas diretrizes:

### Como Contribuir

1. **Fork o repositório**
2. **Crie uma branch** para sua feature (`git checkout -b feature/AmazingFeature`)
3. **Commit suas mudanças** (`git commit -m 'feat: Add some AmazingFeature'`)
4. **Push para a branch** (`git push origin feature/AmazingFeature`)
5. **Abra um Pull Request**

### Convenções de Commit

Seguimos [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: Adiciona nova funcionalidade
fix: Corrige um bug
docs: Atualiza documentação
style: Formatação, ponto e vírgula, etc
refactor: Refatoração de código
test: Adiciona ou corrige testes
chore: Tarefas de manutenção
```

### Code Style

- **TypeScript strict mode** ativado
- **ESLint** configurado
- **Prettier** para formatação automática
- **2 spaces** de indentação
- **Single quotes** para strings
- **Trailing commas** em objetos/arrays

### Pull Request Checklist

- [ ] Código segue o style guide do projeto
- [ ] Testes foram adicionados/atualizados
- [ ] Documentação foi atualizada
- [ ] Commit messages seguem convenção
- [ ] Build passa sem erros (`npm run compile`)
- [ ] Sem warnings do ESLint

---

## 📄 Licença

MIT License

Copyright (c) 2025 [Your Name]

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

---

## 🙏 Agradecimentos

- **VS Code Team** - Pela excelente API de extensões
- **TypeScript Team** - Por tornar JavaScript escalável
- **Comunidade Open Source** - Por todo o conhecimento compartilhado

---

## 📞 Contato

- **Issues**: [GitHub Issues](https://github.com/your-username/nokanban/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-username/nokanban/discussions)
- **Email**: your-email@example.com
- **Twitter**: [@yourhandle](https://twitter.com/yourhandle)

---

<div align="center">

**Feito com ❤️ e TypeScript**

[⬆ Voltar ao topo](#nokanban---visual-studio-code-extension)

</div>
