import React from 'react';
import { Responsive, WidthProvider } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { useLayout } from './LayoutContext';
import { WidgetWrapper } from './WidgetWrapper';
import type { WidgetItem } from '../../types';

import { TodoWidget } from '../widgets/TodoWidget';
import { NotesWidget } from '../widgets/NotesWidget';
import { WeatherWidget } from '../widgets/WeatherWidget';
import { CalendarWidget } from '../widgets/CalendarWidget';
import { EmailWidget } from '../widgets/EmailWidget';
import { DriveWidget } from '../widgets/DriveWidget';
import { TipsWidget } from '../widgets/TipsWidget';

const ResponsiveGridLayout = WidthProvider(Responsive);

export const GridContainer: React.FC = () => {
    const { widgets, isEditMode, updateLayout } = useLayout();

    const renderWidgetContent = (widget: WidgetItem) => {
        switch (widget.type) {
            case 'TODO': return <TodoWidget id={widget.id} data={widget.data} />;
            case 'NOTES': return <NotesWidget id={widget.id} data={widget.data} />;
            case 'WEATHER': return <WeatherWidget />;
            case 'CALENDAR': return <CalendarWidget id={widget.id} data={widget.data} />;
            case 'EMAIL': return <EmailWidget />;
            case 'DRIVE': return <DriveWidget />;
            case 'TIPS': return <TipsWidget />;
            default: return <div>Unknown Widget</div>;
        }
    };

    const getWidgetTitle = (type: WidgetItem['type']) => {
        switch (type) {
            case 'TODO': return 'My Tasks';
            case 'NOTES': return 'Quick Notes';
            case 'WEATHER': return 'Weather';
            case 'CALENDAR': return 'Calendar';
            case 'EMAIL': return 'Inbox';
            case 'DRIVE': return 'My Files';
            case 'TIPS': return 'Daily Tip';
            default: return 'Widget';
        }
    };

    const onLayoutChange = (layout: any[]) => {
        const newWidgets = widgets.map(w => {
            const layoutItem = layout.find(l => l.i === w.id);
            if (layoutItem) {
                return { ...w, x: layoutItem.x, y: layoutItem.y, w: layoutItem.w, h: layoutItem.h };
            }
            return w;
        });

        if (JSON.stringify(newWidgets) !== JSON.stringify(widgets)) {
            updateLayout(newWidgets);
        }
    };

    const layoutItems = widgets.map(w => ({ ...w, i: w.id }));

    return (
        <ResponsiveGridLayout
            className="layout"
            layouts={{ lg: layoutItems }}
            breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
            cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
            rowHeight={60}
            isDraggable={isEditMode}
            isResizable={isEditMode}
            draggableHandle=".grid-drag-handle"
            onLayoutChange={onLayoutChange}
            margin={[16, 16]}
        >
            {widgets.map(widget => (
                <div key={widget.id}>
                    <WidgetWrapper
                        id={widget.id}
                        title={getWidgetTitle(widget.type)}
                    >
                        {renderWidgetContent(widget)}
                    </WidgetWrapper>
                </div>
            ))}
        </ResponsiveGridLayout>
    );
};
