// THE BADGE SHOP · catalog registry.
//
// HOW TO GROW THE SHOP
//   • New badge in an existing collection → add it to that collection's file in ./collections.
//   • New collection → create ./collections/<name>.tsx exporting a CollectionModule and add it
//     to COLLECTION_MODULES below (order = order in the shop).
//   • "Próximamente": status 'coming-soon' on a badge, or on a whole collection.
//   • Never reuse or rename an id: purchases are stored by badge id.
// Tokens, purchases and MY BADGE COLLECTION read only what this file exports.
import { america } from './collections/america';
import type { BadgeCollection, BadgeStatus, CatalogBadge, CollectionModule } from './types';

const COLLECTION_MODULES: CollectionModule[] = [america];

export interface CatalogProblem {
  kind: 'duplicate-badge' | 'duplicate-collection' | 'unknown-collection' | 'bad-price' | 'missing-art' | 'duplicate-number';
  id: string;
}

/** Builds the catalog from collection modules and reports any data problem. Pure: easy to test. */
export function buildCatalog(modules: CollectionModule[]) {
  const problems: CatalogProblem[] = [];
  const collections: BadgeCollection[] = [];
  const badges: CatalogBadge[] = [];
  const colIds = new Set<string>();
  const badgeIds = new Set<string>();
  for (const m of modules) {
    if (colIds.has(m.collection.id)) {
      problems.push({ kind: 'duplicate-collection', id: m.collection.id });
      continue;
    }
    colIds.add(m.collection.id);
    collections.push(m.collection);
    const numbers = new Set<number>();
    for (const b of m.badges) {
      if (badgeIds.has(b.id)) {
        problems.push({ kind: 'duplicate-badge', id: b.id });
        continue; // the first definition wins; a duplicate is never sold twice
      }
      if (b.collection !== m.collection.id) problems.push({ kind: 'unknown-collection', id: b.id });
      if (numbers.has(b.no)) problems.push({ kind: 'duplicate-number', id: b.id });
      if (!b.art) problems.push({ kind: 'missing-art', id: b.id });
      const price = b.price ?? m.collection.price;
      if (!Number.isInteger(price) || price <= 0) {
        problems.push({ kind: 'bad-price', id: b.id });
        continue;
      }
      badgeIds.add(b.id);
      numbers.add(b.no);
      badges.push({
        ...b,
        collection: m.collection.id,
        price,
        status: b.status ?? m.collection.status ?? 'available',
        shape: b.shape ?? 'shield',
        finish: b.finish ?? 'patch',
      });
    }
  }
  return { collections, badges, byId: Object.fromEntries(badges.map((b) => [b.id, b])) as Record<string, CatalogBadge>, problems };
}

const catalog = buildCatalog(COLLECTION_MODULES);
if (catalog.problems.length && import.meta.env?.DEV) console.warn('[badges] catalog problems', catalog.problems);

export const COLLECTIONS = catalog.collections;
export const BADGES = catalog.badges;
export const BADGE_BY_ID = catalog.byId;
export const CATALOG_PROBLEMS = catalog.problems;
export const badgesOf = (collectionId: string) => BADGES.filter((b) => b.collection === collectionId);

export type PurchaseCheck = 'ok' | 'owned' | 'funds' | 'unknown' | 'coming-soon' | 'retired';

/** The single rule for buying a badge (used by the store and the UI). */
export function canBuy(badge: CatalogBadge | undefined, owned: Record<string, number>, tokens: number): PurchaseCheck {
  if (!badge) return 'unknown';
  if (owned[badge.id]) return 'owned';
  if (badge.status === 'coming-soon') return 'coming-soon';
  if (badge.status === 'retired') return 'retired';
  if (tokens < badge.price) return 'funds';
  return 'ok';
}

/** Badges shown in the shop: everything except retired ones nobody here owns. */
export const visibleInShop = (b: CatalogBadge, owned: Record<string, number>) => b.status !== 'retired' || !!owned[b.id];

export const STATUS_LABEL: Record<BadgeStatus, string> = { available: 'Disponible', 'coming-soon': 'Próximamente', retired: 'Retirado' };
