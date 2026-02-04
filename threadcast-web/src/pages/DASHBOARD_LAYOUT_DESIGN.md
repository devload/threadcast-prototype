# User Dashboard Layout Design

## Overview
ThreadCast 사용자 대시보드의 레이아웃 및 컴포넌트 구조 설계 문서

## Layout Structure

### Desktop (lg: 1024px+)
```
┌─────────────────────────────────────────────────────────────────────┐
│                         Page Header                                  │
│  [Welcome Message]                              [+ New Mission]      │
├─────────────────────────────────────────────────────────────────────┤
│                     AI Alert Banner (conditional)                    │
├──────────┬──────────┬──────────┬──────────┬──────────────────────────┤
│  Stats   │  Stats   │  Stats   │  Stats   │  Stats                   │
│  Card 1  │  Card 2  │  Card 3  │  Card 4  │  Card 5                  │
├──────────┴──────────┴──────────┼──────────┴──────────────────────────┤
│                                │                                      │
│     Active Missions (2/3)      │     Todo Status Chart (1/3)         │
│     - Mission List             │     - Donut Chart                    │
│     - Progress bars            │     - Status Legend                  │
│                                │                                      │
├────────────────────────────────┼──────────────────────────────────────┤
│                                │                                      │
│    Activity Chart (2/3)        │     AI Questions (1/3)              │
│    - Weekly activity graph     │     - Pending questions list         │
│    - Commits/AI/Todos          │     - Answer buttons                 │
│                                │                                      │
├────────────────────────────────┴──────────────────────────────────────┤
│                        Recent Activity                                │
│  [Timeline events - horizontal scroll or vertical list]              │
├───────────────────────────────────────────────────────────────────────┤
│                        Quick Actions (4 cards)                        │
│  [New Mission] [Timeline] [AI Questions] [Settings]                  │
└───────────────────────────────────────────────────────────────────────┘
```

### Tablet (md: 768px - 1023px)
```
┌─────────────────────────────────────────────┐
│             Page Header                      │
├─────────────────────────────────────────────┤
│         AI Alert Banner                      │
├──────────┬──────────┬──────────┬────────────┤
│  Stats 1 │  Stats 2 │  Stats 3 │  Stats 4   │
├──────────┴──────────┼──────────┴────────────┤
│                     │   Todo Status          │
│  Active Missions    │   Chart                │
│                     │                        │
├─────────────────────┴───────────────────────┤
│            Activity Chart                    │
├─────────────────────────────────────────────┤
│            AI Questions                      │
├─────────────────────────────────────────────┤
│         Recent Activity                      │
├──────────┬──────────┬──────────┬────────────┤
│  Action  │  Action  │  Action  │  Action    │
└──────────┴──────────┴──────────┴────────────┘
```

### Mobile (< 768px)
```
┌─────────────────────────┐
│     Page Header         │
├─────────────────────────┤
│     Alert Banner        │
├──────────┬──────────────┤
│  Stats 1 │  Stats 2     │
├──────────┼──────────────┤
│  Stats 3 │  Stats 4     │
├──────────┴──────────────┤
│   Active Missions       │
├─────────────────────────┤
│   Todo Status Chart     │
├─────────────────────────┤
│   Activity Chart        │
├─────────────────────────┤
│   AI Questions          │
├─────────────────────────┤
│   Recent Activity       │
├──────────┬──────────────┤
│  Action  │  Action      │
├──────────┼──────────────┤
│  Action  │  Action      │
└──────────┴──────────────┘
```

## Component Hierarchy

```
UserDashboardPage
├── DashboardPageHeader
│   ├── Welcome message (i18n)
│   └── Action button (New Mission)
├── DashboardAlertBanner (AI Questions Alert)
├── DashboardSection (Stats)
│   └── DashboardGrid (5 cols on lg)
│       ├── DashboardStatCard (Total Missions)
│       ├── DashboardStatCard (Threading)
│       ├── DashboardStatCard (Completed Todos)
│       ├── DashboardStatCard (Progress)
│       └── DashboardStatCard (AI Questions)
├── DashboardGrid (Main Content - 3 cols)
│   ├── DashboardGridItem (colSpan=2)
│   │   └── DashboardWidget (Active Missions)
│   │       └── MissionListItem[] (custom)
│   └── DashboardGridItem (colSpan=1)
│       └── DashboardWidget (Todo Status)
│           └── TodoStatusChart (Recharts)
├── DashboardGrid (Charts Row - 3 cols)
│   ├── DashboardGridItem (colSpan=2)
│   │   └── DashboardWidget (Activity Overview)
│   │       └── WeeklyActivityChart (Recharts)
│   └── DashboardGridItem (colSpan=1)
│       └── DashboardWidget (AI Questions)
│           └── DashboardWidgetListItem[]
├── DashboardSection (Recent Activity)
│   └── DashboardWidget
│       └── DashboardWidgetListItem[]
└── DashboardSection (Quick Actions)
    └── DashboardGrid (4 cols)
        └── QuickActionCard[] (4 items)
```

## Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         Zustand Stores                           │
├────────────┬────────────┬────────────┬────────────┬─────────────┤
│ authStore  │ missionStore │ todoStore │ aiQuestion │ timelineStore│
│            │             │           │  Store     │              │
└─────┬──────┴──────┬──────┴─────┬─────┴──────┬─────┴──────┬───────┘
      │             │            │            │            │
      ▼             ▼            ▼            ▼            ▼
┌─────────────────────────────────────────────────────────────────┐
│                      UserDashboardPage                           │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    useMemo (stats)                       │    │
│  │  - activeMissions, completedMissions                     │    │
│  │  - totalTodos, completedTodos, threadingTodos            │    │
│  │  - pendingQuestions, overallProgress                     │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

## New Features to Add

### 1. Todo Status Chart Integration
- Use existing `TodoStatusChart` component
- Data from mission.todoStats aggregation
- Donut variant with center total

### 2. Weekly Activity Chart Integration
- Use existing `WeeklyActivityChart` component
- Mock data initially (API endpoint needed)
- Shows AI vs User actions per day

### 3. Improved Stats Cards
- Add trend indicators
- Sparkline mini charts (optional)
- Click to navigate to relevant page

## Color Scheme

| Element | Color | Tailwind Class |
|---------|-------|----------------|
| Primary | Indigo | `indigo-600` |
| Success | Green | `green-500` |
| Warning | Amber | `amber-500` |
| Error/Tangled | Red | `red-500` |
| AI Accent | Purple | `purple-500` |
| Pending | Gray | `slate-400` |

## Responsive Breakpoints

| Breakpoint | Width | Columns | Gap |
|------------|-------|---------|-----|
| Default | < 640px | 1-2 | 12px |
| sm | >= 640px | 2 | 16px |
| md | >= 768px | 3 | 16px |
| lg | >= 1024px | 3-5 | 24px |
| xl | >= 1280px | 5-6 | 24px |

## Implementation Notes

1. **Performance**: Use `useMemo` for derived stats
2. **Loading States**: Show skeleton loaders during data fetch
3. **Empty States**: Meaningful empty states with CTAs
4. **Accessibility**: Proper ARIA labels, keyboard navigation
5. **i18n**: All text through `useTranslation` hook

## API Requirements

### New Endpoints Needed
- `GET /api/workspaces/{id}/activity/weekly` - Weekly activity data
- `GET /api/workspaces/{id}/stats/summary` - Aggregated dashboard stats

### Existing Endpoints Used
- `GET /api/missions` - Mission list
- `GET /api/timeline/events` - Recent events
- `GET /api/ai-questions` - AI questions
