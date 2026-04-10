# Weapons Test Architecture

## Goal
Create a live combat sandbox where users can fire selected equipped weapons against:
- Dummy AC
- Compare AC

The sandbox should:
- Simulate EN drain in real time
- Simulate stagger buildup/decay in real time
- Render particle effects for weapon fire / impacts
- Support multiple simultaneous weapons

## System Split

### UI Layer
Responsible for:
- Tab layout
- Controls
- HUD bars
- Weapon selection
- Target selection

### Simulation Layer
Responsible for:
- Weapon cadence
- Fire scheduling
- Reload timing
- EN drain / recharge
- Impact accumulation
- Stagger decay / trigger
- Damage / mitigation

### Particle Layer
Responsible for:
- Muzzle flash
- Projectile trails
- Impact bursts
- Stagger bursts

IMPORTANT:
Particles visualize simulation output only.
Do NOT embed gameplay logic in the particle layer.
