export interface CookLogEntry {
  date: string;
  notes: string;
}

export interface RecipeFrontmatter {
  title: string;
  slug: string;
  tags: string[];
  rating?: number;
  servings?: number;
  prep_time?: number;
  cook_time?: number;
  image?: string;
  ingredients: string[];
  cook_log: CookLogEntry[];
  created: string;
  updated: string;
}

export interface Recipe extends RecipeFrontmatter {
  body: string;
}

export type RecipeIndex = RecipeFrontmatter[];
