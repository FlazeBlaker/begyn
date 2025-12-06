import React, { useState, useEffect } from 'react';
import { db, auth, sendPasswordResetEmail } from '../services/firebase';
import { collection, getDocs, query, orderBy, doc, updateDoc, where } from 'firebase/firestore';
import { X, Save, Clock, CreditCard, FileText, User, Check, AlertCircle, RefreshCcw, Download } from 'lucide-react';

const AdminUserModal = ({ user, onClose, onUpdate }) => {
    const [activeTab, setActiveTab] = useState('details');
    const [history, setHistory] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [loadingTransactions, setLoadingTransactions] = useState(false);
    const [saving, setSaving] = useState(false);

    // Edit Form State
    const [formData, setFormData] = useState({
        brandName: '',
        credits: 0,
        plan: 'free',
        notes: '',
        tags: ''
    });

    useEffect(() => {
        if (user) {
            setFormData({
                brandName: user.brandName || '',
                credits: user.credits || 0,
                plan: user.plan || 'free',
                notes: user.notes || '',
                tags: user.tags ? user.tags.join(', ') : ''
            });
            fetchHistory();
            fetchTransactions();
        }
    }, [user]);

    const fetchHistory = async () => {
        setLoadingHistory(true);
        try {
            const q = query(collection(db, "users", user.id, "history"), orderBy("timestamp", "desc"));
            const snapshot = await getDocs(q);
            setHistory(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } catch (error) {
            console.error("Error fetching history:", error);
        } finally {
            setLoadingHistory(false);
        }
    };

    const fetchTransactions = async () => {
        setLoadingTransactions(true);
        try {
            // Try to fetch from top-level transactions collection first
            const q = query(collection(db, "transactions"), where("userId", "==", user.id), orderBy("timestamp", "desc"));
            const snapshot = await getDocs(q);
            setTransactions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } catch (error) {
            console.error("Error fetching transactions:", error);
        } finally {
            setLoadingTransactions(false);
        }
    };

    const handleResetPassword = async () => {
        if (!confirm(`Send password reset email to ${user.email}?`)) return;
        try {
            await sendPasswordResetEmail(auth, user.email);
            alert(`Password reset email sent to ${user.email}`);
        } catch (error) {
            console.error("Error sending reset email:", error);
            alert("Failed to send reset email: " + error.message);
        }
    };

    const handleToggleBan = async () => {
        const action = user.isBanned ? 'UNBAN' : 'BAN';
        if (!confirm(`Are you sure you want to ${action} this user?`)) return;

        try {
            const brandRef = doc(db, "brands", user.id);
            await updateDoc(brandRef, {
                isBanned: !user.isBanned
            });
            alert(`User ${user.isBanned ? 'unbanned' : 'banned'} successfully.`);
            onUpdate(); // Refresh parent
            onClose(); // Close modal
        } catch (error) {
            console.error("Error toggling ban:", error);
            alert("Failed to update ban status.");
        }
    };

    const handleMarkRefunded = async (txId) => {
        if (!confirm("Are you sure you want to mark this transaction as REFUNDED? This does not trigger a bank refund.")) return;
        try {
            await updateDoc(doc(db, "transactions", txId), {
                status: 'refunded',
                refundedAt: new Date()
            });
            alert("Transaction marked as refunded.");
            fetchTransactions();
        } catch (error) {
            console.error("Error refunding:", error);
            alert("Failed to mark as refunded.");
        }
    };

    const handleGenerateInvoice = (tx) => {
        const invoiceContent = `
INVOICE
----------------
Date: ${tx.timestamp?.toDate ? tx.timestamp.toDate().toLocaleDateString() : 'N/A'}
Transaction ID: ${tx.id}
User: ${user.email}
Amount: ₹${tx.amount}
Status: ${tx.status}
----------------
Thank you for your business!
        `;
        const blob = new Blob([invoiceContent], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `invoice_${tx.id}.txt`;
        a.click();
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // Update brand document (where credits and plan usually live)
            const brandRef = doc(db, "brands", user.id);
            await updateDoc(brandRef, {
                brandName: formData.brandName,
                credits: Number(formData.credits),
                plan: formData.plan,
                notes: formData.notes,
                tags: formData.tags.split(',').map(t => t.trim()).filter(t => t)
            });

            // Notify parent to refresh list
            if (onUpdate) onUpdate();
            alert("User details updated successfully!");
        } catch (error) {
            console.error("Error updating user:", error);
            alert("Failed to update user.");
        } finally {
            setSaving(false);
        }
    };

    if (!user) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(5px)',
            zIndex: 1000,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '20px'
        }}>
            <div style={{
                background: '#1e293b',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '20px',
                width: '100%',
                maxWidth: '800px',
                maxHeight: '90vh',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
            }}>
                {/* Header */}
                <div style={{
                    padding: '24px',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: 'rgba(15, 23, 42, 0.5)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.2rem',
                            fontWeight: 'bold',
                            color: 'white'
                        }}>
                            {user.email?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h2 style={{ margin: 0, color: 'white', fontSize: '1.2rem' }}>{user.displayName || 'User Details'}</h2>
                            <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.9rem' }}>{user.email}</p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <button
                            onClick={handleToggleBan}
                            style={{
                                padding: '8px 16px',
                                background: user.isBanned ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                                border: user.isBanned ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
                                borderRadius: '8px',
                                color: user.isBanned ? '#34D399' : '#F87171',
                                cursor: 'pointer',
                                fontSize: '0.9rem',
                                fontWeight: '600'
                            }}
                        >
                            {user.isBanned ? 'Unban User' : 'Ban User'}
                        </button>
                        <button
                            onClick={handleResetPassword}
                            style={{
                                padding: '8px 16px',
                                background: 'rgba(255, 255, 255, 0.1)',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                borderRadius: '8px',
                                color: '#e2e8f0',
                                cursor: 'pointer',
                                fontSize: '0.9rem'
                            }}
                        >
                            Reset Password
                        </button>
                        <button
                            onClick={onClose}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#94a3b8',
                                cursor: 'pointer',
                                padding: '8px',
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                            className="hover:bg-white/10"
                        >
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div style={{
                    display: 'flex',
                    padding: '0 24px',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                    background: 'rgba(15, 23, 42, 0.3)'
                }}>
                    {[
                        { id: 'details', label: 'Details', icon: User },
                        { id: 'history', label: 'History', icon: FileText },
                        { id: 'transactions', label: 'Transactions', icon: CreditCard }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            style={{
                                padding: '16px 24px',
                                background: 'transparent',
                                border: 'none',
                                borderBottom: activeTab === tab.id ? '2px solid #8b5cf6' : '2px solid transparent',
                                color: activeTab === tab.id ? '#fff' : '#94a3b8',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                fontWeight: activeTab === tab.id ? '600' : '400',
                                transition: 'all 0.2s'
                            }}
                        >
                            <tab.icon size={18} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>

                    {/* DETAILS TAB */}
                    {activeTab === 'details' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            <div className="form-group">
                                <label style={{ display: 'block', color: '#94a3b8', marginBottom: '8px', fontSize: '0.9rem' }}>Brand Name</label>
                                <input
                                    type="text"
                                    value={formData.brandName}
                                    onChange={(e) => setFormData({ ...formData, brandName: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        background: 'rgba(15, 23, 42, 0.6)',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                        borderRadius: '8px',
                                        color: 'white',
                                        fontSize: '1rem'
                                    }}
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                                <div className="form-group">
                                    <label style={{ display: 'block', color: '#94a3b8', marginBottom: '8px', fontSize: '0.9rem' }}>Credits</label>
                                    <input
                                        type="number"
                                        value={formData.credits}
                                        onChange={(e) => setFormData({ ...formData, credits: e.target.value })}
                                        style={{
                                            width: '100%',
                                            padding: '12px',
                                            background: 'rgba(15, 23, 42, 0.6)',
                                            border: '1px solid rgba(255, 255, 255, 0.1)',
                                            borderRadius: '8px',
                                            color: 'white',
                                            fontSize: '1rem'
                                        }}
                                    />
                                </div>
                                <div className="form-group">
                                    <label style={{ display: 'block', color: '#94a3b8', marginBottom: '8px', fontSize: '0.9rem' }}>Plan</label>
                                    <select
                                        value={formData.plan}
                                        onChange={(e) => setFormData({ ...formData, plan: e.target.value })}
                                        style={{
                                            width: '100%',
                                            padding: '12px',
                                            background: 'rgba(15, 23, 42, 0.6)',
                                            border: '1px solid rgba(255, 255, 255, 0.1)',
                                            borderRadius: '8px',
                                            color: 'white',
                                            fontSize: '1rem'
                                        }}
                                    >
                                        <option value="free">Free</option>
                                        <option value="pro">Pro</option>
                                    </select>
                                </div>
                            </div>

                            <div className="form-group">
                                <label style={{ display: 'block', color: '#94a3b8', marginBottom: '8px', fontSize: '0.9rem' }}>Tags (comma separated)</label>
                                <input
                                    type="text"
                                    value={formData.tags}
                                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                                    placeholder="VIP, Beta, Risk..."
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        background: 'rgba(15, 23, 42, 0.6)',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                        borderRadius: '8px',
                                        color: 'white',
                                        fontSize: '1rem'
                                    }}
                                />
                            </div>

                            <div className="form-group">
                                <label style={{ display: 'block', color: '#94a3b8', marginBottom: '8px', fontSize: '0.9rem' }}>Internal Notes</label>
                                <textarea
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    placeholder="Add private notes about this user..."
                                    rows={4}
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        background: 'rgba(15, 23, 42, 0.6)',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                        borderRadius: '8px',
                                        color: 'white',
                                        fontSize: '1rem',
                                        resize: 'vertical'
                                    }}
                                />
                            </div>

                            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    style={{
                                        padding: '12px 32px',
                                        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                        border: 'none',
                                        borderRadius: '12px',
                                        color: 'white',
                                        fontWeight: '600',
                                        cursor: saving ? 'not-allowed' : 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        opacity: saving ? 0.7 : 1
                                    }}
                                >
                                    {saving ? <div className="loading-spinner" style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white' }}></div> : <Save size={18} />}
                                    Save Changes
                                </button>
                            </div>
                        </div>
                    )}

                    {/* HISTORY TAB */}
                    {activeTab === 'history' && (
                        <div>
                            {loadingHistory ? (
                                <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Loading history...</div>
                            ) : history.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>No history found.</div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {history.map(item => (
                                        <div key={item.id} style={{
                                            padding: '16px',
                                            background: 'rgba(255, 255, 255, 0.03)',
                                            borderRadius: '12px',
                                            border: '1px solid rgba(255, 255, 255, 0.05)',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center'
                                        }}>
                                            <div>
                                                <div style={{ color: 'white', fontWeight: '500', marginBottom: '4px' }}>
                                                    {item.type ? item.type.replace(/_/g, ' ').toUpperCase() : 'GENERATED CONTENT'}
                                                </div>
                                                <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
                                                    {item.timestamp?.toDate ? item.timestamp.toDate().toLocaleString() : 'Unknown Date'}
                                                </div>
                                            </div>
                                            <div style={{ color: '#64748b', fontSize: '0.8rem' }}>
                                                ID: {item.id.substring(0, 8)}...
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* TRANSACTIONS TAB */}
                    {activeTab === 'transactions' && (
                        <div>
                            {loadingTransactions ? (
                                <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Loading transactions...</div>
                            ) : transactions.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>No transactions found.</div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {transactions.map(tx => (
                                        <div key={tx.id} style={{
                                            padding: '16px',
                                            background: 'rgba(255, 255, 255, 0.03)',
                                            borderRadius: '12px',
                                            border: '1px solid rgba(255, 255, 255, 0.05)',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div style={{
                                                    padding: '8px',
                                                    borderRadius: '8px',
                                                    background: tx.status === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                                                    color: tx.status === 'success' ? '#34D399' : '#F87171'
                                                }}>
                                                    {tx.status === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
                                                </div>
                                                <div>
                                                    <div style={{ color: 'white', fontWeight: '500', marginBottom: '4px' }}>
                                                        ₹{tx.amount}
                                                    </div>
                                                    <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
                                                        {tx.timestamp?.toDate ? tx.timestamp.toDate().toLocaleString() : 'Unknown Date'}
                                                    </div>
                                                </div>
                                            </div>
                                            <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                                                <div style={{ color: '#e2e8f0', fontSize: '0.9rem' }}>{tx.credits} Credits</div>
                                                <div style={{ color: '#64748b', fontSize: '0.8rem' }}>{tx.packageId}</div>
                                                <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                                                    <button onClick={() => handleGenerateInvoice(tx)} title="Download Invoice" style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><Download size={14} /></button>
                                                    {tx.status === 'success' && (
                                                        <button onClick={() => handleMarkRefunded(tx.id)} title="Mark Refunded" style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}><RefreshCcw size={14} /></button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminUserModal;
