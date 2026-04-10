# Component Tree

```txt
components/garage/weapons-test/
  WeaponsTestTab.tsx
  WeaponsTestControls.tsx
  WeaponsTestHud.tsx
  WeaponsTestArena.tsx
  DummyAcRig.tsx
  CompareAcRig.tsx
  EnergyBar.tsx
  StaggerBar.tsx
  EventFeed.tsx
  effects/
    ParticleScene.tsx
    ParticleEmitter.tsx
    effectsRegistry.ts
    presets/
      kinetic.ts
      shotgun.ts
      laser.ts
      plasma.ts
      missile.ts
      explosive.ts
```

## Suggested Props

### WeaponsTestTab
```ts
type WeaponsTestTabProps = {
  attackerBuild: BuildAnalysis
  compareBuild?: BuildAnalysis
}
```

### ParticleScene
```ts
type ParticleSceneProps = {
  events: WeaponTestEvent[]
  quality: 'off' | 'low' | 'high'
}
```
