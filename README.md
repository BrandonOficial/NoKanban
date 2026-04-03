# NoKanban - Visual Studio Code Extension

<div align="center">

![NoKanban Logo](https://raw.githubusercontent.com/BrandonOficial/nokanban/main/assets/Logo.png)
[![VS Code API](https://img.shields.io/badge/VS%20Code-API-007ACC?style=for-the-badge&logo=visual-studio-code)](https://code.visualstudio.com/api)
[![Version](https://img.shields.io/badge/Versão-0.0.3-success?style=for-the-badge)](#)

**Sistema de gerenciamento de tarefas integrado ao VS Code com sincronização multi-plataforma**

[Características](#-características) • [Instalação](#-instalação) • [Arquitetura](#%EF%B8%8F-arquitetura) • [Configuração](#%EF%B8%8F-configuração) • [API](#-api-interna) • [Contribuindo](#-contribuindo)

</div>

---

## 📋 Índice

- [Visão Geral](#-visão-geral)
- [Características](#-características)
- [Arquitetura](#%EF%B8%8F-arquitetura)
- [Instalação](#-instalação)
- [Configuração](#%EF%B8%8F-configuração)
- [Uso Avançado](#-uso-avançado)
- [API Interna](#-api-interna)
- [Princípios de Design](#-princípios-de-design)
- [Desenvolvimento](#%EF%B8%8F-desenvolvimento)
- [Troubleshooting](#-troubleshooting)
- [Contribuindo](#-contribuindo)
- [Licença](#-licença)

---

## 🎯 Visão Geral

**NoKanban** é uma extensão para Visual Studio Code (e Cursor IDE) que implementa um sistema robusto de gerenciamento de tarefas diretamente na sidebar do editor. A solução foi projetada seguindo rigorosos princípios de **Clean Code**, **SOLID** e padrões modernos de arquitetura de software, oferecendo sincronização assíncrona com múltiplas plataformas.

### Por que NoKanban?

- ✅ **Zero context-switching**: Gerencie tarefas sem sair do editor.
- 🔄 **Sincronização distribuída**: Backups e Webhooks para GitHub Gist, Discord e Telegram.
- 🛡️ **Type-safe**: Base 100% tipada com TypeScript.
- 🎨 **Adaptável**: Respeita nativamente o tema e as cores do seu VS Code.
- 📦 **Safe Auto-Backup**: Versionamento local seguro isolado no `globalStorageUri`.
- 🚀 **Performance**: Operações assíncronas em background com _Fail-Fast Pattern_.

---

## ✨ Características

### Core Features

#### 🎯 Gerenciamento de Tarefas

- **CRUD completo** com interface UI/UX minimalista e intuitiva.
- **Subtarefas aninhadas** com controle independente e alinhamento visual preciso.
- **Sistema de prioridades** (High, Medium, Low) com indicadores de emojis.
- **Anotações por tarefa** com suporte a blocos de texto grandes e quebras de linha.
- **Contadores dinâmicos** no badge da extensão na Sidebar.

#### 🔄 Sincronização Multi-Plataforma

- **GitHub Gist Integration**: Autenticação via OAuth do VS Code para salvar seu Kanban de forma privada na nuvem.
- **Discord Webhooks**: Envio de relatórios formatados em Markdown visualmente ricos com hierarquia e barras de progresso.
- **Telegram Bot API**: Notificações automáticas para chats de grupo ou privados.

#### 💾 Sistema de Backup

- Backup local automático isolado em diretórios de armazenamento globais do sistema.
- Rotação automática e inteligente de arquivos antigos (mantendo os últimos N backups).
- Guard clauses rigorosas para evitar backups com payload vazio.

#### 📤 Import/Export

Formatos suportados: JSON (recomendado com metadados completos), Markdown ou Texto simples.

---

## 🏗️ Arquitetura

Para os avaliadores técnicos, este projeto não é apenas um "To-Do List". Ele foi estruturado para ser escalável e de fácil manutenção.

### Estrutura de Módulos (Clean Architecture)

```text
src/
├── extension.ts             # Entry point, dependency injection principal
├── types.ts                 # Type definitions e Interfaces
├── storage.ts               # Abstração de persistência (Memento API)
├── webviewHtml.ts           # Motor de renderização UI e HTML Modal
│
├── features/
│   ├── autoBackup.ts        # Sistema de I/O de Backup Automático local
│   ├── exportImport.ts      # Serialização e parsing de dados
│   ├── gistSync.ts          # Abstração do GitHub OAuth & API
│
├── services/
│   ├── NotificationService.ts # Unified API Service (Discord & Telegram)
│   └── messageBuilder.ts      # Construtor de relatórios e Strategy Pattern
```

### 🚀 Instalação

Via VS Code Marketplace
Pesquise por NoKanban na aba de extensões do seu editor ou instale via terminal:

```
code --install-extension nokanban-dev.nokanban
```

Manual (Development)
1- Clone o repositório:

```
git clone [https://github.com/BrandonOficial/nokanban.git](https://github.com/BrandonOficial/nokanban.git)
cd nokanban
```

2- Instale dependências e compile:

```
npm install
npm run compile
```

3- Pressione F5 no VS Code para abrir o ambiente de depuração (Extension Development Host).

### ⚙️ Configuração

A extensão gerencia as credenciais de forma inteligente: permitindo configurar os webhooks por Workspace (projetos específicos) ou Global.

Acesse o ícone de engrenagem no topo do NoKanban para injetar:

1. Discord Webhook URL

-Formato: https://discord.com/api/webhooks/...

2. Telegram Bot Token & Chat ID

-Token gerado pelo @BotFather (ex: 123456:ABC...)

-Chat ID destino (ex: -1001234567890)

3. GitHub Gist Sync

-Clique em "Conectar Conta". O VS Code cuidará do handshake do OAuth.

## Anti-Spam Mechanism

A extensão implementa um Diff Checker para evitar disparos desnecessários de API REST no background:

```
export function hasTasksChanged(state, platform, currentTasks): boolean {
  const lastState = state.get<string>(`lastSyncedState_${platform}`);
  return lastState !== JSON.stringify(currentTasks);
}
```

### 📄 Licença

MIT License

Copyright (c) 2026 Brandon

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

<div align="center">
<b>Desenvolvido com foco e Clean Code por <a href="https://github.com/BrandonOficial">Brandon</a></b>

<a href="#nokanban---visual-studio-code-extension">⬆ Voltar ao topo</a>

</div>
