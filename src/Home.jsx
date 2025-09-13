// Mobile-optimized Home-only screen
import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Trophy, Coins, Zap, Target, Activity, Star, BarChart3, RotateCcw, Snowflake, Crown, Medal, Palette, Sun, Moon, Monitor,
  FileText, ChevronDown, ChevronRight, Search, CalendarClock, Clock, X,
  BadgeCheck, ClipboardList, Home as HomeIcon, Briefcase, Settings, Gift, ShoppingBag
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, ResponsiveContainer } from "recharts";
import { useTheme } from "./hooks/useTheme.js";
import { usePalette, cur, P } from "./hooks/usePalette.js";
import Bg from "./components/Bg.jsx";
import Apps from "./Apps.jsx";
import { Grey, PLATFORMS, STATUSES } from "./data.jsx";

/* HELPERS */
const xpl = (L) => Math.max(12, Math.round(20 + .82 * (L - 1)));
function lvl(x) { let l = 1, r = x; for (;;) { const n = xpl(l); if (r >= n) { r -= n; l++; if (l > 999) break; } else break; } return { l, rem: r, need: xpl(l) }; }
const last7 = (() => { const now = new Date(); return Array.from({ length: 7 }, (_, i) => { const d = new Date(now); d.setDate(d.getDate() - (6 - i)); return { day: d.toISOString().slice(5, 10), apps: Math.max(0, Math.round((Math.sin(i * 1.1) + 1) * 4 + (i % 3 === 0 ? 3 : 0))) } }) })();
const shadow = (t, l, d) => t === 'light' ? l : d;

