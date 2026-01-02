
import { useState, useEffect, useMemo } from 'react';
import {
    loadDataset,
    type Dataset,
    getIgnoredIds,
    toggleIgnoreId,
    bulkIgnoreIds
} from '../services/DataManager';
import Overview from './Overview';
import ChartSection from './ChartSection';
import TableSection from './TableSection';
import { Loader2, AlertCircle, Trash2, Plus } from 'lucide-react';

const Dashboard = () => {
    const [inputUrl, setInputUrl] = useState('');
    const [datasets, setDatasets] = useState<Dataset[]>([]);
    const [loading, setLoading] = useState(false);
    const [ignoredIds, setIgnoredIds] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);

    // Initial Load
    useEffect(() => {
        setIgnoredIds(getIgnoredIds());
    }, []);

    const handleLoadUrl = async (url: string) => {
        setLoading(true);
        setError(null);
        try {
            const newDataset = await loadDataset(url);

            // Assign color and index
            const nextIndex = datasets.length + 1;
            const colors = [
                '#3B82F6', // Blue
                '#10B981', // Emerald
                '#8B5CF6', // Violet
                '#F97316', // Orange
                '#EC4899', // Pink
                '#06B6D4', // Cyan
            ];
            const color = colors[(nextIndex - 1) % colors.length];

            newDataset.index = nextIndex;
            newDataset.color = color;

            setDatasets(prev => [...prev, newDataset]);
            setInputUrl(''); // Clear input on success
        } catch (err: any) {
            console.error("Failed to load data", err);
            setError(err.message || "Failed to load dataset");
        } finally {
            setLoading(false);
        }
    };

    const handleLoadClick = () => {
        if (inputUrl) {
            const trimmed = inputUrl.trim();
            if (trimmed.startsWith('http')) {
                handleLoadUrl(trimmed);
            } else {
                setError("Please enter a valid URL starting with http:// or https://");
            }
        }
    };

    const handleRemoveDataset = (id: string) => {
        setDatasets(prev => prev.filter(d => d.id !== id));
    };

    // Derived State
    const allBlockers = useMemo(() => {
        return datasets.flatMap(d => d.blockers.map(b => ({
            ...b,
            datasetName: d.name,
            datasetColor: d.color,
            datasetIndex: d.index
        })));
    }, [datasets]);

    const activeData = useMemo(() => {
        return allBlockers.filter(d => !ignoredIds.includes(d.id));
    }, [allBlockers, ignoredIds]);

    const handleToggleIgnore = (id: string) => {
        const newIds = toggleIgnoreId(id);
        setIgnoredIds(newIds);
    };

    const handleBulkIgnore = (ids: string[], shouldIgnore: boolean) => {
        const newIds = bulkIgnoreIds(ids, shouldIgnore);
        setIgnoredIds(newIds);
    };

    return (
        <div className="container" style={{ paddingBottom: '4rem' }}>
            {/* Header / Selector */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '2rem 0', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--neutral-900)' }}>Equalify Data Navigator</h1>
                    <p style={{ color: 'var(--neutral-500)', marginTop: '0.25rem' }}>Accessibility Insights Dashboard</p>
                </div>

                <div style={{ flex: 1, minWidth: '300px', maxWidth: '800px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <input
                            type="text"
                            placeholder="Enter API URL..."
                            value={inputUrl}
                            onChange={(e) => setInputUrl(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleLoadClick();
                            }}
                            style={{
                                padding: '0.625rem',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--neutral-300)',
                                flex: 1,
                                fontSize: '0.875rem',
                                outline: 'none',
                                transition: 'border-color 0.2s'
                            }}
                        />
                        <button
                            className="btn btn-primary"
                            onClick={handleLoadClick}
                            disabled={loading}
                            style={{ whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                        >
                            {loading ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />}
                            Add Dataset
                        </button>
                    </div>
                </div>
            </div>

            {error && (
                <div style={{
                    padding: '1rem',
                    background: '#FEF2F2',
                    border: '1px solid #FECACA',
                    borderRadius: 'var(--radius-md)',
                    color: '#B91C1C',
                    marginBottom: '2rem',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.75rem',
                    fontSize: '0.9rem'
                }}>
                    <AlertCircle size={20} style={{ marginTop: '0.1rem', flexShrink: 0 }} />
                    <div>
                        <div style={{ fontWeight: 600 }}>Data Loading Issue</div>
                        <div style={{ marginTop: '0.25rem' }}>{error}</div>
                    </div>
                </div>
            )}

            {/* Loaded Datasets List */}
            {datasets.length > 0 && (
                <div style={{ marginBottom: '2rem', display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                    {datasets.map(ds => (
                        <div key={ds.id} style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            padding: '0.5rem 0.75rem',
                            background: 'white',
                            border: '1px solid var(--neutral-200)',
                            borderRadius: '2rem',
                            fontSize: '0.875rem',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                            borderLeft: `4px solid ${ds.color || 'var(--neutral-300)'}`
                        }}>
                            <span style={{
                                background: ds.color || 'var(--neutral-300)',
                                color: 'white',
                                borderRadius: '50%',
                                width: '20px',
                                height: '20px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.75rem',
                                fontWeight: 600
                            }}>
                                {ds.index}
                            </span>
                            <span style={{ fontWeight: 500, color: 'var(--neutral-700)' }}>{ds.name}</span>
                            <span style={{ color: 'var(--neutral-400)', fontSize: '0.75rem' }}>({ds.blockers.length} items)</span>
                            <button
                                type="button"
                                onClick={() => handleRemoveDataset(ds.id)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'var(--neutral-400)',
                                    cursor: 'pointer',
                                    padding: '0.4rem',
                                    borderRadius: '50%',
                                    transition: 'all 0.2s',
                                    background: 'var(--neutral-100)',
                                    border: 'none',
                                    marginLeft: '0.25rem'
                                }}
                                onMouseOver={(e) => {
                                    e.currentTarget.style.color = '#B91C1C';
                                    e.currentTarget.style.background = '#FEE2E2';
                                }}
                                onMouseOut={(e) => {
                                    e.currentTarget.style.color = 'var(--neutral-400)';
                                    e.currentTarget.style.background = 'var(--neutral-100)';
                                }}
                                title="Remove dataset"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {loading && datasets.length === 0 ? (
                <div style={{ height: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--neutral-500)' }}>
                    <Loader2 className="animate-spin" size={48} style={{ animation: 'spin 1s linear infinite' }} />
                    <p style={{ marginTop: '1rem' }}>Loading dataset...</p>
                    <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } } `}</style>
                </div>
            ) : datasets.length === 0 ? (
                <div style={{
                    height: '400px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--neutral-500)',
                    background: 'white',
                    borderRadius: 'var(--radius-lg)',
                    border: '2px dashed var(--neutral-200)',
                    margin: '2rem 0'
                }}>
                    <h3 style={{ color: 'var(--neutral-800)', fontWeight: 600 }}>Ready to analyze?</h3>
                    <p style={{ marginTop: '0.5rem', textAlign: 'center', maxWidth: '400px' }}>
                        Enter an Equalify API URL or a direct JSON link above to get started with your accessibility audit data.
                    </p>
                </div>
            ) : (
                <>
                    <Overview
                        datasets={datasets}
                        ignoredIds={ignoredIds}
                    />

                    <ChartSection
                        aggregatedData={activeData}
                        datasets={datasets}
                    />

                    <TableSection
                        data={allBlockers}
                        ignoredIds={ignoredIds}
                        onToggleIgnore={handleToggleIgnore}
                        onBulkIgnore={handleBulkIgnore}
                    />
                </>
            )}
        </div>
    );
};

export default Dashboard;
