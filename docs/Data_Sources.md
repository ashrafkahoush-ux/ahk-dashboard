# 📚 Data Sources Guide - AHK Strategic Dashboard

## Overview
This document explains the source tracking system used throughout the AHK Dashboard to maintain data provenance, traceability, and update synchronization across all strategic documents.

---

## 🎯 Key Concepts

### **Source Document (`source_doc`)**
A unique identifier linking data items to their original source documents.

**Format**: `SRC-[CATEGORY]-[NAME]`

**Example**: `SRC-STRAT-ROADMAP` refers to "A_Strategic_Roadmap_v2.0.docx"

### **Source Field (`source`)**
Used in task/roadmap items to indicate which document a specific task originated from.

**Purpose**: Track where strategic actions were defined, enabling:
- Quick reference back to original context
- Impact analysis when source documents are updated
- Audit trails for investor due diligence

---

## 📁 Source Documents Index

All source documents are registered in `src/data/sources.index.json`:

```json
{
  "version": "2025-11-01",
  "documents": [
    {
      "id": "SRC-STRAT-ROADMAP",
      "title": "A_Strategic_Roadmap_v2.0.docx",
      "path": "uploads/A_Strategic_Roadmap_v2.0.docx",
      "status": "active"
    }
  ]
}
```

### **Fields Explained**:
| Field | Purpose |
|-------|---------|
| `id` | Unique identifier used throughout dashboard data files |
| `title` | Human-readable document name |
| `path` | Relative file path (for future file system integration) |
| `status` | `active` \| `archived` \| `superseded` |

---

## 🔗 How Source Tracking Works

### **1. Projects → Source Documents (Many-to-Many)**

```json
{
  "id": "PRJ-DVM",
  "name": "Dual Vector Mobility Program",
  "source_docs": ["SRC-STRAT-ROADMAP", "SRC-PROG-REPORT", "SRC-RECO"]
}
```

**Meaning**: This project's data comes from 3 source documents.

**UI Behavior**: 
- Dashboard shows a badge: "3 source documents"
- Hovering shows tooltip with document titles
- Click opens document details

### **2. Tasks → Single Source**

```json
{
  "id": "T-0001",
  "title": "Conservative Base Consolidation (DVM)",
  "source": "SRC-STRAT-ROADMAP",
  "projectId": "PRJ-DVM"
}
```

**Meaning**: This task was defined in the Strategic Roadmap document.

**UI Behavior**:
- Strategy page "By Source" filter groups tasks under document titles
- Clicking source badge navigates to Asset Vault → Document

### **3. Assets → Source Document**

```json
{
  "id": "AST-DVM-INV",
  "title": "Dual Vector Mobility – Investor Edition (HTML)",
  "source_doc": "SRC-STRAT-ROADMAP"
}
```

**Meaning**: This asset file was generated based on the Strategic Roadmap.

**UI Behavior**:
- Asset Vault displays "Source: A_Strategic_Roadmap_v2.0.docx"
- Helps track which documents produced which deliverables

---

## 🔄 Update Workflow

### **When a Source Document is Updated:**

1. **Identify Affected Items**
   ```bash
   # Find all projects using SRC-STRAT-ROADMAP
   grep -r "SRC-STRAT-ROADMAP" src/data/
   ```

2. **Review & Update Data**
   - Check if new tasks were added in the document
   - Update existing task details if changed
   - Mark completed tasks as `status: "completed"`

3. **Update Version in sources.index.json**
   ```json
   {
     "id": "SRC-STRAT-ROADMAP",
     "title": "A_Strategic_Roadmap_v2.1.docx",  // New version
     "path": "uploads/A_Strategic_Roadmap_v2.1.docx",
     "status": "active"
   }
   ```

4. **Archive Old Version**
   ```json
   {
     "id": "SRC-STRAT-ROADMAP-V2.0",
     "title": "A_Strategic_Roadmap_v2.0.docx",
     "status": "archived"
   }
   ```

---

## 📊 Source-Aware Views

### **Dashboard Page**
- Project cards show source document badges
- Tooltip displays all source document titles
- Clicking badge opens Asset Vault filtered by that source

### **Strategy Page**
Three view modes:
1. **All Tasks**: Standard list view
2. **By Project**: Tasks grouped by project (Q-VAN, WOW, DVM)
3. **By Source**: Tasks grouped by originating document

**Example "By Source" View**:
```
📄 A_Strategic_Roadmap_v2.0.docx (6 tasks)
  ✅ T-0001: Conservative Base Consolidation (DVM)
  ⏳ T-0003: WOW Phase-1 Assembly
  ⏳ T-0005: FX Hedging Playbook
  
📄 recommendations.docx (2 tasks)
  ✅ T-0004: Policy & Subsidy Annex
  ⏳ T-0009: JV Term Sheet Draft
```

