# How to Connect Your Accounts

To connect Gmail, Google Drive, Outlook, and OneDrive, you need to "register" this application with Google and Microsoft. This gives you a **Client ID** that tells them "My Hub" is allowed to ask for permission.

## 1. Google Integration (Gmail & Drive)

1.  Go to the [Google Cloud Console](https://console.cloud.google.com/).
2.  Create a **New Project** (name it "My Hub").
3.  **Enable APIs**:
    - Go to "APIs & Services" > "Library".
    - Search for and enable **Gmail API**.
    - Search for and enable **Google Drive API**.
4.  **Configure OAuth Consent Screen**:
    - Go to "APIs & Services" > "OAuth consent screen".
    - Choose **External**.
    - Fill in the App Name ("My Hub") and User Support Email.
    - Add your email to **Test Users**.
5.  **Create Credentials**:
    - Go to "APIs & Services" > "Credentials".
    - Click "Create Credentials" > **OAuth client ID**.
    - Application type: **Web application**.
    - Name: "My Hub Web".
    - **Authorized JavaScript origins**: `http://localhost:5173`
    - **Authorized redirect URIs**: `http://localhost:5173`
    - Click **Create**.
6.  **Copy the Client ID** (it looks like `123...apps.googleusercontent.com`).
7.  **Get API Key**:
    - Click "Create Credentials" > **API Key**.
    - **Note**: If you see a configuration screen with "Application restrictions", you can leave it as **None** for now.
    - Click the blue **Create** button.
    - Copy the API Key that appears.

## 2. Microsoft Integration (Outlook & OneDrive)

1.  Go to the [Azure Portal](https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationsListBlade).
2.  Click **New registration**.
3.  Name: "My Hub".
4.  Supported account types: **Accounts in any organizational directory (Any Microsoft Entra ID tenant - Multitenant) and personal Microsoft accounts (e.g. Skype, Xbox)**.
5.  Redirect URI: Select **Single-page application (SPA)** and enter `http://localhost:5173`.
6.  Click **Register**.
7.  **Copy the Application (client) ID** from the Overview page.

## 3. Configure Your App

1.  Open the `.env` file in your project folder.
2.  Paste your keys like this:

```env
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
VITE_GOOGLE_API_KEY=your_google_api_key_here
VITE_MICROSOFT_CLIENT_ID=your_microsoft_client_id_here
```

3.  **Restart your app**: Stop the terminal (Ctrl+C) and run `npm run dev` again.

## Troubleshooting

### Google: "Access blocked: My Hub has not completed the Google verification process"

This happens because your app is in "Testing" mode (which is normal for development). You need to explicitly allow your email address.

1.  Go to [Google Cloud Console](https://console.cloud.google.com/).
2.  Go to **APIs & Services** > **OAuth consent screen**.
3.  Scroll down to the **Test users** section.
4.  Click **+ ADD USERS**.
5.  Enter your email address (`your_email@example.com`) and click **Save**.
6.  Try logging in again.

### Microsoft: "Approval required" / "Need admin approval"

This happens because you are using a school/work account (`@epitech.eu`) and your organization restricts third-party apps.

- **Option 1 (Recommended)**: Use a **personal** Microsoft account (like `@outlook.com` or `@hotmail.com`). These accounts don't require admin approval.
- **Option 2**: Click the **Request approval** button in the dialog. Your school administrators will receive a request to allow "My Hub". You will have to wait for them to approve it.
