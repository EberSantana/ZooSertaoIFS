import React from 'react';
import {
  ArrowRight,
  Award,
  BookOpen,
  CheckCircle2,
  Flame,
  Gamepad2,
  Layers,
  MapPin,
  Sparkles,
  Trophy,
} from 'lucide-react';
import {
  COURSE_INFO,
  DESTAQUES_REGIAO,
  DISCIPLINAS_PPC,
  PLANTEL_POCO_REDONDO,
} from '../data/ppcData';
import { FLASHCARDS_PPC, QUIZ_QUESTIONS } from '../data/studyContent';
import {
  BADGE_CATALOG,
  calculateLevel,
  type StudentProgress,
} from '../utils/gamification';
import type { AppTab } from './TopNav';

interface DashboardViewProps {
  progress: StudentProgress;
  onNavigate: (tab: AppTab, yearFilter?: 1 | 2 | 3) => void;
  onResetProgress: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  progress,
  onNavigate,
  onResetProgress,
}) => {
  const levelInfo = calculateLevel(progress.xp);
  const masteredCount = Object.values(progress.cardProgress).filter((c) => c.mastered).length;

  const yearStats = ([1, 2, 3] as const).map((ano) => {
    const discs = DISCIPLINAS_PPC.filter((d) => d.ano === ano);
    const totalHoras = discs.reduce((acc, d) => acc + d.cargaHoraria, 0);
    const cardsTotal = FLASHCARDS_PPC.filter((c) => c.ano === ano).length;
    const cardsMastered = FLASHCARDS_PPC.filter(
      (c) => c.ano === ano && progress.cardProgress[c.id]?.mastered
    ).length;
    const quizTotal = QUIZ_QUESTIONS.filter((q) => q.ano === ano).length;
    return {
      ano,
      disciplinasCount: discs.length,
      totalHoras: Math.round(totalHoras * 10) / 10,
      cardsTotal,
      cardsMastered,
      quizTotal,
    };
  });

  return (
    <div className="space-y-10">
      {/* Hero Split Section */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        <div className="lg:col-span-7 flex flex-col justify-between bg-white border border-[#E3E7DF] rounded-2xl p-6 sm:p-8">
          <div>
            <p className="text-xs font-medium text-[#525B50] flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#157A42] shrink-0" aria-hidden="true" />
              <span>{COURSE_INFO.campus} · {COURSE_INFO.resolucao}</span>
            </p>
            <h1 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight text-[#1A241B] [text-wrap:balance]">
              Ambiente Gamificado de Estudos em Zootecnia
            </h1>
            <p className="mt-3 text-base text-[#4C564A] leading-relaxed max-w-2xl">
              Domine as 44 disciplinas da matriz curricular e a Prática Profissional Integrada do Curso Técnico Integrado com flashcards espaçados, simulados comentados e desafios aplicados ao Semiárido Sergipano.
            </p>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => onNavigate('quiz')}
              className="inline-flex items-center gap-2 min-h-[44px] px-5 py-2.5 rounded-xl bg-[#157A42] hover:bg-[#106134] text-white text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#157A42]"
            >
              <span>Iniciar Quiz do PPC</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => onNavigate('flashcards')}
              className="inline-flex items-center gap-2 min-h-[44px] px-5 py-2.5 rounded-xl bg-[#F1F4EE] hover:bg-[#E5EAE1] text-[#1A241B] text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Layers className="w-4 h-4 text-[#157A42]" aria-hidden="true" />
              <span>Revisar Flashcards</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('ludico')}
              className="inline-flex items-center gap-2 min-h-[44px] px-4 py-2.5 rounded-xl border border-[#DCE2D7] hover:bg-[#F7F8F5] text-[#1A241B] text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Gamepad2 className="w-4 h-4 text-[#B86A0A]" aria-hidden="true" />
              <span>Jogos Lúdicos</span>
            </button>
          </div>
        </div>

        {/* Gamified Student Progress Panel */}
        <div className="lg:col-span-5 bg-white border border-[#E3E7DF] rounded-2xl p-6 sm:p-8 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-medium text-[#525B50]">Seu Desempenho Atual</p>
                <h2 className="mt-1 text-xl font-bold text-[#1A241B]">
                  Nível {levelInfo.level} — {levelInfo.title}
                </h2>
              </div>
              <div className="text-right shrink-0">
                <span className="font-mono tabular-nums text-2xl font-bold text-[#157A42]">
                  {progress.xp}
                </span>
                <span className="block text-xs text-[#525B50] font-medium">XP total</span>
              </div>
            </div>

            {/* Level Progress Bar */}
            <div className="mt-5">
              <div className="flex items-center justify-between text-xs text-[#525B50] mb-1.5">
                <span>Progresso para o próximo nível</span>
                <span className="font-mono tabular-nums font-medium text-[#1A241B]">
                  {levelInfo.currentLevelXp} / {levelInfo.nextLevelXp} XP ({levelInfo.progressPercent}%)
                </span>
              </div>
              <div
                className="w-full h-2.5 bg-[#EDF0EA] rounded-full overflow-hidden"
                role="progressbar"
                aria-valuenow={levelInfo.progressPercent}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Progresso de XP para o próximo nível"
              >
                <div
                  className="h-full bg-[#157A42] transition-transform duration-300 origin-left"
                  style={{ width: `${levelInfo.progressPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* 4 Compact Metrics (Unboxed hairline grid) */}
          <dl className="mt-6 pt-6 border-t border-[#E3E7DF] grid grid-cols-2 gap-4">
            <div>
              <dt className="text-xs text-[#525B50] flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-[#C97A16]" aria-hidden="true" />
                <span>Ofensiva diária</span>
              </dt>
              <dd className="mt-1 font-mono tabular-nums text-lg font-bold text-[#1A241B]">
                {progress.streakDays} {progress.streakDays === 1 ? 'dia' : 'dias'}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-[#525B50] flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#157A42]" aria-hidden="true" />
                <span>Cards dominados</span>
              </dt>
              <dd className="mt-1 font-mono tabular-nums text-lg font-bold text-[#1A241B]">
                {masteredCount} / {FLASHCARDS_PPC.length}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-[#525B50] flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5 text-[#C97A16]" aria-hidden="true" />
                <span>Melhor Quiz</span>
              </dt>
              <dd className="mt-1 font-mono tabular-nums text-lg font-bold text-[#1A241B]">
                {progress.bestQuizAccuracy}%
              </dd>
            </div>
            <div>
              <dt className="text-xs text-[#525B50] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#157A42]" aria-hidden="true" />
                <span>Atividades lúdicas</span>
              </dt>
              <dd className="mt-1 font-mono tabular-nums text-lg font-bold text-[#1A241B]">
                {progress.ludicCompleted} concluídas
              </dd>
            </div>
          </dl>
        </div>
      </section>

      {/* Regional Context KPI Strip (4-column full-width below hero split) */}
      <section aria-labelledby="regiao-heading">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-4">
          <div>
            <h2 id="regiao-heading" className="text-xl font-bold text-[#1A241B]">
              Realidade Produtiva de Poço Redondo
            </h2>
            <p className="text-sm text-[#525B50]">
              Indicadores oficiais do PPC (IBGE / SEAGRI / SERGIPE) que orientam os estudos práticos no Alto Sertão.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('ppc')}
            className="text-sm font-semibold text-[#157A42] hover:text-[#106134] inline-flex items-center gap-1 self-start sm:self-auto cursor-pointer whitespace-nowrap"
          >
            <span>Explorar Matriz Curricular</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {DESTAQUES_REGIAO.map((item) => (
            <article
              key={item.titulo}
              className="bg-white border border-[#E3E7DF] rounded-2xl p-5"
            >
              <p className="text-xs font-medium text-[#525B50]">{item.titulo}</p>
              <p className="mt-1.5 font-mono tabular-nums text-2xl font-bold text-[#157A42]">
                {item.valor}
              </p>
              <p className="mt-2 text-sm text-[#4C564A] leading-relaxed">{item.detalhe}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Trilhas por Ano Letivo */}
      <section aria-labelledby="trilhas-heading">
        <h2 id="trilhas-heading" className="text-xl font-bold text-[#1A241B] mb-1">
          Trilhas de Estudo por Ano do Curso Integrado
        </h2>
        <p className="text-sm text-[#525B50] mb-5">
          Carga horária total de 3.400,9 horas distribuída em 3 anos letivos de 40 semanas.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {yearStats.map((item) => (
            <div
              key={item.ano}
              className="bg-white border border-[#E3E7DF] rounded-2xl p-6 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="text-lg font-bold text-[#1A241B]">{item.ano}º Ano Integrado</h3>
                  <span className="font-mono tabular-nums text-sm font-semibold text-[#157A42]">
                    {item.totalHoras}h
                  </span>
                </div>
                <p className="mt-1 text-xs text-[#525B50]">
                  {item.disciplinasCount} disciplinas · {item.cardsTotal} flashcards · {item.quizTotal} questões
                </p>
                <p className="mt-3 text-sm text-[#4C564A] leading-relaxed">
                  {item.ano === 1 &&
                    'Fundamentos de Zootecnia Geral, Edafologia, Biologia Celular, Segurança no Trabalho e Informática.'}
                  {item.ano === 2 &&
                    'Plantas Forrageiras, Convivência com o Semiárido, Mecanização, Monogástricos e Alimentação Animal.'}
                  {item.ano === 3 &&
                    'Ruminantes (Bovinos, Ovinos e Caprinos), TPOA, Higiene e Profilaxia, Instalações, Culturas Alternativas e Extensão Rural.'}
                </p>
              </div>

              <div className="mt-5 pt-4 border-t border-[#E3E7DF] flex items-center justify-between gap-2">
                <span className="text-xs font-mono tabular-nums text-[#525B50]">
                  Dominados: {item.cardsMastered}/{item.cardsTotal}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onNavigate('flashcards', item.ano)}
                    className="min-h-[40px] px-3 py-1.5 rounded-lg bg-[#F1F4EE] hover:bg-[#E3EAE0] text-xs font-semibold text-[#1A241B] transition-colors cursor-pointer whitespace-nowrap"
                  >
                    Cards
                  </button>
                  <button
                    type="button"
                    onClick={() => onNavigate('quiz', item.ano)}
                    className="min-h-[40px] px-3 py-1.5 rounded-lg bg-[#157A42] hover:bg-[#106134] text-xs font-semibold text-white transition-colors cursor-pointer whitespace-nowrap"
                  >
                    Quiz
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Two-Column Split: Plantel Animal Table & Achievement Badges */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-6 bg-white border border-[#E3E7DF] rounded-2xl p-6">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div>
              <h2 className="text-lg font-bold text-[#1A241B]">Plantel Animal de Poço Redondo</h2>
              <p className="text-xs text-[#525B50]">Tabela 1 do PPC · Referência SERGIPE (2022)</p>
            </div>
            <BookOpen className="w-5 h-5 text-[#157A42] shrink-0" aria-hidden="true" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E3E7DF] text-xs text-[#525B50]">
                  <th className="py-2.5 pr-4 font-semibold">Tipo de Rebanho</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Cabeças</th>
                  <th className="py-2.5 pl-3 font-semibold text-right">Posição SE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EEF1EB]">
                {PLANTEL_POCO_REDONDO.map((row) => (
                  <tr key={row.rebanho}>
                    <td className="py-2.5 pr-4 font-medium text-[#1A241B]">{row.rebanho}</td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-[#1A241B]">
                      {row.cabecas.toLocaleString('pt-BR')}
                    </td>
                    <td className="py-2.5 pl-3 text-right font-mono tabular-nums text-xs font-semibold text-[#157A42]">
                      {row.posicaoEstado}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Conquistas / Insígnias */}
        <div className="lg:col-span-6 bg-white border border-[#E3E7DF] rounded-2xl p-6">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div>
              <h2 className="text-lg font-bold text-[#1A241B]">Insígnias do Zootecnista</h2>
              <p className="text-xs text-[#525B50]">
                Desbloqueadas: {progress.unlockedBadges.length} de {BADGE_CATALOG.length}
              </p>
            </div>
            <Award className="w-5 h-5 text-[#C97A16] shrink-0" aria-hidden="true" />
          </div>

          <ul className="divide-y divide-[#EEF1EB]">
            {BADGE_CATALOG.map((badge) => {
              const unlocked = progress.unlockedBadges.includes(badge.id);
              return (
                <li key={badge.id} className="py-3 flex items-start justify-between gap-4">
                  <div>
                    <p className={`text-sm font-semibold ${unlocked ? 'text-[#1A241B]' : 'text-[#6A7368]'}`}>
                      {badge.name}
                    </p>
                    <p className="text-xs text-[#525B50] mt-0.5">{badge.description}</p>
                  </div>
                  <span
                    className={`text-xs font-mono shrink-0 ${
                      unlocked ? 'font-semibold text-[#157A42]' : 'text-[#7C857A]'
                    }`}
                  >
                    {unlocked ? 'Conquistada' : badge.criteriaText}
                  </span>
                </li>
              );
            })}
          </ul>

          <div className="mt-4 pt-4 border-t border-[#E3E7DF] flex items-center justify-between gap-4">
            <span className="text-xs text-[#525B50]">Seu progresso fica salvo neste dispositivo.</span>
            <button
              type="button"
              onClick={onResetProgress}
              className="text-xs font-semibold text-[#6A7368] hover:text-[#B42318] transition-colors cursor-pointer"
            >
              Reiniciar progresso
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
