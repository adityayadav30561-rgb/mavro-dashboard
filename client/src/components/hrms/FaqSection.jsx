import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus } from 'lucide-react';
import EditorialSection from './EditorialSection';
import { cn } from '@/lib/utils';

const faqs = [
  {
    q: 'Can Mavro HRMS support large organizations?',
    a: 'Yes. The platform is designed for scalable multi-department workforce operations with role-based access, audit trails, and tenant-aware architecture.',
  },
  {
    q: 'Does the platform support role-based access?',
    a: 'Yes. Permissions and access levels can be configured by role and department with granular policy controls.',
  },
  {
    q: 'Can employees access the system themselves?',
    a: 'Yes. Mavro HRMS includes a full employee self-service experience for documents, leaves, attendance, and profile management.',
  },
  {
    q: 'Does it support payroll workflows?',
    a: 'Yes. Payroll management, salary structures, statutory compliance, and reimbursements are integrated end-to-end.',
  },
  {
    q: 'Is the platform mobile friendly?',
    a: 'Yes. The experience is optimized for responsive and mobile usage, with native-feeling employee and manager interfaces.',
  },
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
      <button
        onClick={onClick}
        className="w-full flex items-center justify-between gap-6 py-5 md:py-6 text-left group"
      >
        <span className="text-base md:text-lg font-semibold tracking-tight group-hover:text-violet-400 transition-colors">{q}</span>
        <span
          className={cn(
            'flex-shrink-0 w-9 h-9 rounded-full bg-foreground/[0.04] border border-border flex items-center justify-center transition-all duration-300',
            open && 'rotate-45 bg-violet-500/15 border-violet-500/50'
          )}
        >
          <Plus size={16} className={cn(open ? 'text-violet-400' : 'text-muted-foreground')} />
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
      subtitle="Quick answers about how Mavro HRMS works inside modern organizations."
      containerClassName="max-w-4xl"
    >
      <div className="rounded-2xl bg-card/60 backdrop-blur-xl border border-border/70 px-6 md:px-10">
        {faqs.map((f, i) => (
          <Item
            key={i}
            index={i}
            q={f.q}
            a={f.a}
            open={openIdx === i}
            onClick={() => setOpenIdx(openIdx === i ? -1 : i)}
          />
        ))}
      </div>
    </EditorialSection>
  );
}
