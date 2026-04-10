# Armored Core Garage — React/ECharts Implementation Blueprint

## Stack
- React / Next.js
- Apache ECharts via React wrapper
- TypeScript
- Framer Motion for panel transitions
- Optional React Three Fiber for non-chart visual polish

## Why ECharts here
- It supports line/area charts, radar charts, heatmaps, gauges, datasets, rich tooltips, annotations, and progressive rendering. It also supports Canvas and SVG renderers, and its package import guidance recommends modular imports via `echarts/core` for bundle-size control. The React wrapper `echarts-for-react` exposes the chart through a React component and supports updating via props.

---

# 1. Folder Structure

```txt
src/
  components/garage/
    GarageDashboard.tsx
    BuildHeader.tsx
    SummaryCardsRow.tsx
    charts/
      EChartBase.tsx
      CombatEnvelopeChart.tsx
      EnergyEnvelopeChart.tsx
      RecoilTimelineChart.tsx
      DefensiveRadarChart.tsx
      MatchupHeatmapChart.tsx
      RangeBandLegend.tsx
    panels/
      CombatEnvelopePanel.tsx
      EnergySystemsPanel.tsx
      WeaponHandlingPanel.tsx
      DefensiveProfilePanel.tsx
      MatchupInsightsPanel.tsx
    cards/
      MetricCard.tsx
      WeaponProfileCard.tsx
      InsightSummaryCard.tsx
    compare/
      CompareToggle.tsx
      DeltaStat.tsx
      ComparisonLegend.tsx
  lib/garage/
    charts/
      theme.ts
      format.ts
      commonOptions.ts
      combatEnvelope.options.ts
      energyEnvelope.options.ts
      recoilTimeline.options.ts
      defensiveRadar.options.ts
      matchupHeatmap.options.ts
    selectors/
      buildSummary.selectors.ts
      combatEnvelope.selectors.ts
      energy.selectors.ts
      recoil.selectors.ts
      defense.selectors.ts
      matchup.selectors.ts
    insights/
      archetype.ts
      naturalLanguageSummary.ts
      matchupScoring.ts
    types/
      build.ts
      charts.ts
      insights.ts
```

---

# 2. Core Data Contracts

## Build model

```ts
export type DistancePoint = {
  distanceM: number
  aimAssistPct: number
  weaponEfficiencyPct?: number
  predictedHitConsistency?: number
}

export type TimePoint = {
  t: number
  value: number
}

export type MatchupKey = 'rushdown' | 'midrange' | 'tank' | 'missile_boat' | 'hover_kite'
export type MatchupAxis = 'neutral' | 'pressure' | 'sustain' | 'escape'

export type BuildSummary = {
  id: string
  code: string
  name?: string
  weightClass: 'light' | 'mid' | 'heavy'
  tags: string[]
  mobility: {
    boostSpeed: number
    quickBoostSpeed: number
    assaultBoostSpeed: number
  }
  durability: {
    ap: number
    effectiveAP: number
    stability: number
    kineticDef: number
    energyDef: number
    explosiveDef: number
  }
  energy: {
    enLoadPct: number
    enMargin: number
    rechargeRate: number
    redlineRecoveryRate: number
    rechargeDelaySec: number
    fullRechargeSec: number
  }
  firepower: {
    burstDps: number
    sustainedDps: number
    staggerPressure: number
  }
}

export type WeaponRangeBand = {
  label: string
  startM: number
  endM: number
  emphasis?: 'ideal' | 'effective' | 'falloff'
}

export type CombatEnvelopeData = {
  points: DistancePoint[]
  distanceZones: Array<{ label: string; startM: number; endM: number }>
  weaponBands: WeaponRangeBand[]
  peakPoint?: DistancePoint
  dropoffPoint?: DistancePoint
  mismatchStartPoint?: DistancePoint
}

export type EnergyEnvelopeData = {
  normalRecharge: TimePoint[]
  redlineRecharge: TimePoint[]
  rechargeDelaySec: number
  halfRechargeSec: number
  fullRechargeSec: number
  enLoadPct: number
  generatorEfficiencyPct: number
  boosterDemandPct: number
  redlineRiskPct: number
}

export type RecoilTimelineData = {
  points: TimePoint[]
  stableThreshold: number
  unstableThreshold: number
  breakThreshold: number
  timeToBreakSec?: number
  sustainedFireThresholdSec?: number
}

export type DefensiveRadarData = {
  ap: number
  effectiveAP: number
  stability: number
  kineticDef: number
  energyDef: number
  explosiveDef: number
}

export type MatchupHeatmapData = {
  matrix: Array<{
    matchup: MatchupKey
    axis: MatchupAxis
    score: number
  }>
  summary: string
}
```

