// Adds a sample set of rooms through the API (as the Keycloak "admin" test user).
// Safe to run again: room numbers that already exist are skipped.
//   node scripts/seed-rooms.mjs
const GATEWAY = process.env.GATEWAY ?? 'http://localhost:8180';
const KEYCLOAK = process.env.KEYCLOAK ?? 'http://localhost:9999';

const ROOMS = [
  // numero, type, prix (DT/nuit), capacite, etage, superficie (m²), équipements
  ['101', 'SINGLE', 180, 1, 1, 18, { wifi: true, climatisation: true, television: true }],
  ['102', 'DOUBLE', 260, 2, 1, 24, { wifi: true, climatisation: true, television: true }],
  ['103', 'DOUBLE', 260, 2, 1, 24, { wifi: true, climatisation: true, television: true }],
  ['104', 'TWIN', 250, 2, 1, 24, { wifi: true, climatisation: true, television: true }],
  ['201', 'DOUBLE', 320, 2, 2, 28, { wifi: true, climatisation: true, television: true, minibar: true, balcon: true, vueMer: true }],
  ['202', 'DOUBLE', 320, 2, 2, 28, { wifi: true, climatisation: true, television: true, minibar: true, balcon: true, vueMer: true }],
  ['203', 'FAMILY', 420, 4, 2, 38, { wifi: true, climatisation: true, television: true, minibar: true }],
  ['204', 'TWIN', 250, 2, 2, 24, { wifi: true, climatisation: true, television: true }],
  ['301', 'SUITE', 650, 3, 3, 55, { wifi: true, climatisation: true, television: true, minibar: true, balcon: true, vueMer: true }],
  ['302', 'SUITE', 650, 3, 3, 55, { wifi: true, climatisation: true, television: true, minibar: true, balcon: true, vueMer: true }],
  ['303', 'FAMILY', 420, 4, 3, 38, { wifi: true, climatisation: true, television: true, minibar: true, balcon: true }],
  ['304', 'SINGLE', 180, 1, 3, 18, { wifi: true, climatisation: true, television: true }],
];

const DESCRIPTIONS = {
  SINGLE: 'Chambre simple au calme, lit 1 place.',
  DOUBLE: 'Chambre double, lit 2 places.',
  TWIN: 'Chambre avec deux lits séparés.',
  FAMILY: 'Chambre familiale, un lit double et deux lits simples.',
  SUITE: 'Suite avec salon séparé.',
};

const tokenRes = await fetch(`${KEYCLOAK}/realms/hotel/protocol/openid-connect/token`, {
  method: 'POST',
  body: new URLSearchParams({ grant_type: 'password', client_id: 'user-service', username: 'admin', password: 'admin' }),
});
if (!tokenRes.ok) throw new Error(`Login failed (${tokenRes.status}) — is the stack running?`);
const { access_token } = await tokenRes.json();

const existing = new Set((await (await fetch(`${GATEWAY}/api/chambres`)).json()).map(c => c.numero));

for (const [numero, type, prix, capacite, etage, superficie, equipements] of ROOMS) {
  if (existing.has(numero)) { console.log(`skip  ${numero} (exists)`); continue; }
  const chambre = { numero, type, prix, capacite, etage, superficie, statut: 'disponible', description: DESCRIPTIONS[type], ...equipements };
  const form = new FormData();
  form.append('chambre', new Blob([JSON.stringify(chambre)], { type: 'application/json' }));
  const res = await fetch(`${GATEWAY}/api/chambres`, { method: 'POST', headers: { Authorization: `Bearer ${access_token}` }, body: form });
  console.log(`${res.ok ? 'added' : `error ${res.status}`}  ${numero} ${type} ${prix} DT`);
}
