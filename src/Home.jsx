// Mobile-optimized Home-only screen
import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Trophy, Coins, Zap, Target, Activity, Star, BarChart3, Crown, Medal, Palette, Sun, Moon, Monitor,
  FileText, ChevronDown, ChevronRight, Search, CalendarClock, Clock, X, Ghost, Brain, Flame, GraduationCap,
  BadgeCheck, ClipboardList, Home as HomeIcon, Briefcase, Settings, Gift, ShoppingBag
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, ResponsiveContainer } from "recharts";
import { useTheme } from "./hooks/useTheme.js";
import { usePalette, cur, P } from "./hooks/usePalette.js";
import Bg from "./components/Bg.jsx";
import Apps from "./Apps.jsx";
import Shop from "./Shop.jsx";
import Quests, { countUnclaimedQuests } from "./Quests.jsx";
import Rewards, { PLACEHOLDER_CHESTS } from "./Rewards.jsx";
import { Grey, PLATFORMS, STATUSES } from "./data.jsx";
import { xpl, lvl, last7, FOCUS_BASELINE, focusCost, computeRewards } from "./gameMechanics.js";

/* HELPERS */
const shadow = (t, l, d) => t === 'light' ? l : d;

/* MICRO UI */
function StatBadge({ icon, count, c, t }) {
  return (
    <span
      className="relative grid place-items-center rounded-xl"
      style={{
        width: 38,
        height: 38,
        background: c.surface,
        border: `1px solid ${c.surfaceBorder}`,
        boxShadow: shadow(
          t,
          '0 14px 38px rgba(0,0,0,.12),0 3px 10px rgba(0,0,0,.06)',
          '0 18px 50px rgba(0,0,0,.46),0 4px 12px rgba(0,0,0,.32)'
        )
      }}
    >
      {icon}
      <span
        className="absolute -top-1 -right-1 flex items-center justify-center min-w-[16px] h-[16px] px-1 rounded-xl text-[10px] font-semibold tabular-nums"
        style={{ background: c.surface, border: `1px solid ${c.surfaceBorder}`, color: c.text }}
      >
        {count}
      </span>
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
const Header = ({ mode, eff, c, cycle, cyclePal, palName, gold, skillPoints, streak }) => (
  <header className="flex items-center justify-between">
    <div className="flex items-center gap-2">
      <IconBtn onClick={cycle} c={c} t={eff} aria="Cycle theme">{mode === 'light' ? <Sun className="w-5 h-5" /> : mode === 'dark' ? <Moon className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}</IconBtn>
      <button onClick={cyclePal} aria-label="Cycle palette" className="flex items-center gap-2 rounded-xl px-3 h-9"
        style={{ background: c.surface, border: `1px solid ${c.surfaceBorder}`, boxShadow: shadow(eff, '0 14px 38px rgba(0,0,0,.12),0 3px 10px rgba(0,0,0,.06)', '0 18px 50px rgba(0,0,0,.46),0 4px 12px rgba(0,0,0,.32)') }}>
        <Palette className="w-5 h-5" /><span className="text-sm font-semibold">{palName}</span>
      </button>
    </div>
    <div className="flex items-center gap-2" aria-live="polite">
      <StatBadge t={eff} c={c} icon={<GraduationCap className="w-5 h-5" />} count={skillPoints} />
      <StatBadge t={eff} c={c} icon={<Flame className="w-5 h-5" />} count={streak} />
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
function AppFormModal({ open, onClose, onSubmit, c, t, defaults, title = 'Log application', submitLabel = 'Add', effects = [] }) {
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [countryInput, setCountryInput] = useState('');
  const [cityInput, setCityInput] = useState('');
  const [allCountries, setAllCountries] = useState([]);
  const [countryOptions, setCountryOptions] = useState([]);
  const [allCities, setAllCities] = useState([]);
  const [cityOptions, setCityOptions] = useState([]);
  const [type, setType] = useState('Full');
  const [status, setStatus] = useState('Applied');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState(new Date().toTimeString().slice(0,5));
  const [note, setNote] = useState('');
  const [cvTailored, setCvTailored] = useState(false);
  const [motivation, setMotivation] = useState(false);
  const [favorite, setFavorite] = useState(false);
  const [platform, setPlatform] = useState('Company website');

  useEffect(() => {
    if (open) {
      setCompany(defaults?.company || '');
      setRole(defaults?.role || '');
      const dc = defaults?.country || '';
      const dci = defaults?.city || '';
      setCountry(dc);
      setCountryInput(dc);
      setCity(dci);
      setCityInput(dci);
      setType(defaults?.type || 'Full');
      setStatus(defaults?.status || 'Applied');
      if (defaults?.date) {
        const d = new Date(defaults.date);
        const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
        setDate(local.toISOString().slice(0,10));
        setTime(local.toISOString().slice(11,16));
      } else {
        const now = new Date();
        setDate(now.toISOString().slice(0,10));
        setTime(now.toTimeString().slice(0,5));
      }
      setNote(defaults?.note || '');
      setCvTailored(!!defaults?.cvTailored);
      setMotivation(!!defaults?.motivation);
      setFavorite(!!defaults?.favorite);
      setPlatform(defaults?.platform || 'Company website');
    }
  }, [defaults, open]);

  useEffect(() => {
    if (open && !defaults) {
      fetch('https://ipapi.co/json/')
        .then(res => res.json())
        .then(data => {
          if (data.country_name) { setCountry(data.country_name); setCountryInput(data.country_name); }
          if (data.city) { setCity(data.city); setCityInput(data.city); }
        })
        .catch(() => {});
    }
  }, [open, defaults]);

  useEffect(() => {
    if (open && allCountries.length === 0) {
      fetch('https://restcountries.com/v3.1/all?fields=name')
        .then(res => res.json())
        .then(data => setAllCountries(data.map(c => c.name.common).sort()))
        .catch(() => {});
    }
  }, [open, allCountries.length]);

  useEffect(() => {
    if (country) {
      fetch('https://countriesnow.space/api/v0.1/countries/cities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ country })
      })
        .then(res => res.json())
        .then(res => Array.isArray(res.data) ? setAllCities(res.data) : setAllCities([]))
        .catch(() => setAllCities([]));
    } else {
      setAllCities([]);
      setCity('');
      setCityInput('');
    }
  }, [country]);

  const boxRef = useRef(null);
  useEffect(() => {
    function onKey(e){ if(e.key === 'Escape') onClose(); }
    if (open) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  useEffect(() => { if (open) setTimeout(() => boxRef.current?.focus(), 50); }, [open]);
  const { xp: xpReward, gold: goldReward, qs } = useMemo(
    () => computeRewards({ type, cvTailored, motivation }, { effects }),
    [type, cvTailored, motivation, effects]
  );
  const cost = useMemo(() => focusCost(type), [type]);
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
          <div className="flex items-center gap-2">
            <div className="text-sm font-semibold" style={{ color: c.text }}>{title}</div>
            <div className="flex items-center gap-2 text-[11px]" style={{ color: Grey }}>
              <span className="flex items-center gap-0.5"><BadgeCheck className="w-3 h-3" />{qs}</span>
              <span className="flex items-center gap-0.5"><Brain className="w-3 h-3" />-{cost}</span>
              <span className="flex items-center gap-0.5"><Zap className="w-3 h-3" />+{xpReward}</span>
              <span className="flex items-center gap-0.5"><Coins className="w-3 h-3" />+{goldReward}</span>
            </div>
          </div>
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

           <div className="grid grid-cols-2 gap-2">
             <label className="text-[12px]" style={{ color: Grey }}>Country
               <div className="relative">
                 <input
                   value={countryInput}
                   onChange={e => {
                     const v = e.target.value;
                     setCountryInput(v);
                     setCountry('');
                     if (v.length >= 2) {
                       setCountryOptions(allCountries.filter(cn => cn.toLowerCase().includes(v.toLowerCase())));
                     } else {
                       setCountryOptions([]);
                     }
                   }}
                   autoComplete="off"
                   className="w-full mt-1 px-3 py-3 rounded-xl text-[14px]"
                   style={{ background: c.surface, border: `1px solid ${c.surfaceBorder}`, color: c.text }}
                   placeholder="USA"
                 />
                 {countryOptions.length > 0 && (
                   <ul className="absolute left-0 right-0 mt-1 max-h-40 overflow-auto rounded-xl"
                     style={{ background: c.surface, border: `1px solid ${c.surfaceBorder}` }}>
                     {countryOptions.map(opt => (
                       <li key={opt}>
                         <button
                           type="button"
                           onMouseDown={() => { setCountry(opt); setCountryInput(opt); setCountryOptions([]); }}
                           className="w-full text-left px-3 py-2 text-[13px]"
                           style={{ color: c.text }}
                         >{opt}</button>
                       </li>
                     ))}
                   </ul>
                 )}
               </div>
             </label>
             <label className="text-[12px]" style={{ color: Grey }}>City
               <div className="relative">
                 <input
                   value={cityInput}
                   onChange={e => {
                     const v = e.target.value;
                     setCityInput(v);
                     setCity('');
                     if (country && v.length >= 1) {
                       setCityOptions(allCities.filter(ct => ct.toLowerCase().includes(v.toLowerCase())));
                     } else {
                       setCityOptions([]);
                     }
                   }}
                   disabled={!country}
                   autoComplete="off"
                   className="w-full mt-1 px-3 py-3 rounded-xl text-[14px]"
                   style={{ background: c.surface, border: `1px solid ${c.surfaceBorder}`, color: c.text }}
                   placeholder="New York"
                 />
                 {cityOptions.length > 0 && (
                   <ul className="absolute left-0 right-0 mt-1 max-h-40 overflow-auto rounded-xl"
                     style={{ background: c.surface, border: `1px solid ${c.surfaceBorder}` }}>
                     {cityOptions.map(opt => (
                       <li key={opt}>
                         <button
                           type="button"
                           onMouseDown={() => { setCity(opt); setCityInput(opt); setCityOptions([]); }}
                           className="w-full text-left px-3 py-2 text-[13px]"
                           style={{ color: c.text }}
                         >{opt}</button>
                       </li>
                     ))}
                   </ul>
                 )}
               </div>
             </label>
           </div>

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
            if (countryInput && !country) { alert('Please choose a country from the list'); return; }
            if (cityInput && !city) { alert('Please choose a city from the list'); return; }
            const iso = new Date(`${date}T${time}:00`).toISOString();
            onSubmit({ company, role, country, city, type, status, date: iso, note, cvTailored, motivation, favorite, platform });
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
  const [skillPoints, setSkillPoints] = useState(0);
  const [streak, setStreak] = useState(0);
  const [activeEffects, setActiveEffects] = useState([]);
  const [focus, setFocus] = useState(FOCUS_BASELINE);
  const [chests, setChests] = useState(PLACEHOLDER_CHESTS);
  const [claimedQuests, setClaimedQuests] = useState(new Set());
  const unclaimedQuests = useMemo(
    () => countUnclaimedQuests(claimedQuests),
    [claimedQuests]
  );
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    const saved = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('jh_focus') || 'null') : null;
    if (saved && saved.date === today) {
      setFocus(saved.value);
    } else {
      setFocus(FOCUS_BASELINE);
      if (typeof window !== 'undefined') {
        localStorage.setItem('jh_focus', JSON.stringify({ value: FOCUS_BASELINE, date: today }));
      }
    }
  }, []);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const today = new Date().toISOString().slice(0, 10);
    localStorage.setItem('jh_focus', JSON.stringify({ value: focus, date: today }));
  }, [focus]);
  useEffect(() => {
    const id = setInterval(() => {
      setActiveEffects((e) => e.filter((fx) => !fx.expiresAt || fx.expiresAt > Date.now()));
    }, 1000);
    return () => clearInterval(id);
  }, []);
  const { l, rem, need } = useMemo(() => lvl(xp), [xp]);
  const step = 25, into = weighted % step;

  function gainXp(base, applyBuff = true) {
    const multiplier = applyBuff && activeEffects.some((e) => e.id === 1 || e.id === 3) ? 2 : 1;
    setXp((x) => x + base * multiplier);
  }

  const [applications, setApplications] = useState([]);
  function addApplication(fields) {
    const cost = focusCost(fields.type);
    if (focus < cost) {
      alert('You are out of focus! Recharge to log more applications.');
      return false;
    }
    const id = Math.random().toString(36).slice(2, 9);
    const { xp: xpReward, gold: goldReward, qs, au } = computeRewards(fields, { effects: activeEffects });
    const app = { id, ...fields, qs };
    setApplications(list => [app, ...list]);
    setApps(a => a + 1);
    setWeighted(w => w + au);
    gainXp(xpReward, false);
    setGold(v => v + goldReward);
    setFocus(f => Math.max(0, f - cost));
    return true;
  }

  function actApp(full) {
    const now = new Date();
    addApplication({ company: 'New Company', role: full ? 'Frontend Engineer' : 'Easy Apply', country: '', city: '', type: full ? 'Full' : 'Easy', status: 'Applied', date: now.toISOString(), note: '', cvTailored: false, motivation: false, favorite: false, platform: 'Company website' });
  }
  const actSkill = () => { gainXp(14); setGold(g => g + 3); };
  const actInterview = () => { gainXp(18); setGold(g => g + 4); };

  const [showForm, setShowForm] = useState(false);
  const [tab, setTab] = useState('Home');
  // Apps tab state and helpers
  const [editingApp, setEditingApp] = useState(null);

  const updateApplication = (id, fields) => {
    setApplications(list => {
      const prev = list.find(a => a.id === id);
      if (prev && fields.status === 'Ghosted' && prev.status !== 'Ghosted') {
        const expiresAt = Date.now() + 3600 * 1000;
        setActiveEffects(e => {
          const existing = e.find(fx => fx.id === 3);
          if (existing) {
            return e.map(fx => fx.id === 3 ? { ...fx, expiresAt } : fx);
          }
          return [...e, { id: 3, name: "Ghost's Revenge", icon: Ghost, description: "Double XP for 1 hour", expiresAt }];
        });
      }
      return list.map(a => a.id === id ? { ...a, ...fields } : a);
    });
  };

  const deleteApplication = (id) => {
    setApplications(list => list.filter(a => a.id !== id));
  };


  return (
    <div className="relative" style={{ background: c.bg, color: c.text, minHeight: '100dvh' }}>
      <Bg t={eff} k={key} />
      <div style={{ height: 'max(env(safe-area-inset-top),10px)' }} />

      <div className="mx-auto px-5 pb-24 pt-4" style={{ maxWidth: 430, height: 'min(100dvh,932px)' }}>
        <Header mode={mode} eff={eff} c={c} cycle={cycle} cyclePal={cyclePal} palName={P[key].name} gold={gold} skillPoints={skillPoints} streak={streak} />
        <div style={{ height: 18 }} />

        {tab === 'Apps' && (
          <Apps applications={applications} c={c} eff={eff} onLog={() => { if (focus < 0.25) alert('You are out of focus! Recharge to log more applications.'); else setShowForm(true); }} onEdit={setEditingApp} onDelete={deleteApplication} />
        )}
        {tab === 'Shop' && (
          <Shop c={c} eff={eff} gold={gold} setGold={setGold} effects={activeEffects} setEffects={setActiveEffects} />
        )}
        {tab === 'Quests' && (
          <Quests
            c={c}
            eff={eff}
            gainXp={gainXp}
            setGold={setGold}
            claimed={claimedQuests}
            setClaimed={setClaimedQuests}
          />
        )}
        {tab === 'Rewards' && (
          <Rewards c={c} eff={eff} gold={gold} setGold={setGold} gainXp={gainXp} chests={chests} setChests={setChests} />
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
          <div className="mt-3">
            <div className="flex items-center justify-between mb-1">
              <div className="text-xs flex items-center gap-1" style={{ color: Grey }}><Brain className="w-3.5 h-3.5" />Focus</div>
              <div className="text-xs tabular-nums" style={{ color: Grey }}>{focus.toFixed(1)} / {FOCUS_BASELINE}</div>
            </div>
            <Bar v={focus} m={FOCUS_BASELINE} from={c.lilac} to={c.sky} c={c} />
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
          {[{ k: 'Log application', i: <Zap className="w-5 h-5" />, fn: () => { if (focus < 0.25) alert('You are out of focus! Recharge to log more applications.'); else setShowForm(true); }, hint: 'Open log form' },
            { k: 'Easy apply', i: <Activity className="w-5 h-5" />, fn: () => actApp(false), hint: 'Log easy apply (½)' },
            { k: 'Networking', i: <Star className="w-5 h-5" />, fn: () => { setGold(g => g + 8); }, hint: 'Add networking' },
            { k: 'Skill', i: <Trophy className="w-5 h-5" />, fn: () => actSkill(), hint: 'Add skill block' },
            { k: 'Interview', i: <Target className="w-5 h-5" />, fn: () => actInterview(), hint: 'Add interview prep' },
            { k: 'Prestige', i: <Crown className="w-5 h-5" />, fn: () => {}, hint: 'Prestige (requires Level 100)', dis: l < 100 }]
            .map(a => (
              <motion.button
                key={a.k}
                onClick={() => {
                  if (!a.dis) a.fn();
                }}
                aria-disabled={a.dis}
                className="flex flex-col items-center gap-1.5 py-2 px-1 text-[12px] font-medium"
                style={{ background: 'transparent', border: 'none', color: Grey, opacity: a.dis ? .55 : 1 }}
                aria-label={a.hint}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                <span style={{ opacity: a.dis ? .6 : 1 }}>{a.i}</span>
                <div className="leading-tight text-center">{a.k}</div>
              </motion.button>
            ))}
        </div>

        <p className="text-[11px] mt-6" style={{ color: Grey }}>Home-only build. Use “Log application” to open the minimal form.</p>
      </>
        )}
      <AppFormModal open={showForm} onClose={() => setShowForm(false)} onSubmit={(f) => { if(addApplication(f)) setShowForm(false); }} c={c} t={eff} effects={activeEffects} />
      <AppFormModal open={!!editingApp} onClose={()=>setEditingApp(null)} title="Edit application" submitLabel="Save"
        onSubmit={(f)=>{ if(editingApp){ updateApplication(editingApp.id, f); setEditingApp(null); } }}
        c={c} t={eff} defaults={editingApp || undefined} effects={activeEffects} />
      </div>

      <nav className="fixed left-0 right-0" style={{ bottom: 0, background: eff === 'light' ? 'rgba(255,255,255,.72)' : 'rgba(10,14,20,.72)', backdropFilter: 'blur(10px)', borderTop: `1px solid ${c.surfaceBorder}` }}>
        <div className="mx-auto grid grid-cols-5 px-2" style={{ maxWidth: 430 }}>
          {[
            { k: 'Home', i: <HomeIcon className="w-6 h-6" /> },
            { k: 'Apps', i: <Briefcase className="w-6 h-6" /> },
            { k: 'Quests', i: <Target className="w-6 h-6" />, b: unclaimedQuests ? String(unclaimedQuests) : undefined },
            { k: 'Rewards', i: <Gift className="w-6 h-6" />, b: chests.length ? String(chests.length) : undefined },
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
                <span className="absolute -top-1.5 right-3 rounded-[14px] px-1.5 text-[11px] font-semibold shadow" style={{ background: '#f43f5e', color: '#fff', boxShadow: '0 6px 18px rgba(244,63,94,.45)' }} aria-label={`${t.b} rewards ready`}>{t.b}</span>
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
