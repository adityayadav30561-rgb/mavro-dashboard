import { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import toast from 'react-hot-toast';
import { createLead } from '../../api/leads';
import { MANUAL_CHANNELS, LEAD_TYPES, CHANNEL } from '@/lib/leadMeta';

// Manual lead entry — LinkedIn, referrals, walk-ins, phone enquiries.
//
// `mailStatus` defaults to 'not_sent' because a lead you are typing in now has
// not been emailed by definition. The 'unknown' option exists for backfilling
// rows off the old spreadsheet, where nobody recorded whether mail went out;
// those are excluded from the follow-up sequence until someone confirms.
const EMPTY = {
  name: '', email: '', phone: '', company: '', jobTitle: '', city: '',
  channel: 'linkedin', leadType: 'corporate',
  mailStatus: 'not_sent', requirement: '', sourceUrl: '', estimatedValue: '',
};

export default function AddLeadModal({ open, onClose, websites, onCreated }) {
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  // Default to the only tenant when there is just one, so the common case is
  // one less decision.
  useEffect(() => {
    if (open) setForm({ ...EMPTY, website: websites?.length === 1 ? websites[0]._id : '' });
  }, [open, websites]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.website) { toast.error('Pick which website this lead belongs to'); return; }
    if (!form.name.trim() || !form.email.trim()) { toast.error('Name and email are required'); return; }
    setSaving(true);
    try {
      const payload = { ...form };
      // Empty strings would fail the numeric/date validators server-side.
      if (payload.estimatedValue === '') delete payload.estimatedValue;
      else payload.estimatedValue = Number(payload.estimatedValue);
      const res = await createLead(payload);
      toast.success('Lead added');
      onCreated?.(res.data.data.lead);
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not add lead');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Add Lead" size="lg">
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Name *" value={form.name} onChange={set('name')} placeholder="Amandeep Kaur" required />
          <Field label="Email *" type="email" value={form.email} onChange={set('email')} placeholder="name@company.com" required />
          <Field label="Phone" value={form.phone} onChange={set('phone')} placeholder="+91 98XXXXXXXX" />
          <Field label="Company" value={form.company} onChange={set('company')} placeholder="Antier Solutions" />
          <Field label="Job title" value={form.jobTitle} onChange={set('jobTitle')} placeholder="HR Head" />
          <Field label="City" value={form.city} onChange={set('city')} placeholder="Chandigarh" />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Select label="Website *" value={form.website || ''} onChange={set('website')}>
            <option value="">Select…</option>
            {(websites || []).map((w) => <option key={w._id} value={w._id}>{w.name}</option>)}
          </Select>
          <Select label="Source" value={form.channel} onChange={set('channel')}>
            {MANUAL_CHANNELS.map((c) => <option key={c} value={c}>{CHANNEL[c]?.label || c}</option>)}
          </Select>
          <Select label="Type" value={form.leadType} onChange={set('leadType')}>
            {LEAD_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </Select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Select label="Email history" value={form.mailStatus} onChange={set('mailStatus')}>
            <option value="not_sent">Not emailed yet</option>
            <option value="sent">Already emailed</option>
            <option value="unknown">Unknown — needs checking</option>
          </Select>
          <Field label="Estimated value (₹)" type="number" value={form.estimatedValue} onChange={set('estimatedValue')} placeholder="150000" />
        </div>

        <div>
          <Label>Requirement</Label>
          <textarea
            rows={3}
            value={form.requirement}
            onChange={set('requirement')}
            maxLength={2000}
            placeholder="What are they looking for? Modules, scale, timeline…"
            className="input-field mt-1 resize-y"
          />
        </div>

        <Field label="Source URL" value={form.sourceUrl} onChange={set('sourceUrl')} placeholder="https://www.linkedin.com/posts/…" />

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={saving} className="btn-primary disabled:opacity-60">
            {saving ? 'Adding…' : 'Add Lead'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

const Label = ({ children }) => (
  <span className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">{children}</span>
);

function Field({ label, ...props }) {
  return (
    <label className="block">
      <Label>{label}</Label>
      <input className="input-field mt-1" {...props} />
    </label>
  );
}

function Select({ label, children, ...props }) {
  return (
    <label className="block">
      <Label>{label}</Label>
      <select className="input-field mt-1" {...props}>{children}</select>
    </label>
  );
}
