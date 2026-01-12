import { useState, useEffect } from "react";
import { auth, db, collection, onSnapshot, doc } from "../services/firebase";
import { Link, useNavigate } from "react-router-dom";
import {
    AreaChart, Area, XAxis, Tooltip, ResponsiveContainer
} from "recharts";
import {
    Zap, Flame, Shuffle, Twitter,
    Image as ImageIcon, Lightbulb, Video,
    ArrowRight, Sparkles, Star
} from "lucide-react";

/* ================= APPLE STYLE SYSTEM ================= */

const dashboardStyles = `
:root {
  --bg: #0a0118; /* Deep purple-black background */
  --panel: rgba(255, 255, 255, 0.05); /* Slightly lighter glass */
  --border: rgba(139, 92, 246, 0.15); /* Purple-tinted border */
  --muted: #a78bfa; /* Light purple muted text */
  --accent: #7c3aed; /* Vibrante purple accent */
  --ease: cubic-bezier(0.25,0.1,0.25,1);
}

@keyframes ticker { 0% { transform: translateX(100%); } 100% { transform: translateX(-100%); } }

.dashboard-wrapper {
  min-height: 100vh;
  width: 100%;
  background: radial-gradient(circle at top, #1e0938 0%, #05010a 100%);
  display: grid;
  grid-template-rows: auto 1fr;
  align-items: center; /* Vertical center of grid content */
  justify-items: center; /* Horizontal center */
}

/* Ensure Ticker spans full width */
.dashboard-wrapper > :first-child {
  width: 100%;
  grid-row: 1;
}

.premium-container {
  grid-row: 2;
  max-width: 920px;
  width: 100%;
  padding: 20px 24px 60px;
  color: white;
  font-family: -apple-system, BlinkMacSystemFont, Inter, sans-serif;
  display: flex;
  flex-direction: column;
  justify-content: center;
}



/* ===== HUD ===== */

.hud-strip {
  display: flex;
  gap: 48px;
  padding: 28px 40px;
  border-radius: 999px;
  background: rgba(15, 5, 30, 0.6); /* Darker pill background */
  border: 1px solid var(--border);
  margin-bottom: 72px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}

.hud-item {
  display: flex;
  gap: 14px;
  align-items: center;
}

.hud-value {
  font-size: 1.8rem;
  font-weight: 600;
  text-shadow: 0 0 20px rgba(124, 58, 237, 0.3); /* Subtle glow */
}

.hud-label {
  font-size: 0.75rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--muted);
}

/* ===== ACTION GRID ===== */

.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px,1fr));
  gap: 24px;
  margin-bottom: 80px;
}

.action-card {
  padding: 28px;
  border-radius: 24px;
  background: linear-gradient(145deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%);
  border: 1px solid var(--border);
  text-decoration: none;
  color: white;
  transition: all 0.3s var(--ease);
  position: relative;
  overflow: hidden;
}

.action-card:hover {
  transform: translateY(-5px);
  background: linear-gradient(145deg, rgba(124, 58, 237, 0.15) 0%, rgba(20, 5, 40, 0.4) 100%);
  border-color: rgba(124, 58, 237, 0.3);
  box-shadow: 0 10px 40px rgba(124, 58, 237, 0.15);
}

.action-card:active {
  transform: scale(0.98);
}

.card-icon {
  opacity: 1;
  margin-bottom: 20px;
  color: #c4b5fd; /* Light violet icon */
}

.action-card:hover .card-icon {
  color: #fff;
  filter: drop-shadow(0 0 8px rgba(167, 139, 250, 0.6));
}

.card-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 4px;
}

.card-sub {
  font-size: 0.85rem;
  color: var(--muted);
}

/* ===== SECONDARY ===== */

.secondary-section {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 32px;
}

.chart-box {
  padding: 24px;
  border-radius: 24px;
  background: rgba(15, 5, 30, 0.4);
  border: 1px solid var(--border);
}

.surprise-box {
  padding: 28px;
  border-radius: 24px;
  background: linear-gradient(135deg, rgba(124, 58, 237, 0.1), rgba(167, 139, 250, 0.05));
  border: 1px solid var(--border);
  cursor: pointer;
  transition: all 0.3s var(--ease);
  position: relative;
  overflow: hidden;
}

.surprise-box::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(45deg, transparent, rgba(255,255,255,0.1), transparent);
  transform: translateX(-100%);
  transition: 0.5s;
}

.surprise-box:hover::before {
  transform: translateX(100%);
}

.surprise-box:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 30px rgba(124, 58, 237, 0.1);
  border-color: rgba(167, 139, 250, 0.3);
}

/* ===== MOBILE ===== */

@media (max-width: 768px) {
  .hero-greeting { font-size: 2.4rem; }
  .hud-strip { flex-direction: column; gap: 20px; }
  .secondary-section { grid-template-columns: 1fr; }

/* ===== TRENDING ===== */

.trending-box {
  padding: 24px;
  border-radius: 24px;
  background: var(--panel);
  border: 1px solid var(--border);
  height: 100%;
  display: flex;
  flex-direction: column;
}

.trending-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.trending-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  border-radius: 16px;
  background: linear-gradient(145deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%);
  border: 1px solid rgba(255,255,255,0.05);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  position: relative;
  overflow: hidden;
}

.trending-item:hover {
  background: linear-gradient(145deg, rgba(124, 58, 237, 0.1) 0%, rgba(255,255,255,0.05) 100%);
  border-color: rgba(124, 58, 237, 0.3);
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(0,0,0,0.2);
}

.t-icon {
  font-size: 1.2rem;
  width: 42px;
  height: 42px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(124, 58, 237, 0.4), rgba(76, 29, 149, 0.4));
  border-radius: 12px;
  color: #fff;
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
  border: 1px solid rgba(255,255,255,0.1);
}

.t-title {
  font-size: 0.95rem;
  font-weight: 600;
  color: white;
  margin-bottom: 2px;
  letter-spacing: -0.01em;
}

.t-sub {
  font-size: 0.8rem;
  color: #d1d5db;
  font-weight: 400;
}

.t-arrow {
  margin-left: auto;
  opacity: 0.5;
  transition: all 0.3s;
  color: var(--muted);
  transform: translateX(-5px);
}

.trending-item:hover .t-arrow {
  opacity: 1;
  color: white;
  transform: translateX(0);
}
`;

