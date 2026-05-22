import { motion } from 'framer-motion';
import {
  FileText, BookOpen, Hash, Link2, Image as ImageIcon,
  AlertCircle, CheckCircle2, Info, Gauge,
} from 'lucide-react';
import { extractHeadings, extractImages, extractLinks } from '@/lib/seoReadability';
import { cn } from '@/lib/utils';

// ===================================
// Shared shell — collapsible operational card
// ===================================
function Card({ icon: Icon, title, accent = 'violet', children, score }) {
  const accentTone = {
    violet:  'text-violet-400',
    cyan:    'text-cyan-400',
    emerald: 'text-emerald-400',
    amber:   'text-amber-400',
    rose:    'text-rose-400',
  }[accent];

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-2xl bg-card/70 backdrop-blur-xl border border-border/70 overflow-hidden"
    >
      <div className="px-4 py-3 flex items-center gap-2 border-b border-border/60">
        <Icon size={13} className={accentTone} />
        <h3 className="text-[12px] font-bold tracking-tight">{title}</h3>
        {typeof score === 'number' && (
          <span className={cn('ml-auto text-[11px] font-mono font-bold tabular-nums', scoreTone(score))}>{score}</span>
        )}
      </div>
      <div className="p-4">{children}</div>
    </motion.div>
  );
}

function scoreTone(score) {
  if (score >= 90) return 'text-emerald-400';
  if (score >= 70) return 'text-cyan-400';
  if (score >= 50) return 'text-amber-400';
  return 'text-rose-400';
}

function Row({ label, value, tone = 'muted', icon }) {
  const Icon = icon;
  const toneClass = {
    emerald: 'text-emerald-400',
    cyan:    'text-cyan-400',
    amber:   'text-amber-400',
    rose:    'text-rose-400',
    muted:   'text-foreground/80',
  }[tone];
  return (
    <li className="flex items-center justify-between gap-3 py-1 text-[12px]">
      <span className="flex items-center gap-1.5 text-muted-foreground truncate">
        {Icon && <Icon size={10} className={toneClass} />}
        {label}
      </span>
      <span className={cn('font-mono font-semibold tabular-nums', toneClass)}>{value}</span>
    </li>
  );
}

function rangeTone(value, [min, max]) {
  if (value === 0 || value == null) return 'rose';
  if (value >= min && value <= max) return 'emerald';
  if (value < min) return 'amber';
  return 'amber';
}

// ===================================
// 1. Content Analysis card
// ===================================
export function ContentAnalysisCard({ blog, readability, subScores }) {
  return (
    <Card icon={FileText} title="Content" accent="violet" score={subScores.contentDepth}>
      <ul className="space-y-0.5">
        <Row label="Word count"        value={readability.wordCount}        tone={rangeTone(readability.wordCount, [700, 5000])} />
        <Row label="Paragraphs"        value={readability.paragraphCount}   tone={rangeTone(readability.paragraphCount, [4, 50])} />
        <Row label="Sentences"         value={readability.sentenceCount}    />
        <Row label="Long paragraphs"   value={readability.longParagraphCount} tone={readability.longParagraphCount === 0 ? 'emerald' : 'amber'} />
        <Row label="Lexical diversity" value={`${lexicalDiversity(blog.content)}%`} />
      </ul>
    </Card>
  );
}

