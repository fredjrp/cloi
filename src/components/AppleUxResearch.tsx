import { Check, CheckSquare, Square } from 'lucide-react';
import { useState } from 'react';
import { APPLE_UX_RESEARCH_SECTIONS, PLATFORM_COMPARISON_MATRIX } from '../data/seedData';

const READINESS_ITEMS = [
  {
    id: 'meta-scope',
    label: 'Plain-language Meta OAuth scope cards shown before popup trigger',
    category: 'Onboarding',
  },
  {
    id: 'starter-template',
    label: 'First Reel + Keyword + Follow-Gate template pre-populated in Step 2',
    category: 'Onboarding',
  },
  {
    id: 'live-sim',
    label: 'Interactive Live DM Simulator verifies Follow-Gate & Get the Link before launch',
    category: 'Adoption',
  },
  {
    id: 'email-toggle',
    label: 'Optional Email Collection (In-DM or Collection Link) configurable per rule',
    category: 'Conversion',
  },
  {
    id: 'rate-guard',
    label: 'Hourly DM rate-limit meter (200 DM/hr) visible to reassure account safety',
    category: 'Trust',
  },
  {
    id: 'thumb-apk',
    label: 'Android .apk uses 44px+ hitboxes, <15% sticky bars, and bottom-sheet quick edits',
    category: 'Platform',
  },
];

