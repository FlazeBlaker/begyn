import React, { useState } from 'react';
import { auth, db, doc, updateDoc } from '../../services/firebase';
import AdUnit from '../../components/AdUnit';

const MobileRoadmap = ({ steps, onStepComplete, onActionItemComplete }) => {
    const [expandedStep, setExpandedStep] = useState(null);

    const toggleActionItem = (stepId, index) => {
        if (onActionItemComplete) {
            onActionItemComplete(stepId, index);
        }

        // Auto-scroll to next item
        const step = steps.find(s => s.id === stepId);
        if (step && step.actionItems) {
            const currentItem = step.actionItems[index];
            // If we are marking as done (currently not completed)
            if (!currentItem.completed) {
                // Find next incomplete after this one
                const nextIndex = step.actionItems.findIndex((item, idx) => idx > index && !item.completed);
                if (nextIndex !== -1) {
                    setTimeout(() => {
                        const el = document.getElementById(`action-item-${stepId}-${nextIndex}`);
                        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }, 300);
                }
            }
        }
    };

    const handleMarkDone = async (stepId) => {
        // Call parent callback to update state
        if (onStepComplete) {
            await onStepComplete(stepId);
        }

        // Close the expanded step
        setExpandedStep(null);

        // Find the next incomplete step and expand it
        const currentIndex = steps.findIndex(s => s.id === stepId);
        if (currentIndex < steps.length - 1) {
            const nextStep = steps[currentIndex + 1];
            if (nextStep.status !== 'completed') {
                setTimeout(() => {
                    setExpandedStep(nextStep.id);
                    // Scroll to the next step
                    const element = document.getElementById(`step-${nextStep.id}`);
                    if (element) {
                        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                }, 300);
            }
        }
    };

    return (
        <div className="mobile-roadmap-container">
            <h2 className="mobile-roadmap-title">Your Journey</h2>
            <div className="mobile-timeline">
                {steps.map((step, index) => {
                    const isCompleted = step.status === 'completed';
                    const isCurrent = step.status === 'in-progress';
                    const isLocked = step.status === 'locked';
                    const isExpanded = expandedStep === step.id;

                    let statusClass = 'locked';
                    let icon = '🔒';

                    if (isCompleted) {
                        statusClass = 'completed';
                        icon = '✓';
                    } else if (isCurrent) {
                        statusClass = 'current';
                        icon = '📍';
                    }

                    return (
                        <div
                            key={step.id}
                            id={`step-${step.id}`}
                            className={`timeline-step ${statusClass} ${isExpanded ? 'expanded' : ''}`}
                        >
                            <div className="timeline-icon">{icon}</div>
                            <div className="timeline-content">
                                <div
                                    className="timeline-title"
                                    onClick={() => {
                                        if (!isLocked) {
                                            setExpandedStep(isExpanded ? null : step.id);
                                        }
                                    }}
                                    style={{ cursor: isLocked ? 'not-allowed' : 'pointer' }}
                                >
                                    {step.title}
                                </div>

                                {!isExpanded && (
                                    <>
                                        <div className="timeline-desc">{step.description}</div>
                                        <div className="timeline-meta">
                                            <span>⏱️ {step.timeEstimate || '30 mins'}</span>
                                            <span>{step.category || 'General'}</span>
                                        </div>
                                    </>
                                )}

                                {isExpanded && (
                                    <div className="timeline-details">
                                        <div className="timeline-desc-full">{step.detailedDescription || step.description}</div>
                                        <div className="timeline-meta">
                                            <span>⏱️ {step.timeEstimate || '30 mins'}</span>
                                            <span>{step.category || 'General'}</span>
                                        </div>

                                        {/* Action Items */}
                                        {step.actionItems && step.actionItems.length > 0 && (
                                            <div style={{ marginTop: 16 }}>
                                                <h4 style={{ color: "#4ade80", margin: "0 0 12px 0", fontSize: "0.9rem" }}>📝 Action Plan:</h4>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                    {step.actionItems.map((item, i) => {
                                                        const isDone = item.completed || false;
                                                        const title = item.title || item; // Handle object or string
                                                        return (
                                                            <div key={i} id={`action-item-${step.id}-${i}`} style={{
                                                                background: 'rgba(74, 20, 140, 0.2)',
                                                                padding: '12px',
                                                                borderRadius: '8px',
                                                                border: '1px solid rgba(124, 77, 255, 0.1)'
                                                            }}>
                                                                <div
                                                                    onClick={() => toggleActionItem(step.id, i)}
                                                                    style={{
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        gap: '10px',
                                                                        cursor: 'pointer'
                                                                    }}
                                                                >
                                                                    <div style={{
                                                                        minWidth: '20px',
                                                                        height: '20px',
                                                                        borderRadius: '4px',
                                                                        border: isDone ? 'none' : '2px solid rgba(255,255,255,0.3)',
                                                                        background: isDone ? '#4ade80' : 'transparent',
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        justifyContent: 'center',
                                                                        transition: 'all 0.2s'
                                                                    }}>
                                                                        {isDone && <span style={{ color: '#000', fontSize: '12px', fontWeight: 'bold' }}>✓</span>}
                                                                    </div>
                                                                    <h5 style={{ margin: 0, color: isDone ? '#4ade80' : '#e2e8f0', fontSize: '0.9rem', textDecoration: isDone ? 'line-through' : 'none' }}>
                                                                        {i + 1}. {title}
                                                                    </h5>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}

                                        {/* Suggestions */}
                                        {step.suggestions && step.suggestions.length > 0 && (
                                            <div style={{ marginTop: 16 }}>
                                                <h4 style={{ color: "#a855f7", margin: "0 0 8px 0", fontSize: "0.9rem" }}>💡 Pro Suggestions:</h4>
                                                <ul style={{ margin: 0, paddingLeft: 20, color: "#cbd5e1", fontSize: "0.9rem" }}>
                                                    {step.suggestions.map((s, i) => (
                                                        <li key={i} style={{ marginBottom: 4 }}>{s}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                        {/* Resources */}
                                        {step.resources && step.resources.length > 0 && (
                                            <div style={{ marginTop: 16 }}>
                                                <h4 style={{ color: "#38bdf8", margin: "0 0 8px 0", fontSize: "0.9rem" }}>🛠️ Recommended Tools:</h4>
                                                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                                                    {step.resources.map((r, i) => (
                                                        <a
                                                            key={i}
                                                            href={r.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            style={{
                                                                background: "rgba(56, 189, 248, 0.1)",
                                                                color: "#38bdf8",
                                                                padding: "4px 10px",
                                                                borderRadius: "6px",
                                                                textDecoration: "none",
                                                                fontSize: "0.85rem",
                                                                border: "1px solid rgba(56, 189, 248, 0.2)"
                                                            }}
                                                        >
                                                            {r.name} ↗
                                                        </a>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Generator Button */}
                                        {step.generatorLink && (
                                            <div style={{ marginTop: 16 }}>
                                                <a
                                                    href={step.generatorLink}
                                                    style={{
                                                        display: "block",
                                                        textAlign: "center",
                                                        background: "linear-gradient(90deg, #7C4DFF, #CE93D8)",
                                                        color: "white",
                                                        padding: "12px",
                                                        borderRadius: "8px",
                                                        textDecoration: "none",
                                                        fontWeight: "bold",
                                                        fontSize: "0.95rem",
                                                        boxShadow: "0 4px 12px rgba(124, 58, 237, 0.3)"
                                                    }}
                                                >
                                                    ✨ Use AI Generator
                                                </a>
                                            </div>
                                        )}

                                        {!isCompleted && (
                                            <button
                                                className="mark-done-btn"
                                                onClick={() => handleMarkDone(step.id)}
                                                disabled={step.subNodes && step.subNodes.some(sub => !sub.completed)}
                                                style={{
                                                    marginTop: '16px',
                                                    width: '100%',
                                                    padding: '12px 20px',
                                                    background: (step.subNodes && step.subNodes.some(sub => !sub.completed))
                                                        ? 'rgba(255,255,255,0.1)'
                                                        : 'linear-gradient(135deg, #7C4DFF, #9C27B0)',
                                                    color: (step.subNodes && step.subNodes.some(sub => !sub.completed))
                                                        ? 'rgba(255,255,255,0.3)'
                                                        : '#fff',
                                                    border: 'none',
                                                    borderRadius: '8px',
                                                    fontSize: '1rem',
                                                    fontWeight: '700',
                                                    cursor: (step.subNodes && step.subNodes.some(sub => !sub.completed)) ? 'not-allowed' : 'pointer',
                                                    boxShadow: (step.subNodes && step.subNodes.some(sub => !sub.completed))
                                                        ? 'none'
                                                        : '0 4px 12px rgba(124, 77, 255, 0.3)',
                                                    transition: 'all 0.2s'
                                                }}
                                            >
                                                {(step.subNodes && step.subNodes.some(sub => !sub.completed))
                                                    ? 'Complete Action Plan First'
                                                    : '✅ Mark Done'}
                                            </button>
                                        )}

                                        {isCompleted && (
                                            <div style={{
                                                marginTop: '16px',
                                                padding: '12px',
                                                background: 'rgba(74, 222, 128, 0.1)',
                                                border: '1px solid rgba(74, 222, 128, 0.3)',
                                                borderRadius: '8px',
                                                color: '#4ade80',
                                                textAlign: 'center',
                                                fontWeight: '700'
                                            }}>
                                                ✓ Completed
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
            <AdUnit slotId="1234567890" />
        </div>
    );
};

export default MobileRoadmap;
