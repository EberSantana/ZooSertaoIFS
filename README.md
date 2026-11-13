# ZooSertão IFS — Estudo Gamificado em Zootecnia

[![GitHub Pages](https://img.shields.io/badge/Deploy-GitHub%20Pages-157A42?logo=github)](../../actions/workflows/deploy-pages.yml)
[![React](https://img.shields.io/badge/React-19-20232A?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite PWA](https://img.shields.io/badge/PWA-Offline%20Ready-5A0FC8?logo=vite&logoColor=white)](https://vite-plugin-pwa.netlify.app/)

Ambiente web gamificado e **aplicativo instalável (PWA)** desenvolvido para apoiar os estudantes do **Curso Técnico de Nível Médio em Zootecnia na Forma Integrada** do **Instituto Federal de Sergipe (IFS) — Campus Poço Redondo**, no Alto Sertão Sergipano.

Todo o conteúdo pedagógico, carga horária, instalações didáticas e contexto regional é fundamentado no **Projeto Pedagógico do Curso (PPC)** oficial (**Resolução CS/IFS Nº 352, de 28 de novembro de 2025**).

---

## Sumário

- [Visão Geral e Proposta Pedagógica](#visão-geral-e-proposta-pedagógica)
- [Funcionalidades](#funcionalidades)
- [Uso no Celular como App (PWA)](#uso-no-celular-como-app-pwa)
- [Stack Tecnológica](#stack-tecnológica)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Execução Local e Testes](#execução-local-e-testes)
- [Publicação no GitHub Pages](#publicação-no-github-pages)
- [Referência Institucional](#referência-institucional)

---

## Visão Geral e Proposta Pedagógica

O **ZooSertão IFS** transforma a matriz curricular do curso integrado em uma jornada de estudos ativa, adaptada tanto para computadores em laboratório quanto para smartphones em campo ou em casa — inclusive sem conexão constante com a internet.

### Destaques do PPC contemplados
- **44 disciplinas obrigatórias** distribuídas nos **3 anos** do Ensino Médio Integrado (**3.300,9 horas**), acrescidas de **100 horas de Prática Profissional Integrada (PPI)** (**3.400,9h totais**).
- Contextualização direta com a realidade produtiva de **Poço Redondo e do Alto Sertão Sergipano** (bacia leiteira com **65,2 milhões de litros/ano**, **14.970 vacas ordenhadas**, caprinovinocultura, caatinga, comunidades quilombolas e assentamentos rurais).
- Alinhamento com os espaços de prática do campus: **Campo Agrostológico**, **Aprisco (Ovinos e Caprinos)**, **Galinha de Capoeira**, **Bovinocultura** e **Apicultura**.

---

## Funcionalidades

### 1. Painel Inicial Gamificado (`Início`)
- Sistema de **XP**, **níveis progressivos**, **ofensiva diária**, **combos** e **medalhas de conquista**.
- Persistência automática do progresso no navegador (`localStorage`), sem necessidade de login.
- Atalhos rápidos por ano letivo (1º, 2º e 3º Ano) e painel com indicadores produtivos do município e o plantel animal oficial (Tabela 1 do PPC).

### 2. Flashcards com Repetição Espaçada (`Flashcards`)
- **24 cartões** organizados por ano e disciplina do PPC.
- Algoritmo de revisão espaçada baseado em **SM-2** com 3 níveis de autoavaliação (*Difícil*, *Bom* e *Fácil*), atualização de intervalo e contagem de cartões dominados.
- Filtro por ano, disciplina e embaralhamento rápido.

### 3. Quiz de Múltipla Escolha (`Quiz`)
- **20 questões** inéditas sobre manejo animal, forragicultura, sanidade, anatomia, zootecnia no Semiárido e organização do curso.
- Feedback pedagógico imediato após cada resposta, multiplicador de combo e resumo de desempenho ao concluir a rodada.

### 4. Hub de Atividades Lúdicas (`Lúdico`)
- **Conexão Zootécnica**: associação de pares entre conceitos técnicos, espécies, manejos e instalações do campus.
- **Desafio do Curralinho**: simulador interativo com ajustes de relação volumoso/concentrado, oferta hídrica e conforto térmico para cenários reais do Semiárido (seca no Alto Sertão, vaca leiteira em pico de lactação e caprinos nativos).
- **Classificador do Campus**: desafio rápido de categorização entre os setores produtivos e didáticos do Campus Poço Redondo.

### 5. Explorador da Matriz PPC (`Matriz PPC`)
- Consulta completa das **44 disciplinas obrigatórias** com filtros por **Ano**, **Núcleo** (*Básico*, *Tecnológico* e *Articulador*) e busca textual.
- Modal detalhado exibindo carga horária em horas e total de aulas (teóricas e práticas), ementa, ênfase tecnológica e integração interdisciplinar.

---

## Uso no Celular como App (PWA)

O aplicativo foi configurado com **Progressive Web App (PWA)** via `vite-plugin-pwa` e Workbox:
- **Cache offline** automático dos assets, fontes e conteúdo de estudo após o primeiro acesso.
- **Indicador de modo offline** exibido discretamente quando o aparelho perde conexão.
- **Instalação no Android (Chrome/Edge)**: toque no botão **Instalar App** no topo ou no menu do navegador em *Instalar aplicativo* / *Adicionar à tela inicial*.
- **Instalação no iPhone/iPad (Safari)**: toque em **Compartilhar** e selecione **Adicionar à Tela de Início** (há um guia interativo integrado na interface).

---

## Stack Tecnológica

| Camada | Tecnologia |
| --- | --- |
| Interface | [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) |
| Estilização | [Tailwind CSS v4](https://tailwindcss.com/) |
| Ícones & Animações | [Lucide React](https://lucide.dev/) + [Motion](https://motion.dev/) |
| Build & Empacotamento | [Vite](https://vite.dev/) |
| PWA & Offline | [vite-plugin-pwa](https://vite-plugin-pwa.netlify.app/) (Workbox) |
| Testes Unitários | `node:test` executado via [`tsx`](https://tsx.is/) |
| CI/CD | GitHub Actions (`deploy-pages.yml`) |

---

## Estrutura do Projeto

```text
.
├── .github/workflows/
│   └── deploy-pages.yml         # Pipeline automático de testes, build e deploy no GitHub Pages
├── public/
│   ├── assets/aistudio/         # Documento oficial do PPC utilizado como referência
│   ├── apple-touch-icon.png     # Ícone iOS (180x180)
│   ├── icon.svg                 # Ícone vetorial do app
│   ├── pwa-192x192.png          # Ícone PWA padrão
│   ├── pwa-512x512.png          # Ícone PWA alta resolução
│   └── pwa-maskable-512x512.png # Ícone PWA adaptável (safe zone)
├── src/
│   ├── components/
│   │   ├── DashboardView.tsx    # Painel inicial, níveis, plantel e atalhos
│   │   ├── FlashcardsView.tsx   # Revisão espaçada 3D
│   │   ├── LudicHubView.tsx     # Jogos educativos e simulador do semiárido
│   │   ├── MobileBottomNav.tsx  # Navegação inferior mobile
│   │   ├── PpcExplorerView.tsx  # Matriz das 44 disciplinas + PPI
│   │   ├── PWAInstallUI.tsx     # Botão de instalação e indicador offline
│   │   ├── QuizView.tsx         # Simulado com feedback pedagógico
│   │   └── TopNav.tsx           # Cabeçalho responsivo
│   ├── data/
│   │   ├── ppcData.ts           # Dados oficiais extraídos do PPC (disciplinas, plantel, campus)
│   │   └── studyContent.ts      # Flashcards, questões, pares, cenários e classificações
│   ├── hooks/
│   │   ├── useOnlineStatus.ts   # Detecção de conectividade
│   │   └── usePWAInstall.ts     # Gerenciamento do prompt de instalação PWA
│   ├── utils/
│   │   ├── gamification.ts      # Regras puras de XP, níveis, SM-2, medalhas e simulador
│   │   └── gamification.test.ts # Suíte de testes unitários
│   ├── App.tsx
│   ├── index.css
│   └── main.tsx
├── index.html
├── package.json
└── vite.config.ts               # Configuração Vite + base dinâmica + Manifesto PWA
```

---

## Execução Local e Testes

### Pré-requisitos
- **Node.js 20+** (recomendado Node 22)
- **npm**

### Passos

```bash
# 1. Instalar dependências
npm install

# 2. Iniciar servidor de desenvolvimento (porta 3000)
npm run dev

# 3. Verificar tipagem TypeScript
npm run lint

# 4. Executar testes unitários de gamificação e repetição espaçada
npm test

# 5. Gerar build de produção
npm run build
```

Para testar localmente simulando um subcaminho do GitHub Pages (por exemplo `/zoosertao-ifs/`):

```bash
VITE_BASE_PATH=/zoosertao-ifs/ npm run build
npx vite preview --port 4173
```

---

## Publicação no GitHub Pages

Este repositório já inclui o fluxo automatizado em `.github/workflows/deploy-pages.yml`, configurado para ajustar automaticamente o subcaminho do repositório (`VITE_BASE_PATH`), o manifesto PWA e o fallback `404.html`.

### Passo a passo para publicar

1. **Crie um repositório no GitHub** (ex.: `zoosertao-ifs`).
2. **Envie os arquivos para o ramo `main`**:
   ```bash
   git init
   git add .
   git commit -m "feat: ambiente gamificado ZooSertão IFS e configuração GitHub Pages"
   git branch -M main
   git remote add origin https://github.com/SEU_USUARIO/zoosertao-ifs.git
   git push -u origin main
   ```
3. **Ative o GitHub Pages no repositório**:
   - Acesse **Settings** → **Pages** no seu repositório do GitHub.
   - Em **Build and deployment** → **Source**, selecione **GitHub Actions**.
4. **Acompanhe o deploy**:
   - Na aba **Actions**, o workflow **Publicar no GitHub Pages** executará `npm run lint`, `npm test`, `npm run build` e publicará o site automaticamente.
   - Ao final, o endereço público (`https://SEU_USUARIO.github.io/zoosertao-ifs/`) aparecerá diretamente na aba **Actions** e em **Settings → Pages**.

---

## Referência Institucional

- **Instituição**: Instituto Federal de Educação, Ciência e Tecnologia de Sergipe (**IFS**) — **Campus Poço Redondo**
- **Endereço**: Rodovia SE 206, S/N · Poço Redondo/SE · Alto Sertão Sergipano
- **Documento Base**: Resolução CS/IFS Nº 352, de 28 de novembro de 2025 (PPC do Curso Técnico de Nível Médio em Zootecnia na Forma Integrada).

> Projeto desenvolvido para fins educacionais e apoio pedagógico aos estudantes e docentes do curso.