---

# 3. Shared Chart Shell

## `EChartBase.tsx`
Purpose:
- Wrap `echarts-for-react`
- Enforce consistent sizing, loading, empty states, theme, and event wiring

```tsx
import ReactECharts from 'echarts-for-react'
import type { EChartsOption } from 'echarts'

type EChartBaseProps = {
  option: EChartsOption
  height?: number
  loading?: boolean
  onEvents?: Record<string, (params: unknown) => void>
  className?: string
}

export function EChartBase({ option, height = 320, loading, onEvents, className }: EChartBaseProps) {
  return (
    <div className={className}>
      <ReactECharts
        option={option}
        notMerge={false}
        lazyUpdate={true}
        showLoading={loading}
        style={{ height, width: '100%' }}
        onEvents={onEvents}
      />
    </div>
  )
}
```

Implementation note:
- Prefer `lazyUpdate` for smoother UX on stat toggles.
- Use memoized option builders per panel.

---

# 4. Theme + Common ECharts Utilities

## `theme.ts`
Centralize:
- typography tokens
- panel border colors
- gridline opacity
- semantic colors
- shadow/glow helpers

```ts
export const chartTheme = {
  text: '#d8e1ea',
  subtext: '#8da0b3',
  grid: 'rgba(255,255,255,0.08)',
  cyan: '#58c8ff',
  green: '#6ee7b7',
  yellow: '#f6c453',
  orange: '#fb923c',
  red: '#f87171',
  slate: '#556274',
  panelBg: 'rgba(10,18,28,0.78)',
}
```

## `commonOptions.ts`
Create helpers for:
- axis styles
- tooltip styles
- grid config
- animation defaults
- markLine / markArea tokens

```ts
export const buildCommonGrid = () => ({ top: 28, right: 18, bottom: 28, left: 42, containLabel: true })

export const buildTooltip = () => ({
  trigger: 'axis',
  backgroundColor: 'rgba(9,12,18,0.96)',
  borderWidth: 1,
  textStyle: { color: '#d8e1ea', fontSize: 12 },
  extraCssText: 'border-radius:12px;box-shadow:0 8px 24px rgba(0,0,0,.28);',
})
```

---

# 5. Top-Level Dashboard Composition

## `GarageDashboard.tsx`

```tsx
type GarageDashboardProps = {
  build: BuildSummary
  combatEnvelope: CombatEnvelopeData
  energyEnvelope: EnergyEnvelopeData
  recoilTimeline: RecoilTimelineData
  defensiveRadar: DefensiveRadarData
  matchupHeatmap: MatchupHeatmapData
  compareBuild?: BuildSummary
  compareCombatEnvelope?: CombatEnvelopeData
  compareEnergyEnvelope?: EnergyEnvelopeData
  compareRecoilTimeline?: RecoilTimelineData
  compareDefensiveRadar?: DefensiveRadarData
}

export function GarageDashboard(props: GarageDashboardProps) {
  return (
    <div className="grid gap-4">
      <BuildHeader build={props.build} />
      <SummaryCardsRow build={props.build} compareBuild={props.compareBuild} />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <CombatEnvelopePanel
          build={props.build}
          data={props.combatEnvelope}
          compareData={props.compareCombatEnvelope}
        />
        <EnergySystemsPanel
          build={props.build}
          data={props.energyEnvelope}
          compareData={props.compareEnergyEnvelope}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <WeaponHandlingPanel
          build={props.build}
          recoilData={props.recoilTimeline}
          compareData={props.compareRecoilTimeline}
        />
        <DefensiveProfilePanel
          build={props.build}
          data={props.defensiveRadar}
          compareData={props.compareDefensiveRadar}
        />
      </div>

      <MatchupInsightsPanel build={props.build} data={props.matchupHeatmap} />
    </div>
  )
}
```

