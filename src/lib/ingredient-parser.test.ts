import { describe, it, expect } from "vitest";
import { parseIngredient, formatQuantity, coreNameKey } from "./ingredient-parser";

describe("parseIngredient — quantities and units", () => {
  it("parses attached units", () => {
    const p = parseIngredient("200g pasta");
    expect(p.quantity).toBe(200);
    expect(p.unit).toBe("g");
    expect(p.unitRaw).toBe("g");
    expect(p.name).toBe("pasta");
  });

  it("parses abbreviated units", () => {
    const p = parseIngredient("1/2 tsp salt");
    expect(p.quantity).toBe(0.5);
    expect(p.unit).toBe("tsp");
  });

  it("canonicalises spelled-out units, preserving the raw form", () => {
    const p = parseIngredient("3 tablespoons extra-virgin olive oil");
    expect(p.quantity).toBe(3);
    expect(p.unit).toBe("tbsp");
    expect(p.unitRaw).toBe("tablespoons");
    expect(p.name).toBe("extra-virgin olive oil");
  });

  it("canonicalises singular spelled-out units", () => {
    const p = parseIngredient("1 tablespoon maple syrup");
    expect(p.unit).toBe("tbsp");
    expect(p.name).toBe("maple syrup");
  });

  it("parses mixed numbers with spelled-out units", () => {
    const p = parseIngredient("1 1/2 teaspoons garam masala");
    expect(p.quantity).toBe(1.5);
    expect(p.unit).toBe("tsp");
    expect(p.name).toBe("garam masala");
  });

  it("parses pounds and ounces", () => {
    expect(parseIngredient("2 lbs tomatillos").unit).toBe("lb");
    expect(parseIngredient("3 pounds chicken thighs").unit).toBe("lb");
    expect(parseIngredient("5 ounces pitted green olives").unit).toBe("oz");
    expect(parseIngredient("1 pint cherry tomatoes").unit).toBe("pint");
  });

  it("parses unicode fractions", () => {
    expect(parseIngredient("½ cup rice").quantity).toBe(0.5);
    expect(parseIngredient("1½ cups rice").quantity).toBe(1.5);
  });

  it("parses ranges", () => {
    const p = parseIngredient("1/4 to 1/2 teaspoon Aleppo pepper");
    expect(p.quantity).toBe(0.25);
    expect(p.quantityMax).toBe(0.5);
    expect(p.unit).toBe("tsp");
    expect(p.name).toBe("Aleppo pepper");
  });

  it("parses bare counts", () => {
    const p = parseIngredient("8 large eggs");
    expect(p.quantity).toBe(8);
    expect(p.unit).toBe("");
    expect(p.name).toBe("large eggs");
  });

  it("handles no quantity", () => {
    const p = parseIngredient("Freshly ground black pepper");
    expect(p.quantity).toBeNull();
    expect(p.name).toBe("Freshly ground black pepper");
  });
});

describe("formatQuantity", () => {
  it("snaps near-integers", () => {
    expect(formatQuantity(10.04)).toBe("10");
    expect(formatQuantity(3)).toBe("3");
  });
  it("renders common fractions", () => {
    expect(formatQuantity(0.5)).toBe("1/2");
    expect(formatQuantity(1.5)).toBe("1 1/2");
    expect(formatQuantity(0.25)).toBe("1/4");
    expect(formatQuantity(0.75)).toBe("3/4");
  });
  it("falls back to two decimals", () => {
    expect(formatQuantity(0.1)).toBe("0.1");
    expect(formatQuantity(1.33)).toBe("1 1/3");
    expect(formatQuantity(2.6)).toBe("2.6");
  });
});

describe("parseIngredient — notes and noise parens", () => {
  it("splits prep notes at a comma followed by a prep word", () => {
    const p = parseIngredient("1 large yellow onion, finely diced");
    expect(p.name).toBe("large yellow onion");
    expect(p.note).toBe("finely diced");
  });

  it("keeps commas that are part of the name", () => {
    const p = parseIngredient("8 bone-in, skin-on chicken thighs");
    expect(p.name).toBe("bone-in, skin-on chicken thighs");
    expect(p.note).toBe("");
  });

  it("splits multi-clause notes at the first prep word", () => {
    const p = parseIngredient("2 red bell peppers, cored, seeded, and thinly sliced");
    expect(p.name).toBe("red bell peppers");
    expect(p.note).toBe("cored, seeded, and thinly sliced");
  });

  it("treats 'plus …' as a note", () => {
    const p = parseIngredient("3 tablespoons extra-virgin olive oil, plus more for finishing");
    expect(p.name).toBe("extra-virgin olive oil");
    expect(p.note).toBe("plus more for finishing");
  });

  it("strips non-quantity parens from the name", () => {
    const p = parseIngredient("1/2 teaspoon red pepper flakes (optional)");
    expect(p.name).toBe("red pepper flakes");
  });

  it("strips 'such as' parens", () => {
    const p = parseIngredient("3 tablespoons neutral oil (such as avocado or grapeseed), divided");
    expect(p.name).toBe("neutral oil");
    expect(p.note).toBe("divided");
  });

  it("strips alternative parens", () => {
    const p = parseIngredient("1 1/2 teaspoons Diamond Crystal kosher salt (or 3/4 teaspoon table salt), divided");
    expect(p.name).toBe("Diamond Crystal kosher salt");
    expect(p.note).toBe("divided");
  });
});

