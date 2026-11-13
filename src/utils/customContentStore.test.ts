import test from 'node:test';
import assert from 'node:assert/strict';
import {
  detectFileFormat,
  exportCustomContentBundle,
  formatFileSize,
  importCustomContentBundle,
  INITIAL_CUSTOM_CONTENT,
  parseSpreadsheetRowsToFlashcards,
  parseSpreadsheetRowsToQuiz,
  parseTextLinesToFlashcards,
} from './customContentStore.ts';

const SAMPLE_META = {
  disciplinaId: 'forrageiras-2',
  disciplinaNome: 'Plantas Forrageiras',
  ano: 2 as const,
  nucleo: 'Tecnológico' as const,
};

test('detectFileFormat validates pdf, xls, xlsx, and docx extensions', () => {
  assert.equal(detectFileFormat('apostila_palma.PDF'), 'pdf');
  assert.equal(detectFileFormat('planilha_antiga.xls'), 'xls');
  assert.equal(detectFileFormat('questoes_zootecnia.xlsx'), 'xlsx');
  assert.equal(detectFileFormat('roteiro_pratica.Docx'), 'docx');
  assert.equal(detectFileFormat('malware.exe'), null);
  assert.equal(detectFileFormat('notas.txt'), null);
});

test('formatFileSize formats bytes, KB, and MB cleanly', () => {
  assert.equal(formatFileSize(512), '512 B');
  assert.equal(formatFileSize(2048), '2.0 KB');
  assert.equal(formatFileSize(1.5 * 1024 * 1024), '1.50 MB');
});

test('parseSpreadsheetRowsToFlashcards maps header-based and positional rows', () => {
  const rowsWithHeader = [
    ['Frente', 'Verso', 'Contexto'],
    ['O que é silagem?', 'Forragem conservada por fermentação anaeróbica.', 'Uso na seca sergipana'],
    ['O que é feno?', 'Forragem desidratada ao sol até ~15% de umidade.', ''],
  ];
  const cards = parseSpreadsheetRowsToFlashcards(rowsWithHeader, SAMPLE_META);
  assert.equal(cards.length, 2);
  assert.equal(cards[0].frente, 'O que é silagem?');
  assert.equal(cards[0].contextoSertao, 'Uso na seca sergipana');
  assert.equal(cards[1].disciplinaId, 'forrageiras-2');
  assert.match(cards[1].contextoSertao, /Plantas Forrageiras/);
});

test('parseSpreadsheetRowsToQuiz parses A/B/C/D options and correct letter', () => {
  const quizRows = [
    ['Enunciado', 'A', 'B', 'C', 'D', 'Correta', 'Explicacao'],
    [
      'Qual forrageira apresenta metabolismo CAM eficiente no Semiárido?',
      'Capim-tifton',
      'Palma forrageira',
      'Aveia branca',
      'Trevo branco',
      'B',
      'A palma abre estômatos à noite para economizar água.',
    ],
  ];
  const questions = parseSpreadsheetRowsToQuiz(quizRows, SAMPLE_META);
  assert.equal(questions.length, 1);
  assert.equal(questions[0].correta, 1);
  assert.equal(questions[0].alternativas[1], 'Palma forrageira');
  assert.equal(questions[0].explicacao, 'A palma abre estômatos à noite para economizar água.');
});

test('parseTextLinesToFlashcards extracts delimited lines from PDF/DOCX text', () => {
  const text = `
    Feno :: Forragem conservada por desidratação
    Silagem - Conservação via fermentação lática em ausência de oxigênio
    Linha ignorada sem separador
  `;
  const cards = parseTextLinesToFlashcards(text, SAMPLE_META);
  assert.equal(cards.length, 2);
  assert.equal(cards[0].frente, 'Feno');
  assert.equal(cards[1].frente, 'Silagem');
});

test('exportCustomContentBundle and importCustomContentBundle round-trip and reject invalid JSON', () => {
  const state = {
    ...INITIAL_CUSTOM_CONTENT,
    completedTopicIds: ['top-1'],
  };
  const json = exportCustomContentBundle(state);
  const restored = importCustomContentBundle(json);
  assert.deepEqual(restored.completedTopicIds, ['top-1']);

  assert.throws(() => importCustomContentBundle('{"foo":"bar"}'), /inválido/i);
});