---

# 6. Header + Summary Cards

## `BuildHeader.tsx`
Props:
- `build: BuildSummary`

Render:
- Build code/name
- Weight badge
- Archetype tags
- Optional compare badge

## `SummaryCardsRow.tsx`
Use 6–8 `MetricCard` components.

### `MetricCard.tsx`
```ts
type MetricCardProps = {
  label: string
  value: string | number
  hint?: string
  delta?: number
  sparkline?: Array<number>
  tone?: 'neutral' | 'positive' | 'warning' | 'danger'
}
```

Suggested metrics:
- Boost Speed
- AP
- Stability
- EN Margin
- Burst DPS
- Sustained DPS
- Stagger Pressure
- Redline Risk

---

# 7. Combat Envelope Panel

## Component tree
- `CombatEnvelopePanel`
  - `RangeBandLegend`
  - `CombatEnvelopeChart`
  - `InsightSummaryCard`

## `CombatEnvelopePanel.tsx`
```tsx
type CombatEnvelopePanelProps = {
  build: BuildSummary
  data: CombatEnvelopeData
  compareData?: CombatEnvelopeData
}
```

Render structure:
- panel title: Combat Envelope
- subtitle: Aim Assist vs Distance
- chart
- summary strip

## `CombatEnvelopeChart.tsx`
Behavior:
- Primary smoothed line
- Optional compare dashed line
- Mark areas for Close / Mid / Long zones
- Mark lines or translucent overlays for weapon range bands
- Mark points for peak / dropoff / mismatch

### Option builder signature
```ts
export function buildCombatEnvelopeOption(
  data: CombatEnvelopeData,
  compareData?: CombatEnvelopeData
): EChartsOption
```

### Series model
1. Primary line series
2. Area fill under primary line
3. Compare line series (optional)
4. Invisible scatter for annotated breakpoints

### Important ECharts config choices
- `smooth: true`
- `showSymbol: false`
- `sampling: 'lttb'` if dataset gets large
- `markArea` for range zones
- `markLine` or custom overlay series for weapon band edges
- custom tooltip formatter returning:
  - distance
  - aim assist
  - efficiency
  - predicted consistency label

### Example option skeleton
```ts
export function buildCombatEnvelopeOption(data: CombatEnvelopeData, compareData?: CombatEnvelopeData): EChartsOption {
  return {
    animationDuration: 220,
    animationDurationUpdate: 180,
    grid: buildCommonGrid(),
    tooltip: {
      ...buildTooltip(),
      formatter: (params) => {
        const first = Array.isArray(params) ? params[0] : params
        const point = first?.data as DistancePoint
        return [
          `<div>Distance: ${point.distanceM}m</div>`,
          `<div>Aim Assist: ${point.aimAssistPct.toFixed(1)}%</div>`,
          point.weaponEfficiencyPct != null ? `<div>Weapon Efficiency: ${point.weaponEfficiencyPct.toFixed(1)}%</div>` : '',
          point.predictedHitConsistency != null ? `<div>Predicted Hit Consistency: ${point.predictedHitConsistency.toFixed(0)}%</div>` : '',
        ].join('')
      },
    },
    xAxis: {
      type: 'value',
      name: 'Distance (m)',
      splitLine: { lineStyle: { color: chartTheme.grid } },
    },
    yAxis: {
      type: 'value',
      name: 'Aim Assist %',
      min: 0,
      max: 100,
      splitLine: { lineStyle: { color: chartTheme.grid } },
    },
    series: [
      {
        type: 'line',
        smooth: true,
        showSymbol: false,
        data: data.points.map((p) => [p.distanceM, p.aimAssistPct, p]),
        lineStyle: { width: 3, color: chartTheme.cyan },
        areaStyle: {},
        markArea: {
          itemStyle: { opacity: 0.08 },
          data: data.distanceZones.map((z) => [{ xAxis: z.startM, name: z.label }, { xAxis: z.endM }]),
        },
      },
      ...(compareData ? [{
        type: 'line',
        smooth: true,
        showSymbol: false,
        data: compareData.points.map((p) => [p.distanceM, p.aimAssistPct, p]),
        lineStyle: { width: 2, type: 'dashed', color: chartTheme.yellow },
      }] : []),
    ],
  }
}
```

