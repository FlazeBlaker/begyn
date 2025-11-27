import { useState, useEffect } from "react";
import { auth, db, collection, onSnapshot, doc } from "../services/firebase";
import { Link, useNavigate } from "react-router-dom";
import {
    AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer
} from 'recharts';
import {
    Zap, TrendingUp, Award, Star,
    Layout, Image as ImageIcon, PenTool, Twitter, Linkedin, FileText,
    Mic, Download, Save, Globe, Server, Cloud, Shuffle, MoreHorizontal, Flame,
    Lightbulb, Video
} from 'lucide-react';

// --- STYLES & ANIMATIONS ---
const dashboardStyles = `
    @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes pulse-glow { 0% { box-shadow: 0 0 0 0 rgba(168, 85, 247, 0.4); } 70% { box-shadow: 0 0 0 10px rgba(168, 85, 247, 0); } 100% { box-shadow: 0 0 0 0 rgba(168, 85, 247, 0); } }
    @keyframes ticker { 0% { transform: translateX(100%); } 100% { transform: translateX(-100%); } }
    
    .glass-card {
        background: rgba(255, 255, 255, 0.03);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-radius: 16px;
        transition: all 0.3s ease;
        overflow: hidden;
        position: relative;
    }
    .glass-card:hover {
        background: rgba(255, 255, 255, 0.05);
        border-color: rgba(168, 85, 247, 0.3);
        transform: translateY(-2px);
        box-shadow: 0 8px 32px rgba(0,0,0,0.2);
    }
    .gradient-text {
        background: linear-gradient(135deg, #a855f7, #ec4899);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
    }
    .bento-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        grid-auto-rows: minmax(100px, auto);
        gap: 20px;
    }
    /* Responsive Grid */
    @media (max-width: 1200px) { .bento-grid { grid-template-columns: repeat(3, 1fr); } }
    @media (max-width: 900px) { .bento-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 600px) { .bento-grid { grid-template-columns: 1fr; } }
    
    .news-ticker-container {
        overflow: hidden;
        white-space: nowrap;
        background: rgba(168, 85, 247, 0.1);
        border-bottom: 1px solid rgba(168, 85, 247, 0.2);
        padding: 8px 0;
        margin-bottom: 24px;
    }
    .news-ticker-content {
        display: inline-block;
        animation: ticker 30s linear infinite;
        padding-left: 100%;
    }

    /* Quick Actions Responsive */
    .quick-actions-container {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
    }
    @media (max-width: 600px) {
        .quick-actions-container {
            justify-content: space-between;
        }
        .quick-actions-container > a {
            flex: 1;
            min-width: 60px;
        }
    }
`;

// --- MOCK DATA ---
const MOCK_CREDIT_DATA = [
    { day: 'Mon', usage: 12 }, { day: 'Tue', usage: 19 }, { day: 'Wed', usage: 8 },
    { day: 'Thu', usage: 25 }, { day: 'Fri', usage: 15 }, { day: 'Sat', usage: 30 }, { day: 'Sun', usage: 10 }
];

const AI_NEWS = [
    "🚀 GPT-5 Rumors: What we know so far...",
    "🎨 Midjourney v7 alpha testing begins next week.",
    "🤖 Google Gemini integrates with Workspace.",
    "💡 New study shows AI boosts productivity by 40%.",
    "📱 Social Media trends for 2025: Authenticity wins."
];
const COMMUNITY_SPOTLIGHT = [
    { user: "Sarah K.", title: "Viral LinkedIn Hook", likes: 124 },
    { user: "Mike D.", title: "Tech Thread", likes: 89 },
    { user: "Alex R.", title: "Product Launch", likes: 256 }
];

// --- COMPONENTS ---

const NewsTicker = () => (
    <div className="news-ticker-container">
        <div className="news-ticker-content">
            {AI_NEWS.map((news, i) => (
                <span key={i} style={{ marginRight: '50px', color: '#e0e0e0', fontSize: '0.9rem' }}>
                    <span style={{ marginRight: '10px' }}>⚡</span>{news}
                </span>
            ))}
        </div>
    </div>
);

