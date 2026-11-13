import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, CheckCircle2, Flame, RotateCcw, XCircle } from 'lucide-react';
import { QUIZ_QUESTIONS, type QuizQuestion } from '../data/studyContent';
import { calculateQuizXp } from '../utils/gamification';

interface QuizViewProps {
  initialYearFilter?: 1 | 2 | 3 | 'Todos';
  onFinishQuiz: (correctCount: number, totalQuestions: number, maxStreak: number) => {
    xpEarned: number;
    accuracy: number;
  };
}

const OPTION_LETTERS = ['A', 'B', 'C', 'D'] as const;

export const QuizView: React.FC<QuizViewProps> = ({
  initialYearFilter = 'Todos',
  onFinishQuiz,
}) => {
  const [yearFilter, setYearFilter] = useState<1 | 2 | 3 | 'Todos'>(initialYearFilter);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [finalResult, setFinalResult] = useState<{ xpEarned: number; accuracy: number } | null>(null);
  const [attemptSeed, setAttemptSeed] = useState(0);

  useEffect(() => {
    setYearFilter(initialYearFilter);
  }, [initialYearFilter]);

  const questions = useMemo<QuizQuestion[]>(() => {
    const pool =
      yearFilter === 'Todos'
        ? QUIZ_QUESTIONS
        : QUIZ_QUESTIONS.filter((q) => q.ano === yearFilter);

    // Deterministic order by seed so "Refazer" gives fresh variety
    const ordered = [...pool];
    if (attemptSeed > 0) {
      ordered.sort((a, b) => {
        const ha = (a.id.charCodeAt(2) * 17 + attemptSeed * 13) % 97;
        const hb = (b.id.charCodeAt(2) * 17 + attemptSeed * 13) % 97;
        return ha - hb;
      });
    }
    return ordered.slice(0, 8);
  }, [yearFilter, attemptSeed]);

  const restartQuiz = (nextYear?: 1 | 2 | 3 | 'Todos', nextSeed = attemptSeed) => {
    if (nextYear !== undefined) setYearFilter(nextYear);
    setAttemptSeed(nextSeed);
    setQuestionIndex(0);
    setSelectedOption(null);
    setCorrectCount(0);
    setCurrentStreak(0);
    setMaxStreak(0);
    setIsCompleted(false);
    setFinalResult(null);
  };

  const currentQuestion = questions[questionIndex];

  const handleSelectOption = (idx: number) => {
    if (selectedOption !== null || !currentQuestion) return;
    setSelectedOption(idx);
    if (idx === currentQuestion.correta) {
      setCorrectCount((prev) => prev + 1);
      setCurrentStreak((prev) => {
        const next = prev + 1;
        setMaxStreak((m) => Math.max(m, next));
        return next;
      });
    } else {
      setCurrentStreak(0);
    }
  };

  const handleNext = () => {
    if (questionIndex + 1 < questions.length) {
      setQuestionIndex((prev) => prev + 1);
      setSelectedOption(null);
    } else {
      const result = onFinishQuiz(correctCount, questions.length, maxStreak);
      setFinalResult(result);
      setIsCompleted(true);
    }
  };

  const livePreview = calculateQuizXp(correctCount, questions.length, maxStreak);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#1A241B]">
            Quiz de Múltipla Escolha
          </h1>
          <p className="mt-1 text-sm text-[#525B50]">
            Questões contextualizadas ao PPC de Zootecnia e à realidade do Semiárido Sergipano.
          </p>
        </div>

        {/* Year Filter Segmented Control */}
        <div className="flex items-center gap-1 p-1 bg-[#EAEFE7] rounded-xl self-start md:self-auto overflow-x-auto max-w-full">
          {(['Todos', 1, 2, 3] as const).map((ano) => {
            const active = yearFilter === ano;
            return (
              <button
                key={String(ano)}
                type="button"
                onClick={() => restartQuiz(ano)}
                className={`min-h-[38px] px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  active
                    ? 'bg-white text-[#1A241B] shadow-sm'
                    : 'text-[#525B50] hover:text-[#1A241B]'
                }`}
              >
                {ano === 'Todos' ? 'Simulado Geral' : `${ano}º Ano`}
              </button>
            );
          })}
        </div>
      </div>

      {isCompleted && finalResult ? (
        <div className="max-w-2xl mx-auto bg-white border border-[#E3E7DF] rounded-2xl p-6 sm:p-8">
          <p className="text-xs font-semibold text-[#157A42]">Rodada Concluída</p>
          <h2 className="mt-1 text-2xl sm:text-3xl font-bold text-[#1A241B]">
            {finalResult.accuracy >= 80
              ? 'Excelente domínio técnico!'
              : finalResult.accuracy >= 60
              ? 'Bom progresso no PPC!'
              : 'Continue praticando os conceitos'}
          </h2>
          <p className="mt-2 text-sm text-[#4C564A]">
            Você concluiu {questions.length} questões sobre o currículo do IFS Campus Poço Redondo.
          </p>

          <dl className="mt-6 pt-6 border-t border-[#E3E7DF] grid grid-cols-3 gap-4">
            <div>
              <dt className="text-xs text-[#525B50]">Aproveitamento</dt>
              <dd className="mt-1 font-mono tabular-nums text-2xl font-bold text-[#1A241B]">
                {finalResult.accuracy}%
              </dd>
            </div>
            <div>
              <dt className="text-xs text-[#525B50]">Acertos</dt>
              <dd className="mt-1 font-mono tabular-nums text-2xl font-bold text-[#157A42]">
                {correctCount}/{questions.length}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-[#525B50]">XP Conquistado</dt>
              <dd className="mt-1 font-mono tabular-nums text-2xl font-bold text-[#B86A0A]">
                +{finalResult.xpEarned}
              </dd>
            </div>
          </dl>

          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => restartQuiz(undefined, attemptSeed + 1)}
              className="inline-flex items-center gap-2 min-h-[44px] px-5 py-2.5 rounded-xl bg-[#157A42] hover:bg-[#106134] text-white text-sm font-semibold transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" aria-hidden="true" />
              <span>Nova Rodada</span>
            </button>
          </div>
        </div>
      ) : currentQuestion ? (
        <div className="max-w-3xl mx-auto space-y-5">
          {/* Progress & Streak Header */}
          <div className="bg-white border border-[#E3E7DF] rounded-2xl p-4 sm:p-5">
            <div className="flex items-center justify-between text-xs text-[#525B50] mb-2">
              <span>
                Questão{' '}
                <strong className="font-mono tabular-nums text-[#1A241B]">
                  {questionIndex + 1}
                </strong>{' '}
                de{' '}
                <strong className="font-mono tabular-nums text-[#1A241B]">
                  {questions.length}
                </strong>
              </span>
              <div className="flex items-center gap-4">
                <span className="inline-flex items-center gap-1 font-mono tabular-nums font-semibold text-[#B86A0A]">
                  <Flame className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Combo {currentStreak}x</span>
                </span>
                <span className="font-mono tabular-nums font-semibold text-[#157A42]">
                  Previsto: +{livePreview.xpEarned} XP
                </span>
              </div>
            </div>
            <div className="w-full h-2 bg-[#EDF0EA] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#157A42] transition-all duration-200"
                style={{
                  width: `${Math.round(((questionIndex + (selectedOption !== null ? 1 : 0)) / questions.length) * 100)}%`,
                }}
              />
            </div>
          </div>

          {/* Question Card */}
          <div className="bg-white border border-[#E3E7DF] rounded-2xl p-6 sm:p-8">
            <p className="text-xs font-medium text-[#525B50]">
              {currentQuestion.ano}º Ano · Núcleo {currentQuestion.nucleo} · {currentQuestion.disciplinaNome}
            </p>
            <h2 className="mt-2.5 text-lg sm:text-xl font-bold text-[#1A241B] leading-snug">
              {currentQuestion.enunciado}
            </h2>

            <div className="mt-6 space-y-3" role="radiogroup" aria-label="Alternativas da questão">
              {currentQuestion.alternativas.map((alt, idx) => {
                const isSelected = selectedOption === idx;
                const isCorrect = idx === currentQuestion.correta;
                const hasAnswered = selectedOption !== null;

                let containerStyle =
                  'border-[#DCE2D7] bg-white hover:bg-[#F7F8F5] text-[#1A241B]';
                if (hasAnswered) {
                  if (isCorrect) {
                    containerStyle =
                      'border-[#157A42] bg-[#EAF6EE] text-[#104E2A] font-medium';
                  } else if (isSelected && !isCorrect) {
                    containerStyle =
                      'border-[#DC2626] bg-[#FEF2F2] text-[#7F1D1D]';
                  } else {
                    containerStyle =
                      'border-[#E8ECE5] bg-[#FAFBF9] text-[#6A7368]';
                  }
                }

                return (
                  <button
                    key={alt}
                    type="button"
                    disabled={hasAnswered}
                    onClick={() => handleSelectOption(idx)}
                    className={`w-full min-h-[52px] text-left px-4 py-3.5 rounded-xl border transition-colors flex items-start justify-between gap-3 cursor-pointer disabled:cursor-default focus-visible:outline-2 focus-visible:outline-[#157A42] ${containerStyle}`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="font-mono tabular-nums text-xs font-bold mt-0.5 shrink-0">
                        {OPTION_LETTERS[idx]})
                      </span>
                      <span className="text-sm sm:text-base leading-relaxed">{alt}</span>
                    </div>
                    {hasAnswered && isCorrect && (
                      <CheckCircle2 className="w-5 h-5 text-[#157A42] shrink-0 mt-0.5" aria-label="Resposta correta" />
                    )}
                    {hasAnswered && isSelected && !isCorrect && (
                      <XCircle className="w-5 h-5 text-[#DC2626] shrink-0 mt-0.5" aria-label="Resposta incorreta" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Pedagogical Explanation */}
            {selectedOption !== null && (
              <div className="mt-6 pt-5 border-t border-[#E3E7DF] space-y-4">
                <div className="rounded-xl bg-[#F4F8F5] border border-[#D4E6D9] p-4">
                  <p className="text-xs font-semibold text-[#157A42]">
                    {selectedOption === currentQuestion.correta
                      ? 'Resposta Correta · Comentário Pedagógico'
                      : 'Gabarito Comentado'}
                  </p>
                  <p className="mt-1.5 text-sm text-[#2B362C] leading-relaxed">
                    {currentQuestion.explicacao}
                  </p>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleNext}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 min-h-[46px] px-6 py-2.5 rounded-xl bg-[#157A42] hover:bg-[#106134] text-white text-sm font-semibold transition-colors cursor-pointer"
                  >
                    <span>
                      {questionIndex + 1 < questions.length
                        ? 'Próxima Pergunta'
                        : 'Ver Resultado Final'}
                    </span>
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
};
