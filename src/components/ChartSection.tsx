import { useMemo } from 'react';
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend
} from 'recharts';
import type { Blocker, Dataset } from '../services/DataManager';

interface ChartSectionProps {
    aggregatedData: Blocker[];
    datasets: Dataset[];
}

const ChartSection = ({ aggregatedData, datasets }: ChartSectionProps) => {
    // 1. Time Series / Dataset Trends Data
    const timeChartData = useMemo(() => {
        // Sort datasets by timestamp (when they were added/created)
        const sortedDatasets = [...datasets].sort((a, b) => a.timestamp - b.timestamp);
        return sortedDatasets.map(ds => ({
            name: ds.name || 'Untitled',
            id: ds.id,
            count: ds.blockers.length,
            color: ds.color,
            // Add a short label for the axis
            userLabel: ds.index ? `#${ds.index}` : (ds.name.length > 15 ? ds.name.substring(0, 15) + '...' : ds.name),
            fullLabel: ds.name
        }));
    }, [datasets]);

    const gradientId = "datasetGradient";


    // 3. Top URLs Data (Comparative)
    const urlChartData = useMemo(() => {
        const globalCounts: Record<string, number> = {};

        aggregatedData.forEach(item => {
            const url = item.url || 'Unknown URL';
            globalCounts[url] = (globalCounts[url] || 0) + 1;
        });

        const topUrls = Object.entries(globalCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([url]) => url);

        return topUrls.map(url => {
            const row: any = {
                name: url,
                displayName: url.replace(/^https?:\/\//, '').substring(0, 30) + (url.length > 30 ? '...' : '')
            };

            datasets.forEach(ds => {
                const count = ds.blockers.filter(b => b.url === url).length;
                row[ds.id] = count;
            });
            return row;
        });
    }, [aggregatedData, datasets]);

    if (datasets.length === 0) {
        return (
            <div className="card" style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--neutral-500)' }}>
                No data available to chart
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', marginBottom: '2rem' }}>
            {/* Row 1: Time Series / Dataset Trend */}
            <div className="card">
                <h3 style={{ marginBottom: '1.5rem', fontSize: '1.125rem', fontWeight: 600 }}>Total Blockers per Dataset</h3>
                <div style={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer>
                        <AreaChart data={timeChartData}>
                            <defs>
                                <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="0">
                                    {timeChartData.map((entry, index) => {
                                        const offset = timeChartData.length > 1
                                            ? Math.round((index / (timeChartData.length - 1)) * 100)
                                            : 0;
                                        return (
                                            <stop
                                                key={entry.id}
                                                offset={`${offset}%`}
                                                stopColor={entry.color || 'var(--color-primary-main)'}
                                                stopOpacity={0.8}
                                            />
                                        );
                                    })}
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--neutral-200)" />
                            <XAxis
                                dataKey="userLabel"
                                stroke="var(--neutral-500)"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                            />
                            <YAxis
                                stroke="var(--neutral-500)"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                            />
                            <Tooltip
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                                cursor={{ stroke: 'var(--neutral-300)' }}
                                formatter={(value: any, _name: any, props: any) => {
                                    // Custom tooltip to show dataset name
                                    return [value, props.payload.fullLabel];
                                }}
                            />
                            <Area
                                type="monotone"
                                dataKey="count"
                                name="Issues"
                                stroke="none"
                                fill={`url(#${gradientId})`}
                                strokeWidth={2}
                                fillOpacity={1}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Row 2: Top URLs */}
            <div>

                {/* Top URLs */}
                <div className="card">
                    <h3 style={{ marginBottom: '1.5rem', fontSize: '1.125rem', fontWeight: 600 }}>URLs with Most Issues (Compare)</h3>
                    <div style={{ width: '100%', height: 400 }}>
                        <ResponsiveContainer>
                            <BarChart layout="vertical" data={urlChartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="var(--neutral-200)" />
                                <XAxis type="number" stroke="var(--neutral-500)" fontSize={12} />
                                <YAxis
                                    type="category"
                                    dataKey="displayName"
                                    stroke="var(--neutral-500)"
                                    fontSize={11}
                                    width={200}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                                    cursor={{ fill: 'var(--neutral-100)' }}
                                />
                                <Legend />
                                {datasets.map(ds => (
                                    <Bar
                                        key={ds.id}
                                        dataKey={ds.id}
                                        name={`#${ds.index} ${ds.name}`}
                                        fill={ds.color || '#8884d8'}
                                        radius={[0, 4, 4, 0]}
                                        barSize={20}
                                    />
                                ))}
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChartSection;
