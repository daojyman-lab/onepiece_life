import { describe, expect, it } from 'vitest';
import { NEW_TRAITS, TRAIT_BY_ID } from '../../src/data/traits';
import { TALENTS } from '../../src/shared/data/talents';
import { STRENGTHS } from '../../src/data/strengths';

describe('new trait catalogue', () => {
  it('contains 100 distinct new names and IDs', () => {
    expect(NEW_TRAITS).toHaveLength(100);
    expect(new Set(NEW_TRAITS.map(t => t.id)).size).toBe(100);
    expect(new Set(NEW_TRAITS.map(t => t.name)).size).toBe(100);
    const oldNames = new Set([...TALENTS, ...STRENGTHS].map(t => t.name));
    for (const trait of NEW_TRAITS) {
      expect(oldNames.has(trait.name), trait.name).toBe(false);
      expect(TRAIT_BY_ID[trait.id]).toBe(trait);
    }
  });
  it('gives every trait a real effect and every earned trait a repeated route', () => {
    for (const trait of NEW_TRAITS) {
      expect(trait.weight, trait.name).toBeGreaterThan(0);
      expect(trait.desc.length, trait.name).toBeGreaterThan(3);
      expect(Object.keys(trait.effects).filter(k => k !== 'condition').length, trait.name).toBeGreaterThan(0);
      if (!trait.born) expect(trait.earn, trait.name).toBeDefined();
      if (trait.earn) expect(trait.earn.count, trait.name).toBeGreaterThanOrEqual(3);
    }
    expect(NEW_TRAITS.filter(t => t.born)).toHaveLength(60);
  });
  it('keeps requested trade and appetite upgrades and inquiry critical hits', () => {
    expect(TRAIT_BY_ID.negotiator.effects.discount).toBe(.05);
    expect(TRAIT_BY_ID.silverTongue.effects.discount).toBe(.1);
    expect(TRAIT_BY_ID.silverTongue.family).toBe(TRAIT_BY_ID.negotiator.family);
    expect(TRAIT_BY_ID.gourmand.family).toBe(TRAIT_BY_ID.bigEater.family);
    expect(TRAIT_BY_ID.knowledge.earn).toMatchObject({ kind: 'value', key: 'inquiry' });
    expect(TRAIT_BY_ID.knowledge.effects.mods?.crit).toBe(.05);
    expect(TRAIT_BY_ID.coordination.effects.coordination).toBe(.1);
  });
});

it('uses reachable trigger keys and genuinely non-neutral effect values', () => {
  const valueKeys = new Set(['justice', 'greed', 'ambition', 'romance', 'inquiry', 'loyalty', 'freedom', 'dominion', 'peace']);
  const activityKeys = new Set(['train', 'work', 'study', 'roam', 'family', 'rest']);
  const seas = new Set(['east', 'west', 'north', 'south', 'gl_entry', 'gl_first', 'sabaody', 'nw_first', 'nw_late']);
  const multipliers = new Set(['income', 'healing', 'injury', 'illness', 'oldAge', 'danger']);
  for (const t of NEW_TRAITS) {
    const real = Object.entries(t.effects).some(([key, value]) => {
      if (key === 'condition') return false;
      if (typeof value === 'number') return Number.isFinite(value) && value !== (multipliers.has(key) ? 1 : 0);
      return value && Object.values(value).some(v => typeof v === 'number' && Number.isFinite(v) && v !== 0);
    });
    expect(real, t.name).toBe(true);
    if (!t.earn) continue;
    expect(Number.isInteger(t.earn.count), t.name).toBe(true);
    if (t.earn.kind === 'value') expect(valueKeys.has(t.earn.key!), t.name).toBe(true);
    else if (t.earn.kind === 'activity') expect(activityKeys.has(t.earn.key!), t.name).toBe(true);
    else if (t.earn.kind === 'win' && t.earn.key) expect(seas.has(t.earn.key), t.name).toBe(true);
    else if (t.earn.kind === 'master' && t.earn.key) expect(['fist', 'sword', 'gun', 'observation', 'armament', 'conqueror', 'fruit']).toContain(t.earn.key);
    else expect(t.earn.key, t.name).toBeUndefined();
  }
});
