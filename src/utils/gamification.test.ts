import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateLevel,
  calculateQuizXp,
  scheduleFlashcard,
  evaluateBadges,
  evaluateRationScenario,
  INITIAL_PROGRESS,
} from './gamification';
import { RATION_SCENARIOS } from '../data/studyContent';

test('calculateLevel resolves ranks and progress percentage cleanly', () => {
  const lvl1 = calculateLevel(0);
  assert.equal(lvl1.level, 1);
  assert.equal(lvl1.title, 'Calouro do Sertão');
  assert.equal(lvl1.progressPercent, 0);

  const lvl2 = calculateLevel(250);
  assert.equal(lvl2.level, 2);
  assert.equal(lvl2.title, 'Aprendiz de Campo Agrostológico');

  const lvl3 = calculateLevel(600);
  assert.equal(lvl3.level, 3);
  assert.equal(lvl3.title, 'Monitor de Manejo Animal');
});

test('calculateQuizXp computes accuracy, base XP, streak bonus, and mastery bonus', () => {
  const perfect = calculateQuizXp(5, 5, 5);
  assert.equal(perfect.accuracy, 100);
  // 5*20 + 4*8 + 35 = 167
  assert.equal(perfect.xpEarned, 167);

  const zero = calculateQuizXp(0, 5, 0);
  assert.equal(zero.accuracy, 0);
  assert.equal(zero.xpEarned, 0);
});

test('scheduleFlashcard updates SM-2 interval and mastery status', () => {
  const first = scheduleFlashcard(undefined, 'fc-1', 'bom', 1000);
  assert.equal(first.nextProgress.repetitions, 1);
  assert.equal(first.nextProgress.mastered, false);
  assert.equal(first.xpGained, 15);

  const second = scheduleFlashcard(first.nextProgress, 'fc-1', 'facil', 2000);
  assert.equal(second.nextProgress.repetitions, 2);
  assert.equal(second.nextProgress.mastered, true);
  assert.ok(second.nextProgress.intervalDays > first.nextProgress.intervalDays);

  const reset = scheduleFlashcard(second.nextProgress, 'fc-1', 'dificil', 3000);
  assert.equal(reset.nextProgress.repetitions, 0);
  assert.equal(reset.nextProgress.mastered, false);
});

test('evaluateBadges unlocks expected achievements at thresholds', () => {
  const unlocked = evaluateBadges({
    ...INITIAL_PROGRESS,
    xp: 650,
    flashcardsReviewed: 12,
    maxCombo: 6,
    bestQuizAccuracy: 90,
    ludicCompleted: 3,
  });

  assert.ok(unlocked.includes('calouro-poco-redondo'));
  assert.ok(unlocked.includes('flashcard-10'));
  assert.ok(unlocked.includes('combo-5'));
  assert.ok(unlocked.includes('quiz-mestre'));
  assert.ok(unlocked.includes('guardiao-caatinga'));
  assert.ok(unlocked.includes('nivel-3'));
});

test('evaluateRationScenario scores balanced vs unbalanced semiárido rations accurately', () => {
  const cowScenario = RATION_SCENARIOS[0];
  const balanced = evaluateRationScenario(cowScenario, {
    forragemPct: 60,
    concentradoPct: 40,
    aguaLitros: 80,
    confortoNivel: 4,
  });
  assert.equal(balanced.score, 100);
  assert.equal(balanced.status, 'Equilibrado');
  assert.equal(balanced.xpReward, 45);

  const risky = evaluateRationScenario(cowScenario, {
    forragemPct: 30,
    concentradoPct: 50,
    aguaLitros: 30,
    confortoNivel: 1,
  });
  assert.equal(risky.status, 'Risco Produtivo');
  assert.ok(risky.score < 55);
});
