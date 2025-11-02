/**
 * Google OAuth2 Token Generator
 * Helps obtain refresh tokens for Google Drive API access
 */

import { google } from 'googleapis';
import http from 'http';
import { URL } from 'url';
import open from 'open';

const SCOPES = [
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.metadata.readonly'
];

const REDIRECT_URI = 'http://localhost:3000/oauth2callback';

async function getTokens() {
  console.log('🔐 Google Drive OAuth2 Token Generator\n');
  
  // Read client credentials from environment or prompt
  const clientId = process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || process.env.VITE_GOOGLE_CLIENT_SECRET;
  
  if (!clientId || !clientSecret) {
    console.error('❌ Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET');
    console.log('\n📝 To get these credentials:');
    console.log('1. Go to: https://console.cloud.google.com/apis/credentials');
    console.log('2. Create OAuth 2.0 Client ID (Desktop app or Web app)');
    console.log('3. Add redirect URI: http://localhost:3000/oauth2callback');
    console.log('4. Set environment variables or add to .env.local');
    process.exit(1);
  }
  
  const oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    REDIRECT_URI
  );
  
  // Generate auth URL
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent' // Force to get refresh token
  });
  
  console.log('🌐 Opening browser for authentication...\n');
  console.log('📋 If browser doesn\'t open, visit this URL:\n');
  console.log(authUrl + '\n');
  
  // Start local server to receive callback
  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url, REDIRECT_URI);
      
      if (url.pathname === '/oauth2callback') {
        const code = url.searchParams.get('code');
        
        if (code) {
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(`
            <html>
              <body style="font-family: Arial; padding: 40px; text-align: center;">
                <h1>✅ Authentication Successful!</h1>
                <p>You can close this window and return to the terminal.</p>
              </body>
            </html>
          `);
          
          // Exchange code for tokens
          const { tokens } = await oauth2Client.getToken(code);
          
          console.log('\n✅ Tokens obtained successfully!\n');
          console.log('📋 Add these to your .env.local file:\n');
          console.log('VITE_GOOGLE_PERSONAL_REFRESH_TOKEN=' + tokens.refresh_token);
          console.log('# OR for work account:');
          console.log('VITE_GOOGLE_WORK_REFRESH_TOKEN=' + tokens.refresh_token);
          console.log('\n');
          
          server.close();
          process.exit(0);
        } else {
          res.writeHead(400, { 'Content-Type': 'text/plain' });
          res.end('Error: No authorization code received');
          server.close();
          process.exit(1);
        }
      }
    } catch (error) {
      console.error('❌ Error:', error.message);
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Internal Server Error');
      server.close();
      process.exit(1);
    }
  });
  
  server.listen(3000, () => {
    console.log('🔄 Waiting for OAuth callback on http://localhost:3000/oauth2callback\n');
    open(authUrl).catch(() => {
      console.log('⚠️ Could not open browser automatically');
    });
  });
}

// Run the token generator
getTokens().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
