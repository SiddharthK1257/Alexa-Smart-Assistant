export interface RecipeAllergenInfo {
  safetyRating: 'Safe for All' | 'Contains Common Allergens' | 'Special Dietary Caution';
  allergensPresent: string[]; // e.g. ['Dairy', 'Gluten', 'Peanuts', 'Tree Nuts', 'Eggs', 'Soy', 'Shellfish', 'Sesame']
  isSafeFor: string[]; // e.g. ['Nut-Allergy Sufferers', 'Vegetarians', 'Children', 'School Lunches']
  cautionGroups: string[]; // e.g. ['Celiac / Gluten-Sensitive Individuals', 'Lactose-Intolerant Individuals']
  safetyNotice: string;
  populationWarnings?: {
    pregnancyCaution?: string;
    toddlerCaution?: string;
    diabeticCaution?: string;
  };
}

export interface KitchenRecipe {
  id: string;
  title: string;
  description: string;
  cuisine: string;
  prepTime: string;
  cookTime: string;
  totalTime: string;
  servings: number;
  caloriesPerServing: number;
  difficulty: 'Easy' | 'Intermediate' | 'Advanced';
  imageUrl: string;
  ingredients: string[];
  instructions: string[];
  dietaryTags: string[]; // e.g. ['Vegetarian', 'Nut-Free', 'High-Protein']
  allergenSafety: RecipeAllergenInfo;
}

