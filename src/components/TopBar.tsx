import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import type { NavView } from '../types/automation';

interface TopBarProps {
  activeView: NavView;
  onSelectView: (view: NavView) => void;
}

const NAV_ITEMS: { id: NavView; label: string }[] = [
  { id: 'overview', label: 'Desktop (.exe)' },
  { id: 'builder', label: 'Rule Builder' },
  { id: 'mobile', label: 'Mobile (.apk)' },
  { id: 'research', label: 'Apple UX Spec' },
];

export function TopBar({ activeView, onSelectView }: TopBarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavClick = (view: NavView) => {
    onSelectView(view);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-md border-b border-[#E5E5EA]">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-8">
        {/* Zone 1: Single text element wordmark */}
        <button
          type="button"
          onClick={() => handleNavClick('overview')}
          className="text-lg font-display font-bold tracking-tight text-[#1D1D1F] whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-[#0071E3] focus-visible:outline-offset-4 rounded-sm cursor-pointer"
        >
          CloiDm Automation
        </button>

        {/* Zone 2: 4 concise single-line nav links */}
        <nav aria-label="Primary navigation" className="hidden md:flex items-center gap-6">
          {NAV_ITEMS.map((item) => {
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavClick(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`text-sm font-medium whitespace-nowrap shrink-0 py-1 border-b-2 transition-colors duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#0071E3] focus-visible:outline-offset-4 ${
                  isActive
                    ? 'text-[#1D1D1F] border-[#0071E3]'
                    : 'text-[#6E6E73] border-transparent hover:text-[#1D1D1F]'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Single primary action + mobile drawer trigger */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => handleNavClick('onboarding')}
            className={`px-4 py-2 text-xs font-medium rounded-lg whitespace-nowrap shrink-0 transition-colors duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#0071E3] focus-visible:outline-offset-2 ${
              activeView === 'onboarding'
                ? 'bg-[#1D1D1F] text-white'
                : 'bg-[#0071E3] text-white hover:bg-[#0062C4]'
            }`}
          >
            Client Onboarding
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileMenuOpen}
            className="md:hidden min-h-[44px] min-w-[44px] flex items-center justify-center text-[#1D1D1F] rounded-lg hover:bg-[#F5F5F7] cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile navigation drawer */}
      {mobileMenuOpen && (
        <nav
          aria-label="Mobile navigation"
          className="md:hidden border-t border-[#E5E5EA] bg-white px-4 py-3 flex flex-col gap-1"
        >
          {NAV_ITEMS.map((item) => {
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavClick(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`w-full text-left px-3 min-h-[44px] rounded-lg text-sm font-medium flex items-center justify-between cursor-pointer ${
                  isActive
                    ? 'bg-[#0071E3]/10 text-[#0071E3]'
                    : 'text-[#1D1D1F] hover:bg-[#F5F5F7]'
                }`}
              >
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      )}
    </header>
  );
}
