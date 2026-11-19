import { tryReach } from '../tests/game/specialReach';
declare const process: { argv: string[] };

const seed = Number(process.argv[2]) || 50073;
const found = tryReach({ turning: 'ep_alabasta_p6', index: 3 }, seed, 'sky', false, (s) => {
  console.log(JSON.stringify({ seed, age: s.age, place: s.hero.island, standing: s.hero.standing,
    pending: s.pending, values: s.values,
    chapters: s.tried.filter((key) => /alabasta|sea_alabasta|home_sky/.test(key)),
    cause: s.ended, alive: s.hero.alive }, null, 2));
});
console.log(JSON.stringify({ found }));
