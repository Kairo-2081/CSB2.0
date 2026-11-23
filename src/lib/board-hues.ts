/**
 * Every board has its own hue. The page, its sidebar icon, its dashboard
 * tile and its headline accent all use it, so colour tells you where you are.
 * Saffron stays the colour of actions (buttons) everywhere.
 */
export const BOARD_HUES: Record<string, number> = {
  "/dashboard": 174,
  "/notices": 214,
  "/lost-found": 174,
  "/lend-borrow": 262,
  "/marketplace": 32,
  "/complaints": 12,
  "/bicycles": 142,
  "/blood-donation": 352,
  "/animal-welfare": 88,
  "/faculty-suggestions": 236,
  "/students": 194,
  "/profile": 318,
  "/admin": 174,
  "/central-admin": 200,
};

/** Tile colours for lists of items that have no board of their own. */
export const TILE_HUES = [32, 214, 174, 262, 12, 142];

export const hueFor = (path: string) => BOARD_HUES[path] ?? 174;
