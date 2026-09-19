import { AiTutor } from "@/components/vault/AiTutor";
import { AuthSlot } from "@/components/vault/AuthSlot";
import { ChemLab } from "@/components/vault/ChemLab";
import { ColorChips } from "@/components/vault/ColorChips";
import { ColourAtlas } from "@/components/vault/ColourAtlas";
import { EquationBalancer } from "@/components/vault/EquationBalancer";
import { GlobalSearch } from "@/components/vault/GlobalSearch";
import { MasteryStrip } from "@/components/vault/MasteryStrip";
import { Onboarding } from "@/components/vault/Onboarding";
import { PwaRegister } from "@/components/vault/PwaRegister";
import { CountUp, Reveal } from "@/components/vault/Reveal";
import { QuizEngine } from "@/components/vault/QuizEngine";
import { ReactionCard } from "@/components/vault/ReactionCard";
import { RevisionQueue } from "@/components/vault/RevisionQueue";
import { Sidebar, BrandMark, type Section } from "@/components/vault/Sidebar";
import { StudentHydrate } from "@/components/vault/StudentHydrate";
import { ThemeToggle } from "@/components/vault/ThemeToggle";
import { VirtualLab } from "@/components/vault/VirtualLab";
import { chapters, colours, definitions, notes, quizData, reactions } from "@/lib/data/catalogue";
import { credits, functionalGroups, indicators, pHGuide, series } from "@/lib/data/more";
import type { Credit } from "@/lib/data/more";
import type { ChapterId } from "@/lib/data/quiz";
import {
  bucketsFor,
  matchesReagent,
  REAGENTS,
  reactionKey,
  TYPE_BUCKETS,
  type TypeBucket,
} from "@/lib/reaction-filters";
import { useStudent } from "@/lib/student/store";
import { cn } from "@/lib/utils";
import type { SearchHit } from "@/lib/vault-search";
import {
  ArrowRight,
  BookOpen,
  Bookmark,
  BookmarkCheck,
  ChevronRight,
  FlaskConical,
  GraduationCap,
  Lightbulb,
  Menu,
  MessageCircle,
  Megaphone,
  Palette,
  Search,
  Sparkles,
  Star,
  TestTubes,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

const SECTION_IDS: Section[] = [
  "overview",
  "reactions",
  "balancer",
  "colours",
  "lab",
  "simulator",
  "definitions",
  "notes",
  "quiz",
  "revision",
  "ai",
  "credits",
];

/** Role tone → text class (Udirn's Creator role cycles a full RGB rainbow). */
const ROLE_TONE_CLASS: Record<Credit["tone"], string> = {
  rainbow: "rainbow-role",
  teal: "text-primary",
  gold: "text-gold",
  sky: "text-sky",
};

const EXHIBITS = [
  { label: "Exhibit A", src: "/credits/he-looks-like-this-1.png" },
  { label: "Exhibit B", src: "/credits/he-looks-like-this-2.png" },
  { label: "Exhibit C", src: "/credits/he-looks-like-this-3.png" },
];

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function VaultApp() {
  const [query, setQuery] = useState("");
  const [chapter, setChapter] = useState<"all" | ChapterId>("all");
  const [section, setSection] = useState<Section>("overview");
  const [savedOnly, setSavedOnly] = useState(false);
  const [typeFilter, setTypeFilter] = useState<TypeBucket | "all">("all");
  const [reagent, setReagent] = useState<string>("all");
  const [progressFilter, setProgressFilter] = useState<"all" | "learned" | "review" | "unseen">("all");
  const [searchOpen, setSearchOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [quizFocus, setQuizFocus] = useState<string | undefined>();

  const stars = useStudent((s) => s.stars);
  const mastery = useStudent((s) => s.mastery);
  const bookDefs = useStudent((s) => s.bookDefs);
  const bookNotes = useStudent((s) => s.bookNotes);
  const toggleBook = useStudent((s) => s.toggleBook);

  /* ⌘K / Ctrl+K */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  /* scroll-spy keeps the sidebar in sync while scrolling */
  useEffect(() => {
    const els = SECTION_IDS.map((id) => document.getElementById(id)).filter(
      (el): el is HTMLElement => el != null,
    );
    if (!els.length || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) {
          const id = visible[0].target.id as Section;
          setSection(id);
        }
      },
      { rootMargin: "-15% 0px -62% 0px", threshold: 0 },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return reactions.filter((r) => {
      if (chapter !== "all" && r.ch !== chapter) return false;
      const key = reactionKey(r);
      if (savedOnly && !stars.includes(key)) return false;
      if (typeFilter !== "all" && !bucketsFor(r.type).includes(typeFilter)) return false;
      if (reagent !== "all" && !matchesReagent(r, reagent)) return false;
      const flag = mastery[key] ?? "unset";
      if (progressFilter === "learned" && flag !== "learned") return false;
      if (progressFilter === "review" && flag !== "review") return false;
      if (progressFilter === "unseen" && flag !== "unset") return false;
      if (!q) return true;
      const blob = `${r.title} ${r.eq} ${r.type} ${r.colour} ${r.obs} ${r.cond} ${r.tip} ${r.desc}`.toLowerCase();
      return blob.includes(q);
    });
  }, [query, chapter, savedOnly, stars, typeFilter, reagent, progressFilter, mastery]);

  const navigate = useCallback((id: Section | ChapterId) => {
    setDrawerOpen(false);
    if (id === "ch1" || id === "ch2" || id === "ch3" || id === "ch4") {
      setChapter(id);
      setSection("reactions");
      scrollToId("reactions");
      return;
    }
    setSection(id);
    if (id === "overview") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      scrollToId(id);
    }
  }, []);

  const pickHit = (hit: SearchHit) => {
    setSearchOpen(false);
    if (hit.kind === "reaction") {
      const found = reactions.find((r) => reactionKey(r) === hit.id);
      if (found) setChapter(found.ch);
      setSection("reactions");
      scrollToId("reactions");
      return;
    }
    if (hit.kind === "quiz") {
      setQuizFocus(hit.id);
      setSection("quiz");
      scrollToId("quiz");
      return;
    }
    if (hit.kind === "chapter") {
      navigate(hit.id as ChapterId);
      return;
    }
    if (hit.href === "chapter-map") {
      scrollToId("chapter-map");
      setSection("overview");
      return;
    }
    setSection(hit.href as Section);
    scrollToId(hit.href);
  };

  const sidebarFooter = (
    <>
      <PwaRegister />
      <ThemeToggle />
      <AuthSlot />
    </>
  );

  const quizTotal = Object.values(quizData).reduce((n, q) => n + q.length, 0);

  return (
    <div className="relative min-h-dvh w-full overflow-x-clip">
      <StudentHydrate />
      <Onboarding />
      <GlobalSearch
        open={searchOpen}
        query={query}
        onQuery={setQuery}
        onClose={() => setSearchOpen(false)}
        onPick={pickHit}
      />

      <Sidebar
        section={section}
        onNavigate={navigate}
        mobileOpen={drawerOpen}
        onCloseMobile={() => setDrawerOpen(false)}
        footer={sidebarFooter}
      />

      <div className="relative lg:pl-[264px]">
        <ChemLab />

        {/* mobile top bar */}
        <header className="sticky top-0 z-50 flex h-16 items-center gap-2 border-b border-border/70 bg-bg/80 px-4 backdrop-blur-xl lg:hidden">
          <BrandMark />
          <div className="ms-auto flex items-center gap-2">
            <button
              type="button"
              aria-label="Open search"
              onClick={() => setSearchOpen(true)}
              className="grid size-10 place-items-center rounded-xl border border-border text-muted transition-colors hover:text-fg"
            >
              <Search className="size-4" />
            </button>
            <button
              type="button"
              aria-label="Open menu"
              onClick={() => setDrawerOpen(true)}
              className="grid size-10 place-items-center rounded-xl border border-border text-muted transition-colors hover:text-fg"
            >
              <Menu className="size-4" />
            </button>
          </div>
        </header>

        <main className="safe-pad relative mx-auto w-full max-w-[1140px] px-4 pb-20 sm:px-6 lg:px-10">
          {/* ==================== HERO ==================== */}
          <section id="overview" className="scroll-mt-24 pb-4 pt-10 sm:pt-14 lg:pt-20">
            <div className="stagger">
              <div className="eyebrow">
                <FlaskConical className="size-3.5" />
                CBSE · Class 10 · NCERT Chemistry
              </div>
              <h1 className="wordmark mt-4 max-w-3xl font-display text-[clamp(2.6rem,8vw,5.2rem)] font-semibold leading-[1.02] tracking-tight">
                ChemVault 10
              </h1>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
                A private revision laboratory — every high-yield reaction, colour, definition and
                exam rule, engineered into one premium, precision-built study instrument.
              </p>
              <div className="mt-8 flex w-full flex-col gap-3 sm:flex-row sm:items-center">
                <label className="relative flex min-h-12 min-w-0 flex-1 items-center">
                  <Search className="pointer-events-none absolute left-4 size-4 text-muted" />
                  <input
                    value={query}
                    suppressHydrationWarning
                    onFocus={() => setSearchOpen(true)}
                    onChange={(e) => {
                      setQuery(e.target.value);
                      setSearchOpen(true);
                    }}
                    placeholder="Search a reaction, HCl, colour, definition…"
                    className="input pl-11 pr-16"
                  />
                  <kbd className="absolute right-3 hidden rounded-md border border-border px-1.5 py-0.5 font-mono text-[0.6rem] text-muted sm:block">
                    ⌘K
                  </kbd>
                </label>
                <div className="flex gap-2.5">
                  <button
                    type="button"
                    onClick={() => scrollToId("chapter-map")}
                    className="btn btn-primary h-12 flex-1 px-5 sm:flex-none"
                  >
                    Explore chapters
                    <ArrowRight className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate("quiz")}
                    className="btn btn-ghost h-12 flex-1 px-5 sm:flex-none"
                  >
                    <GraduationCap className="size-4" />
                    Take a quiz
                  </button>
                </div>
              </div>
              <div className="mt-9 grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4">
                {(
                  [
                    [reactions.length, "Reactions", FlaskConical],
                    [definitions.length, "Definitions", BookOpen],
                    [colours.length, "Colours", Palette],
                    [quizTotal, "Quiz items", GraduationCap],
                  ] as const
                ).map(([n, label, Icon]) => (
                  <div key={label} className="glass rounded-2xl px-4 py-3.5">
                    <p className="flex items-center gap-1.5 text-[0.6rem] font-bold uppercase tracking-[0.18em] text-muted">
                      <Icon className="size-3 text-gold" />
                      {label}
                    </p>
                    <p className="tabular mt-1 font-display text-2xl text-fg">
                      <CountUp to={n} />
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ==================== CHAPTER MAP ==================== */}
          <section id="chapter-map" className="scroll-mt-24 py-12">
            <Reveal>
              <SectionHead
                eyebrow="The syllabus"
                title="Chapter map"
                sub="Four NCERT chapters, distilled into exam-ready intelligence."
              />
            </Reveal>
            <div className="grid gap-4 sm:grid-cols-2">
              {chapters.map((ch, idx) => (
                <Reveal key={ch.id} delay={idx * 70}>
                  <button
                    type="button"
                    onClick={() => navigate(ch.id)}
                    className="glass glass-hover group w-full rounded-[1.35rem] p-6 text-left"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs tracking-[0.28em] text-gold">{ch.num}</span>
                      <span className="grid size-9 place-items-center rounded-xl border border-border text-muted transition-all duration-300 group-hover:border-primary/50 group-hover:text-primary">
                        <ChevronRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                      </span>
                    </div>
                    <h3 className="mt-5 font-display text-[1.45rem] leading-snug text-fg">{ch.title}</h3>
                    <p className="mt-2 text-[0.83rem] leading-relaxed text-muted">{ch.blurb}</p>
                  </button>
                </Reveal>
              ))}
            </div>
          </section>

          <MasteryStrip />

          {/* ==================== REACTIONS ==================== */}
          <section id="reactions" className="scroll-mt-24 py-12">
            <Reveal>
              <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
                <SectionHead
                  eyebrow="Core content"
                  title="Important reactions"
                  sub={`Showing ${filtered.length} of ${reactions.length} board-curated reactions.`}
                />
                <button
                  type="button"
                  onClick={() => setSavedOnly((v) => !v)}
                  className={cn("chip", savedOnly && "chip-gold-on")}
                >
                  {savedOnly ? <BookmarkCheck className="size-4" /> : <Bookmark className="size-4" />}
                  Saved only
                </button>
              </div>
            </Reveal>

            <div className="mb-3 grid gap-2.5">
              <FilterRow label="Chapter">
                <button
                  type="button"
                  onClick={() => setChapter("all")}
                  className={cn("chip", chapter === "all" && "chip-on")}
                >
                  All chapters
                  <span className="chip-count">{reactions.length}</span>
                </button>
                {chapters.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setChapter(c.id)}
                    className={cn("chip", chapter === c.id && "chip-on")}
                  >
                    Ch {c.num}
                    <span className="chip-count">{reactions.filter((r) => r.ch === c.id).length}</span>
                  </button>
                ))}
              </FilterRow>
              <FilterRow label="Progress">
                {(
                  [
                    ["all", "All"],
                    ["unseen", "Unseen"],
                    ["learned", "Learned"],
                    ["review", "Needs review"],
                  ] as const
                ).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setProgressFilter(id)}
                    className={cn("chip", progressFilter === id && "chip-on")}
                  >
                    {label}
                  </button>
                ))}
              </FilterRow>
              <FilterRow label="Type" scroll>
                <button
                  type="button"
                  onClick={() => setTypeFilter("all")}
                  className={cn("chip", typeFilter === "all" && "chip-on")}
                >
                  All types
                </button>
                {TYPE_BUCKETS.map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setTypeFilter(b)}
                    className={cn("chip", typeFilter === b && "chip-on")}
                  >
                    {b}
                  </button>
                ))}
              </FilterRow>
              <FilterRow label="Reagent" scroll>
                <button
                  type="button"
                  onClick={() => setReagent("all")}
                  className={cn("chip", reagent === "all" && "chip-on")}
                >
                  Any reagent
                </button>
                {REAGENTS.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setReagent(r.id)}
                    className={cn("chip eq text-xs", reagent === r.id && "chip-on")}
                  >
                    {r.id}
                  </button>
                ))}
              </FilterRow>
            </div>

            {filtered.length === 0 ? (
              <p className="glass rounded-[1.35rem] px-6 py-16 text-center text-muted">
                No reactions match. Clear a filter or try another keyword.
              </p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {filtered.map((r, i) => (
                  <ReactionCard key={reactionKey(r)} r={r} index={i} />
                ))}
              </div>
            )}
          </section>

          <EquationBalancer />

          {/* ==================== COLOUR ATLAS ==================== */}
          <section id="colours" className="scroll-mt-24 py-12">
            <Reveal>
              <SectionHead
                eyebrow="Signature collection"
                title="Colour Atlas"
                sub={`${colours.length} compounds · every appearance the paper demands, presented like a gallery.`}
              />
            </Reveal>
            <ColourAtlas />
          </section>

          {/* ==================== LAB BENCH ==================== */}
          <LabBench />

          <VirtualLab />

          {/* ==================== DEFINITIONS ==================== */}
          <section id="definitions" className="scroll-mt-24 py-12">
            <Reveal>
              <SectionHead
                eyebrow="Exact wording"
                title="Quick definitions"
                sub="Board-ready phrasing. Memorise these as written — they win full marks."
              />
            </Reveal>
            <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
              {definitions.map((d, idx) => (
                <Reveal key={d.title} delay={Math.min(idx, 6) * 40} className="h-full">
                  <article className="glass glass-hover flex h-full flex-col rounded-[1.15rem] p-5">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="flex items-start gap-2 font-display text-[1.05rem] leading-snug text-fg">
                        <BookOpen className="mt-1 size-4 shrink-0 text-primary" />
                        {d.title}
                      </h3>
                      <button
                        type="button"
                        aria-label="Save definition"
                        onClick={() => toggleBook("def", d.title)}
                        className="shrink-0 rounded-lg p-1 text-muted transition-colors hover:text-gold"
                      >
                        <Star className={cn("size-4", bookDefs.includes(d.title) && "fill-gold text-gold")} />
                      </button>
                    </div>
                    <div className="hairline my-3.5" />
                    <p className="mt-auto whitespace-pre-line text-[0.83rem] leading-relaxed text-muted">
                      {d.body}
                    </p>
                  </article>
                </Reveal>
              ))}
            </div>
          </section>

          {/* ==================== NOTES ==================== */}
          <section id="notes" className="scroll-mt-24 py-12">
            <Reveal>
              <SectionHead
                eyebrow="Mark-winning rules"
                title="Core exam notes"
                sub="Shortcuts, traps and the exact rules that convert effort into marks."
              />
            </Reveal>
            <div className="grid gap-3.5 md:grid-cols-2">
              {notes.map((n, idx) => (
                <Reveal key={n.title} delay={Math.min(idx, 6) * 40} className="h-full">
                  <article className="glass glass-hover flex h-full flex-col rounded-[1.15rem] p-5">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="flex items-start gap-2 font-display text-[1.05rem] leading-snug text-fg">
                        <Lightbulb className="mt-1 size-4 shrink-0 text-gold" />
                        {n.title}
                      </h3>
                      <button
                        type="button"
                        aria-label="Save note"
                        onClick={() => toggleBook("note", n.title)}
                        className="shrink-0 rounded-lg p-1 text-muted transition-colors hover:text-gold"
                      >
                        <Star className={cn("size-4", bookNotes.includes(n.title) && "fill-gold text-gold")} />
                      </button>
                    </div>
                    <div className="hairline my-3.5" />
                    <p className="mt-auto whitespace-pre-line text-[0.83rem] leading-relaxed text-muted">
                      {n.body}
                    </p>
                  </article>
                </Reveal>
              ))}
            </div>
          </section>

          {/* ==================== QUIZ ==================== */}
          <section id="quiz" className="scroll-mt-24 py-12">
            <Reveal>
              <SectionHead
                eyebrow="The arena"
                title="Quiz Arena"
                sub={`${quizTotal} questions · 1-mark MCQs, assertion–reason and case-based. Instant marking, worked reasons, timed and full exam simulations.`}
              />
            </Reveal>
            <QuizEngine focusId={quizFocus} onConsumedFocus={() => setQuizFocus(undefined)} />
          </section>

          {/* ==================== REVISION ==================== */}
          <section id="revision" className="scroll-mt-24 py-12">
            <Reveal>
              <SectionHead
                eyebrow="Your shelf"
                title="My Revision"
                sub="Starred reactions, review flags, saved definitions and every question you missed — in one queue."
              />
            </Reveal>
            <RevisionQueue
              onOpenQuiz={(id) => {
                if (id) setQuizFocus(id);
                setSection("quiz");
                scrollToId("quiz");
              }}
            />
          </section>

          {/* ==================== AI ==================== */}
          <section id="ai" className="scroll-mt-24 py-12">
            <Reveal>
              <SectionHead
                eyebrow="Concierge"
                title="Ask the AI tutor"
                sub="A Grok-powered chemistry tutor that speaks fluent NCERT Class 10."
              />
            </Reveal>
            <AiTutor />
          </section>

          {/* ==================== CREDITS ==================== */}
          <section id="credits" className="scroll-mt-24 py-12">
            <Reveal>
              <SectionHead eyebrow="Acknowledgement" title="Credits" sub="The people behind this vault." />
            </Reveal>
            <Reveal delay={80}>
              <div className="glass rounded-[1.5rem] p-7 sm:p-12">
                <p className="eyebrow justify-center text-center">With gratitude to</p>
                <ul className="mt-8 grid gap-4 sm:grid-cols-2">
                  {credits.map((c) => (
                    <li
                      key={c.name}
                      className="group flex flex-col gap-3 rounded-2xl border border-border/70 bg-bg/55 px-5 py-5 transition-colors hover:border-gold/40"
                    >
                      <div className="flex items-center gap-4">
                        <span className="grid size-12 shrink-0 place-items-center rounded-2xl border border-gold/30 bg-gold/10">
                          <Users className="size-5 text-gold" />
                        </span>
                        <div className="min-w-0">
                          <p className="font-display text-2xl text-fg">{c.name}</p>
                          <p
                            className={cn(
                              "text-xs font-semibold uppercase tracking-[0.16em]",
                              ROLE_TONE_CLASS[c.tone],
                            )}
                          >
                            {c.role}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm leading-relaxed text-muted">{c.description}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>

            <Reveal delay={120}>
              <aside className="glass relative mt-6 rounded-[1.5rem] border-gold/25 p-7 sm:p-10">
                <span className="inline-flex items-center gap-2 rounded-full border border-gold/45 bg-gold/10 px-4 py-1.5 font-mono text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-gold shadow-[0_0_26px_-6px_rgb(226_194_132_/_0.5)]">
                  <Megaphone className="size-3.5" />
                  Public notice
                </span>
                <div className="mt-6 space-y-4 text-[0.95rem] leading-relaxed text-fg/90">
                  <p>
                    Following a recent internal investigation, we have reason to believe that an individual has
                    been attempting to claim credit for this website — a claim that is, regrettably, entirely
                    unfounded. The person in question goes by the name of{" "}
                    <span className="font-semibold text-danger">Ansh</span>.
                  </p>
                  <p>
                    For the record: he happens to share his name with our distinguished{" "}
                    <span className="font-semibold text-primary">Chief Moderator</span> above. They are not the
                    same person.
                  </p>
                  <p>Should he be encountered making such claims, he may be identified as follows:</p>
                </div>
                <ul className="mt-7 grid gap-4 sm:grid-cols-3">
                  {EXHIBITS.map((exhibit) => (
                    <li key={exhibit.label}>
                      <figure className="group overflow-hidden rounded-2xl border border-border/70 bg-bg/55">
                        <div className="overflow-hidden">
                          <img
                            src={exhibit.src}
                            alt={`${exhibit.label} — recent sighting, mid-claim`}
                            loading="lazy"
                            className="aspect-[4/3] w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                          />
                        </div>
                        <figcaption className="flex items-center justify-between gap-2 px-4 py-3">
                          <span className="font-mono text-xs uppercase tracking-[0.2em] text-gold">
                            {exhibit.label}
                          </span>
                          <span className="text-right text-[0.7rem] leading-tight text-muted">
                            Recent sighting, mid-claim
                          </span>
                        </figcaption>
                      </figure>
                    </li>
                  ))}
                </ul>
                <p className="mt-7 text-right font-display text-lg italic text-gold">— The ChemVault Team</p>
              </aside>
            </Reveal>
          </section>
        </main>

        <footer className="safe-pad relative border-t border-border/70 py-9">
          <div className="mx-auto flex w-full max-w-[1140px] flex-wrap items-center justify-between gap-4 px-4 text-xs text-muted sm:px-6 lg:px-10">
            <span className="flex items-center gap-2">
              <TestTubes className="size-3.5 text-primary" />
              ChemVault 10 — always cross-check with the latest NCERT textbook.
            </span>
            <span className="flex items-center gap-1.5">
              <MessageCircle className="size-3.5" />
              Crafted for CBSE Class 10 toppers.
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}

function FilterRow({
  label,
  scroll = false,
  children,
}: {
  label: string;
  scroll?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="w-16 shrink-0 text-[0.6rem] font-bold uppercase tracking-[0.18em] text-muted">
        {label}
      </span>
      <div
        className={cn(
          "flex min-w-0 flex-1 gap-2 pb-0.5",
          scroll ? "no-scrollbar overflow-x-auto" : "flex-wrap",
        )}
      >
        {children}
      </div>
    </div>
  );
}

function SectionHead({
  eyebrow,
  title,
  sub,
}: {
  eyebrow: string;
  title: string;
  sub: string;
}) {
  return (
    <div className="mb-7">
      <p className="eyebrow">
        <Sparkles className="size-3.5" />
        {eyebrow}
      </p>
      <h2 className="mt-2.5 font-display text-[clamp(1.75rem,4vw,2.5rem)] font-medium leading-tight text-fg">
        {title}
      </h2>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">{sub}</p>
      <div className="hairline mt-6" />
    </div>
  );
}

function LabBench() {
  return (
    <section id="lab" className="scroll-mt-24 py-12">
      <Reveal>
        <SectionHead
          eyebrow="Practical instruments"
          title="Lab bench"
          sub="Indicators, pH memory, reactivity series and functional groups — the tables you rewrite in the paper."
        />
      </Reveal>

      <div className="grid gap-4 lg:grid-cols-2">
        <Reveal>
          <div className="glass h-full overflow-hidden rounded-[1.35rem]">
            <div className="border-b border-border px-5 py-3.5">
              <h3 className="font-display text-lg text-fg">Indicator reference</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[26rem] text-left text-sm">
                <thead className="bg-raised/60 text-[0.62rem] font-bold uppercase tracking-[0.18em] text-muted">
                  <tr>
                    <th className="px-5 py-2.5">Indicator</th>
                    <th className="px-4 py-2.5">In acid</th>
                    <th className="px-4 py-2.5">In base</th>
                  </tr>
                </thead>
                <tbody>
                  {indicators.map((row) => (
                    <tr key={row.name} className="border-t border-border/60 transition-colors hover:bg-raised/40">
                      <td className="px-5 py-3 text-fg">
                        {row.name}
                        <div className="text-xs text-muted">{row.notes}</div>
                      </td>
                      <td className="px-4 py-3">
                        <ColorChips text={row.acid} />
                      </td>
                      <td className="px-4 py-3">
                        <ColorChips text={row.base} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Reveal>

        <Reveal delay={80}>
          <div className="glass h-full rounded-[1.35rem] p-5">
            <h3 className="font-display text-lg text-fg">pH strip</h3>
            <p className="mt-1 text-xs text-muted">Memorise the anchor values examiners quote.</p>
            <ul className="mt-4 grid gap-2">
              {pHGuide.map((p, idx) => (
                <li
                  key={p.item}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-bg/55 px-3.5 py-2.5 text-sm transition-colors hover:border-primary/40"
                  style={{ animationDelay: `${idx * 40}ms` }}
                >
                  <span className="min-w-0 truncate text-fg">{p.item}</span>
                  <span className="tabular shrink-0 rounded-md border border-primary/30 bg-primary/10 px-2 py-0.5 font-mono text-xs text-primary">
                    {p.pH} · {p.tag}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </div>

      <Reveal delay={60}>
        <div className="glass mt-4 rounded-[1.35rem] p-5 sm:p-6">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="font-display text-lg text-fg">Reactivity series</h3>
            <p className="text-xs text-muted">Most reactive first · hydrogen sits between Pb and Cu.</p>
          </div>
          <div className="no-scrollbar mt-5 flex items-center gap-0 overflow-x-auto pb-2">
            {series.map((m, i) => (
              <div key={m} className="flex items-center">
                <span
                  className={cn(
                    "grid size-11 shrink-0 place-items-center rounded-xl border font-mono text-sm font-semibold transition-transform duration-200 hover:scale-110",
                    m === "H"
                      ? "border-gold/60 bg-gold/10 text-gold shadow-[0_0_18px_-4px_rgb(226_194_132/0.5)]"
                      : "border-border bg-bg/60 text-fg",
                  )}
                  title={m === "H" ? "Hydrogen — the reference line" : undefined}
                >
                  {m}
                </span>
                {i < series.length - 1 && <span className="h-px w-3 shrink-0 bg-border" />}
              </div>
            ))}
          </div>
        </div>
      </Reveal>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {functionalGroups.map((g, idx) => (
          <Reveal key={g.name} delay={idx * 50} className="h-full">
            <article className="glass glass-hover h-full rounded-2xl p-4">
              <p className="text-[0.6rem] font-bold uppercase tracking-[0.2em] text-muted">{g.name}</p>
              <p className="eq mt-2.5 inline-block rounded-lg border border-primary/25 bg-primary/8 px-2.5 py-1 text-sm font-semibold text-primary">
                {g.group}
              </p>
              <p className="mt-2 text-[0.83rem] text-fg">{g.example}</p>
            </article>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
