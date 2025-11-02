/**
 * Google Drive Linker for Emma Ecosystem
 * Links both personal and business Google Drives to Emma's knowledge system
 */

import { google } from 'googleapis';
import { GOOGLE_CREDENTIALS, OAUTH_CONFIG, getGoogleEnv } from '../config/googleDriveConfig.js';

/**
 * Initialize Google Drive API client
 */
function createDriveClient(accountType = 'personal') {
  const env = getGoogleEnv();
  
  // For Node.js environment (server-side)
  if (typeof window === 'undefined') {
    const auth = new google.auth.OAuth2(
      env.clientId,
      env.clientSecret,
      OAUTH_CONFIG.redirect_uri
    );
    
    // Set refresh token based on account type
    const refreshToken = accountType === 'personal' 
      ? env.personalRefreshToken 
      : env.workRefreshToken;
    
    auth.setCredentials({
      refresh_token: refreshToken
    });
    
    return google.drive({ version: 'v3', auth });
  }
  
  // For browser environment (client-side)
  console.warn('Google Drive API requires server-side execution');
  return null;
}

/**
 * Link both personal and business drives
 */
export async function linkDrives() {
  console.log('🔗 Starting Google Drive linking process...');
  
  const drives = [
    { label: 'Personal', config: GOOGLE_CREDENTIALS.personal, type: 'personal' },
    { label: 'Work', config: GOOGLE_CREDENTIALS.work, type: 'work' }
  ];
  
  const results = [];
  
  for (const { label, config, type } of drives) {
    try {
      console.log(`🔗 Linking ${label} Drive (${config.client_email})...`);
      
      const drive = createDriveClient(type);
      
      if (!drive) {
        console.warn(`⚠️ Skipping ${label} - requires server environment`);
        continue;
      }
      
      // Test connection by listing root files
      const response = await drive.files.list({
        pageSize: 1,
        fields: 'files(id, name)',
        q: "name='Emma' and mimeType='application/vnd.google-apps.folder'"
      });
      
      const result = {
        label,
        email: config.client_email,
        connected: true,
        emmaFolderExists: response.data.files && response.data.files.length > 0,
        emmaFolderId: response.data.files?.[0]?.id || null
      };
      
      results.push(result);
      console.log(`✅ ${label} Drive linked successfully`);
      
    } catch (error) {
      console.error(`❌ Failed to link ${label} Drive:`, error.message);
      results.push({
        label,
        email: config.client_email,
        connected: false,
        error: error.message
      });
    }
  }
  
  console.log('✅ Drive linking process completed');
  return results;
}

/**
 * Grant permissions to Emma folder
 */
export async function grantEmmaAccess(folderId, accountType = 'personal') {
  const drive = createDriveClient(accountType);
  const config = GOOGLE_CREDENTIALS[accountType];
  
  try {
    await drive.permissions.create({
      fileId: folderId,
      requestBody: {
        role: config.permission,
        type: 'user',
        emailAddress: config.client_email
      }
    });
    
    console.log(`✅ Granted ${config.permission} access to ${config.client_email}`);
    return true;
  } catch (error) {
    console.error('❌ Failed to grant access:', error.message);
    return false;
  }
}

/**
 * Search for Emma folder across drives
 */
export async function findEmmaFolder(accountType = 'personal') {
  const drive = createDriveClient(accountType);
  
  try {
    const response = await drive.files.list({
      q: "name='Emma' and mimeType='application/vnd.google-apps.folder' and trashed=false",
      fields: 'files(id, name, parents, createdTime, modifiedTime)',
      pageSize: 10
    });
    
    return response.data.files || [];
  } catch (error) {
    console.error('❌ Failed to search for Emma folder:', error.message);
    return [];
  }
}

/**
 * List files in Emma folder
 */
export async function listEmmaFiles(folderId, accountType = 'personal') {
  const drive = createDriveClient(accountType);
  
  try {
    const response = await drive.files.list({
      q: `'${folderId}' in parents and trashed=false`,
      fields: 'files(id, name, mimeType, size, modifiedTime, webViewLink)',
      orderBy: 'modifiedTime desc',
      pageSize: 100
    });
    
    return response.data.files || [];
  } catch (error) {
    console.error('❌ Failed to list Emma files:', error.message);
    return [];
  }
}

/**
 * Download file content from Drive
 */
export async function downloadFile(fileId, accountType = 'personal') {
  const drive = createDriveClient(accountType);
  
  try {
    const response = await drive.files.get({
      fileId,
      alt: 'media'
    });
    
    return response.data;
  } catch (error) {
    console.error('❌ Failed to download file:', error.message);
    return null;
  }
}

/**
 * Upload file to Emma folder
 */
export async function uploadToEmma(fileName, content, folderId, accountType = 'personal') {
  const drive = createDriveClient(accountType);
  
  try {
    const response = await drive.files.create({
      requestBody: {
        name: fileName,
        parents: [folderId]
      },
      media: {
        mimeType: 'text/plain',
        body: content
      },
      fields: 'id, name, webViewLink'
    });
    
    console.log(`✅ Uploaded ${fileName} to Emma folder`);
    return response.data;
  } catch (error) {
    console.error('❌ Failed to upload file:', error.message);
    return null;
  }
}

/**
 * Sync Emma's knowledge base from Drive
 */
export async function syncEmmaKnowledge() {
  console.log('🔄 Starting Emma knowledge sync...');
  
  const syncResults = {
    personal: { files: 0, folders: 0, errors: [] },
    work: { files: 0, folders: 0, errors: [] }
  };
  
  for (const accountType of ['personal', 'work']) {
    try {
      const emmaFolders = await findEmmaFolder(accountType);
      
      if (emmaFolders.length === 0) {
        console.warn(`⚠️ No Emma folder found in ${accountType} account`);
        continue;
      }
      
      const emmaFolder = emmaFolders[0];
      const files = await listEmmaFiles(emmaFolder.id, accountType);
      
      syncResults[accountType].files = files.length;
      syncResults[accountType].folders = emmaFolders.length;
      
      console.log(`📂 Found ${files.length} files in ${accountType} Emma folder`);
      
    } catch (error) {
      console.error(`❌ Sync error for ${accountType}:`, error.message);
      syncResults[accountType].errors.push(error.message);
    }
  }
  
  console.log('✅ Emma knowledge sync completed');
  return syncResults;
}

/**
 * Get drive connection status
 */
export async function getDriveStatus() {
  const status = {
    personal: { connected: false, emmaFolder: null },
    work: { connected: false, emmaFolder: null }
  };
  
  for (const accountType of ['personal', 'work']) {
    try {
      const folders = await findEmmaFolder(accountType);
      status[accountType].connected = true;
      status[accountType].emmaFolder = folders.length > 0 ? folders[0] : null;
    } catch (error) {
      status[accountType].error = error.message;
    }
  }
  
  return status;
}
