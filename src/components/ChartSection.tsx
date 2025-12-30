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
} from 'recharts';
import type { Blocker, Dataset } from '../services/DataManager';
import { parseMessages } from '../utils/MessageParser';

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
            count: ds.blockers.length,
            // Add a short label for the axis
            label: ds.name.length > 20 ? ds.name.substring(0, 20) + '...' : ds.name
        }));
    }, [datasets]);

    // 2. Top Messages Data (Aggregated)
    const messageChartData = useMemo(() => {
        const grouped: Record<string, number> = {};
        aggregatedData.forEach(item => {
            const rawMsg = item.messages?.[0] || 'Unknown Issue';
            const parsed = parseMessages(rawMsg);
            const rule = parsed[0]?.rule || 'Unknown Issue';
            grouped[rule] = (grouped[rule] || 0) + 1;
        });
        return Object.entries(grouped)
            .map(([name, count]) => ({ name: name.length > 50 ? name.substring(0, 50) + '...' : name, fullName: name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10); // Top 10
    }, [aggregatedData]);

    // 3. Top URLs Data (Aggregated)
    const urlChartData = useMemo(() => {
        const grouped: Record<string, number> = {};
        aggregatedData.forEach(item => {
            const url = item.url || 'Unknown URL';
            grouped[url] = (grouped[url] || 0) + 1;
        });
        return Object.entries(grouped)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10); // Top 10
    }, [aggregatedData]);

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
                                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="var(--color-primary-main)" stopOpacity={0.2} />
                                    <stop offset="95%" stopColor="var(--color-primary-main)" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--neutral-200)" />
                            <XAxis
                                dataKey="label"
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
                            />
                            <Area
                                type="monotone"
                                dataKey="count"
                                name="Issues"
                                stroke="var(--color-primary-main)"
                                strokeWidth={2}
                                fillOpacity={1}
                                fill="url(#colorCount)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Row 2: Top Issues & Top URLs */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                {/* Top Messages */}
                <div className="card">
                    <h3 style={{ marginBottom: '1.5rem', fontSize: '1.125rem', fontWeight: 600 }}>Most Frequent Issues (Aggregate)</h3>
                    <div style={{ width: '100%', height: 400 }}>
                        <ResponsiveContainer>
                            <BarChart layout="vertical" data={messageChartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="var(--neutral-200)" />
                                <XAxis type="number" stroke="var(--neutral-500)" fontSize={12} />
                                <YAxis
                                    type="category"
                                    dataKey="name"
                                    stroke="var(--neutral-500)"
                                    fontSize={11}
                                    width={150}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                                    cursor={{ fill: 'var(--neutral-100)' }}
                                    formatter={(value: number | undefined) => [value, 'Occurrences']}
                                />
                                <Bar dataKey="count" fill="var(--color-primary-main)" radius={[0, 4, 4, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Top URLs */}
                <div className="card">
                    <h3 style={{ marginBottom: '1.5rem', fontSize: '1.125rem', fontWeight: 600 }}>URLs with Most Issues (Aggregate)</h3>
                    <div style={{ width: '100%', height: 400 }}>
                        <ResponsiveContainer>
                            <BarChart layout="vertical" data={urlChartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="var(--neutral-200)" />
                                <XAxis type="number" stroke="var(--neutral-500)" fontSize={12} />
                                <YAxis
                                    type="category"
                                    dataKey="name"
                                    stroke="var(--neutral-500)"
                                    fontSize={11}
                                    width={200}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(val) => val.replace(/^https?:\/\//, '').substring(0, 30) + (val.length > 30 ? '...' : '')}
                                />
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                                    cursor={{ fill: 'var(--neutral-100)' }}
                                    formatter={(value: number | undefined) => [value, 'Issues']}
                                />
                                <Bar dataKey="count" fill="#8884d8" radius={[0, 4, 4, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChartSection;
