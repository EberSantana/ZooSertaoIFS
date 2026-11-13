import React, { useMemo, useState } from 'react';
import { BookOpen, Building2, Layers, Search, X } from 'lucide-react';
import {
  COURSE_INFO,
  DISCIPLINAS_PPC,
  INSTALACOES_CAMPUS,
  PROJETO_INTEGRADOR_INFO,
  type DisciplinaPPC,
  type NucleoFormacao,
} from '../data/ppcData';
import type { AppTab } from './TopNav';

interface PpcExplorerViewProps {
  onStudyDiscipline: (tab: AppTab, ano: 1 | 2 | 3, disciplinaNome: string) => void;
}

export const PpcExplorerView: React.FC<PpcExplorerViewProps> = ({
  onStudyDiscipline,
}) => {
  const [yearFilter, setYearFilter] = useState<1 | 2 | 3 | 'Todos'>('Todos');
  const [nucleoFilter, setNucleoFilter] = useState<NucleoFormacao | 'Todos'>('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDiscipline, setSelectedDiscipline] = useState<DisciplinaPPC | null>(null);

  const filteredDisciplines = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return DISCIPLINAS_PPC.filter((d) => {
      const matchYear = yearFilter === 'Todos' || d.ano === yearFilter;
      const matchNucleo = nucleoFilter === 'Todos' || d.nucleo === nucleoFilter;
      const matchSearch =
        !query ||
        d.nome.toLowerCase().includes(query) ||
        d.ementa.toLowerCase().includes(query) ||
        d.enfaseTecnologica.toLowerCase().includes(query);
      return matchYear && matchNucleo && matchSearch;
    });
  }, [yearFilter, nucleoFilter, searchQuery]);

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-medium text-[#525B50]">
          {COURSE_INFO.instituicao} · {COURSE_INFO.campus}
        </p>
        <h1 className="mt-1 text-2xl sm:text-3xl font-bold text-[#1A241B]">
          Matriz Curricular do PPC (44 Disciplinas + PPI)
        </h1>
        <p className="mt-1 text-sm text-[#525B50]">
          Explore todas as ementas, ênfases tecnológicas e áreas de integração aprovadas pela {COURSE_INFO.resolucao}.
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white border border-[#E3E7DF] rounded-2xl p-4 space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 p-1 bg-[#F1F4EE] rounded-xl">
              {(['Todos', 1, 2, 3] as const).map((ano) => (
                <button
                  key={String(ano)}
                  type="button"
                  onClick={() => setYearFilter(ano)}
                  className={`min-h-[38px] px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    yearFilter === ano
                      ? 'bg-white text-[#1A241B] shadow-sm'
                      : 'text-[#525B50] hover:text-[#1A241B]'
                  }`}
                >
                  {ano === 'Todos' ? 'Todos os Anos' : `${ano}º Ano`}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1 p-1 bg-[#F1F4EE] rounded-xl">
              {(['Todos', 'Tecnológico', 'Politécnico', 'Básico'] as const).map((nuc) => (
                <button
                  key={nuc}
                  type="button"
                  onClick={() => setNucleoFilter(nuc)}
                  className={`min-h-[38px] px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    nucleoFilter === nuc
                      ? 'bg-white text-[#1A241B] shadow-sm'
                      : 'text-[#525B50] hover:text-[#1A241B]'
                  }`}
                >
                  {nuc === 'Todos' ? 'Todos Núcleos' : nuc}
                </button>
              ))}
            </div>
          </div>

          <div className="relative flex-1 lg:max-w-xs">
            <Search
              className="w-4 h-4 text-[#6A7368] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar disciplina ou tema..."
              aria-label="Buscar disciplina ou tema na matriz do PPC"
              className="w-full min-h-[42px] pl-10 pr-4 py-2 rounded-xl border border-[#DCE2D7] bg-white text-sm text-[#1A241B] placeholder:text-[#7C857A] focus-visible:outline-2 focus-visible:outline-[#157A42]"
            />
          </div>
        </div>

        <p className="text-xs text-[#525B50]">
          Exibindo <strong className="font-mono tabular-nums text-[#1A241B]">{filteredDisciplines.length}</strong> de{' '}
          <strong className="font-mono tabular-nums text-[#1A241B]">{DISCIPLINAS_PPC.length}</strong> disciplinas obrigatórias.
        </p>
      </div>

      {/* Discipline Grid */}
      {filteredDisciplines.length === 0 ? (
        <div className="bg-white border border-[#E3E7DF] rounded-2xl p-10 text-center">
          <p className="text-base font-semibold text-[#1A241B]">
            Nenhuma disciplina corresponde aos filtros selecionados.
          </p>
          <button
            type="button"
            onClick={() => {
              setYearFilter('Todos');
              setNucleoFilter('Todos');
              setSearchQuery('');
            }}
            className="mt-4 min-h-[44px] px-5 py-2 rounded-xl bg-[#157A42] text-white text-sm font-semibold cursor-pointer"
          >
            Limpar filtros
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDisciplines.map((disc) => (
            <article
              key={disc.id}
              className="bg-white border border-[#E3E7DF] rounded-2xl p-5 flex flex-col justify-between"
            >
              <div>
                <p className="text-xs font-medium text-[#525B50]">
                  {disc.ano}º Ano · Núcleo {disc.nucleo} ·{' '}
                  <span className="font-mono tabular-nums">{disc.cargaHoraria}h</span> ({disc.totalAulas} aulas)
                </p>
                <h2 className="mt-2 text-lg font-bold text-[#1A241B] leading-snug">
                  {disc.nome}
                </h2>
                <p className="mt-2 text-sm text-[#4C564A] line-clamp-3 leading-relaxed">
                  {disc.ementa}
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-[#EEF1EB] flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedDiscipline(disc)}
                  className="min-h-[40px] px-3 py-1.5 rounded-lg text-xs font-semibold text-[#157A42] hover:bg-[#EAF6EE] transition-colors cursor-pointer"
                >
                  Ver ementa completa
                </button>
                <button
                  type="button"
                  onClick={() => onStudyDiscipline('flashcards', disc.ano, disc.nome)}
                  className="min-h-[40px] px-3 py-1.5 rounded-lg bg-[#F1F4EE] hover:bg-[#E4EAE0] text-xs font-semibold text-[#1A241B] transition-colors cursor-pointer whitespace-nowrap"
                >
                  Estudar ano
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* PPI & Campus Installations Summary */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 bg-white border border-[#E3E7DF] rounded-2xl p-6">
          <div className="flex items-center gap-2 text-[#157A42]">
            <Layers className="w-5 h-5" aria-hidden="true" />
            <h2 className="text-lg font-bold text-[#1A241B]">{PROJETO_INTEGRADOR_INFO.titulo}</h2>
          </div>
          <p className="mt-2 font-mono tabular-nums text-sm font-semibold text-[#157A42]">
            {PROJETO_INTEGRADOR_INFO.cargaHorariaTotal}h totais ({PROJETO_INTEGRADOR_INFO.cargaHorariaAnual}h por ano)
          </p>
          <p className="mt-3 text-sm text-[#4C564A] leading-relaxed">
            {PROJETO_INTEGRADOR_INFO.descricao}
          </p>
        </div>

        <div className="lg:col-span-7 bg-white border border-[#E3E7DF] rounded-2xl p-6">
          <div className="flex items-center gap-2 text-[#157A42] mb-4">
            <Building2 className="w-5 h-5" aria-hidden="true" />
            <h2 className="text-lg font-bold text-[#1A241B]">
              Instalações e Unidades Didáticas do Campus Poço Redondo
            </h2>
          </div>
          <ul className="divide-y divide-[#EEF1EB]">
            {INSTALACOES_CAMPUS.map((inst) => (
              <li key={inst.nome} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4">
                <div>
                  <p className="text-sm font-semibold text-[#1A241B]">{inst.nome}</p>
                  <p className="text-xs text-[#525B50]">{inst.foco}</p>
                </div>
                <span className="text-xs font-mono tabular-nums font-medium text-[#157A42] shrink-0">
                  Qtd: {inst.quantidade} · {inst.status}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Discipline Detail Modal */}
      {selectedDiscipline && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="disc-modal-title"
        >
          <div className="w-full max-w-2xl max-h-[88vh] overflow-y-auto bg-white border border-[#E3E7DF] rounded-2xl p-6 sm:p-8 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-medium text-[#525B50]">
                  {selectedDiscipline.ano}º Ano · Núcleo {selectedDiscipline.nucleo} ·{' '}
                  <span className="font-mono tabular-nums">
                    {selectedDiscipline.cargaHoraria}h · {selectedDiscipline.totalAulas} aulas ({selectedDiscipline.aulasTeoricas} teóricas +{' '}
                    {selectedDiscipline.aulasPraticas} práticas)
                  </span>
                </p>
                <h2 id="disc-modal-title" className="mt-1.5 text-2xl font-bold text-[#1A241B]">
                  {selectedDiscipline.nome}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDiscipline(null)}
                aria-label="Fechar detalhes da disciplina"
                className="min-h-[44px] min-w-[44px] -mr-2 -mt-2 flex items-center justify-center rounded-xl text-[#525B50] hover:bg-[#F1F4EE] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-6 space-y-5">
              <div>
                <h3 className="text-xs font-semibold text-[#157A42] uppercase tracking-wider">
                  Ementa Oficial
                </h3>
                <p className="mt-1.5 text-sm text-[#2B362C] leading-relaxed">
                  {selectedDiscipline.ementa}
                </p>
              </div>

              <div className="pt-4 border-t border-[#EEF1EB]">
                <h3 className="text-xs font-semibold text-[#157A42] uppercase tracking-wider">
                  Ênfase Tecnológica
                </h3>
                <p className="mt-1.5 text-sm text-[#2B362C] leading-relaxed">
                  {selectedDiscipline.enfaseTecnologica}
                </p>
              </div>

              <div className="pt-4 border-t border-[#EEF1EB]">
                <h3 className="text-xs font-semibold text-[#157A42] uppercase tracking-wider">
                  Áreas de Integração Interdisciplinar
                </h3>
                <p className="mt-1.5 text-sm text-[#4C564A]">
                  {selectedDiscipline.areaIntegracao.join(' · ')}
                </p>
              </div>
            </div>

            <div className="mt-8 pt-5 border-t border-[#E3E7DF] flex flex-wrap items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  const disc = selectedDiscipline;
                  setSelectedDiscipline(null);
                  onStudyDiscipline('flashcards', disc.ano, disc.nome);
                }}
                className="inline-flex items-center gap-2 min-h-[44px] px-4 py-2 rounded-xl bg-[#F1F4EE] hover:bg-[#E4EAE0] text-sm font-semibold text-[#1A241B] cursor-pointer"
              >
                <BookOpen className="w-4 h-4 text-[#157A42]" aria-hidden="true" />
                <span>Flashcards do {selectedDiscipline.ano}º Ano</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  const disc = selectedDiscipline;
                  setSelectedDiscipline(null);
                  onStudyDiscipline('quiz', disc.ano, disc.nome);
                }}
                className="inline-flex items-center gap-2 min-h-[44px] px-5 py-2 rounded-xl bg-[#157A42] hover:bg-[#106134] text-sm font-semibold text-white cursor-pointer"
              >
                <span>Praticar Quiz do {selectedDiscipline.ano}º Ano</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
