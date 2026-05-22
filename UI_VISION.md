# Mavro Platform — UI Vision & Design Manifesto

**Status:** Permanent Reference Document
**Scope:** Frontend Architecture, UX/UI Design, Visual Identity
**Companion to:** [PROJECT_CONTEXT.md](./PROJECT_CONTEXT.md), [AGENTS.md](./AGENTS.md)

This document defines the visual + UX direction for the Mavro platform across the admin operations console AND every public marketing site. Read it before generating any UI code.

---

## 1. Core Vision

Mavro is **not a generic CRUD admin dashboard**. It is a **premium multi-tenant SEO, publishing, and operations platform**.

**Three concurrent surfaces, one identity:**
1. Admin operations console — cinematic command center for managing N tenants
2. Public marketing sites — premium SaaS landing pages per product (HRMS, Tickets, future tenants)
3. Public infrastructure surfaces — sitemaps, robots.txt (machine-facing, but kept polished)

**Emotional target:**
- **Cinematic & Immersive** — deep environments, beautiful lighting, spatial awareness
- **Intelligent & Operational** — data feels actionable and ecosystem-aware
- **Editorial & High-End** — clean typography, premium spacing, luxury software feel
- **Futuristic Command-Center** — capable, slightly sci-fi, but grounded in usability
- **Trustworthy** — every metric derives from real analysis, no placeholders

---

## 2. Design Philosophy

- **Workspace > Form Collection.** Dashboard surfaces contextual intelligence, not flat database rows.
- **Asymmetric composition.** Avoid 4-equal-cards rows. Use 8/4, 7/5, 3/6/3 column spans.
- **Hierarchy over symmetry.** Visual importance dictates size + placement.
- **Whitespace as luxury.** Generous padding/margins. Breathing room implies confidence.
- **Restrained motion.** Motion is for context, never decoration.
- **Depth and layering.** Translucent surfaces + shadows create Z-axis. Flat design is out.
- **Contextual UI.** Hide secondary actions behind hover, drawers, expandables.
- **Reject generic SaaS aesthetics.** No Bootstrap-style flat tables, no Tailwind Admin Template look.
- **Real metrics only.** Every dashboard tile must derive from actual data or be removed.

---

## 3. Visual Identity

The aesthetic direction is **Cyber Editorial Console** for dark mode + **Premium Pastel Atelier** for light mode.

### 3.1 Dark theme — Cyber Editorial (default)

- **Dark graphite base** — `hsl(240 10% 3.9%)` near-black, layered grays
- **Translucent surfaces** — frosted glass via `backdrop-blur` + low-opacity white
- **Subtle neon accents** — saturated colors (violet, cyan, emerald, amber, rose) for status + emphasis
- **Ambient glows** — soft diffused colored drop-shadows under MetricOrbs, active nav, primary CTAs
- **Cinematic shadows** — deep smooth lift for floating panels
- **Soft gradients** — subtle directional gradients for borders, text clips, accents
- **Per-tenant accent** — HRMS = violet, Tickets = cyan/teal/emerald, future tenants from `branding.primaryColor`

### 3.2 Light theme — Premium Pastel Atelier

- **Warm off-white base** — `hsl(32 35% 96%)` cream with lavender hint (never pure white)
- **Foggy lavender sidebar** — `hsl(250 32% 95.5%)` distinct from canvas
- **Pastel translucency** — `rgba(255, 252, 250, 0.55)` for glass surfaces with rose-tinted borders
- **Desaturated accents** — violet 58% sat, rose 38% — never candy pastels
- **Ambient body wash** — three radial gradients (violet TL, rose TR, cyan B) at <0.35 opacity
- **Violet-tinted shadows** instead of black drop-shadows
- **No-flash bootstrap** — `index.html` script sets `.dark` class before React mounts
- **Light-mode utility repaint layer** — `:where(html:not(.dark))` automatically maps `text-white/*`, `bg-white/[0.0X]`, `border-white/*`, `text-violet-400` etc. to semantic light tokens

### 3.3 Avoid in both themes

