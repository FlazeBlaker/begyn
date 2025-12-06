import React, { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { collection, getDocs, query, orderBy, limit, where, writeBatch, doc, increment } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, DollarSign, Activity, TrendingUp, Search, RefreshCw, Shield, Zap, CreditCard, Clock, ChevronRight, Download, CheckSquare, Square, Plus, Tag } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import ImmersiveBackground from '../components/ImmersiveBackground';
import '../styles/GeneratorStyles.css';
import AdminUserModal from '../components/AdminUserModal';
import AdminCoupons from '../components/AdminCoupons';

const AdminDashboard = ({ userInfo }) => {
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalRevenue: 0,
        totalApiCost: 0,
        netProfit: 0,
        totalGenerations: 0,
        mrr: 0,
        arpu: 0,
        churnRate: 0,
        planDistribution: [],
        heatmapData: []
    });
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterPlan, setFilterPlan] = useState('all');
    const [sortBy, setSortBy] = useState('recent');
    const [chartData, setChartData] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [selectedUserIds, setSelectedUserIds] = useState(new Set());
    const [isBulkActionLoading, setIsBulkActionLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => {
        if (userInfo && userInfo.email !== 'jaypawar1205@gmail.com') {
            navigate('/dashboard');
        }
    }, [userInfo, navigate]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const usersSnap = await getDocs(collection(db, "users"));
            const brandsSnap = await getDocs(collection(db, "brands"));
            const transactionsSnap = await getDocs(collection(db, "transactions"));

            const brandsMap = {};
            brandsSnap.docs.forEach(doc => {
                brandsMap[doc.id] = doc.data();
            });

            // Process Transactions first to identify paid users
            let totalRevenue = 0;
            const revenueByDate = {};
            const paidUserIds = new Set();

            transactionsSnap.docs.forEach(doc => {
                const data = doc.data();
                if (data.status === 'success') {
                    totalRevenue += (data.amount || 0);
                    if (data.userId) {
                        paidUserIds.add(data.userId);
                    }

                    // Group by date for chart
                    const date = data.createdAt?.toDate ? data.createdAt.toDate().toLocaleDateString('en-US', { weekday: 'short' }) : null;
                    if (date) {
                        revenueByDate[date] = (revenueByDate[date] || 0) + (data.amount || 0);
                    }
                }
            });

            const userList = usersSnap.docs.map(doc => {
                const brand = brandsMap[doc.id] || {};
                // Determine plan: if explicitly set in brand, use it. 
                // If 'free' or missing, but has transactions, override to 'pro' (Paid).
                let plan = brand.plan || 'free';
                if (plan === 'free' && paidUserIds.has(doc.id)) {
                    plan = 'pro';
                }

                return {
                    id: doc.id,
                    ...doc.data(),
                    credits: brand.credits || 0,
                    creditsUsed: brand.creditsUsed || 0,
                    plan: plan,
                    isBanned: brand.isBanned || false,
                    brandName: brand.brandName || 'N/A',
                    lastActive: brand.lastActive?.toDate ? brand.lastActive.toDate().toLocaleDateString() : 'N/A',
                    lastActiveRaw: brand.lastActive?.toDate ? brand.lastActive.toDate() : new Date(0)
                };
            });

            // Calculate Plan Distribution & MRR
            let proUsers = 0;
            let freeUsers = 0;
            userList.forEach(u => {
                if (u.plan === 'pro') proUsers++;
                else freeUsers++;
            });

            const mrr = proUsers * 995; // Estimated MRR based on Pro plan price

            const planDistribution = [
                { name: 'Free', value: freeUsers },
                { name: 'Pro', value: proUsers }
            ];

            const arpu = userList.length > 0 ? (totalRevenue / userList.length) : 0;

            // Calculate Churn Rate (Inactive > 30 days)
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            const inactiveUsers = userList.filter(u => u.lastActiveRaw < thirtyDaysAgo).length;
            const churnRate = userList.length > 0 ? (inactiveUsers / userList.length) * 100 : 0;

            const logsQ = query(collection(db, "system_logs"), where("type", "==", "api_cost"));
            const logsSnap = await getDocs(logsQ);

            let totalCost = 0;
            let totalGens = 0;
            const costByDate = {};
            const heatmap = Array(7).fill(0).map(() => Array(24).fill(0));

            logsSnap.docs.forEach(doc => {
                const data = doc.data();
                totalCost += data.costUSD || 0;
                totalGens++;

                // Group by date for chart
                const date = data.timestamp?.toDate ? data.timestamp.toDate() : null;
                if (date) {
                    const dateStr = date.toLocaleDateString('en-US', { weekday: 'short' });
                    costByDate[dateStr] = (costByDate[dateStr] || 0) + (data.costUSD || 0);

                    // Heatmap Data
                    const day = date.getDay();
                    const hour = date.getHours();
                    heatmap[day][hour]++;
                }
            });

            setStats({
                totalUsers: userList.length,
                totalRevenue: totalRevenue,
                totalApiCost: totalCost,
                netProfit: totalRevenue - (totalCost * 83), // Convert cost to INR approx
                totalGenerations: totalGens,
                mrr: mrr,
                arpu: arpu,
                churnRate: churnRate,
                planDistribution: planDistribution,
                heatmapData: heatmap
            });

            setUsers(userList);

            // Generate Last 7 Days Chart Data
            const days = [];
            for (let i = 6; i >= 0; i--) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                days.push(d.toLocaleDateString('en-US', { weekday: 'short' }));
            }

            const realChartData = days.map(day => ({
                name: day,
                cost: (costByDate[day] || 0),
                revenue: (revenueByDate[day] || 0)
            }));

            setChartData(realChartData);

        } catch (error) {
            console.error("Error fetching admin data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (userInfo?.email === 'jaypawar1205@gmail.com') {
            fetchData();
        }
    }, [userInfo]);

    const filteredUsers = users.filter(user => {
        const matchesSearch = user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.brandName?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesPlan = filterPlan === 'all' || user.plan === filterPlan;
        return matchesSearch && matchesPlan;
    }).sort((a, b) => {
        switch (sortBy) {
            case 'recent':
                return b.lastActiveRaw - a.lastActiveRaw;
            case 'oldest':
                return a.lastActiveRaw - b.lastActiveRaw;
            case 'credits-high':
                return b.credits - a.credits;
            case 'credits-low':
                return a.credits - b.credits;
            case 'alpha-asc':
                return (a.brandName || a.email).localeCompare(b.brandName || b.email);
            case 'alpha-desc':
                return (b.brandName || b.email).localeCompare(a.brandName || a.email);
            default:
                return 0;
        }
    });

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            const allIds = new Set(filteredUsers.map(u => u.id));
            setSelectedUserIds(allIds);
        } else {
            setSelectedUserIds(new Set());
        }
    };

    const handleSelectUser = (id) => {
        const newSelected = new Set(selectedUserIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedUserIds(newSelected);
    };

    const handleExportCSV = () => {
        const usersToExport = users.filter(u => selectedUserIds.has(u.id));
        if (usersToExport.length === 0) return;

        const headers = ['ID', 'Email', 'Display Name', 'Brand Name', 'Plan', 'Credits', 'Credits Used', 'Last Active'];
        const csvContent = [
            headers.join(','),
            ...usersToExport.map(u => [
                u.id,
                u.email,
                `"${u.displayName || ''}"`,
                `"${u.brandName || ''}"`,
                u.plan,
                u.credits,
                u.creditsUsed,
                `"${u.lastActive}"`
            ].join(','))
        ].join('\n');

        downloadCSV(csvContent, `users_export_${new Date().toISOString().slice(0, 10)}.csv`);
    };

    const handleExportTransactions = async () => {
        try {
            const transactionsSnap = await getDocs(collection(db, "transactions"));
            const headers = ['Transaction ID', 'User ID', 'Amount', 'Status', 'Date'];
            const csvContent = [
                headers.join(','),
                ...transactionsSnap.docs.map(doc => {
                    const data = doc.data();
                    return [
                        doc.id,
                        data.userId,
                        data.amount,
                        data.status,
                        `"${data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : ''}"`
                    ].join(',');
                })
            ].join('\n');

            downloadCSV(csvContent, `transactions_export_${new Date().toISOString().slice(0, 10)}.csv`);
        } catch (error) {
            console.error("Error exporting transactions:", error);
            alert("Failed to export transactions.");
        }
    };

    const downloadCSV = (content, filename) => {
        const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    const handleBulkAddCredits = async () => {
        const amountStr = prompt(`Add credits to ${selectedUserIds.size} users. Enter amount (e.g., 50):`);
        const amount = parseInt(amountStr);

        if (!amount || isNaN(amount)) return;

        if (!window.confirm(`Are you sure you want to add ${amount} credits to ${selectedUserIds.size} users?`)) return;

        setIsBulkActionLoading(true);
        try {
            const batch = writeBatch(db);
            selectedUserIds.forEach(userId => {
                const brandRef = doc(db, "brands", userId);
                batch.update(brandRef, {
                    credits: increment(amount)
                });
            });

            await batch.commit();
            alert(`Successfully added ${amount} credits to ${selectedUserIds.size} users.`);
            fetchData(); // Refresh data
            setSelectedUserIds(new Set()); // Clear selection
        } catch (error) {
            console.error("Error adding bulk credits:", error);
            alert("Failed to add credits. See console for details.");
        } finally {
            setIsBulkActionLoading(false);
        }
    };

    const handleBulkBan = async () => {
        if (!window.confirm(`Are you sure you want to BAN ${selectedUserIds.size} users?`)) return;
        setIsBulkActionLoading(true);
        try {
            const batch = writeBatch(db);
            selectedUserIds.forEach(userId => {
                const brandRef = doc(db, "brands", userId);
                batch.update(brandRef, { isBanned: true });
            });
            await batch.commit();
            alert(`Successfully banned ${selectedUserIds.size} users.`);
            fetchData();
            setSelectedUserIds(new Set());
        } catch (error) {
            console.error("Error banning users:", error);
            alert("Failed to ban users.");
        } finally {
            setIsBulkActionLoading(false);
        }
    };

    const handleBulkUnban = async () => {
        if (!window.confirm(`Are you sure you want to UNBAN ${selectedUserIds.size} users?`)) return;
        setIsBulkActionLoading(true);
        try {
            const batch = writeBatch(db);
            selectedUserIds.forEach(userId => {
                const brandRef = doc(db, "brands", userId);
                batch.update(brandRef, { isBanned: false });
            });
            await batch.commit();
            alert(`Successfully unbanned ${selectedUserIds.size} users.`);
            fetchData();
            setSelectedUserIds(new Set());
        } catch (error) {
            console.error("Error unbanning users:", error);
            alert("Failed to unban users.");
        } finally {
            setIsBulkActionLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="main-content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#0f172a', color: 'white' }}>
                <div className="loading-spinner"></div>
            </div>
        );
    }

    return (
        <div className="app-container" style={{ minHeight: '100vh', background: '#0f172a' }}>
            <ImmersiveBackground />
            <div className="main-content" style={{ maxWidth: '1600px', margin: '0 auto', padding: '32px', position: 'relative', zIndex: 10 }}>

                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                    <div>
                        <button onClick={() => navigate('/dashboard')} className="back-button" style={{ marginBottom: '12px', background: 'rgba(255,255,255,0.05)', border: 'none' }}>
                            <ArrowLeft size={18} /> Back to App
                        </button>
                        <h1 style={{ fontSize: '2.5rem', fontWeight: '800', background: 'linear-gradient(to right, #fff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0, letterSpacing: '-0.02em' }}>
                            Admin Command Center
                        </h1>
                        <p style={{ color: '#64748b', marginTop: '4px', fontSize: '1rem' }}>Real-time analytics and user management</p>
                    </div>
                    <div style={{ display: 'flex', gap: '16px' }}>
                        <button onClick={handleExportTransactions} className="generate-button" style={{ width: 'auto', padding: '10px 20px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', fontSize: '0.9rem' }}>
                            <Download size={16} style={{ marginRight: '8px' }} /> Export Transactions
                        </button>
                        <button onClick={fetchData} className="generate-button" style={{ width: 'auto', padding: '10px 20px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', fontSize: '0.9rem' }}>
                            <RefreshCw size={16} style={{ marginRight: '8px' }} /> Refresh Data
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', gap: '20px', marginBottom: '32px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0' }}>
                    <button
                        onClick={() => setActiveTab('overview')}
                        style={{
                            padding: '12px 24px',
                            background: 'transparent',
                            border: 'none',
                            borderBottom: activeTab === 'overview' ? '2px solid #6366f1' : '2px solid transparent',
                            color: activeTab === 'overview' ? 'white' : '#94a3b8',
                            fontSize: '1rem',
                            fontWeight: activeTab === 'overview' ? '600' : '400',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                    >
                        <Activity size={18} /> Overview
                    </button>
                    <button
                        onClick={() => setActiveTab('coupons')}
                        style={{
                            padding: '12px 24px',
                            background: 'transparent',
                            border: 'none',
                            borderBottom: activeTab === 'coupons' ? '2px solid #6366f1' : '2px solid transparent',
                            color: activeTab === 'coupons' ? 'white' : '#94a3b8',
                            fontSize: '1rem',
                            fontWeight: activeTab === 'coupons' ? '600' : '400',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                    >
                        <Tag size={18} /> Coupons
                    </button>
                </div>

                {activeTab === 'overview' ? (
                    <>
                        {/* Stats Grid - Smaller Cards */}
                        <div className="dashboard-grid" style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', marginBottom: '40px' }}>

                            {/* Users Card */}
                            <div className="stat-card" style={{ flex: 1, minWidth: '240px', background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.7), rgba(15, 23, 42, 0.8))', border: '1px solid rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)', padding: '24px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                                    <div className="stat-icon" style={{ background: 'rgba(124, 77, 255, 0.2)', color: '#A78BFA', padding: '12px', borderRadius: '12px' }}>
                                        <Users size={20} />
                                    </div>
                                    <span style={{ fontSize: '0.7rem', color: '#94a3b8', background: 'rgba(255,255,255,0.05)', padding: '4px 10px', borderRadius: '100px' }}>All Time</span>
                                </div>
                                <h3 style={{ color: '#94a3b8', fontSize: '0.9rem', fontWeight: '500', marginBottom: '4px' }}>Total Users</h3>
                                <p className="stat-value" style={{ fontSize: '2rem', fontWeight: '700', color: 'white', lineHeight: 1 }}>{stats.totalUsers}</p>
                            </div>

                            {/* Revenue Card */}
                            <div className="stat-card" style={{ flex: 1, minWidth: '240px', background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.7), rgba(15, 23, 42, 0.8))', border: '1px solid rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)', padding: '24px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                                    <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#34D399', padding: '12px', borderRadius: '12px' }}>
                                        <DollarSign size={20} />
                                    </div>
                                    <span style={{ fontSize: '0.7rem', color: '#94a3b8', background: 'rgba(255,255,255,0.05)', padding: '4px 10px', borderRadius: '100px' }}>Estimated</span>
                                </div>
                                <h3 style={{ color: '#94a3b8', fontSize: '0.9rem', fontWeight: '500', marginBottom: '4px' }}>Total Revenue</h3>
                                <p className="stat-value" style={{ fontSize: '2rem', fontWeight: '700', color: 'white', lineHeight: 1 }}>₹{stats.totalRevenue.toLocaleString('en-IN')}</p>
                            </div>

                            {/* API Costs Card */}
                            <div className="stat-card" style={{ flex: 1, minWidth: '240px', background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.7), rgba(15, 23, 42, 0.8))', border: '1px solid rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)', padding: '24px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                                    <div className="stat-icon" style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#F87171', padding: '12px', borderRadius: '12px' }}>
                                        <Activity size={20} />
                                    </div>
                                    <span style={{ fontSize: '0.7rem', color: '#94a3b8', background: 'rgba(255,255,255,0.05)', padding: '4px 10px', borderRadius: '100px' }}>Gemini API</span>
                                </div>
                                <h3 style={{ color: '#94a3b8', fontSize: '0.9rem', fontWeight: '500', marginBottom: '4px' }}>Operational Costs</h3>
                                <p className="stat-value" style={{ fontSize: '2rem', fontWeight: '700', color: 'white', lineHeight: 1 }}>${stats.totalApiCost.toFixed(4)}</p>
                                <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Zap size={12} /> {stats.totalGenerations} generations
                                </div>
                            </div>

                            {/* Profit Card */}
                            <div className="stat-card" style={{ flex: 1, minWidth: '240px', background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.7), rgba(15, 23, 42, 0.8))', border: '1px solid rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)', padding: '24px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                                    <div className="stat-icon" style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#60A5FA', padding: '12px', borderRadius: '12px' }}>
                                        <TrendingUp size={20} />
                                    </div>
                                    <span style={{ fontSize: '0.7rem', color: '#94a3b8', background: 'rgba(255,255,255,0.05)', padding: '4px 10px', borderRadius: '100px' }}>Net</span>
                                </div>
                                <h3 style={{ color: '#94a3b8', fontSize: '0.9rem', fontWeight: '500', marginBottom: '4px' }}>Net Profit</h3>
                                <p className="stat-value" style={{ fontSize: '2rem', fontWeight: '700', color: stats.netProfit >= 0 ? '#34D399' : '#F87171', lineHeight: 1 }}>
                                    ₹{stats.netProfit.toLocaleString('en-IN')}
                                </p>
                            </div>

                            {/* MRR Card */}
                            <div className="stat-card" style={{ flex: 1, minWidth: '240px', background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.7), rgba(15, 23, 42, 0.8))', border: '1px solid rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)', padding: '24px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                                    <div className="stat-icon" style={{ background: 'rgba(236, 72, 153, 0.2)', color: '#F472B6', padding: '12px', borderRadius: '12px' }}>
                                        <RefreshCw size={20} />
                                    </div>
                                    <span style={{ fontSize: '0.7rem', color: '#94a3b8', background: 'rgba(255,255,255,0.05)', padding: '4px 10px', borderRadius: '100px' }}>Est. MRR</span>
                                </div>
                                <h3 style={{ color: '#94a3b8', fontSize: '0.9rem', fontWeight: '500', marginBottom: '4px' }}>Recurring Rev.</h3>
                                <p className="stat-value" style={{ fontSize: '2rem', fontWeight: '700', color: 'white', lineHeight: 1 }}>
                                    ₹{stats.mrr.toLocaleString('en-IN')}
                                </p>
                            </div>

                            {/* ARPU Card */}
                            {/* ARPU Card */}
                            <div className="stat-card" style={{ flex: 1, minWidth: '240px', background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.7), rgba(15, 23, 42, 0.8))', border: '1px solid rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)', padding: '24px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                                    <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#FBBF24', padding: '12px', borderRadius: '12px' }}>
                                        <CreditCard size={20} />
                                    </div>
                                    <span style={{ fontSize: '0.7rem', color: '#94a3b8', background: 'rgba(255,255,255,0.05)', padding: '4px 10px', borderRadius: '100px' }}>Avg/User</span>
                                </div>
                                <h3 style={{ color: '#94a3b8', fontSize: '0.9rem', fontWeight: '500', marginBottom: '4px' }}>ARPU</h3>
                                <p className="stat-value" style={{ fontSize: '2rem', fontWeight: '700', color: 'white', lineHeight: 1 }}>
                                    ₹{stats.arpu.toFixed(0)}
                                </p>
                            </div>

                            {/* Churn Rate Card */}
                            <div className="stat-card" style={{ flex: 1, minWidth: '240px', background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.7), rgba(15, 23, 42, 0.8))', border: '1px solid rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)', padding: '24px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                                    <div className="stat-icon" style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#F87171', padding: '12px', borderRadius: '12px' }}>
                                        <Activity size={20} />
                                    </div>
                                    <span style={{ fontSize: '0.7rem', color: '#94a3b8', background: 'rgba(255,255,255,0.05)', padding: '4px 10px', borderRadius: '100px' }}>Inactive &gt; 30d</span>
                                </div>
                                <h3 style={{ color: '#94a3b8', fontSize: '0.9rem', fontWeight: '500', marginBottom: '4px' }}>Churn Rate</h3>
                                <p className="stat-value" style={{ fontSize: '2rem', fontWeight: '700', color: 'white', lineHeight: 1 }}>
                                    {stats.churnRate.toFixed(1)}%
                                </p>
                            </div>
                        </div>

                        {/* Charts Section */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', gap: '24px', marginBottom: '40px' }}>
                            {/* Revenue Chart */}
                            <div style={{ background: 'rgba(30, 41, 59, 0.4)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '24px', padding: '24px' }}>
                                <h3 style={{ color: 'white', marginBottom: '20px', fontSize: '1.1rem' }}>Revenue vs Costs (7 Days)</h3>
                                <div style={{ height: '250px', width: '100%' }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={chartData}>
                                            <defs>
                                                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                                                </linearGradient>
                                                <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                                            <XAxis dataKey="name" stroke="#64748b" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                                            <YAxis stroke="#64748b" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                                            <Tooltip
                                                contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white' }}
                                                itemStyle={{ color: 'white' }}
                                                formatter={(value, name) => [name === 'cost' ? `₹${(value * 83).toFixed(2)}` : `₹${value}`, name === 'cost' ? 'Est. Cost' : 'Revenue']}
                                            />
                                            <Area type="monotone" dataKey="revenue" stroke="#10B981" fillOpacity={1} fill="url(#colorRevenue)" strokeWidth={3} />
                                            <Area type="monotone" dataKey="cost" stroke="#EF4444" fillOpacity={1} fill="url(#colorCost)" strokeWidth={3} />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Plan Distribution Chart */}
                            <div style={{ background: 'rgba(30, 41, 59, 0.4)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '24px', padding: '24px' }}>
                                <h3 style={{ color: 'white', marginBottom: '20px', fontSize: '1.1rem' }}>Plan Distribution</h3>
                                <div style={{ height: '250px', width: '100%' }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={stats.planDistribution}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={80}
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                {stats.planDistribution.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.name === 'Pro' ? '#A78BFA' : '#94a3b8'} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white' }}
                                            />
                                            <Legend verticalAlign="bottom" height={36} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* System Health */}
                            <div style={{ background: 'rgba(30, 41, 59, 0.4)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '24px', padding: '24px' }}>
                                <h3 style={{ color: 'white', marginBottom: '20px', fontSize: '1.1rem' }}>System Health</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    <div style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                            <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>API Status</span>
                                            <span style={{ color: '#10B981', fontWeight: '600', fontSize: '0.9rem' }}>Operational</span>
                                        </div>
                                        <div style={{ height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '100px', overflow: 'hidden' }}>
                                            <div style={{ width: '100%', height: '100%', background: '#10B981' }}></div>
                                        </div>
                                    </div>
                                    <div style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                            <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Database Load</span>
                                            <span style={{ color: '#60A5FA', fontWeight: '600', fontSize: '0.9rem' }}>Low</span>
                                        </div>
                                        <div style={{ height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '100px', overflow: 'hidden' }}>
                                            <div style={{ width: '25%', height: '100%', background: '#60A5FA' }}></div>
                                        </div>
                                    </div>
                                    <div style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                            <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Storage Usage</span>
                                            <span style={{ color: '#A78BFA', fontWeight: '600', fontSize: '0.9rem' }}>12%</span>
                                        </div>
                                        <div style={{ height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '100px', overflow: 'hidden' }}>
                                            <div style={{ width: '12%', height: '100%', background: '#A78BFA' }}></div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Heatmap Chart */}
                            <div style={{ background: 'rgba(30, 41, 59, 0.4)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '24px', padding: '24px', gridColumn: 'span 3' }}>
                                <h3 style={{ color: 'white', marginBottom: '20px', fontSize: '1.1rem' }}>Credit Usage Heatmap (UTC)</h3>
                                <div style={{ display: 'grid', gridTemplateColumns: 'auto repeat(24, 1fr)', gap: '4px' }}>
                                    {/* Header Row (Hours) */}
                                    <div style={{ color: '#94a3b8', fontSize: '0.7rem' }}></div>
                                    {Array.from({ length: 24 }).map((_, i) => (
                                        <div key={i} style={{ color: '#64748b', fontSize: '0.6rem', textAlign: 'center' }}>{i}</div>
                                    ))}

                                    {/* Data Rows (Days) */}
                                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, dayIndex) => (
                                        <React.Fragment key={day}>
                                            <div style={{ color: '#94a3b8', fontSize: '0.7rem', alignSelf: 'center' }}>{day}</div>
                                            {stats.heatmapData[dayIndex]?.map((value, hourIndex) => {
                                                const intensity = Math.min(value / 5, 1); // Normalize intensity
                                                return (
                                                    <div
                                                        key={hourIndex}
                                                        title={`${day} ${hourIndex}:00 - ${value} generations`}
                                                        style={{
                                                            background: value > 0 ? `rgba(99, 102, 241, ${0.2 + intensity * 0.8})` : 'rgba(255,255,255,0.02)',
                                                            height: '24px',
                                                            borderRadius: '4px'
                                                        }}
                                                    />
                                                );
                                            })}
                                        </React.Fragment>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* User Database Section */}
                        <div className="history-container" style={{ background: 'rgba(30, 41, 59, 0.4)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '24px', padding: '24px' }}>
                            <div className="history-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                <div>
                                    <h2 style={{ fontSize: '1.2rem', fontWeight: '700', color: 'white', marginBottom: '4px' }}>User Database</h2>
                                    <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Manage and monitor user activity</p>
                                </div>
                                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                    {selectedUserIds.size > 0 && (
                                        <div style={{ display: 'flex', gap: '8px', marginRight: '12px', animation: 'fadeIn 0.3s ease' }}>
                                            <button
                                                onClick={handleExportCSV}
                                                style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#34D399', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
                                            >
                                                <Download size={14} /> Export ({selectedUserIds.size})
                                            </button>
                                            <button
                                                onClick={handleBulkAddCredits}
                                                disabled={isBulkActionLoading}
                                                style={{ background: 'rgba(124, 77, 255, 0.2)', color: '#A78BFA', border: '1px solid rgba(124, 77, 255, 0.3)', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
                                            >
                                                <Plus size={14} /> Add Credits
                                            </button>
                                            <button
                                                onClick={handleBulkBan}
                                                disabled={isBulkActionLoading}
                                                style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#F87171', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
                                            >
                                                <Shield size={14} /> Ban
                                            </button>
                                            <button
                                                onClick={handleBulkUnban}
                                                disabled={isBulkActionLoading}
                                                style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#60A5FA', border: '1px solid rgba(59, 130, 246, 0.3)', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
                                            >
                                                <Shield size={14} /> Unban
                                            </button>
                                        </div>
                                    )}
                                    {/* Sort Dropdown */}
                                    <select
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value)}
                                        style={{
                                            background: 'rgba(15, 23, 42, 0.6)',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            color: 'white',
                                            padding: '0 16px',
                                            borderRadius: '8px',
                                            height: '40px',
                                            outline: 'none',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <option value="recent">Recent Activity</option>
                                        <option value="oldest">Oldest Activity</option>
                                        <option value="credits-high">Most Credits</option>
                                        <option value="credits-low">Least Credits</option>
                                        <option value="alpha-asc">Name (A-Z)</option>
                                        <option value="alpha-desc">Name (Z-A)</option>
                                    </select>

                                    {/* Filter Dropdown */}
                                    <select
                                        value={filterPlan}
                                        onChange={(e) => setFilterPlan(e.target.value)}
                                        style={{
                                            background: 'rgba(15, 23, 42, 0.6)',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            color: 'white',
                                            padding: '0 16px',
                                            borderRadius: '8px',
                                            height: '40px',
                                            outline: 'none',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <option value="all">All Plans</option>
                                        <option value="free">Free</option>
                                        <option value="pro">Pro</option>
                                    </select>

                                    {/* Search Input */}
                                    <div className="input-group" style={{ width: '280px', margin: 0, background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255,255,255,0.1)', height: '40px', display: 'flex', alignItems: 'center' }}>
                                        <Search size={16} style={{ marginLeft: '12px', color: '#64748b' }} />
                                        <input
                                            type="text"
                                            placeholder="Search by email or brand..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            style={{ flex: 1, paddingLeft: '12px', background: 'transparent', border: 'none', color: 'white', height: '100%', fontSize: '0.9rem', outline: 'none' }}
                                        />
                                    </div>

                                    {/* Search Button (Visual/Action) */}
                                    <button
                                        style={{
                                            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                            border: 'none',
                                            color: 'white',
                                            padding: '0 20px',
                                            borderRadius: '8px',
                                            height: '40px',
                                            fontWeight: '600',
                                            cursor: 'pointer',
                                            fontSize: '0.9rem'
                                        }}
                                    >
                                        Search
                                    </button>
                                </div>
                            </div>

                            <div className="table-responsive" style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 6px', color: '#e2e8f0' }}>
                                    <thead>
                                        <tr style={{ textAlign: 'left', color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                            <th style={{ padding: '12px 20px', width: '40px' }}>
                                                <input
                                                    type="checkbox"
                                                    onChange={handleSelectAll}
                                                    checked={filteredUsers.length > 0 && selectedUserIds.size === filteredUsers.length}
                                                    style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: '#6366f1' }}
                                                />
                                            </th>
                                            <th style={{ padding: '12px 20px' }}>User Details</th>
                                            <th style={{ padding: '12px 20px' }}>Brand</th>
                                            <th style={{ padding: '12px 20px' }}>Plan Status</th>
                                            <th style={{ padding: '12px 20px' }}>Usage</th>
                                            <th style={{ padding: '12px 20px' }}>Last Active</th>
                                            <th style={{ padding: '12px 20px' }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredUsers.map(user => (
                                            <tr key={user.id} style={{ background: selectedUserIds.has(user.id) ? 'rgba(99, 102, 241, 0.1)' : 'rgba(255,255,255,0.02)', transition: 'all 0.2s ease' }} className="hover:bg-white/5">
                                                <td style={{ padding: '16px 20px', borderRadius: '12px 0 0 12px' }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedUserIds.has(user.id)}
                                                        onChange={() => handleSelectUser(user.id)}
                                                        style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: '#6366f1' }}
                                                    />
                                                </td>
                                                <td style={{ padding: '16px 20px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: 'white', fontSize: '0.9rem' }}>
                                                            {user.email?.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <div style={{ fontWeight: '600', color: 'white', fontSize: '0.95rem' }}>{user.displayName || 'User'}</div>
                                                            <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{user.email}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '16px 20px' }}>
                                                    <div style={{ fontWeight: '500', fontSize: '0.95rem' }}>{user.brandName}</div>
                                                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>ID: {user.id.substring(0, 8)}...</div>
                                                </td>
                                                <td style={{ padding: '16px 20px' }}>
                                                    {user.isBanned ? (
                                                        <span style={{
                                                            background: 'rgba(239, 68, 68, 0.2)',
                                                            color: '#F87171',
                                                            padding: '4px 10px',
                                                            borderRadius: '100px',
                                                            fontSize: '0.75rem',
                                                            fontWeight: '600',
                                                            border: '1px solid rgba(239, 68, 68, 0.3)'
                                                        }}>
                                                            BANNED
                                                        </span>
                                                    ) : (
                                                        <span style={{
                                                            background: user.plan === 'pro' ? 'rgba(124, 77, 255, 0.2)' : 'rgba(148, 163, 184, 0.2)',
                                                            color: user.plan === 'pro' ? '#A78BFA' : '#94a3b8',
                                                            padding: '4px 10px',
                                                            borderRadius: '100px',
                                                            fontSize: '0.75rem',
                                                            fontWeight: '600',
                                                            border: user.plan === 'pro' ? '1px solid rgba(124, 77, 255, 0.3)' : '1px solid rgba(148, 163, 184, 0.3)'
                                                        }}>
                                                            {user.plan === 'pro' ? 'PRO PLAN' : 'FREE PLAN'}
                                                        </span>
                                                    )}
                                                </td>
                                                <td style={{ padding: '16px 20px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '10px', width: '80px' }}>
                                                            <div style={{ width: `${Math.min((user.creditsUsed / (user.credits + user.creditsUsed || 1)) * 100, 100)}%`, height: '100%', background: '#34D399', borderRadius: '10px' }}></div>
                                                        </div>
                                                        <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{user.credits} left</span>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '16px 20px', color: '#94a3b8', fontSize: '0.9rem' }}>{user.lastActive}</td>
                                                <td style={{ padding: '16px 20px', borderRadius: '0 12px 12px 0' }}>
                                                    <button
                                                        onClick={() => setSelectedUser(user)}
                                                        style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', padding: '6px', borderRadius: '6px' }}
                                                        className="hover:bg-white/10"
                                                    >
                                                        <ChevronRight size={18} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                    </>
                ) : (
                    <AdminCoupons />
                )}

                {/* User Modal */}
                {selectedUser && (
                    <AdminUserModal
                        user={selectedUser}
                        onClose={() => setSelectedUser(null)}
                        onUpdate={() => {
                            fetchData();
                            setSelectedUser(null);
                        }}
                    />
                )}
            </div>
        </div >
    );
};

export default AdminDashboard;
