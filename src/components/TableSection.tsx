import { useState, useMemo } from 'react';
import type { Blocker } from '../services/DataManager';
import { format, parseISO } from 'date-fns';
import { Search, ExternalLink, Eye, EyeOff, CheckSquare, Square, ChevronDown, ChevronRight, HelpCircle } from 'lucide-react';
import { parseMessages } from '../utils/MessageParser';

interface TableSectionProps {
    data: Blocker[];
    ignoredIds: string[];
    onToggleIgnore: (id: string) => void;
    onBulkIgnore: (ids: string[], ignore: boolean) => void;
}

type GroupingMode = 'message' | 'url' | 'none';

const TableSection = ({ data, ignoredIds, onToggleIgnore, onBulkIgnore }: TableSectionProps) => {
    const [search, setSearch] = useState('');
    const [showIgnored, setShowIgnored] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
    const [groupingMode, setGroupingMode] = useState<GroupingMode>('message');

    // Filter Data
    const filteredData = useMemo(() => {
        return data.filter(item => {
            const isIgnored = ignoredIds.includes(item.id);
            if (!showIgnored && isIgnored) return false;
            if (showIgnored && !isIgnored) return false;

            const primaryMessage = item.messages?.[0] || '';
            const matchSearch =
                item.url.toLowerCase().includes(search.toLowerCase()) ||
                primaryMessage.toLowerCase().includes(search.toLowerCase());

            return matchSearch;
        });
    }, [data, ignoredIds, showIgnored, search]);

    // Grouping Logic
    const groupedData = useMemo(() => {
        if (groupingMode === 'none') {
            return { 'All Items': filteredData };
        }

        const groups: Record<string, Blocker[]> = {};
        filteredData.forEach(item => {
            let key = '';
            if (groupingMode === 'message') {
                key = item.messages?.[0] || 'Unknown Issue';
            } else if (groupingMode === 'url') {
                key = item.url || 'Unknown URL';
            }

            if (!groups[key]) groups[key] = [];
            groups[key].push(item);
        });
        return groups;
    }, [filteredData, groupingMode]);

    const sortedGroupKeys = useMemo(() => {
        const keys = Object.keys(groupedData);
        if (groupingMode === 'none') return keys;

        // Sort by count descending
        return keys.sort((a, b) => groupedData[b].length - groupedData[a].length);
    }, [groupedData, groupingMode]);

    // Selection Logic
    const handleSelectGroup = (key: string) => {
        const items = groupedData[key];
        const itemIds = items.map(d => d.id);
        const allSelected = itemIds.every(id => selectedIds.has(id));

        const next = new Set(selectedIds);
        itemIds.forEach(id => {
            if (allSelected) next.delete(id);
            else next.add(id);
        });
        setSelectedIds(next);
    };

    const handleSelectRow = (id: string) => {
        const next = new Set(selectedIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedIds(next);
    };

    const handleBulkAction = () => {
        onBulkIgnore(Array.from(selectedIds), !showIgnored);
        setSelectedIds(new Set());
    };

    const toggleExpand = (key: string) => {
        const next = new Set(expandedGroups);
        if (next.has(key)) next.delete(key);
        else next.add(key);
        setExpandedGroups(next);
    };

    const renderItemRow = (item: Blocker) => {
        const isSelected = selectedIds.has(item.id);
        const primaryMessage = item.messages?.[0] || 'Unknown Issue';

        return (
            <div key={item.id} style={{ padding: '1rem', borderBottom: '1px solid var(--neutral-100)', display: 'grid', gridTemplateColumns: '40px 1fr auto', gap: '1rem', background: 'white' }}>
                <div onClick={() => handleSelectRow(item.id)} style={{ cursor: 'pointer', paddingTop: '0.25rem' }}>
                    {isSelected ? <CheckSquare size={18} color="var(--color-primary-main)" /> : <Square size={18} color="var(--neutral-400)" />}
                </div>

                <div style={{ overflow: 'hidden' }}>
                    <div style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {groupingMode !== 'url' && (
                            <a href={item.url} target="_blank" rel="noopener noreferrer" style={{ fontWeight: 500, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--color-primary-main)' }}>
                                {item.url.length > 60 ? '...' + item.url.slice(-60) : item.url}
                                <ExternalLink size={12} />
                            </a>
                        )}
                        {groupingMode !== 'message' && (
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                {parseMessages(primaryMessage).map((v, i) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                        <span style={{
                                            fontSize: '0.7rem',
                                            color: 'var(--color-primary-main)',
                                            background: 'rgba(255, 69, 0, 0.1)',
                                            padding: '1px 5px',
                                            borderRadius: '4px',
                                            fontWeight: 600,
                                            whiteSpace: 'nowrap'
                                        }}>
                                            {v.rule}
                                        </span>
                                        <span style={{ fontSize: '0.8rem', color: 'var(--neutral-700)' }}>
                                            {v.description.length > 80 ? v.description.slice(0, 80) + '...' : v.description}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            {/* Dataset Badge */}
                            {(item as any).datasetIndex && (
                                <span style={{
                                    fontSize: '0.7rem',
                                    fontWeight: 700,
                                    color: 'white',
                                    background: (item as any).datasetColor || 'var(--neutral-500)',
                                    padding: '2px 6px',
                                    borderRadius: '12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    minWidth: '20px',
                                    height: '20px',
                                    marginRight: '0.25rem'
                                }} title={(item as any).datasetName}>
                                    {(item as any).datasetIndex}
                                </span>
                            )}
                            <span style={{ fontSize: '0.75rem', color: 'var(--neutral-500)' }}>
                                {format(parseISO(item.created_at), 'MMM d, yyyy')}
                            </span>
                        </div>
                    </div>

                    {/* Code Snippet */}
                    <div style={{ background: 'var(--neutral-900)', color: 'var(--neutral-50)', padding: '0.75rem', borderRadius: '4px', fontFamily: 'monospace', fontSize: '0.8rem', overflowX: 'auto', marginBottom: '0.5rem' }}>
                        <code>{item.content}</code>
                    </div>

                    {/* Categories tag if available */}
                    {item.categories && item.categories.length > 0 && (
                        <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
                            {item.categories.map(cat => (
                                <span key={cat} style={{ fontSize: '0.75rem', color: 'var(--neutral-600)', background: 'var(--neutral-100)', padding: '2px 4px', borderRadius: '4px' }}>
                                    {cat}
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                <div>
                    <button className="btn btn-ghost" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }} onClick={() => onToggleIgnore(item.id)}>
                        {showIgnored ? 'Restore' : 'Ignore'}
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="card table-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 600, margin: 0 }}>Detailed Findings</h3>

                    {/* Visual Divider */}
                    <div style={{ width: '1px', height: '24px', background: 'var(--neutral-300)' }}></div>

                    {/* Grouping Toggle */}
                    <div style={{ display: 'flex', gap: '0.25rem', background: 'var(--neutral-100)', padding: '0.25rem', borderRadius: 'var(--radius-md)' }}>
                        <button
                            onClick={() => setGroupingMode('message')}
                            style={{
                                padding: '0.4rem 0.75rem',
                                background: groupingMode === 'message' ? 'white' : 'transparent',
                                borderRadius: '4px',
                                boxShadow: groupingMode === 'message' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
                                border: 'none',
                                fontSize: '0.8rem',
                                fontWeight: 600,
                                color: groupingMode === 'message' ? 'var(--color-primary-main)' : 'var(--neutral-500)',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            Messages
                        </button>
                        <button
                            onClick={() => setGroupingMode('url')}
                            style={{
                                padding: '0.4rem 0.75rem',
                                background: groupingMode === 'url' ? 'white' : 'transparent',
                                borderRadius: '4px',
                                boxShadow: groupingMode === 'url' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
                                border: 'none',
                                fontSize: '0.8rem',
                                fontWeight: 600,
                                color: groupingMode === 'url' ? 'var(--color-primary-main)' : 'var(--neutral-500)',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            URLs
                        </button>
                        <button
                            onClick={() => setGroupingMode('none')}
                            style={{
                                padding: '0.4rem 0.75rem',
                                background: groupingMode === 'none' ? 'white' : 'transparent',
                                borderRadius: '4px',
                                boxShadow: groupingMode === 'none' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
                                border: 'none',
                                fontSize: '0.8rem',
                                fontWeight: 600,
                                color: groupingMode === 'none' ? 'var(--color-primary-main)' : 'var(--neutral-500)',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            None
                        </button>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <div style={{ position: 'relative' }}>
                        <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--neutral-400)' }} />
                        <input
                            type="text"
                            placeholder="Search URL or messages..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            style={{ width: '250px', paddingLeft: '32px' }}
                        />
                    </div>
                    <button
                        className={`btn ${showIgnored ? 'btn-primary' : 'btn-outline'}`}
                        onClick={() => { setShowIgnored(!showIgnored); setSelectedIds(new Set()); }}
                    >
                        {showIgnored ? <Eye size={16} /> : <EyeOff size={16} />}
                        {showIgnored ? 'Viewing Ignored' : 'View Ignored'}
                    </button>
                </div>
            </div>

            {selectedIds.size > 0 && (
                <div style={{ padding: '0.75rem', background: 'var(--neutral-100)', borderRadius: 'var(--radius-md)', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 500, fontSize: '0.875rem' }}>{selectedIds.size} items selected</span>
                    <button className="btn btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={handleBulkAction}>
                        {showIgnored ? 'Restore Selected' : 'Ignore Selected'}
                    </button>
                </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {groupingMode === 'none' ? (
                    <div style={{ border: '1px solid var(--neutral-200)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                        {sortedGroupKeys.length > 0 && groupedData[sortedGroupKeys[0]].map(item => renderItemRow(item))}
                        {sortedGroupKeys.length === 0 && (
                            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--neutral-500)' }}>
                                No findings matching your criteria.
                            </div>
                        )}
                    </div>
                ) : (
                    sortedGroupKeys.map(key => {
                        const items = groupedData[key];
                        const isExpanded = expandedGroups.has(key);
                        const allSelected = items.every(d => selectedIds.has(d.id));
                        const someSelected = items.some(d => selectedIds.has(d.id));
                        // parseMessages helper might expect just a string content, assuming key is the message string
                        const parsedViolations = parseMessages(key);

                        return (
                            <div key={key} style={{ border: '1px solid var(--neutral-200)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                                <div
                                    style={{
                                        background: 'var(--neutral-50)',
                                        padding: '0.75rem',
                                        display: 'flex',
                                        alignItems: 'flex-start',
                                        gap: '1rem',
                                        cursor: 'pointer',
                                        borderBottom: isExpanded ? '1px solid var(--neutral-200)' : 'none'
                                    }}
                                    onClick={() => toggleExpand(key)}
                                >
                                    <div onClick={(e) => { e.stopPropagation(); handleSelectGroup(key); }} style={{ marginTop: '4px' }}>
                                        {allSelected ? <CheckSquare size={18} color="var(--color-primary-main)" /> :
                                            someSelected ? <CheckSquare size={18} color="var(--neutral-400)" opacity={0.5} /> :
                                                <Square size={18} color="var(--neutral-400)" />
                                        }
                                    </div>

                                    <div style={{ flex: 1 }}>
                                        {groupingMode === 'message' ? (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                {parsedViolations.map((v, i) => (
                                                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.9rem' }}>
                                                        <div style={{
                                                            display: 'inline-block',
                                                            padding: '0.1rem 0.4rem',
                                                            background: 'rgba(255, 69, 0, 0.1)',
                                                            color: 'var(--color-primary-main)',
                                                            borderRadius: '4px',
                                                            fontSize: '0.75rem',
                                                            fontWeight: 600,
                                                            whiteSpace: 'nowrap',
                                                            marginTop: '2px'
                                                        }}>
                                                            {v.rule}
                                                        </div>
                                                        <span style={{ color: 'var(--neutral-700)' }}>
                                                            {v.description}
                                                        </span>
                                                        {v.helpUrl && (
                                                            <a href={v.helpUrl} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ color: 'var(--neutral-400)', marginTop: '2px' }}>
                                                                <HelpCircle size={14} />
                                                            </a>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            // URL Grouping Header
                                            <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--neutral-800)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                {key}
                                                <a href={key} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ color: 'var(--color-primary-main)' }}>
                                                    <ExternalLink size={14} />
                                                </a>
                                            </div>
                                        )}
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--neutral-500)', whiteSpace: 'nowrap' }}>
                                            {items.length} {items.length === 1 ? 'instance' : 'instances'}
                                        </div>
                                        {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                                    </div>
                                </div>

                                {isExpanded && (
                                    <div style={{ background: 'white' }}>
                                        {items.map(item => renderItemRow(item))}
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}

                {sortedGroupKeys.length === 0 && (
                    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--neutral-500)' }}>
                        No findings matching your criteria.
                    </div>
                )}
            </div>
        </div>
    );
};

export default TableSection;