- Overly colorful or bright dashboards
- Hard borders (prefer background contrast + subtle borders `border-white/[0.04]` or `border-border/70`)
- Glassmorphism spam (use strategically on top-level panels only)
- Cluttered edge-to-edge layouts
- Cartoonish illustrations or stock photo grids

---

## 4. Layout System

Mavro's layout breaks from traditional admin structures.

### 4.1 Layout primitives

- **Floating/collapsible Sidebar** — feels like a physical panel, icon-driven
- **Command Topbar (h-12)** — global search slot, tenant switcher, alerts, theme toggle
- **Asymmetric 12-col grids** — variable spans (e.g., 8/4, 7/5, 3/6/3)
- **Contextual drawers + sticky panels** — right-side slide-overs for deep dives
- **Expandable detail regions** — cards expand instead of new pages

### 4.2 Spacing rhythm

- Large predictable spacing scale (`gap-4`, `gap-6`, `gap-8`)
- Tight proximity inside cards (`p-4`, `p-5`)
- Luxurious margins between cards (`gap-6`, `gap-8`)
- Section vertical rhythm (`py-24 md:py-32` on public sites)

### 4.3 Public site composition

- Hero with parallax + mouse-following glow + scroll-progress bar
- 13–14 sections per landing page
- `EditorialSection` wrapper for consistent caption + headline + subtitle rhythm
- Animated reveal on scroll (`whileInView`, `once: true`)
- Footer always token-driven

---

## 5. Typography Philosophy

**Editorial, bold, spacious.**

- **Fonts:** `Inter` for interface + prose, `JetBrains Mono` for data, metrics, code, system identifiers
- **Hierarchy:**
  - Massive display headers: `text-4xl tracking-tighter` (admin) / `text-[3.75rem] lg:text-[4.5rem]` (public hero)
  - Uppercase overlines: `text-[10px] uppercase tracking-[0.2em]` or `tracking-[0.22em]`
  - Tabular nums for metrics: `font-mono tabular-nums`
- **Contrast:** use `text-white/70`, `text-white/40` (dark) or `text-foreground/70`, `text-muted-foreground` (theme-aware)
- **Avoid:** tiny cramped text, excessive font weights, corporate typography

---

## 6. Motion Philosophy

Motion must be **cinematic, smooth, restrained**.

- **Timing:** 0.2s–0.5s, spring physics or custom ease curves (`[0.22, 1, 0.36, 1]`, `[0.25, 0.46, 0.45, 0.94]`)
- **Hover microinteractions:** slight lift (`-translate-y-0.5`), border opacity bump, ambient glow intensify
- **Depth transitions:** menus/dropdowns/modals scale `0.95 → 1` + fade
- **Staggered entrances:** lists, feeds, dashboard cards cascade on load (max 0.07s per item)
- **Scroll-driven:** parallax on hero panels via `useScroll` + `useTransform` (respects `prefers-reduced-motion`)
- **Mouse-following glow:** subtle orb tracking pointer on hero sections only
- **Avoid:** flashy motion spam, bouncing elements, distracting animation overload

---

## 7. Component System

### 7.1 Admin operations primitives (`client/src/components/cyber/`)

- **`GlassCard`** — foundation. Frosted panel with top-edge sheen, cinematic shadow, hover lift. `bg-card border-border/70 shadow-[var(--shadow-card)]`.
- **`GlassPanel`** — `GlassCard` with title + caption + optional action header
- **`MetricOrb`** — radial metric indicator (replaces generic stat card). Gradient background, pulse-on-hover.
- **`InsightWidget`** — compact data card with trend arrows + animated spark bars
- **`ActivityRail`** — vertical timeline with colored neon dots (publishing feed)

### 7.1a Blog Editor Cockpit primitives (`client/src/components/blog-editor/`)

Editorial writing cockpit for `/blogs/new` + `/blogs/:id/edit`:
- **`SeoAssistantPanel`** — sticky right-side composer; debounced 280ms live audit
- **`SeoScoreRing`** — animated Recharts RadialBar with grade letter overlay
- **`FocusKeywordCard`** — keyword input + 8-slot placement matrix + density band pill
- **`SeoChecklist`** — task-based checklist; completed group collapsible; gradient progress bar
- **`CockpitCards`** — 7 audit cards (Content, Structure, Metadata, Readability, Links, Media, IssueFeed)
- **`LiveSeoEngine.js`** — pure wrapper around `seoHealth.auditBlog()` + adds editor-specific surfaces