function lexicalDiversity(html) {
  const plain = String(html || '').replace(/<[^>]+>/g, ' ').toLowerCase();
  const tokens = plain.match(/\b[a-z][a-z'-]{1,}\b/g) || [];
  if (tokens.length === 0) return 0;
  const unique = new Set(tokens).size;
  return Math.round((unique / tokens.length) * 100);
}

// ===================================
// 2. Structure card
// ===================================
export function StructureCard({ blog, readability, subScores }) {
  const html = blog.content || '';
  const headings = extractHeadings(html);
  const h1 = headings.filter((h) => h.level === 1).length;
  const h2 = headings.filter((h) => h.level === 2).length;
  const h3 = headings.filter((h) => h.level === 3).length;
  const ul = (html.match(/<ul[\s>]/gi) || []).length;
  const ol = (html.match(/<ol[\s>]/gi) || []).length;
  const tableCount = (html.match(/<table[\s>]/gi) || []).length;
  const fmt = (html.match(/<(strong|b|em|i|code|blockquote)[\s>]/gi) || []).length;

  return (
    <Card icon={Hash} title="Structure" accent="cyan" score={subScores.structure}>
      <ul className="space-y-0.5">
        <Row label="H1 tags"   value={h1} tone={h1 <= 1 ? 'emerald' : 'rose'} />
        <Row label="H2 tags"   value={h2} tone={h2 >= 3 ? 'emerald' : h2 > 0 ? 'amber' : 'rose'} />
        <Row label="H3 tags"   value={h3} tone={h3 > 0 ? 'emerald' : 'muted'} />
        <Row label="Bullet lists" value={ul + ol} tone={(ul + ol) > 0 ? 'emerald' : 'muted'} />
        <Row label="Tables"    value={tableCount} />
        <Row label="Formatting hits" value={fmt} tone={fmt > 0 ? 'emerald' : 'amber'} />
      </ul>
    </Card>
  );
}

// ===================================
// 3. Metadata card
// ===================================
export function MetadataAuditCard({ form, subScores }) {
  const titleLen = (form.seoTitle || '').length;
  const descLen = (form.seoDescription || '').length;

  return (
    <Card icon={BookOpen} title="Metadata" accent="emerald" score={subScores.metadata}>
      <ul className="space-y-0.5">
        <Row label={`SEO title (${titleLen})`} value={titleLen >= 30 && titleLen <= 70 ? '✓' : 'fix'} tone={titleLen >= 50 && titleLen <= 60 ? 'emerald' : titleLen >= 30 && titleLen <= 70 ? 'amber' : 'rose'} />
        <Row label={`Meta description (${descLen})`} value={descLen >= 80 && descLen <= 170 ? '✓' : 'fix'} tone={descLen >= 140 && descLen <= 160 ? 'emerald' : descLen >= 80 && descLen <= 170 ? 'amber' : 'rose'} />
        <Row label="Excerpt"        value={form.excerpt ? '✓' : '—'}        tone={form.excerpt ? 'emerald' : 'amber'} />
        <Row label="Featured image" value={form.featuredImage ? '✓' : '—'} tone={form.featuredImage ? 'emerald' : 'amber'} />
        <Row label="Canonical URL"  value={form.canonicalUrl ? '✓' : '—'}  tone={form.canonicalUrl ? 'emerald' : 'muted'} />
        <Row label="Keywords"       value={(form.keywords || '').split(',').filter(Boolean).length} tone={(form.keywords || '').split(',').filter(Boolean).length >= 3 ? 'emerald' : 'amber'} />
      </ul>
    </Card>
  );
}

// ===================================
// 4. Readability card
// ===================================
export function ReadabilityCard({ readability, subScores }) {
  return (
    <Card icon={Gauge} title="Readability" accent="amber" score={Math.round(subScores.readability)}>
      <ul className="space-y-0.5">
        <Row label="Flesch reading ease" value={readability.flesch} tone={readability.flesch >= 60 ? 'emerald' : readability.flesch >= 50 ? 'amber' : 'rose'} />
        <Row label="Avg sentence words"  value={readability.avgSentenceWords} tone={readability.avgSentenceWords > 0 && readability.avgSentenceWords <= 20 ? 'emerald' : readability.avgSentenceWords <= 25 ? 'amber' : 'rose'} />
        <Row label="Avg paragraph words" value={readability.avgParagraphWords} tone={readability.avgParagraphWords <= 100 ? 'emerald' : readability.avgParagraphWords <= 150 ? 'amber' : 'rose'} />
        <Row label="Passive voice"       value={`${readability.passivePct}%`} tone={readability.passivePct < 10 ? 'emerald' : readability.passivePct < 25 ? 'amber' : 'rose'} />
        <Row label="Transitions"         value={`${readability.transitionPct}%`} tone={readability.transitionPct >= 30 ? 'emerald' : 'amber'} />
        <Row label="Long sentences"      value={`${readability.longSentencePct}%`} tone={readability.longSentencePct < 25 ? 'emerald' : 'amber'} />
      </ul>
    </Card>
  );
}

// ===================================
// 5. Links card
// ===================================
export function LinkAuditCard({ blog }) {
  const { internal, external } = extractLinks(blog.content || '');
  return (
    <Card icon={Link2} title="Links" accent="cyan">
      <ul className="space-y-0.5">
        <Row label="Internal links" value={internal.length} tone={internal.length >= 1 ? 'emerald' : 'amber'} />
        <Row label="External links" value={external.length} tone={external.length >= 1 ? 'emerald' : 'muted'} />
        <Row label="Total"          value={internal.length + external.length} />
      </ul>
    </Card>
  );
}

// ===================================
// 6. Media card
// ===================================
export function MediaAuditCard({ blog, form }) {
  const images = extractImages(blog.content || '');
  const withAlt = images.filter((i) => i.alt).length;
  return (
    <Card icon={ImageIcon} title="Media" accent="rose">
      <ul className="space-y-0.5">
        <Row label="Featured image" value={form.featuredImage ? '✓' : '—'} tone={form.featuredImage ? 'emerald' : 'rose'} />
        <Row label="Inline images"  value={images.length} tone={images.length >= 2 ? 'emerald' : images.length >= 1 ? 'amber' : 'rose'} />
        <Row label="Alt text coverage" value={images.length ? `${withAlt}/${images.length}` : '0/0'} tone={images.length === 0 ? 'muted' : withAlt === images.length ? 'emerald' : 'rose'} />
      </ul>
    </Card>
  );
}

// ===================================
// 7. Issue feed — flatten audit issues
// ===================================
export function IssueFeed({ audit }) {
  const all = audit.issues
    .slice()
    .sort((a, b) => {
      const order = { critical: 0, warning: 1, notice: 2 };
      return order[a.severity] - order[b.severity];
    })
    .slice(0, 10);

  if (all.length === 0) {
    return (
      <Card icon={CheckCircle2} title="Issues" accent="emerald">
        <p className="text-[12px] text-emerald-400">No issues detected.</p>
      </Card>
    );
  }

  return (
    <Card icon={AlertCircle} title={`Issues (${audit.issues.length})`} accent="rose">
      <ul className="space-y-2 max-h-[280px] overflow-y-auto">
        {all.map((it, i) => {
          const Icon = it.severity === 'critical' ? AlertCircle : it.severity === 'warning' ? AlertCircle : Info;
          const tone = it.severity === 'critical' ? 'text-rose-400' : it.severity === 'warning' ? 'text-amber-400' : 'text-cyan-400';
          return (
            <li key={i} className="flex items-start gap-2">
              <Icon size={11} className={cn('mt-0.5 flex-shrink-0', tone)} />
              <div className="flex-1 min-w-0">
                <p className="text-[11.5px] font-medium leading-snug">{it.message}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5 leading-snug">{it.fix}</p>
              </div>
              <span className="text-[9px] font-mono text-rose-400/80 flex-shrink-0">−{it.penalty}</span>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
