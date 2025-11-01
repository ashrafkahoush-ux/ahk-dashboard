# Data Editing Guide

## How to Edit Your Dashboard Data

This guide explains how to populate and customize the JSON data files that power your AHK Strategic Dashboard.

---

## 📁 Data Files Location

All data files are located in: `src/data/`

**Files:**
- `projects.json` - Your strategic projects
- `roadmap.json` - Your task list and roadmap
- `metrics.json` - Overview metrics and KPIs
- `marketing-analytics.json` - Marketing performance data

---

## 🎯 Project Data (`src/data/projects.json`)

### Structure

This file contains an **array** of project objects. Each project represents a strategic initiative.

### Example Entry

```json
{
  "id": "unique-project-id",
  "name": "Project Name",
  "description": "Brief description of the project",
  "status": "in-progress",
  "progress": 35,
  "nextMilestone": "Next major milestone",
  "timeline": "Q1 2026 Target Launch",
  "category": "Core Product",
  "priority": "high",
  "team": ["Product", "Engineering", "Design"],
  "budget": "$250K",
  "roi": "450%"
}
```

### Field Descriptions

| Field | Type | Required | Options | Description |
|-------|------|----------|---------|-------------|
| `id` | string | ✅ | Any unique ID | Unique identifier (lowercase, no spaces) |
| `name` | string | ✅ | Any text | Display name of the project |
| `description` | string | ✅ | Any text | Short description (1-2 sentences) |
| `status` | string | ✅ | `on-track`, `in-progress`, `at-risk`, `planning`, `delayed` | Current project status |
| `progress` | number | ✅ | 0-100 | Percentage complete |
| `nextMilestone` | string | ✅ | Any text | Next upcoming milestone |
| `timeline` | string | ❌ | Any text | Target completion date |
| `category` | string | ❌ | Any text | Project category/type |
| `priority` | string | ❌ | `high`, `medium`, `low` | Priority level |
| `team` | array | ❌ | Array of strings | Team members or departments |
| `budget` | string | ❌ | Any text | Budget allocation |
| `roi` | string | ❌ | Any text | Expected ROI |

### How to Add a New Project

1. Open `src/data/projects.json`
2. Add a comma after the last project entry
3. Paste this template:

```json
,
{
  "id": "my-new-project",
  "name": "My New Project",
  "description": "What this project is about",
  "status": "planning",
  "progress": 0,
  "nextMilestone": "Kickoff Meeting",
  "timeline": "Q2 2026",
  "category": "Innovation",
  "priority": "medium",
  "team": ["Strategy"],
  "budget": "$100K",
  "roi": "250%"
}
```

4. Customize the values
5. Save the file
6. Refresh your dashboard

### Status Options Explained

- **`on-track`** - Green indicator, everything going well
- **`in-progress`** - Purple indicator, actively being worked on
- **`at-risk`** - Yellow indicator, potential issues
- **`planning`** - Blue indicator, still in planning phase
- **`delayed`** - Red indicator, behind schedule

---

## ✅ Task/Roadmap Data (`src/data/roadmap.json`)

### Structure

This file contains an **array** of task objects. Each task is a specific action item.

### Example Entry

```json
{
  "id": 1,
  "title": "Complete strategic positioning document",
  "category": "Strategy",
  "priority": "high",
  "status": "completed",
  "dueDate": "2025-11-05",
  "project": "Foundation"
}
```

### Field Descriptions

| Field | Type | Required | Options | Description |
|-------|------|----------|---------|-------------|
| `id` | number | ✅ | Unique number | Sequential ID (1, 2, 3...) |
| `title` | string | ✅ | Any text | Task description |
| `category` | string | ✅ | Any text | Task category (Strategy, Marketing, etc.) |
| `priority` | string | ✅ | `high`, `medium`, `low` | Priority level |
| `status` | string | ✅ | `not-started`, `in-progress`, `completed` | Current status |
| `dueDate` | string | ✅ | `YYYY-MM-DD` | Due date in ISO format |
| `project` | string | ✅ | Any text | Associated project name |

### How to Add a New Task

1. Open `src/data/roadmap.json`
2. Add a comma after the last task
3. Paste this template:

```json
,
{
  "id": 11,
  "title": "Your new task description",
  "category": "Marketing",
  "priority": "high",
  "status": "not-started",
  "dueDate": "2025-11-15",
  "project": "Brand Awareness"
}
```

4. **Important:** Increment the `id` number (11, 12, 13...)
5. Save and refresh

### Status Behavior

When you **check the checkbox** on the Strategy page:
- Status changes from `not-started` → `completed`
- Task gets strikethrough styling
- Progress bar updates automatically