### 7.1b Analytics Intelligence primitives (`client/src/components/analytics/`)

Operational telemetry surface for `/analytics`:
- **`AnalyticsFilters`** — range pills + website select + refresh + pulsing live-count badge
- **`AnalyticsOverview`** — 5 KPI tiles with TrendPills + 3 engagement tiles
- **`TrafficTimeline`** — Recharts AreaChart with 3 gradient series + empty state
- **`ConversionFunnels`** — 3-stage session funnel with animated step-conversion bars
- **`TenantComparison`** — per-tenant rollup cards with branding accent strip
- **`RealtimeEventFeed`** — neon-dot event stream; 15s polled refresh; time-ago labels
- **`ContentPerformance`** — sortable per-blog table with stale flag (>180 days)
- **`TrafficIntelligence`** — 3-up: landing pages / exit pages / top blogs with progress-bar rows
- **`SeoTelemetry`** — cross-corpus SEO audit gauge (consumes `seoHealth.auditCorpus`)
- **`OperationalInsights`** — narrative observation generator (pure function over real metrics)
- **`AnomalyAlerts`** (Phase 2.0) — severity-tagged anomaly cards: `severity badge → kind tag → title → message → arrow-prefixed recommendation`; all-clear emerald ShieldCheck card when no anomalies
- **`BehaviorIntelligence`** (Phase 2.0) — 2-up panel: emerald Best Converting Pages + rose Highest Bounce Pages with horizontal-bar visualization
- **`InfoPopover`** — reusable contextual-help popover next to every metric label. Glassmorphism `bg-popover/95 backdrop-blur-xl border border-violet-500/30` + violet accent strip + violet-tinted soft shadow. Framer Motion scale+fade. Portaled to `<body>` to survive `overflow:hidden` clipping. Hover on desktop, tap on touch (UA-detected). Auto-flips above trigger when bottom space insufficient. Closes on outside-click, escape, scroll. Copy sourced from `lib/analyticsCopy.js` `METRIC_INFO` registry (18 keys).
- Overview tile row supports 4 engagement tiles: Avg Session, Pages/Session, Bounce Rate, **Returning %**

### 7.2 Public site primitives

Tenant-agnostic in `client/src/components/hrms/` (reused by Tickets via cross-imports):
- **`GlassSurface`** — public-site glass card variant
- **`EditorialSection`** — section wrapper with caption + headline rhythm + reveal animation
- **`AmbientGlowLayer`** — fixed background gradient orbs (HRMS = violet/rose/cyan; Tickets = cyan/emerald/indigo via `tickets/AmbientGlowLayer`)
- **`AnimatedGridBackground`** — subtle HUD-style perspective grid with radial mask fade
- **`ScrollProgress`** — top-of-page spring-smoothed gradient progress bar
- **`ModuleShowcaseCard`** — interactive module card with hover halo + feature list
- **`CommandNavbar` / `OperationsNavbar`** — sticky scroll-aware top nav per tenant
- **`Hero`** — parallax + mouse glow + floating panels (HRMS = analytics + feed + metric orb; Tickets = SLA timer + incident feed + MTTR orb)
- **`ContactForm`** — validated lead form with success animation, tenant-aware

### 7.3 Tickets-specific primitives (`client/src/components/tickets/`)

- **`SLATimerPanel`** — live ticking SLA countdown per priority tier
- **`FloatingIncidentFeed`** — neon-dot vertical incident stream
- **`TicketMetricOrb`** — compact MTTR/SLA metric chip
- **`WorkflowVisualizer`** — 7-stage horizontal/vertical pipeline with animated connector arrows

### 7.4 Component feel checklist

Every primitive must feel:
- **Tactile** — responds to hover
- **Layered** — has a defined z-axis position
- **Responsive** — uses theme tokens, never hardcoded colors
- **Immersive** — entrance animation present
- **Production-grade** — no placeholder data, no fake counts

