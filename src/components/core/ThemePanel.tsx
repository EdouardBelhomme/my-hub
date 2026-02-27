import React from 'react';
import { X, Moon, Type, Palette, Layout } from 'lucide-react';
import { useLayout } from '../layout/LayoutContext';
import styles from './ThemePanel.module.css';

interface ThemePanelProps {
    onClose: () => void;
}

const COLORS = [
    '#6366f1',
    '#3b82f6',
    '#0ea5e9',
    '#10b981',
    '#f59e0b',
    '#ef4444',
    '#ec4899',
    '#8b5cf6',
];

const FONTS = [
    { name: 'Inter', value: 'Inter' },
    { name: 'Roboto', value: 'Roboto' },
    { name: 'System', value: 'system-ui' },
    { name: 'Serif', value: 'Georgia' },
    { name: 'Mono', value: 'monospace' },
];

export const ThemePanel: React.FC<ThemePanelProps> = ({ onClose }) => {
    const { theme, updateTheme } = useLayout();

    return (
        <div className={styles.overlay}>
            <div className={styles.panel}>
                <div className={styles.header}>
                    <h3>Customize Hub</h3>
                    <button onClick={onClose} className={styles.closeBtn}>
                        <X size={20} />
                    </button>
                </div>

                <div className={styles.content}>
                    <div className={styles.section}>
                        <div className={styles.sectionHeader}>
                            <Palette size={16} />
                            <span>Primary Color</span>
                        </div>
                        <div className={styles.colorGrid}>
                            {COLORS.map(color => (
                                <button
                                    key={color}
                                    className={`${styles.colorBtn} ${theme.primaryColor === color ? styles.activeColor : ''}`}
                                    style={{ backgroundColor: color }}
                                    onClick={() => updateTheme({ primaryColor: color })}
                                />
                            ))}
                        </div>
                    </div>

                    <div className={styles.section}>
                        <div className={styles.sectionHeader}>
                            <Moon size={16} />
                            <span>Appearance</span>
                        </div>
                        <div className={styles.toggleRow}>
                            <span>Dark Mode</span>
                            <button
                                className={`${styles.toggle} ${theme.isDarkMode ? styles.toggleActive : ''}`}
                                onClick={() => updateTheme({ isDarkMode: !theme.isDarkMode })}
                            >
                                <div className={styles.toggleHandle} />
                            </button>
                        </div>
                    </div>

                    <div className={styles.section}>
                        <div className={styles.sectionHeader}>
                            <Type size={16} />
                            <span>Typography</span>
                        </div>
                        <div className={styles.fontList}>
                            {FONTS.map(font => (
                                <button
                                    key={font.value}
                                    className={`${styles.fontBtn} ${theme.fontFamily === font.value ? styles.activeFont : ''}`}
                                    style={{ fontFamily: font.value }}
                                    onClick={() => updateTheme({ fontFamily: font.value })}
                                >
                                    {font.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className={styles.section}>
                        <div className={styles.sectionHeader}>
                            <Layout size={16} />
                            <span>Corner Radius</span>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="24"
                            value={theme.cornerRadius}
                            onChange={(e) => updateTheme({ cornerRadius: Number(e.target.value) })}
                            className={styles.slider}
                        />
                        <div className={styles.valueDisplay}>{theme.cornerRadius}px</div>
                    </div>
                </div>
            </div>
        </div>
    );
};
