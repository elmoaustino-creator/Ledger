import { useState, useEffect, useRef } from "react";
import {
  AreaChart, Area, BarChart, Bar, Cell, PieChart, Pie,
  Tooltip, XAxis, YAxis, CartesianGrid, ResponsiveContainer,
} from "recharts";

const CURRENCIES = [
  { code:"USD", symbol:"$",  label:"US Dollar" },
  { code:"IDR", symbol:"Rp", label:"Indonesian Rupiah" },
  { code:"EUR", symbol:"€",  label:"Euro" },
  { code:"GBP", symbol:"£",  label:"British Pound" },
  { code:"JPY", symbol:"¥",  label:"Japanese Yen" },
  { code:"SGD", symbol:"S$", label:"Singapore Dollar" },
  { code:"AUD", symbol:"A$", label:"Australian Dollar" },
  { code:"MYR", symbol:"RM", label:"Malaysian Ringgit" },
  { code:"THB", symbol:"฿",  label:"Thai Baht" },
  { code:"PHP", symbol:"₱",  label:"Philippine Peso" },
  { code:"KRW", symbol:"₩",  label:"South Korean Won" },
  { code:"INR", symbol:"₹",  label:"Indian Rupee" },
];

const CATEGORIES = [
  { id:"food",          label:"Food & Drink",     emoji:"🍜", color:"#FF6B35" },
  { id:"transport",     label:"Transport",         emoji:"🚌", color:"#FFB830" },
  { id:"shopping",      label:"Shopping",          emoji:"🛍️", color:"#FFDD57" },
  { id:"health",        label:"Health",            emoji:"💊", color:"#06D6A0" },
  { id:"bills",         label:"Bills & Utilities", emoji:"⚡", color:"#4CC9F0" },
  { id:"entertainment", label:"Entertainment",     emoji:"🎬", color:"#F72585" },
  { id:"education",     label:"Education",         emoji:"📚", color:"#B5179E" },
  { id:"other",         label:"Other",             emoji:"📦", color:"#7209B7" },
];
const CAT_MAP = Object.fromEntries(CATEGORIES.map(c => [c.id, c]));

const DAYS        = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const MONTHS      = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const MONTHS_FULL = ["January","February","March","April","May","June","July","August","September","October","November","December"];

const today      = () => new Date().toISOString().slice(0,10);
const parseDate  = s  => { const [y,m,d] = s.split("-"); return new Date(+y,+m-1,+d); };
const dateKey    = d  => typeof d==="string" ? d : d.toISOString().slice(0,10);
const monthKey   = (y,m) => `${y}-${String(m+1).padStart(2,"0")}`;

function fmtNum(n, code) {
  if (!n) n = 0;
  if (code==="IDR"||code==="JPY"||code==="KRW") return Math.round(n).toLocaleString();
  return Number(n).toFixed(2);
}
function fmtFull(n, code) {
  const c = CURRENCIES.find(x=>x.code===code)||CURRENCIES[0];
  return `${c.symbol}${fmtNum(n,code)}`;
}
function fmtK(n, code) {
  if (n>=1000000) return `${(n/1000000).toFixed(1)}M`;
  if (n>=1000)    return `${(n/1000).toFixed(1)}K`;
  return fmtNum(n,code);
}

function CT({ active, payload, label, currency }) {
  if (!active||!payload?.length) return null;
  return (
    <div style={{ background:"#0F1117", border:"1px solid #2A2D3E", borderRadius:10, padding:"10px 14px" }}>
      <div style={{ color:"#666", fontSize:11, marginBottom:5, fontFamily:"'Satoshi',sans-serif" }}>{label}</div>
      {payload.map((p,i) => (
        <div key={i} style={{ color:p.color||"#FF6B35", fontSize:13, fontWeight:700, fontFamily:"'Satoshi',sans-serif" }}>
          {p.name}: {fmtFull(p.value,currency)}
        </div>
      ))}
    </div>
  );
}

function StatCard({ label, value, sub, accent="#FF6B35", currency, icon, colorFlip }) {
  const col = colorFlip ? (value>=0?"#06D6A0":"#FF4466") : "#F0F2FF";
  return (
    <div style={{ background:"#141521", border:`1px solid ${accent}25`, borderRadius:16, padding:"18px 20px", position:"relative", overflow:"hidden" }}>
      <div style={{ position:"absolute", top:0, left:0, right:0, height:3, background:accent }} />
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
        <div>
          <div style={{ color:"#555", fontSize:10, letterSpacing:"0.09em", textTransform:"uppercase", fontFamily:"'Satoshi',sans-serif", marginBottom:8 }}>{label}</div>
          <div style={{ color:col, fontSize:24, fontWeight:900, fontFamily:"'Satoshi',sans-serif", lineHeight:1 }}>
            {colorFlip&&value<0?"−":""}{fmtFull(Math.abs(value),currency)}
          </div>
          {sub && <div style={{ color:"#555", fontSize:11, marginTop:6, fontFamily:"'Satoshi',sans-serif" }}>{sub}</div>}
        </div>
        {icon && <div style={{ fontSize:22, opacity:0.6 }}>{icon}</div>}
      </div>
    </div>
  );
}

