import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  Droplets,
  Flame,
  Gamepad2,
  Link2,
  RotateCcw,
  SlidersHorizontal,
  Sun,
  Tag,
  XCircle,
} from 'lucide-react';
import {
  CLASSIFIER_ITEMS,
  MATCH_DECKS,
  RATION_SCENARIOS,
  type ClassifierItem,
} from '../data/studyContent';
import { evaluateRationScenario, type RationEvaluation } from '../utils/gamification';

interface LudicHubViewProps {
  onAwardLudicXp: (xp: number, maxCombo: number) => void;
}

type LudicMode = 'conexao' | 'curralinho' | 'classificador';

const CAMPUS_CATEGORIES: ClassifierItem['categoriaCorreta'][] = [
  'Campo Agrostológico',
  'Aprisco & Ruminantes',
  'Monogástricos & Apoio',
  'Gestão & Extensão',
];

export const LudicHubView: React.FC<LudicHubViewProps> = ({ onAwardLudicXp }) => {
  const [activeMode, setActiveMode] = useState<LudicMode>('conexao');

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#1A241B]">
            Atividades Lúdicas & Simulador
          </h1>
          <p className="mt-1 text-sm text-[#525B50]">
            Aprenda jogando com desafios práticos do Campus Poço Redondo e manejo no Semiárido.
          </p>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex items-center gap-1 p-1 bg-[#EAEFE7] rounded-xl self-start md:self-auto overflow-x-auto max-w-full">
          <button
            type="button"
            onClick={() => setActiveMode('conexao')}
            className={`inline-flex items-center gap-1.5 min-h-[40px] px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeMode === 'conexao'
                ? 'bg-white text-[#1A241B] shadow-sm'
                : 'text-[#525B50] hover:text-[#1A241B]'
            }`}
          >
            <Link2 className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Conexão Zootécnica</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveMode('curralinho')}
            className={`inline-flex items-center gap-1.5 min-h-[40px] px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeMode === 'curralinho'
                ? 'bg-white text-[#1A241B] shadow-sm'
                : 'text-[#525B50] hover:text-[#1A241B]'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Desafio do Curralinho</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveMode('classificador')}
            className={`inline-flex items-center gap-1.5 min-h-[40px] px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeMode === 'classificador'
                ? 'bg-white text-[#1A241B] shadow-sm'
                : 'text-[#525B50] hover:text-[#1A241B]'
            }`}
          >
            <Tag className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Classificador do Campus</span>
          </button>
        </div>
      </div>

      {activeMode === 'conexao' && <ConexaoGame onAwardXp={onAwardLudicXp} />}
      {activeMode === 'curralinho' && <CurralinhoSimulator onAwardXp={onAwardLudicXp} />}
      {activeMode === 'classificador' && <CampusClassifier onAwardXp={onAwardLudicXp} />}
    </div>
  );
};

// ===================== 1. CONEXÃO ZOOTÉCNICA =====================
const ConexaoGame: React.FC<{ onAwardXp: (xp: number, combo: number) => void }> = ({
  onAwardXp,
}) => {
  const [deckIndex, setDeckIndex] = useState(0);
  const [selectedTermId, setSelectedTermId] = useState<string | null>(null);
  const [matchedIds, setMatchedIds] = useState<string[]>([]);
  const [wrongPair, setWrongPair] = useState<{ termId: string; conceptId: string } | null>(null);
  const [moves, setMoves] = useState(0);
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const [awarded, setAwarded] = useState(false);

  const deck = MATCH_DECKS[deckIndex];

  // Deterministically shuffle concepts per deck so they don't align 1-to-1
  const shuffledConcepts = useMemo(() => {
    const items = [...deck.pares];
    items.sort((a, b) => a.conceito.localeCompare(b.conceito, 'pt-BR'));
    return items;
  }, [deck]);

  const resetDeck = (nextIndex = deckIndex) => {
    setDeckIndex(nextIndex);
    setSelectedTermId(null);
    setMatchedIds([]);
    setWrongPair(null);
    setMoves(0);
    setCombo(0);
    setBestCombo(0);
    setAwarded(false);
  };

  const handleSelectConcept = (conceptId: string) => {
    if (!selectedTermId || matchedIds.includes(conceptId)) return;
    setMoves((m) => m + 1);

    if (selectedTermId === conceptId) {
      const nextMatched = [...matchedIds, conceptId];
      const nextCombo = combo + 1;
      const nextBest = Math.max(bestCombo, nextCombo);
      setMatchedIds(nextMatched);
      setCombo(nextCombo);
      setBestCombo(nextBest);
      setSelectedTermId(null);
      setWrongPair(null);

      if (nextMatched.length === deck.pares.length && !awarded) {
        setAwarded(true);
        const xp = Math.max(30, 60 - Math.max(0, moves + 1 - deck.pares.length) * 4);
        onAwardXp(xp, nextBest);
      }
    } else {
      setCombo(0);
      setWrongPair({ termId: selectedTermId, conceptId });
      setTimeout(() => {
        setWrongPair(null);
        setSelectedTermId(null);
      }, 650);
    }
  };

  const isCompleted = matchedIds.length === deck.pares.length;

  return (
    <section className="bg-white border border-[#E3E7DF] rounded-2xl p-6 sm:p-8 space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-[#525B50]">
            Associação de Pares · {deck.ano === 'Todos' ? 'Todo o Curso' : `${deck.ano}º Ano`}
          </p>
          <h2 className="mt-1 text-xl font-bold text-[#1A241B]">{deck.titulo}</h2>
          <p className="text-sm text-[#4C564A] mt-0.5">{deck.subtitulo}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {MATCH_DECKS.map((d, idx) => (
            <button
              key={d.id}
              type="button"
              onClick={() => resetDeck(idx)}
              className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer whitespace-nowrap ${
                idx === deckIndex
                  ? 'border-[#157A42] bg-[#EAF6EE] text-[#106134]'
                  : 'border-[#DCE2D7] bg-white text-[#4C564A] hover:bg-[#F7F8F5]'
              }`}
            >
              Tema {idx + 1}
            </button>
          ))}
        </div>
      </div>

      {/* Live Game Stats */}
      <div className="flex flex-wrap items-center justify-between gap-3 py-3 px-4 rounded-xl bg-[#F7F8F5] border border-[#E3E7DF] text-xs">
        <div className="flex items-center gap-4">
          <span>
            Pares conectados:{' '}
            <strong className="font-mono tabular-nums text-[#1A241B]">
              {matchedIds.length}/{deck.pares.length}
            </strong>
          </span>
          <span>
            Tentativas:{' '}
            <strong className="font-mono tabular-nums text-[#1A241B]">{moves}</strong>
          </span>
          <span className="inline-flex items-center gap-1 font-mono tabular-nums font-semibold text-[#B86A0A]">
            <Flame className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Combo {combo}x</span>
          </span>
        </div>

        <button
          type="button"
          onClick={() => resetDeck(deckIndex)}
          className="inline-flex items-center gap-1.5 font-semibold text-[#157A42] hover:text-[#106134] cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Reiniciar tabuleiro</span>
        </button>
      </div>

      {isCompleted ? (
        <div className="rounded-2xl bg-[#F4F8F5] border border-[#C6DEC9] p-6 text-center space-y-3">
          <CheckCircle2 className="w-8 h-8 text-[#157A42] mx-auto" aria-hidden="true" />
          <h3 className="text-xl font-bold text-[#1A241B]">Tabuleiro Concluído!</h3>
          <p className="text-sm text-[#4C564A]">
            Você conectou todos os {deck.pares.length} conceitos em{' '}
            <strong className="font-mono tabular-nums">{moves}</strong> tentativas (Combo máximo: {bestCombo}x).
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <button
              type="button"
              onClick={() => resetDeck((deckIndex + 1) % MATCH_DECKS.length)}
              className="min-h-[44px] px-5 py-2 rounded-xl bg-[#157A42] hover:bg-[#106134] text-white text-sm font-semibold cursor-pointer"
            >
              Próximo Tema
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Terms Column */}
          <div className="space-y-2.5">
            <p className="text-xs font-semibold text-[#525B50]">1. Escolha um termo técnico</p>
            {deck.pares.map((par) => {
              const isMatched = matchedIds.includes(par.id);
              const isSelected = selectedTermId === par.id;
              const isWrong = wrongPair?.termId === par.id;
              return (
                <button
                  key={par.id}
                  type="button"
                  disabled={isMatched}
                  onClick={() => setSelectedTermId(isSelected ? null : par.id)}
                  className={`w-full min-h-[52px] px-4 py-3 rounded-xl border text-left text-sm font-semibold transition-colors flex items-center justify-between gap-2 cursor-pointer disabled:cursor-default ${
                    isMatched
                      ? 'border-[#C6DEC9] bg-[#EAF6EE] text-[#106134] opacity-75'
                      : isWrong
                      ? 'border-[#DC2626] bg-[#FEF2F2] text-[#991B1B]'
                      : isSelected
                      ? 'border-[#157A42] bg-[#EAF6EE] text-[#104E2A] ring-2 ring-[#157A42]/20'
                      : 'border-[#DCE2D7] bg-white hover:bg-[#F7F8F5] text-[#1A241B]'
                  }`}
                >
                  <span>{par.termo}</span>
                  {isMatched && <CheckCircle2 className="w-4 h-4 text-[#157A42] shrink-0" />}
                </button>
              );
            })}
          </div>

          {/* Concepts Column */}
          <div className="space-y-2.5">
            <p className="text-xs font-semibold text-[#525B50]">2. Conecte à definição correspondente</p>
            {shuffledConcepts.map((par) => {
              const isMatched = matchedIds.includes(par.id);
              const isWrong = wrongPair?.conceptId === par.id;
              return (
                <button
                  key={par.id}
                  type="button"
                  disabled={isMatched || !selectedTermId}
                  onClick={() => handleSelectConcept(par.id)}
                  className={`w-full min-h-[52px] px-4 py-3 rounded-xl border text-left text-sm transition-colors flex items-center justify-between gap-2 cursor-pointer disabled:cursor-default ${
                    isMatched
                      ? 'border-[#C6DEC9] bg-[#EAF6EE] text-[#106134] opacity-75'
                      : isWrong
                      ? 'border-[#DC2626] bg-[#FEF2F2] text-[#991B1B]'
                      : selectedTermId
                      ? 'border-[#B8DEC5] bg-white hover:bg-[#F4F8F5] text-[#1A241B]'
                      : 'border-[#E5EAE0] bg-[#FAFBF9] text-[#525B50]'
                  }`}
                >
                  <span className="leading-snug">{par.conceito}</span>
                  {isMatched && <CheckCircle2 className="w-4 h-4 text-[#157A42] shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
};

// ===================== 2. DESAFIO DO CURRALINHO (SIMULADOR) =====================
const CurralinhoSimulator: React.FC<{ onAwardXp: (xp: number, combo: number) => void }> = ({
  onAwardXp,
}) => {
  const [scenarioIdx, setScenarioIdx] = useState(0);
  const [forragemPct, setForragemPct] = useState(60);
  const [concentradoPct, setConcentradoPct] = useState(40);
  const [aguaLitros, setAguaLitros] = useState(50);
  const [confortoNivel, setConfortoNivel] = useState(3);
  const [evaluation, setEvaluation] = useState<RationEvaluation | null>(null);

  const scenario = RATION_SCENARIOS[scenarioIdx];

  const handleSelectScenario = (idx: number) => {
    setScenarioIdx(idx);
    setEvaluation(null);
    if (idx === 0) {
      setForragemPct(60);
      setConcentradoPct(40);
      setAguaLitros(55);
      setConfortoNivel(3);
    } else if (idx === 1) {
      setForragemPct(70);
      setConcentradoPct(30);
      setAguaLitros(8);
      setConfortoNivel(2);
    } else {
      setForragemPct(80);
      setConcentradoPct(20);
      setAguaLitros(35);
      setConfortoNivel(3);
    }
  };

  const handleVerify = () => {
    const result = evaluateRationScenario(scenario, {
      forragemPct,
      concentradoPct,
      aguaLitros,
      confortoNivel,
    });
    setEvaluation(result);
    onAwardXp(result.xpReward, result.score >= 85 ? 2 : 1);
  };

  const dryMatterSum = forragemPct + concentradoPct;

  return (
    <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
      {/* Left Zone: Interactive Visual Stage */}
      <div className="lg:col-span-7 bg-white border border-[#E3E7DF] rounded-2xl p-6 sm:p-8 flex flex-col justify-between">
        <div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-[#525B50]">
                {scenario.categoria} · {scenario.estacao}
              </p>
              <h2 className="mt-1 text-xl font-bold text-[#1A241B]">{scenario.titulo}</h2>
            </div>

            <div className="flex items-center gap-1 p-1 bg-[#F1F4EE] rounded-xl">
              {RATION_SCENARIOS.map((sc, idx) => (
                <button
                  key={sc.id}
                  type="button"
                  onClick={() => handleSelectScenario(idx)}
                  className={`min-h-[36px] px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                    idx === scenarioIdx
                      ? 'bg-white text-[#1A241B] shadow-sm'
                      : 'text-[#525B50] hover:text-[#1A241B]'
                  }`}
                >
                  Lote {idx + 1}
                </button>
              ))}
            </div>
          </div>

          {/* Live Dry-Matter & Ambiência Visual Gauge */}
          <div className="mt-6 pt-6 border-t border-[#E3E7DF] space-y-6">
            <div>
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-semibold text-[#1A241B]">
                  Proporção da Dieta (Matéria Seca)
                </span>
                <span
                  className={`font-mono tabular-nums font-semibold ${
                    dryMatterSum === 100 ? 'text-[#157A42]' : 'text-[#DC2626]'
                  }`}
                >
                  Total: {dryMatterSum}% {dryMatterSum === 100 ? '(Fechado)' : '(Ajuste para 100%)'}
                </span>
              </div>
              <div className="w-full h-6 rounded-lg overflow-hidden bg-[#EDF0EA] flex">
                <div
                  className="bg-[#157A42] transition-all duration-150 flex items-center justify-center text-[11px] font-mono text-white font-semibold"
                  style={{ width: `${Math.min(100, forragemPct)}%` }}
                >
                  {forragemPct >= 15 ? `Volumoso ${forragemPct}%` : ''}
                </div>
                <div
                  className="bg-[#C97A16] transition-all duration-150 flex items-center justify-center text-[11px] font-mono text-white font-semibold"
                  style={{ width: `${Math.min(Math.max(0, 100 - forragemPct), concentradoPct)}%` }}
                >
                  {concentradoPct >= 15 ? `Conc. ${concentradoPct}%` : ''}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 pt-4 border-t border-[#EEF1EB]">
              <div>
                <div className="flex items-center gap-2 text-xs text-[#525B50]">
                  <Droplets className="w-4 h-4 text-[#0284C7]" aria-hidden="true" />
                  <span>Dessedentação Diária</span>
                </div>
                <p className="mt-1.5 font-mono tabular-nums text-2xl font-bold text-[#1A241B]">
                  {aguaLitros} L/dia
                </p>
                <p className="mt-1 text-xs text-[#525B50]">
                  Água fresca e limpa no bebedouro
                </p>
              </div>

              <div>
                <div className="flex items-center gap-2 text-xs text-[#525B50]">
                  <Sun className="w-4 h-4 text-[#C97A16]" aria-hidden="true" />
                  <span>Ambiência & Sombra</span>
                </div>
                <p className="mt-1.5 font-mono tabular-nums text-2xl font-bold text-[#1A241B]">
                  Nível {confortoNivel} / 5
                </p>
                <p className="mt-1 text-xs text-[#525B50]">
                  Orientação Leste-Oeste e sombreamento
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Evaluation Feedback Area */}
        {evaluation ? (
          <div className="mt-6 rounded-xl bg-[#F4F8F5] border border-[#C6DEC9] p-5 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-bold text-[#1A241B]">
                Diagnóstico: {evaluation.status}
              </span>
              <span className="font-mono tabular-nums text-sm font-bold text-[#157A42]">
                Nota {evaluation.score}/100 · +{evaluation.xpReward} XP
              </span>
            </div>
            <ul className="space-y-1.5 text-xs sm:text-sm text-[#2B362C] list-disc list-inside">
              {evaluation.feedback.map((msg) => (
                <li key={msg}>{msg}</li>
              ))}
            </ul>
            <p className="pt-2 border-t border-[#D4E6D9] text-xs text-[#434C41]">
              <strong>Referência PPC:</strong> {scenario.dicaTecnica}
            </p>
          </div>
        ) : (
          <p className="mt-6 text-xs text-[#525B50]">
            Ajuste os parâmetros ao lado conforme Alimentação Animal, Forrageiras e Instalações Zootécnicas e clique em Verificar Manejo.
          </p>
        )}
      </div>

      {/* Right Zone: Control Deck */}
      <div className="lg:col-span-5 bg-white border border-[#E3E7DF] rounded-2xl p-6 sm:p-8 flex flex-col justify-between space-y-6">
        <div className="space-y-5">
          <h3 className="text-lg font-bold text-[#1A241B]">Painel de Formulação e Manejo</h3>

          <div>
            <div className="flex justify-between text-sm mb-1.5">
              <label htmlFor="slider-forragem" className="font-medium text-[#1A241B]">
                Volumoso (Palma + Silagem/Feno)
              </label>
              <span className="font-mono tabular-nums font-semibold text-[#157A42]">
                {forragemPct}%
              </span>
            </div>
            <input
              id="slider-forragem"
              type="range"
              min={10}
              max={95}
              step={5}
              value={forragemPct}
              onChange={(e) => {
                const val = Number(e.target.value);
                setForragemPct(val);
                setConcentradoPct(100 - val);
              }}
              className="w-full accent-[#157A42] cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-sm mb-1.5">
              <label htmlFor="slider-concentrado" className="font-medium text-[#1A241B]">
                Concentrado (Milho / Farelo de Soja / Algodão)
              </label>
              <span className="font-mono tabular-nums font-semibold text-[#B86A0A]">
                {concentradoPct}%
              </span>
            </div>
            <input
              id="slider-concentrado"
              type="range"
              min={5}
              max={90}
              step={5}
              value={concentradoPct}
              onChange={(e) => {
                const val = Number(e.target.value);
                setConcentradoPct(val);
                setForragemPct(100 - val);
              }}
              className="w-full accent-[#C97A16] cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-sm mb-1.5">
              <label htmlFor="slider-agua" className="font-medium text-[#1A241B]">
                Oferta de Água por Animal
              </label>
              <span className="font-mono tabular-nums font-semibold text-[#0284C7]">
                {aguaLitros} L/dia
              </span>
            </div>
            <input
              id="slider-agua"
              type="range"
              min={5}
              max={100}
              step={5}
              value={aguaLitros}
              onChange={(e) => setAguaLitros(Number(e.target.value))}
              className="w-full accent-[#0284C7] cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-sm mb-1.5">
              <label htmlFor="slider-conforto" className="font-medium text-[#1A241B]">
                Conforto Térmico e Ventilação
              </label>
              <span className="font-mono tabular-nums font-semibold text-[#1A241B]">
                Nível {confortoNivel}/5
              </span>
            </div>
            <input
              id="slider-conforto"
              type="range"
              min={1}
              max={5}
              step={1}
              value={confortoNivel}
              onChange={(e) => setConfortoNivel(Number(e.target.value))}
              className="w-full accent-[#157A42] cursor-pointer"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={handleVerify}
          className="w-full min-h-[48px] rounded-xl bg-[#157A42] hover:bg-[#106134] text-white text-sm font-semibold transition-colors cursor-pointer"
        >
          Verificar Manejo
        </button>
      </div>
    </section>
  );
};

// ===================== 3. CLASSIFICADOR DO CAMPUS =====================
const CampusClassifier: React.FC<{ onAwardXp: (xp: number, combo: number) => void }> = ({
  onAwardXp,
}) => {
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [feedback, setFeedback] = useState<{ ok: boolean; correta: string } | null>(null);
  const [finished, setFinished] = useState(false);

  const current = CLASSIFIER_ITEMS[index];

  const handleChoose = (category: ClassifierItem['categoriaCorreta']) => {
    if (feedback || finished || !current) return;
    const isOk = category === current.categoriaCorreta;
    let nextScore = score;
    let nextMax = maxCombo;

    if (isOk) {
      nextScore = score + 1;
      setScore(nextScore);
      const nextCombo = combo + 1;
      setCombo(nextCombo);
      nextMax = Math.max(maxCombo, nextCombo);
      setMaxCombo(nextMax);
    } else {
      setCombo(0);
    }

    setFeedback({ ok: isOk, correta: current.categoriaCorreta });
    setTimeout(() => {
      setFeedback(null);
      if (index + 1 < CLASSIFIER_ITEMS.length) {
        setIndex((i) => i + 1);
      } else {
        setFinished(true);
        onAwardXp(nextScore * 12 + 15, nextMax);
      }
    }, 850);
  };

  const restart = () => {
    setIndex(0);
    setScore(0);
    setCombo(0);
    setMaxCombo(0);
    setFeedback(null);
    setFinished(false);
  };

  return (
    <section className="max-w-3xl mx-auto bg-white border border-[#E3E7DF] rounded-2xl p-6 sm:p-8 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-[#525B50]">
            Unidades Didáticas do IFS Campus Poço Redondo
          </p>
          <h2 className="mt-1 text-xl font-bold text-[#1A241B]">
            Onde esta prática acontece no curso?
          </h2>
        </div>
        <Gamepad2 className="w-6 h-6 text-[#157A42] shrink-0" aria-hidden="true" />
      </div>

      {finished ? (
        <div className="rounded-2xl bg-[#F4F8F5] border border-[#C6DEC9] p-6 text-center space-y-3">
          <CheckCircle2 className="w-8 h-8 text-[#157A42] mx-auto" aria-hidden="true" />
          <h3 className="text-xl font-bold text-[#1A241B]">Classificação Finalizada!</h3>
          <p className="text-sm text-[#4C564A]">
            Você acertou <strong className="font-mono tabular-nums">{score}</strong> de{' '}
            <strong className="font-mono tabular-nums">{CLASSIFIER_ITEMS.length}</strong> atividades (
            +{score * 12 + 15} XP).
          </p>
          <button
            type="button"
            onClick={restart}
            className="min-h-[44px] px-5 py-2 rounded-xl bg-[#157A42] hover:bg-[#106134] text-white text-sm font-semibold cursor-pointer"
          >
            Jogar Novamente
          </button>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between text-xs text-[#525B50]">
            <span>
              Item <strong className="font-mono tabular-nums text-[#1A241B]">{index + 1}</strong> de{' '}
              <strong className="font-mono tabular-nums text-[#1A241B]">{CLASSIFIER_ITEMS.length}</strong>
            </span>
            <span className="font-mono tabular-nums font-semibold text-[#157A42]">
              Acertos: {score}
            </span>
          </div>

          <div className="rounded-2xl bg-[#F7F8F5] border border-[#E3E7DF] p-6">
            <h3 className="text-lg sm:text-xl font-bold text-[#1A241B]">{current.item}</h3>
            <p className="mt-1.5 text-sm text-[#4C564A]">{current.detalhe}</p>
          </div>

          {feedback && (
            <div
              className={`rounded-xl p-3.5 text-sm font-semibold flex items-center gap-2 ${
                feedback.ok
                  ? 'bg-[#EAF6EE] text-[#106134] border border-[#C6DEC9]'
                  : 'bg-[#FEF2F2] text-[#991B1B] border border-[#FECACA]'
              }`}
            >
              {feedback.ok ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <XCircle className="w-4 h-4 shrink-0" />
              )}
              <span>
                {feedback.ok
                  ? `Correto! Pertence a ${feedback.correta}.`
                  : `Unidade correta: ${feedback.correta}.`}
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {CAMPUS_CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                disabled={!!feedback}
                onClick={() => handleChoose(cat)}
                className="min-h-[52px] px-4 py-3 rounded-xl border border-[#DCE2D7] bg-white hover:bg-[#EAF6EE] hover:border-[#157A42] text-sm font-semibold text-[#1A241B] text-left transition-colors cursor-pointer disabled:opacity-60"
              >
                {cat}
              </button>
            ))}
          </div>
        </>
      )}
    </section>
  );
};
