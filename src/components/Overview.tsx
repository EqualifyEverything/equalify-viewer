

interface OverviewProps {
    activeBlockers: number;
    uniqueUrls: number;
    ignoredBlockers: number;
}

const Overview = ({ activeBlockers, uniqueUrls, ignoredBlockers }: OverviewProps) => {

    return (
        <div className="card overview-section" style={{ marginBottom: '2rem' }}>
            <h2 style={{ marginBottom: '1rem', fontSize: '1.25rem', fontWeight: 600 }}>Accessibility Overview</h2>
            <p style={{ color: 'var(--neutral-600)', marginBottom: '1.5rem' }}>
                This dashboard aggregates accessibility violations detected across the selected dataset.
                Use the data below to identify high-priority pages and track progress over time.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                <div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--neutral-500)', fontWeight: 500 }}>Active Blockers</div>
                    <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-primary-main)' }}>
                        {activeBlockers.toLocaleString()}
                    </div>
                </div>
                <div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--neutral-500)', fontWeight: 500 }}>Unique Pages (Selected Dataset)</div>
                    <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--neutral-900)' }}>
                        {uniqueUrls.toLocaleString()}
                    </div>
                </div>
                <div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--neutral-500)', fontWeight: 500 }}>Manually Ignored (Selected Dataset)</div>
                    <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--neutral-600)' }}>
                        {ignoredBlockers.toLocaleString()}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Overview;