---

## 8. Dashboard UX Direction

Prioritize **operational awareness** + **information density without clutter**.

- **Multi-tenant switching** — instant. Tenant context visible but unobtrusive.
- **SEO Management** — `/seo` is a Command Center. Live statuses, green dots, quick Ping actions.
- **Blog Publishing** — editorial feed. Status badges + metadata + reading time.
- **Lead Intelligence** — live radar. Recent captures with high-contrast avatars + clickable rows that navigate to `/leads`.
- **Analytics** — deeply integrated. Custom area charts with gradient fills + real data. No mock arrays.
- **Range filters** — pill row at section top, re-fetches in parallel.

---

## 9. SEO Engine Visual Direction

`/seo` is the showcase page for operational realism.

- **Radial RadialBarChart gauge** with weighted overall score + grade letter (A-F) inside
- **InterpretationBadge** pill below gauge — color-graded (Excellent/Strong/Average/Weak/Critical)
- **5 CategoryBar** mini-gauges showing per-category 0-100 + weight badge + animated fill
- **8 OverviewTile** cells in 2×4 grid for telemetry
- **Score formula footer** showing weights + content caps explanation
- **InsightsPanel** 3-up: Score Interpretation, Dominant Strengths, Dominant Weaknesses
- **Critical Roster** rose-tinted card grid when blogs score <40
- **Per-tenant sitemap cards** with Open Sitemap, Regenerate, Ping Engines, Validate XML actions
- **CoverageBar** animated progress bars for 4 metadata coverage metrics
- **Filterable HealthList** — severity pills + category pills + sorted issue feed
- **Sortable ContentTable** with per-category sub-scores + grade letter

---

## 10. Public Landing Page Style

### Hero patterns
- Massive headline (4-5rem on desktop) with **gradient text accent** on the dominant verb/noun
- Underline glow effect beneath the accented word
- Pill above headline with live pulse indicator
- Dual CTA (primary gradient button + secondary glass button)
- 4 supporting points in 2×2 grid
- Floating telemetry panels (right side) with parallax
- Trust strip footer with 4 micro-signals (uptime, compliance, etc.)

### Section pacing
- `EditorialSection` enforces consistent caption + headline + subtitle pattern
- `py-24 md:py-32` vertical rhythm
- Max-width 7xl (admin) or content-driven (public)

### Module cards
- Always-visible feature lists (not hover-only)
- Icon + color accent per category
- Hover halo + lift + arrow drift

### Contact form
- Two-column: intro panels (left) + form (right, 7-col span)
- Pill-style picker for team size + ticket volume (Tickets) or team size (HRMS)
- Success state covers form with emerald checkmark animation
- Server-side analytics emission guarantees lead/event parity

---

## 11. Mobile Responsiveness Philosophy

- **Mobile-first Tailwind classes** — `text-base md:text-lg`, `grid-cols-1 lg:grid-cols-12`
- **Touch-friendly hit targets** — min 44px
- **Sidebar collapses to overlay drawer** on `<lg`
- **Public site sections stack vertically** on mobile, asymmetric on `lg+`
- **Hero parallax disabled** for `prefers-reduced-motion`
- **Tables horizontal-scroll** on narrow viewports (admin)

---

## 12. Competitive Inspiration (Reference, Don't Clone)

UI/UX polish + interaction quality benchmarks:
- **Linear** — keyboard-first, dark mode mastery, typography
- **Vercel** — clean dashboards, perfect spacing, command centers
- **Raycast** — speed, command-bar UX
- **Arc Browser** — translucency, non-traditional layouts
- **Stripe** — data visualization, microinteractions
- **Notion** — typography, empty states
- **Supabase** — developer-centric beautiful dark mode
- **Ahrefs / Semrush / SurferSEO / RankMath / Yoast** — SEO scoring trustworthiness
- **Sci-Fi UI** — cinematic lighting, HUD-style data density

**Critical: do not directly clone these products.** Use them purely as benchmarks for interaction quality, spacing, and polish.

---

## 13. Technical Stack Alignment

All future UI implementation MUST strictly adhere to:

