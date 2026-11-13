import React, { useMemo, useState } from 'react';
import {
  BookOpen,
  Building2,
  CheckCircle2,
  FileSpreadsheet,
  FileText,
  FolderPlus,
  Layers,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import {
  COURSE_INFO,
  DISCIPLINAS_PPC,
  INSTALACOES_CAMPUS,
  PROJETO_INTEGRADOR_INFO,
  type DisciplinaPPC,
  type NucleoFormacao,
} from '../data/ppcData';
import {
  getDisciplineInventory,
  type CustomContentState,
  type DisciplineAttachment,
} from '../utils/customContentStore';
import { AttachmentReaderModal } from './AttachmentReaderModal';
import type { StudioMode } from './ContentStudioView';
import type { AppTab } from './TopNav';

interface PpcExplorerViewProps {
  customContent: CustomContentState;
  onStudyDiscipline: (tab: AppTab, ano: 1 | 2 | 3, disciplinaNome: string) => void;
  onOpenStudio: (mode: StudioMode, disciplinaId: string) => void;
  onCompleteTopic: (topicId: string, xpReward: number) => void;
  onDeleteTopic: (topicId: string) => void;
  onDeleteFlashcard: (cardId: string) => void;
  onDeleteQuizQuestion: (questionId: string) => void;
}

type ModalTab = 'ementa' | 'assuntos' | 'atividades';
type CoverageFilter = 'Todas' | 'ComAtividades' | 'SemAtividades';

export const PpcExplorerView: React.FC<PpcExplorerViewProps> = ({
  customContent,
  onStudyDiscipline,
  onOpenStudio,
  onCompleteTopic,
  onDeleteTopic,
  onDeleteFlashcard,
  onDeleteQuizQuestion,
}) => {
  const [yearFilter, setYearFilter] = useState<1 | 2 | 3 | 'Todos'>('Todos');
  const [nucleoFilter, setNucleoFilter] = useState<NucleoFormacao | 'Todos'>('Todos');
  const [coverageFilter, setCoverageFilter] = useState<CoverageFilter>('Todas');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDiscipline, setSelectedDiscipline] = useState<DisciplinaPPC | null>(null);
  const [modalTab, setModalTab] = useState<ModalTab>('ementa');
  const [readingAttachment, setReadingAttachment] = useState<DisciplineAttachment | null>(null);

  const inventoryById = useMemo(() => {
    const map = new Map<string, ReturnType<typeof getDisciplineInventory>>();
    for (const d of DISCIPLINAS_PPC) {
      map.set(d.id, getDisciplineInventory(d.id, customContent));
    }
    return map;
  }, [customContent]);

  const filteredDisciplines = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return DISCIPLINAS_PPC.filter((d) => {
      const inv = inventoryById.get(d.id);
      const matchYear = yearFilter === 'Todos' || d.ano === yearFilter;
      const matchNucleo = nucleoFilter === 'Todos' || d.nucleo === nucleoFilter;
      const matchCoverage =
        coverageFilter === 'Todas' ||
        (coverageFilter === 'ComAtividades' && (inv?.totalActivities ?? 0) > 0) ||
        (coverageFilter === 'SemAtividades' && (inv?.totalActivities ?? 0) === 0);

      const hasMatchingTopic = customContent.topics.some(
        (t) =>
          t.disciplinaId === d.id &&
          (t.titulo.toLowerCase().includes(query) || t.descricao.toLowerCase().includes(query))
      );
      const matchSearch =
        !query ||
        d.nome.toLowerCase().includes(query) ||
        d.ementa.toLowerCase().includes(query) ||
        d.enfaseTecnologica.toLowerCase().includes(query) ||
        hasMatchingTopic;
      return matchYear && matchNucleo && matchCoverage && matchSearch;
    });
  }, [yearFilter, nucleoFilter, coverageFilter, searchQuery, customContent.topics, inventoryById]);

  const openDisciplineModal = (disc: DisciplinaPPC, initialTab: ModalTab = 'ementa') => {
    setSelectedDiscipline(disc);
    setModalTab(initialTab);
  };

  const selectedInv = selectedDiscipline ? inventoryById.get(selectedDiscipline.id) : undefined;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-[#525B50]">
            {COURSE_INFO.instituicao} · {COURSE_INFO.campus}
          </p>
          <h1 className="mt-1 text-2xl sm:text-3xl font-bold text-[#1A241B]">
            Matriz Curricular do PPC (44 Disciplinas + PPI)
          </h1>
          <p className="mt-1 text-sm text-[#525B50]">
            Acompanhe as atividades e assuntos já lançados em cada disciplina, visualize materiais e faça novos envios.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onOpenStudio('assunto', DISCIPLINAS_PPC[0].id)}
          className="inline-flex items-center gap-2 min-h-[44px] px-4 py-2 rounded-xl bg-[#157A42] hover:bg-[#106134] text-white text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap self-start md:self-auto"
        >
          <FolderPlus className="w-4 h-4" aria-hidden="true" />
          <span>Inserir Assunto / Upload</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white border border-[#E3E7DF] rounded-2xl p-4 space-y-3">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
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

            <div className="flex items-center gap-1 p-1 bg-[#F1F4EE] rounded-xl">
              {(
                [
                  { id: 'Todas', label: 'Todas' },
                  { id: 'ComAtividades', label: 'Com atividades' },
                  { id: 'SemAtividades', label: 'Sem atividades' },
                ] as const
              ).map((cov) => (
                <button
                  key={cov.id}
                  type="button"
                  onClick={() => setCoverageFilter(cov.id)}
                  className={`min-h-[38px] px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    coverageFilter === cov.id
                      ? 'bg-white text-[#1A241B] shadow-sm'
                      : 'text-[#525B50] hover:text-[#1A241B]'
                  }`}
                >
                  {cov.label}
                </button>
              ))}
            </div>
          </div>

          <div className="relative flex-1 xl:max-w-xs">
            <Search
              className="w-4 h-4 text-[#6A7368] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar disciplina ou assunto..."
              aria-label="Buscar disciplina ou assunto na matriz do PPC"
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
              setCoverageFilter('Todas');
              setSearchQuery('');
            }}
            className="mt-4 min-h-[44px] px-5 py-2 rounded-xl bg-[#157A42] text-white text-sm font-semibold cursor-pointer"
          >
            Limpar filtros
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDisciplines.map((disc) => {
            const inv = inventoryById.get(disc.id)!;

            return (
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

                  {/* Unified Inventory Summary */}
                  <div className="mt-3 pt-2.5 border-t border-[#F1F4EE] text-xs font-mono tabular-nums text-[#525B50]">
                    {inv.totalActivities > 0 ? (
                      <span className="text-[#157A42] font-semibold">
                        Assuntos: {inv.topics.length} ({inv.attachmentsCount} arq.) · Cards:{' '}
                        {inv.totalFlashcards} · Quiz: {inv.totalQuizQuestions}
                        {inv.totalLudic > 0 ? ` · Lúdico: ${inv.totalLudic}` : ''}
                      </span>
                    ) : (
                      <span>Nenhuma atividade lançada ainda</span>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[#EEF1EB] flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      openDisciplineModal(
                        disc,
                        inv.topics.length > 0
                          ? 'assuntos'
                          : inv.totalActivities > 0
                          ? 'atividades'
                          : 'ementa'
                      )
                    }
                    className="min-h-[40px] px-3 py-1.5 rounded-lg text-xs font-semibold text-[#157A42] hover:bg-[#EAF6EE] transition-colors cursor-pointer"
                  >
                    {inv.totalActivities > 0
                      ? `Ver atividades (${inv.totalActivities})`
                      : 'Ver ementa'}
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpenStudio('assunto', disc.id)}
                    className="inline-flex items-center gap-1 min-h-[40px] px-3 py-1.5 rounded-lg bg-[#F1F4EE] hover:bg-[#E4EAE0] text-xs font-semibold text-[#1A241B] transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#157A42]" aria-hidden="true" />
                    <span>Lançar / Upload</span>
                  </button>
                </div>
              </article>
            );
          })}
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
      {selectedDiscipline && selectedInv && (
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

            {/* Modal Internal Tabs */}
            <div className="mt-5 flex items-center gap-1 p-1 bg-[#F1F4EE] rounded-xl overflow-x-auto">
              <button
                type="button"
                onClick={() => setModalTab('ementa')}
                className={`min-h-[38px] px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer ${
                  modalTab === 'ementa'
                    ? 'bg-white text-[#1A241B] shadow-sm'
                    : 'text-[#525B50] hover:text-[#1A241B]'
                }`}
              >
                Ementa Oficial
              </button>
              <button
                type="button"
                onClick={() => setModalTab('assuntos')}
                className={`min-h-[38px] px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer ${
                  modalTab === 'assuntos'
                    ? 'bg-white text-[#1A241B] shadow-sm'
                    : 'text-[#525B50] hover:text-[#1A241B]'
                }`}
              >
                Assuntos & Materiais ({selectedInv.topics.length})
              </button>
              <button
                type="button"
                onClick={() => setModalTab('atividades')}
                className={`min-h-[38px] px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer ${
                  modalTab === 'atividades'
                    ? 'bg-white text-[#1A241B] shadow-sm'
                    : 'text-[#525B50] hover:text-[#1A241B]'
                }`}
              >
                Atividades ({selectedInv.totalFlashcards + selectedInv.totalQuizQuestions + selectedInv.totalLudic})
              </button>
            </div>

            {modalTab === 'ementa' && (
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
            )}

            {modalTab === 'assuntos' && (
              <div className="mt-6 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs text-[#525B50]">
                    Assuntos, roteiros e anexos (PDF, XLS/XLSX, DOCX) adicionados para esta disciplina.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      const discId = selectedDiscipline.id;
                      setSelectedDiscipline(null);
                      onOpenStudio('assunto', discId);
                    }}
                    className="inline-flex items-center gap-1.5 min-h-[38px] px-3 py-1.5 rounded-lg bg-[#157A42] text-white text-xs font-semibold cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Novo Assunto / Upload</span>
                  </button>
                </div>

                {selectedInv.topics.length === 0 ? (
                  <p className="py-6 text-sm text-[#525B50] border-t border-[#EEF1EB]">
                    Ainda não há assuntos extras ou arquivos enviados nesta disciplina.
                  </p>
                ) : (
                  <ul className="divide-y divide-[#EEF1EB] border-t border-[#EEF1EB]">
                    {selectedInv.topics.map((topic) => {
                      const isDone = customContent.completedTopicIds.includes(topic.id);
                      return (
                        <li key={topic.id} className="py-4 space-y-2.5">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <span className="text-[11px] font-mono uppercase font-semibold text-[#157A42]">
                                {topic.tipo} · +{topic.xpReward} XP
                              </span>
                              <h4 className="text-base font-bold text-[#1A241B]">{topic.titulo}</h4>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                type="button"
                                disabled={isDone}
                                onClick={() => onCompleteTopic(topic.id, topic.xpReward)}
                                className={`inline-flex items-center gap-1.5 min-h-[36px] px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer disabled:cursor-default ${
                                  isDone
                                    ? 'bg-[#EAF6EE] text-[#106134]'
                                    : 'bg-[#F1F4EE] hover:bg-[#EAF6EE] text-[#1A241B]'
                                }`}
                              >
                                <CheckCircle2 className="w-3.5 h-3.5 text-[#157A42]" aria-hidden="true" />
                                <span>{isDone ? 'Concluído' : `Concluir (+${topic.xpReward} XP)`}</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => onDeleteTopic(topic.id)}
                                aria-label={`Remover assunto ${topic.titulo}`}
                                className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg text-[#6A7368] hover:text-[#991B1B] cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          <p className="text-sm text-[#4C564A] whitespace-pre-line leading-relaxed">
                            {topic.descricao}
                          </p>

                          {topic.attachments.length > 0 && (
                            <div className="flex flex-wrap gap-2 pt-1">
                              {topic.attachments.map((att) => (
                                <button
                                  key={att.id}
                                  type="button"
                                  onClick={() => setReadingAttachment(att)}
                                  className="inline-flex items-center gap-1.5 min-h-[36px] px-3 py-1.5 rounded-lg bg-[#F1F4EE] hover:bg-[#E4EAE0] text-xs font-semibold text-[#1A241B] cursor-pointer"
                                >
                                  {att.format === 'xls' || att.format === 'xlsx' ? (
                                    <FileSpreadsheet className="w-3.5 h-3.5 text-[#157A42]" aria-hidden="true" />
                                  ) : (
                                    <FileText className="w-3.5 h-3.5 text-[#157A42]" aria-hidden="true" />
                                  )}
                                  <span>{att.fileName}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            )}

            {modalTab === 'atividades' && (
              <div className="mt-6 space-y-5">
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const discId = selectedDiscipline.id;
                      setSelectedDiscipline(null);
                      onOpenStudio('flashcard', discId);
                    }}
                    className="inline-flex items-center gap-1.5 min-h-[38px] px-3 py-1.5 rounded-lg bg-[#EAF6EE] text-xs font-semibold text-[#106134] cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Novo Flashcard</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const discId = selectedDiscipline.id;
                      setSelectedDiscipline(null);
                      onOpenStudio('quiz', discId);
                    }}
                    className="inline-flex items-center gap-1.5 min-h-[38px] px-3 py-1.5 rounded-lg bg-[#EAF6EE] text-xs font-semibold text-[#106134] cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Nova Questão</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const discId = selectedDiscipline.id;
                      setSelectedDiscipline(null);
                      onOpenStudio('ludico', discId);
                    }}
                    className="inline-flex items-center gap-1.5 min-h-[38px] px-3 py-1.5 rounded-lg bg-[#FEF6E8] text-xs font-semibold text-[#784304] cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Nova Atividade Lúdica</span>
                  </button>
                </div>

                {/* Custom Teacher-Added Activities */}
                {(selectedInv.customFlashcards.length > 0 ||
                  selectedInv.customQuizQuestions.length > 0 ||
                  selectedInv.customMatchDecks.length > 0 ||
                  selectedInv.customClassifierItems.length > 0) && (
                  <div className="pt-4 border-t border-[#EEF1EB] space-y-2">
                    <h3 className="text-xs font-semibold text-[#157A42] uppercase tracking-wider">
                      Lançadas pelo Professor ({selectedInv.customFlashcards.length + selectedInv.customQuizQuestions.length + selectedInv.totalLudic})
                    </h3>
                    <ul className="divide-y divide-[#EEF1EB]">
                      {selectedInv.customFlashcards.map((fc) => (
                        <li key={fc.id} className="py-2.5 flex items-start justify-between gap-2">
                          <div>
                            <p className="text-[11px] font-mono text-[#157A42]">Flashcard · Professor</p>
                            <p className="text-sm font-semibold text-[#1A241B]">{fc.frente}</p>
                            <p className="text-xs text-[#4C564A] mt-0.5">{fc.verso}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => onDeleteFlashcard(fc.id)}
                            aria-label="Excluir flashcard"
                            className="min-h-[34px] min-w-[34px] flex items-center justify-center rounded-lg text-[#6A7368] hover:text-[#991B1B] cursor-pointer shrink-0"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </li>
                      ))}
                      {selectedInv.customQuizQuestions.map((qz) => (
                        <li key={qz.id} className="py-2.5 flex items-start justify-between gap-2">
                          <div>
                            <p className="text-[11px] font-mono text-[#B86A0A]">Questão Quiz · Professor</p>
                            <p className="text-sm font-semibold text-[#1A241B]">{qz.enunciado}</p>
                            <p className="text-xs text-[#4C564A] mt-0.5">
                              Gabarito: {['A', 'B', 'C', 'D'][qz.correta]} — {qz.alternativas[qz.correta]}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => onDeleteQuizQuestion(qz.id)}
                            aria-label="Excluir questão"
                            className="min-h-[34px] min-w-[34px] flex items-center justify-center rounded-lg text-[#6A7368] hover:text-[#991B1B] cursor-pointer shrink-0"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </li>
                      ))}
                      {selectedInv.customMatchDecks.map((md) => (
                        <li key={md.id} className="py-2.5">
                          <p className="text-[11px] font-mono text-[#157A42]">Conexão Zootécnica · {md.pares.length} pares</p>
                          <p className="text-sm font-semibold text-[#1A241B]">{md.titulo}</p>
                        </li>
                      ))}
                      {selectedInv.customClassifierItems.map((ci) => (
                        <li key={ci.id} className="py-2.5">
                          <p className="text-[11px] font-mono text-[#B86A0A]">Classificador · {ci.categoriaCorreta}</p>
                          <p className="text-sm font-semibold text-[#1A241B]">{ci.item}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Built-in PPC Activities already in this discipline */}
                <div className="pt-4 border-t border-[#EEF1EB] space-y-2">
                  <h3 className="text-xs font-semibold text-[#525B50] uppercase tracking-wider">
                    Atividades Oficiais do PPC já existentes ({selectedInv.builtInFlashcards.length + selectedInv.builtInQuizQuestions.length})
                  </h3>

                  {selectedInv.builtInFlashcards.length === 0 &&
                  selectedInv.builtInQuizQuestions.length === 0 ? (
                    <p className="py-3 text-sm text-[#525B50]">
                      Esta disciplina ainda não possui flashcards ou questões pré-cadastradas do PPC. Use os botões acima para lançar novas atividades.
                    </p>
                  ) : (
                    <ul className="divide-y divide-[#EEF1EB]">
                      {selectedInv.builtInFlashcards.map((fc) => (
                        <li key={fc.id} className="py-2.5">
                          <p className="text-[11px] font-mono text-[#157A42]">Flashcard · Base PPC</p>
                          <p className="text-sm font-semibold text-[#1A241B]">{fc.frente}</p>
                          <p className="text-xs text-[#4C564A] mt-0.5 line-clamp-2">{fc.verso}</p>
                        </li>
                      ))}
                      {selectedInv.builtInQuizQuestions.map((qz) => (
                        <li key={qz.id} className="py-2.5">
                          <p className="text-[11px] font-mono text-[#B86A0A]">Questão Quiz · Base PPC</p>
                          <p className="text-sm font-semibold text-[#1A241B]">{qz.enunciado}</p>
                          <p className="text-xs text-[#4C564A] mt-0.5">
                            Gabarito: {['A', 'B', 'C', 'D'][qz.correta]} — {qz.alternativas[qz.correta]}
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}

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

      <AttachmentReaderModal
        attachment={readingAttachment}
        onClose={() => setReadingAttachment(null)}
      />
    </div>
  );
};