describe("parseIngredient — parenthetical quantities", () => {
  it("captures package size for count + paren + container noun", () => {
    const p = parseIngredient("1 (28 oz / 800 g) can crushed tomatoes");
    expect(p.quantity).toBe(1);
    expect(p.unit).toBe("");
    expect(p.packageSize).toEqual({ value: 800, unit: "g" });
    expect(p.name).toBe("can crushed tomatoes");
  });

  it("captures ml package sizes", () => {
    const p = parseIngredient("1 (14 oz / 400 ml) can full-fat coconut milk");
    expect(p.packageSize).toEqual({ value: 400, unit: "ml" });
  });

  it("multiplies later: two cans", () => {
    const p = parseIngredient("2 (15 oz / 425 g) cans butter beans, drained and rinsed");
    expect(p.quantity).toBe(2);
    expect(p.packageSize).toEqual({ value: 425, unit: "g" });
    expect(p.note).toBe("drained and rinsed");
  });

  it("treats a paren after qty+unit as a restatement, preferring metric", () => {
    const p = parseIngredient("1/2 cup (120 ml) low-sodium chicken or vegetable broth");
    expect(p.unit).toBe("cup");
    expect(p.restatement).toEqual({ value: 120, unit: "ml" });
  });

  it("converts imperial-only restatements to metric", () => {
    const p = parseIngredient("2 tablespoons (about 3/4 ounce; 26 g) light brown sugar");
    expect(p.restatement).toEqual({ value: 26, unit: "g" });
  });

  it("captures grams restatements", () => {
    const p = parseIngredient("1 1/2 lb (680 g) broccoli, cut into bite-sized florets");
    expect(p.restatement).toEqual({ value: 680, unit: "g" });
    expect(p.note).toBe("cut into bite-sized florets");
  });

  it("captures total weight on counted lines", () => {
    const p = parseIngredient("8 bone-in, skin-on chicken thighs (~2.5 lb / 1.1 kg)");
    expect(p.totalWeight).toEqual({ grams: 1100, each: false });
    expect(p.name).toBe("bone-in, skin-on chicken thighs");
  });

  it("marks per-piece weights with each", () => {
    const p = parseIngredient("4 salmon fillets (skin-on, ~6 oz / 170 g each)");
    expect(p.totalWeight).toEqual({ grams: 170, each: true });
    expect(p.name).toBe("salmon fillets");
  });

  it("reads mid-line count-plus-weight parens", () => {
    const p = parseIngredient("3 pounds bone-in, skin-on chicken thighs (8 thighs; 1.3kg)");
    expect(p.unit).toBe("lb");
    expect(p.restatement).toEqual({ value: 1300, unit: "g" });
  });

  it("ignores parens with non-weight measurements", () => {
    const p = parseIngredient("1 (1-inch / 2.5 cm) piece fresh ginger, finely grated");
    expect(p.packageSize).toBeNull();
    expect(p.name).toBe("piece fresh ginger");
    expect(p.note).toBe("finely grated");
  });

  it("handles a pint with approximate restatement", () => {
    const p = parseIngredient("1 pint (~10 oz / 285 g) cherry tomatoes, halved");
    expect(p.unit).toBe("pint");
    expect(p.restatement).toEqual({ value: 285, unit: "g" });
    expect(p.name).toBe("cherry tomatoes");
  });
});

