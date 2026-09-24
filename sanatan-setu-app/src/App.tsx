import React, { useState, useEffect, useRef } from 'react';
import { App as CapApp } from '@capacitor/app';
import { SplashView } from './components/SplashView';
import { OnboardingView } from './components/OnboardingView';
import { Navbar } from './components/Navbar';
import { BottomNav, type TabType } from './components/BottomNav';
import { HomeTab } from './components/HomeTab';
import { KnowledgeTab } from './components/KnowledgeTab';
import { BhaktiTab } from './components/BhaktiTab';
import { JapaTab } from './components/JapaTab';
import { SacredIndiaTab } from './components/SacredIndiaTab';
import { MiniPlayer } from './components/MiniPlayer';
import { LogoMeaningModal } from './components/LogoMeaningModal';
import { AstrologyModal } from './components/AstrologyModal';
import { SettingsModal } from './components/SettingsModal';
import type { Language } from './types';
import { triggerHaptic } from './services/audioService';
import { popAndExecuteBackHandler } from './services/modalBackHandler';

const TABS: TabType[] = ['home', 'knowledge', 'bhakti', 'japa', 'temples'];

export const App: React.FC = () => {
  const [showSplash, setShowSplash] = useState<boolean>(true);
  // First open (fresh install / cleared data): always show Language → Topics onboarding.
  // Only skip if user already completed it in a previous session.
  const [showOnboarding, setShowOnboarding] = useState<boolean>(() => {
    try {
      return localStorage.getItem('sanatan_onboarded') !== 'true';
    } catch {
      return true; // localStorage blocked → safe default: show onboarding
    }
  });
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [lang, setLang] = useState<Language>(() => {
    const saved = localStorage.getItem('sanatan_language');
    return (saved as Language) || 'hi';
  });
  const [userPreferences, setUserPreferences] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('sanatan_user_preferences');
      return saved ? JSON.parse(saved) : ['shiva_shakti', 'mantras_stotras', 'vedas_upanishads', 'teerth_mandir'];
    } catch {
      return ['shiva_shakti', 'mantras_stotras', 'vedas_upanishads', 'teerth_mandir'];
    }
  });

  const [showLogoModal, setShowLogoModal] = useState<boolean>(false);
  const [showAstroModal, setShowAstroModal] = useState<boolean>(false);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [showExitToast, setShowExitToast] = useState<boolean>(false);

  // Touch Swipe Gesture tracking refs
  const touchStartRef = useRef<{ x: number; y: number; time: number }>({ x: 0, y: 0, time: 0 });

  // Android Native Hardware Back Button Handler
  useEffect(() => {
    let lastBackPress = 0;
    let exitToastTimer: any = null;

    const backListenerPromise = CapApp.addListener('backButton', () => {
      // 0. If any registered modal/drawer/sheet is open -> Close it first
      if (popAndExecuteBackHandler()) {
        triggerHaptic('light');
        return;
      }
      // 1. If Settings Modal is open -> Close it
      if (showSettingsModal) {
        setShowSettingsModal(false);
        triggerHaptic('light');
        return;
      }

      // 2. If Astrology or Kundli modal is open -> Close it
      if (showAstroModal) {
        setShowAstroModal(false);
        triggerHaptic('light');
        return;
      }

      // 3. If Logo or Emblem modal is open -> Close it
      if (showLogoModal) {
        setShowLogoModal(false);
        triggerHaptic('light');
        return;
      }

      // 4. If on a sub-tab (not Home) -> Navigate back to Home tab
      if (activeTab !== 'home') {
        setActiveTab('home');
        triggerHaptic('medium');
        return;
      }

      // 5. If already on Home tab -> Double-tap to Exit safeguard
      const now = Date.now();
      if (now - lastBackPress < 2200) {
        CapApp.exitApp();
      } else {
        lastBackPress = now;
        setShowExitToast(true);
        triggerHaptic('medium');
        clearTimeout(exitToastTimer);
        exitToastTimer = setTimeout(() => {
          setShowExitToast(false);
        }, 2200);
      }
    });

    return () => {
      backListenerPromise.then((handle) => handle.remove());
      clearTimeout(exitToastTimer);
    };
  }, [showSettingsModal, showAstroModal, showLogoModal, activeTab]);

  const handleSplashComplete = () => {
    setShowSplash(false);
    // Re-check onboarding flag at Proceed time — ensures Language → Topics → Main
    // on every fresh open. Only skips if user already completed onboarding.
    try {
      const onboarded = localStorage.getItem('sanatan_onboarded');
      setShowOnboarding(onboarded !== 'true');
    } catch {
      setShowOnboarding(true);
    }
  };

  const handleOnboardingComplete = (selectedLang: Language, selectedPrefs: string[]) => {
    setLang(selectedLang);
    setUserPreferences(selectedPrefs);
    localStorage.setItem('sanatan_language', selectedLang);
    localStorage.setItem('sanatan_user_preferences', JSON.stringify(selectedPrefs));
    localStorage.setItem('sanatan_onboarded', 'true');
    setShowOnboarding(false);
    triggerHaptic('medium');
  };

  // Horizontal Swipe-to-Switch Tabs (Native Mobile Feel)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      touchStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        time: Date.now()
      };
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (e.changedTouches.length === 1) {
      const deltaX = e.changedTouches[0].clientX - touchStartRef.current.x;
      const deltaY = e.changedTouches[0].clientY - touchStartRef.current.y;
      const deltaTime = Date.now() - touchStartRef.current.time;

      // Must be a predominantly horizontal swipe (not a vertical page scroll)
      if (
        Math.abs(deltaX) > 70 &&
        Math.abs(deltaX) > Math.abs(deltaY) * 1.6 &&
        deltaTime < 450
      ) {
        const currentIndex = TABS.indexOf(activeTab);

        if (deltaX < -70 && currentIndex < TABS.length - 1) {
          // Swipe Left -> Next Tab
          triggerHaptic('light');
          setActiveTab(TABS[currentIndex + 1]);
        } else if (deltaX > 70 && currentIndex > 0) {
          // Swipe Right -> Previous Tab
          triggerHaptic('light');
          setActiveTab(TABS[currentIndex - 1]);
        }
      }
    }
  };

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="min-h-screen bg-[#07090E] text-[#F5F5F0] flex flex-col font-sans selection:bg-gold-500/30 selection:text-gold-200"
    >
      {/* 1. Cinematic Splash View */}
      {showSplash && <SplashView onComplete={handleSplashComplete} />}

      {/* 2. Onboarding Flow (Language + Netflix-style Preferences) */}
      {!showSplash && showOnboarding && (
        <OnboardingView onComplete={handleOnboardingComplete} />
      )}

      {/* 3. Main Product Application (9:16 Aspect Ratio Optimized Viewport) */}
      {!showSplash && !showOnboarding && (
        <div className="flex-1 flex flex-col max-w-[440px] mx-auto w-full min-h-screen relative overflow-x-hidden shadow-2xl">
          {/* Top Luxury Navbar */}
          <Navbar
            currentLang={lang}
            onOpenSettings={() => setShowSettingsModal(true)}
            onOpenLogoInfo={() => setShowLogoModal(true)}
          />

          {/* Tab Content Viewport with Native Screen Transitions */}
          <main className="flex-1 px-3.5 pt-3 overflow-y-auto safe-tab-viewport">
            {activeTab === 'home' && (
              <HomeTab
                onNavigateTab={(tab) => setActiveTab(tab)}
                onOpenLogoModal={() => setShowLogoModal(true)}
                onOpenAstroModal={() => setShowAstroModal(true)}
                onOpenSettings={() => setShowSettingsModal(true)}
                lang={lang}
                userPreferences={userPreferences}
              />
            )}
            {activeTab === 'knowledge' && (
              <KnowledgeTab
                lang={lang}
                onNavigateTab={(tab) => setActiveTab(tab)}
              />
            )}
            {activeTab === 'bhakti' && <BhaktiTab lang={lang} />}
            {activeTab === 'japa' && <JapaTab lang={lang} />}
            {activeTab === 'temples' && <SacredIndiaTab lang={lang} />}
          </main>

          {/* Floating Persistent Mini Player */}
          <MiniPlayer onOpenFullPlayer={() => setActiveTab('bhakti')} />

          {/* Bottom Luxury 5-Tab Navigation */}
          <BottomNav
            activeTab={activeTab}
            onChangeTab={(tab) => setActiveTab(tab)}
            lang={lang}
          />

          {/* Official Emblem & 9 Pillars Modal */}
          <LogoMeaningModal
            isOpen={showLogoModal}
            onClose={() => setShowLogoModal(false)}
            lang={lang}
          />

          {/* Path 3: Sanatan Astrology, Kundli Chart & 36 Guna Milan Modal */}
          <AstrologyModal
            isOpen={showAstroModal}
            onClose={() => setShowAstroModal(false)}
            lang={lang}
          />

          {/* Settings & Language Preferences Modal */}
          <SettingsModal
            isOpen={showSettingsModal}
            onClose={() => setShowSettingsModal(false)}
            currentLang={lang}
            onSelectLang={(newLang) => setLang(newLang)}
            userPreferences={userPreferences}
            onUpdatePreferences={(newPrefs) => setUserPreferences(newPrefs)}
          />

          {/* Double-tap Back Exit Toast */}
          {showExitToast && (
            <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-black/90 border border-amber-500/50 text-amber-200 text-xs font-mono shadow-gold-lg animate-in fade-in slide-in-from-bottom-3 duration-200">
              बाहर निकलने के लिए पुनः बैक दबाएं • Press back again to exit
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default App;
