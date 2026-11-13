import { useEffect, useState } from 'react';
import { TopNav, type AppTab } from './components/TopNav';
import { MobileBottomNav } from './components/MobileBottomNav';
import { OfflineIndicator } from './components/PWAInstallUI';
import { DashboardView } from './components/DashboardView';
import { FlashcardsView } from './components/FlashcardsView';
import { QuizView } from './components/QuizView';
import { LudicHubView } from './components/LudicHubView';
import { PpcExplorerView } from './components/PpcExplorerView';
import { ContentStudioView, type StudioMode } from './components/ContentStudioView';
import {
  INITIAL_PROGRESS,
  calculateQuizXp,
  evaluateBadges,
  loadProgress,
  saveProgress,
  scheduleFlashcard,
  type Rating,
  type StudentProgress,
} from './utils/gamification';
import {
  deleteFileBlob,
  loadCustomContent,
  saveCustomContent,
  type CustomContentState,
  type CustomTopic,
} from './utils/customContentStore';
import type { ClassifierItem, FlashcardItem, MatchDeck, QuizQuestion } from './data/studyContent';

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('inicio');
  const [yearFilter, setYearFilter] = useState<1 | 2 | 3 | 'Todos'>('Todos');
  const [disciplineFilter, setDisciplineFilter] = useState<string>('Todas');
  const [studioMode, setStudioMode] = useState<StudioMode>('assunto');
  const [studioDisciplineId, setStudioDisciplineId] = useState<string | undefined>(undefined);
  const [progress, setProgress] = useState<StudentProgress>(() => loadProgress());
  const [customContent, setCustomContent] = useState<CustomContentState>(() => loadCustomContent());

  useEffect(() => {
    saveProgress(progress);
  }, [progress]);

  useEffect(() => {
    saveCustomContent(customContent);
  }, [customContent]);

  // Support ?tab=flashcards|quiz|ludico|ppc|criar for deep links & testing
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab') as AppTab | null;
    if (tabParam && ['inicio', 'flashcards', 'quiz', 'ludico', 'ppc', 'criar'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, []);

  const handleNavigate = (tab: AppTab, year?: 1 | 2 | 3, disciplinaNome?: string) => {
    if (year !== undefined) {
      setYearFilter(year);
    } else if (tab !== 'flashcards' && tab !== 'quiz') {
      setYearFilter('Todos');
    }
    setDisciplineFilter(disciplinaNome ?? 'Todas');
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenStudio = (mode: StudioMode, disciplineId?: string) => {
    setStudioMode(mode);
    setStudioDisciplineId(disciplineId);
    setActiveTab('criar');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRateCard = (cardId: string, rating: Rating): number => {
    let xpGained = 10;
    setProgress((prev) => {
      const existing = prev.cardProgress[cardId];
      const scheduled = scheduleFlashcard(existing, cardId, rating);
      xpGained = scheduled.xpGained;
      const updated: StudentProgress = {
        ...prev,
        xp: prev.xp + scheduled.xpGained,
        flashcardsReviewed: prev.flashcardsReviewed + 1,
        cardProgress: {
          ...prev.cardProgress,
          [cardId]: scheduled.nextProgress,
        },
      };
      return {
        ...updated,
        unlockedBadges: evaluateBadges(updated),
      };
    });
    return xpGained;
  };

  const handleFinishQuiz = (
    correctCount: number,
    totalQuestions: number,
    maxStreak: number
  ) => {
    const result = calculateQuizXp(correctCount, totalQuestions, maxStreak);
    setProgress((prev) => {
      const updated: StudentProgress = {
        ...prev,
        xp: prev.xp + result.xpEarned,
        quizzesCompleted: prev.quizzesCompleted + 1,
        bestQuizAccuracy: Math.max(prev.bestQuizAccuracy, result.accuracy),
        maxCombo: Math.max(prev.maxCombo, maxStreak),
      };
      return {
        ...updated,
        unlockedBadges: evaluateBadges(updated),
      };
    });
    return result;
  };

  const handleAwardLudicXp = (xp: number, maxCombo: number) => {
    setProgress((prev) => {
      const updated: StudentProgress = {
        ...prev,
        xp: prev.xp + xp,
        ludicCompleted: prev.ludicCompleted + 1,
        maxCombo: Math.max(prev.maxCombo, maxCombo),
      };
      return {
        ...updated,
        unlockedBadges: evaluateBadges(updated),
      };
    });
  };

  const handleResetProgress = () => {
    setProgress(INITIAL_PROGRESS);
  };

  // Custom Content Handlers
  const handleAddTopic = (topic: CustomTopic) => {
    setCustomContent((prev) => ({
      ...prev,
      topics: [topic, ...prev.topics],
    }));
  };

  const handleDeleteTopic = (topicId: string) => {
    setCustomContent((prev) => {
      const target = prev.topics.find((t) => t.id === topicId);
      if (target) {
        for (const att of target.attachments) {
          void deleteFileBlob(att.id);
        }
      }
      return {
        ...prev,
        topics: prev.topics.filter((t) => t.id !== topicId),
        completedTopicIds: prev.completedTopicIds.filter((id) => id !== topicId),
      };
    });
  };

  const handleCompleteTopic = (topicId: string, xpReward: number) => {
    if (customContent.completedTopicIds.includes(topicId)) return;
    setCustomContent((prev) => ({
      ...prev,
      completedTopicIds: [...prev.completedTopicIds, topicId],
    }));
    setProgress((prev) => {
      const updated: StudentProgress = {
        ...prev,
        xp: prev.xp + xpReward,
      };
      return {
        ...updated,
        unlockedBadges: evaluateBadges(updated),
      };
    });
  };

  const handleAddFlashcards = (cards: FlashcardItem[]) => {
    setCustomContent((prev) => ({
      ...prev,
      flashcards: [...cards, ...prev.flashcards],
    }));
  };

  const handleDeleteFlashcard = (cardId: string) => {
    setCustomContent((prev) => ({
      ...prev,
      flashcards: prev.flashcards.filter((c) => c.id !== cardId),
    }));
  };

  const handleAddQuizQuestions = (questions: QuizQuestion[]) => {
    setCustomContent((prev) => ({
      ...prev,
      quizQuestions: [...questions, ...prev.quizQuestions],
    }));
  };

  const handleDeleteQuizQuestion = (questionId: string) => {
    setCustomContent((prev) => ({
      ...prev,
      quizQuestions: prev.quizQuestions.filter((q) => q.id !== questionId),
    }));
  };

  const handleAddMatchDeck = (deck: MatchDeck) => {
    setCustomContent((prev) => ({
      ...prev,
      matchDecks: [...prev.matchDecks, deck],
    }));
  };

  const handleDeleteMatchDeck = (deckId: string) => {
    setCustomContent((prev) => ({
      ...prev,
      matchDecks: prev.matchDecks.filter((d) => d.id !== deckId),
    }));
  };

  const handleAddClassifierItem = (item: ClassifierItem) => {
    setCustomContent((prev) => ({
      ...prev,
      classifierItems: [item, ...prev.classifierItems],
    }));
  };

  const handleDeleteClassifierItem = (itemId: string) => {
    setCustomContent((prev) => ({
      ...prev,
      classifierItems: prev.classifierItems.filter((c) => c.id !== itemId),
    }));
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F8F5] text-[#1A241B]">
      <TopNav
        activeTab={activeTab}
        onSelectTab={(tab) => handleNavigate(tab)}
        onQuickChallenge={() => handleNavigate('quiz')}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 pt-6 sm:pt-8 pb-24 md:pb-12">
        {activeTab === 'inicio' && (
          <DashboardView
            progress={progress}
            customContent={customContent}
            onNavigate={(tab, yr) => handleNavigate(tab, yr)}
            onResetProgress={handleResetProgress}
          />
        )}

        {activeTab === 'flashcards' && (
          <FlashcardsView
            progress={progress}
            customFlashcards={customContent.flashcards}
            initialYearFilter={yearFilter}
            initialDisciplineFilter={disciplineFilter}
            onRateCard={handleRateCard}
            onCreateFlashcard={() => handleOpenStudio('flashcard')}
          />
        )}

        {activeTab === 'quiz' && (
          <QuizView
            customQuestions={customContent.quizQuestions}
            initialYearFilter={yearFilter}
            onFinishQuiz={handleFinishQuiz}
            onCreateQuestion={() => handleOpenStudio('quiz')}
          />
        )}

        {activeTab === 'ludico' && (
          <LudicHubView
            customMatchDecks={customContent.matchDecks}
            customClassifierItems={customContent.classifierItems}
            onAwardLudicXp={handleAwardLudicXp}
            onCreateLudic={() => handleOpenStudio('ludico')}
          />
        )}

        {activeTab === 'ppc' && (
          <PpcExplorerView
            customContent={customContent}
            onStudyDiscipline={(tab, ano, discNome) => handleNavigate(tab, ano, discNome)}
            onOpenStudio={(mode, discId) => handleOpenStudio(mode, discId)}
            onCompleteTopic={handleCompleteTopic}
            onDeleteTopic={handleDeleteTopic}
          />
        )}

        {activeTab === 'criar' && (
          <ContentStudioView
            customContent={customContent}
            initialDisciplineId={studioDisciplineId}
            initialMode={studioMode}
            onAddTopic={handleAddTopic}
            onDeleteTopic={handleDeleteTopic}
            onAddFlashcards={handleAddFlashcards}
            onDeleteFlashcard={handleDeleteFlashcard}
            onAddQuizQuestions={handleAddQuizQuestions}
            onDeleteQuizQuestion={handleDeleteQuizQuestion}
            onAddMatchDeck={handleAddMatchDeck}
            onDeleteMatchDeck={handleDeleteMatchDeck}
            onAddClassifierItem={handleAddClassifierItem}
            onDeleteClassifierItem={handleDeleteClassifierItem}
            onReplaceAllCustomContent={setCustomContent}
          />
        )}
      </main>

      <footer className="hidden md:block border-t border-[#E3E7DF] bg-white">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between text-xs text-[#525B50]">
          <span>
            IFS Campus Poço Redondo · Curso Técnico Integrado em Zootecnia (Resolução CS/IFS Nº 352/2025)
          </span>
          <span>Rodovia SE 206, S/N · Poço Redondo/SE · Alto Sertão Sergipano</span>
        </div>
      </footer>

      <MobileBottomNav
        activeTab={activeTab}
        onSelectTab={(tab) => handleNavigate(tab)}
      />
      <OfflineIndicator />
    </div>
  );
}
