# Zombie Escape: Project Vision

> Single source of truth for what this game is. A fresh session should be able to read
> this file and continue the project without the owner re-explaining anything.
> Decisions marked **(owner)** came directly from the project owner. Decisions marked
> **(proposed)** were suggested by Claude and accepted with "good" or "yup".

## 1. One-line pitch

A first-person, low-poly zombie shooter in the browser. You fight wave after wave of
zombies across five zones (Forest → Town → City → Military Base → Airfield), beat a
boss at the end of each zone, and escape on a rescue helicopter.

## 2. Platform and delivery

| Item | Decision |
|---|---|
| Tech | Plain HTML + CSS + JavaScript (ES modules), Three.js for 3D. No build step. **(owner: "html css and js")** |
| Hosting | GitHub Pages from repo `dep93753-bit/Zombie`, at `https://dep93753-bit.github.io/Zombie/` **(owner)** |
| Devices | Computers (keyboard + mouse) **and** phones/tablets (on-screen touch controls) **(owner)** |
| Assets | All models, sounds and textures live under `assets/` **(owner)** |
| 3D models | Downloaded from Poly Pizza (poly.pizza) through its official API **(owner)** |
| Sounds | Free sound files, mainly CC0 from OpenGameArt, stored in `assets/sounds/` **(owner)** |

## 3. Core gameplay

- **Camera:** first-person. You see your hands/gun only. **(owner)**
- **Structure:** five zones played in order. Each zone is a **path with branches**:
  some branches lead to loot (ammo, health, sometimes a gun) and some are alternate
  routes to the same place. **(owner)**
- **Waves:** about **8 waves per zone**. Waves happen **while you move along the path**,
  not in fixed arenas. A checkpoint is saved after every few waves, wherever the player is. **(owner)**
- **Boss:** one boss at the end of **every** zone (5 total). **(owner)**
- **Win:** beat the Zone 5 boss and reach the helicopter.
- **Length:** about 10+ minutes per zone, roughly 1 hour total. **(owner: "long")**
- **Difficulty:** one difficulty only. **(owner)**

## 4. Zones (in order) **(proposed, accepted)**

| # | Zone | Lighting / mood | New gun found | Boss |
|---|---|---|---|---|
| 1 | Forest: start at a crashed car in the woods | Foggy dawn | Pistol (starting gun) | **The Lumberjack**: big axe zombie that charges at you |
| 2 | Small town: streets, houses, gas station | Dusk | Shotgun | **The Butcher**: tough, calls in runner zombies |
| 3 | City: downtown, wrecked cars, tall buildings | Night | SMG | **The Brute**: huge, throws cars and debris |
| 4 | Military base: fences, tents, crates, watchtowers | Night with searchlights | Assault rifle | **The Soldier**: armored, hard to hurt from the front |
| 5 | Airfield / helipad: final stand | Sunrise | Minigun | **The Abomination**: giant mutant, several attack phases |

Lighting changes per zone. **(owner: C)**

## 5. Weapons **(proposed, accepted)**

- Start with a **pistol**. Find one new gun per zone (see table above).
- You **carry every gun** you have found and switch between them (number keys / scroll
  on computer, a weapon button on touch). **(owner)**
- Zone 5's gun is a **minigun**. **(owner)**
- No melee, no buying.

## 6. Enemies **(proposed, accepted)**

| Type | Behavior | First appears |
|---|---|---|
| Walker | Slow, average health, comes in big groups | Zone 1 |
| Runner | Fast, low health | Zone 2 |
| Tank | Slow, very tough, hits hard | Zone 3 |
| Spitter | Throws acid from range; player must dodge | Zone 4 |

Bosses are listed in section 4. How they look depends on which Poly Pizza models are
available; small changes to their appearance are allowed.

## 7. Health, ammo and pickups

- Zombies sometimes **drop ammo boxes and health packs**, and some are **placed around
  each zone**, including down loot branches. **(owner: A)**
- No health regeneration, no refill between waves.

## 8. Death, checkpoints and saving

- **Checkpoints:** one at the start of each zone, plus one after every few waves inside
  the zone. **(owner: "both")**
- **Respawn:** go back to the last checkpoint with **exactly what you had** at that
  moment (guns, ammo, health). **(owner: A)**
- **Saving:** the latest checkpoint is **saved in the browser** (localStorage), so closing
  and reopening the game lets you Continue. **(owner: yes)**

## 9. Story **(owner: B, light story)**

- Intro text: your car crashed in the woods; a radio says a rescue helicopter is waiting
  at the airfield; survive and get there.
- A few lines of text between zones.
- Ending screen when you escape on the helicopter.

## 10. Screen (HUD): all of these **(owner: "all")**

Health bar · ammo counter (in magazine / total) · current gun name or icon ·
wave counter ("Wave 3 / 8") · zone name · crosshair · minimap (path, branches, zombies) ·
objective arrow to the main path or exit · kill counter / score · red flash when hit.

## 11. Menus: all of these **(owner: "all")**

- **Title screen:** Continue (loads the saved checkpoint), New Game (asks before
  deleting the save), Settings, Credits, How to Play.
- **Settings:** music volume, sound-effects volume, mouse/touch sensitivity, graphics
  quality (Low / Medium / High), invert Y-axis, field of view.
- **Pause menu** (Esc, or a pause button on touch): Resume, Settings, Restart from
  checkpoint, Quit to title.

## 12. Art direction **(owner: C)**

- Low-poly. Use one or two matching artists (mainly **Quaternius**) so everything looks
  consistent. Fill gaps from other Poly Pizza artists whose style is close enough.
- Prefer **CC0** models and sounds. **CC-BY** is allowed but must be credited.

## 13. Licensing and credits rules

- Every downloaded asset is recorded in `assets/credits.json` (title, creator, license,
  source URL). The in-game Credits screen is generated from this file.
- The Poly Pizza API key is **never** committed to the repo.

## 14. Controls

| Action | Computer | Touch |
|---|---|---|
| Move | WASD | Left on-screen joystick |
| Look | Mouse (pointer lock) | Drag on the right half of the screen |
| Shoot | Left click | Fire button |
| Reload | R | Reload button |
| Switch gun | 1–5 / mouse wheel | Weapon button |
| Sprint | Shift | Push the joystick all the way |
| Pause | Esc | Pause button |

## 15. Out of scope (for now)

Multiplayer, controller support, buying/upgrades, melee, difficulty levels, leaderboards.