- **React 18 (Vite)**
- **TailwindCSS 3** with CSS-variable token system
- **shadcn/ui** as base primitive layer
- **Framer Motion** for all complex animations + layout transitions
- **Lucide React** for all iconography
- **Recharts** for data visualization

Architecture:
- Maintain modularity + reusable design systems
- No hardcoded colors in components (use `bg-card`, `text-foreground`, etc.)
- No giant files — split when a component exceeds ~400 LOC
- Build new primitives when a pattern appears 3 times

---

## 14. Theme System Implementation

Single CSS-variable token system in `client/src/index.css`:

**Tokens defined twice:**
- `:root` → light pastel values
- `.dark` → graphite values (preserved exactly from v1)

**Critical tokens:**
```
--background, --foreground, --card, --card-foreground
--popover, --popover-foreground
--primary, --primary-foreground
--secondary, --muted, --accent, --destructive
--border, --input, --ring
--sidebar-background, --sidebar-foreground, --sidebar-accent, --sidebar-border
--surface-0 through --surface-3 (layered backdrops)
--glass-bg, --glass-border, --glass-hover (with --glass-elevated-* variants)
--shadow-card, --shadow-elevated, --shadow-overlay
--topbar-bg, --topbar-border
--glow-violet, --glow-cyan, --glow-emerald, --glow-amber, --glow-rose
```

**Light-mode utility repaint** in `:where(html:not(.dark))` selector:
- `[class*="text-white"]` mapped to `hsl(var(--foreground))` with graduated opacity
- `[class*="bg-white/[0.0X]"]` mapped to lavender washes
- `[class*="border-white/[0.0X]"]` mapped to slate-lavender borders
- Pale neon accents (`text-violet-300`, `text-cyan-400`, etc.) mapped to richer light-mode equivalents

This means dark-only utility classes stay legible in light mode without per-component rewrites.

---

## 15. Explicit AI Design Instructions

When generating UI code for Mavro, you MUST:

1. **Prioritize originality.** No generic Tailwind admin templates.
2. **Maintain premium hierarchy.** Spacing, typography scale, negative space.
3. **Preserve the Command-Center feel.** `GlassCard` / `GlassSurface` for new pages.
4. **Build asymmetrically.** Avoid 4 equal-sized cards in a row. Use spans (`col-span-8` + `col-span-4`).
5. **Optimize for the long term.** Build reusable encapsulated components.
6. **Reject CRUD aesthetics.** Build `ActivityRail` or layered feeds, not bare HTML tables.
7. **No fake data.** Every metric must derive from real analysis or be removed.
8. **Theme-aware always.** Use `bg-card`, `text-foreground`, never hardcoded color tokens.
9. **Per-tenant accents.** HRMS = violet, Tickets = cyan/teal — match the tenant's branding.
10. **Preserve motion budget.** Add motion that serves context; remove decoration.

---

## 16. UI Anti-Patterns to Reject

- ❌ Hardcoded HSL values in components (use tokens)
- ❌ `text-slate-500 dark:text-slate-400` style theme-aware text (use `text-muted-foreground`)
- ❌ Inline `style={{ color: '#7c3aed' }}` (use accent classes or tenant branding fields)
- ❌ Stock SaaS illustrations or generic icons
- ❌ Bootstrap-style flat tables with stripes
- ❌ Equal-sized 4-card grids that fill the viewport
- ❌ Motion on every element (use motion budget intentionally)
- ❌ Empty states without an icon + helpful action
- ❌ Loading states that show blank space (use skeletons or spinners with brand color)
- ❌ Forms that look like Google Forms

---

## 17. Patterns to Preserve

When upgrading existing pages:
- Preserve the existing `GlassCard` / `GlassPanel` shell
- Preserve `MetricOrb` for headline numbers
- Preserve range filter pill rows on Dashboard + SEO Engine
- Preserve the tenant-accent strip pattern on website cards
- Preserve the sticky scroll-aware navbar pattern on public sites
- Preserve scroll-driven parallax on hero sections

---

*This document is the source of truth for Mavro's frontend identity. Read it. Internalize it. Build it.*
</content>
</invoke>