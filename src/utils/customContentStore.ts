import type { NucleoFormacao } from '../data/ppcData';
import {
  FLASHCARDS_PPC,
  QUIZ_QUESTIONS,
  type ClassifierItem,
  type FlashcardItem,
  type MatchDeck,
  type QuizQuestion,
} from '../data/studyContent';

export type AttachmentFormat = 'pdf' | 'xls' | 'xlsx' | 'docx';

export interface AttachmentPreviewTable {
  sheetName: string;
  headers: string[];
  rows: string[][];
}

export interface DisciplineAttachment {
  id: string;
  fileName: string;
  format: AttachmentFormat;
  mimeType: string;
  sizeBytes: number;
  uploadedAt: string;
  pageCount?: number;
  extractedText: string;
  sheets?: AttachmentPreviewTable[];
}

export type CustomTopicType = 'assunto' | 'atividade' | 'material';

export interface CustomTopic {
  id: string;
  disciplinaId: string;
  disciplinaNome: string;
  ano: 1 | 2 | 3;
  nucleo: NucleoFormacao;
  titulo: string;
  tipo: CustomTopicType;
  descricao: string;
  xpReward: number;
  attachments: DisciplineAttachment[];
  createdAt: string;
}

export interface CustomContentState {
  topics: CustomTopic[];
  completedTopicIds: string[];
  flashcards: FlashcardItem[];
  quizQuestions: QuizQuestion[];
  matchDecks: MatchDeck[];
  classifierItems: ClassifierItem[];
}

export interface DisciplineMeta {
  disciplinaId: string;
  disciplinaNome: string;
  ano: 1 | 2 | 3;
  nucleo: NucleoFormacao;
}

export const CUSTOM_CONTENT_STORAGE_KEY = 'zoosertao_ifs_custom_content_v1';
const FILE_DB_NAME = 'zoosertao_ifs_files_db';
const FILE_STORE_NAME = 'attachments';

export const INITIAL_CUSTOM_CONTENT: CustomContentState = {
  topics: [],
  completedTopicIds: [],
  flashcards: [],
  quizQuestions: [],
  matchDecks: [],
  classifierItems: [],
};

