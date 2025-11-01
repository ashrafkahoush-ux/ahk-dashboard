# 🚀 Quick Start Guide - AHK Strategic Dashboard

## Getting Started in 3 Steps

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Development Server
```bash
npm run dev
```

The dashboard will open at `http://localhost:3000`

### 3. Explore Your Dashboard
- **Dashboard**: Overview of all projects and metrics
- **Strategy**: Task roadmap with interactive checkboxes
- **Marketing Pulse**: Analytics, campaigns, and daily metrics
- **Asset Vault**: Resources and documentation hub

---

## 📊 Feeding Real Data

To populate the dashboard with your actual business data, simply edit the JSON files in `src/data/` and save. The UI updates automatically thanks to Vite's hot module replacement.

### Data Files Overview

#### **`src/data/projects.json`** - Your Active Projects
```json
[
  {
    "id": "P001",
    "name": "Q-VAN Localisation Hub",
    "description": "AI-powered vehicle localisation platform",
    "progress": 65,
    "status": "on-track",
    "nextMilestone": "Investor pitch",
    "timeline": "6 months",
    "owner": "AHKStrategies",
    "startDate": "2024-08-01",
    "fundingStage": "Pre-Series A"
  }
]
```

**Status Options**: `on-track`, `at-risk`, `planning`, `in-progress`

---

#### **`src/data/roadmap.json`** - Strategic Tasks
```json
[
  {
    "id": "T001",
    "title": "Finalize investor-ready HTML studies",
    "description": "Comprehensive project documentation",
    "status": "pending",
    "projectId": "P001"
  }
]
```

**Status Options**: `pending`, `in-progress`, `completed`

**Interactive Features**: 
- Click checkboxes in Strategy page to toggle tasks between `pending` ↔ `completed`
- Filter tasks by status using the filter buttons

---

#### **`src/data/daily-metrics.json`** - Marketing Performance
```json
[
  {
    "date": "2025-11-01",
    "visitors": 145,
    "leads": 8,
    "conversionRate": 5.52,
    "linkedInImpressions": 2100,
    "emailsSent": 12
  }
]
```

**Displayed in**: Marketing Pulse page as an interactive table with trend indicators

---

#### **`src/data/metrics.json`** - Dashboard Metrics
```json
{
  "overview": {
    "activeProjects": 3,
    "completedTasks": 12,
    "totalTasks": 25,
    "projectedROI": "$2.8M",
    "totalBudget": "$750K"
  },
  "projectHealth": {
    "onTrack": 2,
    "planning": 1
  },
  "timeline": {
    "nextMilestone": "Q-VAN Seed Round",
    "daysToNextMilestone": 45,
    "currentPhase": "Series A Prep"
  }
}
```

---

#### **`src/data/marketing-analytics.json`** - Weekly Trends
```json
[
  {
    "date": "2025-10-26",
    "websiteVisits": 120,
    "linkedInImpressions": 1800,
    "formSubmissions": 5
  }
]
```

**Displayed as**: Line and bar charts in Marketing Pulse page

---

## 🎨 Customizing Your Dashboard

### Brand Colors (Already Configured)
- **Navy**: `#0A192F` - Primary brand color
- **Gold**: `#D4AF37` - Accent color for highlights
- **Slate**: `#8892B0` - Neutral UI elements

### Adding New Pages
1. Create a new component in `src/pages/`
2. Add route in `src/App.jsx`
3. Add navigation link in `src/components/Sidebar.jsx`

### Creating Custom Components
Place reusable components in `src/components/` and import where needed.

---

## 🔧 Development Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build production-ready bundle |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Check code quality with ESLint |

---

## 📁 Project Structure

```
AHK_Dashboard_v1/
├── src/
│   ├── components/       # Reusable UI components
│   │   ├── Layout.jsx
│   │   ├── Sidebar.jsx
│   │   ├── Navbar.jsx
│   │   ├── MetricCard.jsx
│   │   ├── ProjectCard.jsx
│   │   ├── TaskList.jsx
│   │   ├── MetricsChart.jsx
│   │   ├── MetricsTable.jsx
│   │   └── Table.jsx
│   ├── pages/            # Dashboard pages
│   │   ├── Dashboard.jsx
│   │   ├── Strategy.jsx
│   │   ├── MarketingPulse.jsx
│   │   └── AssetVault.jsx
│   ├── data/             # JSON data files (EDIT THESE!)
│   │   ├── projects.json
│   │   ├── roadmap.json
│   │   ├── daily-metrics.json
│   │   ├── metrics.json
│   │   └── marketing-analytics.json
│   ├── App.jsx           # Main app with routing
│   ├── main.jsx          # Entry point
│   └── index.css         # Global styles
├── docs/                 # Documentation
│   ├── QUICK_START.md    # This file
│   ├── Data_Editing_Guide.md
│   ├── AI_Workflow.md
│   ├── Daily_Playbook.md
│   └── Investor_Relations.md
├── package.json
├── tailwind.config.js    # Tailwind + AHK brand config
└── vite.config.js        # Vite configuration
```

---

## 🎯 Common Tasks

### Update Project Progress
Edit `src/data/projects.json` → Change `progress` value (0-100)

### Mark Tasks Complete
Click checkboxes in Strategy page OR edit `src/data/roadmap.json` → Change `status` to `"completed"`

### Add New Metrics
Edit `src/data/daily-metrics.json` → Add new date entry with visitor/lead data

### Change Dashboard Numbers
Edit `src/data/metrics.json` → Update `overview`, `projectHealth`, or `timeline` values

---

## 🚨 Troubleshooting

**Dashboard not loading?**
- Ensure Node.js is installed: `node --version`
- Clear cache: Delete `node_modules` and run `npm install` again

**Data not updating?**
- Check JSON syntax using [JSONLint](https://jsonlint.com/)
- Save the file (Ctrl+S / Cmd+S)
- Check browser console (F12) for errors

**Styling looks broken?**
- Run `npm run dev` to restart Vite
- Clear browser cache (Ctrl+Shift+R / Cmd+Shift+R)

**Git commit issues?**
- Configure Git: 
  ```bash
  git config user.name "Your Name"
  git config user.email "your.email@example.com"
  ```

---

## 📚 Next Steps

1. **Review Documentation**: Check `docs/` folder for detailed guides
2. **Customize Data**: Replace sample data with your real projects
3. **Deploy**: Build and host on Vercel, Netlify, or GitHub Pages
4. **Integrate APIs**: Connect to live data sources for real-time updates

---

## 💡 Pro Tips

- Use VS Code's JSON IntelliSense for faster editing
- Keep backups before major data changes
- Test changes locally before deploying
- Use Git for version control: `git commit -m "Updated Q-VAN metrics"`

---

**Need Help?** Refer to `docs/Data_Editing_Guide.md` for detailed field explanations.

**Built with**: React 18 • Vite 5 • Tailwind CSS 3 • Recharts
