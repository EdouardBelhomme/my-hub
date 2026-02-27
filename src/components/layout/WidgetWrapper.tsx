import React from 'react';
import { X, GripHorizontal } from 'lucide-react';
import { useLayout } from './LayoutContext';
import styles from './WidgetWrapper.module.css';

interface WidgetWrapperProps {
    id: string;
    title: string;
    children: React.ReactNode;
    className?: string;
    style?: React.CSSProperties;
    onMouseDown?: React.MouseEventHandler;
    onMouseUp?: React.MouseEventHandler;
    onTouchEnd?: React.TouchEventHandler;
}

export const WidgetWrapper = React.forwardRef<HTMLDivElement, WidgetWrapperProps>(
    ({ id, title, children, style, className, onMouseDown, onMouseUp, onTouchEnd, ...props }, ref) => {
        const { isEditMode, removeWidget } = useLayout();

        return (
            <div
                ref={ref}
                style={style}
                className={`${styles.wrapper} ${className || ''}`}
                onMouseDown={onMouseDown}
                onMouseUp={onMouseUp}
                onTouchEnd={onTouchEnd}
                {...props}
            >
                <div className={styles.header}>
                    <div className={styles.title}>{title}</div>
                    {isEditMode && (
                        <div className={styles.controls}>
                            <div className={`grid-drag-handle ${styles.handle}`}>
                                <GripHorizontal size={16} />
                            </div>
                            <button
                                className={styles.removeBtn}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    removeWidget(id);
                                }}
                            >
                                <X size={16} />
                            </button>
                        </div>
                    )}
                </div>
                <div className={styles.content}>
                    {children}
                </div>
            </div>
        );
    }
);