export function AppleUxResearch() {
  const [checkedIds, setCheckedIds] = useState<string[]>([
    'meta-scope',
    'starter-template',
    'live-sim',
    'email-toggle',
  ]);
  const [activeSectionId, setActiveSectionId] = useState<string>('all');

  const toggleItem = (id: string) => {
    setCheckedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const visibleSections =
    activeSectionId === 'all'
      ? APPLE_UX_RESEARCH_SECTIONS
      : APPLE_UX_RESEARCH_SECTIONS.filter((s) => s.id === activeSectionId);

  return (
    <div className="space-y-8">
      {/* Research Header */}
      <section className="bg-white border border-[#E5E5EA] rounded-2xl p-6 sm:p-8 space-y-5">
        <div className="max-w-3xl space-y-2">
          <p className="text-xs font-medium text-[#0071E3]">
            Apple Human Interface Research · .exe & .apk Client Architecture
          </p>
          <h1 className="text-2xl sm:text-3xl font-display font-semibold tracking-tight text-[#1D1D1F] text-balance">
            UI & UX Design Blueprint for Client Adoption, Follow-Gate Conversion, and Retention
          </h1>
          <p className="text-sm sm:text-base text-[#6E6E73] leading-relaxed">
            Grounded in Apple’s three design pillars—Clarity, Deference, and Depth—this research translates your existing Meta OAuth and Comment-to-DM backend into a cohesive Windows (.exe) and Android (.apk) client experience engineered to onboard creators in 90 seconds and retain them through legible follower & email ROI.
          </p>
        </div>

        {/* Section Filter Segmented Control */}
        <div className="flex flex-wrap items-center gap-1 p-1 bg-[#F5F5F7] rounded-xl w-fit" role="group" aria-label="Filter research chapters">
          <button
            type="button"
            onClick={() => setActiveSectionId('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap cursor-pointer ${
              activeSectionId === 'all'
                ? 'bg-white text-[#1D1D1F] shadow-xs'
                : 'text-[#6E6E73] hover:text-[#1D1D1F]'
            }`}
          >
            All Chapters
          </button>
          {APPLE_UX_RESEARCH_SECTIONS.map((sec) => {
            const shortLabels: Record<string, string> = {
              'hig-translation': '01. Apple HIG',
              'onboarding-adoption': '02. Onboarding',
              'follow-gate-email': '03. Follow-Gate & Email',
              'retention-metrics': '04. Retention Metrics',
            };
            return (
              <button
                key={sec.id}
                type="button"
                onClick={() => setActiveSectionId(sec.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap cursor-pointer ${
                  activeSectionId === sec.id
                    ? 'bg-white text-[#1D1D1F] shadow-xs'
                    : 'text-[#6E6E73] hover:text-[#1D1D1F]'
                }`}
              >
                {shortLabels[sec.id] ?? `${sec.number}. ${sec.title}`}
              </button>
            );
          })}
        </div>
      </section>

      {/* Research Chapters */}
      <div className="space-y-6">
        {visibleSections.map((section) => (
          <section
            key={section.id}
            className="bg-white border border-[#E5E5EA] rounded-2xl p-6 sm:p-8 space-y-6"
          >
            <div className="max-w-3xl space-y-2">
              <h2 className="text-xl font-display font-semibold text-[#1D1D1F]">
                {section.number}. {section.title}
              </h2>
              <p className="text-sm text-[#6E6E73] leading-relaxed">{section.summary}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
              {section.principles.map((p) => (
                <div
                  key={p.heading}
                  className="p-5 bg-[#F5F5F7] rounded-xl flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2">
                    <h3 className="text-sm font-display font-semibold text-[#1D1D1F]">
                      {p.heading}
                    </h3>
                    <p className="text-xs text-[#6E6E73] leading-relaxed">{p.detail}</p>
                  </div>
                  <p className="text-[11px] font-medium text-[#0071E3] pt-3 border-t border-[#E5E5EA]">
                    Impact: {p.metricImpact}
                  </p>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* Platform Adaptation Matrix (.exe vs .apk) */}
      <section className="bg-white border border-[#E5E5EA] rounded-2xl overflow-hidden">
        <div className="p-6 sm:p-8 border-b border-[#E5E5EA]">
          <h2 className="text-xl font-display font-semibold text-[#1D1D1F]">
            Cross-Platform Adaptation Matrix: Windows (.exe) vs Android (.apk)
          </h2>
          <p className="mt-1 text-sm text-[#6E6E73]">
            Shared visual language and backend API contracts, adapted natively to desktop pointer precision and mobile thumb reach.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E5E5EA] text-xs font-medium text-[#6E6E73] bg-[#FAFAFC]">
                <th className="py-3.5 px-6 w-48">Design Dimension</th>
                <th className="py-3.5 px-6">Windows Desktop Client (.exe)</th>
                <th className="py-3.5 px-6">Android Mobile Client (.apk)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E5EA] text-xs sm:text-sm">
              {PLATFORM_COMPARISON_MATRIX.map((row) => (
                <tr key={row.dimension}>
                  <td className="py-4 px-6 font-semibold text-[#1D1D1F] align-top">
                    {row.dimension}
                  </td>
                  <td className="py-4 px-6 text-[#6E6E73] leading-relaxed align-top">
                    {row.exeDesktop}
                  </td>
                  <td className="py-4 px-6 text-[#6E6E73] leading-relaxed align-top">
                    {row.apkMobile}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Interactive Implementation Readiness Checklist */}
      <section className="bg-white border border-[#E5E5EA] rounded-2xl p-6 sm:p-8 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-display font-semibold text-[#1D1D1F]">
              Client Launch UX Readiness Audit
            </h2>
            <p className="text-xs text-[#6E6E73]">
              Interactive checklist for your .exe and .apk engineering handoff.
            </p>
          </div>
          <span className="text-xs font-mono-tabular font-semibold text-[#16A34A] inline-flex items-center gap-1.5">
            <Check className="w-4 h-4" aria-hidden="true" />
            {checkedIds.length} / {READINESS_ITEMS.length} verified
          </span>
        </div>

        <div className="divide-y divide-[#E5E5EA] border border-[#E5E5EA] rounded-xl overflow-hidden">
          {READINESS_ITEMS.map((item) => {
            const checked = checkedIds.includes(item.id);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => toggleItem(item.id)}
                aria-pressed={checked}
                className="w-full px-4 py-3.5 min-h-[48px] flex items-center justify-between gap-4 text-left hover:bg-[#F5F5F7] transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {checked ? (
                    <CheckSquare className="w-4 h-4 text-[#0071E3] shrink-0" aria-hidden="true" />
                  ) : (
                    <Square className="w-4 h-4 text-[#6E6E73] shrink-0" aria-hidden="true" />
                  )}
                  <span className={`text-xs sm:text-sm ${checked ? 'text-[#1D1D1F] font-medium' : 'text-[#6E6E73]'}`}>
                    {item.label}
                  </span>
                </div>
                <span className="text-[11px] text-[#6E6E73] shrink-0">{item.category}</span>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