### UX rules
- Hover should highlight relevant range zone.
- Clicking a point pins the tooltip.
- Summary card below chart reads from selector output:
  - optimal range window
  - sharpest dropoff start
  - range mismatch warnings

---

# 8. Energy Systems Panel

## Component tree
- `EnergySystemsPanel`
  - `EnergyEnvelopeChart`
  - 4 horizontal meter rows
  - `InsightSummaryCard`

## `EnergyEnvelopeChart.tsx`
```tsx
type EnergyEnvelopeChartProps = {
  data: EnergyEnvelopeData
  compareData?: EnergyEnvelopeData
}
```

### Option builder
```ts
export function buildEnergyEnvelopeOption(
  data: EnergyEnvelopeData,
  compareData?: EnergyEnvelopeData
): EChartsOption
```

### Design requirements
- Two main series:
  - Normal recharge
  - Redline recharge
- Delay window shaded as `markArea`
- Mark points for 50% recharge and full recharge
- Optional compare build with dashed variants

### Supporting meters
Use compact bar/gauge components for:
- EN Load %
- Generator Efficiency
- Booster Demand
- Redline Risk

These can be plain React bars instead of ECharts for better scanability.

---

# 9. Weapon Handling Panel

## Component tree
- `WeaponHandlingPanel`
  - `RecoilTimelineChart`
  - Weapon mini-cards grid

## `RecoilTimelineChart.tsx`
```tsx
type RecoilTimelineChartProps = {
  data: RecoilTimelineData
  compareData?: RecoilTimelineData
}
```

### Option builder
```ts
export function buildRecoilTimelineOption(
  data: RecoilTimelineData,
  compareData?: RecoilTimelineData
): EChartsOption
```

### Chart requirements
- Time on X axis
- Recoil accumulation on Y axis
- Horizontal threshold lines:
  - Stable
  - Unstable
  - Break
- Shaded severity bands between thresholds
- Marker for time-to-break

### Weapon profile cards
`WeaponProfileCard.tsx`
```ts
type WeaponProfileCardProps = {
  weaponName: string
  burstDamage: number
  sustainedDps: number
  impactPerSec: number
  reloadSec?: number
  magazineSize?: number
  notes?: string[]
}
```

---

# 10. Defensive Profile Panel

## Component tree
- `DefensiveProfilePanel`
  - `DefensiveRadarChart`
  - three supporting metric rows

## `DefensiveRadarChart.tsx`
```tsx
type DefensiveRadarChartProps = {
  data: DefensiveRadarData
  compareData?: DefensiveRadarData
}
```

### Option builder
```ts
export function buildDefensiveRadarOption(
  data: DefensiveRadarData,
  compareData?: DefensiveRadarData
): EChartsOption
```

### Radar indicators
- AP
- Effective AP
- Stability
- Kinetic DEF
- Energy DEF
- Explosive DEF

### Notes
- Normalize values in selector layer so radar remains visually meaningful.
- Show real values in tooltip, not only normalized numbers.
- Compare build appears as second semi-transparent filled polygon.

---

# 11. Matchup Insights Panel

## Component tree
- `MatchupInsightsPanel`
  - `MatchupHeatmapChart`
  - `InsightSummaryCard`

## `MatchupHeatmapChart.tsx`
```tsx
type MatchupHeatmapChartProps = {
  data: MatchupHeatmapData
}
```

### Option builder
```ts
export function buildMatchupHeatmapOption(data: MatchupHeatmapData): EChartsOption
```

### Heatmap layout
Rows:
- Rushdown
- Midrange
- Tank
- Missile Boat
- Hover Kite

Columns:
- Neutral
- Pressure
- Sustain
- Escape

### UX requirements
- Tooltip explains why score exists if explanation metadata is available.
- Cell labels visible on desktop, hidden on smaller widths.

---

# 12. Selector Layer