### Expanding to 100 Tasks

To create your full roadmap:

1. Copy existing task template
2. Change `id` to next number (11, 12, 13... up to 100)
3. Update `title`, `dueDate`, `project`, etc.
4. Keep adding tasks until you have 100

**Pro Tip:** Use a spreadsheet to plan your 100 tasks, then convert to JSON format.

---

## 📊 Overview Metrics (`src/data/metrics.json`)

### Structure

This file contains an **object** with multiple sections of metrics.

### Full Structure

```json
{
  "overview": {
    "totalTasks": 100,
    "completedTasks": 12,
    "inProgressTasks": 8,
    "activeProjects": 3,
    "totalBudget": "$580K",
    "projectedROI": "380%"
  },
  "weeklyMetrics": {
    "websiteVisits": 1250,
    "linkedInImpressions": 8500,
    "formSubmissions": 23,
    "emailEngagement": "34%",
    "leadQuality": "High"
  },
  "projectHealth": {
    "onTrack": 2,
    "atRisk": 0,
    "delayed": 0,
    "planning": 1
  },
  "timeline": {
    "currentPhase": "Foundation & MVP Development",
    "nextMilestone": "Dashboard Launch",
    "daysToNextMilestone": 7,
    "quarterProgress": 35
  },
  "team": {
    "totalHours": 320,
    "productivity": "92%",
    "velocity": "High",
    "burnRate": "$45K/month"
  }
}
```

### How to Update Metrics

1. Open `src/data/metrics.json`
2. Find the section you want to update
3. Change the values
4. Save and refresh

**Example - Updating Overview:**

```json
"overview": {
  "totalTasks": 100,           ← Change to your total task count
  "completedTasks": 25,        ← Update as you complete tasks
  "inProgressTasks": 10,       ← Currently active tasks
  "activeProjects": 5,         ← Number of projects
  "totalBudget": "$1.2M",      ← Your total budget
  "projectedROI": "500%"       ← Expected ROI
}
```

### Update Frequency

**Daily:**
- `completedTasks`
- `inProgressTasks`
- `websiteVisits`
- `formSubmissions`

**Weekly:**
- `weeklyMetrics` (all fields)
- `projectHealth` counts
- `timeline.daysToNextMilestone`

**Monthly:**
- `totalBudget`
- `projectedROI`
- `team` metrics

---

## 📈 Marketing Analytics (`src/data/marketing-analytics.json`)

### Structure

This file contains an **array** of daily marketing data. This powers your trend charts.

### Example Entry

```json
{
  "id": 1,
  "date": "2025-10-25",
  "websiteVisits": 1100,
  "linkedInImpressions": 7200,
  "formSubmissions": 18,
  "emailsSent": 45,
  "emailOpens": 16
}
```

### Field Descriptions

| Field | Type | Description |
|-------|------|-------------|
| `id` | number | Sequential ID |
| `date` | string | Date in `YYYY-MM-DD` format |
| `websiteVisits` | number | Total website visits that day |
| `linkedInImpressions` | number | LinkedIn post impressions |
| `formSubmissions` | number | Leads captured via forms |
| `emailsSent` | number | Emails sent that day |
| `emailOpens` | number | Email opens |

### How to Add New Data

**Daily Update:**

1. Open `src/data/marketing-analytics.json`
2. Add comma after last entry
3. Add today's data:

```json
,
{
  "id": 8,
  "date": "2025-11-01",
  "websiteVisits": 1750,
  "linkedInImpressions": 10500,
  "formSubmissions": 38,
  "emailsSent": 65,
  "emailOpens": 28
}
```

4. Increment `id` and update `date`
5. Fill in your actual metrics
6. Save and refresh

### Chart Display

The **Marketing Pulse** page shows:
- Last 7 days in line chart
- Last 7 days in bar chart
- Trend arrows (up/down) based on previous day

**To see trends**, add at least 2 days of data.

---

## 🔧 Common Editing Tasks

### Task 1: Mark Tasks as Completed

**Option A: Via Dashboard (Recommended)**
1. Go to Strategy page
2. Click checkbox next to task
3. Status automatically updates

**Option B: Manually Edit JSON**
1. Open `src/data/roadmap.json`
2. Find the task by `id`
3. Change `"status": "not-started"` to `"status": "completed"`
4. Save and refresh

---

### Task 2: Update Project Progress

1. Open `src/data/projects.json`
2. Find your project by `id`
3. Update `"progress": 35` to your current percentage (0-100)
4. Optionally update `"status"` and `"nextMilestone"`
5. Save and refresh

