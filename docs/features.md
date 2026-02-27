# My Hub - Features & User Guide

Welcome to **My Hub**, a single-pane-of-glass dashboard for all your personal, professional, and digital activities. This document outlines everything you can do as a user.

## Core Concepts

### 1. Drag & Drop Dashboard

Your dashboard is fully yours. Every component (called a **Widget**) lives on a Grid.

- **Move**: Click and hold the header of any widget, then drag it across the screen. Other widgets will automatically flow and make space for it.
- **Resize**: Click the bottom-right corner of a widget and drag it to scale its footprint on the screen. The layout dynamically calculates the grid spacing.

### 2. Live Dynamic Theme

Click the Settings (Gear) icon in your header. The **Theme Panel** gives you ultimate control over the user interface, updated instantly across the entire app without a reload.

- **Primary Colors**: Pick from predefined tailored colors (Indigo, Blue, Sky, Emerald, Amber, Red, Pink, Violet).
- **Dark Mode**: A one-click toggle to switch the entire application's palette for eye comfort.
- **Typography**: Instantly change the font to `Inter`, `Roboto`, `System`, `Serif` or `Monospace`.
- **Corner Radius Layout**: Drag the slider from 0px to 24px and watch the widget corners physically round out or become completely squared instantly.

## The Widgets Ecosystem

### Accounts & Auth

The "Accounts" widget is the technical heart of the integration. From here, you click "Connect Microsoft" or "Connect Google".

- Once authorized, the rest of the widgets magically awaken and populate themselves.
- The tokens are stored in the browser. You don't need a database account.
- You can disconnect at any time. Your session will vanish instantly.

### Note-Taking Widget

- **Create**: Type a title and write into a multiline markdown-capable textarea.
- **Save**: Click the "Save" (Disk) icon. It creates a `.txt` file securely backed up in your connected Google Drive inside a dedicated folder called `MY HUB NOTES`.
- **Review**: A sidebar list allows you to seamlessly read and switch between your notes seamlessly within seconds without ever opening `drive.google.com`.
- **Delete**: Quickly trash obsolete notes.

### Todo Widget

- **Local Storage**: Ideal for lightning-fast to-do tracking. Write "Buy Milk", hit enter.
- **Persistent**: If you close the tab, the list will wait exactly where you left it.
- **Check-off**: Check off completed items directly inside the scrollable view.

### Weather Widget

- **Auto-location**: Prompts your browser for your latitude and longitude automatically.
- **Real-time forecast**: Contacts the open-source Open-Meteo API.
- **Visual cues**: High-definition Lucide React icons morph depending on real-time data (`CloudRain`, `Sun`, `CloudLightning`) alongside the temperature.

### Email Widget

You can aggregate dual-inboxes (e.g. your personal Gmail and your work Outlook simultaneously).

- **Preview**: Shows a fast-loading overview of subject, sender, and snippet of the emails.
- **Quick Actions**:
  1.  Mark as Read.
  2.  Trash (Send directly to your email bin).

### Calendar Widget

- **Next 30 Days**: Synchronizes the upcoming month directly from Google Calendar API.
- **Time formatting**: Uses robust `date-fns` for clean visual parsing of upcoming schedules.

### Drive File Explorer Widget

- **Recent Files**: See the top 20 latest files inside your Google Drive Root.
- **Quick Link**: View the raw file or the Thumbnail instantly through Google's Drive API.
- Allows a bird-eye view of active projects you are working on.
