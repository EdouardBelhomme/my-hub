# My Hub - Personal Dashboard

My Hub is a highly customizable, modern, and secure personal dashboard built with React, TypeScript, and Vite. It serves as a centralized hub to aggregate your most important daily information: Emails, Calendar Events, Google Drive files, Notes, Weather, and Todos.

## Overview

The application is designed to be fully client-side, communicating directly with third-party APIs (Google, Microsoft, Open-Meteo) without any middleman backend. This ensures maximum privacy and security, as your tokens and data never leave your browser.

### Key Capabilities

- **OAuth Integration**: Securely connect to your Google and Microsoft accounts.
- **Widget Ecosystem**:
  - **Weather**: Real-time geolocation-based weather forecasts.
  - **Todos**: Local-first task management.
  - **Notes**: Syncs text notes directly to a dedicated folder in your Google Drive.
  - **Drive**: Browse your Google Drive files.
  - **Email**: Combined view of Gmail and Outlook inboxes with quick actions (read, delete).
  - **Calendar**: View upcoming events from Google Calendar.
- **Interactive Grid Layout**: Drag, drop, and resize widgets to build your perfect layout. (Powered by `react-grid-layout`).
- **Dynamic Theming**: On-the-fly customization of primary colors, typography, border radius, and dark/light mode using CSS Variables.

## Documentation

For a deep dive into the project, please consult the following documentation:

1.  **[Setup Guide](setup_guide.md)**: Instructions on how to configure your Google and Microsoft OAuth credentials.
2.  **[Architecture & Technical Choices](docs/architecture.md)**: Diagrams and explanations of how the application is built and why certain technologies were chosen.
3.  **[Features & User Guide](docs/features.md)**: A complete user manual detailing all widget functionalities and customization options.

## Getting Started

1.  Clone the repository.
2.  Run `npm install` to install dependencies.
3.  Follow the [Setup Guide](setup_guide.md) to set up your `.env` file with your Client IDs.
4.  Run `npm run dev` to start the development server.
5.  Build for production using `npm run build`.

## Tech Stack

- **Framework**: React 19 + TypeScript
- **Build Tool**: Vite
- **Styling**: CSS Modules + Native CSS Variables (No utility-first framework like Tailwind, by design)
- **Icons**: Lucide React
- **APIs**: Google API (GAPI/GIS), Microsoft Graph API (MSAL), Open-Meteo
