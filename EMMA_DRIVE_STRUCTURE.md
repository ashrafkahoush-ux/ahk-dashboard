# Emma Google Drive Folder Structure

## Configuration
- **Profile**: ashraf.kahoush@gmail.com
- **Root Path**: /GoogleDrive/MyDrive/AHK Profile/Emma/
- **Last Updated**: 2025-11-05T11:10:40.994Z

## Folder Hierarchy

```
/GoogleDrive/MyDrive/AHK Profile/
└── Emma/
    ├── KnowledgeBase/     (Core knowledge, reference materials)
    ├── Logs/              (Activity logs, interaction history)
    ├── Dictionaries/      (Terminology, acronyms, language data)
    ├── Archives/          (Historical data, deprecated materials)
    └── Outputs/           ⭐ PRIMARY OUTPUT FOLDER
        └── (Generated reports, analysis results, Emma's work products)
```

## Folder Details

### 📚 KnowledgeBase
- **Purpose**: Core knowledge, facts, reference materials
- **Sync**: Daily
- **Permissions**: Read + Write
- **Content**: Research documents, SOPs, client data

### 📝 Logs
- **Purpose**: Activity tracking and history
- **Sync**: Hourly
- **Permissions**: Read + Write
- **Content**: Emma interaction logs, analysis history, session data

### 📖 Dictionaries
- **Purpose**: Language and terminology resources
- **Sync**: Realtime
- **Permissions**: Read + Write
- **Content**: Intent mappings, synonyms, multilingual dictionaries

### 📦 Archives
- **Purpose**: Historical data storage
- **Sync**: Weekly
- **Permissions**: Read + Write
- **Content**: Deprecated materials, old versions, backups

### ⭐ Outputs (PRIMARY)
- **Purpose**: **Main folder for Emma's generated content**
- **Sync**: Realtime
- **Permissions**: Read + Write
- **Content**: 
  - Analysis reports
  - Strategic recommendations
  - Generated summaries
  - Export files
  - All Emma work products

## Permissions
All folders have **READ + WRITE** permissions for automated sync and updates.

## Authentication
- OAuth2 via Google Cloud Console
- Refresh token stored in .env.local
- Scopes: drive, drive.file, drive.metadata.readonly

## Next Steps
1. Verify folder structure exists in Google Drive
2. Test upload to Outputs/ folder
3. Verify sync functionality
4. Monitor logs for errors