function CategoryBar({ expenses, currency }) {
  const totals = CATEGORIES.map(c => ({ ...c, total:expenses.filter(e=>e.category===c.id).reduce((s,e)=>s+e.amount,0) }))
    .filter(c=>c.total>0).sort((a,b)=>b.total-a.total);
  const grand = totals.reduce((s,c)=>s+c.total,0);
  if (!grand) return <div style={{ color:"#444", fontSize:13, padding:"12px 0", fontFamily:"'Satoshi',sans-serif" }}>No data yet.</div>;
  return (
    <div>
      <div style={{ height:8, borderRadius:8, overflow:"hidden", display:"flex", marginBottom:14 }}>
        {totals.map(c=><div key={c.id} style={{ flex:c.total/grand, background:c.color, transition:"flex 0.5s" }} />)}
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
        {totals.map(c=>(
          <div key={c.id} style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:8, height:8, borderRadius:"50%", background:c.color, flexShrink:0 }} />
            <div style={{ color:"#777", fontSize:12, fontFamily:"'Satoshi',sans-serif", flex:1 }}>{c.emoji} {c.label}</div>
            <div style={{ color:"#555", fontSize:11 }}>{Math.round(c.total/grand*100)}%</div>
            <div style={{ color:c.color, fontSize:13, fontWeight:700, fontFamily:"'Satoshi',sans-serif", minWidth:60, textAlign:"right" }}>{fmtFull(c.total,currency)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function IncomeBanner({ income, spent, currency, onEdit }) {
  const left = income - spent;
  const pct  = income>0 ? Math.min(100,(spent/income)*100) : 0;
  const barColor = pct>=90?"#FF4466":pct>=70?"#FFDD57":"#06D6A0";
  if (!income) return (
    <button onClick={onEdit} style={{ width:"100%", background:"#141521", border:"2px dashed #2A2D3E", borderRadius:14, padding:"15px", cursor:"pointer", color:"#555", fontFamily:"'Satoshi',sans-serif", fontSize:14, display:"flex", alignItems:"center", justifyContent:"center", gap:8, marginBottom:20 }}>
      <span style={{ fontSize:18 }}>💰</span> Set this month's income → go to Monthly view
    </button>
  );
  return (
    <div style={{ background:"#141521", border:"1px solid #2A2D3E", borderRadius:14, padding:"18px 22px", marginBottom:20 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
        <div>
          <div style={{ color:"#555", fontSize:10, textTransform:"uppercase", letterSpacing:"0.09em", fontFamily:"'Satoshi',sans-serif" }}>This Month's Income</div>
          <div style={{ color:"#F0F2FF", fontSize:20, fontWeight:900, marginTop:2, fontFamily:"'Satoshi',sans-serif" }}>{fmtFull(income,currency)}</div>
        </div>
        <div style={{ textAlign:"right" }}>
          <div style={{ color:"#555", fontSize:10, textTransform:"uppercase", letterSpacing:"0.09em", fontFamily:"'Satoshi',sans-serif" }}>Income Left</div>
          <div style={{ color:left<0?"#FF4466":"#06D6A0", fontSize:20, fontWeight:900, marginTop:2, fontFamily:"'Satoshi',sans-serif" }}>
            {left<0?"−":""}{fmtFull(Math.abs(left),currency)}
          </div>
        </div>
      </div>
      <div style={{ height:9, background:"#1E2130", borderRadius:9, overflow:"hidden", marginBottom:8 }}>
        <div style={{ height:"100%", width:`${pct}%`, background:`linear-gradient(90deg,${barColor}88,${barColor})`, borderRadius:9, transition:"width 0.6s" }} />
      </div>
      <div style={{ display:"flex", justifyContent:"space-between" }}>
        <span style={{ color:barColor, fontSize:12, fontFamily:"'Satoshi',sans-serif", fontWeight:700 }}>{pct.toFixed(1)}% spent</span>
        <button onClick={onEdit} style={{ background:"none", border:"none", color:"#444", cursor:"pointer", fontSize:12, fontFamily:"'Satoshi',sans-serif" }}>Edit in Monthly ↗</button>
      </div>
      {left<0 && <div style={{ marginTop:9, background:"#FF446614", border:"1px solid #FF446628", borderRadius:8, padding:"7px 12px", color:"#FF4466", fontSize:12, fontFamily:"'Satoshi',sans-serif" }}>
        ⚠️ Over budget by {fmtFull(Math.abs(left),currency)}
      </div>}
    </div>
  );
}

function MonthIncomeEditor({ mk, income, currency, onSave }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal]         = useState("");
  const inputRef              = useRef(null);
  const sym = CURRENCIES.find(c=>c.code===currency)?.symbol||"$";
  const cur = income||0;

  function startEdit() { setVal(cur>0?String(cur):""); setEditing(true); setTimeout(()=>inputRef.current?.focus(),50); }
  function commit() { const n=parseFloat(val); onSave(mk,isNaN(n)||n<0?0:n); setEditing(false); }
  function onKey(e) { if(e.key==="Enter")commit(); if(e.key==="Escape")setEditing(false); }

  if (editing) return (
    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
      <span style={{ color:"#06D6A0", fontWeight:900, fontSize:15, fontFamily:"'Satoshi',sans-serif" }}>{sym}</span>
      <input ref={inputRef} value={val} onChange={e=>setVal(e.target.value)} onBlur={commit} onKeyDown={onKey}
        type="number" min="0" placeholder="0"
        style={{ background:"#1E2130", border:"1.5px solid #06D6A0", borderRadius:8, padding:"6px 10px", color:"#F0F2FF", fontSize:16, fontWeight:700, fontFamily:"'Satoshi',sans-serif", outline:"none", width:120 }} />
      <button onClick={commit} style={{ background:"#06D6A0", border:"none", color:"#0A0C14", borderRadius:7, padding:"6px 10px", cursor:"pointer", fontWeight:900, fontSize:12, fontFamily:"'Satoshi',sans-serif" }}>✓</button>
      <button onClick={()=>setEditing(false)} style={{ background:"#2A2D3E", border:"none", color:"#777", borderRadius:7, padding:"6px 10px", cursor:"pointer", fontSize:12 }}>✕</button>
    </div>
  );

  return (
    <button onClick={startEdit}
      style={{ display:"flex", alignItems:"center", gap:6, background:"none", border:"1px solid #2A2D3E", borderRadius:9, padding:"6px 12px", cursor:"pointer", transition:"all 0.15s" }}
      onMouseEnter={e=>{e.currentTarget.style.borderColor="#06D6A0";e.currentTarget.style.background="#06D6A010";}}
      onMouseLeave={e=>{e.currentTarget.style.borderColor="#2A2D3E";e.currentTarget.style.background="none";}}>
      {cur>0
        ? <><span style={{ color:"#06D6A0", fontSize:15, fontWeight:900, fontFamily:"'Satoshi',sans-serif" }}>{fmtFull(cur,currency)}</span><span style={{ color:"#444", fontSize:11, fontFamily:"'Satoshi',sans-serif" }}>&nbsp;income ✏️</span></>
        : <><span style={{ fontSize:14 }}>💰</span><span style={{ color:"#555", fontSize:13, fontFamily:"'Satoshi',sans-serif" }}>Set income for this month</span></>
      }
    </button>
  );
}

function SettingsModal({ currency, onSave, onClearAll, onClose }) {
  const [cur, setCur]         = useState(currency);
  const [confirm, setConfirm] = useState(false);
  return (
    <div style={{ position:"fixed", inset:0, background:"#00000090", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center" }}
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{ background:"#141521", border:"1px solid #2A2D3E", borderRadius:20, padding:"32px 36px", width:420, maxWidth:"95vw", boxShadow:"0 30px 80px #000d", maxHeight:"90vh", overflowY:"auto" }}>
        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:24 }}>
          <h2 style={{ margin:0, color:"#F0F2FF", fontFamily:"'Satoshi',sans-serif", fontSize:20, fontWeight:900 }}>⚙️ Settings</h2>
          <button onClick={onClose} style={{ background:"none", border:"none", color:"#555", cursor:"pointer", fontSize:20 }}>✕</button>
        </div>
        <div style={{ marginBottom:10 }}>
          <label style={{ color:"#555", fontSize:10, letterSpacing:"0.09em", textTransform:"uppercase", display:"block", marginBottom:10, fontFamily:"'Satoshi',sans-serif" }}>Currency</label>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:7, maxHeight:280, overflowY:"auto", paddingRight:2 }}>
            {CURRENCIES.map(c=>(
              <button key={c.code} onClick={()=>setCur(c.code)} style={{ padding:"9px 11px", borderRadius:10, border:`1.5px solid ${cur===c.code?"#FF6B35":"#2A2D3E"}`, background:cur===c.code?"#FF6B3514":"#0F1117", cursor:"pointer", textAlign:"left", fontFamily:"'Satoshi',sans-serif", display:"flex", alignItems:"center", gap:8, transition:"all 0.15s" }}>
                <span style={{ color:"#FF6B35", fontWeight:900, fontSize:14, minWidth:24 }}>{c.symbol}</span>
                <div>
                  <div style={{ color:"#F0F2FF", fontSize:12, fontWeight:700 }}>{c.code}</div>
                  <div style={{ color:"#444", fontSize:10 }}>{c.label}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
        <div style={{ background:"#06D6A010", border:"1px solid #06D6A020", borderRadius:10, padding:"11px 14px", marginBottom:22, marginTop:14 }}>
          <div style={{ color:"#06D6A0", fontSize:12, fontFamily:"'Satoshi',sans-serif", fontWeight:700, marginBottom:3 }}>💡 Variable monthly income</div>
          <div style={{ color:"#555", fontSize:12, fontFamily:"'Satoshi',sans-serif" }}>Set a different income for each month directly in the Monthly tab — just click the income button next to the month name.</div>
        </div>
        <button onClick={()=>onSave(cur)} style={{ width:"100%", padding:"13px", background:"linear-gradient(135deg,#FF6B35,#F72585)", border:"none", borderRadius:12, color:"#fff", fontSize:15, fontWeight:900, cursor:"pointer", fontFamily:"'Satoshi',sans-serif", marginBottom:16 }}>
          Save →
        </button>
        <div style={{ borderTop:"1px solid #1E2130", paddingTop:18 }}>
          <div style={{ color:"#444", fontSize:10, textTransform:"uppercase", letterSpacing:"0.09em", marginBottom:10, fontFamily:"'Satoshi',sans-serif" }}>Danger Zone</div>
          {!confirm
            ? <button onClick={()=>setConfirm(true)} style={{ width:"100%", padding:"11px", background:"#FF446610", border:"1px solid #FF446628", borderRadius:10, color:"#FF4466", fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"'Satoshi',sans-serif" }}>🗑️ Clear All Expenses</button>
            : <div style={{ background:"#FF446611", border:"1px solid #FF446635", borderRadius:10, padding:"14px" }}>
                <div style={{ color:"#FF4466", fontSize:13, fontFamily:"'Satoshi',sans-serif", marginBottom:10 }}>Sure? Cannot be undone.</div>
                <div style={{ display:"flex", gap:8 }}>
                  <button onClick={()=>{onClearAll();onClose();}} style={{ flex:1, padding:"9px", background:"#FF4466", border:"none", borderRadius:8, color:"#fff", fontWeight:900, cursor:"pointer", fontFamily:"'Satoshi',sans-serif" }}>Yes, clear all</button>
                  <button onClick={()=>setConfirm(false)} style={{ flex:1, padding:"9px", background:"#2A2D3E", border:"none", borderRadius:8, color:"#F0F2FF", cursor:"pointer", fontFamily:"'Satoshi',sans-serif" }}>Cancel</button>
                </div>
              </div>
          }
        </div>
      </div>
    </div>
  );
}

function AddModal({ onSave, onClose, editItem, currency }) {
  const sym = CURRENCIES.find(c=>c.code===currency)?.symbol||"$";
  const [amount,setAmount]     = useState(editItem?.amount?.toString()||"");
  const [category,setCategory] = useState(editItem?.category||"food");
  const [note,setNote]         = useState(editItem?.note||"");
  const [date,setDate]         = useState(editItem?.date||today());
  const [err,setErr]           = useState("");

  function save() {
    const n = parseFloat(amount);
    if (!amount||isNaN(n)||n<=0){setErr("Enter a valid amount");return;}
    onSave({id:editItem?.id||Date.now(), amount:parseFloat(n.toFixed(2)), category, note:note.trim()||CAT_MAP[category]?.label, date});
    onClose();
  }

  return (
    <div style={{ position:"fixed", inset:0, background:"#00000090", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center" }}
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{ background:"#141521", border:"1px solid #2A2D3E", borderRadius:20, padding:"30px 34px", width:420, maxWidth:"95vw", boxShadow:"0 30px 80px #000d" }}>
        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:22 }}>
          <h2 style={{ margin:0, color:"#F0F2FF", fontFamily:"'Satoshi',sans-serif", fontSize:19, fontWeight:900 }}>{editItem?"Edit":"Add"} Expense</h2>
          <button onClick={onClose} style={{ background:"none", border:"none", color:"#555", cursor:"pointer", fontSize:20 }}>✕</button>
        </div>
        <div style={{ marginBottom:16 }}>
          <label style={{ color:"#555", fontSize:10, letterSpacing:"0.09em", textTransform:"uppercase", display:"block", marginBottom:7, fontFamily:"'Satoshi',sans-serif" }}>Amount</label>
          <div style={{ position:"relative" }}>
            <span style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", color:"#FF6B35", fontWeight:900, fontSize:18 }}>{sym}</span>
            <input value={amount} onChange={e=>{setAmount(e.target.value);setErr("");}} placeholder="0.00" type="number" min="0"
              style={{ width:"100%", background:"#0F1117", border:`1.5px solid ${err?"#FF4466":"#2A2D3E"}`, borderRadius:12, padding:"13px 16px 13px 46px", color:"#F0F2FF", fontSize:22, fontFamily:"'Satoshi',sans-serif", fontWeight:900, outline:"none", boxSizing:"border-box" }}
              onFocus={e=>e.target.style.borderColor="#FF6B35"} onBlur={e=>e.target.style.borderColor=err?"#FF4466":"#2A2D3E"} autoFocus />
          </div>
          {err && <div style={{ color:"#FF4466", fontSize:12, marginTop:4 }}>{err}</div>}
        </div>
        <div style={{ marginBottom:16 }}>
          <label style={{ color:"#555", fontSize:10, letterSpacing:"0.09em", textTransform:"uppercase", display:"block", marginBottom:7, fontFamily:"'Satoshi',sans-serif" }}>Category</label>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:7 }}>
            {CATEGORIES.map(c=>(
              <button key={c.id} onClick={()=>setCategory(c.id)} style={{ padding:"9px 4px", borderRadius:10, border:`1.5px solid ${category===c.id?c.color:"#2A2D3E"}`, background:category===c.id?c.color+"20":"transparent", cursor:"pointer", textAlign:"center", transition:"all 0.15s" }}>
                <div style={{ fontSize:18 }}>{c.emoji}</div>
                <div style={{ color:category===c.id?c.color:"#444", fontSize:9, marginTop:2, fontFamily:"'Satoshi',sans-serif", fontWeight:700 }}>{c.label.split(" ")[0]}</div>
              </button>
            ))}
          </div>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:22 }}>
          <div>
            <label style={{ color:"#555", fontSize:10, letterSpacing:"0.09em", textTransform:"uppercase", display:"block", marginBottom:7, fontFamily:"'Satoshi',sans-serif" }}>Note</label>
            <input value={note} onChange={e=>setNote(e.target.value)} placeholder="Optional..."
              style={{ width:"100%", background:"#0F1117", border:"1.5px solid #2A2D3E", borderRadius:10, padding:"11px 12px", color:"#F0F2FF", fontSize:14, fontFamily:"'Satoshi',sans-serif", outline:"none", boxSizing:"border-box" }}
              onFocus={e=>e.target.style.borderColor="#FF6B35"} onBlur={e=>e.target.style.borderColor="#2A2D3E"} />
          </div>
          <div>
            <label style={{ color:"#555", fontSize:10, letterSpacing:"0.09em", textTransform:"uppercase", display:"block", marginBottom:7, fontFamily:"'Satoshi',sans-serif" }}>Date</label>
            <input type="date" value={date} onChange={e=>setDate(e.target.value)} max={today()}
              style={{ width:"100%", background:"#0F1117", border:"1.5px solid #2A2D3E", borderRadius:10, padding:"11px 12px", color:"#F0F2FF", fontSize:14, fontFamily:"'Satoshi',sans-serif", outline:"none", boxSizing:"border-box", colorScheme:"dark" }}
              onFocus={e=>e.target.style.borderColor="#FF6B35"} onBlur={e=>e.target.style.borderColor="#2A2D3E"} />
          </div>
        </div>
        <button onClick={save} style={{ width:"100%", padding:"14px", background:"linear-gradient(135deg,#FF6B35,#F72585)", border:"none", borderRadius:12, color:"#fff", fontSize:16, fontWeight:900, cursor:"pointer", fontFamily:"'Satoshi',sans-serif" }}>
          {editItem?"Save Changes":"Add Expense →"}
        </button>
      </div>
    </div>
  );
}

