import React, { useEffect, useMemo, useState } from "react";
import { Search, Filter, ArrowUpDown, MoreVertical, BadgeCheck, ChevronRight, X, FileText, Mail, Star } from "lucide-react";
import { Grey, STATUSES, PLATFORMS } from "./data.jsx";

const shadow = (t, l, d) => t === 'light' ? l : d;

function IconBtn({ onClick, children, c, t, aria }) {
  return (
    <button onClick={onClick} aria-label={aria} className="grid place-items-center rounded-xl"
      style={{ width: 38, height: 38, background: c.surface, border: `1px solid ${c.surfaceBorder}`, boxShadow: shadow(t, '0 14px 38px rgba(0,0,0,.12),0 3px 10px rgba(0,0,0,.06)', '0 18px 50px rgba(0,0,0,.46),0 4px 12px rgba(0,0,0,.32)') }}>
      {children}
    </button>
  );
}

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

export default function Apps({ applications, c, eff, onLog, onEdit }) {
  const [appsQuery, setAppsQuery] = useState("");
  const [filterStatuses, setFilterStatuses] = useState([]);
  const [filterPlatforms, setFilterPlatforms] = useState([]);
  const [sortKey, setSortKey] = useState('Newest');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);

  const appsView = useMemo(() => {
    let list = [...applications];
    const q = appsQuery.trim().toLowerCase();
    if (q) list = list.filter(a => `${a.company} ${a.role} ${a.platform}`.toLowerCase().includes(q));
    if (filterStatuses.length) list = list.filter(a => filterStatuses.includes(a.status));
    if (filterPlatforms.length) list = list.filter(a => filterPlatforms.includes(a.platform));
    switch (sortKey) {
      case 'Oldest':
        list.sort((a,b)=> new Date(a.date) - new Date(b.date));
        break;
      case 'Company A-Z':
        list.sort((a,b)=> a.company.localeCompare(b.company) || (new Date(b.date)-new Date(a.date)));
        break;
      case 'Favorites first':
        list.sort((a,b)=> (b.favorite?1:0) - (a.favorite?1:0) || (new Date(b.date)-new Date(a.date)));
        break;
      default:
        list.sort((a,b)=> new Date(b.date) - new Date(a.date));
    }
    return list;
  }, [applications, appsQuery, filterStatuses, filterPlatforms, sortKey]);

  return (
    <>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 flex-1 px-3 h-10 rounded-xl" style={{ background: c.surface, border: `1px solid ${c.surfaceBorder}` }}>
          <Search className="w-4 h-4" style={{ color: Grey }} />
          <input value={appsQuery} onChange={e=>setAppsQuery(e.target.value)} placeholder="Search applications" className="flex-1 text-[13px] bg-transparent outline-none" style={{ color: c.text }} />
        </div>
        <IconBtn onClick={()=>setFiltersOpen(true)} c={c} t={eff} aria="Filters"><Filter className="w-5 h-5"/></IconBtn>
        <IconBtn onClick={()=>setSortOpen(true)} c={c} t={eff} aria="Sort"><ArrowUpDown className="w-5 h-5"/></IconBtn>
      </div>

      <div className="grid gap-3 mt-4">
        {appsView.map(a=> {
          const status = STATUSES.find(s=>s.key===a.status);
          const d = new Date(a.date);
          const dateStr = d.toISOString().slice(0,10);
          const timeStr = d.toTimeString().slice(0,5);
          const noteStr = a.note ? (a.note.length > 50 ? a.note.slice(0,50) + '…' : a.note) : '';
          const badges = [];
          if(a.cvTailored) badges.push(<FileText className="w-3 h-3"/>);
          if(a.motivation) badges.push(<Mail className="w-3 h-3"/>);
          if(a.favorite) badges.push(<Star className="w-3 h-3"/>);
          return (
          <div key={a.id} className="rounded-2xl p-4 flex flex-col" style={{ background: c.surface, border: `1px solid ${c.surfaceBorder}`, boxShadow: shadow(eff, '0 14px 38px rgba(0,0,0,.12),0 3px 8px rgba(0,0,0,.06)', '0 16px 44px rgba(0,0,0,.46),0 3px 10px rgba(0,0,0,.30)') }}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="text-[14px] font-semibold truncate" style={{ color: c.text }}>{a.company}</div>
                <div className="text-[12px] truncate" style={{ color: Grey }}>{a.role}</div>
                {noteStr && <div className="text-[11px] truncate" style={{ color: Grey }}>{noteStr}</div>}
              </div>
              <div className="flex flex-col items-end gap-1 ml-2">
                <div className="flex items-center gap-2">
                  <div className="text-[11px] whitespace-nowrap" style={{ color: Grey }}>{dateStr} {timeStr}</div>
                  <button
                    onClick={() => onEdit?.(a)}
                    aria-label="Edit"
                    className="grid place-items-center rounded-xl"
                    style={{ width: 32, height: 32, background: c.surface, border: `1px solid ${c.surfaceBorder}` }}
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex flex-wrap justify-end gap-1">
                  {status && (
                    <span
                      className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full"
                      style={{ background: c.chipBg, color: c.text }}
                    >
                      {status.icon}
                      <span>{status.key}</span>
                    </span>
                  )}
                  <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: c.chipBg, color: c.text }}>{a.platform}</span>
                </div>
              </div>
            </div>
            {badges.length>0 && (
              <div className="flex flex-wrap items-center gap-2 pt-3 mt-2 border-t" style={{ borderColor: c.surfaceBorder }}>
                {badges.map((icon,i)=>(
                  <span key={i} className="grid place-items-center w-6 h-6 rounded-md" style={{ background: `linear-gradient(90deg, ${c.sky}, ${c.emerald})`, color: '#0f172a' }}>
                    {icon}
                  </span>
                ))}
              </div>
            )}
          </div>
          );
        })}
        {appsView.length===0 && (
          <div className="rounded-2xl p-5 text-center" style={{ background: c.surface, border: `1px solid ${c.surfaceBorder}`, color: Grey }}>
            No applications yet.
            <div className="mt-3">
              <button onClick={onLog} className="px-3 py-2 rounded-xl text-[12px] font-semibold" style={{ background: `linear-gradient(90deg, ${c.sky}, ${c.emerald})`, color: '#0f172a' }}>Log application</button>
            </div>
          </div>
        )}
      </div>

      <Sheet open={filtersOpen} onClose={()=>setFiltersOpen(false)} title="Filters" c={c} t={eff}>
        <div className="grid gap-3">
          <div>
            <div className="text-[12px] mb-2" style={{ color: Grey }}>Status</div>
            <div className="grid grid-cols-2 gap-2">
              {STATUSES.map(s=>{
                const on = filterStatuses.includes(s.key);
                return (
                  <button key={s.key} onClick={()=> setFilterStatuses(on? filterStatuses.filter(k=>k!==s.key) : [...filterStatuses, s.key])}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[13px]"
                    style={{ background: on? `linear-gradient(90deg, ${c.rose}, ${c.amber})` : c.chipBg, border: `1px solid ${c.surfaceBorder}`, color: on? '#0f172a' : c.text }}>
                    {s.icon}
                    <span className="truncate">{s.key}</span>
                    {on ? <BadgeCheck className="w-4 h-4 ml-auto"/> : null}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <div className="text-[12px] mb-2" style={{ color: Grey }}>Platform</div>
            <div className="grid gap-2">
              {PLATFORMS.map(p=>{
                const on = filterPlatforms.includes(p);
                return (
                  <button key={p} onClick={()=> setFilterPlatforms(on? filterPlatforms.filter(k=>k!==p) : [...filterPlatforms, p])}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[13px] text-left"
                    style={{ background: on? `linear-gradient(90deg, ${c.sky}, ${c.emerald})` : c.chipBg, border: `1px solid ${c.surfaceBorder}`, color: on? '#0f172a' : c.text }}>
                    <span className="flex-1 truncate">{p}</span>
                    {on ? <BadgeCheck className="w-4 h-4"/> : <ChevronRight className="w-4 h-4"/>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </Sheet>

      <Sheet open={sortOpen} onClose={()=>setSortOpen(false)} title="Sort by" c={c} t={eff}>
        {['Newest','Oldest','Company A-Z','Favorites first'].map(k=>{
          const on = sortKey===k;
          return (
            <button key={k} onClick={()=>{ setSortKey(k); setSortOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[13px] mb-2"
              style={{ background: on? `linear-gradient(90deg, ${c.sky}, ${c.emerald})` : c.chipBg, border: `1px solid ${c.surfaceBorder}`, color: on? '#0f172a' : c.text }}>
              <span className="flex-1 text-left">{k}</span>
              {on ? <BadgeCheck className="w-4 h-4"/> : null}
            </button>
          );
        })}
      </Sheet>
    </>
  );
}
