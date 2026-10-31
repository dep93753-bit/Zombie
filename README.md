# Zombie Escape

A first-person, low-poly zombie shooter that runs in the browser. Fight through five zones
and escape on the rescue helicopter.

**Play:** https://dep93753-bit.github.io/Zombie/

## Status

Stage 1 of 10: pistol, walker zombies, shooting, reloading, health, death and restart,
on computer and phone. See [`docs/VISION.md`](docs/VISION.md) for the full game plan.

## Controls

| Action | Computer | Phone / tablet |
|---|---|---|
| Move | WASD | Drag on the left side |
| Look | Mouse | Drag on the right side |
| Shoot | Left click | FIRE button |
| Reload | R | R button |
| Sprint | Shift | Push the joystick all the way |
| Pause | Esc | II button |

## Project layout

```
index.html        page, HUD and menus
css/style.css     all styling
js/               game code (one file per job: player, weapon, zombies, hud…)
lib/three/        Three.js 0.170.0 (MIT license), included so the game has no outside dependencies
assets/models/    3D models from Poly Pizza
assets/credits.json  who made each asset and its license
docs/VISION.md    the full game design
```

No build step: GitHub Pages serves the files exactly as they are. To run it locally,
start any static server in this folder (for example `python3 -m http.server`) and open
`http://localhost:8000`. Opening `index.html` directly from disk won't work, because
browsers block loading models from `file://`.

## Credits

3D models by [Quaternius](https://quaternius.com) (CC0) via [Poly Pizza](https://poly.pizza).
The full list is in [`assets/credits.json`](assets/credits.json).
