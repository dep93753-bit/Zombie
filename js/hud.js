// Updates the on-screen HUD (health, ammo, kills, hit feedback).
const $ = (id) => document.getElementById(id);

export class Hud {
  constructor() {
    this.el = {
      hud: $('hud'),
      healthFill: $('health-fill'),
      healthText: $('health-text'),
      weaponName: $('weapon-name'),
      mag: $('ammo-mag'),
      reserve: $('ammo-reserve'),
      reload: $('reload-text'),
      kills: $('kill-count'),
      hitmarker: $('hitmarker'),
      damage: $('damage-flash'),
    };
    this.hitTimer = 0;
    this.damageTimer = 0;
  }

  show(visible) {
    this.el.hud.classList.toggle('hidden', !visible);
  }

  update(dt, player, weapon, kills) {
    const pct = (player.health / player.maxHealth) * 100;
    this.el.healthFill.style.width = `${pct}%`;
    this.el.healthText.textContent = Math.ceil(player.health);
    this.el.weaponName.textContent = weapon.def.name;
    this.el.mag.textContent = weapon.mag;
    this.el.reserve.textContent = weapon.reserve === Infinity ? '∞' : weapon.reserve;
    this.el.reload.classList.toggle('hidden', !weapon.isReloading);
    this.el.kills.textContent = kills;

    this.hitTimer -= dt;
    if (this.hitTimer <= 0) this.el.hitmarker.classList.remove('show', 'head');
    this.damageTimer -= dt;
    if (this.damageTimer <= 0) this.el.damage.classList.remove('show');
  }

  hitMarker(headshot) {
    this.el.hitmarker.classList.add('show');
    this.el.hitmarker.classList.toggle('head', headshot);
    this.hitTimer = 0.1;
  }

  damageFlash() {
    this.el.damage.classList.add('show');
    this.damageTimer = 0.12;
  }
}
