import React from 'react';
import { Home, BookOpen, Music, Disc3, Landmark } from 'lucide-react';
import { triggerHaptic } from '../services/audioService';
import type { Language } from '../types';
import { getLabels } from '../data/languages';

export type TabType = 'home' | 'knowledge' | 'bhakti' | 'japa' | 'temples';

interface BottomNavProps {
  activeTab: TabType;
  onChangeTab: (tab: TabType) => void;
  lang: Language;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onChangeTab, lang }) => {
  const labels = getLabels(lang);
  const tabs = [
    { id: 'home' as TabType, label: labels.home, icon: Home },
    { id: 'knowledge' as TabType, label: labels.knowledge, icon: BookOpen },
    { id: 'bhakti' as TabType, label: labels.bhakti, icon: Music },
    { id: 'japa' as TabType, label: labels.japa, icon: Disc3 },
    { id: 'temples' as TabType, label: labels.temples, icon: Landmark },
  ];

  const handleTabClick = (tabId: TabType) => {
    triggerHaptic('light');
    onChangeTab(tabId);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 glass-gold border-t border-amber-500/25 px-2 pt-2 safe-bottom-padding shadow-[0_-8px_24px_rgba(0,0,0,0.7)] backdrop-blur-xl">
      <div className="max-w-md mx-auto flex items-center justify-around">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
                isActive
                  ? 'text-amber-300 font-bold scale-105'
                  : 'text-zinc-400 hover:text-amber-200/80'
              }`}
            >
              <div
                className={`w-10 h-7 flex items-center justify-center rounded-lg transition-all ${
                  isActive ? 'bg-amber-500/20 shadow-gold-sm border border-amber-500/40 text-amber-300' : ''
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.4]' : 'stroke-[1.8]'}`} />
              </div>
              <span className={`text-[11px] tracking-wide mt-0.5 ${isActive ? 'font-semibold text-amber-300' : 'font-normal'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
