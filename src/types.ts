export type WidgetType =
    | 'TODO'
    | 'NOTES'
    | 'WEATHER'
    | 'CALENDAR'
    | 'EMAIL'
    | 'DRIVE'
    | 'TIPS';

export interface WidgetItem {
    id: string;
    type: WidgetType;
    x: number;
    y: number;
    w: number;
    h: number;
    data?: any;
}

export interface ThemeSettings {
    primaryColor: string;
    backgroundColor: string;
    backgroundImage?: string;
    fontFamily: string;
    cornerRadius: number;
    isDarkMode: boolean;
}
