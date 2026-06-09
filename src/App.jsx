import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Star, Shield, Sword, Trophy, Plus, Trash2, ChevronLeft, ChevronRight,
  Crown, Users, Calendar, Medal, Flame, Zap, AlertTriangle, X, Sparkles,
  Loader2, CloudOff, GripVertical, Lock, Unlock, Eye,
} from 'lucide-react';
import * as api from './api.js';

const DAYS = [1, 2, 3, 4, 5, 6, 7];
const TH_LEVELS = Array.from({ length: 12 }, (_, i) => i + 7);

const COC_BG =
  'https://supercell.com/images/ae58a39e76410b4ae9c2bea65d4a584d/hero_bg_clashofclans_.fae7c799.jpg';
const COC_LOGO =
  'https://supercell.com/images/6ccee464815ad96b946fae87998c8190/main_logo_clashofclans.eccf135a.webp';

// ----------------- helpers -----------------
const emptyDay = () => ({ oppTH: '', percent: '', attackStars: 0, starsLost: 0, attacked: false });

const blankPlayerData = () => {
  const data = {};
  DAYS.forEach(d => { data[d] = emptyDay(); });
  return data;
};

const computeTotals = (playerData) => {
  let atk = 0, def = 0, attacks = 0, threeStars = 0;
  DAYS.forEach(d => {
    const day = playerData[d];
    if (!day) return;
    atk += Number(day.attackStars) || 0;
    def += 3 - (Number(day.starsLost) || 0);
    if (day.attacked) {
      attacks += 1;
      if (Number(day.attackStars) === 3) threeStars += 1;
    }
  });
  return { atk, def, total: atk + def, attacks, threeStars };
};

// ----------------- UI primitives -----------------

const StarPicker = ({ value, onChange, onTriple }) => {
  const handle = (n) => {
    const newVal = value === n ? 0 : n;
    onChange(newVal);
    if (newVal === 3 && onTriple) onTriple();
  };
  return (
    <div className="flex gap-1">
      {[1, 2, 3].map(n => {
        const active = n <= value;
        return (
          <button
            key={n}
            onClick={() => handle(n)}
            className="transition-all duration-150 active:scale-75 hover:scale-110"
            style={{
              filter: active ? 'drop-shadow(0 0 8px #f5b73aaa)' : 'none',
              animation: active ? 'cwl-star-pop 0.3s ease-out' : 'none',
            }}
            aria-label={`${n} estrella${n > 1 ? 's' : ''}`}
          >
            <Star
              size={22}
              fill={active ? '#f5b73a' : 'transparent'}
              stroke={active ? '#f5b73a' : '#ffffff44'}
              strokeWidth={2}
            />
          </button>
        );
      })}
    </div>
  );
};

const ShieldPicker = ({ value, onChange }) => (
  <div className="flex gap-1">
    {[1, 2, 3].map(n => {
      const broken = n <= value;
      return (
        <button
          key={n}
          onClick={() => onChange(value === n ? 0 : n)}
          className="transition-all duration-200 active:scale-75 hover:scale-110 relative"
          style={{
            filter: broken ? 'drop-shadow(0 0 6px #ff584077)' : 'drop-shadow(0 0 4px #5fb4ff44)',
          }}
          aria-label={broken ? `Estrella ${n} perdida` : `Escudo ${n} intacto`}
        >
          <Shield
            size={20}
            fill={broken ? '#ff5840' : '#5fb4ff33'}
            stroke={broken ? '#ff5840' : '#5fb4ff'}
            strokeWidth={2}
          />
          {broken && (
            <span
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
              style={{ animation: 'cwl-crack 0.3s ease-out' }}
            >
              <X size={10} stroke="#fff" strokeWidth={3} />
            </span>
          )}
        </button>
      );
    })}
  </div>
);

const CrossedSwords = ({ size = 20, color = '#f5b73a' }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.5 17.5 L4 7 V4 H7 L17.5 14.5" />
    <path d="M13 19 L19 13" />
    <path d="M16 16 L20 20" />
    <path d="M9.5 17.5 L20 7 V4 H17 L6.5 14.5" />
    <path d="M11 19 L5 13" />
    <path d="M8 16 L4 20" />
  </svg>
);

const Embers = () => {
  const embers = useMemo(() => Array.from({ length: 20 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 14,
    duration: 9 + Math.random() * 10,
    size: 2 + Math.random() * 4,
    drift: -20 + Math.random() * 40,
  })), []);
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-10" aria-hidden="true">
      {embers.map(e => (
        <span
          key={e.id}
          className="absolute rounded-full"
          style={{
            left: `${e.left}%`,
            bottom: 0,
            width: e.size,
            height: e.size,
            background: 'radial-gradient(circle, #fbe18a 0%, #f5b73a 40%, #c8311a 80%, transparent 100%)',
            opacity: 0,
            animation: `cwl-ember ${e.duration}s linear ${e.delay}s infinite`,
            ['--drift']: `${e.drift}px`,
          }}
        />
      ))}
    </div>
  );
};