describe("coreNameKey", () => {
  it("strips piece nouns and size adjectives", () => {
    expect(coreNameKey("4 medium cloves garlic, thinly sliced")).toBe("garlic");
    expect(coreNameKey("5 cloves garlic")).toBe("garlic");
    expect(coreNameKey("4 medium cloves garlic, finely grated or minced")).toBe("garlic");
    expect(coreNameKey("1 medium head cauliflower (~2 lb / 900 g), cut into florets")).toBe("cauliflower");
    expect(coreNameKey("2 cobs of corn")).toBe("corn");
  });

  it("keeps culinary descriptors", () => {
    expect(coreNameKey("1 tablespoon dried oregano")).toBe("dried oregano");
    expect(coreNameKey("1 (28 oz / 800 g) can crushed tomatoes")).toBe("crushed tomato");
    expect(coreNameKey("5 oz (140 g) baby spinach")).toBe("baby spinach");
    expect(coreNameKey("3 tablespoons extra-virgin olive oil, divided")).toBe("extra-virgin olive oil");
  });

  it("normalises dry to dried", () => {
    expect(coreNameKey("1 tablespoon dry oregano (see notes)")).toBe("dried oregano");
  });

  it("takes the first alternative at or", () => {
    expect(coreNameKey("3 cups (720 ml) water or low-sodium vegetable broth")).toBe("water");
    expect(coreNameKey("1 1/2 lb (680 g) flank steak or sirloin, sliced")).toBe("flank steak");
  });

  it("singularises the final word, irregulars included", () => {
    expect(coreNameKey("2 lbs tomatillos")).toBe("tomatillo");
    expect(coreNameKey("3 medium tomatoes")).toBe("tomato");
    expect(coreNameKey("2 bay leaves")).toBe("bay leaf");
    expect(coreNameKey("8 large eggs")).toBe("egg");
    expect(coreNameKey("Cooked rice or couscous, for serving")).toBe("cooked rice");
  });

  it("drops commas and parens from keys", () => {
    expect(coreNameKey("8 bone-in, skin-on chicken thighs (~2.5 lb / 1.1 kg)"))
      .toBe("bone-in skin-on chicken thigh");
  });

  it("shares one key across all garlic variants", () => {
    const variants = [
      "4 medium cloves garlic, finely grated or minced",
      "4 medium cloves garlic, finely grated, divided",
      "4 medium cloves garlic, thinly sliced",
      "5 cloves garlic",
      "5 medium cloves garlic, thinly sliced",
      "6 medium cloves garlic, thinly sliced",
      "3 medium cloves garlic (1/2 ounce; 15 g), finely grated",
    ];
    expect(new Set(variants.map(coreNameKey)).size).toBe(1);
  });
});