### **Asset Vault Page**
- Expandable categories (Investor Packs, Data Room, Templates)
- Each asset shows its source document
- Confidential assets marked with red badge
- "Open" and "Copy Link" buttons for quick access

---

## 🏷️ Source ID Conventions

| Prefix | Category | Example |
|--------|----------|---------|
| `SRC-STRAT-*` | Strategic Planning | `SRC-STRAT-ROADMAP` |
| `SRC-PROG-*` | Progress Reports | `SRC-PROG-REPORT` |
| `SRC-ASSETS-*` | Asset Inventories | `SRC-ASSETS-STATUS` |
| `SRC-BIZ-*` | Business Development | `SRC-BIZ-IDEAS` |
| `SRC-RECO-*` | Recommendations | `SRC-RECO` |
| `SRC-GROK-*` | AI-Generated Data | `SRC-GROK-CLIENTS` |

---

## 🔍 Querying by Source

### **Find All Tasks from a Specific Document**:
```javascript
import { getTasksBySource } from '../utils/useData'

const tasks = getTasksBySource('SRC-STRAT-ROADMAP')
// Returns array of tasks with source: 'SRC-STRAT-ROADMAP'
```

### **Get Source Document Details**:
```javascript
import { getSourceById } from '../utils/useData'

const doc = getSourceById('SRC-PROG-REPORT')
// Returns: { id: 'SRC-PROG-REPORT', title: 'progress report AHKStrategies.docx', ... }
```

### **Group Tasks by Source**:
```javascript
import { groupTasksBySource } from '../utils/useData'

const grouped = groupTasksBySource()
// Returns: { 'SRC-STRAT-ROADMAP': [...], 'SRC-PROG-REPORT': [...] }
```

---

## 🚀 Benefits of Source Tracking

### **1. Traceability**
- Every data point traceable to authoritative source
- Investor questions answered with document references
- Audit trails for compliance

### **2. Update Propagation**
- When source document changes, find all affected items
- Prevent stale data in dashboard
- Synchronize across all pages

### **3. Collaboration**
- Team members know which document to update
- Clear ownership of data sources
- Reduced duplication

### **4. Investor Confidence**
- Show data provenance in pitch decks
- Link dashboard to supporting documents
- Professional documentation practices

---

## 📝 Adding New Source Documents

### **Step 1: Register in sources.index.json**
```json
{
  "id": "SRC-MARKET-STUDY",
  "title": "Market_Analysis_Q1_2026.pdf",
  "path": "uploads/Market_Analysis_Q1_2026.pdf",
  "status": "active"
}
```

### **Step 2: Reference in Data Files**
```json
// In projects.json
{
  "id": "PRJ-NEW",
  "name": "New Project",
  "source_docs": ["SRC-MARKET-STUDY"]
}

// In roadmap.json
{
  "id": "T-0011",
  "title": "Implement market insights",
  "source": "SRC-MARKET-STUDY"
}
```

### **Step 3: Verify in UI**
- Check Dashboard shows correct source badge count
- Verify Strategy "By Source" view includes new document
- Ensure Asset Vault displays source reference

---

## 🛠️ Maintenance Best Practices

### **Weekly**
- ✅ Review `sources.index.json` for accuracy
- ✅ Check for orphaned source references (IDs not in index)
- ✅ Update document versions if source files changed

### **Monthly**
- ✅ Archive superseded source documents
- ✅ Verify all source paths are accessible
- ✅ Update Data_Sources.md with new conventions

### **Before Investor Presentations**
- ✅ Ensure all source documents are latest versions
- ✅ Double-check confidentiality flags on assets
- ✅ Verify source document titles are professional

---

## ❓ FAQ

**Q: Why separate `source` (single) from `source_docs` (array)?**  
A: Tasks have one originating document (`source`), while projects aggregate data from multiple documents (`source_docs`).

**Q: What if a task comes from multiple sources?**  
A: Choose the primary source. Add a `notes` field mentioning secondary sources.

**Q: Can I have assets without source documents?**  
A: Yes. Internal templates or AI-generated content may not have a specific source_doc.

**Q: How do I handle conflicting data between sources?**  
A: Mark the most authoritative source in `status: "active"` and others as `status: "superseded"`. Update dashboard data to match active source.

---

**Last Updated**: Mission #4 – November 1, 2025  
**Maintained By**: AHK Strategies Data Team
