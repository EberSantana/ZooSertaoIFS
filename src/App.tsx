import { useEffect, useState } from 'react';
import { TopNav, type AppTab } from './components/TopNav';
import { MobileBottomNav } from './components/MobileBottomNav';
import { OfflineIndicator } from './components/PWAInstallUI';
import { DashboardView } from './components/DashboardView';
import { FlashcardsView } from './components/FlashcardsView';
import { QuizView } from './components/QuizView';
import { LudicHubView } from './components/LudicHubView';
import { PpcExplorerView } from './components/PpcExplorerView';
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

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('inicio');
  const [yearFilter, setYearFilter] = useState<1 | 2 | 3 | 'Todos'>('Todos');
  const [disciplineFilter, setDisciplineFilter] = useState<string>('Todas');
  const [progress, setProgress] = useState<StudentProgress>(() => loadProgress());

  useEffect(() => {
    saveProgress(progress);
  }, [progress]);

  // Support ?autostart=quiz or ?tab=flashcards for deep links & testing
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab') as AppTab | null;
    if (tabParam && ['inicio', 'flashcards', 'quiz', 'ludico', 'ppc'].includes(tabParam)) {
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
            onNavigate={(tab, yr) => handleNavigate(tab, yr)}
            onResetProgress={handleResetProgress}
          />
        )}

        {activeTab === 'flashcards' && (
          <FlashcardsView
            progress={progress}
            initialYearFilter={yearFilter}
            initialDisciplineFilter={disciplineFilter}
            onRateCard={handleRateCard}
          />
        )}

        {activeTab === 'quiz' && (
          <QuizView
            initialYearFilter={yearFilter}
            onFinishQuiz={handleFinishQuiz}
          />
        )}

        {activeTab === 'ludico' && (
          <LudicHubView onAwardLudicXp={handleAwardLudicXp} />
        )}

        {activeTab === 'ppc' && (
          <PpcExplorerView
            onStudyDiscipline={(tab, ano) => handleNavigate(tab, ano)}
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
