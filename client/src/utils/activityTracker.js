/**
 * FarmGuide Activity Tracker Utility
 * Stores and retrieves recent user actions in localStorage
 */

const STORAGE_KEY = 'farmguide_recent_activity';
const MAX_ACTIVITIES = 25;

export const formatRelativeTime = (timestamp) => {
    if (!timestamp) return 'Just now';
    const now = new Date();
    const date = new Date(timestamp);
    const diffMs = now - date;
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes} min ago`;
    if (diffHours < 24) {
        return date.toLocaleDateString() === now.toLocaleDateString()
            ? `Today, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
            : `Yesterday, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    if (diffDays === 1) return `Yesterday, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    return `${diffDays} days ago`;
};

export const getRecentActivities = () => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) return [];
        const parsed = JSON.parse(stored);
        if (!Array.isArray(parsed)) return [];
        return parsed.map(item => ({
            ...item,
            time: formatRelativeTime(item.timestamp)
        }));
    } catch {
        return [];
    }
};

export const addRecentActivity = ({ type, title, subtitle, to }) => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        let list = stored ? JSON.parse(stored) : [];
        if (!Array.isArray(list)) list = [];

        const newEntry = {
            id: Date.now().toString(),
            type, // 'disease' | 'crop' | 'market' | 'weather'
            title,
            subtitle,
            to: to || '#',
            timestamp: new Date().toISOString()
        };

        // Prepend and keep max activities
        list = [newEntry, ...list.filter(item => !(item.type === type && item.subtitle === subtitle))].slice(0, MAX_ACTIVITIES);

        localStorage.setItem(STORAGE_KEY, JSON.stringify(list));

        // Dispatch storage event so dashboard updates in real time if open
        window.dispatchEvent(new Event('farmguide_activity_updated'));
        return list;
    } catch (e) {
        console.error('Failed to log recent activity', e);
        return [];
    }
};
