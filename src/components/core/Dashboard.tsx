import React, { useState } from 'react';
import { Plus, Settings, Check, LayoutTemplate, Palette } from 'lucide-react';
import { useLayout } from '../layout/LayoutContext';
import { GridContainer } from '../layout/GridContainer';
import { ThemePanel } from './ThemePanel';
import type { WidgetType } from '../../types';
import styles from './Dashboard.module.css';

export const Dashboard: React.FC = () => {
    const { isEditMode, toggleEditMode, addWidget } = useLayout();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isThemePanelOpen, setIsThemePanelOpen] = useState(false);

    const handleAddWidget = (type: WidgetType) => {
        addWidget(type);
        setIsMenuOpen(false);
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div className={styles.logo}>
                    <LayoutTemplate className={styles.logoIcon} />
                    <h1>My Hub</h1>
                </div>

                <div className={styles.actions}>
                    {isEditMode ? (
                        <>
                            <button
                                className={styles.editBtn}
                                onClick={() => setIsThemePanelOpen(true)}
                            >
                                <Palette size={18} /> Theme
                            </button>

                            <div className={styles.addWidgetDropdown}>
                                <button
                                    className={styles.primaryBtn}
                                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                                >
                                    <Plus size={18} /> Add Widget
                                </button>

                                {isMenuOpen && (
                                    <div className={styles.dropdownMenu}>
                                        <button onClick={() => handleAddWidget('TODO')}>To-Do List</button>
                                        <button onClick={() => handleAddWidget('NOTES')}>Notes</button>
                                        <button onClick={() => handleAddWidget('WEATHER')}>Weather</button>
                                        <button onClick={() => handleAddWidget('CALENDAR')}>Calendar</button>
                                        <button onClick={() => handleAddWidget('EMAIL')}>Email</button>
                                        <button onClick={() => handleAddWidget('DRIVE')}>Drive</button>
                                        <button onClick={() => handleAddWidget('TIPS')}>Tips</button>
                                    </div>
                                )}
                            </div>

                            <button
                                className={styles.doneBtn}
                                onClick={toggleEditMode}
                            >
                                <Check size={18} /> Done
                            </button>
                        </>
                    ) : (
                        <button
                            className={styles.editBtn}
                            onClick={toggleEditMode}
                        >
                            <Settings size={18} /> Customize
                        </button>
                    )}
                </div>
            </header>

            <main className={styles.main}>
                <GridContainer />
            </main>

            {isThemePanelOpen && (
                <ThemePanel onClose={() => setIsThemePanelOpen(false)} />
            )}
        </div>
    );
};
