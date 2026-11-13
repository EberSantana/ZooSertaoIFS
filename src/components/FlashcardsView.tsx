import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, RotateCcw, Shuffle } from 'lucide-react';
import { FLASHCARDS_PPC, type FlashcardItem } from '../data/studyContent';
import type { Rating, StudentProgress } from '../utils/gamification';

interface FlashcardsViewProps {
  progress: StudentProgress;
  initialYearFilter?: 1 | 2 | 3 | 'Todos';
  initialDisciplineFilter?: string;
  onRateCard: (cardId: string, rating: Rating) => number;
}

export const FlashcardsView: React.FC<FlashcardsViewProps> = ({
  progress,
  initialYearFilter = 'Todos',
  initialDisciplineFilter = 'Todas',
  onRateCard,
}) => {
  const [yearFilter, setYearFilter] = useState<1 | 2 | 3 | 'Todos'>(initialYearFilter);
  const [disciplineFilter, setDisciplineFilter] = useState<string>(initialDisciplineFilter);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [sessionReviewed, setSessionReviewed] = useState(0);
  const [sessionXp, setSessionXp] = useState(0);
  const [shuffleSeed, setShuffleSeed] = useState(0);
  const [lastFeedback, setLastFeedback] = useState<string | null>(null);

  useEffect(() => {
    setYearFilter(initialYearFilter);
  }, [initialYearFilter]);

  useEffect(() => {
    setDisciplineFilter(initialDisciplineFilter);
  }, [initialDisciplineFilter]);

  const availableDisciplines = useMemo(() => {
    const base =
      yearFilter === 'Todos'
        ? FLASHCARDS_PPC
        : FLASHCARDS_PPC.filter((c) => c.ano === yearFilter);
    const names = Array.from(new Set(base.map((c) => c.disciplinaNome)));
    return names.sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }, [yearFilter]);

  const deck = useMemo(() => {
    const filtered = FLASHCARDS_PPC.filter((c) => {
      const matchYear = yearFilter === 'Todos' || c.ano === yearFilter;
      const matchDisc = disciplineFilter === 'Todas' || c.disciplinaNome === disciplineFilter;
      return matchYear && matchDisc;
    });
    if (shuffleSeed === 0) return filtered;
    const copy = [...filtered];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = (i * 7 + shuffleSeed * 3) % (i + 1);
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }, [yearFilter, disciplineFilter, shuffleSeed]);

  useEffect(() => {
    setCurrentIndex(0);
    setIsFlipped(false);
  }, [yearFilter, disciplineFilter, shuffleSeed]);

  const activeCard: FlashcardItem | undefined = deck[currentIndex];
  const cardProgress = activeCard ? progress.cardProgress[activeCard.id] : undefined;

  const handleRate = (rating: Rating) => {
    if (!activeCard) return;
    const gained = onRateCard(activeCard.id, rating);
    setSessionReviewed((prev) => prev + 1);
    setSessionXp((prev) => prev + gained);
    setLastFeedback(`+${gained} XP registrados`);
    setIsFlipped(false);
    if (currentIndex + 1 < deck.length) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setCurrentIndex(0);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#1A241B]">
            Flashcards do PPC
          </h1>
          <p className="mt-1 text-sm text-[#525B50]">
            Toque na carta para virar e avalie sua memória para espaçar as revisões.
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs text-[#525B50]">
          <span>
            Revisadas na sessão:{' '}
            <strong className="font-mono tabular-nums text-[#1A241B]">{sessionReviewed}</strong>
          </span>
          <span aria-hidden="true">·</span>
          <span>
            Ganho:{' '}
            <strong className="font-mono tabular-nums text-[#157A42]">+{sessionXp} XP</strong>
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-[#E3E7DF] rounded-2xl p-4">
        <div className="flex items-center gap-1 p-1 bg-[#F1F4EE] rounded-xl overflow-x-auto max-w-full">
          {(['Todos', 1, 2, 3] as const).map((ano) => {
            const active = yearFilter === ano;
            return (
              <button
                key={String(ano)}
                type="button"
                onClick={() => {
                  setYearFilter(ano);
                  setDisciplineFilter('Todas');
                }}
                className={`min-h-[38px] px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  active
                    ? 'bg-white text-[#1A241B] shadow-sm'
                    : 'text-[#525B50] hover:text-[#1A241B]'
                }`}
              >
                {ano === 'Todos' ? 'Todos os Anos' : `${ano}º Ano`}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <label htmlFor="flashcard-discipline-select" className="sr-only">
            Filtrar por disciplina
          </label>
          <select
            id="flashcard-discipline-select"
            value={disciplineFilter}
            onChange={(e) => setDisciplineFilter(e.target.value)}
            className="min-h-[40px] px-3 py-2 rounded-xl border border-[#DCE2D7] bg-white text-sm text-[#1A241B] focus-visible:outline-2 focus-visible:outline-[#157A42]"
          >
            <option value="Todas">Todas as disciplinas ({FLASHCARDS_PPC.length})</option>
            {availableDisciplines.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => setShuffleSeed((s) => s + 1)}
            className="inline-flex items-center gap-1.5 min-h-[40px] px-3.5 py-2 rounded-xl border border-[#DCE2D7] hover:bg-[#F7F8F5] text-xs font-semibold text-[#1A241B] transition-colors cursor-pointer whitespace-nowrap"
          >
            <Shuffle className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Embaralhar</span>
          </button>
        </div>
      </div>

      {/* Flashcard Stage */}
      {deck.length === 0 || !activeCard ? (
        <div className="bg-white border border-[#E3E7DF] rounded-2xl p-10 text-center">
          <p className="text-base font-semibold text-[#1A241B]">
            Nenhum flashcard encontrado para este filtro.
          </p>
          <button
            type="button"
            onClick={() => {
              setYearFilter('Todos');
              setDisciplineFilter('Todas');
            }}
            className="mt-4 min-h-[44px] px-5 py-2 rounded-xl bg-[#157A42] text-white text-sm font-semibold cursor-pointer"
          >
            Mostrar todos os flashcards
          </button>
        </div>
      ) : (
        <div className="max-w-3xl mx-auto space-y-5">
          <div className="flex items-center justify-between text-xs text-[#525B50]">
            <span>
              Carta <strong className="font-mono tabular-nums text-[#1A241B]">{currentIndex + 1}</strong> de{' '}
              <strong className="font-mono tabular-nums text-[#1A241B]">{deck.length}</strong>
            </span>
            <div className="flex items-center gap-3">
              {lastFeedback && (
                <span className="font-mono font-semibold text-[#157A42]">{lastFeedback}</span>
              )}
              {cardProgress?.mastered && (
                <span className="inline-flex items-center gap-1 font-semibold text-[#157A42]">
                  <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Dominado</span>
                </span>
              )}
            </div>
          </div>

          {/* Interactive Card */}
          <div className="perspective-1000">
            <button
              type="button"
              onClick={() => setIsFlipped((prev) => !prev)}
              aria-label={isFlipped ? 'Mostrar pergunta do flashcard' : 'Virar flashcard para ver a resposta'}
              className="w-full text-left cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#157A42] rounded-2xl"
            >
              <div
                className={`relative w-full min-h-[300px] sm:min-h-[320px] transition-transform duration-300 preserve-3d ${
                  isFlipped ? 'rotate-y-180' : ''
                }`}
              >
                {/* Front */}
                <div className="absolute inset-0 backface-hidden bg-white border border-[#E3E7DF] rounded-2xl p-6 sm:p-8 flex flex-col justify-between">
                  <div>
                    <p className="text-xs font-medium text-[#525B50]">
                      {activeCard.ano}º Ano · Núcleo {activeCard.nucleo} · {activeCard.disciplinaNome}
                    </p>
                    <h2 className="mt-5 text-xl sm:text-2xl font-bold text-[#1A241B] leading-snug [text-wrap:balance]">
                      {activeCard.frente}
                    </h2>
                  </div>

                  <div className="pt-4 border-t border-[#EEF1EB] flex items-center justify-between text-xs text-[#525B50]">
                    <span>Toque no cartão para revelar a resposta técnica</span>
                    <span className="font-semibold text-[#157A42]">Virar carta →</span>
                  </div>
                </div>

                {/* Back */}
                <div className="absolute inset-0 backface-hidden rotate-y-180 bg-[#F4F8F5] border border-[#C6DEC9] rounded-2xl p-6 sm:p-8 flex flex-col justify-between">
                  <div>
                    <p className="text-xs font-semibold text-[#157A42]">
                      Resposta Técnica · {activeCard.disciplinaNome}
                    </p>
                    <p className="mt-4 text-base sm:text-lg font-medium text-[#1A241B] leading-relaxed">
                      {activeCard.verso}
                    </p>
                    <p className="mt-4 pt-3 border-t border-[#DCE8DF] text-xs sm:text-sm text-[#434C41] leading-relaxed">
                      <strong className="text-[#1A241B]">Aplicação em Poço Redondo:</strong>{' '}
                      {activeCard.contextoSertao}
                    </p>
                  </div>

                  <div className="pt-3 flex items-center justify-between text-xs text-[#525B50]">
                    <span>Avalie seu nível de acerto abaixo</span>
                    <span className="inline-flex items-center gap-1 font-medium">
                      <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Ver pergunta</span>
                    </span>
                  </div>
                </div>
              </div>
            </button>
          </div>

          {/* Action Controls */}
          {!isFlipped ? (
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => setIsFlipped(true)}
                className="w-full sm:w-auto min-h-[48px] px-8 py-3 rounded-xl bg-[#157A42] hover:bg-[#106134] text-white text-sm font-semibold transition-colors cursor-pointer"
              >
                Virar Carta
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3" role="group" aria-label="Avaliar dificuldade da carta">
              <button
                type="button"
                onClick={() => handleRate('dificil')}
                className="min-h-[48px] px-3 py-2.5 rounded-xl bg-[#FEF2F2] hover:bg-[#FEE2E2] border border-[#FECACA] text-[#991B1B] text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
              >
                Difícil (+8 XP)
              </button>
              <button
                type="button"
                onClick={() => handleRate('bom')}
                className="min-h-[48px] px-3 py-2.5 rounded-xl bg-[#FEF6E8] hover:bg-[#FDEBC8] border border-[#F5D79E] text-[#784304] text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
              >
                Bom (+15 XP)
              </button>
              <button
                type="button"
                onClick={() => handleRate('facil')}
                className="min-h-[48px] px-3 py-2.5 rounded-xl bg-[#EAF6EE] hover:bg-[#D5EEDF] border border-[#B8DEC5] text-[#106134] text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
              >
                Fácil (+20 XP)
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
