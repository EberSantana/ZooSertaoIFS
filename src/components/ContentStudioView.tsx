import React, { useMemo, useRef, useState } from 'react';
import {
  CheckCircle2,
  Download,
  Eye,
  FileSpreadsheet,
  FileText,
  FolderPlus,
  Gamepad2,
  Layers,
  ListChecks,
  Plus,
  Search,
  Trash2,
  Upload,
} from 'lucide-react';
import { DISCIPLINAS_PPC, type DisciplinaPPC } from '../data/ppcData';
import {
  MATCH_DECKS,
  type ClassifierItem,
  type FlashcardItem,
  type MatchDeck,
  type QuizQuestion,
} from '../data/studyContent';
import {
  createCustomId,
  deleteFileBlob,
  exportCustomContentBundle,
  formatFileSize,
  getDisciplineInventory,
  importCustomContentBundle,
  parseSpreadsheetRowsToFlashcards,
  parseSpreadsheetRowsToQuiz,
  parseTextLinesToFlashcards,
  type CustomContentState,
  type CustomTopic,
  type CustomTopicType,
  type DisciplineAttachment,
} from '../utils/customContentStore';
import {
  downloadSpreadsheetTemplate,
  processUploadedDisciplineFile,
} from '../utils/fileParsers';
import { AttachmentReaderModal } from './AttachmentReaderModal';

export type StudioMode = 'assunto' | 'flashcard' | 'quiz' | 'ludico';

interface ContentStudioViewProps {
  customContent: CustomContentState;
  initialDisciplineId?: string;
  initialMode?: StudioMode;
  onAddTopic: (topic: CustomTopic) => void;
  onDeleteTopic: (topicId: string) => void;
  onAddFlashcards: (cards: FlashcardItem[]) => void;
  onDeleteFlashcard: (cardId: string) => void;
  onAddQuizQuestions: (questions: QuizQuestion[]) => void;
  onDeleteQuizQuestion: (questionId: string) => void;
  onAddMatchDeck: (deck: MatchDeck) => void;
  onDeleteMatchDeck: (deckId: string) => void;
  onAddClassifierItem: (item: ClassifierItem) => void;
  onDeleteClassifierItem: (itemId: string) => void;
  onReplaceAllCustomContent: (next: CustomContentState) => void;
}

const CAMPUS_CATEGORIES: ClassifierItem['categoriaCorreta'][] = [
  'Campo Agrostológico',
  'Aprisco & Ruminantes',
  'Monogástricos & Apoio',
  'Gestão & Extensão',
];

type DisciplineCoverageFilter = 'Todas' | 'ComAtividades' | 'SemAtividades';