export function createCustomId(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}-${Date.now().toString(36)}-${rand}`;
}

export function detectFileFormat(fileName: string): AttachmentFormat | null {
  const clean = fileName.trim().toLowerCase();
  if (clean.endsWith('.pdf')) return 'pdf';
  if (clean.endsWith('.xlsx')) return 'xlsx';
  if (clean.endsWith('.xls')) return 'xls';
  if (clean.endsWith('.docx')) return 'docx';
  return null;
}

export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 KB';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function normalizeHeader(cell: string): string {
  return cell
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function parseSpreadsheetRowsToFlashcards(
  rawRows: string[][],
  meta: DisciplineMeta
): FlashcardItem[] {
  const cleanRows = rawRows
    .map((r) => r.map((cell) => String(cell ?? '').trim()))
    .filter((r) => r.some((cell) => cell.length > 0));

  if (cleanRows.length === 0) return [];

  const firstNormalized = cleanRows[0].map(normalizeHeader);
  const hasHeader =
    firstNormalized.some((h) => ['frente', 'pergunta', 'termo', 'questao', 'conceito'].includes(h)) &&
    firstNormalized.some((h) => ['verso', 'resposta', 'definicao', 'explicacao'].includes(h));

  let frenteIdx = 0;
  let versoIdx = 1;
  let contextoIdx = 2;
  let startRow = 0;

  if (hasHeader) {
    startRow = 1;
    const foundFrente = firstNormalized.findIndex((h) =>
      ['frente', 'pergunta', 'termo', 'questao'].includes(h)
    );
    const foundVerso = firstNormalized.findIndex((h) =>
      ['verso', 'resposta', 'definicao', 'explicacao'].includes(h)
    );
    const foundContexto = firstNormalized.findIndex((h) =>
      ['contexto', 'aplicacao', 'sertao', 'observacao'].includes(h)
    );
    if (foundFrente >= 0) frenteIdx = foundFrente;
    if (foundVerso >= 0) versoIdx = foundVerso;
    if (foundContexto >= 0) contextoIdx = foundContexto;
  }

  const cards: FlashcardItem[] = [];
  for (let i = startRow; i < cleanRows.length; i++) {
    const row = cleanRows[i];
    const frente = row[frenteIdx]?.trim() ?? '';
    const verso = row[versoIdx]?.trim() ?? '';
    if (!frente || !verso) continue;

    const contexto =
      (contextoIdx >= 0 ? row[contextoIdx]?.trim() : '') ||
      `Conteúdo adicionado manualmente para ${meta.disciplinaNome} (${meta.ano}º Ano).`;

    cards.push({
      id: createCustomId('custom-fc'),
      ano: meta.ano,
      nucleo: meta.nucleo,
      disciplinaId: meta.disciplinaId,
      disciplinaNome: meta.disciplinaNome,
      frente,
      verso,
      contextoSertao: contexto,
    });
  }

  return cards;
}

function resolveCorrectOptionIndex(raw: string): 0 | 1 | 2 | 3 {
  const normalized = normalizeHeader(raw);
  if (normalized === 'a' || normalized === '1' || normalized === '0') return 0;
  if (normalized === 'b' || normalized === '2') return 1;
  if (normalized === 'c' || normalized === '3') return 2;
  if (normalized === 'd' || normalized === '4') return 3;
  return 0;
}

export function parseSpreadsheetRowsToQuiz(
  rawRows: string[][],
  meta: DisciplineMeta
): QuizQuestion[] {
  const cleanRows = rawRows
    .map((r) => r.map((cell) => String(cell ?? '').trim()))
    .filter((r) => r.some((cell) => cell.length > 0));

  if (cleanRows.length === 0) return [];

  const firstNormalized = cleanRows[0].map(normalizeHeader);
  const hasHeader =
    firstNormalized.some((h) => ['enunciado', 'pergunta', 'questao'].includes(h)) &&
    firstNormalized.some((h) => ['a', 'alternativa a', 'opcao a'].includes(h));

  let enunciadoIdx = 0;
  let aIdx = 1;
  let bIdx = 2;
  let cIdx = 3;
  let dIdx = 4;
  let corretaIdx = 5;
  let explicacaoIdx = 6;
  let startRow = 0;

  if (hasHeader) {
    startRow = 1;
    const findCol = (candidates: string[], fallback: number) => {
      const idx = firstNormalized.findIndex((h) => candidates.includes(h));
      return idx >= 0 ? idx : fallback;
    };
    enunciadoIdx = findCol(['enunciado', 'pergunta', 'questao'], 0);
    aIdx = findCol(['a', 'alternativa a', 'opcao a'], 1);
    bIdx = findCol(['b', 'alternativa b', 'opcao b'], 2);
    cIdx = findCol(['c', 'alternativa c', 'opcao c'], 3);
    dIdx = findCol(['d', 'alternativa d', 'opcao d'], 4);
    corretaIdx = findCol(['correta', 'gabarito', 'resposta'], 5);
    explicacaoIdx = findCol(['explicacao', 'comentario', 'justificativa'], 6);
  }

  const questions: QuizQuestion[] = [];
  for (let i = startRow; i < cleanRows.length; i++) {
    const row = cleanRows[i];
    const enunciado = row[enunciadoIdx]?.trim() ?? '';
    const altA = row[aIdx]?.trim() ?? '';
    const altB = row[bIdx]?.trim() ?? '';
    const altC = row[cIdx]?.trim() ?? '';
    const altD = row[dIdx]?.trim() ?? '';

    if (!enunciado || !altA || !altB || !altC || !altD) continue;

    const correta = resolveCorrectOptionIndex(row[corretaIdx] ?? 'A');
    const explicacao =
      row[explicacaoIdx]?.trim() ||
      `Questão elaborada para revisão de ${meta.disciplinaNome} (${meta.ano}º Ano).`;

    questions.push({
      id: createCustomId('custom-qz'),
      ano: meta.ano,
      nucleo: meta.nucleo,
      disciplinaId: meta.disciplinaId,
      disciplinaNome: meta.disciplinaNome,
      enunciado,
      alternativas: [altA, altB, altC, altD],
      correta,
      explicacao,
    });
  }

  return questions;
}

export function parseTextLinesToFlashcards(
  text: string,
  meta: DisciplineMeta
): FlashcardItem[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length >= 6);

  const cards: FlashcardItem[] = [];
  for (const line of lines) {
    let frente = '';
    let verso = '';

    if (line.includes('::')) {
      const [left, ...rest] = line.split('::');
      frente = left.trim();
      verso = rest.join('::').trim();
    } else if (line.includes(' - ')) {
      const idx = line.indexOf(' - ');
      frente = line.slice(0, idx).trim();
      verso = line.slice(idx + 3).trim();
    } else if (line.includes(' | ')) {
      const [left, ...rest] = line.split(' | ');
      frente = left.trim();
      verso = rest.join(' | ').trim();
    }

    if (frente.length >= 3 && verso.length >= 3) {
      cards.push({
        id: createCustomId('custom-fc'),
        ano: meta.ano,
        nucleo: meta.nucleo,
        disciplinaId: meta.disciplinaId,
        disciplinaNome: meta.disciplinaNome,
        frente,
        verso,
        contextoSertao: `Extraído de material enviado para ${meta.disciplinaNome}.`,
      });
    }
  }

  return cards;
}

export function loadCustomContent(): CustomContentState {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return INITIAL_CUSTOM_CONTENT;
    }
    const raw = window.localStorage.getItem(CUSTOM_CONTENT_STORAGE_KEY);
    if (!raw) return INITIAL_CUSTOM_CONTENT;
    const parsed = JSON.parse(raw) as Partial<CustomContentState>;
    return {
      topics: Array.isArray(parsed.topics) ? parsed.topics : [],
      completedTopicIds: Array.isArray(parsed.completedTopicIds) ? parsed.completedTopicIds : [],
      flashcards: Array.isArray(parsed.flashcards) ? parsed.flashcards : [],
      quizQuestions: Array.isArray(parsed.quizQuestions) ? parsed.quizQuestions : [],
      matchDecks: Array.isArray(parsed.matchDecks) ? parsed.matchDecks : [],
      classifierItems: Array.isArray(parsed.classifierItems) ? parsed.classifierItems : [],
    };
  } catch {
    return INITIAL_CUSTOM_CONTENT;
  }
}

export function saveCustomContent(state: CustomContentState): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    window.localStorage.setItem(CUSTOM_CONTENT_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage quota errors cleanly
  }
}

export function exportCustomContentBundle(state: CustomContentState): string {
  return JSON.stringify(
    {
      schema: 'zoosertao-ifs-bundle-v1',
      exportedAt: new Date().toISOString(),
      data: state,
    },
    null,
    2
  );
}

export function importCustomContentBundle(jsonText: string): CustomContentState {
  const parsed = JSON.parse(jsonText) as {
    schema?: string;
    data?: Partial<CustomContentState>;
  };

  if (!parsed || parsed.schema !== 'zoosertao-ifs-bundle-v1' || !parsed.data) {
    throw new Error('Arquivo JSON inválido ou incompatível com o ZooSertão IFS.');
  }

  const d = parsed.data;
  return {
    topics: Array.isArray(d.topics) ? d.topics : [],
    completedTopicIds: Array.isArray(d.completedTopicIds) ? d.completedTopicIds : [],
    flashcards: Array.isArray(d.flashcards) ? d.flashcards : [],
    quizQuestions: Array.isArray(d.quizQuestions) ? d.quizQuestions : [],
    matchDecks: Array.isArray(d.matchDecks) ? d.matchDecks : [],
    classifierItems: Array.isArray(d.classifierItems) ? d.classifierItems : [],
  };
}

export interface DisciplineInventory {
  topics: CustomTopic[];
  attachmentsCount: number;
  builtInFlashcards: FlashcardItem[];
  customFlashcards: FlashcardItem[];
  builtInQuizQuestions: QuizQuestion[];
  customQuizQuestions: QuizQuestion[];
  customMatchDecks: MatchDeck[];
  customClassifierItems: ClassifierItem[];
  totalFlashcards: number;
  totalQuizQuestions: number;
  totalLudic: number;
  totalActivities: number;
}

export function getDisciplineInventory(
  disciplinaId: string,
  customContent: CustomContentState
): DisciplineInventory {
  const topics = customContent.topics.filter((t) => t.disciplinaId === disciplinaId);
  const attachmentsCount = topics.reduce((acc, t) => acc + t.attachments.length, 0);
  const builtInFlashcards = FLASHCARDS_PPC.filter((f) => f.disciplinaId === disciplinaId);
  const customFlashcards = customContent.flashcards.filter(
    (f) => f.disciplinaId === disciplinaId
  );
  const builtInQuizQuestions = QUIZ_QUESTIONS.filter((q) => q.disciplinaId === disciplinaId);
  const customQuizQuestions = customContent.quizQuestions.filter(
    (q) => q.disciplinaId === disciplinaId
  );
  const customMatchDecks = customContent.matchDecks.filter(
    (m) => m.disciplinaId === disciplinaId
  );
  const customClassifierItems = customContent.classifierItems.filter(
    (c) => c.disciplinaId === disciplinaId
  );

  const totalFlashcards = builtInFlashcards.length + customFlashcards.length;
  const totalQuizQuestions = builtInQuizQuestions.length + customQuizQuestions.length;
  const totalLudic = customMatchDecks.length + customClassifierItems.length;
  const totalActivities = topics.length + totalFlashcards + totalQuizQuestions + totalLudic;

  return {
    topics,
    attachmentsCount,
    builtInFlashcards,
    customFlashcards,
    builtInQuizQuestions,
    customQuizQuestions,
    customMatchDecks,
    customClassifierItems,
    totalFlashcards,
    totalQuizQuestions,
    totalLudic,
    totalActivities,
  };
}

// ===================== IndexedDB Binary Blob Store =====================

function openFilesDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !('indexedDB' in window)) {
      reject(new Error('IndexedDB indisponível neste navegador.'));
      return;
    }
    const request = window.indexedDB.open(FILE_DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(FILE_STORE_NAME)) {
        db.createObjectStore(FILE_STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Erro ao abrir armazenamento local de arquivos.'));
  });
}

export async function saveFileBlob(attachmentId: string, blob: Blob): Promise<void> {
  try {
    const db = await openFilesDatabase();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(FILE_STORE_NAME, 'readwrite');
      tx.objectStore(FILE_STORE_NAME).put(blob, attachmentId);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch {
    // Graceful degradation if IndexedDB is blocked
  }
}

export async function getFileBlob(attachmentId: string): Promise<Blob | null> {
  try {
    const db = await openFilesDatabase();
    const result = await new Promise<Blob | null>((resolve, reject) => {
      const tx = db.transaction(FILE_STORE_NAME, 'readonly');
      const req = tx.objectStore(FILE_STORE_NAME).get(attachmentId);
      req.onsuccess = () => resolve((req.result as Blob | undefined) ?? null);
      req.onerror = () => reject(req.error);
    });
    db.close();
    return result;
  } catch {
    return null;
  }
}

export async function deleteFileBlob(attachmentId: string): Promise<void> {
  try {
    const db = await openFilesDatabase();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(FILE_STORE_NAME, 'readwrite');
      tx.objectStore(FILE_STORE_NAME).delete(attachmentId);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch {
    // Graceful degradation
  }
}