const WelcomeHeader = ({ user }) => {
    const hour = new Date().getHours();
    const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
    const [latency, setLatency] = useState(45);

    useEffect(() => {
        const interval = setInterval(() => {
            setLatency(Math.floor(Math.random() * (60 - 30 + 1)) + 30);
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px' }}>
            <div>
                <h1 style={{ fontSize: '2.2rem', fontWeight: '800', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span className="gradient-text">{greeting}, {user?.displayName?.split(' ')[0] || 'Creator'}</span>
                </h1>
                <p style={{ color: '#a0a0b0', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Cloud size={14} /> System Operational • Latency: {latency}ms
                </p>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
                <button className="glass-card" style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#fff' }}>
                    <Mic size={18} /> Voice Mode
                </button>
                <div className="glass-card" style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Server size={18} color="#22c55e" /> <span style={{ fontSize: '0.9rem' }}>API Status: <strong>Online</strong></span>
                </div>
            </div>
        </div>
    );
};

const StatWidget = ({ icon: Icon, label, value, subtext, color, trend }) => (
    <div className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ background: `${color}20`, padding: '10px', borderRadius: '12px' }}>
                <Icon size={20} color={color} />
            </div>
            {trend && (
                <span style={{ fontSize: '0.8rem', color: '#22c55e', background: 'rgba(34, 197, 94, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                    {trend}
                </span>
            )}
        </div>
        <div style={{ marginTop: '16px' }}>
            <div style={{ fontSize: '1.8rem', fontWeight: '700' }}>{value}</div>
            <div style={{ fontSize: '0.9rem', color: '#a0a0b0' }}>{label}</div>
            {subtext && <div style={{ fontSize: '0.8rem', color: '#737373', marginTop: '4px' }}>{subtext}</div>}
        </div>
    </div>
);

const QuickAction = ({ icon: Icon, label, to, color }) => (
    <Link to={to} className="glass-card" style={{
        padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        textDecoration: 'none', color: '#fff', gap: '8px', aspectRatio: '1/1', minWidth: '80px'
    }}>
        <Icon size={24} color={color} />
        <span style={{ fontSize: '0.85rem', fontWeight: '500', textAlign: 'center' }}>{label}</span>
    </Link>
);

const AnalyticsCard = ({ usageData, timeRange, setTimeRange }) => (
    <div className="glass-card" style={{ padding: '20px', gridColumn: 'span 2', gridRow: 'span 2' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <TrendingUp size={16} color="#a855f7" /> Credit Usage ({timeRange === '7d' ? '7 Days' : '30 Days'})
            </h3>
            <div style={{ display: 'flex', gap: '8px' }}>
                <button
                    onClick={() => setTimeRange('7d')}
                    style={{
                        background: timeRange === '7d' ? 'rgba(255,255,255,0.1)' : 'transparent',
                        border: 'none',
                        color: timeRange === '7d' ? '#fff' : '#a0a0b0',
                        borderRadius: '4px',
                        padding: '2px 8px',
                        fontSize: '0.75rem',
                        cursor: 'pointer'
                    }}
                >
                    7d
                </button>
                <button
                    onClick={() => setTimeRange('30d')}
                    style={{
                        background: timeRange === '30d' ? 'rgba(255,255,255,0.1)' : 'transparent',
                        border: 'none',
                        color: timeRange === '30d' ? '#fff' : '#a0a0b0',
                        borderRadius: '4px',
                        padding: '2px 8px',
                        fontSize: '0.75rem',
                        cursor: 'pointer'
                    }}
                >
                    30d
                </button>
            </div>
        </div>
        <div style={{ height: '250px', width: '99%', minWidth: 0, position: 'relative' }}>
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={usageData.length > 0 ? usageData : MOCK_CREDIT_DATA}>
                    <defs>
                        <linearGradient id="colorUsage" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <XAxis dataKey="day" stroke="#525252" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="#525252" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ background: '#1f1f1f', border: '1px solid #333', borderRadius: '8px' }} itemStyle={{ color: '#fff' }} />
                    <Area type="monotone" dataKey="usage" stroke="#a855f7" strokeWidth={2} fillOpacity={1} fill="url(#colorUsage)" />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    </div>
);

const RecentActivityList = ({ history }) => (
    <div className="glass-card" style={{ padding: '20px', gridColumn: 'span 2', gridRow: 'span 2', overflowY: 'auto', maxHeight: '350px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={16} color="#3b82f6" /> Recent Activity
            </h3>
            <button style={{ background: 'none', border: 'none', color: '#a0a0b0', cursor: 'pointer' }}><MoreHorizontal size={16} /></button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {history.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#a0a0b0', padding: '20px' }}>No activity yet.</div>
            ) : (
                history.slice(0, 6).map((item, i) => (
                    <div key={i} style={{
                        display: 'flex', alignItems: 'center', gap: '12px', padding: '10px',
                        borderRadius: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)'
                    }}>
                        <div style={{ padding: '8px', borderRadius: '6px', background: '#262626' }}>
                            {item.type === 'generate_image' ? <ImageIcon size={14} color="#ec4899" /> : <PenTool size={14} color="#3b82f6" />}
                        </div>
                        <div style={{ flex: 1, overflow: 'hidden' }}>
                            <div style={{ fontSize: '0.9rem', fontWeight: '500', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {item.topic || "Untitled"}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#a0a0b0' }}>{item.timestamp ? new Date(item.timestamp.toDate()).toLocaleDateString() : 'Just now'}</div>
                        </div>
                        <button style={{ background: 'none', border: 'none', color: '#a0a0b0', cursor: 'pointer' }}><Star size={14} /></button>
                    </div>
                ))
            )}
        </div>
    </div>
);

const DailyChallenge = () => (
    <div className="glass-card" style={{ padding: '20px', background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.1), rgba(245, 158, 11, 0.05))', border: '1px solid rgba(251, 191, 36, 0.2)' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#fbbf24', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Award size={16} /> Daily Challenge
        </h3>
        <p style={{ fontSize: '0.9rem', color: '#e0e0e0', marginBottom: '12px' }}>
            Generate a <strong>LinkedIn Post</strong> about "AI Ethics".
        </p>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: '#fbbf24', fontWeight: '600' }}>+50 XP Reward</span>
            <button style={{ background: '#fbbf24', color: '#000', border: 'none', borderRadius: '6px', padding: '6px 12px', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer' }}>
                Start
            </button>
        </div>
    </div>
);

const StorageWidget = () => (
    <div className="glass-card" style={{ padding: '20px' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Cloud size={16} color="#3b82f6" /> Storage
        </h3>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', marginBottom: '8px' }}>
            <span style={{ fontSize: '1.5rem', fontWeight: '700' }}>45%</span>
            <span style={{ fontSize: '0.8rem', color: '#a0a0b0', marginBottom: '4px' }}>used</span>
        </div>
        <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ width: '45%', height: '100%', background: '#3b82f6' }}></div>
        </div>
        <p style={{ fontSize: '0.75rem', color: '#a0a0b0', marginTop: '8px' }}>2.1GB of 5GB</p>
    </div>
);

const SurpriseMe = () => {
    const navigate = useNavigate();
    const handleSurprise = () => {
        const types = ['post', 'tweet', 'idea', 'blog'];
        const randomType = types[Math.floor(Math.random() * types.length)];
        navigate(`/generate?type=${randomType}`);
    };

    return (
        <button onClick={handleSurprise} className="glass-card" style={{
            padding: '20px', width: '100%', textAlign: 'left', cursor: 'pointer',
            background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.2), rgba(236, 72, 153, 0.2))'
        }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#fff', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Shuffle size={16} /> Surprise Me
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#e0e0e0' }}>Don't know what to create? Let AI decide.</p>
        </button>
    );
};

export default function Dashboard() {
    const [user, setUser] = useState(null);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [credits, setCredits] = useState(0);
    const [streak, setStreak] = useState(1);
    const [draftsCount, setDraftsCount] = useState(0);
    const [usageData, setUsageData] = useState([]);
    const [timeRange, setTimeRange] = useState('7d');

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((u) => {
            setUser(u);
            if (u) {
                // 1. Fetch User Stats (Credits, Streak)
                const unsubBrand = onSnapshot(doc(db, "brands", u.uid), (doc) => {
                    if (doc.exists()) {
                        const data = doc.data();
                        setCredits(data.credits || 0);
                        setStreak(data.streak || 1);
                    }
                });

                // 2. Fetch History & Process for Usage/Drafts
                const unsubHistory = onSnapshot(collection(db, "users", u.uid, "history"), (snap) => {
                    const data = snap.docs.map(d => d.data()).sort((a, b) => b.timestamp - a.timestamp);
                    setHistory(data);

                    // Calculate Drafts
                    const drafts = data.filter(item => item.status === 'draft').length;
                    setDraftsCount(drafts);

                    setLoading(false);
                });

                return () => {
                    unsubBrand();
                    unsubHistory();
                };
            } else {
                setLoading(false);
            }
        });
        return () => unsubscribe();
    }, []);

    // Recalculate usage data when history or timeRange changes
    useEffect(() => {
        if (!history.length) return;

        const days = timeRange === '7d' ? 7 : 30;
        const dateLabels = [...Array(days)].map((_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (days - 1 - i));
            return d.toISOString().split('T')[0];
        });

        const usageMap = history.reduce((acc, item) => {
            if (item.timestamp) {
                const date = new Date(item.timestamp.toDate()).toISOString().split('T')[0];
                acc[date] = (acc[date] || 0) + 1;
            }
            return acc;
        }, {});

        const chartData = dateLabels.map(date => ({
            day: new Date(date).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' }),
            usage: usageMap[date] || 0
        }));
        setUsageData(chartData);

    }, [history, timeRange]);

    const handleExport = () => {
        if (!history.length) return;

        const headers = ["Date", "Type", "Topic", "Content", "Status"];
        const csvContent = [
            headers.join(","),
            ...history.map(item => {
                const date = item.timestamp ? new Date(item.timestamp.toDate()).toLocaleDateString() : "";
                const content = item.content ? `"${item.content.replace(/"/g, '""')}"` : ""; // Escape quotes
                return [date, item.type, `"${item.topic}"`, content, item.status || "published"].join(",");
            })
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `begyn_history_export_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: '#a0a0b0' }}>Initializing Mission Control...</div>;

    return (
        <div style={{ maxWidth: '1600px', margin: '0 auto' }}>
            <style>{dashboardStyles}</style>

            <NewsTicker />

            <div style={{ padding: '0 24px 24px 24px' }}>
                <WelcomeHeader user={user} />

                <div className="bento-grid">
                    {/* ROW 1: Stats & Quick Actions */}
                    <StatWidget icon={Zap} label="Credits Left" value={credits} subtext="Refills monthly" color="#fbbf24" />
                    <StatWidget icon={Flame} label="Daily Streak" value={streak} subtext="Keep it up!" color="#f97316" trend="+1" />
                    <div className="glass-card" style={{ gridColumn: 'span 2', padding: '16px', display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <div style={{ flex: '1 1 200px' }}>
                            <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '4px' }}>Quick Actions</h3>
                            <p style={{ fontSize: '0.8rem', color: '#a0a0b0' }}>Jump straight into creation.</p>
                        </div>
                        <div className="quick-actions-container" style={{ flex: '2 1 auto' }}>
                            <QuickAction icon={Linkedin} label="Post" to="/generate?type=post" color="#0077b5" />
                            <QuickAction icon={Twitter} label="Tweet" to="/generate?type=tweet" color="#1da1f2" />
                            <QuickAction icon={FileText} label="Caption" to="/generate?type=caption" color="#ec4899" />
                            <QuickAction icon={Lightbulb} label="Idea" to="/generate?type=idea" color="#fbbf24" />
                            <QuickAction icon={Video} label="Script" to="/generate?type=videoScript" color="#ef4444" />
                        </div>
                    </div>

                    {/* ROW 2: Analytics & Activity */}
                    <AnalyticsCard usageData={usageData} timeRange={timeRange} setTimeRange={setTimeRange} />
                    <RecentActivityList history={history} />

                    {/* ROW 3: Widgets */}
                    <DailyChallenge />
                    <SurpriseMe />
                    <StorageWidget />

                    <div className="glass-card" style={{ padding: '20px' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Globe size={16} color="#8b5cf6" /> Community Spotlight
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {COMMUNITY_SPOTLIGHT.map((item, i) => (
                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                                    <span style={{ color: '#e0e0e0' }}>{item.title}</span>
                                    <span style={{ color: '#a0a0b0' }}>❤️ {item.likes}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ROW 4: Drafts & Export */}
                    <div className="glass-card" style={{ padding: '20px', gridColumn: 'span 2', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                        <div>
                            <h3 style={{ fontSize: '1rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Save size={16} color="#a0a0b0" /> Drafts ({draftsCount})
                            </h3>
                            <p style={{ fontSize: '0.8rem', color: '#a0a0b0' }}>Resume your work.</p>
                        </div>
                        <button style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' }}>View All</button>
                    </div>

                    <div className="glass-card" style={{ padding: '20px', gridColumn: 'span 2', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                        <div>
                            <h3 style={{ fontSize: '1rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Download size={16} color="#a0a0b0" /> Export Data
                            </h3>
                            <p style={{ fontSize: '0.8rem', color: '#a0a0b0' }}>Download your analytics & history.</p>
                        </div>
                        <button onClick={handleExport} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' }}>Download CSV</button>
                    </div>

                </div>
            </div>
        </div>
    );
}