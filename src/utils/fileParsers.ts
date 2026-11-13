import {
  createCustomId,
  detectFileFormat,
  saveFileBlob,
  type AttachmentFormat,
  type AttachmentPreviewTable,
  type DisciplineAttachment,
} from './customContentStore';

export interface ParsedAttachmentResult {
  attachment: DisciplineAttachment;
  suggestedTitle: string;
}

function truncateText(text: string, maxLength = 45000): string {
  const cleaned = text.replace(/\u0000/g, '').trim();
  if (cleaned.length <= maxLength) return cleaned;
  return `${cleaned.slice(0, maxLength)}\n\n[Texto resumido para armazenamento rápido — baixe o arquivo original para ler completo.]`;
}

function buildSuggestedTitle(fileName: string): string {
  return fileName
    .replace(/\.(pdf|xlsx|xls|docx)$/i, '')
    .replace(/[_-]+/g, ' ')
    .trim();
}

async function parsePdfFile(buffer: ArrayBuffer): Promise<{
  extractedText: string;
  pageCount: number;
}> {
  const pdfjs = await import('pdfjs-dist');
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
  ).toString();

  const loadingTask = pdfjs.getDocument({ data: new Uint8Array(buffer) });
  const pdf = await loadingTask.promise;
  const pageCount = pdf.numPages;
  const pagesToRead = Math.min(pageCount, 30);
  const textChunks: string[] = [];

  for (let p = 1; p <= pagesToRead; p++) {
    const page = await pdf.getPage(p);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item) => ('str' in item ? item.str : ''))
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (pageText) {
      textChunks.push(`--- Página ${p} ---\n${pageText}`);
    }
  }

  return {
    extractedText: truncateText(textChunks.join('\n\n')),
    pageCount,
  };
}

async function parseExcelFile(buffer: ArrayBuffer): Promise<{
  extractedText: string;
  sheets: AttachmentPreviewTable[];
}> {
  const XLSX = await import('xlsx');
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheets: AttachmentPreviewTable[] = [];
  const textBlocks: string[] = [];

  for (const sheetName of workbook.SheetNames.slice(0, 6)) {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) continue;
    const rawMatrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
      header: 1,
      defval: '',
    });

    const stringMatrix = rawMatrix
      .map((row) => row.map((cell) => String(cell ?? '').trim()))
      .filter((row) => row.some((c) => c.length > 0))
      .slice(0, 120);

    if (stringMatrix.length === 0) continue;

    const headers = stringMatrix[0];
    const rows = stringMatrix;
    sheets.push({
      sheetName,
      headers,
      rows,
    });

    const previewLines = stringMatrix
      .slice(0, 15)
      .map((r) => r.filter(Boolean).join(' | '))
      .filter(Boolean);
    if (previewLines.length > 0) {
      textBlocks.push(`[Aba: ${sheetName}]\n${previewLines.join('\n')}`);
    }
  }

  return {
    extractedText: truncateText(textBlocks.join('\n\n')),
    sheets,
  };
}

async function parseDocxFile(buffer: ArrayBuffer): Promise<{ extractedText: string }> {
  const mammoth = await import('mammoth');
  const result = await mammoth.extractRawText({ arrayBuffer: buffer });
  return {
    extractedText: truncateText(result.value ?? ''),
  };
}

export async function processUploadedDisciplineFile(
  file: File
): Promise<ParsedAttachmentResult> {
  const format: AttachmentFormat | null = detectFileFormat(file.name);
  if (!format) {
    throw new Error(
      `Formato não suportado em "${file.name}". Envie arquivos PDF, XLS, XLSX ou DOCX.`
    );
  }

  const buffer = await file.arrayBuffer();
  const id = createCustomId('att');

  let extractedText = '';
  let pageCount: number | undefined;
  let sheets: AttachmentPreviewTable[] | undefined;

  if (format === 'pdf') {
    const pdfRes = await parsePdfFile(buffer);
    extractedText = pdfRes.extractedText;
    pageCount = pdfRes.pageCount;
  } else if (format === 'xls' || format === 'xlsx') {
    const xlsRes = await parseExcelFile(buffer);
    extractedText = xlsRes.extractedText;
    sheets = xlsRes.sheets;
  } else if (format === 'docx') {
    const docxRes = await parseDocxFile(buffer);
    extractedText = docxRes.extractedText;
  }

  await saveFileBlob(id, file);

  const attachment: DisciplineAttachment = {
    id,
    fileName: file.name,
    format,
    mimeType: file.type || 'application/octet-stream',
    sizeBytes: file.size,
    uploadedAt: new Date().toISOString(),
    pageCount,
    extractedText,
    sheets,
  };

  return {
    attachment,
    suggestedTitle: buildSuggestedTitle(file.name),
  };
}

export async function downloadSpreadsheetTemplate(
  kind: 'flashcards' | 'quiz'
): Promise<void> {
  const XLSX = await import('xlsx');
  const wb = XLSX.utils.book_new();

  if (kind === 'flashcards') {
    const rows = [
      ['Frente', 'Verso', 'Contexto'],
      [
        'Qual o teor de matéria seca médio da palma forrageira?',
        'Cerca de 10% a 14%, sendo rica em água e carboidratos não fibrosos, exigindo associação com fibra efetiva (feno ou silagem).',
        'Muito utilizada na alimentação de bovinos e caprinos em Poço Redondo durante a estiagem.',
      ],
      [
        'Qual a função do aprisco elevado no Semiárido?',
        'Melhorar a higiene, reduzir verminoses e facilitar a ventilação para ovinos e caprinos.',
        'Estrutura prática presente no Campus Poço Redondo.',
      ],
    ];
    const ws = XLSX.utils.aoa_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, 'Flashcards');
    XLSX.writeFile(wb, 'modelo-flashcards-zoosertao.xlsx');
  } else {
    const rows = [
      ['Enunciado', 'A', 'B', 'C', 'D', 'Correta', 'Explicacao'],
      [
        'Qual forrageira xerófila se destaca pela alta reserva hídrica e energia no Alto Sertão Sergipano?',
        'Palma forrageira (Opuntia / Nopalea)',
        'Capim-elefante sem irrigação na seca severa',
        'Azevém anual temperado',
        'Alfafa irrigada por inundação',
        'A',
        'A palma forrageira é adaptada ao semiárido, armazena água nos cladódios e fornece alta energia digestível.',
      ],
    ];
    const ws = XLSX.utils.aoa_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, 'Questoes');
    XLSX.writeFile(wb, 'modelo-quiz-zoosertao.xlsx');
  }
}