function ExpenseRow({ exp, onEdit, onDelete, currency }) {
  const [hover,setHover] = useState(false);
  const cat = CAT_MAP[exp.category]||CAT_MAP.other;
  return (
    <div onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)}
      style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 14px", borderRadius:12, background:hover?"#1A1D2C":"transparent", transition:"background 0.15s" }}>
      <div style={{ width:38, height:38, borderRadius:11, background:cat.color+"20", border:`1px solid ${cat.color}35`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:17, flexShrink:0 }}>{cat.emoji}</div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ color:"#F0F2FF", fontWeight:700, fontSize:14, fontFamily:"'Satoshi',sans-serif", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{exp.note}</div>
        <div style={{ color:"#444", fontSize:11, marginTop:2, fontFamily:"'Satoshi',sans-serif" }}>{cat.label}</div>
      </div>
      <div style={{ color:cat.color, fontSize:15, fontWeight:900, fontFamily:"'Satoshi',sans-serif", flexShrink:0 }}>{fmtFull(exp.amount,currency)}</div>
      {hover && (
        <div style={{ display:"flex", gap:5, flexShrink:0 }}>
          <button onClick={()=>onEdit(exp)} style={{ background:"#2A2D3E", border:"none", color:"#888", width:28, height:28, borderRadius:8, cursor:"pointer", fontSize:12 }}>✏️</button>
          <button onClick={()=>onDelete(exp.id)} style={{ background:"#FF446614", border:"none", color:"#FF4466", width:28, height:28, borderRadius:8, cursor:"pointer", fontSize:12 }}>✕</button>
        </div>
      )}
    </div>
  );
}

