import React, { createContext, useContext, useState, useEffect } from 'react';
import type { WidgetItem, ThemeSettings } from '../../types';
import { v4 as uuidv4 } from 'uuid';

interface LayoutContextType {
    widgets: WidgetItem[];
    isEditMode: boolean;
    theme: ThemeSettings;
    toggleEditMode: () => void;
    addWidget: (type: WidgetItem['type']) => void;
    removeWidget: (id: string) => void;
    updateLayout: (newLayout: WidgetItem[]) => void;
    updateWidgetData: (id: string, data: any) => void;
    updateTheme: (newTheme: Partial<ThemeSettings>) => void;
}

const defaultTheme: ThemeSettings = {
    primaryColor: '#6366f1',
    backgroundColor: '#f8fafc',
    fontFamily: 'Inter',
    cornerRadius: 8,
    isDarkMode: false,
};

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export const LayoutProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [widgets, setWidgets] = useState<WidgetItem[]>(() => {
        const saved = localStorage.getItem('myhub-widgets');
        return saved ? JSON.parse(saved) : [];
    });

    const [theme, setTheme] = useState<ThemeSettings>(() => {
        const saved = localStorage.getItem('myhub-theme');
        return saved ? JSON.parse(saved) : defaultTheme;
    });

    const [isEditMode, setIsEditMode] = useState(false);

    useEffect(() => {
        localStorage.setItem('myhub-widgets', JSON.stringify(widgets));
    }, [widgets]);

    useEffect(() => {
        localStorage.setItem('myhub-theme', JSON.stringify(theme));
        const root = document.documentElement;
        root.style.setProperty('--color-primary', theme.primaryColor);
        root.style.setProperty('--radius-md', `${theme.cornerRadius}px`);
        if (theme.isDarkMode) {
            root.setAttribute('data-theme', 'dark');
        } else {
            root.removeAttribute('data-theme');
        }
    }, [theme]);

    const toggleEditMode = () => setIsEditMode(prev => !prev);

    const addWidget = (type: WidgetItem['type']) => {
        const newWidget: WidgetItem = {
            id: uuidv4(),
            type,
            x: 0,
            y: Infinity,
            w: 4,
            h: 4,
        };
        setWidgets(prev => [...prev, newWidget]);
    };

    const removeWidget = (id: string) => {
        setWidgets(prev => prev.filter(w => w.id !== id));
    };

    const updateLayout = (newLayout: WidgetItem[]) => {
        setWidgets(newLayout);
    };

    const updateWidgetData = (id: string, data: any) => {
        setWidgets(prev => prev.map(w => {
            if (w.id === id) {
                return { ...w, data };
            }
            return w;
        }));
    };

    const updateTheme = (newTheme: Partial<ThemeSettings>) => {
        setTheme(prev => ({ ...prev, ...newTheme }));
    };

    return (
        <LayoutContext.Provider value={{
            widgets,
            isEditMode,
            theme,
            toggleEditMode,
            addWidget,
            removeWidget,
            updateLayout,
            updateWidgetData,
            updateTheme
        }}>
            {children}
        </LayoutContext.Provider>
    );
};

export const useLayout = () => {
    const context = useContext(LayoutContext);
    if (!context) throw new Error('useLayout must be used within a LayoutProvider');
    return context;
};
