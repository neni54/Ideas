// THE BADGE SHOP · catalog types. Content lives in src/badges/collections/*; the shop, the
// purchases and MY BADGE COLLECTION only read these structures, so adding badges or whole
// collections never requires touching that logic.
import type { ReactNode } from 'react';

/**
 * available   → on sale.
 * coming-soon → visible in the shop as "Próximamente", cannot be bought yet.
 * retired     → no longer sold; still shown to whoever already owns it.
 */
export type BadgeStatus = 'available' | 'coming-soon' | 'retired';

export interface BadgeCollection {
  /** Unique, permanent id (never reuse or rename: purchases point to badge ids, not to this). */
  id: string;
  name: string;
  /** One line in English, editorial. */
  tagline: string;
  /** Spanish description shown in the shop. */
  description: string;
  /** Default price for its badges (each badge can override it). */
  price: number;
  /** Default status for its badges (e.g. a whole collection "coming-soon"). */
  status?: BadgeStatus;
}

export interface Badge {
  /** Unique, permanent id across ALL collections (it is what a purchase stores). */
  id: string;
  name: string;
  /** Id of its BadgeCollection. */
  collection: string;
  /** Number inside its collection (shown as No. 01). */
  no: number;
  /** What it depicts (Spanish, short). */
  subject: string;
  /** Description for the detail view (Spanish). */
  description: string;
  /** Illustration drawn in a 120 × 120 box (SVG elements). */
  art: ReactNode;
  /** Price in tokens. Defaults to the collection price. */
  price?: number;
  status?: BadgeStatus;
  shape?: 'shield' | 'circle' | 'arch';
  finish?: 'patch' | 'pin';
}

/** A badge with every default resolved (what the app uses). */
export interface CatalogBadge extends Omit<Badge, 'price' | 'status' | 'shape' | 'finish'> {
  price: number;
  status: BadgeStatus;
  shape: 'shield' | 'circle' | 'arch';
  finish: 'patch' | 'pin';
}

export interface CollectionModule {
  collection: BadgeCollection;
  badges: Badge[];
}