export const ContentStudioView: React.FC<ContentStudioViewProps> = ({
  customContent,
  initialDisciplineId,
  initialMode = 'assunto',
  onAddTopic,
  onDeleteTopic,
  onAddFlashcards,
  onDeleteFlashcard,
  onAddQuizQuestions,
  onDeleteQuizQuestion,
  onAddMatchDeck,
  onDeleteMatchDeck,
  onAddClassifierItem,
  onDeleteClassifierItem,
  onReplaceAllCustomContent,
}) => {
  const [mode, setMode] = useState<StudioMode>(initialMode);
  const [selectedYear, setSelectedYear] = useState<1 | 2 | 3 | 'Todos'>('Todos');
  const [coverageFilter, setCoverageFilter] = useState<DisciplineCoverageFilter>('Todas');
  const [discSearch, setDiscSearch] = useState('');
  const [selectedDiscId, setSelectedDiscId] = useState<string>(
    initialDisciplineId || DISCIPLINAS_PPC[0].id
  );
  const [listScope, setListScope] = useState<'disciplina' | 'curso'>('disciplina');
  const [statusBanner, setStatusBanner] = useState<{ kind: 'ok' | 'err'; text: string } | null>(
    null
  );
  const [previewAttachment, setPreviewAttachment] = useState<DisciplineAttachment | null>(null);

  React.useEffect(() => {
    if (initialDisciplineId) {
      setSelectedDiscId(initialDisciplineId);
      const found = DISCIPLINAS_PPC.find((d) => d.id === initialDisciplineId);
      if (found) setSelectedYear(found.ano);
    }
  }, [initialDisciplineId]);

  React.useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  const inventoryById = useMemo(() => {
    const map = new Map<string, ReturnType<typeof getDisciplineInventory>>();
    for (const d of DISCIPLINAS_PPC) {
      map.set(d.id, getDisciplineInventory(d.id, customContent));
    }
    return map;
  }, [customContent]);

  const filteredDisciplines = useMemo(() => {
    const q = discSearch.trim().toLowerCase();
    return DISCIPLINAS_PPC.filter((d) => {
      const inv = inventoryById.get(d.id);
      const matchYear = selectedYear === 'Todos' || d.ano === selectedYear;
      const matchCov =
        coverageFilter === 'Todas' ||
        (coverageFilter === 'ComAtividades' && (inv?.totalActivities ?? 0) > 0) ||
        (coverageFilter === 'SemAtividades' && (inv?.totalActivities ?? 0) === 0);
      const matchSearch = !q || d.nome.toLowerCase().includes(q);
      return matchYear && matchCov && matchSearch;
    });
  }, [selectedYear, coverageFilter, discSearch, inventoryById]);

  const activeDiscipline: DisciplinaPPC = useMemo(() => {
    return (
      DISCIPLINAS_PPC.find((d) => d.id === selectedDiscId) ||
      filteredDisciplines[0] ||
      DISCIPLINAS_PPC[0]
    );
  }, [selectedDiscId, filteredDisciplines]);

  const activeInv = inventoryById.get(activeDiscipline.id) || getDisciplineInventory(activeDiscipline.id, customContent);

  // =================== FORM 1: ASSUNTO & UPLOAD ===================
  const [topicType, setTopicType] = useState<CustomTopicType>('assunto');
  const [topicTitle, setTopicTitle] = useState('');
  const [topicDesc, setTopicDesc] = useState('');
  const [topicXp, setTopicXp] = useState(25);
  const [pendingAttachments, setPendingAttachments] = useState<DisciplineAttachment[]>([]);
  const [isParsingFiles, setIsParsingFiles] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const jsonImportRef = useRef<HTMLInputElement | null>(null);

  const handleFilesSelected = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsParsingFiles(true);
    setStatusBanner(null);

    try {
      const processed: DisciplineAttachment[] = [];
      let suggested = '';

      for (const file of Array.from(files)) {
        const res = await processUploadedDisciplineFile(file);
        processed.push(res.attachment);
        if (!suggested) suggested = res.suggestedTitle;
      }

      setPendingAttachments((prev) => [...prev, ...processed]);
      if (!topicTitle.trim() && suggested) {
        setTopicTitle(suggested);
      }
      if (!topicDesc.trim() && processed[0]?.extractedText) {
        setTopicDesc(processed[0].extractedText.slice(0, 500));
      }

      setStatusBanner({
        kind: 'ok',
        text: `${processed.length} arquivo(s) processado(s) com sucesso (PDF/XLS/DOCX). Revise e clique em Salvar Assunto na Disciplina.`,
      });
    } catch (err) {
      setStatusBanner({
        kind: 'err',
        text: err instanceof Error ? err.message : 'Não foi possível processar o arquivo enviado.',
      });
    } finally {
      setIsParsingFiles(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSaveTopic = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topicTitle.trim()) {
      setStatusBanner({ kind: 'err', text: 'Informe o título do assunto ou atividade.' });
      return;
    }

    const newTopic: CustomTopic = {
      id: createCustomId('topic'),
      disciplinaId: activeDiscipline.id,
      disciplinaNome: activeDiscipline.nome,
      ano: activeDiscipline.ano,
      nucleo: activeDiscipline.nucleo,
      titulo: topicTitle.trim(),
      tipo: topicType,
      descricao:
        topicDesc.trim() ||
        `Material de apoio adicionado manualmente para ${activeDiscipline.nome}.`,
      xpReward: topicXp,
      attachments: pendingAttachments,
      createdAt: new Date().toISOString(),
    };

    onAddTopic(newTopic);
    setTopicTitle('');
    setTopicDesc('');
    setPendingAttachments([]);
    setStatusBanner({
      kind: 'ok',
      text: `Assunto "${newTopic.titulo}" salvo em ${activeDiscipline.nome}!`,
    });
  };

  const handleRemovePendingAttachment = async (attId: string) => {
    await deleteFileBlob(attId);
    setPendingAttachments((prev) => prev.filter((a) => a.id !== attId));
  };

  const handleGenerateFromAttachment = (
    att: DisciplineAttachment,
    target: 'flashcard' | 'quiz'
  ) => {
    const meta = {
      disciplinaId: activeDiscipline.id,
      disciplinaNome: activeDiscipline.nome,
      ano: activeDiscipline.ano,
      nucleo: activeDiscipline.nucleo,
    };

    if (target === 'flashcard') {
      let cards: FlashcardItem[] = [];
      if (att.sheets && att.sheets.length > 0) {
        cards = parseSpreadsheetRowsToFlashcards(att.sheets[0].rows, meta);
      } else if (att.extractedText) {
        cards = parseTextLinesToFlashcards(att.extractedText, meta);
      }

      if (cards.length === 0) {
        setStatusBanner({
          kind: 'err',
          text: 'Não foram encontradas linhas no formato "Frente | Verso" (planilha) ou "Pergunta :: Resposta" (PDF/DOCX). Baixe a planilha modelo na aba Novo Flashcard.',
        });
        return;
      }

      onAddFlashcards(cards);
      setStatusBanner({
        kind: 'ok',
        text: `${cards.length} flashcard(s) importado(s) de "${att.fileName}" para ${activeDiscipline.nome}!`,
      });
    } else {
      if (!att.sheets || att.sheets.length === 0) {
        setStatusBanner({
          kind: 'err',
          text: 'A importação em lote de questões requer uma planilha .xls ou .xlsx com colunas Enunciado, A, B, C, D, Correta e Explicação.',
        });
        return;
      }
      const questions = parseSpreadsheetRowsToQuiz(att.sheets[0].rows, meta);
      if (questions.length === 0) {
        setStatusBanner({
          kind: 'err',
          text: 'Nenhuma questão válida encontrada. Verifique se há Enunciado e 4 alternativas (A, B, C, D).',
        });
        return;
      }
      onAddQuizQuestions(questions);
      setStatusBanner({
        kind: 'ok',
        text: `${questions.length} questão(ões) importada(s) de "${att.fileName}" para o Quiz!`,
      });
    }
  };

  // =================== FORM 2: FLASHCARD ===================
  const [fcFrente, setFcFrente] = useState('');
  const [fcVerso, setFcVerso] = useState('');
  const [fcContexto, setFcContexto] = useState('');
  const batchFcInputRef = useRef<HTMLInputElement | null>(null);

  const handleSaveFlashcard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fcFrente.trim() || !fcVerso.trim()) {
      setStatusBanner({ kind: 'err', text: 'Preencha a frente (pergunta) e o verso (resposta).' });
      return;
    }

    const card: FlashcardItem = {
      id: createCustomId('custom-fc'),
      ano: activeDiscipline.ano,
      nucleo: activeDiscipline.nucleo,
      disciplinaId: activeDiscipline.id,
      disciplinaNome: activeDiscipline.nome,
      frente: fcFrente.trim(),
      verso: fcVerso.trim(),
      contextoSertao:
        fcContexto.trim() ||
        `Aplicação prática de ${activeDiscipline.nome} no Campus Poço Redondo.`,
    };

    onAddFlashcards([card]);
    setFcFrente('');
    setFcVerso('');
    setFcContexto('');
    setStatusBanner({
      kind: 'ok',
      text: `Flashcard adicionado em ${activeDiscipline.nome} (${activeDiscipline.ano}º Ano)!`,
    });
  };

  const handleBatchImport = async (
    files: FileList | null,
    target: 'flashcard' | 'quiz'
  ) => {
    if (!files || files.length === 0) return;
    try {
      const parsed = await processUploadedDisciplineFile(files[0]);
      handleGenerateFromAttachment(parsed.attachment, target);
      await deleteFileBlob(parsed.attachment.id);
    } catch (err) {
      setStatusBanner({
        kind: 'err',
        text: err instanceof Error ? err.message : 'Erro ao importar arquivo.',
      });
    } finally {
      if (batchFcInputRef.current) batchFcInputRef.current.value = '';
      if (batchQuizInputRef.current) batchQuizInputRef.current.value = '';
    }
  };

  // =================== FORM 3: QUIZ ===================
  const [qzEnunciado, setQzEnunciado] = useState('');
  const [qzAltA, setQzAltA] = useState('');
  const [qzAltB, setQzAltB] = useState('');
  const [qzAltC, setQzAltC] = useState('');
  const [qzAltD, setQzAltD] = useState('');
  const [qzCorreta, setQzCorreta] = useState<0 | 1 | 2 | 3>(0);
  const [qzExplicacao, setQzExplicacao] = useState('');
  const batchQuizInputRef = useRef<HTMLInputElement | null>(null);

  const handleSaveQuiz = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !qzEnunciado.trim() ||
      !qzAltA.trim() ||
      !qzAltB.trim() ||
      !qzAltC.trim() ||
      !qzAltD.trim()
    ) {
      setStatusBanner({
        kind: 'err',
        text: 'Preencha o enunciado e todas as 4 alternativas (A, B, C, D).',
      });
      return;
    }

    const q: QuizQuestion = {
      id: createCustomId('custom-qz'),
      ano: activeDiscipline.ano,
      nucleo: activeDiscipline.nucleo,
      disciplinaId: activeDiscipline.id,
      disciplinaNome: activeDiscipline.nome,
      enunciado: qzEnunciado.trim(),
      alternativas: [qzAltA.trim(), qzAltB.trim(), qzAltC.trim(), qzAltD.trim()],
      correta: qzCorreta,
      explicacao:
        qzExplicacao.trim() ||
        `Questão elaborada para revisão de ${activeDiscipline.nome} (${activeDiscipline.ano}º Ano).`,
    };

    onAddQuizQuestions([q]);
    setQzEnunciado('');
    setQzAltA('');
    setQzAltB('');
    setQzAltC('');
    setQzAltD('');
    setQzCorreta(0);
    setQzExplicacao('');
    setStatusBanner({
      kind: 'ok',
      text: `Questão salva em ${activeDiscipline.nome} e disponível na aba Quiz!`,
    });
  };

  // =================== FORM 4: LÚDICO ===================
  const [ludicSubMode, setLudicSubMode] = useState<'conexao' | 'classificador'>('conexao');
  const [deckTitulo, setDeckTitulo] = useState('');
  const [deckSubtitulo, setDeckSubtitulo] = useState('');
  const [deckPairs, setDeckPairs] = useState<Array<{ termo: string; conceito: string }>>([
    { termo: '', conceito: '' },
    { termo: '', conceito: '' },
    { termo: '', conceito: '' },
  ]);

  const [clsItem, setClsItem] = useState('');
  const [clsDetalhe, setClsDetalhe] = useState('');
  const [clsCategoria, setClsCategoria] =
    useState<ClassifierItem['categoriaCorreta']>('Campo Agrostológico');

  const handleSaveMatchDeck = (e: React.FormEvent) => {
    e.preventDefault();
    const validPairs = deckPairs
      .filter((p) => p.termo.trim() && p.conceito.trim())
      .map((p) => ({
        id: createCustomId('par'),
        termo: p.termo.trim(),
        conceito: p.conceito.trim(),
      }));

    if (!deckTitulo.trim() || validPairs.length < 3) {
      setStatusBanner({
        kind: 'err',
        text: 'Informe um título e pelo menos 3 pares completos (Termo + Conceito).',
      });
      return;
    }

    const deck: MatchDeck = {
      id: createCustomId('custom-deck'),
      titulo: deckTitulo.trim(),
      subtitulo:
        deckSubtitulo.trim() || `${activeDiscipline.nome} (${activeDiscipline.ano}º Ano)`,
      ano: activeDiscipline.ano,
      disciplinaId: activeDiscipline.id,
      disciplinaNome: activeDiscipline.nome,
      pares: validPairs,
    };

    onAddMatchDeck(deck);
    setDeckTitulo('');
    setDeckSubtitulo('');
    setDeckPairs([
      { termo: '', conceito: '' },
      { termo: '', conceito: '' },
      { termo: '', conceito: '' },
    ]);
    setStatusBanner({
      kind: 'ok',
      text: `Tabuleiro "${deck.titulo}" publicado em ${activeDiscipline.nome} e na aba Lúdico!`,
    });
  };

  const handleSaveClassifierItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clsItem.trim()) {
      setStatusBanner({ kind: 'err', text: 'Descreva o item ou prática a classificar.' });
      return;
    }

    const item: ClassifierItem = {
      id: createCustomId('custom-cls'),
      item: clsItem.trim(),
      detalhe:
        clsDetalhe.trim() ||
        `Atividade vinculada a ${activeDiscipline.nome} (${activeDiscipline.ano}º Ano).`,
      disciplinaId: activeDiscipline.id,
      disciplinaNome: activeDiscipline.nome,
      categoriaCorreta: clsCategoria,
    };

    onAddClassifierItem(item);
    setClsItem('');
    setClsDetalhe('');
    setStatusBanner({
      kind: 'ok',
      text: `Item adicionado em ${activeDiscipline.nome} e no Classificador do Campus!`,
    });
  };

  // =================== JSON BUNDLE BACKUP ===================
  const handleExportJson = () => {
    const json = exportCustomContentBundle(customContent);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `zoosertao-conteudo-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const handleImportJson = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    try {
      const text = await files[0].text();
      const restored = importCustomContentBundle(text);
      onReplaceAllCustomContent(restored);
      setStatusBanner({
        kind: 'ok',
        text: `Pacote importado: ${restored.topics.length} assunto(s), ${restored.flashcards.length} flashcard(s) e ${restored.quizQuestions.length} questão(ões).`,
      });
    } catch (err) {
      setStatusBanner({
        kind: 'err',
        text: err instanceof Error ? err.message : 'Erro ao importar JSON.',
      });
    } finally {
      if (jsonImportRef.current) jsonImportRef.current.value = '';
    }
  };

  const displayedTopics =
    listScope === 'disciplina' ? activeInv.topics : customContent.topics;
  const displayedCustomFlashcards =
    listScope === 'disciplina' ? activeInv.customFlashcards : customContent.flashcards;
  const displayedCustomQuiz =
    listScope === 'disciplina' ? activeInv.customQuizQuestions : customContent.quizQuestions;
  const displayedCustomDecks =
    listScope === 'disciplina' ? activeInv.customMatchDecks : customContent.matchDecks;
  const displayedCustomClassifier =
    listScope === 'disciplina'
      ? activeInv.customClassifierItems
      : customContent.classifierItems;

  return (
    <div className="space-y-7">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-[#525B50]">
            Painel Docente & Discente · Controle das 44 Disciplinas do PPC
          </p>
          <h1 className="mt-1 text-2xl sm:text-3xl font-bold text-[#1A241B]">
            Lançar Assuntos, Uploads e Atividades
          </h1>
          <p className="mt-1 text-sm text-[#525B50]">
            Escolha a disciplina diretamente abaixo para ver o que já existe nela e submeter novos assuntos (PDF, XLS, DOCX) ou atividades.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleExportJson}
            className="inline-flex items-center gap-1.5 min-h-[40px] px-3.5 py-2 rounded-xl border border-[#DCE2D7] bg-white hover:bg-[#F7F8F5] text-xs font-semibold text-[#1A241B] cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[#157A42]" aria-hidden="true" />
            <span>Exportar Pacote (.json)</span>
          </button>

          <input
            ref={jsonImportRef}
            type="file"
            accept=".json,application/json"
            onChange={(e) => handleImportJson(e.target.files)}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => jsonImportRef.current?.click()}
            className="inline-flex items-center gap-1.5 min-h-[40px] px-3.5 py-2 rounded-xl border border-[#DCE2D7] bg-white hover:bg-[#F7F8F5] text-xs font-semibold text-[#1A241B] cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-[#157A42]" aria-hidden="true" />
            <span>Importar Pacote (.json)</span>
          </button>
        </div>
      </div>

      {/* Status Alert */}
      {statusBanner && (
        <div
          role="status"
          className={`rounded-xl p-4 text-sm font-medium flex items-center justify-between gap-3 border ${
            statusBanner.kind === 'ok'
              ? 'bg-[#EAF6EE] border-[#C6DEC9] text-[#104E2A]'
              : 'bg-[#FEF2F2] border-[#FECACA] text-[#991B1B]'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>{statusBanner.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setStatusBanner(null)}
            className="text-xs font-semibold underline cursor-pointer shrink-0"
          >
            Fechar
          </button>
        </div>
      )}

      {/* 1. Visible Discipline Selector + Inventory Overview */}
      <section className="bg-white border border-[#E3E7DF] rounded-2xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-[#1A241B]">
              1. Escolha a Disciplina para Submissão ({filteredDisciplines.length} exibidas)
            </h2>
            <p className="text-xs text-[#525B50]">
              Clique na disciplina desejada para ver tudo que já foi lançado e enviar novos conteúdos.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 p-1 bg-[#F1F4EE] rounded-xl">
              {(['Todos', 1, 2, 3] as const).map((ano) => (
                <button
                  key={String(ano)}
                  type="button"
                  onClick={() => setSelectedYear(ano)}
                  className={`min-h-[36px] px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                    selectedYear === ano
                      ? 'bg-white text-[#1A241B] shadow-sm'
                      : 'text-[#525B50] hover:text-[#1A241B]'
                  }`}
                >
                  {ano === 'Todos' ? 'Todos Anos' : `${ano}º Ano`}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1 p-1 bg-[#F1F4EE] rounded-xl">
              {(
                [
                  { id: 'Todas', label: 'Todas' },
                  { id: 'ComAtividades', label: 'Com atividades' },
                  { id: 'SemAtividades', label: 'Pendentes' },
                ] as const
              ).map((cov) => (
                <button
                  key={cov.id}
                  type="button"
                  onClick={() => setCoverageFilter(cov.id)}
                  className={`min-h-[36px] px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                    coverageFilter === cov.id
                      ? 'bg-white text-[#1A241B] shadow-sm'
                      : 'text-[#525B50] hover:text-[#1A241B]'
                  }`}
                >
                  {cov.label}
                </button>
              ))}
            </div>

            <div className="relative">
              <Search
                className="w-3.5 h-3.5 text-[#6A7368] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <input
                type="search"
                value={discSearch}
                onChange={(e) => setDiscSearch(e.target.value)}
                placeholder="Filtrar disciplina..."
                aria-label="Filtrar disciplina para lançamento"
                className="min-h-[38px] w-48 sm:w-56 pl-8 pr-3 py-1.5 rounded-xl border border-[#DCE2D7] bg-white text-xs text-[#1A241B] placeholder:text-[#7C857A] focus-visible:outline-2 focus-visible:outline-[#157A42]"
              />
            </div>
          </div>
        </div>

        {/* Interactive Discipline Selection Grid */}
        {filteredDisciplines.length === 0 ? (
          <p className="py-4 text-sm text-[#525B50]">
            Nenhuma disciplina encontrada para este filtro.
          </p>
        ) : (
          <div
            role="listbox"
            aria-label="Disciplinas disponíveis para submissão"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-[260px] overflow-y-auto pr-1"
          >
            {filteredDisciplines.map((d) => {
              const inv = inventoryById.get(d.id)!;
              const isSelected = d.id === activeDiscipline.id;
              return (
                <button
                  key={d.id}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => setSelectedDiscId(d.id)}
                  className={`text-left p-3.5 rounded-xl border transition-colors cursor-pointer flex flex-col justify-between gap-1.5 ${
                    isSelected
                      ? 'border-[#157A42] bg-[#EAF6EE] ring-1 ring-[#157A42]'
                      : 'border-[#DCE2D7] bg-white hover:bg-[#F7F8F5]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 text-[11px] font-medium text-[#525B50]">
                    <span>
                      {d.ano}º Ano · {d.nucleo}
                    </span>
                    {isSelected && (
                      <span className="font-mono font-bold text-[#157A42]">Selecionada</span>
                    )}
                  </div>
                  <p className="text-sm font-bold text-[#1A241B] leading-snug">{d.nome}</p>
                  <p className="text-[11px] font-mono tabular-nums text-[#4C564A]">
                    Assuntos: {inv.topics.length} ({inv.attachmentsCount} arq.) · Cards:{' '}
                    {inv.totalFlashcards} · Quiz: {inv.totalQuizQuestions}
                    {inv.totalLudic > 0 ? ` · Lúdico: ${inv.totalLudic}` : ''}
                  </p>
                </button>
              );
            })}
          </div>
        )}

        {/* Active Discipline Summary Strip */}
        <div className="pt-3 border-t border-[#EEF1EB] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="text-[#1A241B]">
            <span className="text-[#525B50]">Submetendo em: </span>
            <strong>
              {activeDiscipline.ano}º Ano · {activeDiscipline.nome}
            </strong>{' '}
            <span className="font-mono text-[#525B50]">({activeDiscipline.cargaHoraria}h)</span>
          </div>
          <div className="font-mono tabular-nums font-semibold text-[#157A42]">
            Já existentes: {activeInv.topics.length} assunto(s) · {activeInv.totalFlashcards}{' '}
            flashcard(s) · {activeInv.totalQuizQuestions} questão(ões) · {activeInv.totalLudic}{' '}
            lúdica(s)
          </div>
        </div>
      </section>

      {/* Studio Mode Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-[#EAEFE7] rounded-xl overflow-x-auto max-w-full">
        <button
          type="button"
          onClick={() => setMode('assunto')}
          className={`inline-flex items-center gap-1.5 min-h-[42px] px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            mode === 'assunto' ? 'bg-white text-[#1A241B] shadow-sm' : 'text-[#525B50] hover:text-[#1A241B]'
          }`}
        >
          <FolderPlus className="w-4 h-4 text-[#157A42]" aria-hidden="true" />
          <span>Assuntos & Uploads (PDF/XLS/DOCX)</span>
        </button>

        <button
          type="button"
          onClick={() => setMode('flashcard')}
          className={`inline-flex items-center gap-1.5 min-h-[42px] px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            mode === 'flashcard' ? 'bg-white text-[#1A241B] shadow-sm' : 'text-[#525B50] hover:text-[#1A241B]'
          }`}
        >
          <Layers className="w-4 h-4 text-[#157A42]" aria-hidden="true" />
          <span>Novo Flashcard</span>
        </button>

        <button
          type="button"
          onClick={() => setMode('quiz')}
          className={`inline-flex items-center gap-1.5 min-h-[42px] px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            mode === 'quiz' ? 'bg-white text-[#1A241B] shadow-sm' : 'text-[#525B50] hover:text-[#1A241B]'
          }`}
        >
          <ListChecks className="w-4 h-4 text-[#157A42]" aria-hidden="true" />
          <span>Nova Questão (Quiz)</span>
        </button>

        <button
          type="button"
          onClick={() => setMode('ludico')}
          className={`inline-flex items-center gap-1.5 min-h-[42px] px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            mode === 'ludico' ? 'bg-white text-[#1A241B] shadow-sm' : 'text-[#525B50] hover:text-[#1A241B]'
          }`}
        >
          <Gamepad2 className="w-4 h-4 text-[#B86A0A]" aria-hidden="true" />
          <span>Nova Atividade Lúdica</span>
        </button>
      </div>

      {/* =================== TAB 1: ASSUNTOS & UPLOADS =================== */}
      {mode === 'assunto' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <form
            onSubmit={handleSaveTopic}
            className="lg:col-span-7 bg-white border border-[#E3E7DF] rounded-2xl p-6 space-y-5"
          >
            <div>
              <h2 className="text-lg font-bold text-[#1A241B]">
                Submeter Assunto ou Material em {activeDiscipline.nome}
              </h2>
              <p className="text-xs text-[#525B50] mt-0.5">
                Escreva manualmente e/ou anexe arquivos PDF, XLS, XLSX ou DOCX.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="topic-type" className="block text-xs font-semibold text-[#1A241B] mb-1.5">
                  Tipo de Conteúdo
                </label>
                <select
                  id="topic-type"
                  value={topicType}
                  onChange={(e) => setTopicType(e.target.value as CustomTopicType)}
                  className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-[#DCE2D7] bg-white text-sm text-[#1A241B]"
                >
                  <option value="assunto">Assunto / Aula</option>
                  <option value="atividade">Atividade Prática / Roteiro</option>
                  <option value="material">Material Complementar</option>
                </select>
              </div>

              <div>
                <label htmlFor="topic-xp" className="block text-xs font-semibold text-[#1A241B] mb-1.5">
                  Recompensa ao Concluir
                </label>
                <select
                  id="topic-xp"
                  value={topicXp}
                  onChange={(e) => setTopicXp(Number(e.target.value))}
                  className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-[#DCE2D7] bg-white text-sm text-[#1A241B]"
                >
                  <option value={15}>+15 XP (Leitura rápida)</option>
                  <option value={25}>+25 XP (Assunto completo)</option>
                  <option value={40}>+40 XP (Atividade prática)</option>
                  <option value={60}>+60 XP (Projeto / Estudo de caso)</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="topic-title" className="block text-xs font-semibold text-[#1A241B] mb-1.5">
                Título do Assunto ou Atividade
              </label>
              <input
                id="topic-title"
                type="text"
                value={topicTitle}
                onChange={(e) => setTopicTitle(e.target.value)}
                placeholder="Ex.: Manejo da Palma Forrageira e Silagem de Sorgo"
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#DCE2D7] bg-white text-sm text-[#1A241B] placeholder:text-[#7C857A] focus-visible:outline-2 focus-visible:outline-[#157A42]"
              />
            </div>

            <div>
              <label htmlFor="topic-desc" className="block text-xs font-semibold text-[#1A241B] mb-1.5">
                Resumo, Texto ou Orientações da Atividade
              </label>
              <textarea
                id="topic-desc"
                rows={4}
                value={topicDesc}
                onChange={(e) => setTopicDesc(e.target.value)}
                placeholder="Digite o conteúdo da aula, objetivos ou instruções para os estudantes (preenchido automaticamente ao enviar PDF/DOCX/XLS se estiver vazio)."
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#DCE2D7] bg-white text-sm text-[#1A241B] placeholder:text-[#7C857A] focus-visible:outline-2 focus-visible:outline-[#157A42]"
              />
            </div>

            {/* File Upload Area */}
            <div className="pt-4 border-t border-[#EEF1EB] space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-[#1A241B]">
                  Anexar Arquivos (PDF, XLS, XLSX, DOCX)
                </span>
                <span className="text-xs text-[#525B50]">Leitura automática no navegador</span>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.xls,.xlsx,.docx,application/pdf,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={(e) => handleFilesSelected(e.target.files)}
                className="hidden"
                id="discipline-file-upload"
              />

              <label
                htmlFor="discipline-file-upload"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  handleFilesSelected(e.dataTransfer.files);
                }}
                className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-[#C6DEC9] hover:border-[#157A42] bg-[#F7FBF8] rounded-xl p-5 text-center cursor-pointer transition-colors"
              >
                <Upload className="w-6 h-6 text-[#157A42]" aria-hidden="true" />
                <span className="text-sm font-semibold text-[#1A241B]">
                  {isParsingFiles
                    ? 'Processando arquivo(s)...'
                    : 'Clique para selecionar ou arraste arquivos aqui'}
                </span>
                <span className="text-xs text-[#525B50]">
                  Suporta apostilas em <strong>.pdf</strong>, planilhas <strong>.xls / .xlsx</strong> e roteiros <strong>.docx</strong>
                </span>
              </label>

              {pendingAttachments.length > 0 && (
                <ul className="divide-y divide-[#EEF1EB] border border-[#E3E7DF] rounded-xl">
                  {pendingAttachments.map((att) => (
                    <li key={att.id} className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[#1A241B] truncate">
                          {att.fileName}
                        </p>
                        <p className="text-xs font-mono text-[#525B50]">
                          {att.format.toUpperCase()} · {formatFileSize(att.sizeBytes)}
                          {att.pageCount ? ` · ${att.pageCount} pág.` : ''}
                          {att.sheets ? ` · ${att.sheets.length} aba(s)` : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 flex-wrap">
                        <button
                          type="button"
                          onClick={() => setPreviewAttachment(att)}
                          className="inline-flex items-center gap-1 min-h-[36px] px-2.5 py-1 rounded-lg bg-[#F1F4EE] text-xs font-semibold text-[#1A241B] cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 text-[#157A42]" aria-hidden="true" />
                          <span>Prévia</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleGenerateFromAttachment(att, 'flashcard')}
                          className="min-h-[36px] px-2.5 py-1 rounded-lg bg-[#EAF6EE] text-xs font-semibold text-[#106134] cursor-pointer"
                        >
                          Gerar Cards
                        </button>
                        {(att.format === 'xls' || att.format === 'xlsx') && (
                          <button
                            type="button"
                            onClick={() => handleGenerateFromAttachment(att, 'quiz')}
                            className="min-h-[36px] px-2.5 py-1 rounded-lg bg-[#FEF6E8] text-xs font-semibold text-[#784304] cursor-pointer"
                          >
                            Gerar Quiz
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemovePendingAttachment(att.id)}
                          aria-label={`Remover ${att.fileName}`}
                          className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg text-[#991B1B] hover:bg-[#FEF2F2] cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <button
              type="submit"
              disabled={isParsingFiles}
              className="w-full min-h-[48px] rounded-xl bg-[#157A42] hover:bg-[#106134] text-white text-sm font-semibold transition-colors cursor-pointer disabled:opacity-60"
            >
              Salvar Assunto na Disciplina
            </button>
          </form>

          {/* Existing Topics Control Panel */}
          <div className="lg:col-span-5 bg-white border border-[#E3E7DF] rounded-2xl p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-lg font-bold text-[#1A241B]">
                  {listScope === 'disciplina'
                    ? `Já lançado em ${activeDiscipline.nome}`
                    : 'Todos os Assuntos Lançados'}
                </h3>
                <p className="text-xs text-[#525B50]">
                  {displayedTopics.length} assunto(s) · {activeInv.totalFlashcards} card(s) ·{' '}
                  {activeInv.totalQuizQuestions} questão(ões) nesta disciplina
                </p>
              </div>
              <ScopeToggle value={listScope} onChange={setListScope} />
            </div>

            {displayedTopics.length === 0 ? (
              <p className="py-6 text-sm text-[#525B50] border-t border-[#EEF1EB]">
                Nenhum assunto extra lançado {listScope === 'disciplina' ? 'nesta disciplina' : 'no curso'} ainda.
              </p>
            ) : (
              <ul className="divide-y divide-[#EEF1EB] border-t border-[#EEF1EB] max-h-[540px] overflow-y-auto">
                {displayedTopics.map((topic) => (
                  <li key={topic.id} className="py-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[11px] font-mono uppercase font-semibold text-[#157A42]">
                          {listScope === 'curso' ? `${topic.disciplinaNome} · ` : ''}
                          {topic.tipo} · +{topic.xpReward} XP
                        </span>
                        <h4 className="text-sm font-bold text-[#1A241B]">{topic.titulo}</h4>
                      </div>
                      <button
                        type="button"
                        onClick={() => onDeleteTopic(topic.id)}
                        aria-label={`Excluir assunto ${topic.titulo}`}
                        className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg text-[#6A7368] hover:text-[#991B1B] hover:bg-[#FEF2F2] cursor-pointer shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <p className="text-xs text-[#4C564A] line-clamp-3 leading-relaxed">
                      {topic.descricao}
                    </p>

                    {topic.attachments.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {topic.attachments.map((att) => (
                          <button
                            key={att.id}
                            type="button"
                            onClick={() => setPreviewAttachment(att)}
                            className="inline-flex items-center gap-1.5 min-h-[34px] px-2.5 py-1 rounded-lg bg-[#F1F4EE] hover:bg-[#E4EAE0] text-xs font-semibold text-[#1A241B] cursor-pointer"
                          >
                            {att.format === 'xls' || att.format === 'xlsx' ? (
                              <FileSpreadsheet className="w-3.5 h-3.5 text-[#157A42]" aria-hidden="true" />
                            ) : (
                              <FileText className="w-3.5 h-3.5 text-[#157A42]" aria-hidden="true" />
                            )}
                            <span className="max-w-[160px] truncate">{att.fileName}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* =================== TAB 2: FLASHCARD =================== */}
      {mode === 'flashcard' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <form
            onSubmit={handleSaveFlashcard}
            className="lg:col-span-7 bg-white border border-[#E3E7DF] rounded-2xl p-6 space-y-5"
          >
            <div>
              <h2 className="text-lg font-bold text-[#1A241B]">
                Criar Flashcard em {activeDiscipline.nome}
              </h2>
              <p className="text-xs text-[#525B50] mt-0.5">
                O cartão entra automaticamente no baralho de revisão espaçada do {activeDiscipline.ano}º Ano.
              </p>
            </div>

            <div>
              <label htmlFor="fc-frente" className="block text-xs font-semibold text-[#1A241B] mb-1.5">
                Frente do Cartão (Pergunta ou Conceito)
              </label>
              <textarea
                id="fc-frente"
                rows={2}
                value={fcFrente}
                onChange={(e) => setFcFrente(e.target.value)}
                placeholder="Ex.: Qual o ponto ideal de corte do sorgo para ensilagem?"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#DCE2D7] bg-white text-sm text-[#1A241B]"
              />
            </div>

            <div>
              <label htmlFor="fc-verso" className="block text-xs font-semibold text-[#1A241B] mb-1.5">
                Verso do Cartão (Resposta Técnica)
              </label>
              <textarea
                id="fc-verso"
                rows={3}
                value={fcVerso}
                onChange={(e) => setFcVerso(e.target.value)}
                placeholder="Ex.: Grão no estádio pastoso a farináceo, com 30% a 35% de matéria seca na planta inteira."
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#DCE2D7] bg-white text-sm text-[#1A241B]"
              />
            </div>

            <div>
              <label htmlFor="fc-contexto" className="block text-xs font-semibold text-[#1A241B] mb-1.5">
                Aplicação em Poço Redondo / Campus (opcional)
              </label>
              <input
                id="fc-contexto"
                type="text"
                value={fcContexto}
                onChange={(e) => setFcContexto(e.target.value)}
                placeholder="Ex.: Garantir reserva forrageira no período seco do Alto Sertão."
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#DCE2D7] bg-white text-sm text-[#1A241B]"
              />
            </div>

            <button
              type="submit"
              className="w-full min-h-[48px] rounded-xl bg-[#157A42] hover:bg-[#106134] text-white text-sm font-semibold cursor-pointer"
            >
              Submeter Flashcard para {activeDiscipline.nome}
            </button>

            {/* Batch import via XLS/PDF/DOCX */}
            <div className="pt-5 border-t border-[#EEF1EB] space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-[#1A241B]">
                    Ou importar vários flashcards por arquivo
                  </h3>
                  <p className="text-xs text-[#525B50]">
                    Excel (.xls/.xlsx) com colunas Frente | Verso | Contexto, ou PDF/DOCX com linhas &quot;Pergunta :: Resposta&quot;.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => downloadSpreadsheetTemplate('flashcards')}
                  className="inline-flex items-center gap-1.5 min-h-[38px] px-3 py-1.5 rounded-lg bg-[#F1F4EE] hover:bg-[#E4EAE0] text-xs font-semibold text-[#1A241B] cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-[#157A42]" aria-hidden="true" />
                  <span>Baixar modelo .xlsx</span>
                </button>
              </div>

              <input
                ref={batchFcInputRef}
                type="file"
                accept=".pdf,.xls,.xlsx,.docx"
                onChange={(e) => handleBatchImport(e.target.files, 'flashcard')}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => batchFcInputRef.current?.click()}
                className="inline-flex items-center gap-2 min-h-[42px] px-4 py-2 rounded-xl border border-[#DCE2D7] hover:bg-[#F7F8F5] text-xs font-semibold text-[#1A241B] cursor-pointer"
              >
                <Upload className="w-4 h-4 text-[#157A42]" aria-hidden="true" />
                <span>Importar Flashcards (.xls, .xlsx, .pdf, .docx)</span>
              </button>
            </div>
          </form>

          {/* Flashcards Control Panel (Custom + Built-in PPC) */}
          <div className="lg:col-span-5 bg-white border border-[#E3E7DF] rounded-2xl p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-lg font-bold text-[#1A241B]">
                  Flashcards Existentes ({listScope === 'disciplina' ? activeInv.totalFlashcards : customContent.flashcards.length})
                </h3>
                <p className="text-xs text-[#525B50]">
                  {listScope === 'disciplina'
                    ? `${activeInv.customFlashcards.length} seu(s) + ${activeInv.builtInFlashcards.length} do PPC em ${activeDiscipline.nome}`
                    : 'Todos os flashcards lançados pelo professor'}
                </p>
              </div>
              <ScopeToggle value={listScope} onChange={setListScope} />
            </div>

            {displayedCustomFlashcards.length === 0 &&
            (listScope === 'curso' || activeInv.builtInFlashcards.length === 0) ? (
              <p className="py-6 text-sm text-[#525B50] border-t border-[#EEF1EB]">
                Nenhum flashcard cadastrado nesta disciplina ainda.
              </p>
            ) : (
              <ul className="divide-y divide-[#EEF1EB] border-t border-[#EEF1EB] max-h-[540px] overflow-y-auto">
                {displayedCustomFlashcards.map((fc) => (
                  <li key={fc.id} className="py-3.5 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[11px] font-mono text-[#157A42] font-semibold">
                        Professor · {fc.ano}º Ano · {fc.disciplinaNome}
                      </p>
                      <p className="text-sm font-semibold text-[#1A241B] mt-0.5">{fc.frente}</p>
                      <p className="text-xs text-[#4C564A] mt-1 line-clamp-2">{fc.verso}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onDeleteFlashcard(fc.id)}
                      aria-label={`Excluir flashcard ${fc.frente}`}
                      className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg text-[#6A7368] hover:text-[#991B1B] hover:bg-[#FEF2F2] cursor-pointer shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </li>
                ))}
                {listScope === 'disciplina' &&
                  activeInv.builtInFlashcards.map((fc) => (
                    <li key={fc.id} className="py-3.5">
                      <p className="text-[11px] font-mono text-[#525B50]">
                        Base PPC · {fc.disciplinaNome}
                      </p>
                      <p className="text-sm font-semibold text-[#1A241B] mt-0.5">{fc.frente}</p>
                      <p className="text-xs text-[#4C564A] mt-1 line-clamp-2">{fc.verso}</p>
                    </li>
                  ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* =================== TAB 3: QUIZ =================== */}
      {mode === 'quiz' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <form
            onSubmit={handleSaveQuiz}
            className="lg:col-span-7 bg-white border border-[#E3E7DF] rounded-2xl p-6 space-y-4"
          >
            <div>
              <h2 className="text-lg font-bold text-[#1A241B]">
                Criar Questão de Quiz em {activeDiscipline.nome}
              </h2>
              <p className="text-xs text-[#525B50] mt-0.5">
                A questão aparecerá imediatamente nos simulados da aba Quiz.
              </p>
            </div>

            <div>
              <label htmlFor="qz-enunciado" className="block text-xs font-semibold text-[#1A241B] mb-1.5">
                Enunciado da Pergunta
              </label>
              <textarea
                id="qz-enunciado"
                rows={3}
                value={qzEnunciado}
                onChange={(e) => setQzEnunciado(e.target.value)}
                placeholder="Digite o enunciado contextualizado da questão..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#DCE2D7] bg-white text-sm text-[#1A241B]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { idx: 0 as const, label: 'Alternativa A', val: qzAltA, set: setQzAltA },
                { idx: 1 as const, label: 'Alternativa B', val: qzAltB, set: setQzAltB },
                { idx: 2 as const, label: 'Alternativa C', val: qzAltC, set: setQzAltC },
                { idx: 3 as const, label: 'Alternativa D', val: qzAltD, set: setQzAltD },
              ].map((alt) => (
                <div key={alt.idx} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label htmlFor={`qz-alt-${alt.idx}`} className="text-xs font-semibold text-[#1A241B]">
                      {alt.label}
                    </label>
                    <label className="inline-flex items-center gap-1.5 text-xs font-medium text-[#157A42] cursor-pointer">
                      <input
                        type="radio"
                        name="qz-correta"
                        checked={qzCorreta === alt.idx}
                        onChange={() => setQzCorreta(alt.idx)}
                        className="accent-[#157A42]"
                      />
                      <span>Correta</span>
                    </label>
                  </div>
                  <input
                    id={`qz-alt-${alt.idx}`}
                    type="text"
                    value={alt.val}
                    onChange={(e) => alt.set(e.target.value)}
                    placeholder={`Texto da ${alt.label}`}
                    className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-[#DCE2D7] bg-white text-sm text-[#1A241B]"
                  />
                </div>
              ))}
            </div>

            <div>
              <label htmlFor="qz-exp" className="block text-xs font-semibold text-[#1A241B] mb-1.5">
                Comentário Pedagógico (exibido após responder)
              </label>
              <textarea
                id="qz-exp"
                rows={2}
                value={qzExplicacao}
                onChange={(e) => setQzExplicacao(e.target.value)}
                placeholder="Explique por que a alternativa marcada é a correta."
                className="w-full px-3.5 py-2 rounded-xl border border-[#DCE2D7] bg-white text-sm text-[#1A241B]"
              />
            </div>

            <button
              type="submit"
              className="w-full min-h-[48px] rounded-xl bg-[#157A42] hover:bg-[#106134] text-white text-sm font-semibold cursor-pointer"
            >
              Submeter Questão para {activeDiscipline.nome}
            </button>

            {/* Batch XLS import */}
            <div className="pt-5 border-t border-[#EEF1EB] space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-[#1A241B]">
                    Ou importar banco de questões via planilha (.xls / .xlsx)
                  </h3>
                  <p className="text-xs text-[#525B50]">
                    Colunas: Enunciado | A | B | C | D | Correta (A/B/C/D) | Explicacao
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => downloadSpreadsheetTemplate('quiz')}
                  className="inline-flex items-center gap-1.5 min-h-[38px] px-3 py-1.5 rounded-lg bg-[#F1F4EE] hover:bg-[#E4EAE0] text-xs font-semibold text-[#1A241B] cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-[#157A42]" aria-hidden="true" />
                  <span>Baixar modelo .xlsx</span>
                </button>
              </div>

              <input
                ref={batchQuizInputRef}
                type="file"
                accept=".xls,.xlsx"
                onChange={(e) => handleBatchImport(e.target.files, 'quiz')}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => batchQuizInputRef.current?.click()}
                className="inline-flex items-center gap-2 min-h-[42px] px-4 py-2 rounded-xl border border-[#DCE2D7] hover:bg-[#F7F8F5] text-xs font-semibold text-[#1A241B] cursor-pointer"
              >
                <Upload className="w-4 h-4 text-[#157A42]" aria-hidden="true" />
                <span>Importar Planilha de Questões (.xls / .xlsx)</span>
              </button>
            </div>
          </form>

          {/* Quiz Control Panel */}
          <div className="lg:col-span-5 bg-white border border-[#E3E7DF] rounded-2xl p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-lg font-bold text-[#1A241B]">
                  Questões Existentes ({listScope === 'disciplina' ? activeInv.totalQuizQuestions : customContent.quizQuestions.length})
                </h3>
                <p className="text-xs text-[#525B50]">
                  {listScope === 'disciplina'
                    ? `${activeInv.customQuizQuestions.length} sua(s) + ${activeInv.builtInQuizQuestions.length} do PPC em ${activeDiscipline.nome}`
                    : 'Todas as questões lançadas pelo professor'}
                </p>
              </div>
              <ScopeToggle value={listScope} onChange={setListScope} />
            </div>

            {displayedCustomQuiz.length === 0 &&
            (listScope === 'curso' || activeInv.builtInQuizQuestions.length === 0) ? (
              <p className="py-6 text-sm text-[#525B50] border-t border-[#EEF1EB]">
                Nenhuma questão cadastrada nesta disciplina ainda.
              </p>
            ) : (
              <ul className="divide-y divide-[#EEF1EB] border-t border-[#EEF1EB] max-h-[540px] overflow-y-auto">
                {displayedCustomQuiz.map((q) => (
                  <li key={q.id} className="py-3.5 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[11px] font-mono text-[#157A42] font-semibold">
                        Professor · {q.ano}º Ano · {q.disciplinaNome}
                      </p>
                      <p className="text-sm font-semibold text-[#1A241B] mt-0.5">{q.enunciado}</p>
                      <p className="text-xs text-[#4C564A] mt-1">
                        Gabarito: <strong>{['A', 'B', 'C', 'D'][q.correta]}</strong> —{' '}
                        {q.alternativas[q.correta]}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onDeleteQuizQuestion(q.id)}
                      aria-label="Excluir questão"
                      className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg text-[#6A7368] hover:text-[#991B1B] hover:bg-[#FEF2F2] cursor-pointer shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </li>
                ))}
                {listScope === 'disciplina' &&
                  activeInv.builtInQuizQuestions.map((q) => (
                    <li key={q.id} className="py-3.5">
                      <p className="text-[11px] font-mono text-[#525B50]">
                        Base PPC · {q.disciplinaNome}
                      </p>
                      <p className="text-sm font-semibold text-[#1A241B] mt-0.5">{q.enunciado}</p>
                      <p className="text-xs text-[#4C564A] mt-1">
                        Gabarito: <strong>{['A', 'B', 'C', 'D'][q.correta]}</strong> —{' '}
                        {q.alternativas[q.correta]}
                      </p>
                    </li>
                  ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* =================== TAB 4: ATIVIDADE LÚDICA =================== */}
      {mode === 'ludico' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7 bg-white border border-[#E3E7DF] rounded-2xl p-6 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-[#1A241B]">
                  Criar Atividade Lúdica em {activeDiscipline.nome}
                </h2>
                <p className="text-xs text-[#525B50]">
                  Novos desafios ficam vinculados à disciplina e jogáveis na aba Lúdico.
                </p>
              </div>

              <div className="flex items-center gap-1 p-1 bg-[#F1F4EE] rounded-xl">
                <button
                  type="button"
                  onClick={() => setLudicSubMode('conexao')}
                  className={`min-h-[36px] px-3 py-1 text-xs font-semibold rounded-lg cursor-pointer ${
                    ludicSubMode === 'conexao'
                      ? 'bg-white text-[#1A241B] shadow-sm'
                      : 'text-[#525B50]'
                  }`}
                >
                  Conexão (Pares)
                </button>
                <button
                  type="button"
                  onClick={() => setLudicSubMode('classificador')}
                  className={`min-h-[36px] px-3 py-1 text-xs font-semibold rounded-lg cursor-pointer ${
                    ludicSubMode === 'classificador'
                      ? 'bg-white text-[#1A241B] shadow-sm'
                      : 'text-[#525B50]'
                  }`}
                >
                  Classificador
                </button>
              </div>
            </div>

            {ludicSubMode === 'conexao' ? (
              <form onSubmit={handleSaveMatchDeck} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="deck-titulo" className="block text-xs font-semibold text-[#1A241B] mb-1">
                      Título do Tabuleiro
                    </label>
                    <input
                      id="deck-titulo"
                      type="text"
                      value={deckTitulo}
                      onChange={(e) => setDeckTitulo(e.target.value)}
                      placeholder="Ex.: Raças Caprinas e Ovinas"
                      className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-[#DCE2D7] text-sm text-[#1A241B]"
                    />
                  </div>
                  <div>
                    <label htmlFor="deck-subtitulo" className="block text-xs font-semibold text-[#1A241B] mb-1">
                      Subtítulo (opcional)
                    </label>
                    <input
                      id="deck-subtitulo"
                      type="text"
                      value={deckSubtitulo}
                      onChange={(e) => setDeckSubtitulo(e.target.value)}
                      placeholder="Ex.: Relacione cada raça à sua aptidão"
                      className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-[#DCE2D7] text-sm text-[#1A241B]"
                    />
                  </div>
                </div>

                <div className="space-y-2.5 pt-2 border-t border-[#EEF1EB]">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#1A241B]">
                      Pares Termo ↔ Conceito (mínimo 3)
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setDeckPairs((prev) => [...prev, { termo: '', conceito: '' }])
                      }
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[#157A42] cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Adicionar par</span>
                    </button>
                  </div>

                  {deckPairs.map((pair, idx) => (
                    <div key={idx} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                      <input
                        type="text"
                        value={pair.termo}
                        onChange={(e) => {
                          const next = [...deckPairs];
                          next[idx] = { ...next[idx], termo: e.target.value };
                          setDeckPairs(next);
                        }}
                        placeholder={`Termo ${idx + 1}`}
                        className="sm:col-span-4 min-h-[40px] px-3 py-1.5 rounded-xl border border-[#DCE2D7] text-sm text-[#1A241B]"
                      />
                      <input
                        type="text"
                        value={pair.conceito}
                        onChange={(e) => {
                          const next = [...deckPairs];
                          next[idx] = { ...next[idx], conceito: e.target.value };
                          setDeckPairs(next);
                        }}
                        placeholder={`Definição / Conceito ${idx + 1}`}
                        className="sm:col-span-7 min-h-[40px] px-3 py-1.5 rounded-xl border border-[#DCE2D7] text-sm text-[#1A241B]"
                      />
                      {deckPairs.length > 3 && (
                        <button
                          type="button"
                          onClick={() =>
                            setDeckPairs((prev) => prev.filter((_, pIdx) => pIdx !== idx))
                          }
                          aria-label={`Remover par ${idx + 1}`}
                          className="sm:col-span-1 min-h-[38px] flex items-center justify-center text-[#991B1B] cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <button
                  type="submit"
                  className="w-full min-h-[48px] rounded-xl bg-[#157A42] hover:bg-[#106134] text-white text-sm font-semibold cursor-pointer"
                >
                  Publicar Tabuleiro em {activeDiscipline.nome}
                </button>
              </form>
            ) : (
              <form onSubmit={handleSaveClassifierItem} className="space-y-4">
                <div>
                  <label htmlFor="cls-item" className="block text-xs font-semibold text-[#1A241B] mb-1">
                    Item ou Prática de Campo
                  </label>
                  <input
                    id="cls-item"
                    type="text"
                    value={clsItem}
                    onChange={(e) => setClsItem(e.target.value)}
                    placeholder="Ex.: Avaliação de escore corporal em cabras Canindé"
                    className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#DCE2D7] text-sm text-[#1A241B]"
                  />
                </div>

                <div>
                  <label htmlFor="cls-detalhe" className="block text-xs font-semibold text-[#1A241B] mb-1">
                    Dica ou Contexto (opcional)
                  </label>
                  <input
                    id="cls-detalhe"
                    type="text"
                    value={clsDetalhe}
                    onChange={(e) => setClsDetalhe(e.target.value)}
                    placeholder="Ex.: Monitoramento pré-cobertura para eficiência reprodutiva"
                    className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#DCE2D7] text-sm text-[#1A241B]"
                  />
                </div>

                <div>
                  <label htmlFor="cls-cat" className="block text-xs font-semibold text-[#1A241B] mb-1">
                    Unidade Correta no Campus
                  </label>
                  <select
                    id="cls-cat"
                    value={clsCategoria}
                    onChange={(e) =>
                      setClsCategoria(e.target.value as ClassifierItem['categoriaCorreta'])
                    }
                    className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#DCE2D7] bg-white text-sm text-[#1A241B]"
                  >
                    {CAMPUS_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full min-h-[48px] rounded-xl bg-[#157A42] hover:bg-[#106134] text-white text-sm font-semibold cursor-pointer"
                >
                  Adicionar ao Classificador ({activeDiscipline.nome})
                </button>
              </form>
            )}
          </div>

          <div className="lg:col-span-5 bg-white border border-[#E3E7DF] rounded-2xl p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-lg font-bold text-[#1A241B]">
                Atividades Lúdicas (
                {displayedCustomDecks.length + displayedCustomClassifier.length})
              </h3>
              <ScopeToggle value={listScope} onChange={setListScope} />
            </div>

            {displayedCustomDecks.length === 0 && displayedCustomClassifier.length === 0 ? (
              <div className="py-4 text-sm text-[#525B50] border-t border-[#EEF1EB] space-y-2">
                <p>
                  Nenhuma atividade lúdica personalizada {listScope === 'disciplina' ? `em ${activeDiscipline.nome}` : 'no curso'} ainda.
                </p>
                <p className="text-xs text-[#6A7368]">
                  Tabuleiros gerais já disponíveis na aba Lúdico:{' '}
                  {MATCH_DECKS.map((m) => m.titulo).join(' · ')}.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-[#EEF1EB] border-t border-[#EEF1EB]">
                {displayedCustomDecks.map((d) => (
                  <li key={d.id} className="py-3 flex items-start justify-between gap-2">
                    <div>
                      <p className="text-[11px] font-mono text-[#157A42]">
                        Conexão · {d.disciplinaNome || `${d.ano}º Ano`} · {d.pares.length} pares
                      </p>
                      <p className="text-sm font-semibold text-[#1A241B]">{d.titulo}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onDeleteMatchDeck(d.id)}
                      aria-label={`Excluir tabuleiro ${d.titulo}`}
                      className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg text-[#6A7368] hover:text-[#991B1B] cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </li>
                ))}
                {displayedCustomClassifier.map((c) => (
                  <li key={c.id} className="py-3 flex items-start justify-between gap-2">
                    <div>
                      <p className="text-[11px] font-mono text-[#B86A0A]">
                        Classificador · {c.disciplinaNome ? `${c.disciplinaNome} · ` : ''}
                        {c.categoriaCorreta}
                      </p>
                      <p className="text-sm font-semibold text-[#1A241B]">{c.item}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onDeleteClassifierItem(c.id)}
                      aria-label={`Excluir item ${c.item}`}
                      className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg text-[#6A7368] hover:text-[#991B1B] cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      <AttachmentReaderModal
        attachment={previewAttachment}
        onClose={() => setPreviewAttachment(null)}
      />
    </div>
  );
};

const ScopeToggle: React.FC<{
  value: 'disciplina' | 'curso';
  onChange: (next: 'disciplina' | 'curso') => void;
}> = ({ value, onChange }) => (
  <div className="flex items-center gap-1 p-0.5 bg-[#F1F4EE] rounded-lg">
    <button
      type="button"
      onClick={() => onChange('disciplina')}
      className={`px-2.5 py-1 text-[11px] font-semibold rounded-md cursor-pointer ${
        value === 'disciplina' ? 'bg-white text-[#1A241B] shadow-sm' : 'text-[#525B50]'
      }`}
    >
      Da disciplina
    </button>
    <button
      type="button"
      onClick={() => onChange('curso')}
      className={`px-2.5 py-1 text-[11px] font-semibold rounded-md cursor-pointer ${
        value === 'curso' ? 'bg-white text-[#1A241B] shadow-sm' : 'text-[#525B50]'
      }`}
    >
      Todo curso
    </button>
  </div>
);
