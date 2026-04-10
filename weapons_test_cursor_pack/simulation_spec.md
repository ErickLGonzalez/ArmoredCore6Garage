# Simulation Spec

## Core State
```ts
type WeaponsTestSimulationState = {
  time: number
  currentEnergy: number
  maxEnergy: number
  targetStagger: number
  targetStaggerMax: number
  targetAp?: number
  activeWeapons: string[]
  targetMode: 'dummy' | 'compare'
  events: WeaponTestEvent[]
}
```

## Event Model
```ts
type WeaponTestEvent =
  | { type: 'weapon_fired'; weaponId: string; origin: Vec3; t: number }
  | { type: 'projectile_impact'; weaponId: string; target: Vec3; t: number; impact: number }
  | { type: 'energy_spent'; amount: number; t: number }
  | { type: 'stagger_added'; amount: number; total: number; t: number }
  | { type: 'stagger_triggered'; t: number }
  | { type: 'reload_started'; weaponId: string; t: number }
```

## Tick Loop
Run simulation on requestAnimationFrame / fixed timestep.

Each tick:
1. Advance time
2. Process queued fire events
3. Apply EN drain / recharge
4. Apply target stagger decay
5. Resolve impacts / damage
6. Emit visual events
7. Update HUD state
