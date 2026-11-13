import React from 'react';
import { BookOpen, CheckSquare, Compass, Gamepad2, Layers } from 'lucide-react';
import type { AppTab } from './TopNav';

interface MobileBottomNavProps {
  activeTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
}

const MOBILE_TABS: Array<{
  id: AppTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: 'inicio', label: 'Início', icon: Compass },
  { id: 'flashcards', label: 'Cards', icon: Layers },
  { id: 'quiz', label: 'Quiz', icon: CheckSquare },
  { id: 'ludico', label: 'Lúdico', icon: Gamepad2 },
  { id: 'ppc', label: 'Matriz', icon: BookOpen },
];

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onSelectTab,
}) => {
  return (
    <nav
      aria-label="Navegação inferior móvel"
      className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-[#E3E7DF] pb-safe"
    >
      <div className="grid grid-cols-5 h-16 items-center">
        {MOBILE_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelectTab(tab.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`min-h-[44px] flex flex-col items-center justify-center gap-0.5 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-[#157A42] ${
                isActive ? 'text-[#157A42]' : 'text-[#525B50] hover:text-[#1A241B]'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.4]' : 'stroke-[1.8]'}`} aria-hidden="true" />
              <span className={`text-[11px] leading-tight whitespace-nowrap ${isActive ? 'font-semibold' : 'font-medium'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
