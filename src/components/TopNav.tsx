import React from 'react';
import { PWAInstallButton } from './PWAInstallUI';

export type AppTab = 'inicio' | 'flashcards' | 'quiz' | 'ludico' | 'ppc';

interface TopNavProps {
  activeTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
  onQuickChallenge: () => void;
}

const NAV_ITEMS: Array<{ id: AppTab; label: string }> = [
  { id: 'inicio', label: 'Início' },
  { id: 'flashcards', label: 'Flashcards' },
  { id: 'quiz', label: 'Quiz' },
  { id: 'ludico', label: 'Lúdico' },
  { id: 'ppc', label: 'Matriz PPC' },
];

export const TopNav: React.FC<TopNavProps> = ({
  activeTab,
  onSelectTab,
  onQuickChallenge,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-[#F7F8F5]/95 backdrop-blur-md border-b border-[#E3E7DF]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-13 md:h-16 flex items-center justify-between gap-4 md:gap-8">
        {/* Zone 1: Single-element Brand Wordmark */}
        <a
          href="#inicio"
          onClick={(e) => {
            e.preventDefault();
            onSelectTab('inicio');
          }}
          className="font-display text-lg md:text-xl font-bold tracking-tight text-[#1A241B] whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#157A42]"
        >
          ZooSertão IFS
        </a>

        {/* Zone 2: Clean single-line text navigation links */}
        <nav aria-label="Navegação principal" className="hidden md:flex items-center gap-6">
          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`relative py-2 text-sm font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#157A42] ${
                  isActive
                    ? 'text-[#157A42] font-semibold'
                    : 'text-[#4C564A] hover:text-[#1A241B]'
                }`}
              >
                {item.label}
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="absolute left-0 right-0 -bottom-[1px] h-0.5 bg-[#157A42]"
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Single primary action */}
        <div className="flex items-center shrink-0">
          <PWAInstallButton
            onFallbackAction={onQuickChallenge}
            fallbackLabel="Desafio Rápido"
          />
        </div>
      </div>
    </header>
  );
};