// Every distinct ingredient line currently in recipes/ (quotes stripped).
const CORPUS = [
  "1 oz parsley, roughly chopped",
  "1/2 medium yellow onion, diced",
  "1/2 oz dill, roughly chopped",
  "3 medium cloves garlic (1/2 ounce; 15 g), finely grated",
  "3 pounds bone-in, skin-on chicken thighs (8 thighs; 1.3kg)",
  "5 ounces pitted green olives (142 g; about 1 cup), such as Cerignola",
  "5 ounces prunes (142 g; about 1 cup), halved if large",
  "Cooked rice or couscous, for serving",
  "1 (1 1/2-inch / 4 cm) piece fresh ginger, finely grated (~1 tablespoon)",
  "1 (1-inch / 2.5 cm) piece fresh ginger, finely grated",
  "1 (14 oz / 400 g) can diced tomatoes",
  "1 (14 oz / 400 ml) can full-fat coconut milk",
  "1 (15 oz / 425 g) can cannellini beans, drained and rinsed",
  "1 (28 oz / 800 g) can crushed tomatoes",
  "1 1/2 cups (300 g) red lentils, rinsed until water runs clear",
  "1 1/2 lb (680 g) broccoli, cut into bite-sized florets, stems peeled and sliced",
  "1 1/2 lb (680 g) flank steak or sirloin, sliced 1/4-inch (6 mm) thick across the grain",
  "1 1/2 tablespoons low-sodium tamari, plus 3 tablespoons for the sauce, divided",
  "1 1/2 tablespoons rice vinegar",
  "1 1/2 teaspoons Diamond Crystal kosher salt (or 3/4 teaspoon table salt), divided",
  "1 1/2 teaspoons garam masala",
  "1 1/2 teaspoons ground cumin",
  "1 1/4 teaspoons Diamond Crystal kosher salt (or 3/4 teaspoon table salt), plus more to taste",
  "1 bunch cilantro",
  "1 cup (190 g) short-grain brown rice (yields ~3 cups cooked, ~3/4 cup per serving)",
  "1 fresh green chili, finely chopped (optional; seed for less heat)",
  "1 large egg",
  "1 large yellow onion, finely diced",
  "1 lemon, zested then halved (juice one half, cut the other into wedges for serving)",
  "1 medium head cauliflower (~2 lb / 900 g), cut into florets",
  "1 pint (~10 oz / 285 g) cherry tomatoes, halved",
  "1 small bunch lacinato (Tuscan) kale (~6 oz / 170 g), stemmed and roughly chopped",
  "1 tablespoon dried oregano",
  "1 tablespoon dry oregano (see notes)",
  "1 tablespoon maple syrup",
  "1 tablespoon oyster sauce (gluten-free if needed) or hoisin",
  "1 tablespoon toasted sesame oil",
  "1 tablespoon toasted sesame seeds",
  "1 teaspoon ground cumin",
  "1 teaspoon ground turmeric",
  "1 teaspoon toasted sesame oil",
  "1 tsp dried oregano",
  "1 tsp dried thyme",
  "1 tsp kosher salt",
  "1 whole chicken",
  "1/2 cup (120 ml) low-sodium chicken or vegetable broth",
  "1/2 cup (~75 g) pitted Kalamata olives",
  "1/2 teaspoon Diamond Crystal kosher salt, plus more to taste",
  "1/2 teaspoon ground coriander",
  "1/2 teaspoon red pepper flakes (optional)",
  "1/2 tsp black pepper",
  "1/4 cup (60 ml) dry white wine or low-sodium chicken broth",
  "1/4 cup (60 ml) extra-virgin olive oil",
  "1/4 cup (60 ml) extra-virgin olive oil, divided",
  "1/4 cup (60 ml) red wine vinegar",
  "1/4 to 1/2 teaspoon Aleppo pepper or red pepper flakes",
  "2 (14 oz / 400 g) blocks extra-firm tofu",
  "2 (15 oz / 425 g) cans butter beans, drained and rinsed",
  "2 Jalapeno peppers",
  "2 Serrano peppers",
  "2 bay leaves",
  "2 cobs of corn",
  "2 lbs tomatillos",
  "2 oz (55 g) feta, crumbled (optional)",
  "2 red bell peppers, cored, seeded, and thinly sliced",
  "2 scallions, thinly sliced",
  "2 tablespoons (30 ml) water",
  "2 tablespoons (about 3/4 ounce; 26 g) light brown sugar",
  "2 tablespoons coconut oil or neutral oil",
  "2 tablespoons low-sodium tamari or soy sauce",
  "2 tablespoons rice vinegar",
  "2 tablespoons rose harissa paste (or 1 tablespoon harissa + 1 teaspoon tomato paste)",
  "2 tablespoons tomato paste",
  "2 teaspoons cornstarch, plus 1 1/2 teaspoons for the sauce, divided",
  "2 teaspoons sweet smoked paprika",
  "2 white onions",
  "3 cups (720 ml) water or low-sodium vegetable broth",
  "3 medium tomatoes",
  "3 oz (85 g) feta, crumbled",
  "3 scallions, thinly sliced (white and green parts kept separate)",
  "3 tablespoons cornstarch",
  "3 tablespoons extra-virgin olive oil, divided",
  "3 tablespoons extra-virgin olive oil, plus more for finishing",
  "3 tablespoons gochujang",
  "3 tablespoons neutral oil (such as avocado or grapeseed), divided",
  "3 tablespoons neutral oil (such as avocado), divided",
  "3/4 teaspoon Diamond Crystal kosher salt (or 1/2 teaspoon table salt), plus more to taste",
  "4 cup neutral oil (for frying)",
  "4 medium cloves garlic, finely grated or minced",
  "4 medium cloves garlic, finely grated, divided",
  "4 medium cloves garlic, thinly sliced",
  "4 oz feta cheese",
  "4 salmon fillets (skin-on, ~6 oz / 170 g each)",
  "5 cloves garlic",
  "5 medium cloves garlic, thinly sliced",
  "5 oz (140 g) baby spinach",
  "6 heads baby bok choy (~1 lb / 450 g total), halved lengthwise",
  "6 medium cloves garlic, thinly sliced",
  "8 bone-in, skin-on chicken thighs (~2.5 lb / 1.1 kg)",
  "8 large eggs",
  "Freshly ground black pepper",
  "Small handful fresh parsley, roughly chopped",
  "3 tablespoons rice vinegar",
  "3 tablespoons gochujang (Korean chili paste)",
];

describe("corpus invariants", () => {
  it("parses every real ingredient line", () => {
    for (const line of CORPUS) {
      const p = parseIngredient(line);
      expect(p.original, line).toBe(line);
      if (/^\d/.test(line)) {
        expect(p.quantity, line).not.toBeNull();
      }
      const key = coreNameKey(p);
      expect(key.length, line).toBeGreaterThan(0);
      expect(key, line).not.toMatch(/[(),]/);
    }
  });
});
