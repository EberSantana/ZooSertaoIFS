export type Rating = 'dificil' | 'bom' | 'facil';

export interface FlashcardProgress {
  cardId: string;
  intervalDays: number;
  repetitions: number;
  lastRating: Rating;
  mastered: boolean;
  updatedAt: number;
}

export interface StudentProgress {
  xp: number;
  streakDays: number;
  quizzesCompleted: number;
  bestQuizAccuracy: number;
  flashcardsReviewed: number;
  ludicCompleted: number;
  maxCombo: number;
  cardProgress: Record<string, FlashcardProgress>;
  completedDisciplines: string[];
  unlockedBadges: string[];
  lastStudyDate: string;
}

export interface LevelRank {
  level: number;
  title: string;
  currentLevelXp: number;
  nextLevelXp: number;
  progressPercent: number;
}

export const INITIAL_PROGRESS: StudentProgress = {
  xp: 120,
  streakDays: 1,
  quizzesCompleted: 0,
  bestQuizAccuracy: 0,
  flashcardsReviewed: 0,
  ludicCompleted: 0,
  maxCombo: 0,
  cardProgress: {},
  completedDisciplines: [],
  unlockedBadges: ['calouro-poco-redondo'],
  lastStudyDate: new Date().toISOString().slice(0, 10),
};

export interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  criteriaText: string;
}

export const BADGE_CATALOG: BadgeDefinition[] = [
  {
    id: 'calouro-poco-redondo',
    name: 'Raízes do Curralinho',
    description: 'Iniciou sua jornada no PPC de Zootecnia do IFS Campus Poço Redondo.',
    criteriaText: 'Primeiro acesso',
  },
  {
    id: 'flashcard-10',
    name: 'Memória de Campo',
    description: 'Revisou pelo menos 10 flashcards técnicos do currículo.',
    criteriaText: '10 flashcards revisados',
  },
  {
    id: 'combo-5',
    name: 'Ritmo de Ordenha',
    description: 'Alcançou um combo de 5 acertos seguidos no Quiz ou Desafios.',
    criteriaText: 'Combo 5x',
  },
  {
    id: 'quiz-mestre',
    name: 'Técnico em Formação',
    description: 'Concluiu um Quiz com 80% ou mais de aproveitamento.',
    criteriaText: '≥ 80% em um Quiz',
  },
  {
    id: 'guardiao-caatinga',
    name: 'Guardião da Caatinga',
    description: 'Completou pelo menos 3 atividades lúdicas ou simuladores do Semiárido.',
    criteriaText: '3 jogos lúdicos',
  },
  {
    id: 'nivel-3',
    name: 'Orgulho do Alto Sertão',
    description: 'Atingiu o Nível 3 na trilha gamificada de Zootecnia.',
    criteriaText: 'Alcançar Nível 3 (600 XP)',
  },
];

const LEVEL_THRESHOLDS = [
  { level: 1, title: 'Calouro do Sertão', minXp: 0 },
  { level: 2, title: 'Aprendiz de Campo Agrostológico', minXp: 250 },
  { level: 3, title: 'Monitor de Manejo Animal', minXp: 600 },
  { level: 4, title: 'Técnico da Bacia Leiteira', minXp: 1100 },
  { level: 5, title: 'Mestre da Caatinga (IFS)', minXp: 1800 },
];

export function calculateLevel(xp: number): LevelRank {
  const safeXp = Math.max(0, Math.floor(xp));
  let current = LEVEL_THRESHOLDS[0];
  let next = LEVEL_THRESHOLDS[1];

  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    if (safeXp >= LEVEL_THRESHOLDS[i].minXp) {
      current = LEVEL_THRESHOLDS[i];
      next = LEVEL_THRESHOLDS[i + 1] ?? {
        level: current.level + 1,
        title: current.title,
        minXp: current.minXp + 800,
      };
    }
  }

  const span = Math.max(1, next.minXp - current.minXp);
  const gainedInLevel = safeXp - current.minXp;
  const progressPercent = Math.min(100, Math.round((gainedInLevel / span) * 100));

  return {
    level: current.level,
    title: current.title,
    currentLevelXp: safeXp,
    nextLevelXp: next.minXp,
    progressPercent,
  };
}

export function calculateQuizXp(correctCount: number, totalQuestions: number, maxStreak: number): {
  xpEarned: number;
  accuracy: number;
} {
  if (totalQuestions <= 0) return { xpEarned: 0, accuracy: 0 };
  const accuracy = Math.round((correctCount / totalQuestions) * 100);
  const baseXp = correctCount * 20;
  const streakBonus = Math.max(0, maxStreak - 1) * 8;
  const masteryBonus = accuracy >= 80 ? 35 : accuracy >= 60 ? 15 : 0;
  return {
    xpEarned: baseXp + streakBonus + masteryBonus,
    accuracy,
  };
}

export function scheduleFlashcard(
  existing: FlashcardProgress | undefined,
  cardId: string,
  rating: Rating,
  now = Date.now()
): { nextProgress: FlashcardProgress; xpGained: number } {
  const prevReps = existing?.repetitions ?? 0;
  const prevInterval = existing?.intervalDays ?? 1;

  let intervalDays = 1;
  let repetitions = prevReps;
  let xpGained = 10;

  if (rating === 'dificil') {
    intervalDays = 1;
    repetitions = 0;
    xpGained = 8;
  } else if (rating === 'bom') {
    repetitions = prevReps + 1;
    intervalDays = repetitions === 1 ? 2 : Math.round(prevInterval * 1.8);
    xpGained = 15;
  } else {
    repetitions = prevReps + 1;
    intervalDays = repetitions === 1 ? 4 : Math.round(prevInterval * 2.5);
    xpGained = 20;
  }

  const mastered = repetitions >= 2 && rating !== 'dificil';

  return {
    nextProgress: {
      cardId,
      intervalDays,
      repetitions,
      lastRating: rating,
      mastered,
      updatedAt: now,
    },
    xpGained,
  };
}