/* MICRO UI */
function Pill({ icon, children, c, t }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-[12px] font-semibold"
      style={{ background: c.surface, border: `1px solid ${c.surfaceBorder}`, boxShadow: shadow(t, '0 8px 22px rgba(0,0,0,.12),0 2px 6px rgba(0,0,0,.06)', '0 10px 26px rgba(0,0,0,.45),0 2px 8px rgba(0,0,0,.25)') }}>
      {icon}{children}
    </span>
  );
}
function IconBtn({ onClick, children, c, t, aria }) {
  return (
    <button onClick={onClick} aria-label={aria} className="grid place-items-center rounded-xl"
      style={{ width: 38, height: 38, background: c.surface, border: `1px solid ${c.surfaceBorder}`, boxShadow: shadow(t, '0 14px 38px rgba(0,0,0,.12),0 3px 10px rgba(0,0,0,.06)', '0 18px 50px rgba(0,0,0,.46),0 4px 12px rgba(0,0,0,.32)') }}>
      {children}
    </button>
  );
}
function Bar({ v, m, from, to, c }) {
  const p = m ? Math.min(100, (v / m) * 100) : 0;
  return (
    <div role="progressbar" aria-valuemin={0} aria-valuemax={m} aria-valuenow={Math.round(v)}>
      <div className="h-3 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,.08)', border: `1px solid ${c.surfaceBorder}` }}>
        <motion.div initial={{ width: 0 }} animate={{ width: `${Math.max(8, p)}%` }} transition={{ duration: .6, ease: "easeOut" }} style={{ background: `linear-gradient(90deg, ${from}, ${to})`, height: '100%' }} />
      </div>
    </div>
  );
}
function Gold({ children }) {
  return (
    <span className="relative inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-[12px] font-extrabold"
      style={{ color: '#1f2937', background: 'linear-gradient(135deg,#fde68a,#f59e0b)', border: '1px solid rgba(0,0,0,.08)', boxShadow: '0 8px 24px rgba(245,158,11,.45),0 2px 8px rgba(0,0,0,.08)' }}>
      <Coins className="w-4 h-4" />{children}
      <span className="pointer-events-none absolute inset-0 rounded-full overflow-hidden">
        <span className="absolute -left-full top-0 h-full w-1/2" style={{ background: 'linear-gradient(90deg, rgba(255,255,255,.0), rgba(255,255,255,.5), rgba(255,255,255,0))', transform: 'skewX(-20deg)', animation: 'goldShine 2.4s infinite' }} />
      </span>
    </span>
  );
}
function Tip({ active, payload, label, c, t }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: t === 'light' ? 'rgba(255,255,255,.78)' : 'rgba(12,16,24,.78)', border: `1px solid ${c.surfaceBorder}`, color: c.text, borderRadius: 12, padding: '6px 10px', boxShadow: '0 10px 30px rgba(0,0,0,.18)' }}>
      <div style={{ fontSize: 12, opacity: .9 }}>{label}</div>
      <div style={{ fontSize: 14, marginTop: 2 }}>{payload[0].value} apps</div>
    </div>
  );
}
const Panel = ({ c, eff, children }) => (
  <section className="rounded-2xl p-5" style={{ background: c.surface, border: `1px solid ${c.surfaceBorder}`, boxShadow: shadow(eff, '0 14px 38px rgba(0,0,0,.12),0 3px 8px rgba(0,0,0,.06)', '0 16px 44px rgba(0,0,0,.46),0 3px 10px rgba(0,0,0,.30)') }}>
    {children}
  </section>
);
const Header = ({ mode, eff, c, cycle, cyclePal, palName, gold }) => (
  <header className="flex items-center justify-between">
    <div className="flex items-center gap-2">
      <IconBtn onClick={cycle} c={c} t={eff} aria="Cycle theme">{mode === 'light' ? <Sun className="w-5 h-5" /> : mode === 'dark' ? <Moon className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}</IconBtn>
      <button onClick={cyclePal} aria-label="Cycle palette" className="flex items-center gap-2 rounded-xl px-3 h-9"
        style={{ background: c.surface, border: `1px solid ${c.surfaceBorder}`, boxShadow: shadow(eff, '0 14px 38px rgba(0,0,0,.12),0 3px 10px rgba(0,0,0,.06)', '0 18px 50px rgba(0,0,0,.46),0 4px 12px rgba(0,0,0,.32)') }}>
        <Palette className="w-5 h-5" /><span className="text-sm font-semibold">{palName}</span>
      </button>
    </div>
    <div className="flex items-center gap-2" aria-live="polite">
      <Pill t={eff} c={c} icon={<Snowflake className="w-4 h-4" />}>2</Pill>
      <Pill t={eff} c={c} icon={<RotateCcw className="w-4 h-4" />}>1</Pill>
      <Gold>{gold}</Gold>
    </div>
  </header>
);

/* SHEET */
const Sheet = ({ open, onClose, title, c, t, children, footer }) => {
  useEffect(() => {
    function onKey(e){ if(e.key === 'Escape') onClose?.(); }
    if (open) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60]" style={{ background: t==='light'? 'rgba(0,0,0,.25)':'rgba(0,0,0,.55)', backdropFilter: 'blur(2px)' }}>
      <div className="absolute inset-x-0 bottom-0 rounded-t-2xl p-4" style={{ background: c.surface, borderTop: `1px solid ${c.surfaceBorder}` }}>
        <div className="w-full grid place-items-center">
          <div style={{ width: 40, height: 4, borderRadius: 999, background: 'rgba(148,163,184,.35)' }} />
        </div>
        <div className="flex items-center justify-between pb-2 mt-2">
          <div className="font-semibold text-sm">{title}</div>
          <button onClick={onClose} className="rounded-md px-2 py-1" style={{ background: c.chipBg }}><X className="w-4 h-4"/></button>
        </div>
        <div className="max-h-[56vh] overflow-y-auto pr-1">{children}</div>
        {footer && <div className="pt-3">{footer}</div>}
      </div>
    </div>
  );
};