function DailyView({ expenses, onAdd, onEdit, onDelete, selectedDate, onDateChange, currency, incomes, onGoMonthly }) {
  const dayExp = expenses.filter(e=>e.date===selectedDate).sort((a,b)=>b.id-a.id);
  const total  = dayExp.reduce((s,e)=>s+e.amount,0);
  const d      = parseDate(selectedDate);
  const label  = selectedDate===today()?"Today":`${DAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}`;
  const mk     = monthKey(d.getFullYear(), d.getMonth());
  const monthIncome = incomes[mk]||0;
  const monthSpent  = expenses.filter(e=>e.date.startsWith(mk)).reduce((s,e)=>s+e.amount,0);

  function shift(n) { const nd=new Date(d); nd.setDate(nd.getDate()+n); if(nd<=new Date()) onDateChange(dateKey(nd)); }

  return (
    <div>
      <IncomeBanner income={monthIncome} spent={monthSpent} currency={currency} onEdit={onGoMonthly} />
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:18 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <button onClick={()=>shift(-1)} style={{ background:"#2A2D3E", border:"none", color:"#F0F2FF", width:34, height:34, borderRadius:9, cursor:"pointer", fontSize:16 }}>‹</button>
          <div>
            <div style={{ color:"#F0F2FF", fontFamily:"'Satoshi',sans-serif", fontSize:20, fontWeight:900 }}>{label}</div>
            <div style={{ color:"#444", fontSize:11, fontFamily:"'Satoshi',sans-serif" }}>{dayExp.length} expense{dayExp.length!==1?"s":""}</div>
          </div>
          <button onClick={()=>shift(1)} disabled={selectedDate===today()} style={{ background:"#2A2D3E", border:"none", color:selectedDate===today()?"#333":"#F0F2FF", width:34, height:34, borderRadius:9, cursor:selectedDate===today()?"default":"pointer", fontSize:16 }}>›</button>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <input type="date" value={selectedDate} max={today()} onChange={e=>onDateChange(e.target.value)}
            style={{ background:"#141521", border:"1px solid #2A2D3E", borderRadius:9, padding:"7px 10px", color:"#777", fontSize:12, fontFamily:"'Satoshi',sans-serif", outline:"none", colorScheme:"dark" }} />
          <button onClick={onAdd} style={{ background:"linear-gradient(135deg,#FF6B35,#F72585)", border:"none", color:"#fff", padding:"8px 18px", borderRadius:10, cursor:"pointer", fontWeight:900, fontSize:13, fontFamily:"'Satoshi',sans-serif" }}>+ Add</button>
        </div>
      </div>
      <div style={{ background:"#141521", border:"1px solid #2A2D3E", borderRadius:14, padding:"14px 20px", marginBottom:16, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div style={{ color:"#444", fontSize:11, textTransform:"uppercase", letterSpacing:"0.09em", fontFamily:"'Satoshi',sans-serif" }}>Day Total</div>
        <div style={{ color:"#FF6B35", fontSize:26, fontWeight:900, fontFamily:"'Satoshi',sans-serif" }}>{fmtFull(total,currency)}</div>
      </div>
      {dayExp.length===0
        ? <div style={{ textAlign:"center", padding:"48px 20px", color:"#444", fontFamily:"'Satoshi',sans-serif" }}>
            <div style={{ fontSize:42, marginBottom:10 }}>🌿</div>
            <div style={{ fontSize:15 }}>No expenses for this day.</div>
            <button onClick={onAdd} style={{ marginTop:14, background:"none", border:"1px solid #2A2D3E", color:"#FF6B35", padding:"9px 22px", borderRadius:10, cursor:"pointer", fontFamily:"'Satoshi',sans-serif", fontWeight:700 }}>Log first expense</button>
          </div>
        : <div style={{ background:"#141521", border:"1px solid #2A2D3E", borderRadius:14, padding:"6px", marginBottom:16 }}>
            {dayExp.map((e,i)=>(
              <div key={e.id}>
                <ExpenseRow exp={e} onEdit={onEdit} onDelete={onDelete} currency={currency} />
                {i<dayExp.length-1 && <div style={{ height:1, background:"#1E2130", margin:"0 14px" }} />}
              </div>
            ))}
          </div>
      }
      {dayExp.length>0 && (
        <div style={{ background:"#141521", border:"1px solid #2A2D3E", borderRadius:14, padding:"18px 22px" }}>
          <div style={{ color:"#444", fontSize:10, letterSpacing:"0.09em", textTransform:"uppercase", fontFamily:"'Satoshi',sans-serif", marginBottom:14 }}>Breakdown</div>
          <CategoryBar expenses={dayExp} currency={currency} />
        </div>
      )}
    </div>
  );
}

function WeeklyView({ expenses, onAdd, currency, incomes }) {
  const now = new Date();
  const [wo,setWo] = useState(0);
  const ws = new Date(now); ws.setDate(ws.getDate()-ws.getDay()-wo*7);
  const weekDays = Array.from({length:7},(_,i)=>{ const d=new Date(ws); d.setDate(ws.getDate()+i); return dateKey(d); });
  const weekLabel= `${MONTHS[parseDate(weekDays[0]).getMonth()]} ${parseDate(weekDays[0]).getDate()} – ${MONTHS[parseDate(weekDays[6]).getMonth()]} ${parseDate(weekDays[6]).getDate()}`;
  const chartData= weekDays.map(dk=>({ day:DAYS[parseDate(dk).getDay()], total:parseFloat(expenses.filter(e=>e.date===dk).reduce((s,e)=>s+e.amount,0).toFixed(2)) }));
  const weekExp  = expenses.filter(e=>weekDays.includes(e.date));
  const weekTotal= weekExp.reduce((s,e)=>s+e.amount,0);
  const avgDay   = weekTotal/7;
  const worstDay = chartData.reduce((a,b)=>b.total>a.total?b:a,chartData[0]);
  const touchedMonths = [...new Set(weekDays.map(dk=>dk.slice(0,7)))];
  const avgMonthIncome= touchedMonths.reduce((s,m)=>s+(incomes[m]||0),0)/touchedMonths.length;
  const weeklyBudget  = avgMonthIncome/4.33;
  const leftWeek      = weeklyBudget-weekTotal;
  const sym = CURRENCIES.find(c=>c.code===currency)?.symbol||"$";

  return (
    <div>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:18 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <button onClick={()=>setWo(o=>o+1)} style={{ background:"#2A2D3E", border:"none", color:"#F0F2FF", width:34, height:34, borderRadius:9, cursor:"pointer", fontSize:16 }}>‹</button>
          <div>
            <div style={{ color:"#F0F2FF", fontFamily:"'Satoshi',sans-serif", fontSize:20, fontWeight:900 }}>{wo===0?"This Week":`${wo}w ago`}</div>
            <div style={{ color:"#444", fontSize:11, fontFamily:"'Satoshi',sans-serif" }}>{weekLabel}</div>
          </div>
          <button onClick={()=>setWo(o=>Math.max(0,o-1))} disabled={wo===0} style={{ background:"#2A2D3E", border:"none", color:wo===0?"#333":"#F0F2FF", width:34, height:34, borderRadius:9, cursor:wo===0?"default":"pointer", fontSize:16 }}>›</button>
        </div>
        <button onClick={onAdd} style={{ background:"linear-gradient(135deg,#FF6B35,#F72585)", border:"none", color:"#fff", padding:"8px 18px", borderRadius:10, cursor:"pointer", fontWeight:900, fontSize:13, fontFamily:"'Satoshi',sans-serif" }}>+ Add</button>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12, marginBottom:18 }}>
        <StatCard label="Week Total" value={weekTotal} accent="#FF6B35" currency={currency} icon="📅" />
        <StatCard label="Daily Avg"  value={avgDay}    accent="#4CC9F0" currency={currency} icon="📊" />
        {avgMonthIncome>0
          ? <StatCard label="Est. Budget Left" value={leftWeek} sub={leftWeek<0?"over":"remaining"} accent={leftWeek<0?"#FF4466":"#06D6A0"} currency={currency} icon={leftWeek<0?"🔴":"💚"} colorFlip />
          : <StatCard label="Peak Day" value={worstDay.total} sub={worstDay.day} accent="#F72585" currency={currency} icon="📈" />}
      </div>
      <div style={{ background:"#141521", border:"1px solid #2A2D3E", borderRadius:14, padding:"20px", marginBottom:16 }}>
        <div style={{ color:"#444", fontSize:10, letterSpacing:"0.09em", textTransform:"uppercase", fontFamily:"'Satoshi',sans-serif", marginBottom:16 }}>Daily Spending</div>
        <ResponsiveContainer width="100%" height={190}>
          <BarChart data={chartData} barCategoryGap="35%">
            <CartesianGrid stroke="#1E2130" strokeDasharray="4 4" vertical={false} />
            <XAxis dataKey="day" tick={{ fill:"#555", fontSize:11, fontFamily:"'Satoshi',sans-serif" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill:"#555", fontSize:11, fontFamily:"'Satoshi',sans-serif" }} axisLine={false} tickLine={false} tickFormatter={v=>`${sym}${fmtK(v,currency)}`} />
            <Tooltip content={<CT currency={currency} />} />
            <Bar dataKey="total" name="Spent" radius={[6,6,0,0]}>
              {chartData.map((e,i)=><Cell key={i} fill={e.total===worstDay.total&&e.total>0?"#F72585":"#FF6B35"} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div style={{ background:"#141521", border:"1px solid #2A2D3E", borderRadius:14, padding:"18px 22px" }}>
        <div style={{ color:"#444", fontSize:10, letterSpacing:"0.09em", textTransform:"uppercase", fontFamily:"'Satoshi',sans-serif", marginBottom:14 }}>Category Breakdown</div>
        <CategoryBar expenses={weekExp} currency={currency} />
      </div>
    </div>
  );
}

function MonthlyView({ expenses, onAdd, currency, incomes, onIncomeChange }) {
  const now = new Date();
  const [mo,setMo] = useState(0);
  const adj  = new Date(now.getFullYear(), now.getMonth()-mo, 1);
  const y=adj.getFullYear(), m=adj.getMonth();
  const mk   = monthKey(y,m);
  const income    = incomes[mk]||0;
  const monthExp  = expenses.filter(e=>e.date.startsWith(mk));
  const monthTotal= monthExp.reduce((s,e)=>s+e.amount,0);
  const leftMonth = income-monthTotal;
  const days      = new Date(y,m+1,0).getDate();
  const daysSpent = new Set(monthExp.map(e=>e.date)).size;
  const sym = CURRENCIES.find(c=>c.code===currency)?.symbol||"$";

  let running=0;
  const cumulData = Array.from({length:days},(_,i)=>{
    const dk=`${mk}-${String(i+1).padStart(2,"0")}`;
    running+=expenses.filter(e=>e.date===dk).reduce((s,e)=>s+e.amount,0);
    return { day:i+1, spent:parseFloat(running.toFixed(2)), budget:income||undefined };
  });

  return (
    <div>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:18, flexWrap:"wrap", gap:10 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <button onClick={()=>setMo(o=>o+1)} style={{ background:"#2A2D3E", border:"none", color:"#F0F2FF", width:34, height:34, borderRadius:9, cursor:"pointer", fontSize:16 }}>‹</button>
          <div>
            <div style={{ color:"#F0F2FF", fontFamily:"'Satoshi',sans-serif", fontSize:20, fontWeight:900 }}>{MONTHS_FULL[m]} {y}</div>
            <div style={{ color:"#444", fontSize:11, fontFamily:"'Satoshi',sans-serif" }}>{monthExp.length} expenses · {daysSpent} active days</div>
          </div>
          <button onClick={()=>setMo(o=>Math.max(0,o-1))} disabled={mo===0} style={{ background:"#2A2D3E", border:"none", color:mo===0?"#333":"#F0F2FF", width:34, height:34, borderRadius:9, cursor:mo===0?"default":"pointer", fontSize:16 }}>›</button>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <MonthIncomeEditor mk={mk} income={income} currency={currency} onSave={onIncomeChange} />
          <button onClick={onAdd} style={{ background:"linear-gradient(135deg,#FF6B35,#F72585)", border:"none", color:"#fff", padding:"8px 18px", borderRadius:10, cursor:"pointer", fontWeight:900, fontSize:13, fontFamily:"'Satoshi',sans-serif" }}>+ Add</button>
        </div>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12, marginBottom:18 }}>
        <StatCard label="Month Spent"    value={monthTotal}  accent="#FFDD57" currency={currency} icon="📆" />
        <StatCard label="Month's Income" value={income||0}   accent="#06D6A0" currency={currency} icon="💰" sub={!income?"Not set — tap above":undefined} />
        <StatCard label="Income Left"    value={leftMonth}   accent={!income?"#555":leftMonth<0?"#FF4466":"#06D6A0"} currency={currency} icon={!income?"—":leftMonth<0?"🔴":"✅"} colorFlip={!!income} />
      </div>
      <div style={{ background:"#141521", border:"1px solid #2A2D3E", borderRadius:14, padding:"20px", marginBottom:16 }}>
        <div style={{ color:"#444", fontSize:10, letterSpacing:"0.09em", textTransform:"uppercase", fontFamily:"'Satoshi',sans-serif", marginBottom:16 }}>Cumulative Spending{income?" vs Income":""}</div>
        <ResponsiveContainer width="100%" height={190}>
          <AreaChart data={cumulData}>
            <defs>
              <linearGradient id="mg1" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FFDD57" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#FFDD57" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#1E2130" strokeDasharray="4 4" vertical={false} />
            <XAxis dataKey="day" tick={{ fill:"#555", fontSize:10, fontFamily:"'Satoshi',sans-serif" }} axisLine={false} tickLine={false} tickFormatter={v=>v%5===0?v:""} />
            <YAxis tick={{ fill:"#555", fontSize:10, fontFamily:"'Satoshi',sans-serif" }} axisLine={false} tickLine={false} tickFormatter={v=>`${sym}${fmtK(v,currency)}`} />
            <Tooltip content={<CT currency={currency} />} />
            <Area type="monotone" dataKey="spent" name="Spent" stroke="#FFDD57" strokeWidth={2} fill="url(#mg1)" />
            {income>0 && <Area type="monotone" dataKey="budget" name="Income" stroke="#06D6A0" strokeWidth={1.5} strokeDasharray="5 3" fill="none" />}
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div style={{ background:"#141521", border:"1px solid #2A2D3E", borderRadius:14, padding:"18px 22px" }}>
        <div style={{ color:"#444", fontSize:10, letterSpacing:"0.09em", textTransform:"uppercase", fontFamily:"'Satoshi',sans-serif", marginBottom:14 }}>Category Breakdown</div>
        <CategoryBar expenses={monthExp} currency={currency} />
      </div>
    </div>
  );
}

