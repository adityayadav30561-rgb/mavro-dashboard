import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, PlayCircle, Compass } from 'lucide-react';
import Section from './Section';
import { SPANBIX_BRAND } from '@/lib/spanbixSeo';
import { trackCtaClick } from '@/lib/analytics';

export default function FinalCta() {
  return (
    <Section
      id="final-cta"
      tone="navy"
      align="center"
      caption="Take The Next Step"
      title="30 minutes with a strategist. Then you decide."
      subtitle="Tell us your background — degree, geography, current role, target salary. We'll map the right SAP track, give you an honest placement timeline, and if Spanbix isn't the right fit we'll say so. No sales pressure, no upselling, no scripted scripts."
    >
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ duration: 0.55 }}
        className="flex flex-col sm:flex-row items-center justify-center gap-3 font-sora"
      >
        <Link
          to="/spanbix/contact"
          onClick={() => trackCtaClick('Book Consultation', { location: 'final-cta' })}
          className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-md text-[14.5px] font-semibold transition-all hover:brightness-110 shadow-[0_18px_40px_-12px_rgba(39,100,228,0.6)] w-full sm:w-auto"
          style={{ backgroundColor: SPANBIX_BRAND.accent, color: '#fff' }}
        >
          Book Consultation
          <ArrowRight size={15} />
        </Link>
        <Link
          to="/spanbix/career-paths"
          onClick={() => trackCtaClick('Explore Programs', { location: 'final-cta' })}
          className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-md text-[14.5px] font-semibold border border-white/20 text-white hover:bg-white/[0.06] hover:border-white/35 transition-all w-full sm:w-auto"
        >
          <Compass size={16} />
          Explore Programs
        </Link>
        <Link
          to="/spanbix/demo-classes"
          onClick={() => trackCtaClick('Join Demo Session', { location: 'final-cta' })}
          className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-md text-[14.5px] font-semibold text-white/85 hover:text-white transition-all w-full sm:w-auto"
        >
          <PlayCircle size={16} />
          Join Demo Session
        </Link>
      </motion.div>

      <p className="mt-8 text-center text-[12px] font-sora text-white/55">
        No sales pressure · Free consultation · 30-minute call with a career strategist
      </p>
    </Section>
  );
}