function PlatformSelect({ value, onChange, c, t }){
  const [open,setOpen]=useState(false);
  const [q,setQ]=useState("");
  const filtered = PLATFORMS.filter(p=>p.toLowerCase().includes(q.toLowerCase()));
  const choose=(p)=>{ onChange(p); setOpen(false); };
  return (
    <div>
      <div className="text-[12px] mb-1" style={{ color: Grey }}>Platform</div>
      <button onClick={()=>setOpen(true)} className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[13px]"
        style={{ background: c.chipBg, border: `1px solid ${c.surfaceBorder}`, color: c.text }}>
        <span className="truncate flex-1">{value}</span>
        <ChevronDown className="w-4 h-4"/>
      </button>

      <Sheet open={open} onClose={()=>setOpen(false)} title="Choose platform" c={c} t={t}>
        <div style={{ position:'sticky', top:0, background: c.surface }} className="pb-2">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4"/>
            <input placeholder="Search" value={q} onChange={e=>setQ(e.target.value)}
              className="flex-1 px-3 py-2 rounded-xl text-[13px]" style={{ background: c.chipBg, border: `1px solid ${c.surfaceBorder}`, color: c.text }}/>
          </div>
        </div>
        <div className="grid gap-2 pt-2">
          {filtered.map(p=>{
            const active = p===value;
            const hint = p==='Company website' ? 'Direct' : 'Job board';
            return (
              <button key={p} onClick={()=>choose(p)} className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[13px] text-left"
                style={{ background: active? `linear-gradient(90deg, ${c.sky}, ${c.emerald})` : c.chipBg, border: active? `1px solid ${c.surfaceBorder}`: `1px solid ${c.surfaceBorder}`, color: active? '#0f172a' : c.text }}>
                <div className="flex-1 min-w-0">
                  <div className="truncate font-medium">{p}</div>
                  <div className="text-[11px] opacity-70">{hint}</div>
                </div>
                {active ? <BadgeCheck className="w-4 h-4"/> : <ChevronRight className="w-4 h-4"/>}
              </button>
            );
          })}
          {filtered.length===0 && <div className="text-[12px] py-6 text-center" style={{ color: Grey }}>No results</div>}
        </div>
      </Sheet>
    </div>
  );
}

