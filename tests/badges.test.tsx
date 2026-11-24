// THE BADGE SHOP catalog rules (run: npm run test:badges).
import React from 'react';
import { BADGES, COLLECTIONS, CATALOG_PROBLEMS, buildCatalog, canBuy, visibleInShop } from '../src/badges/catalog';
import type { CollectionModule } from '../src/badges/types';

let failed = 0;
const ok = (name: string, cond: boolean, extra = '') => {
  if (!cond) failed++;
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${extra ? `  (${extra})` : ''}`);
};
const art = <g />;

// 1. The real catalog
ok('El catálogo real no tiene problemas', CATALOG_PROBLEMS.length === 0, JSON.stringify(CATALOG_PROBLEMS));
ok('AMERICA COLLECTION: 10 escudos disponibles a 10 tokens', BADGES.filter((b) => b.collection === 'america' && b.status === 'available' && b.price === 10).length === 10);
ok('Ids únicos en el catálogo real', new Set(BADGES.map((b) => b.id)).size === BADGES.length);
ok('Cada escudo tiene nombre, colección, descripción, ilustración, precio y estado', BADGES.every((b) => b.name && COLLECTIONS.some((c) => c.id === b.collection) && b.description && b.art && b.price > 0 && b.status));

// 2. Growing the catalog with data only
const america = { collection: { id: 'america', name: 'AMERICA', tagline: '', description: '', price: 10 }, badges: [{ id: 'new-york', no: 1, name: 'NEW YORK', collection: 'america', subject: '', description: 'x', art }] } as CollectionModule;
const westCoast: CollectionModule = {
  collection: { id: 'west-coast', name: 'WEST COAST', tagline: '', description: '', price: 15 },
  badges: [
    { id: 'malibu', no: 1, name: 'MALIBU', collection: 'west-coast', subject: '', description: 'x', art },
    { id: 'seattle', no: 2, name: 'SEATTLE', collection: 'west-coast', subject: '', description: 'x', art, price: 12 },
    { id: 'portland', no: 3, name: 'PORTLAND', collection: 'west-coast', subject: '', description: 'x', art, status: 'coming-soon' },
    { id: 'old-route', no: 4, name: 'OLD', collection: 'west-coast', subject: '', description: 'x', art, status: 'retired' },
  ],
};
const soonCol: CollectionModule = { collection: { id: 'icons', name: 'ICONS', tagline: '', description: '', price: 10, status: 'coming-soon' }, badges: [{ id: 'icon-1', no: 1, name: 'ONE', collection: 'icons', subject: '', description: 'x', art }] };
const grown = buildCatalog([america, westCoast, soonCol]);
ok('Una colección nueva aparece sin cambiar la lógica', grown.collections.length === 3 && grown.badges.length === 6 && grown.problems.length === 0);
ok('El precio de la colección se aplica por defecto y el del escudo lo sustituye', grown.byId.malibu.price === 15 && grown.byId.seattle.price === 12);
ok('"Próximamente" a nivel de escudo y de colección', grown.byId.portland.status === 'coming-soon' && grown.byId['icon-1'].status === 'coming-soon');

// 3. Purchases
const owned: Record<string, number> = { 'new-york': 1 };
ok('Las compras anteriores siguen siendo válidas al añadir colecciones', !!grown.byId['new-york'] && canBuy(grown.byId['new-york'], owned, 99) === 'owned');
ok('Un escudo próximamente no se puede comprar', canBuy(grown.byId.portland, {}, 999) === 'coming-soon' && canBuy(grown.byId['icon-1'], {}, 999) === 'coming-soon');
ok('Un escudo retirado no se vende', canBuy(grown.byId['old-route'], {}, 999) === 'retired');
ok('El retirado solo se muestra a quien ya lo tiene', !visibleInShop(grown.byId['old-route'], {}) && visibleInShop(grown.byId['old-route'], { 'old-route': 1 }));
ok('Saldo insuficiente según el precio de cada escudo', canBuy(grown.byId.malibu, {}, 14) === 'funds' && canBuy(grown.byId.malibu, {}, 15) === 'ok' && canBuy(grown.byId.seattle, {}, 12) === 'ok');
ok('Un escudo que no existe no se puede comprar', canBuy(undefined, {}, 999) === 'unknown');

// 4. Data mistakes are caught (and never produce duplicate sales)
const dup = buildCatalog([america, { ...westCoast, badges: [...westCoast.badges, { id: 'new-york', no: 9, name: 'COPY', collection: 'west-coast', subject: '', description: 'x', art }] }, america]);
ok('Ids de escudo duplicados se detectan y no se venden dos veces', dup.problems.some((p) => p.kind === 'duplicate-badge' && p.id === 'new-york') && dup.badges.filter((b) => b.id === 'new-york').length === 1);
ok('Colecciones duplicadas se detectan', dup.problems.some((p) => p.kind === 'duplicate-collection' && p.id === 'america'));
const bad = buildCatalog([{ collection: { id: 'x', name: 'X', tagline: '', description: '', price: 0 }, badges: [{ id: 'free', no: 1, name: 'FREE', collection: 'x', subject: '', description: 'x', art }, { id: 'wrong-col', no: 2, name: 'W', collection: 'nope', subject: '', description: 'x', art, price: 3 }] }]);
ok('Precios inválidos y colecciones mal escritas se detectan', bad.problems.some((p) => p.kind === 'bad-price') && bad.problems.some((p) => p.kind === 'unknown-collection'));

console.log(failed ? `\n${failed} FAILED` : '\nAll badge catalog checks passed');
process.exit(failed ? 1 : 0);