export const RECIPE_DATABASE: KitchenRecipe[] = [
  {
    id: 'recipe-creamy-tuscan-salmon',
    title: 'Pan-Seared Tuscan Garlic Butter Salmon',
    description: 'Crisp salmon fillets nestled in a silky garlic, sundried tomato, baby spinach, and parmesan cream sauce.',
    cuisine: 'Italian-Mediterranean',
    prepTime: '10 mins',
    cookTime: '15 mins',
    totalTime: '25 mins',
    servings: 4,
    caloriesPerServing: 480,
    difficulty: 'Easy',
    imageUrl: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=800&auto=format&fit=crop&q=80',
    ingredients: [
      '4 wild-caught salmon fillets (6 oz each, skin-on)',
      '2 tbsp extra virgin olive oil',
      '3 cloves garlic, minced',
      '1 cup heavy whipping cream (or coconut cream for dairy-free)',
      '1/2 cup organic vegetable broth',
      '1/2 cup sun-dried tomatoes in oil, drained & sliced',
      '3 cups fresh baby spinach leaves',
      '1/2 cup freshly grated Parmesan cheese',
      '1 tbsp fresh lemon juice',
      'Sea salt and freshly cracked black pepper to taste',
    ],
    instructions: [
      'Season salmon fillets generously with sea salt and cracked pepper on both sides.',
      'Heat olive oil in a large skillet over medium-high heat. Sear salmon skin-side up for 5 minutes until golden and crisp, then flip and cook 3-4 more minutes until tender. Transfer to a warm plate.',
      'In the same skillet, reduce heat to medium. Add minced garlic and sauté for 1 minute until fragrant.',
      'Add sun-dried tomatoes and vegetable broth; reduce liquid by half for 2 minutes.',
      'Pour in heavy cream and gently bring to a light simmer. Stir in grated Parmesan until smooth and melted.',
      'Fold in baby spinach until just wilted (about 1 minute). Add fresh lemon juice.',
      'Return seared salmon fillets back to the pan, spooning the luscious sauce over each fillet. Serve immediately.',
    ],
    dietaryTags: ['Keto-Friendly', 'Low-Carb', 'Nut-Free', 'High-Omega-3'],
    allergenSafety: {
      safetyRating: 'Contains Common Allergens',
      allergensPresent: ['Fish (Salmon)', 'Dairy (Heavy Cream, Parmesan)'],
      isSafeFor: [
        'People with Peanut & Tree Nut Allergies (100% Nut-Free)',
        'Gluten-Free & Celiac Diets (Naturally zero gluten)',
        'Egg-Allergy Sufferers',
        'Keto & Low-Carb Eaters',
      ],
      cautionGroups: [
        'Individuals with Seafood/Fish allergies (Contains Finfish)',
        'Lactose-intolerant or Dairy-allergic individuals (Contains Cream & Parmesan)',
      ],
      safetyNotice:
        '⚠️ Contains Fish and Dairy. Completely safe for those with nut or gluten allergies. Can be made 100% Dairy-Free by swapping heavy cream for coconut cream and omitting Parmesan cheese.',
      populationWarnings: {
        pregnancyCaution: 'Cook salmon to an internal temperature of 145°F (63°C). Wild salmon is low in mercury and highly recommended during pregnancy for DHA.',
        toddlerCaution: 'Ensure fillets are completely debossed and cut into bite-sized flakes before serving to young children.',
        diabeticCaution: 'Low glycemic index and keto-compliant; does not cause insulin spikes.',
      },
    },
  },
  {
    id: 'recipe-thai-coconut-vegetable-curry',
    title: 'Fragrant Golden Thai Coconut Curry',
    description: 'Vibrant medley of sweet potatoes, chickpeas, bell peppers, and crisp snow peas simmered in lemongrass coconut broth.',
    cuisine: 'Thai Asian',
    prepTime: '15 mins',
    cookTime: '20 mins',
    totalTime: '35 mins',
    servings: 4,
    caloriesPerServing: 360,
    difficulty: 'Easy',
    imageUrl: 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=800&auto=format&fit=crop&q=80',
    ingredients: [
      '1 can (14 oz) full-fat coconut milk',
      '2 tbsp yellow Thai curry paste (lemongrass, turmeric, shallots)',
      '1 medium sweet potato, peeled and cubed',
      '1 can (15 oz) chickpeas, rinsed and drained',
      '1 red bell pepper, sliced',
      '1 cup fresh sugar snap peas',
      '1 cup broccoli florets',
      '1 tbsp tamari (certified gluten-free soy sauce) or coconut aminos',
      '1 tbsp maple syrup or agave nectar',
      '1 lime, juiced, plus fresh cilantro and Thai basil for garnish',
      'Jasmine rice or quinoa for serving',
    ],
    instructions: [
      'Heat 2 tablespoons of coconut milk in a heavy pot over medium heat. Whisk in Thai yellow curry paste and cook for 2 minutes until aromatic oils separate.',
      'Pour in the remainder of the coconut milk and 1/2 cup water. Bring to a gentle boil.',
      'Add sweet potato cubes and drained chickpeas. Cover and simmer for 10-12 minutes until sweet potato is fork-tender.',
      'Add sliced red bell pepper, broccoli florets, and sugar snap peas. Simmer uncovered for 4 minutes until vegetables are crisp-tender.',
      'Stir in tamari and maple syrup. Turn off heat and squeeze fresh lime juice over the pot.',
      'Ladle into warm bowls over fluffy jasmine rice. Garnish with torn Thai basil and fresh cilantro.',
    ],
    dietaryTags: ['100% Vegan', 'Dairy-Free', 'Gluten-Free', 'Nut-Free', 'Plant-Based'],
    allergenSafety: {
      safetyRating: 'Safe for All',
      allergensPresent: ['Soy (if using standard tamari; zero if using coconut aminos)'],
      isSafeFor: [
        'Vegans and Vegetarians',
        'Lactose-Intolerant individuals (100% Dairy-Free)',
        'Celiac / Gluten-Sensitive individuals (Gluten-Free certified)',
        'Peanut and Tree Nut allergy sufferers (100% Nut-Free)',
        'Children and seniors',
      ],
      cautionGroups: [
        'Soy-allergic individuals (Ensure coconut aminos are used instead of tamari)',
      ],
      safetyNotice:
        '✅ Highly safe for diverse groups! Completely free of nuts, dairy, eggs, meat, shellfish, and gluten. Ideal for family dinners, school-safe meals, and sensitive stomachs.',
      populationWarnings: {
        pregnancyCaution: 'Safe and wholesome during pregnancy. High in natural folate, beta carotene, and iron from chickpeas.',
        toddlerCaution: 'Mild warmth. For toddlers sensitive to spices, reduce curry paste to 1 teaspoon.',
        diabeticCaution: 'Complex carbohydrates and dietary fiber provide steady, sustained blood glucose levels.',
      },
    },
  },
  {
    id: 'recipe-classic-avocado-sourdough',
    title: 'Heirloom Tomato & Smashed Avocado Toast',
    description: 'Crusty artisan sourdough toast piled high with creamy Hass avocado, juicy heirloom tomatoes, microgreens, and flaky sea salt.',
    cuisine: 'California Contemporary',
    prepTime: '8 mins',
    cookTime: '3 mins',
    totalTime: '11 mins',
    servings: 2,
    caloriesPerServing: 290,
    difficulty: 'Easy',
    imageUrl: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=800&auto=format&fit=crop&q=80',
    ingredients: [
      '2 thick slices artisan sourdough bread (or gluten-free bread)',
      '2 ripe Hass avocados',
      '1 cup multi-colored heirloom cherry tomatoes, halved',
      '1 tbsp extra virgin olive oil',
      '1 tbsp freshly squeezed lemon juice',
      '1/4 cup radish microgreens or baby arugula',
      '1/2 tsp crushed red pepper flakes (optional)',
      'Flaky Maldon sea salt and freshly ground black pepper',
    ],
    instructions: [
      'Toast sourdough slices in a toaster or on a hot grill pan with a drop of olive oil until golden and crackling.',
      'In a small bowl, scoop avocado flesh. Add lemon juice, salt, and black pepper. Mash with a fork, leaving satisfying chunks.',
      'Generously slather the mashed avocado across each warm slice of toast.',
      'Arrange halved heirloom cherry tomatoes across the avocado layer.',
      'Drizzle with extra virgin olive oil, scatter fresh microgreens, and finish with a pinch of flaky sea salt and red pepper flakes.',
    ],
    dietaryTags: ['Vegan', 'Heart-Healthy', 'Nut-Free', 'Quick & Clean'],
    allergenSafety: {
      safetyRating: 'Contains Common Allergens',
      allergensPresent: ['Gluten / Wheat (Sourdough bread)'],
      isSafeFor: [
        'Nut-Allergy Sufferers (100% Peanut & Tree-Nut Free)',
        'Lactose-Intolerant / Dairy-Allergic (100% Dairy-Free)',
        'Egg-Free diets',
        'Vegans & Vegetarians',
      ],
      cautionGroups: [
        'Individuals with Celiac Disease or Wheat Allergy (Must use certified gluten-free bread)',
      ],
      safetyNotice:
        '⚠️ Contains Wheat Gluten. Completely free of dairy, eggs, nuts, and soy. For gluten-sensitive guests, substitute with gluten-free seeded artisan bread.',
      populationWarnings: {
        pregnancyCaution: 'Wash tomatoes and microgreens thoroughly under cold running water before assembling.',
        toddlerCaution: 'Omit red pepper flakes to maintain zero spice for young palates.',
        diabeticCaution: 'Abundant in heart-healthy monounsaturated fats and dietary fiber.',
      },
    },
  },
  {
    id: 'recipe-artisan-margherita-pizza',
    title: 'Neapolitan Margherita Pizza with Fresh Basil',
    description: 'Wood-fired crust with San Marzano tomato sauce, torn fresh Fior di Latte mozzarella, extra virgin olive oil, and sweet basil.',
    cuisine: 'Classic Italian',
    prepTime: '20 mins',
    cookTime: '10 mins',
    totalTime: '30 mins',
    servings: 4,
    caloriesPerServing: 420,
    difficulty: 'Intermediate',
    imageUrl: 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?w=800&auto=format&fit=crop&q=80',
    ingredients: [
      '1 artisan pizza dough ball (Tipo 00 flour)',
      '1/2 cup crushed San Marzano tomatoes with a pinch of sea salt',
      '6 oz fresh Fior di Latte mozzarella, torn into chunks',
      '10 fresh basil leaves',
      '2 tbsp extra virgin olive oil',
      'Flaky sea salt to taste',
    ],
    instructions: [
      'Preheat oven and pizza stone to highest setting (500°F / 260°C) for 45 minutes.',
      'Gently stretch dough onto a floured peel, preserving the airy outer rim (cornicione).',
      'Spread San Marzano tomatoes evenly across the center.',
      'Distribute torn fresh mozzarella chunks evenly across sauce.',
      'Slide onto blistering hot stone and bake for 8-10 minutes until crust is puffed and charred in spots.',
      'Scatter fresh basil leaves and drizzle with rich olive oil before slicing.',
    ],
    dietaryTags: ['Vegetarian', 'Nut-Free', 'Classic Comfort'],
    allergenSafety: {
      safetyRating: 'Contains Common Allergens',
      allergensPresent: ['Gluten (Wheat 00 flour)', 'Dairy (Mozzarella)'],
      isSafeFor: [
        'Peanut & Tree Nut allergy sufferers (100% Nut-Free facility safe)',
        'Egg-Allergy Sufferers (Zero eggs in authentic dough)',
        'Vegetarians',
      ],
      cautionGroups: [
        'Celiac and Gluten-Intolerant individuals (Contains wheat gluten)',
        'Lactose-intolerant individuals (Contains cow milk cheese)',
      ],
      safetyNotice:
        '⚠️ Contains Wheat Gluten and Dairy. 100% Nut-Free and Egg-Free. Can be prepared with gluten-free flour and vegan cashew-free mozzarella for dietary requirements.',
      populationWarnings: {
        pregnancyCaution: 'Safe! Commercial mozzarella is made from pasteurized milk and thoroughly baked at high heat.',
        toddlerCaution: 'Cut into bite-sized strips and allow melted cheese to cool sufficiently to prevent mouth burns.',
      },
    },
  },
];

