# Lighthouse Platform - Google OAuth Setup

## Google OAuth Configuration

To enable Google authentication, you need to set up OAuth credentials in Google Cloud Console:

### 1. Create a Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one

### 2. Enable Google+ API
1. Go to "APIs & Services" > "Library"
2. Search for "Google+ API" and enable it

### 3. Create OAuth 2.0 Credentials
1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client IDs"
3. Configure OAuth consent screen if prompted
4. Select "Web application" as application type
5. Add authorized redirect URIs:
   - `http://localhost:18000/auth/callback` (for development)
   - Add your production domain when deploying
6. Save and copy the Client ID and Client Secret

### 4. Update Environment Variables
Update your `.env` file in the backend directory:

```env
google_oidc_client_id=your-actual-google-client-id
google_oidc_client_secret=your-actual-google-client-secret
google_oidc_redirect_uri=http://localhost:18000/auth/callback
```

### 5. Platform Owner Setup
The platform owner is automatically configured for `mohammed.zuber@gmail.com`. When this email logs in via Google OAuth, they will be granted PLATFORM_OWNER role.

## Testing Google OAuth

1. Start the backend server: `cd backend && python3 -m uvicorn app.main:app --host 0.0.0.0 --port 18000`
2. Start the frontend: `cd frontend && npm run dev`
3. Visit `http://localhost:3003/auth/login`
4. Click the Google login button
5. Complete the OAuth flow

## API Endpoints

- `GET /auth/google` - Initiate Google OAuth login
- `GET /auth/google/callback` - Handle OAuth callback
- `POST /auth/login` - Traditional email/password login

## Security Notes

- Never commit OAuth credentials to version control
- Use environment variables for all sensitive configuration
- In production, use HTTPS for all OAuth redirects
- Regularly rotate OAuth client secrets