export function evaluateBadges(progress: StudentProgress): string[] {
  const badges = new Set(progress.unlockedBadges);
  badges.add('calouro-poco-redondo');
  if (progress.flashcardsReviewed >= 10) badges.add('flashcard-10');
  if (progress.maxCombo >= 5) badges.add('combo-5');
  if (progress.bestQuizAccuracy >= 80) badges.add('quiz-mestre');
  if (progress.ludicCompleted >= 3) badges.add('guardiao-caatinga');
  if (calculateLevel(progress.xp).level >= 3) badges.add('nivel-3');
  return Array.from(badges);
}

export interface RationScenario {
  id: string;
  titulo: string;
  categoria: string;
  estacao: 'Estiagem (Seca)' | 'Águas (Chuvoso)';
  metaForragem: [number, number]; // % ideal range
  metaConcentrado: [number, number]; // % ideal range
  metaAguaLitros: number; // minimum liters/day
  metaSombraVentilacao: number; // 1 to 5 scale
  dicaTecnica: string;
}

export interface RationEvaluation {
  score: number; // 0-100
  status: 'Equilibrado' | 'Ajuste Moderado' | 'Risco Produtivo';
  feedback: string[];
  xpReward: number;
}

export function evaluateRationScenario(
  scenario: RationScenario,
  input: {
    forragemPct: number;
    concentradoPct: number;
    aguaLitros: number;
    confortoNivel: number;
  }
): RationEvaluation {
  const feedback: string[] = [];
  let points = 100;

  const totalMix = input.forragemPct + input.concentradoPct;
  if (totalMix !== 100) {
    points -= 20;
    feedback.push(`A soma de Volumoso + Concentrado na matéria seca está em ${totalMix}% (ajuste para fechar 100%).`);
  }

  if (input.forragemPct < scenario.metaForragem[0] || input.forragemPct > scenario.metaForragem[1]) {
    points -= 25;
    feedback.push(
      `Volumoso (${input.forragemPct}%) fora da faixa ideal (${scenario.metaForragem[0]}%–${scenario.metaForragem[1]}%) para o equilíbrio ruminal/digestivo.`
    );
  } else {
    feedback.push(`Proporção de volumoso (${input.forragemPct}%) adequada à fisiologia da espécie.`);
  }

  if (input.concentradoPct < scenario.metaConcentrado[0] || input.concentradoPct > scenario.metaConcentrado[1]) {
    points -= 20;
    feedback.push(
      `Concentrado (${input.concentradoPct}%) fora da faixa recomendada (${scenario.metaConcentrado[0]}%–${scenario.metaConcentrado[1]}%).`
    );
  }

  if (input.aguaLitros < scenario.metaAguaLitros) {
    points -= 20;
    feedback.push(
      `Oferta hídrica insuficiente (${input.aguaLitros} L/dia). No semiárido, este lote exige pelo menos ${scenario.metaAguaLitros} L/dia.`
    );
  } else {
    feedback.push(`Dessedentação garantida (${input.aguaLitros} L/dia atendendo ao estresse térmico).`);
  }

  if (input.confortoNivel < scenario.metaSombraVentilacao) {
    points -= 15;
    feedback.push(
      `Ambiência abaixo do ideal (nível ${input.confortoNivel}/5; recomendado ≥ ${scenario.metaSombraVentilacao}/5 para bioclimatologia no Sertão).`
    );
  }

  const score = Math.max(0, Math.min(100, points));
  const status: RationEvaluation['status'] =
    score >= 85 ? 'Equilibrado' : score >= 55 ? 'Ajuste Moderado' : 'Risco Produtivo';
  const xpReward = score >= 85 ? 45 : score >= 55 ? 25 : 10;

  return { score, status, feedback, xpReward };
}

export const STORAGE_KEY = 'zoosertao_ifs_progress_v1';

export function loadProgress(): StudentProgress {
  if (typeof window === 'undefined') return INITIAL_PROGRESS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return INITIAL_PROGRESS;
    const parsed = JSON.parse(raw) as Partial<StudentProgress>;
    const today = new Date().toISOString().slice(0, 10);
    let streakDays = parsed.streakDays ?? 1;
    if (parsed.lastStudyDate && parsed.lastStudyDate !== today) {
      const prev = new Date(parsed.lastStudyDate);
      const curr = new Date(today);
      const diffDays = Math.round((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
      streakDays = diffDays === 1 ? streakDays + 1 : 1;
    }
    return {
      ...INITIAL_PROGRESS,
      ...parsed,
      streakDays,
      lastStudyDate: today,
      cardProgress: parsed.cardProgress ?? {},
      completedDisciplines: parsed.completedDisciplines ?? [],
      unlockedBadges: parsed.unlockedBadges ?? INITIAL_PROGRESS.unlockedBadges,
    };
  } catch {
    return INITIAL_PROGRESS;
  }
}

export function saveProgress(progress: StudentProgress): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // Ignore storage quota errors safely
  }
}
