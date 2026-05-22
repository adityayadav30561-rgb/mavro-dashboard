import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus } from 'lucide-react';
import EditorialSection from '@/components/hrms/EditorialSection';
import { cn } from '@/lib/utils';

const faqs = [
  { q: 'Does Mavro support multi-team operations?',         a: 'Yes. Workspace scoping isolates departments while shared dashboards keep cross-team visibility intact. Roles inherit across hierarchies.' },
  { q: 'Can SLA policies be configured per priority tier?', a: 'Yes. Response and resolution timers are policy-driven per P1–P4 (or custom tiers). Breach guards trigger configurable escalation chains.' },
  { q: 'Does it integrate with email, chat, and APIs?',     a: 'Yes. Tickets can be opened via email, web form, in-app chat, or REST API. Webhook actions trigger external systems on any state transition.' },
  { q: 'Is the audit trail tamper-resistant?',              a: 'Yes. Every transition is recorded with actor attribution. Logs are append-only, exportable, and reconstructable for incident review.' },
  { q: 'Can we link tickets to assets or services?',        a: 'Yes. Asset linking supports CMDB-style relationships. Tickets inherit asset tags and history flows back into the asset record.' },
];

function Item({ q, a, open, onClick, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className="border-b border-border/60 last:border-b-0"
    >
      <button onClick={onClick} className="w-full flex items-center justify-between gap-6 py-5 md:py-6 text-left group">
        <span className="text-base md:text-lg font-semibold tracking-tight group-hover:text-cyan-400 transition-colors">{q}</span>
        <span className={cn(
          'flex-shrink-0 w-9 h-9 rounded-full bg-foreground/[0.04] border border-border flex items-center justify-center transition-all duration-300',
          open && 'rotate-45 bg-cyan-500/15 border-cyan-500/50'
        )}>
          <Plus size={16} className={cn(open ? 'text-cyan-400' : 'text-muted-foreground')} />
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <p className="pb-6 pr-12 text-sm text-muted-foreground leading-relaxed">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function FaqSection() {
  const [openIdx, setOpenIdx] = useState(0);

  return (
    <EditorialSection
      caption="Common Questions"
      title="Frequently Asked"
      subtitle="Quick answers about how Mavro Ticket Management runs inside modern IT operations."
      containerClassName="max-w-4xl"
    >
      <div className="rounded-2xl bg-card/60 backdrop-blur-xl border border-border/70 px-6 md:px-10">
        {faqs.map((f, i) => (
          <Item key={i} index={i} q={f.q} a={f.a} open={openIdx === i} onClick={() => setOpenIdx(openIdx === i ? -1 : i)} />
        ))}
      </div>
    </EditorialSection>
  );
}

export { faqs as ticketsFaqs };