export function searchRecipes(
  queryText?: string,
  cuisine?: string,
  dietary?: string
): KitchenRecipe[] {
  let results = [...RECIPE_DATABASE];

  if (queryText) {
    const q = queryText.toLowerCase();
    results = results.filter(
      r =>
        r.title.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.ingredients.some(i => i.toLowerCase().includes(q)) ||
        r.cuisine.toLowerCase().includes(q)
    );
  }

  if (cuisine) {
    results = results.filter(r => r.cuisine.toLowerCase().includes(cuisine.toLowerCase()));
  }

  if (dietary) {
    const d = dietary.toLowerCase();
    results = results.filter(
      r =>
        r.dietaryTags.some(t => t.toLowerCase().includes(d)) ||
        r.allergenSafety.isSafeFor.some(s => s.toLowerCase().includes(d))
    );
  }

  return results.length > 0 ? results : RECIPE_DATABASE;
}

export function getRecipeDetails(recipeIdOrName: string): KitchenRecipe {
  const match = RECIPE_DATABASE.find(
    r =>
      r.id === recipeIdOrName ||
      r.title.toLowerCase().includes(recipeIdOrName.toLowerCase()) ||
      recipeIdOrName.toLowerCase().includes(r.id.replace('recipe-', ''))
  );
  return match || RECIPE_DATABASE[0];
}
