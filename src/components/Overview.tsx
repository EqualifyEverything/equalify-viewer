

import type { Dataset } from '../services/DataManager';

interface OverviewProps {
    datasets: Dataset[];
    ignoredIds: string[];
}

const Overview = ({ datasets, ignoredIds }: OverviewProps) => {

    const getDatasetStats = (ds: Dataset) => {
        const active = ds.blockers.filter(b => !ignoredIds.includes(b.id));
        const unique = new Set(ds.blockers.map(b => b.url)).size;
        return { activeCount: active.length, uniqueUrlCount: unique };
    };

    return (
        <div style={{ marginBottom: '2rem' }}>
            {datasets.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                    {datasets.map(ds => {
                        const stats = getDatasetStats(ds);
                        return (
                            <div key={ds.id} className="card" style={{ borderTop: `4px solid ${ds.color || 'var(--neutral-300)'}` }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                                    <span style={{
                                        background: ds.color || 'var(--neutral-300)',
                                        color: 'white',
                                        borderRadius: '50%',
                                        width: '24px',
                                        height: '24px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '0.8rem',
                                        fontWeight: 700
                                    }}>
                                        {ds.index}
                                    </span>
                                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0 }}>{ds.name}</h3>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--neutral-500)' }}>Active Blockers</div>
                                        <div style={{ fontSize: '1.5rem', fontWeight: 600, color: ds.color || 'var(--neutral-800)' }}>
                                            {stats.activeCount.toLocaleString()}
                                        </div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--neutral-500)' }}>Unique Pages</div>
                                        <div style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--neutral-800)' }}>
                                            {stats.uniqueUrlCount.toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default Overview;
