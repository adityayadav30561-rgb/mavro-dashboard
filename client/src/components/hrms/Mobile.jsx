import { motion } from 'framer-motion';
import { Fingerprint, Check, Bell, FileText, Wallet, Activity } from 'lucide-react';
import EditorialSection from './EditorialSection';

const mobileFeatures = [
  { icon: Fingerprint, label: 'Mobile attendance', desc: 'Geo + biometric check-in' },
  { icon: Check,       label: 'Leave approvals',   desc: 'One-tap manager actions' },
  { icon: FileText,    label: 'Employee self-service', desc: 'Docs, profile, requests' },
  { icon: Bell,        label: 'Notifications',     desc: 'Push, in-app, email' },
  { icon: Wallet,      label: 'Payroll access',    desc: 'Payslips & tax docs' },
  { icon: Activity,    label: 'Real-time updates', desc: 'Live operational signal' },
];

export default function Mobile() {
  return (
    <EditorialSection
      caption="On-the-go Operations"
      title="HR Operations Anywhere"
      subtitle="Enable managers and employees to stay connected through a modern mobile-ready experience built for fast, contextual decisions."
    >
      <div className="grid lg:grid-cols-12 gap-12 items-center">
        {/* Phone mockup */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="lg:col-span-5 flex justify-center"
        >
          <div className="relative">
            {/* Ambient glow */}
            <div
              className="absolute -inset-20 blur-3xl"
              style={{ background: 'radial-gradient(closest-side, hsl(263 70% 60% / 0.3), transparent 70%)' }}
            />

            <div className="relative w-[280px] h-[560px] rounded-[44px] bg-gradient-to-b from-foreground/[0.05] to-foreground/[0.02] border border-border p-2.5 shadow-[0_50px_120px_-30px_hsl(263_70%_50%/0.5)]">
              {/* Notch */}
              <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-24 h-5 bg-foreground/95 rounded-full z-10" />

              <div className="w-full h-full rounded-[36px] bg-card overflow-hidden relative">
                {/* Inner UI mock */}
                <div className="absolute inset-0 bg-gradient-to-b from-violet-500/[0.06] via-transparent to-cyan-500/[0.04]" />

                <div className="relative p-5 pt-12">
                  <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">Today</p>
                  <h4 className="text-xl font-bold mt-1">Good morning</h4>
                  <p className="text-[11px] text-muted-foreground">Aarav · Engineering</p>

                  {/* Check-in card */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.4 }}
                    className="mt-5 rounded-2xl bg-gradient-to-br from-violet-500 to-violet-700 p-4 shadow-[0_20px_40px_-12px_hsl(263_70%_50%/0.6)]"
                  >
                    <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/70">Check-in</p>
                    <p className="text-2xl font-bold font-mono text-white mt-1">09:14 AM</p>
                    <div className="mt-3 flex items-center gap-2">
                      <Fingerprint size={14} className="text-white/80" />
                      <span className="text-[11px] text-white/80">Biometric verified</span>
                    </div>
                  </motion.div>

                  {/* Quick actions */}
                  <div className="mt-5 grid grid-cols-3 gap-2">
                    {['Leave', 'Payroll', 'Tasks'].map((t, i) => (
                      <motion.div
                        key={t}
                        initial={{ opacity: 0, y: 6 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.55 + i * 0.07 }}
                        className="aspect-square rounded-xl bg-foreground/[0.05] border border-border/60 flex flex-col items-center justify-center gap-1.5"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_hsl(160_70%_45%/0.7)]" />
                        <span className="text-[10px] font-medium">{t}</span>
                      </motion.div>
                    ))}
                  </div>

                  {/* Notifications */}
                  <div className="mt-5 space-y-2">
                    {[
                      { tone: 'bg-violet-500', label: 'Payroll cycle starts in 3 days' },
                      { tone: 'bg-cyan-500',   label: 'Leave approval pending (2)' },
                      { tone: 'bg-amber-500',  label: 'Shift swap request' },
                    ].map((n, i) => (
                      <motion.div
                        key={n.label}
                        initial={{ opacity: 0, x: 10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.7 + i * 0.07 }}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-foreground/[0.04] border border-border/60"
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${n.tone}`} />
                        <span className="text-[10px] text-muted-foreground flex-1 truncate">{n.label}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Feature grid */}
        <div className="lg:col-span-7 grid sm:grid-cols-2 gap-3">
          {mobileFeatures.map((f, i) => (
            <motion.div
              key={f.label}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.06 }}
              className="group p-5 rounded-xl bg-card/60 backdrop-blur-xl border border-border/70 hover:border-border hover:-translate-y-0.5 transition-all"
            >
              <div className="w-10 h-10 rounded-lg bg-violet-500/10 border border-violet-500/30 flex items-center justify-center mb-3">
                <f.icon size={16} className="text-violet-400" />
              </div>
              <p className="text-sm font-semibold">{f.label}</p>
              <p className="text-[12px] text-muted-foreground mt-0.5">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </EditorialSection>
  );
}