/* ================= UI ================= */

const Ticker = () => (
    <div style={{ width: '100%', overflow: 'hidden', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: '40px', background: 'rgba(0,0,0,0.2)' }}>
        <div style={{
            display: 'inline-flex', whiteSpace: 'nowrap', animation: 'ticker 60s linear infinite', gap: '60px',
            color: '#a78bfa', fontSize: '0.85rem', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.05em'
        }}>
            {[1, 2, 3].map(i => (
                <div key={i} style={{ display: 'flex', gap: '60px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Sparkles size={14} color="#CE93D8" /> New AI Model V2.0 Live</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Zap size={14} color="#fbbf24" /> Speed Optimized</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Star size={14} color="#64748b" /> Pro Tips Available in Guide</span>
                </div>
            ))}
        </div>
    </div>
);

const HudStat = ({ icon: Icon, label, value }) => (
    <div className="hud-item">
        <Icon size={20} />
        <div>
            <div className="hud-label">{label}</div>
            <div className="hud-value">{value}</div>
        </div>
    </div>
);

const ActionCard = ({ icon: Icon, label, to }) => (
    <Link to={to} className="action-card">
        <div className="card-icon"><Icon size={22} /></div>
        <div className="card-title">{label}</div>
        <div className="card-sub">Create new</div>
    </Link>
);

const ChartWidget = ({ usageData }) => (
    <div className="chart-box">
        <h3 style={{ fontSize: "0.9rem", marginBottom: 16 }}>Activity</h3>
        <ResponsiveContainer width="100%" height={140}>
            <AreaChart data={usageData}>
                <defs>
                    <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#7c4dff" stopOpacity={0.2} />
                        <stop offset="100%" stopColor="#7c4dff" stopOpacity={0} />
                    </linearGradient>
                </defs>
                <XAxis dataKey="day" hide />
                <Tooltip />
                <Area type="monotone" dataKey="usage" stroke="#7c4dff" fill="url(#g)" />
            </AreaChart>
        </ResponsiveContainer>
    </div>
);

/* ================= DASHBOARD ================= */

export default function Dashboard() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [credits, setCredits] = useState(0);
    const [streak, setStreak] = useState(1);
    const [usageData, setUsageData] = useState([]);

    useEffect(() => {
        const u = auth.currentUser;
        if (!u) return;
        setUser(u);

        // 1. Brand Data (Credits/Streak)
        const unsubBrand = onSnapshot(doc(db, "brands", u.uid), snap => {
            const d = snap.data();
            if (!d) return;
            setCredits(d.credits || 0);
            setStreak(d.streak || 1);
        });

        // 2. History Data (Chart)
        const unsubHistory = onSnapshot(collection(db, "users", u.uid, "history"), (snap) => {
            const docs = snap.docs.map(d => d.data());

            // Process for Chart (Last 7 Days)
            const days = 7;
            const labels = [...Array(days)].map((_, i) => {
                const d = new Date(); d.setDate(d.getDate() - (days - 1 - i));
                return d.toISOString().split('T')[0];
            });
            const map = docs.reduce((acc, item) => {
                const date = item.timestamp ? new Date(item.timestamp.toDate()).toISOString().split('T')[0] : '';
                if (date) acc[date] = (acc[date] || 0) + 1;
                return acc;
            }, {});

            setUsageData(labels.map(date => ({
                day: new Date(date).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' }),
                usage: map[date] || 0
            })));
        });

        return () => { unsubBrand(); unsubHistory(); };
    }, []);

    const handleSurprise = () => {
        const prompts = [
            "A cyberpunk street food vendor story",
            "Why silence is the ultimate productivity hack",
            "A thread about the history of coffee",
            "LinkedIn post about failing forward"
        ];
        const types = ['tweet', 'idea', 'caption'];
        const type = types[Math.floor(Math.random() * types.length)];
        const prompt = prompts[Math.floor(Math.random() * prompts.length)];
        navigate(`/generate?type=${type}&topic=${encodeURIComponent(prompt)}`);
    };

    return (
        <div className="dashboard-wrapper">
            <style>{dashboardStyles}</style>



            <Ticker />

            <div className="premium-container">


                <div className="hud-strip">
                    <HudStat icon={Zap} label="Credits" value={credits} />
                    <HudStat icon={Flame} label="Streak" value={streak} />
                </div>

                <div className="actions-grid">
                    <ActionCard icon={Twitter} label="Tweet" to="/generate?type=tweet" />
                    <ActionCard icon={ImageIcon} label="Post" to="/generate?type=caption" />
                    <ActionCard icon={Lightbulb} label="Idea" to="/generate?type=idea" />
                    <ActionCard icon={Video} label="Script" to="/generate?type=videoScript" />
                </div>

                <div className="secondary-section">
                    <ChartWidget usageData={usageData} />
                    <div className="trending-box">
                        <div className="trending-list">
                            <div className="trending-item" onClick={handleSurprise}>
                                <div className="t-icon">🎲</div>
                                <div>
                                    <div className="t-title">Surprise Me</div>
                                    <div className="t-sub">Random Inspiration</div>
                                </div>
                                <ArrowRight size={14} className="t-arrow" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