function YearlyView({ expenses, onAdd, currency, incomes }) {
  const now = new Date();
  const [yo,setYo] = useState(0);
  const y = now.getFullYear()-yo;
  const yearExp   = expenses.filter(e=>e.date.startsWith(`${y}`));
  const yearTotal = yearExp.reduce((s,e)=>s+e.amount,0);
  const sym = CURRENCIES.find(c=>c.code===currency)?.symbol||"$";

  const chartData = MONTHS.map((mon,i)=>{
    const mk=monthKey(y,i);
    return { month:mon, spent:parseFloat(expenses.filter(e=>e.date.startsWith(mk)).reduce((s,e)=>s+e.amount,0).toFixed(2)), income:incomes[mk]||undefined };
  });

  const yearIncome = MONTHS.reduce((s,_,i)=>s+(incomes[monthKey(y,i)]||0),0);
  const monthsWithIncome = MONTHS.filter((_,i)=>(incomes[monthKey(y,i)]||0)>0).length;
  const leftYear   = yearIncome-yearTotal;
  const peakMonth  = chartData.reduce((a,b)=>b.spent>a.spent?b:a,chartData[0]);
  const catData    = CATEGORIES.map(c=>({...c, value:yearExp.filter(e=>e.category===c.id).reduce((s,e)=>s+e.amount,0)})).filter(c=>c.value>0).sort((a,b)=>b.value-a.value);

  return (
    <div>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:18 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <button onClick={()=>setYo(o=>o+1)} style={{ background:"#2A2D3E", border:"none", color:"#F0F2FF", width:34, height:34, borderRadius:9, cursor:"pointer", fontSize:16 }}>‹</button>
          <div>
            <div style={{ color:"#F0F2FF", fontFamily:"'Satoshi',sans-serif", fontSize:24, fontWeight:900 }}>{y}</div>
            <div style={{ color:"#444", fontSize:11, fontFamily:"'Satoshi',sans-serif" }}>{yearExp.length} expenses · {monthsWithIncome} months with income</div>
          </div>
          <button onClick={()=>setYo(o=>Math.max(0,o-1))} disabled={yo===0} style={{ background:"#2A2D3E", border:"none", color:yo===0?"#333":"#F0F2FF", width:34, height:34, borderRadius:9, cursor:yo===0?"default":"pointer", fontSize:16 }}>›</button>
        </div>
        <button onClick={onAdd} style={{ background:"linear-gradient(135deg,#FF6B35,#F72585)", border:"none", color:"#fff", padding:"8px 18px", borderRadius:10, cursor:"pointer", fontWeight:900, fontSize:13, fontFamily:"'Satoshi',sans-serif" }}>+ Add</button>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12, marginBottom:18 }}>
        <StatCard label="Year Spent"   value={yearTotal}   accent="#4CC9F0" currency={currency} icon="🗓️" />
        <StatCard label="Total Income" value={yearIncome}  accent="#06D6A0" currency={currency} icon="💰" sub={monthsWithIncome>0?`${monthsWithIncome} months set`:"Set per month in Monthly view"} />
        {yearIncome>0
          ? <StatCard label="Year Left" value={leftYear} sub={leftYear<0?"over budget":"remaining"} accent={leftYear<0?"#FF4466":"#06D6A0"} currency={currency} icon={leftYear<0?"🔴":"✅"} colorFlip />
          : <StatCard label="Peak Month" value={peakMonth.spent} sub={peakMonth.month} accent="#F72585" currency={currency} icon="📈" />}
      </div>
      <div style={{ background:"#141521", border:"1px solid #2A2D3E", borderRadius:14, padding:"20px", marginBottom:16 }}>
        <div style={{ color:"#444", fontSize:10, letterSpacing:"0.09em", textTransform:"uppercase", fontFamily:"'Satoshi',sans-serif", marginBottom:16 }}>Monthly Spending{monthsWithIncome>0?" vs Income":""}</div>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="yg1" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4CC9F0" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#4CC9F0" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#1E2130" strokeDasharray="4 4" vertical={false} />
            <XAxis dataKey="month" tick={{ fill:"#555", fontSize:11, fontFamily:"'Satoshi',sans-serif" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill:"#555", fontSize:11, fontFamily:"'Satoshi',sans-serif" }} axisLine={false} tickLine={false} tickFormatter={v=>`${sym}${fmtK(v,currency)}`} />
            <Tooltip content={<CT currency={currency} />} />
            <Area type="monotone" dataKey="spent" name="Spent" stroke="#4CC9F0" strokeWidth={2} fill="url(#yg1)" dot={{ fill:"#4CC9F0", r:3 }} />
            {monthsWithIncome>0 && <Area type="monotone" dataKey="income" name="Income" stroke="#06D6A0" strokeWidth={1.5} strokeDasharray="5 3" fill="none" connectNulls={false} />}
          </AreaChart>
        </ResponsiveContainer>
      </div>
      {monthsWithIncome>0 && (
        <div style={{ background:"#141521", border:"1px solid #2A2D3E", borderRadius:14, padding:"18px 22px", marginBottom:16 }}>
          <div style={{ color:"#444", fontSize:10, letterSpacing:"0.09em", textTransform:"uppercase", fontFamily:"'Satoshi',sans-serif", marginBottom:14 }}>Income vs Spending — Month by Month</div>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {chartData.filter(r=>r.income||r.spent>0).map(r=>{
              const left=(r.income||0)-r.spent;
              const pct=r.income?Math.min(100,(r.spent/r.income)*100):0;
              const col=pct>=90?"#FF4466":pct>=70?"#FFDD57":"#06D6A0";
              return (
                <div key={r.month}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                    <span style={{ color:"#888", fontSize:12, fontFamily:"'Satoshi',sans-serif", width:36 }}>{r.month}</span>
                    <span style={{ color:"#F0F2FF", fontSize:12, fontFamily:"'Satoshi',sans-serif" }}>{fmtFull(r.spent,currency)} spent</span>
                    {r.income
                      ? <span style={{ color:left<0?"#FF4466":"#06D6A0", fontSize:12, fontFamily:"'Satoshi',sans-serif", fontWeight:700 }}>{left<0?"−":""}{fmtFull(Math.abs(left),currency)} {left<0?"over":"left"}</span>
                      : <span style={{ color:"#333", fontSize:12, fontFamily:"'Satoshi',sans-serif" }}>no income set</span>}
                  </div>
                  {r.income>0 && <div style={{ height:5, background:"#1E2130", borderRadius:5, overflow:"hidden" }}><div style={{ height:"100%", width:`${pct}%`, background:col, borderRadius:5 }} /></div>}
                </div>
              );
            })}
          </div>
        </div>
      )}
      <div style={{ display:"grid", gridTemplateColumns:"1.2fr 1fr", gap:16 }}>
        <div style={{ background:"#141521", border:"1px solid #2A2D3E", borderRadius:14, padding:"20px" }}>
          <div style={{ color:"#444", fontSize:10, letterSpacing:"0.09em", textTransform:"uppercase", fontFamily:"'Satoshi',sans-serif", marginBottom:14 }}>By Category</div>
          {catData.length>0
            ? <ResponsiveContainer width="100%" height={170}><PieChart><Pie data={catData} dataKey="value" nameKey="label" cx="50%" cy="50%" innerRadius={48} outerRadius={74} strokeWidth={0}>{catData.map((c,i)=><Cell key={i} fill={c.color} />)}</Pie><Tooltip formatter={v=>[fmtFull(v,currency),""]} contentStyle={{ background:"#141521", border:"1px solid #2A2D3E", borderRadius:10, fontFamily:"'Satoshi',sans-serif" }} /></PieChart></ResponsiveContainer>
            : <div style={{ color:"#444", textAlign:"center", padding:40, fontFamily:"'Satoshi',sans-serif" }}>No data</div>}
        </div>
        <div style={{ background:"#141521", border:"1px solid #2A2D3E", borderRadius:14, padding:"20px" }}>
          <div style={{ color:"#444", fontSize:10, letterSpacing:"0.09em", textTransform:"uppercase", fontFamily:"'Satoshi',sans-serif", marginBottom:14 }}>Top Categories</div>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {catData.slice(0,6).map((c,i)=>(
              <div key={c.id} style={{ display:"flex", alignItems:"center", gap:9 }}>
                <div style={{ color:"#333", fontSize:11, width:16 }}>#{i+1}</div>
                <div style={{ fontSize:16 }}>{c.emoji}</div>
                <div style={{ color:"#F0F2FF", fontSize:13, fontFamily:"'Satoshi',sans-serif", flex:1 }}>{c.label.split(" ")[0]}</div>
                <div style={{ color:c.color, fontSize:13, fontWeight:900, fontFamily:"'Satoshi',sans-serif" }}>{fmtFull(c.value,currency)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const TABS = [
  { id:"daily",   label:"Daily",   icon:"📋" },
  { id:"weekly",  label:"Weekly",  icon:"📅" },
  { id:"monthly", label:"Monthly", icon:"📆" },
  { id:"yearly",  label:"Yearly",  icon:"🗓️" },
];

export default function App() {
  const [expenses,     setExpenses]     = useState([]);
  const [currency,     setCurrency]     = useState("USD");
  const [incomes,      setIncomes]      = useState({});
  const [tab,          setTab]          = useState("daily");
  const [showModal,    setShowModal]    = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [editItem,     setEditItem]     = useState(null);
  const [selectedDate, setSelectedDate] = useState(today());
  const [loaded,       setLoaded]       = useState(false);

  useEffect(() => {
    const link = document.createElement("link");
    link.href = "https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700,900&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);

    async function load() {
      try {
        const [eRes,sRes] = await Promise.all([
          window.storage.get("ledger_v3_expenses").catch(()=>null),
          window.storage.get("ledger_v3_settings").catch(()=>null),
        ]);
        if (eRes?.value) setExpenses(JSON.parse(eRes.value));
        if (sRes?.value) { const s=JSON.parse(sRes.value); if(s.currency)setCurrency(s.currency); if(s.incomes)setIncomes(s.incomes); }
      } catch {}
      setLoaded(true);
    }
    load();
  }, []);

  async function persistExp(exps) {
    setExpenses(exps);
    try { await window.storage.set("ledger_v3_expenses", JSON.stringify(exps)); } catch {}
  }

  async function persistSettings(cur, incs) {
    setCurrency(cur); setIncomes(incs);
    try { await window.storage.set("ledger_v3_settings", JSON.stringify({currency:cur, incomes:incs})); } catch {}
  }

  async function handleIncomeChange(mk, value) {
    const updated = {...incomes, [mk]:value};
    setIncomes(updated);
    try { await window.storage.set("ledger_v3_settings", JSON.stringify({currency, incomes:updated})); } catch {}
  }

  function handleSave(exp) {
    const upd = expenses.find(e=>e.id===exp.id) ? expenses.map(e=>e.id===exp.id?exp:e) : [exp,...expenses];
    persistExp(upd);
    setSelectedDate(exp.date);
  }

  const now    = new Date();
  const curMK  = monthKey(now.getFullYear(), now.getMonth());
  const curInc = incomes[curMK]||0;
  const curSpent = expenses.filter(e=>e.date.startsWith(curMK)).reduce((s,e)=>s+e.amount,0);
  const curLeft  = curInc - curSpent;
  const sym = CURRENCIES.find(c=>c.code===currency)?.symbol||"$";

  if (!loaded) return (
    <div style={{ minHeight:"100vh", background:"#0A0C14", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ color:"#FF6B35", fontFamily:"sans-serif", fontSize:16, fontWeight:700 }}>Loading…</div>
    </div>
  );

  return (
    <div style={{ minHeight:"100vh", background:"#0A0C14" }}>
      <header style={{ background:"#0F1117", borderBottom:"1px solid #1E2130", padding:"0 20px", position:"sticky", top:0, zIndex:50 }}>
        <div style={{ maxWidth:860, margin:"0 auto", display:"flex", alignItems:"center", justifyContent:"space-between", height:58 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:30, height:30, background:"linear-gradient(135deg,#FF6B35,#F72585)", borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14 }}>₿</div>
            <div>
              <div style={{ color:"#F0F2FF", fontFamily:"'Satoshi',sans-serif", fontSize:17, fontWeight:900, letterSpacing:"-0.02em" }}>Ledger</div>
              <div style={{ color:"#333", fontSize:9, letterSpacing:"0.12em", textTransform:"uppercase", fontFamily:"'Satoshi',sans-serif" }}>EXPENSE TRACKER</div>
            </div>
          </div>
          {curInc>0 && (
            <div style={{ display:"flex", alignItems:"center", gap:6, background:curLeft<0?"#FF446612":"#06D6A012", border:`1px solid ${curLeft<0?"#FF446628":"#06D6A028"}`, borderRadius:20, padding:"5px 12px" }}>
              <span style={{ fontSize:13 }}>{curLeft<0?"🔴":"💚"}</span>
              <span style={{ color:curLeft<0?"#FF4466":"#06D6A0", fontWeight:900, fontSize:14, fontFamily:"'Satoshi',sans-serif" }}>{sym}{fmtK(Math.abs(curLeft),currency)}</span>
              <span style={{ color:"#444", fontSize:11, fontFamily:"'Satoshi',sans-serif" }}>left this month</span>
            </div>
          )}
          <button onClick={()=>setShowSettings(true)} style={{ background:"#1E2130", border:"1px solid #2A2D3E", color:"#777", padding:"7px 13px", borderRadius:9, cursor:"pointer", fontSize:13, fontFamily:"'Satoshi',sans-serif", fontWeight:700, display:"flex", alignItems:"center", gap:5 }}>
            ⚙️ Settings
          </button>
        </div>
      </header>

      <div style={{ maxWidth:860, margin:"0 auto", padding:"22px 20px 48px" }}>
        <div style={{ display:"flex", gap:4, background:"#0F1117", border:"1px solid #1E2130", borderRadius:13, padding:4, marginBottom:22 }}>
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} style={{ flex:1, padding:"9px 6px", borderRadius:9, border:"none", background:tab===t.id?"linear-gradient(135deg,#FF6B35,#F72585)":"transparent", color:tab===t.id?"#fff":"#555", cursor:"pointer", fontSize:13, fontWeight:900, fontFamily:"'Satoshi',sans-serif", display:"flex", alignItems:"center", justifyContent:"center", gap:5, transition:"all 0.2s" }}>
              <span>{t.icon}</span><span>{t.label}</span>
            </button>
          ))}
        </div>

        {tab==="daily"   && <DailyView   expenses={expenses} onAdd={()=>{setEditItem(null);setShowModal(true);}} onEdit={e=>{setEditItem(e);setShowModal(true);}} onDelete={id=>persistExp(expenses.filter(e=>e.id!==id))} selectedDate={selectedDate} onDateChange={setSelectedDate} currency={currency} incomes={incomes} onGoMonthly={()=>setTab("monthly")} />}
        {tab==="weekly"  && <WeeklyView  expenses={expenses} onAdd={()=>{setEditItem(null);setShowModal(true);}} currency={currency} incomes={incomes} />}
        {tab==="monthly" && <MonthlyView expenses={expenses} onAdd={()=>{setEditItem(null);setShowModal(true);}} currency={currency} incomes={incomes} onIncomeChange={handleIncomeChange} />}
        {tab==="yearly"  && <YearlyView  expenses={expenses} onAdd={()=>{setEditItem(null);setShowModal(true);}} currency={currency} incomes={incomes} />}
      </div>

      {showModal    && <AddModal onSave={handleSave} onClose={()=>{setShowModal(false);setEditItem(null);}} editItem={editItem} currency={currency} />}
      {showSettings && <SettingsModal currency={currency} onSave={cur=>{persistSettings(cur,incomes);setShowSettings(false);}} onClearAll={()=>persistExp([])} onClose={()=>setShowSettings(false)} />}
    </div>
  );
}
