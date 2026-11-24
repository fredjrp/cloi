import { ArrowRight, Check, MessageSquare, ShieldCheck, Sparkles } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

/**
 * First-run onboarding, built for a phone rather than demoed on a desktop.
 *
 * The previous screen embedded `IPhoneIgMockup` - a simulated phone inside a phone
 * frame. On a real handset that reads as a phone inside a phone inside the app, which
 * is exactly the "not my app" feeling we are trying to avoid. Everything here is
 * full-bleed: the device IS the app.
 *
 * Layout rules that make it feel native:
 *   - content scrolls, the action stays pinned to the bottom within thumb reach
 *   - safe-area padding so nothing hides under a notch or gesture bar
 *   - one idea per screen, no nested scrolling, no decorative device chrome
 */
interface MobileOnboardingProps {
  onStartSignup: () => void;
  onSignIn: () => void;
}

const SLIDES = [
  {
    icon: Sparkles,
    kicker: 'Automate the reply',
    title: 'Every comment becomes a DM',
    body:
      'Someone comments your keyword on a reel. CloiDm sends the link privately — they never had to ask, and you never had to reply by hand.',
    bullets: [
      'Works on the reels you choose',
      'Your keywords, your words',
      'Runs while you sleep',
    ],
  },
  {
    icon: MessageSquare,
    kicker: 'You set the order',
    title: 'Comment → follow → link',
    body:
      'Ask them to follow first and the link unlocks only when they do. Collect an email on the way through, then hand over the offer.',
    bullets: [
      'Follow gate that actually checks',
      'Email captured before the link',
      'Every step measured',
    ],
  },
  {
    icon: ShieldCheck,
    kicker: 'Your account, your rules',
    title: 'We never see your password',
    body:
      'You approve access on Instagram itself. CloiDm receives only what you grant, and you can cut it off from Instagram whenever you like.',
    bullets: [
      'Instagram handles the login, not us',
      'Nothing shared between accounts',
      'Sign out on this device anytime',
    ],
  },
];

export function MobileOnboarding({ onStartSignup, onSignIn }: MobileOnboardingProps) {
  const [index, setIndex] = useState(0);
  const [pressed, setPressed] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const slide = SLIDES[index];
  const Icon = slide.icon;
  const isLast = index === SLIDES.length - 1;

  // Reset scroll between slides so a long body never leaves the next one mid-way.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [index]);

  const next = () => {
    if (isLast) {
      onStartSignup();
    } else {
      setIndex((i) => Math.min(i + 1, SLIDES.length - 1));
    }
  };

  return (
    <div className="flex h-[100dvh] flex-col bg-[#F5F5F7]">
      {/* top bar: brand + skip */}
      <header
        className="flex shrink-0 items-center justify-between px-5 pb-2"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 18px)' }}
      >
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-[#1D1D1F]">
            <span className="font-display text-sm font-bold text-white">C</span>
          </div>
          <span className="font-display text-[13px] font-bold tracking-tight text-[#1D1D1F]">
            CloiDm
          </span>
        </div>
        <button
          type="button"
          onClick={onSignIn}
          className="min-h-[44px] px-2 text-[13px] font-medium text-[#6E6E73] active:text-[#1D1D1F]"
        >
          Sign in
        </button>
      </header>

      {/* scrolling content */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto overscroll-contain px-5">
        <div key={index} className="anim-slide pt-6">
          <div className="mb-7 flex h-14 w-14 items-center justify-center rounded-[18px] bg-white shadow-sm ring-1 ring-[#E5E5EA]">
            <Icon className="h-6 w-6 text-[#0071E3]" strokeWidth={2} />
          </div>

          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#0071E3]">
            {slide.kicker}
          </p>
          <h1 className="font-display text-[30px] font-bold leading-[1.15] tracking-tight text-[#1D1D1F]">
            {slide.title}
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-[#6E6E73]">{slide.body}</p>

          <ul className="mt-7 space-y-3 pb-6">
            {slide.bullets.map((b) => (
              <li key={b} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                  <Check className="h-3 w-3 text-emerald-700" strokeWidth={3} />
                </span>
                <span className="text-[14px] leading-relaxed text-[#1D1D1F]">{b}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* pinned action block, inside the thumb zone */}
      <div
        className="shrink-0 border-t border-[#E5E5EA] bg-[#F5F5F7]/95 px-5 pt-4 backdrop-blur"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)' }}
      >
        <div className="mb-4 flex items-center gap-1.5">
          {SLIDES.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === index ? 'w-7 bg-[#1D1D1F]' : 'w-1.5 bg-[#D1D1D6]'
              }`}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={next}
          onPointerDown={() => setPressed(true)}
          onPointerUp={() => setPressed(false)}
          onPointerLeave={() => setPressed(false)}
          className={`flex w-full min-h-[52px] items-center justify-center gap-2 rounded-2xl px-5 text-[15px] font-semibold text-white transition-transform ${
            pressed ? 'scale-[0.985] bg-[#0062C4]' : 'bg-[#0071E3]'
          }`}
        >
          {isLast ? 'Create my account' : 'Continue'}
          <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
        </button>

        <p className="mt-3 text-center text-[11px] leading-relaxed text-[#A1A1A6]">
          Free to start · no card required
        </p>
      </div>
    </div>
  );
}