const Clouds = () => {
  const clouds = useMemo(() => Array.from({ length: 7 }, (_, i) => ({
    id: i,
    top: 2 + i * 6,
    duration: 38 + i * 18,
    delay: -(i * 9 + 3),
    width: 180 + i * 70,
    height: 50 + i * 18,
    opacity: 0.035 + i * 0.012,
  })), []);
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-[1]" aria-hidden="true">
      {clouds.map(c => (
        <div
          key={c.id}
          className="absolute"
          style={{
            top: `${c.top}%`,
            width: c.width,
            height: c.height,
            background: 'radial-gradient(ellipse 100% 60% at 50% 50%, rgba(255,255,255,0.9) 0%, rgba(200,220,255,0.4) 50%, transparent 100%)',
            opacity: c.opacity,
            filter: 'blur(14px)',
            animation: `cwl-cloud-drift ${c.duration}s linear ${c.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
};

// ----------------- Main App -----------------
export default function App() {
  const [loadStatus, setLoadStatus] = useState('loading');
  const [participants, setParticipants] = useState([]);
  const [data, setData] = useState({});
  const [view, setView] = useState('roster');
  const [selectedDay, setSelectedDay] = useState(1);
  const [newName, setNewName] = useState('');
  const [newTH, setNewTH] = useState(15);
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [tripleBurst, setTripleBurst] = useState(null);
  const [dragIndex, setDragIndex] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [pinError, setPinError] = useState('');

  const dragIndexRef = useRef(null);
  const participantsRef = useRef(participants);
  useEffect(() => { participantsRef.current = participants; }, [participants]);

  // Restore session
  useEffect(() => {
    const saved = api.loadPin();
    if (saved) setIsAdmin(true);
  }, []);

  useEffect(() => {
    const link = document.createElement('link');
    link.href =
      'https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600;700;800;900&family=Manrope:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;700&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    return () => { try { document.head.removeChild(link); } catch (e) {} };
  }, []);

  const loadState = useCallback(async () => {
    setLoadStatus('loading');
    try {
      const state = await api.fetchState();
      setParticipants(state.participants);
      setData(state.data);
      setLoadStatus('ready');
    } catch (e) {
      console.error('Could not load state', e);
      setLoadStatus('error');
    }
  }, []);

  useEffect(() => { loadState(); }, [loadState]);

  const pendingDayUpdates = useRef({});
  const flushTimer = useRef(null);

  const flushPending = useCallback(async () => {
    const updates = pendingDayUpdates.current;
    pendingDayUpdates.current = {};
    for (const key of Object.keys(updates)) {
      const [playerId, dayStr] = key.split('::');
      const day = Number(dayStr);
      try { await api.updateDay(playerId, day, updates[key]); }
      catch (e) { console.error('Failed to save day', e); }
    }
  }, []);

  useEffect(() => () => {
    if (flushTimer.current) clearTimeout(flushTimer.current);
    flushPending();
  }, [flushPending]);

  // ------------- actions -------------
  const addParticipant = async () => {
    const name = newName.trim();
    if (!name || participants.length >= 50) return;
    const id = `p_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const p = { id, name, th: newTH };
    setParticipants(prev => [...prev, p]);
    setData(prev => ({ ...prev, [id]: blankPlayerData() }));
    setNewName('');
    try { await api.addParticipant(p); } catch (e) { console.error(e); }
  };

  const removeParticipant = async (id) => {
    setParticipants(prev => prev.filter(p => p.id !== id));
    setData(prev => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
    setConfirmDelete(null);
    try { await api.deleteParticipant(id); } catch (e) { console.error(e); }
  };

  const updateDay = (playerId, day, patch) => {
    setData(prev => {
      const playerData = prev[playerId] || blankPlayerData();
      const dayData = playerData[day] || emptyDay();
      const merged = { ...dayData, ...patch };

      if ('attackStars' in patch && patch.attackStars === 3) merged.percent = 100;

      if ('attackStars' in patch) {
        merged.attacked = Number(merged.attackStars) > 0;
      }

      pendingDayUpdates.current[`${playerId}::${day}`] = merged;
      return { ...prev, [playerId]: { ...playerData, [day]: merged } };
    });

    if (flushTimer.current) clearTimeout(flushTimer.current);
    flushTimer.current = setTimeout(flushPending, 400);
  };

  const triggerTriple = (key) => {
    setTripleBurst(key);
    setTimeout(() => setTripleBurst(null), 700);
  };

  const handleLogin = async (pin) => {
    try {
      await api.auth(pin);
      api.setPin(pin);
      setIsAdmin(true);
      setPinModalOpen(false);
      setPinError('');
    } catch (e) {
      setPinError('PIN incorrecto, intenta de nuevo');
    }
  };

  const handleLogout = () => {
    api.clearPin();
    setIsAdmin(false);
  };

  const resetAll = async () => {
    setParticipants([]);
    setData({});
    setConfirmReset(false);
    try { await api.resetAll(); } catch (e) { console.error(e); }
  };

  // ------------- drag-and-drop -------------
  const handleDragStart = useCallback((index) => {
    dragIndexRef.current = index;
    setDragIndex(index);
  }, []);

  const handleDragOver = useCallback((e, index) => {
    e.preventDefault();
    const from = dragIndexRef.current;
    if (from === null || from === index) return;
    setParticipants(prev => {
      const list = [...prev];
      const [moved] = list.splice(from, 1);
      list.splice(index, 0, moved);
      return list;
    });
    dragIndexRef.current = index;
    setDragIndex(index);
  }, []);

  const handleDragEnd = useCallback(async () => {
    dragIndexRef.current = null;
    setDragIndex(null);
    try { await api.reorderParticipants(participantsRef.current.map(p => p.id)); }
    catch (e) { console.error(e); }
  }, []);

  // ------------- computed -------------
  const ranking = useMemo(() => {
    return participants
      .map(p => ({ ...p, ...computeTotals(data[p.id] || blankPlayerData()) }))
      .sort((a, b) => {
        if (b.total !== a.total) return b.total - a.total;
        if (b.atk !== a.atk) return b.atk - a.atk;
        return a.name.localeCompare(b.name);
      });
  }, [participants, data]);

  const clanTotals = useMemo(() => {
    let atk = 0, def = 0, attacks = 0, threes = 0;
    ranking.forEach(r => { atk += r.atk; def += r.def; attacks += r.attacks; threes += r.threeStars; });
    return { atk, def, total: atk + def, attacks, threes };
  }, [ranking]);

  const fontDisplay = { fontFamily: "'Cinzel', serif" };
  const fontBody = { fontFamily: "'Manrope', sans-serif" };
  const fontMono = { fontFamily: "'JetBrains Mono', monospace" };

  // ---- loading / error ----
  if (loadStatus === 'loading') {
    return (
      <div className="min-h-screen w-full flex items-center justify-center text-stone-100"
        style={{ ...fontBody, background: '#0a0608' }}>
        <div className="flex flex-col items-center gap-3 text-amber-300">
          <Loader2 size={36} className="animate-spin" />
          <div className="text-sm uppercase tracking-widest" style={fontDisplay}>Cargando guerra...</div>
        </div>
      </div>
    );
  }

  if (loadStatus === 'error') {
    return (
      <div className="min-h-screen w-full flex items-center justify-center text-stone-100 p-4"
        style={{ ...fontBody, background: '#0a0608' }}>
        <div className="text-center max-w-md">
          <CloudOff size={48} className="text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-amber-300 mb-2" style={fontDisplay}>No se pudo conectar al servidor</h2>
          <p className="text-stone-400 text-sm mb-5">
            Asegúrate de que el servidor esté corriendo en el puerto 3001.
            En la terminal, ejecuta <code className="bg-black/40 px-1.5 py-0.5 rounded text-amber-200" style={fontMono}>npm run dev</code>.
          </p>
          <button onClick={loadState} className="px-5 py-2.5 rounded font-bold uppercase tracking-wider text-sm text-stone-900"
            style={{ ...fontDisplay, background: 'linear-gradient(180deg, #fbe18a 0%, #f5b73a 50%, #c98e2c 100%)', boxShadow: '0 2px 0 #7a5012, 0 4px 14px rgba(245,183,58,0.25)' }}>
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  // ---- main UI ----
  return (
    <div className="min-h-screen w-full text-stone-100 relative" style={fontBody}>

      {/* ---- Background layers ---- */}
      <div className="fixed inset-0 z-0" style={{ backgroundColor: '#0a0608' }} />
      <div
        className="fixed inset-0 z-0"
        style={{
          backgroundImage: `url('${COC_BG}')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center 20%',
          backgroundRepeat: 'no-repeat',
        }}
      />
      <div
        className="fixed inset-0 z-0"
        style={{
          background: 'linear-gradient(to bottom, rgba(10,6,8,0.28) 0%, rgba(10,6,8,0.62) 28%, rgba(10,6,8,0.88) 56%, rgba(10,6,8,1) 78%)',
        }}
      />

      <style>{`
        @keyframes cwl-ember {
          0%   { transform: translateY(0) translateX(0); opacity: 0; }
          10%  { opacity: 0.9; }
          90%  { opacity: 0.45; }
          100% { transform: translateY(-115vh) translateX(var(--drift)); opacity: 0; }
        }
        @keyframes cwl-cloud-drift {
          from { transform: translateX(-25vw); }
          to   { transform: translateX(125vw); }
        }
        @keyframes cwl-star-pop {
          0%   { transform: scale(0.4) rotate(-30deg); }
          70%  { transform: scale(1.25) rotate(10deg); }
          100% { transform: scale(1) rotate(0); }
        }
        @keyframes cwl-crack {
          0%   { transform: scale(0); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes cwl-pulse-gold {
          0%, 100% { box-shadow: 0 0 16px rgba(245,183,58,0.45), 0 2px 0 #7a5012; }
          50%       { box-shadow: 0 0 36px rgba(245,183,58,0.85), 0 2px 0 #7a5012; }
        }
        @keyframes cwl-shimmer {
          0%   { background-position: -200% 50%; }
          100% { background-position: 200% 50%; }
        }
        @keyframes cwl-fade-up {
          0%   { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes cwl-medal-float {
          0%, 100% { transform: translateY(0) rotate(-3deg); }
          50%       { transform: translateY(-4px) rotate(3deg); }
        }
        @keyframes cwl-burst {
          0%   { transform: scale(0.2); opacity: 1; }
          100% { transform: scale(2.6); opacity: 0; }
        }
        @keyframes cwl-flicker {
          0%, 100% { opacity: 1; }
          47% { opacity: 1; }
          50% { opacity: 0.65; }
          53% { opacity: 1; }
        }
        @keyframes cwl-banner-slide {
          0%   { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }
        @keyframes cwl-logo-float {
          0%, 100% { transform: translateY(0px) rotate(-1deg); }
          50%       { transform: translateY(-5px) rotate(1deg); }
        }
        .cwl-fade-up  { animation: cwl-fade-up 0.45s ease-out both; }
        .cwl-pulse-gold { animation: cwl-pulse-gold 2.4s ease-in-out infinite; }
        .cwl-medal    { animation: cwl-medal-float 3s ease-in-out infinite; }
        .cwl-logo     { animation: cwl-logo-float 5s ease-in-out infinite; }
        .cwl-dragging { opacity: 0.38; transform: scale(0.98); }
        .cwl-drag-target {
          border-color: #f5b73a99 !important;
          box-shadow: 0 0 0 1px #f5b73a55 !important;
        }
      `}</style>

      <Embers />
      <Clouds />

      {/* Top shimmer bar */}
      <div
        className="fixed top-0 left-0 right-0 z-20 h-[3px]"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, #8a1c0d 15%, #c8311a 30%, #f5b73a 50%, #c8311a 70%, #8a1c0d 85%, transparent 100%)',
          backgroundSize: '200% 100%',
          animation: 'cwl-banner-slide 6s linear infinite, cwl-flicker 4.5s ease-in-out infinite',
        }}
      />

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-8 pt-7">

        {/* Header */}
        <header className="mb-7 cwl-fade-up">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-4">
              <img
                src={COC_LOGO}
                alt="Clash of Clans"
                className="cwl-logo"
                style={{
                  height: 80,
                  filter: 'drop-shadow(0 4px 20px rgba(245,183,58,0.6)) drop-shadow(0 2px 8px rgba(0,0,0,0.9))',
                }}
                onError={e => { e.currentTarget.style.display = 'none'; }}
              />
              <div>
                <div className="flex items-center gap-2 text-amber-400/80 text-xs tracking-[0.3em] uppercase mb-1">
                  <Crown size={13} />
                  <span>Clan War Leagues</span>
                </div>
                <h1
                  className="text-3xl sm:text-4xl font-extrabold leading-none"
                  style={{
                    ...fontDisplay,
                    background: 'linear-gradient(180deg, #fbe18a 0%, #f5b73a 50%, #b07020 100%)',
                    backgroundSize: '200% 200%',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    animation: 'cwl-shimmer 6s linear infinite',
                  }}
                >
                  Tracker de Estrellas
                </h1>
                <p className="text-stone-400 text-sm mt-1">
                  Premia el ataque y la defensa. Que gane el más completo.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isAdmin ? (
                <button
                  onClick={handleLogout}
                  className="text-xs uppercase tracking-widest text-amber-400 hover:text-amber-200 transition-colors flex items-center gap-1.5 border border-amber-700/50 hover:border-amber-500 px-3 py-2 rounded"
                  title="Salir del modo edición"
                >
                  <Unlock size={12} />
                  <span className="hidden sm:inline">Editor</span>
                </button>
              ) : (
                <button
                  onClick={() => { setPinError(''); setPinModalOpen(true); }}
                  className="text-xs uppercase tracking-widest text-stone-500 hover:text-amber-400 transition-colors flex items-center gap-1.5 border border-stone-700 hover:border-amber-700 px-3 py-2 rounded"
                  title="Entrar al modo edición"
                >
                  <Lock size={12} />
                  <span className="hidden sm:inline">Espectador</span>
                </button>
              )}
              {isAdmin && (
                <button
                  onClick={() => setConfirmReset(true)}
                  disabled={participants.length === 0}
                  className="text-xs uppercase tracking-widest text-stone-500 hover:text-red-400 disabled:opacity-30 transition-colors flex items-center gap-1.5 border border-stone-700 hover:border-red-900 px-3 py-2 rounded"
                >
                  <Flame size={12} />
                  <span className="hidden sm:inline">Reiniciar</span>
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Nav */}
        <nav className="flex gap-1 mb-6 border-b border-amber-900/40 cwl-fade-up" style={{ animationDelay: '0.05s' }}>
          {[
            { key: 'roster', label: 'Roster', icon: Users },
            { key: 'input', label: 'Registrar día', icon: Calendar },
            { key: 'ranking', label: 'Ranking', icon: Trophy },
          ].map(tab => {
            const Icon = tab.icon;
            const active = view === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setView(tab.key)}
                className={`relative px-4 py-3 text-sm font-semibold uppercase tracking-wider flex items-center gap-2 transition-colors ${
                  active ? 'text-amber-300' : 'text-stone-500 hover:text-stone-300'
                }`}
                style={fontDisplay}
              >
                <Icon size={16} />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
                {active && (
                  <span
                    className="absolute bottom-[-1px] left-0 right-0 h-[2px]"
                    style={{ background: 'linear-gradient(90deg, transparent, #f5b73a, transparent)' }}
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* ---- Roster view ---- */}
        {view === 'roster' && (
          <section key="roster" className="cwl-fade-up">
            {!isAdmin && (
              <div className="flex items-center gap-2 text-stone-500 text-xs border border-stone-800 rounded-lg px-4 py-3 mb-4"
                style={{ background: 'rgba(20,10,8,0.5)', backdropFilter: 'blur(4px)' }}>
                <Eye size={13} />
                Modo espectador — ingresa el PIN para editar
                <button onClick={() => { setPinError(''); setPinModalOpen(true); }}
                  className="ml-auto text-amber-500 hover:text-amber-300 transition-colors flex items-center gap-1">
                  <Lock size={12} /> Entrar
                </button>
              </div>
            )}
            <div
              className="rounded-xl border border-amber-900/40 p-4 sm:p-5 mb-6 relative overflow-hidden"
              style={{
                background: 'linear-gradient(180deg, rgba(50,26,16,0.75) 0%, rgba(20,10,8,0.8) 100%)',
                backdropFilter: 'blur(8px)',
                display: isAdmin ? 'block' : 'none',
              }}
            >
              <div className="absolute -top-5 -right-5 opacity-[0.07] pointer-events-none">
                <CrossedSwords size={96} />
              </div>
              <h2 className="text-amber-300 text-sm font-bold uppercase tracking-widest mb-3 flex items-center gap-2 relative" style={fontDisplay}>
                <Plus size={16} /> Reclutar guerrero
              </h2>
              <div className="flex flex-col sm:flex-row gap-3 relative">
                <input
                  type="text"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addParticipant()}
                  placeholder="Nombre del jugador"
                  className="flex-1 bg-black/50 border border-stone-700 focus:border-amber-500 focus:outline-none rounded px-3 py-2.5 text-stone-100 placeholder-stone-600"
                />
                <div className="flex gap-3">
                  <select
                    value={newTH}
                    onChange={e => setNewTH(Number(e.target.value))}
                    className="bg-black/50 border border-stone-700 focus:border-amber-500 focus:outline-none rounded px-3 py-2.5 text-stone-100"
                  >
                    {TH_LEVELS.map(th => <option key={th} value={th}>TH {th}</option>)}
                  </select>
                  <button
                    onClick={addParticipant}
                    disabled={!newName.trim()}
                    className="px-5 py-2.5 rounded font-bold uppercase tracking-wider text-sm text-stone-900 disabled:opacity-30 disabled:cursor-not-allowed transition-transform hover:scale-[1.04] active:scale-95"
                    style={{
                      ...fontDisplay,
                      background: 'linear-gradient(180deg, #fbe18a 0%, #f5b73a 50%, #c98e2c 100%)',
                      boxShadow: '0 2px 0 #7a5012, 0 4px 14px rgba(245,183,58,0.28)',
                    }}
                  >
                    Agregar
                  </button>
                </div>
              </div>
            </div>

            {participants.length === 0 ? (
              <EmptyState icon={Users} title="Sin guerreros aún" msg="Agrega los participantes de tu CWL arriba para empezar." />
            ) : (
              <div className="grid gap-2">
                <div className="text-xs text-stone-500 uppercase tracking-wider px-2 mb-1 flex items-center gap-2">
                  {isAdmin && <GripVertical size={12} className="opacity-50" />}
                  {participants.length} {participants.length === 1 ? 'participante' : 'participantes'}
                  {isAdmin && ' · arrastra para reordenar'}
                </div>
                {participants.map((p, idx) => (
                  <div
                    key={p.id}
                    draggable={isAdmin}
                    onDragStart={isAdmin ? () => handleDragStart(idx) : undefined}
                    onDragOver={isAdmin ? e => handleDragOver(e, idx) : undefined}
                    onDragEnd={isAdmin ? handleDragEnd : undefined}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg border transition-all cwl-fade-up ${
                      isAdmin ? 'select-none' : ''
                    } ${dragIndex === idx ? 'cwl-dragging cwl-drag-target' : 'hover:translate-x-1'}`}
                    style={{
                      animationDelay: `${idx * 0.03}s`,
                      background: 'linear-gradient(90deg, rgba(40,22,14,0.75) 0%, rgba(20,10,8,0.7) 100%)',
                      borderColor: dragIndex === idx ? '#f5b73a88' : '#2a2421',
                      backdropFilter: 'blur(4px)',
                      cursor: isAdmin ? 'grab' : 'default',
                    }}
                  >
                    {isAdmin && (
                      <div className="text-stone-600 hover:text-amber-500/60 transition-colors cursor-grab shrink-0">
                        <GripVertical size={16} />
                      </div>
                    )}
                    <div className="text-stone-500 font-bold w-6 text-right shrink-0" style={fontMono}>
                      {String(idx + 1).padStart(2, '0')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-stone-100 truncate">{p.name}</div>
                    </div>
                    <div
                      className="px-2.5 py-1 rounded text-xs font-bold border border-amber-700/40 text-amber-300 shrink-0"
                      style={{ ...fontMono, background: 'rgba(245,183,58,0.08)' }}
                    >
                      TH {p.th}
                    </div>
                    {isAdmin && (
                      <button
                        onClick={() => setConfirmDelete(p)}
                        className="text-stone-600 hover:text-red-400 transition-colors p-1 shrink-0"
                        aria-label="Eliminar"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* ---- Input day view ---- */}
        {view === 'input' && (
          <section key="input" className="cwl-fade-up">
            {participants.length === 0 ? (
              <EmptyState icon={Calendar} title="Necesitas guerreros" msg='Ve a la pestaña "Roster" y agrega participantes primero.' />
            ) : (
              <>
                <div className="flex items-center justify-between mb-5">
                  <button
                    onClick={() => setSelectedDay(Math.max(1, selectedDay - 1))}
                    disabled={selectedDay === 1}
                    className="p-2 rounded border border-stone-700 hover:border-amber-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <div className="flex items-center gap-2">
                    {DAYS.map(d => {
                      const active = selectedDay === d;
                      return (
                        <button
                          key={d}
                          onClick={() => setSelectedDay(d)}
                          className={`w-10 h-10 rounded-full text-sm font-bold transition-all ${
                            active
                              ? 'text-stone-900 scale-110 cwl-pulse-gold'
                              : 'text-stone-500 hover:text-stone-300 border border-stone-700 hover:border-amber-700'
                          }`}
                          style={
                            active
                              ? { ...fontDisplay, background: 'linear-gradient(180deg, #fbe18a 0%, #f5b73a 50%, #c98e2c 100%)' }
                              : fontDisplay
                          }
                        >
                          {d}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => setSelectedDay(Math.min(7, selectedDay + 1))}
                    disabled={selectedDay === 7}
                    className="p-2 rounded border border-stone-700 hover:border-amber-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>

                <div className="text-center mb-5">
                  <div className="inline-flex items-center gap-2 text-amber-200 text-xs uppercase tracking-[0.3em]" style={fontDisplay}>
                    <CrossedSwords size={14} color="#f5b73a" />
                    Día {selectedDay} de 7
                    <CrossedSwords size={14} color="#f5b73a" />
                  </div>
                </div>

                <div className="flex items-center justify-center gap-6 text-[11px] text-stone-500 mb-4 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <Shield size={12} fill="#5fb4ff" stroke="#5fb4ff" />
                    <span>Estrellas que te quitaron</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Star size={12} fill="#f5b73a" stroke="#f5b73a" />
                    <span>Estrellas de ataque</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <GripVertical size={12} className="opacity-60" />
                    <span>Arrastra para reordenar</span>
                  </div>
                </div>

                <div className="space-y-2">
                  {participants.map((p, i) => {
                    const day = (data[p.id] && data[p.id][selectedDay]) || emptyDay();
                    const burstKey = `${p.id}-${selectedDay}`;
                    return (
                      <DayRow
                        key={p.id}
                        index={i}
                        player={p}
                        day={day}
                        showBurst={tripleBurst === burstKey}
                        onChange={(patch) => updateDay(p.id, selectedDay, patch)}
                        onTriple={() => triggerTriple(burstKey)}
                        isDragging={dragIndex === i}
                        onDragStart={() => handleDragStart(i)}
                        onDragOver={e => handleDragOver(e, i)}
                        onDragEnd={handleDragEnd}
                        editable={isAdmin}
                      />
                    );
                  })}
                </div>
              </>
            )}
          </section>
        )}

        {/* ---- Ranking view ---- */}
        {view === 'ranking' && (
          <section key="ranking" className="cwl-fade-up">
            {participants.length === 0 ? (
              <EmptyState icon={Trophy} title="Aún no hay ranking" msg="Agrega participantes y registra ataques para ver el ranking." />
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-6">
                  <SummaryCard label="Total estrellas" value={clanTotals.total} icon={Star} accent="#f5b73a" />
                  <SummaryCard label="Defensa" value={clanTotals.def} icon={Shield} accent="#5fb4ff" />
                  <SummaryCard label="Ataque" value={clanTotals.atk} icon={Sword} accent="#ff7a42" />
                  <SummaryCard label="Triples" value={clanTotals.threes} icon={Zap} accent="#ffe06a" />
                </div>
                <div className="space-y-2">
                  {ranking.map((r, idx) => (
                    <RankRow key={r.id} entry={r} rank={idx + 1} index={idx} />
                  ))}
                </div>
                <p className="text-stone-500 text-xs mt-6 text-center">
                  Orden: estrellas totales → ataque → nombre
                </p>
              </>
            )}
          </section>
        )}
      </div>

      {/* PIN modal */}
      {pinModalOpen && (
        <PinModal
          error={pinError}
          onSubmit={handleLogin}
          onClose={() => { setPinModalOpen(false); setPinError(''); }}
          fontDisplay={fontDisplay}
          fontMono={fontMono}
        />
      )}

      {/* Modals */}
      {confirmReset && (
        <Modal onClose={() => setConfirmReset(false)}>
          <div className="text-amber-400 mb-3"><AlertTriangle size={32} /></div>
          <h3 className="text-xl font-bold mb-2" style={fontDisplay}>¿Reiniciar toda la liga?</h3>
          <p className="text-stone-400 mb-5 text-sm">
            Se borrarán todos los participantes y registros de los 7 días. Esta acción no se puede deshacer.
          </p>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setConfirmReset(false)} className="px-4 py-2 rounded border border-stone-600 text-stone-300 hover:border-stone-400 text-sm uppercase tracking-wider" style={fontDisplay}>Cancelar</button>
            <button onClick={resetAll} className="px-4 py-2 rounded text-white text-sm uppercase tracking-wider font-bold" style={{ ...fontDisplay, background: 'linear-gradient(180deg, #c8311a 0%, #8a1c0d 100%)' }}>Reiniciar</button>
          </div>
        </Modal>
      )}

      {confirmDelete && (
        <Modal onClose={() => setConfirmDelete(null)}>
          <div className="text-amber-400 mb-3"><AlertTriangle size={32} /></div>
          <h3 className="text-xl font-bold mb-2" style={fontDisplay}>¿Eliminar a {confirmDelete.name}?</h3>
          <p className="text-stone-400 mb-5 text-sm">
            Se borrarán también todos sus registros de ataque y defensa.
          </p>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setConfirmDelete(null)} className="px-4 py-2 rounded border border-stone-600 text-stone-300 hover:border-stone-400 text-sm uppercase tracking-wider" style={fontDisplay}>Cancelar</button>
            <button onClick={() => removeParticipant(confirmDelete.id)} className="px-4 py-2 rounded text-white text-sm uppercase tracking-wider font-bold" style={{ ...fontDisplay, background: 'linear-gradient(180deg, #c8311a 0%, #8a1c0d 100%)' }}>Eliminar</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ----------------- subcomponents -----------------

const DayRow = ({ player, day, onChange, onTriple, showBurst, index, isDragging, onDragStart, onDragOver, onDragEnd, editable = true }) => {
  const fontMono = { fontFamily: "'JetBrains Mono', monospace" };
  const hasData = day.attacked || day.starsLost > 0;
  const isPerfect = day.attackStars === 3;

  return (
    <div
      draggable={editable}
      onDragStart={editable ? onDragStart : undefined}
      onDragOver={editable ? onDragOver : undefined}
      onDragEnd={editable ? onDragEnd : undefined}
      className={`rounded-lg border transition-all p-3 sm:p-4 relative cwl-fade-up ${editable ? 'select-none' : ''} ${
        isDragging ? 'cwl-dragging cwl-drag-target' : ''
      }`}
      style={{
        animationDelay: `${index * 0.04}s`,
        background: hasData
          ? 'linear-gradient(90deg, rgba(60,40,20,0.75) 0%, rgba(20,10,8,0.7) 100%)'
          : 'linear-gradient(90deg, rgba(40,22,14,0.7) 0%, rgba(20,10,8,0.65) 100%)',
        borderColor: isPerfect ? '#f5b73a66' : hasData ? '#7a501266' : '#2a2421',
        boxShadow: isPerfect ? '0 0 22px rgba(245,183,58,0.22)' : 'none',
        backdropFilter: 'blur(5px)',
        cursor: editable ? 'grab' : 'default',
      }}
    >
      {showBurst && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center" style={{ zIndex: 5 }}>
          {[0, 60, 120, 180, 240, 300].map((deg, i) => (
            <span
              key={i}
              className="absolute"
              style={{
                width: 6, height: 6, borderRadius: '50%',
                background: 'radial-gradient(circle, #fbe18a, #f5b73a 50%, transparent)',
                animation: 'cwl-burst 0.7s ease-out forwards',
                transform: `rotate(${deg}deg) translateY(-30px)`,
                transformOrigin: 'center',
              }}
            />
          ))}
          <Sparkles size={32} className="text-amber-300" style={{ animation: 'cwl-burst 0.7s ease-out forwards', filter: 'drop-shadow(0 0 12px #f5b73a)' }} />
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3 sm:gap-4">
        {/* Drag handle */}
        {editable && (
          <div className="text-stone-600 cursor-grab shrink-0">
            <GripVertical size={15} />
          </div>
        )}

        {/* Player name */}
        <div className="min-w-0 flex-1 sm:flex-initial sm:w-40">
          <div className="font-bold text-stone-100 truncate flex items-center gap-1.5">
            {player.name}
            {isPerfect && <Sparkles size={12} className="text-amber-400" />}
          </div>
          <div className="text-xs text-amber-400/80" style={fontMono}>TH {player.th}</div>
        </div>

        {/* Defense FIRST (izquierda) */}
        <div className={`flex items-center gap-2 ${!editable ? 'pointer-events-none opacity-70' : ''}`}>
          <Shield size={14} className="text-blue-400/70" />
          <ShieldPicker value={day.starsLost} onChange={(v) => onChange({ starsLost: v })} />
        </div>

        {/* Attack SECOND (derecha) */}
        <div className={`flex items-center gap-2 ${!editable ? 'pointer-events-none opacity-70' : ''}`}>
          <Sword size={14} className="text-orange-400/70" />
          <StarPicker value={day.attackStars} onChange={(v) => onChange({ attackStars: v })} onTriple={onTriple} />
        </div>
      </div>
    </div>
  );
};

const RankRow = ({ entry, rank, index }) => {
  const fontMono = { fontFamily: "'JetBrains Mono', monospace" };
  const fontDisplay = { fontFamily: "'Cinzel', serif" };

  const podium = rank <= 3;
  const podiumColors = {
    1: { bg: 'linear-gradient(90deg, rgba(245,183,58,0.25) 0%, rgba(40,22,14,0.55) 60%)', border: '#f5b73a', text: '#fbe18a', label: '#f5b73a' },
    2: { bg: 'linear-gradient(90deg, rgba(190,190,210,0.18) 0%, rgba(40,22,14,0.55) 60%)', border: '#c0c2cc', text: '#e6e8ee', label: '#c0c2cc' },
    3: { bg: 'linear-gradient(90deg, rgba(184,115,51,0.22) 0%, rgba(40,22,14,0.55) 60%)', border: '#b87333', text: '#e3aa78', label: '#b87333' },
  };
  const style = podiumColors[rank];

  return (
    <div
      className="rounded-lg p-3 sm:p-4 transition-all cwl-fade-up hover:translate-x-1"
      style={{
        animationDelay: `${index * 0.05}s`,
        background: podium ? style.bg : 'linear-gradient(90deg, rgba(40,22,14,0.65) 0%, rgba(20,10,8,0.6) 100%)',
        border: `1px solid ${podium ? style.border + '88' : '#2a2421'}`,
        boxShadow: podium ? `0 0 30px ${style.border}33` : 'none',
        backdropFilter: 'blur(5px)',
      }}
    >
      <div className="flex items-center gap-3 sm:gap-4">
        <div className="w-10 sm:w-12 text-center" style={{ ...fontDisplay, color: podium ? style.label : '#78716c' }}>
          {podium ? (
            <Medal size={28} className="mx-auto cwl-medal" style={{ color: style.label, filter: `drop-shadow(0 0 8px ${style.label}66)` }} fill={style.label + '33'} />
          ) : (
            <span className="text-xl font-bold">{rank}</span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="font-bold truncate" style={{ ...fontDisplay, fontSize: podium ? '1.05rem' : '1rem', color: podium ? style.text : '#f5f5f4' }}>
            {entry.name}
          </div>
          <div className="flex items-center flex-wrap gap-x-3 gap-y-0.5 text-xs text-stone-500 mt-0.5" style={fontMono}>
            <span>TH {entry.th}</span>
            <span>{entry.attacks}/7 ataques</span>
            {entry.threeStars > 0 && (
              <span className="text-amber-400 flex items-center gap-1">
                <Sparkles size={10} /> {entry.threeStars} triple{entry.threeStars > 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>

        {/* Defense first, then attack */}
        <div className="flex items-center gap-3 sm:gap-4">
          <Stat icon={Shield} value={entry.def} color="#5fb4ff" />
          <Stat icon={Sword} value={entry.atk} color="#ff7a42" />
          <div className="text-right">
            <div
              className="text-2xl sm:text-3xl font-extrabold leading-none"
              style={{
                ...fontDisplay,
                background: podium
                  ? `linear-gradient(180deg, ${style.text} 0%, ${style.label} 100%)`
                  : 'linear-gradient(180deg, #fbe18a 0%, #f5b73a 50%, #b07020 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {entry.total}
            </div>
            <div className="text-[10px] uppercase tracking-widest text-stone-500 mt-0.5">total</div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Stat = ({ icon: Icon, value, color }) => (
  <div className="flex flex-col items-center min-w-[2.5rem]">
    <Icon size={16} style={{ color }} />
    <div className="text-base font-bold mt-0.5" style={{ color, fontFamily: "'JetBrains Mono', monospace" }}>{value}</div>
  </div>
);

const SummaryCard = ({ label, value, icon: Icon, accent }) => (
  <div
    className="rounded-lg border p-3 sm:p-4 transition-all hover:scale-[1.02]"
    style={{
      borderColor: accent + '44',
      background: `linear-gradient(180deg, ${accent}13 0%, rgba(20,10,8,0.75) 100%)`,
      backdropFilter: 'blur(6px)',
    }}
  >
    <div className="flex items-center gap-2 text-xs uppercase tracking-wider mb-1" style={{ color: accent }}>
      <Icon size={14} />
      <span className="opacity-80">{label}</span>
    </div>
    <div className="text-2xl sm:text-3xl font-extrabold" style={{ color: accent, fontFamily: "'Cinzel', serif" }}>{value}</div>
  </div>
);

const EmptyState = ({ icon: Icon, title, msg }) => (
  <div
    className="rounded-lg border border-stone-800 p-10 text-center cwl-fade-up"
    style={{ background: 'linear-gradient(180deg, rgba(40,22,14,0.5) 0%, rgba(20,10,8,0.55) 100%)', backdropFilter: 'blur(5px)' }}
  >
    <Icon size={36} className="mx-auto text-stone-600 mb-3" />
    <div className="text-lg font-bold text-stone-300 mb-1" style={{ fontFamily: "'Cinzel', serif" }}>{title}</div>
    <div className="text-sm text-stone-500">{msg}</div>
  </div>
);

const PinModal = ({ error, onSubmit, onClose, fontDisplay, fontMono }) => {
  const [pin, setPin] = useState('');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.78)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="relative max-w-xs w-full rounded-xl border border-amber-900/40 p-6"
        style={{ background: 'linear-gradient(180deg, #2a1810 0%, #14090a 100%)', boxShadow: '0 24px 70px rgba(0,0,0,0.85)', animation: 'cwl-fade-up 0.25s ease-out' }}>
        <button onClick={onClose} className="absolute top-3 right-3 text-stone-500 hover:text-stone-200"><X size={18} /></button>
        <div className="flex items-center gap-2 text-amber-400 mb-4">
          <Lock size={22} />
          <h3 className="text-lg font-bold" style={fontDisplay}>Modo edición</h3>
        </div>
        <p className="text-stone-400 text-sm mb-4">Ingresa el PIN para desbloquear la edición.</p>
        <input
          type="password"
          value={pin}
          onChange={e => setPin(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && pin && onSubmit(pin)}
          placeholder="PIN"
          autoFocus
          className="w-full bg-black/50 border border-stone-700 focus:border-amber-500 focus:outline-none rounded px-3 py-2.5 text-stone-100 placeholder-stone-600 mb-2 text-center tracking-widest text-lg"
          style={fontMono}
        />
        {error && <p className="text-red-400 text-xs mb-3 text-center">{error}</p>}
        <button
          onClick={() => pin && onSubmit(pin)}
          disabled={!pin}
          className="w-full py-2.5 rounded font-bold uppercase tracking-wider text-sm text-stone-900 disabled:opacity-30 mt-1 transition-transform hover:scale-[1.02] active:scale-95"
          style={{ ...fontDisplay, background: 'linear-gradient(180deg, #fbe18a 0%, #f5b73a 50%, #c98e2c 100%)', boxShadow: '0 2px 0 #7a5012' }}
        >
          Desbloquear
        </button>
      </div>
    </div>
  );
};

const Modal = ({ children, onClose }) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center p-4"
    style={{ background: 'rgba(0,0,0,0.78)', backdropFilter: 'blur(6px)' }}
    onClick={onClose}
  >
    <div
      onClick={e => e.stopPropagation()}
      className="relative max-w-sm w-full rounded-xl border border-amber-900/40 p-6"
      style={{
        background: 'linear-gradient(180deg, #2a1810 0%, #14090a 100%)',
        boxShadow: '0 24px 70px rgba(0,0,0,0.85)',
        animation: 'cwl-fade-up 0.25s ease-out',
      }}
    >
      <button onClick={onClose} className="absolute top-3 right-3 text-stone-500 hover:text-stone-200">
        <X size={18} />
      </button>
      {children}
    </div>
  </div>
);
