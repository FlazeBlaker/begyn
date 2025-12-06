import React, { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy, Timestamp } from 'firebase/firestore';
import { Plus, Trash2, Edit2, Save, X, Tag, Calendar, Percent, Hash } from 'lucide-react';

const AdminCoupons = () => {
    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        code: '',
        discountType: 'percentage', // percentage or fixed
        discountValue: 0,
        maxUses: 100,
        expiryDate: ''
    });

    useEffect(() => {
        fetchCoupons();
    }, []);

    const fetchCoupons = async () => {
        setLoading(true);
        try {
            const q = query(collection(db, "coupons"), orderBy("createdAt", "desc"));
            const snapshot = await getDocs(q);
            setCoupons(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } catch (error) {
            console.error("Error fetching coupons:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'discountValue' || name === 'maxUses' ? Number(value) : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const couponData = {
                ...formData,
                code: formData.code.toUpperCase(),
                currentUses: 0,
                createdAt: Timestamp.now(),
                expiryDate: formData.expiryDate ? Timestamp.fromDate(new Date(formData.expiryDate)) : null
            };

            await addDoc(collection(db, "coupons"), couponData);
            setShowAddModal(false);
            setFormData({ code: '', discountType: 'percentage', discountValue: 0, maxUses: 100, expiryDate: '' });
            fetchCoupons();
            alert("Coupon created successfully!");
        } catch (error) {
            console.error("Error creating coupon:", error);
            alert("Failed to create coupon.");
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Are you sure you want to delete this coupon?")) return;
        try {
            await deleteDoc(doc(db, "coupons", id));
            setCoupons(prev => prev.filter(c => c.id !== id));
        } catch (error) {
            console.error("Error deleting coupon:", error);
            alert("Failed to delete coupon.");
        }
    };

    return (
        <div style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'white' }}>Coupon Management</h2>
                <button
                    onClick={() => setShowAddModal(true)}
                    style={{
                        padding: '10px 20px',
                        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                        border: 'none',
                        borderRadius: '8px',
                        color: 'white',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}
                >
                    <Plus size={18} />
                    Create Coupon
                </button>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', color: '#94a3b8', padding: '40px' }}>Loading coupons...</div>
            ) : coupons.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#94a3b8', padding: '40px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px' }}>
                    <Tag size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
                    <p>No coupons found. Create one to get started.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                    {coupons.map(coupon => (
                        <div key={coupon.id} style={{
                            background: 'rgba(30, 41, 59, 0.7)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '12px',
                            padding: '20px',
                            position: 'relative',
                            overflow: 'hidden'
                        }}>
                            <div style={{
                                position: 'absolute',
                                top: 0,
                                right: 0,
                                padding: '4px 12px',
                                background: coupon.isActive === false ? '#ef4444' : '#10b981',
                                color: 'white',
                                fontSize: '0.75rem',
                                fontWeight: 'bold',
                                borderBottomLeftRadius: '8px'
                            }}>
                                {coupon.isActive === false ? 'INACTIVE' : 'ACTIVE'}
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                                <div style={{
                                    width: '48px',
                                    height: '48px',
                                    borderRadius: '12px',
                                    background: 'rgba(99, 102, 241, 0.1)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#8b5cf6'
                                }}>
                                    <Tag size={24} />
                                </div>
                                <div>
                                    <h3 style={{ margin: 0, color: 'white', fontSize: '1.2rem', letterSpacing: '1px' }}>{coupon.code}</h3>
                                    <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.9rem' }}>
                                        {coupon.discountType === 'percentage' ? `${coupon.discountValue}% OFF` : `₹${coupon.discountValue} OFF`}
                                    </p>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '8px' }}>
                                    <div style={{ color: '#64748b', fontSize: '0.75rem', marginBottom: '4px' }}>Usage</div>
                                    <div style={{ color: 'white', fontWeight: '600' }}>{coupon.currentUses} / {coupon.maxUses}</div>
                                </div>
                                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '8px' }}>
                                    <div style={{ color: '#64748b', fontSize: '0.75rem', marginBottom: '4px' }}>Expires</div>
                                    <div style={{ color: 'white', fontWeight: '600' }}>
                                        {coupon.expiryDate ? coupon.expiryDate.toDate().toLocaleDateString() : 'Never'}
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                <button
                                    onClick={() => handleDelete(coupon.id)}
                                    style={{
                                        padding: '8px',
                                        background: 'rgba(239, 68, 68, 0.1)',
                                        border: '1px solid rgba(239, 68, 68, 0.2)',
                                        borderRadius: '6px',
                                        color: '#ef4444',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add Coupon Modal */}
            {showAddModal && (
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
                        maxWidth: '500px',
                        padding: '24px',
                        boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h3 style={{ margin: 0, color: 'white', fontSize: '1.25rem' }}>Create New Coupon</h3>
                            <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div>
                                <label style={{ display: 'block', color: '#94a3b8', marginBottom: '8px', fontSize: '0.9rem' }}>Coupon Code</label>
                                <div style={{ position: 'relative' }}>
                                    <Hash size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                                    <input
                                        type="text"
                                        name="code"
                                        value={formData.code}
                                        onChange={handleInputChange}
                                        placeholder="SUMMER2024"
                                        required
                                        style={{
                                            width: '100%',
                                            padding: '12px 12px 12px 40px',
                                            background: 'rgba(15, 23, 42, 0.6)',
                                            border: '1px solid rgba(255, 255, 255, 0.1)',
                                            borderRadius: '8px',
                                            color: 'white',
                                            fontSize: '1rem',
                                            textTransform: 'uppercase'
                                        }}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div>
                                    <label style={{ display: 'block', color: '#94a3b8', marginBottom: '8px', fontSize: '0.9rem' }}>Type</label>
                                    <select
                                        name="discountType"
                                        value={formData.discountType}
                                        onChange={handleInputChange}
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
                                        <option value="percentage">Percentage (%)</option>
                                        <option value="fixed">Fixed Amount (₹)</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', color: '#94a3b8', marginBottom: '8px', fontSize: '0.9rem' }}>Value</label>
                                    <div style={{ position: 'relative' }}>
                                        <Percent size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                                        <input
                                            type="number"
                                            name="discountValue"
                                            value={formData.discountValue}
                                            onChange={handleInputChange}
                                            required
                                            min="0"
                                            style={{
                                                width: '100%',
                                                padding: '12px 12px 12px 40px',
                                                background: 'rgba(15, 23, 42, 0.6)',
                                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                                borderRadius: '8px',
                                                color: 'white',
                                                fontSize: '1rem'
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div>
                                    <label style={{ display: 'block', color: '#94a3b8', marginBottom: '8px', fontSize: '0.9rem' }}>Max Uses</label>
                                    <input
                                        type="number"
                                        name="maxUses"
                                        value={formData.maxUses}
                                        onChange={handleInputChange}
                                        required
                                        min="1"
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
                                <div>
                                    <label style={{ display: 'block', color: '#94a3b8', marginBottom: '8px', fontSize: '0.9rem' }}>Expiry Date</label>
                                    <input
                                        type="date"
                                        name="expiryDate"
                                        value={formData.expiryDate}
                                        onChange={handleInputChange}
                                        style={{
                                            width: '100%',
                                            padding: '12px',
                                            background: 'rgba(15, 23, 42, 0.6)',
                                            border: '1px solid rgba(255, 255, 255, 0.1)',
                                            borderRadius: '8px',
                                            color: 'white',
                                            fontSize: '1rem',
                                            colorScheme: 'dark'
                                        }}
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                style={{
                                    marginTop: '16px',
                                    padding: '14px',
                                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                    border: 'none',
                                    borderRadius: '12px',
                                    color: 'white',
                                    fontWeight: '600',
                                    fontSize: '1rem',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px'
                                }}
                            >
                                <Save size={20} />
                                Create Coupon
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminCoupons;