**Progress Bar Colors:**
- 0-33%: Early stage (lighter bar)
- 34-66%: Mid-progress (medium bar)
- 67-100%: Nearly complete (full bar)

---

### Task 3: Add a Week of Marketing Data

1. Open `src/data/marketing-analytics.json`
2. Copy the last entry
3. Paste 7 times
4. Update `id` (increment by 1 each time)
5. Update `date` (consecutive days)
6. Update metrics with real or estimated data
7. Save and refresh

---

### Task 4: Change Project Status

1. Open `src/data/projects.json`
2. Find project by `name`
3. Change `"status"` to one of:
   - `"on-track"` (green)
   - `"in-progress"` (purple)
   - `"at-risk"` (yellow)
   - `"planning"` (blue)
   - `"delayed"` (red)
4. Save and refresh

---

## 💡 Best Practices

### ✅ Do's

- **Use consistent date format:** `YYYY-MM-DD`
- **Validate JSON:** Use [JSONLint](https://jsonlint.com/) to check syntax
- **Backup before editing:** Copy file before major changes
- **Start small:** Edit one entry first, test, then do more
- **Use descriptive names:** Clear task titles and project names
- **Update regularly:** Keep data current for accurate dashboards

### ❌ Don'ts

- **Don't forget commas** between array items
- **Don't use trailing commas** after last item
- **Don't change field names** (keys like "id", "name", etc.)
- **Don't use special characters** without escaping
- **Don't delete required fields**
- **Don't skip IDs** (keep sequential: 1, 2, 3...)

---

## 🛠️ Troubleshooting

### Problem: Dashboard shows blank/error

**Solution:**
1. Check browser console (F12)
2. Look for JSON parsing error
3. Validate JSON at [JSONLint.com](https://jsonlint.com/)
4. Common issues:
   - Missing comma between items
   - Extra comma after last item
   - Missing quote marks
   - Wrong bracket type

---

### Problem: Task checkbox doesn't work

**Solution:**
1. Ensure `status` is exactly: `"not-started"`, `"in-progress"`, or `"completed"`
2. No typos or extra spaces
3. Refresh page with Ctrl+Shift+R (hard refresh)

---

### Problem: Chart not displaying

**Solution:**
1. Ensure `marketing-analytics.json` has at least 2 entries
2. Check date format is `YYYY-MM-DD`
3. Ensure all number fields are numbers, not strings
4. Example: `"websiteVisits": 1500` ✅ not `"websiteVisits": "1500"` ❌

---

### Problem: Colors look wrong

**Solution:**
- Clear browser cache (Ctrl+Shift+Delete)
- Hard refresh (Ctrl+Shift+R)
- Check Tailwind config wasn't changed

---

## 📝 Example: Adding 10 More Tasks

```json
{
  "id": 11,
  "title": "Research competitor pricing strategies",
  "category": "Market Research",
  "priority": "high",
  "status": "not-started",
  "dueDate": "2025-11-08",
  "project": "DVM"
},
{
  "id": 12,
  "title": "Design homepage mockups",
  "category": "Design",
  "priority": "high",
  "status": "not-started",
  "dueDate": "2025-11-10",
  "project": "Dashboard"
},
{
  "id": 13,
  "title": "Write investor FAQ document",
  "category": "Fundraising",
  "priority": "medium",
  "status": "not-started",
  "dueDate": "2025-11-12",
  "project": "Investor Relations"
}
```

Continue this pattern to reach 100 tasks!

---

## 🎯 Quick Reference

### File Paths
- Projects: `src/data/projects.json`
- Tasks: `src/data/roadmap.json`
- Metrics: `src/data/metrics.json`
- Analytics: `src/data/marketing-analytics.json`

### Validation Tool
**JSONLint:** https://jsonlint.com/

### Required Fields
- **Projects:** id, name, description, status, progress, nextMilestone
- **Tasks:** id, title, category, priority, status, dueDate, project
- **Analytics:** id, date, websiteVisits, linkedInImpressions, formSubmissions

### Date Format
Always use: `YYYY-MM-DD` (e.g., `2025-11-15`)

---

## 🚀 You're Ready!

You now know how to:
- ✅ Add and edit projects
- ✅ Create and manage tasks
- ✅ Update metrics and KPIs
- ✅ Track marketing analytics
- ✅ Troubleshoot common issues

**Start customizing your dashboard with YOUR real data!**

---

**Need Help?**
- Review the sample data in each file
- Use JSON validators
- Check browser console for errors
- Make small changes and test frequently

**Last Updated:** November 1, 2025  
**Version:** 1.0.0 (Data Integration v0.1)
