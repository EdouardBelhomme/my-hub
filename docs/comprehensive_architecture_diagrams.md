# Comprehensive Architecture Diagrams

This document contains a deep-dive visual explanation of the entire functioning of the App, including APIs, communications, state management, and the user interface.

## 1. High-Level System Architecture

This diagram shows the complete structure of the application, representing the boundaries between the user's browser, the application's internal structure (State, Services, Components), and external APIs.

```mermaid
graph TB
  subgraph User_Environment [User Browser Environment]
    
    subgraph App_State [Global Contexts]
      AC["AccountContext<br/>(OAuth Tokens & Profiles)"]
      LC["LayoutContext<br/>(Grid Coordinates & Theme)"]
    end

    subgraph Service_Layer [Data Service Layer]
      GS["GoogleService<br/>(Drive, Gmail, Calendar calls)"]
      MS["MicrosoftService<br/>(Outlook calls)"]
      WS["WeatherService<br/>(Geolocation & Open-Meteo)"]
    end

    subgraph Presentation_Layer [React UI Components]
      Grid["React Grid Layout (Drag & Drop)"]
      Widget_Todo["Todo Widget"]
      Widget_Weather["Weather Widget"]
      Widget_Notes["Notes Widget"]
      Widget_Mail["Email Widget"]
      Widget_Drive["Drive Widget"]
      Widget_Cal["Calendar Widget"]

      Grid --> Widget_Todo & Widget_Weather & Widget_Notes & Widget_Mail & Widget_Drive & Widget_Cal
    end

    Storage[("localStorage<br/>(Persistent Theme, Layout & Todos)")]
  end

  subgraph External_APIs [Third-Party Cloud APIs]
    API_Google["Google APIs<br/>(OAuth 2.0 / REST)"]
    API_Microsoft["Microsoft Graph API<br/>(REST)"]
    API_Weather["Open-Meteo API<br/>(REST)"]
  end

  %% Data Flow Relationships
  App_State -.->|Injects state via Hooks| Presentation_Layer
  LC <-->|Saves/Loads on change| Storage
  Widget_Todo <-->|Saves/Loads task list| Storage

  Widget_Notes -->|Delegates calls| GS
  Widget_Drive -->|Delegates calls| GS
  Widget_Cal -->|Delegates calls| GS
  Widget_Mail -->|Delegates calls| GS
  Widget_Mail -->|Delegates calls| MS

  Widget_Weather -->|Delegates calls| WS

  GS <-->|Secure Fetch w/ Token| API_Google
  MS <-->|Secure Fetch w/ Token| API_Microsoft
  WS <-->|Public Fetch HTTP GET| API_Weather

```

## 2. Authentication Flow (OAuth)

The application handles authentication entirely on the client side without storing any credentials on an external database. Here is how the authentication handshake works with identity providers.

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant App as React Application
    participant Context as AccountContext
    participant IDP as Google/Microsoft Auth

    User->>App: Clicks "Connect Account" inside Accounts Widget
    App->>IDP: Opens Popup / Redirects to Identity Provider Consent Screen
    Note right of IDP: User logs in and authorizes specific scopes<br/>(e.g., mail.read, drive.file)
    IDP-->>App: Redirects back with OAuth Access Token in URL hash
    App->>Context: Extracts access token and fetches basic User Profile
    Context->>Context: Stores Token & Profile in Memory React State
    Context-->>App: Notifies all Widgets of "Authenticated" status
    App->>User: Hides login button, displays authenticated Content Widgets
```

## 3. Dynamic Theming & Layout Engine

My Hub allows users to completely modify the look, feel, and structure of the dashboard in real time. This diagram explains how the Theme Engine leverages CSS variables and handles persistence.

```mermaid
graph LR
    User([User]) -->|Drags or Resizes Widget| RGL[React-Grid-Layout]
    RGL -->|Triggers layout update| LC[LayoutContext]
    LC -->|JSON Stringify| LS[(localStorage: 'hub_layout')]

    User -->|Changes setting in Theme Panel| TP[Theme Panel Component]
    TP -->|setCSSVar('--color-primary')| DOM[document.documentElement]
    TP -->|setCSSVar('--radius')| DOM
    TP -->|Saves configuration object| LC
    LC -->|JSON Stringify| LS2[(localStorage: 'hub_theme')]

    %% initialization path
    LS -.->|Initial App Load| LC
    LS2 -.->|Initial App Load| LC
    LC -.->|Applies stored styles| DOM
```

## 4. Complex Data Fetching Lifecycle (Example: Notes Widget)

This sequence diagram takes a deeper look at the granular API communication pattern used when an authenticated user performs an action, such as saving a note to their Google Drive.

```mermaid
sequenceDiagram
    actor User
    participant UI as Notes Widget UI
    participant GS as GoogleService API Controller
    participant API as Google Drive REST API

    User->>UI: Types Note Content & clicks "Save"
    UI->>GS: saveNoteToDrive(title, content, accessToken)
    GS->>API: GET /drive/v3/files?q=name='MY HUB NOTES'
    
    alt Folder Exists in Drive
        API-->>GS: Returns existing folderId
    else Folder Doesn't Exist yet
        GS->>API: POST /drive/v3/files <br/>(mimeType: application/vnd.google-apps.folder)
        API-->>GS: Returns new folderId
    end
    
    GS->>API: POST upload/drive/v3/files <br/>(upload text/plain to specific folderId)
    API-->>GS: Returns file metadata (id, webViewLink)
    GS-->>UI: Resolves Promise with success
    UI->>User: Displays "Saved gracefully" Notification and updates list
```

## 5. Email Aggregation Flow

The email widget is a prime example of the combined capabilities of the app, fetching data simultaneously from two distinct providers and unifying them onto a single feed.

```mermaid
flowchart TD
    App((Email Widget))
    
    App -->|Requests unread emails| FetchGoogle[Call GoogleService]
    App -->|Requests unread emails| FetchMicrosoft[Call MicrosoftService]

    FetchGoogle -->|Using Google Token| G_API[Gmail API (/messages)]
    FetchMicrosoft -->|Using MSAL Token| M_API[Microsoft Graph API (/me/messages)]

    G_API -->|Returns Message List| ParserGoogle[Parse Gmail Format]
    M_API -->|Returns Message List| ParserMicrosoft[Parse Outlook Format]

    ParserGoogle --> Aggregator{Combine & Sort by Date}
    ParserMicrosoft --> Aggregator

    Aggregator --> Render[Render Unified Standardized Inbox UI]
```