/* DATE/TIME SELECT */
function DateTimeSelect({ dateISO, timeHM, onChange, c, t }){
  const [open,setOpen]=useState(false);
  const d = new Date(dateISO || new Date().toISOString().slice(0,10));
  const [year,setYear]=useState(d.getFullYear());
  const [month,setMonth]=useState(d.getMonth()+1);
  const [day,setDay]=useState(d.getDate());
  const [hour,setHour]=useState(parseInt(timeHM?.slice(0,2) || new Date().toTimeString().slice(0,2)));
  const [minute,setMinute]=useState(parseInt(timeHM?.slice(3,5) || new Date().toTimeString().slice(3,5)));
  const years = [new Date().getFullYear()-1, new Date().getFullYear(), new Date().getFullYear()+1];
  const daysInMonth = (y,m)=> new Date(y,m,0).getDate();
  useEffect(()=>{ setDay(d=> Math.max(1, Math.min(d, daysInMonth(year,month)))); },[year,month]);

  const apply = ()=>{
    const isoDate = new Date(Date.UTC(year, month-1, day)).toISOString().slice(0,10);
    const hm = `${String(hour).padStart(2,'0')}:${String(minute).padStart(2,'0')}`;
    onChange({ date: isoDate, time: hm });
    setOpen(false);
  };
  const Field = ({label, value, icon}) => (
    <div>
      <div className="text-[12px] mb-1" style={{ color: Grey }}>{label}</div>
      <button onClick={()=>setOpen(true)} className="w-full px-3 py-2 rounded-xl text-[13px] flex items-center justify-between" style={{ background: c.chipBg, border: `1px solid ${c.surfaceBorder}`, color: c.text }}>
        <span>{value}</span>
        {icon}
      </button>
    </div>
  );
  return (
    <div className="grid grid-cols-2 gap-2">
      <Field label="Date" value={dateISO} icon={<CalendarClock className="w-4 h-4"/>} />
      <Field label="Time" value={timeHM} icon={<Clock className="w-4 h-4"/>} />

      <Sheet open={open} onClose={()=>setOpen(false)} title="Pick date & time" c={c} t={t} footer={
        <div className="flex justify-end gap-2">
          <button onClick={()=>setOpen(false)} className="px-3 py-2 rounded-xl text-[12px]" style={{ background: c.chipBg, border: `1px solid ${c.surfaceBorder}`, color: c.text }}>Cancel</button>
          <button onClick={apply} className="px-3 py-2 rounded-xl text-[12px] font-semibold" style={{ background: `linear-gradient(90deg, ${c.sky}, ${c.emerald})`, border: `1px solid ${c.surfaceBorder}`, color: '#0f172a' }}>Apply</button>
        </div>
      }>
        <div className="grid grid-cols-3 gap-2">
          <select value={year} onChange={e=>setYear(parseInt(e.target.value))} className="px-3 py-2 rounded-xl text-[13px]" style={{ background: c.chipBg, border: `1px solid ${c.surfaceBorder}`, color: c.text }}>
            {years.map(y=> <option key={y} value={y}>{y}</option>)}
          </select>
          <select value={month} onChange={e=>setMonth(parseInt(e.target.value))} className="px-3 py-2 rounded-xl text-[13px]" style={{ background: c.chipBg, border: `1px solid ${c.surfaceBorder}`, color: c.text }}>
            {Array.from({length:12},(_,i)=>i+1).map(m=> <option key={m} value={m}>{String(m).padStart(2,'0')}</option>)}
          </select>
          <select value={day} onChange={e=>setDay(parseInt(e.target.value))} className="px-3 py-2 rounded-xl text-[13px]" style={{ background: c.chipBg, border: `1px solid ${c.surfaceBorder}`, color: c.text }}>
            {Array.from({length:daysInMonth(year,month)},(_,i)=>i+1).map(d=> <option key={d} value={d}>{String(d).padStart(2,'0')}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-2 mt-2">
          <select value={hour} onChange={e=>setHour(parseInt(e.target.value))} className="px-3 py-2 rounded-xl text-[13px]" style={{ background: c.chipBg, border: `1px solid ${c.surfaceBorder}`, color: c.text }}>
            {Array.from({length:24},(_,i)=>i).map(h=> <option key={h} value={h}>{String(h).padStart(2,'0')}</option>)}
          </select>
          <select value={minute} onChange={e=>setMinute(parseInt(e.target.value))} className="px-3 py-2 rounded-xl text-[13px]" style={{ background: c.chipBg, border: `1px solid ${c.surfaceBorder}`, color: c.text }}>
            {Array.from({length:12},(_,i)=>i*5).map(m=> <option key={m} value={m}>{String(m).padStart(2,'0')}</option>)}
          </select>
        </div>
      </Sheet>
    </div>
  );
}

/* ICON TOGGLES */
const IconToggle = ({ aria, icon, label, checked, onChange, c }) => (
  <button type="button" aria-label={label} aria-pressed={checked} onClick={()=>onChange(!checked)}
    className="flex flex-col items-center justify-center gap-1 px-1 py-1 rounded-xl active:scale-95 transition"
    style={{ background: 'transparent' }}>
    <div className="grid place-items-center rounded-xl" style={{ width: 44, height: 44, background: checked ? `linear-gradient(90deg, ${c.sky}, ${c.emerald})` : 'transparent' }}>
      <span style={{ color: checked ? '#0f172a' : c.text }}>{icon}</span>
    </div>
    <span className="text-[11px] opacity-70" style={{ color: c.text }}>{label}</span>
  </button>
);

function StatusSelect({ value, onChange, c, t }){
  const [open,setOpen]=useState(false);
  const active = STATUSES.find(s=>s.key===value) || STATUSES[0];
  return (
    <div>
      <div className="text-[12px] mb-1" style={{ color: Grey }}>Status</div>
      <button onClick={()=>setOpen(true)} className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[13px]"
        style={{ background: c.chipBg, border: `1px solid ${c.surfaceBorder}`, color: c.text }}>
        {active.icon}
        <span className="truncate flex-1">{active.key}</span>
        <ChevronDown className="w-4 h-4"/>
      </button>
      <Sheet open={open} onClose={()=>setOpen(false)} title="Application status" c={c} t={t}>
        <div className="grid gap-2">
          {STATUSES.map(s=>{
            const is = s.key===value;
            return (
              <button key={s.key} onClick={()=>{ onChange(s.key); setOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[13px] text-left"
                style={{ background: is? `linear-gradient(90deg, ${c.rose}, ${c.amber})` : c.chipBg, border: `1px solid ${c.surfaceBorder}`, color: is? '#0f172a' : c.text }}>
                {s.icon}
                <div className="flex-1 min-w-0">
                  <div className="truncate font-medium">{s.key}</div>
                  <div className="text-[11px] opacity-70">{s.hint}</div>
                </div>
                {is ? <BadgeCheck className="w-4 h-4"/> : <ChevronRight className="w-4 h-4"/>}
              </button>
            );
          })}
        </div>
      </Sheet>
    </div>
  );
}

/* LOG APPLICATION MODAL */
function AppFormModal({ open, onClose, onSubmit, c, t, defaults, title = 'Log application', submitLabel = 'Add' }) {
  const [company, setCompany] = useState(defaults?.company || '');
  const [role, setRole] = useState(defaults?.role || '');
  const [type, setType] = useState(defaults?.type || 'Full');
  const [status, setStatus] = useState(defaults?.status || 'Applied');
  const [date, setDate] = useState(defaults?.date || new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState(defaults?.time || new Date().toTimeString().slice(0,5));
  const [note, setNote] = useState(defaults?.note || '');
  const [cvTailored, setCvTailored] = useState(!!defaults?.cvTailored);
  const [motivation, setMotivation] = useState(!!defaults?.motivation);
  const [favorite, setFavorite] = useState(!!defaults?.favorite);
  const [platform, setPlatform] = useState(defaults?.platform || 'Company website');

  const boxRef = useRef(null);
  useEffect(() => {
    function onKey(e){ if(e.key === 'Escape') onClose(); }
    if (open) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  useEffect(() => { if (open) setTimeout(() => boxRef.current?.focus(), 50); }, [open]);
  if (!open) return null;

  const Seg = ({v}) => (
    <button onClick={()=>setType(v)} className="flex-1 px-3 py-2 rounded-xl text-[12px] font-semibold"
      style={{ background: type === v ? `linear-gradient(90deg, ${c.sky}, ${c.emerald})` : 'transparent', border: `1px solid ${c.surfaceBorder}`, color: type === v ? '#0f172a' : c.text }}>
      {v}
    </button>
  );

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-50" style={{ background: t === 'light' ? "rgba(0,0,0,.24)" : "rgba(0,0,0,.45)" }}>
      <div ref={boxRef} tabIndex={-1} className="absolute inset-x-0 bottom-0 rounded-t-2xl p-4 outline-none" style={{ background: c.surface }}>
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-semibold" style={{ color: c.text }}>{title}</div>
          <button onClick={onClose} aria-label="Close" className="px-2 py-1 rounded-md" style={{ background: c.chipBg }}>×</button>
        </div>

        <div className="grid gap-3">
          <div className="grid gap-2">
            <label className="text-[12px]" style={{ color: Grey }}>Company
              <input value={company} onChange={e => setCompany(e.target.value)} className="w-full mt-1 px-3 py-3 rounded-xl text-[14px]" style={{ background: c.surface, border: `1px solid ${c.surfaceBorder}`, color: c.text }} placeholder="Acme Inc." />
            </label>
            <label className="text-[12px]" style={{ color: Grey }}>Role
              <input value={role} onChange={e => setRole(e.target.value)} className="w-full mt-1 px-3 py-3 rounded-xl text-[14px]" style={{ background: c.surface, border: `1px solid ${c.surfaceBorder}`, color: c.text }} placeholder="Data Analyst" />
            </label>
          </div>

          <div className="flex items-center gap-2">
            <Seg v="Full" />
            <Seg v="Easy" />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <StatusSelect value={status} onChange={setStatus} c={c} t={t} />
            <PlatformSelect value={platform} onChange={setPlatform} c={c} t={t} />
          </div>

          <DateTimeSelect dateISO={date} timeHM={time} onChange={({date, time})=>{ setDate(date); setTime(time); }} c={c} t={t} />

          <textarea value={note} onChange={e => setNote(e.target.value)} rows={3} placeholder="Notes (optional)"
            className="w-full px-3 py-3 rounded-xl text-[13px]" style={{ background: c.surface, border: `1px solid ${c.surfaceBorder}`, color: c.text }} />

          <div className="grid grid-cols-3 gap-1">
            <IconToggle aria="CV tailored" label="CV" checked={cvTailored} onChange={setCvTailored} c={c} icon={<ClipboardList className="w-5 h-5"/>} />
            <IconToggle aria="Motivation letter" label="Letter" checked={motivation} onChange={setMotivation} c={c} icon={<FileText className="w-5 h-5"/>} />
            <IconToggle aria="Favorite" label="Fav" checked={favorite} onChange={setFavorite} c={c} icon={<Star className="w-5 h-5"/>} />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onClose} className="px-3 py-3 rounded-xl text-[13px]" style={{ background: c.chipBg, color: c.text }}>Cancel</button>
          <button onClick={() => {
            if (!company || !role) return;
            const iso = new Date(`${date}T${time}:00`).toISOString();
            onSubmit({ company, role, type, status, date: iso, note, cvTailored, motivation, favorite, platform });
          }} className="px-3 py-3 rounded-xl text-[13px] font-semibold"
            style={{ background: `linear-gradient(90deg, ${c.sky}, ${c.emerald})`, color: '#0f172a' }}>{submitLabel}</button>
        </div>
      </div>
    </div>
  );
}

/* APP */
export default function App() {
  const { mode, eff, cycle } = useTheme();
  const { key, cycle: cyclePal, pal } = usePalette();
  const c = cur(eff, pal);

  const [xp, setXp] = useState(520);
  const [apps, setApps] = useState(48);
  const [weighted, setWeighted] = useState(46.5);
  const [gold, setGold] = useState(260);
  const { l, rem, need } = useMemo(() => lvl(xp), [xp]);
  const step = 25, into = weighted % step;

  const [applications, setApplications] = useState([]);
  function addApplication(fields) {
    const id = Math.random().toString(36).slice(2, 9);
    const app = { id, ...fields };
    setApplications(list => [app, ...list]);
    const full = fields.type === 'Full';
    const g = full ? 26 : 12;
    setApps(a => a + 1);
    setWeighted(w => w + (full ? 1 : .5));
    setXp(x => x + g);
    setGold(v => v + (full ? 10 : 5));
  }

  function actApp(full) {
    const now = new Date();
    addApplication({ company: 'New Company', role: full ? 'Frontend Engineer' : 'Easy Apply', type: full ? 'Full' : 'Easy', status: 'Applied', date: now.toISOString(), note: '', cvTailored: false, motivation: false, favorite: false, platform: 'Company website' });
  }
  const actSkill = () => { setXp(x => x + 14); setGold(g => g + 3); };
  const actInterview = () => { setXp(x => x + 18); setGold(g => g + 4); };

  const [showForm, setShowForm] = useState(false);
  const [tab, setTab] = useState('Home');
  // Apps tab state and helpers
  const [editingApp, setEditingApp] = useState(null);

  const updateApplication = (id, fields) => {
    setApplications(list => list.map(a => a.id === id ? { ...a, ...fields } : a));
  };


  return (
    <div className="relative" style={{ background: c.bg, color: c.text, minHeight: '100dvh' }}>
      <Bg t={eff} k={key} />
      <div style={{ height: 'max(env(safe-area-inset-top),10px)' }} />

      <div className="mx-auto px-5 pb-24 pt-4" style={{ maxWidth: 430, height: 'min(100dvh,932px)' }}>
        <Header mode={mode} eff={eff} c={c} cycle={cycle} cyclePal={cyclePal} palName={P[key].name} gold={gold} />
        <div style={{ height: 18 }} />

        {tab === 'Apps' && (
          <Apps applications={applications} c={c} eff={eff} onLog={() => setShowForm(true)} onEdit={setEditingApp} />
        )}
        {tab === 'Home' && (

          <>

        <Panel c={c} eff={eff}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Medal className="w-4 h-4" style={{ color: eff === 'dark' ? c.sky : c.emerald }} />
              <div className="text-lg font-extrabold">Level {l}</div>
            </div>
            <div className="flex items-center gap-1 text-xs" style={{ color: Grey }}>
              <BriefcaseIcon /> <b className="tabular-nums" style={{ color: c.text }}>{apps}</b>
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-center justify-between mb-1">
              <div className="text-xs flex items-center gap-1" style={{ color: Grey }}><Zap className="w-3.5 h-3.5" />XP to next</div>
              <div className="text-xs tabular-nums" style={{ color: Grey }}>{Math.floor(rem)} / {need}</div>
            </div>
            <Bar v={rem} m={need} from={c.rose} to={c.amber} c={c} />
          </div>
        </Panel>

        <div className="grid grid-cols-1 gap-4 mt-4">
          <Panel c={c} eff={eff}>
            <div className="flex items-center justify-between mb-1">
              <div className="text-xs flex items-center gap-1" style={{ color: Grey }}><Target className="w-3.5 h-3.5" />Milestone</div>
              <div className="text-xs tabular-nums" style={{ color: Grey }}>{into.toFixed(1)} / {step}</div>
            </div>
            <Bar v={into} m={step} from={c.sky} to={c.emerald} c={c} />
          </Panel>

          <Panel c={c} eff={eff}>
            <div className="text-xs mb-1 flex items-center gap-1" style={{ color: Grey }}><BarChart3 className="w-3.5 h-3.5" />Last 7 days</div>
            <div className="h-24 w-full rounded-2xl" style={{ background: 'rgba(255,255,255,.04)', border: `1px solid ${c.surfaceBorder}` }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={last7} margin={{ left: 0, right: 0, top: 6, bottom: 6 }}>
                  <defs>
                    <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={c.emerald} stopOpacity={0.7} />
                      <stop offset="100%" stopColor={c.sky} stopOpacity={0.15} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke={eff === 'light' ? 'rgba(0,0,0,.06)' : 'rgba(255,255,255,.10)'} vertical={false} />
                  <XAxis dataKey="day" tick={{ fill: Grey, fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis hide domain={[0, 'dataMax+2']} />
                  <RTooltip content={<Tip c={c} t={eff} />} />
                  <Area type="linear" dataKey="apps" stroke={c.emerald} strokeWidth={1.75} fill="url(#g)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-6">
          {[{ k: 'Log application', i: <Zap className="w-5 h-5" />, fn: () => setShowForm(true), hint: 'Open log form' },
            { k: 'Easy apply', i: <Activity className="w-5 h-5" />, fn: () => actApp(false), hint: 'Log easy apply (½)' },
            { k: 'Networking', i: <Star className="w-5 h-5" />, fn: () => { setGold(g => g + 8); }, hint: 'Add networking' },
            { k: 'Skill', i: <Trophy className="w-5 h-5" />, fn: () => actSkill(), hint: 'Add skill block' },
            { k: 'Interview', i: <Target className="w-5 h-5" />, fn: () => actInterview(), hint: 'Add interview prep' },
            { k: 'Prestige', i: <Crown className="w-5 h-5" />, fn: () => {}, hint: 'Prestige (requires Level 100)', dis: l < 100 }]
            .map(a => (
              <button key={a.k} onClick={() => { if (!a.dis) a.fn(); }} aria-disabled={a.dis}
                className="flex flex-col items-center gap-1.5 py-2 px-1 active:scale-95 transition text-[12px] font-medium"
                style={{ background: 'transparent', border: 'none', color: Grey, opacity: a.dis ? .55 : 1 }} aria-label={a.hint}>
                <span style={{ opacity: a.dis ? .6 : 1 }}>{a.i}</span>
                <div className="leading-tight text-center">{a.k}</div>
              </button>
            ))}
        </div>

        <p className="text-[11px] mt-6" style={{ color: Grey }}>Home-only build. Use “Log application” to open the minimal form.</p>
      </>
        )}
      <AppFormModal open={showForm} onClose={() => setShowForm(false)} onSubmit={(f) => { addApplication(f); setShowForm(false); }} c={c} t={eff} />
      <AppFormModal open={!!editingApp} onClose={()=>setEditingApp(null)} title="Edit application" submitLabel="Save"
        onSubmit={(f)=>{ if(editingApp){ updateApplication(editingApp.id, f); setEditingApp(null); } }}
        c={c} t={eff} defaults={editingApp || undefined} />
      </div>

      <nav className="fixed left-0 right-0" style={{ bottom: 0, background: eff === 'light' ? 'rgba(255,255,255,.72)' : 'rgba(10,14,20,.72)', backdropFilter: 'blur(10px)', borderTop: `1px solid ${c.surfaceBorder}` }}>
        <div className="mx-auto grid grid-cols-5 px-2" style={{ maxWidth: 430 }}>
          {[
            { k: 'Home', i: <HomeIcon className="w-6 h-6" /> },
            { k: 'Apps', i: <Briefcase className="w-6 h-6" /> },
            { k: 'Quests', i: <Target className="w-6 h-6" /> },
            { k: 'Rewards', i: <Gift className="w-6 h-6" />, b: (gold + apps) % 3 < 1 ? '1' : undefined },
            { k: 'Shop', i: <ShoppingBag className="w-6 h-6" /> },
          ].map((t) => (
            <motion.button key={t.k} onClick={() => setTab(t.k)}
              className="relative flex flex-col items-center gap-0.5 py-2 text-[11px]"
              animate={{ scale: tab === t.k ? 1.0 : 1.0 }} whileTap={{ scale: 0.96 }}
              style={{ color: tab === t.k ? c.text : Grey }} aria-label={t.k}>
              <span className="ico">{t.i}</span>
              <div className="leading-none">{t.k}</div>
              {tab === t.k && (
                <div className="absolute left-3 right-3 -bottom-[2px]" style={{ height: 2, borderRadius: 999, boxShadow: '0 0 12px rgba(0,0,0,.15)', background: `linear-gradient(90deg, ${c.sky}, ${c.emerald})` }} />
              )}
              <span className="glint" aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,.08), rgba(255,255,255,0))', transform: 'skewX(-18deg)', opacity: .7 }} />
              {t.b && (
                <span className="absolute -top-1.5 right-3 rounded-[14px] px-1.5 text-[11px] font-semibold shadow" style={{ background: '#f43f5e', color: '#0f172a', boxShadow: '0 6px 18px rgba(244,63,94,.45)' }} aria-label={`${t.b} rewards ready`}>{t.b}</span>
              )}
            </motion.button>
          ))}
        </div>
        <div style={{ height: 'env(safe-area-inset-bottom)' }} />
      </nav>
    </div>
  );
}

/* ICON */
const BriefcaseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="w-4 h-4">
    <path d="M10 6V4a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v2"/>
    <rect x="3" y="7" width="18" height="13" rx="2"/>
    <path d="M3 13h18"/>
  </svg>
);
