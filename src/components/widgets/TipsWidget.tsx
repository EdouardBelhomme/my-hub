import React, { useState, useEffect } from 'react';
import { Lightbulb, RefreshCw, Sparkles } from 'lucide-react';
import styles from './TipsWidget.module.css';

const TIPS = [
    "Eat the frog: Do your most difficult task first thing in the morning.",
    "Use the Pomodoro Technique: 25 minutes of work, 5 minutes of break.",
    "The 2-minute rule: If it takes less than 2 minutes, do it now.",
    "Batch similar tasks together to reduce context switching.",
    "Keep your workspace clean to reduce mental clutter.",
    "Plan your day the night before.",
    "Turn off notifications when doing deep work.",
    "Take regular breaks to maintain focus.",
    "Learn to say no to non-essential tasks.",
    "Use keyboard shortcuts to save time."
];

const IDEAS = [
    "Build a personal finance tracker.",
    "Create a recipe manager app.",
    "Start a blog about your learning journey.",
    "Build a browser extension for productivity.",
    "Create a portfolio website.",
    "Build a weather dashboard.",
    "Create a habit tracker.",
    "Build a markdown editor.",
    "Create a flashcard app for learning.",
    "Build a task management CLI tool."
];

export const TipsWidget: React.FC = () => {
    const [content, setContent] = useState('');
    const [type, setType] = useState<'tip' | 'idea'>('tip');

    const getRandomContent = (contentType: 'tip' | 'idea') => {
        const source = contentType === 'tip' ? TIPS : IDEAS;
        const randomIndex = Math.floor(Math.random() * source.length);
        return source[randomIndex];
    };

    useEffect(() => {
        setContent(getRandomContent(type));
    }, [type]);

    const handleRefresh = () => {
        setContent(getRandomContent(type));
    };

    return (
        <div className={styles.container}>
            <div className={styles.tabs}>
                <button
                    className={`${styles.tab} ${type === 'tip' ? styles.active : ''}`}
                    onClick={() => setType('tip')}
                >
                    <Lightbulb size={16} />
                    Tips
                </button>
                <button
                    className={`${styles.tab} ${type === 'idea' ? styles.active : ''}`}
                    onClick={() => setType('idea')}
                >
                    <Sparkles size={16} />
                    Ideas
                </button>
            </div>

            <div className={styles.content}>
                <p className={styles.text}>"{content}"</p>
            </div>

            <button className={styles.refreshBtn} onClick={handleRefresh}>
                <RefreshCw size={16} />
                New {type === 'tip' ? 'Tip' : 'Idea'}
            </button>
        </div>
    );
};