Keep raw game/build math out of UI components.

## Example selector signatures
```ts
export function selectBuildSummary(buildData: RawGarageBuild): BuildSummary
export function selectCombatEnvelope(buildData: RawGarageBuild): CombatEnvelopeData
export function selectEnergyEnvelope(buildData: RawGarageBuild): EnergyEnvelopeData
export function selectRecoilTimeline(buildData: RawGarageBuild): RecoilTimelineData
export function selectDefensiveRadar(buildData: RawGarageBuild): DefensiveRadarData
export function selectMatchupHeatmap(buildData: RawGarageBuild): MatchupHeatmapData
```

Benefits:
- Components stay presentational
- Easier testing
- Easier comparison mode

---

# 13. Comparison Mode

## UI
- `CompareToggle`
- build picker or share-code input

## Pattern
Every panel takes optional `compareData`.

### Visual rules
- Primary build: solid cyan line / fill
- Compare build: dashed yellow line / lower-opacity fill
- Delta values shown on summary cards only
- Tooltips should show both builds when comparing

### Example dual tooltip format
```txt
185m
Primary: 82.3%
Compare: 74.9%
Delta: +7.4
```

---

# 14. Natural Language Insight Layer

## `naturalLanguageSummary.ts`
Pure functions generating short human-readable insights.

```ts
export function summarizeCombatEnvelope(data: CombatEnvelopeData): string
export function summarizeEnergy(data: EnergyEnvelopeData): string
export function summarizeDefense(data: DefensiveRadarData): string
export function summarizeMatchups(data: MatchupHeatmapData): string
```

Examples:
- `Optimal engagement range is 145–215m; tracking falls off quickly after 250m.`
- `Energy economy is strong, but redline recovery is punishing under repeated QB use.`

These summaries appear under charts and in mobile collapsed previews.

---

# 15. Responsive Behavior

## Desktop
- 2-column panel grid
- full labels visible
- legends inline

## Tablet
- panels stack to 1 column when cramped
- hide lower-priority annotations

## Mobile
- each panel becomes a card
- comparison legends collapse
- heatmap labels simplify
- pinned tooltips replace hover behavior

Implementation hints:
- use container queries or width hooks
- option builders should accept `compact: boolean`

---

# 16. Performance Guidance

ECharts supports progressive rendering and large datasets, but for this garage use case the main wins are simpler:
- memoize option builders with `useMemo`
- avoid rebuilding options on unrelated state updates
- use `showSymbol: false` for dense line charts
- enable `sampling: 'lttb'` for large distance arrays
- import modularly from `echarts/core` rather than the full bundle when possible

---

# 17. Testing Plan

## Unit tests
- selector outputs
- natural-language insight rules
- threshold/breakpoint calculations

## Visual regression
- compare screenshots for:
  - combat envelope normal
  - combat envelope compare mode
  - energy normal vs redline
  - recoil threshold states
  - radar compare mode
  - heatmap rendering

## Interaction tests
- tooltip data correctness
- compare toggle updates all panels
- mobile tap-to-pin works

---

# 18. Build Order

## Phase 1
1. `EChartBase`
2. `BuildHeader`
3. `SummaryCardsRow`
4. `CombatEnvelopePanel`
5. `EnergySystemsPanel`

## Phase 2
6. `WeaponHandlingPanel`
7. `DefensiveProfilePanel`

## Phase 3
8. `MatchupInsightsPanel`
9. comparison mode
10. natural-language summaries

## Phase 4
11. animated polish
12. optional non-chart particle background

---

# 19. Recommended Package Setup

## Core
```bash
npm install echarts echarts-for-react
```

## Optional UI polish
```bash
npm install framer-motion
```

## Optional 3D flourish
```bash
npm install three @react-three/fiber @react-three/drei
```

---

# 20. First Slice to Implement

Start with this exact vertical slice:
1. Build `EChartBase`
2. Implement `selectCombatEnvelope`
3. Implement `buildCombatEnvelopeOption`
4. Build `CombatEnvelopePanel`
5. Add compare mode support to only this panel
6. Reuse pattern for Energy next

That gets you the highest-value chart on-screen fastest, and establishes the architecture for everything else.

