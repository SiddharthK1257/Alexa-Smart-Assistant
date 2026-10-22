import React, { useState, useEffect } from 'react';
import {
  Utensils,
  Clock,
  Flame,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Search,
  ChevronRight,
  X,
  ChefHat,
  Users,
  Mic,
  MicOff,
  Globe,
  Loader2,
} from 'lucide-react';
import { api, KitchenRecipe } from '../services/api';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis';

export const RecipeHubView: React.FC = () => {
  const [recipes, setRecipes] = useState<KitchenRecipe[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState('All');
  const [selectedDiet, setSelectedDiet] = useState('All');
  const [activeRecipe, setActiveRecipe] = useState<KitchenRecipe | null>(null);
  const [checkedIngredients, setCheckedIngredients] = useState<Record<string, boolean>>({});
  const [checkedSteps, setCheckedSteps] = useState<Record<number, boolean>>({});
  const [isLoading, setIsLoading] = useState(false);

  const { speak } = useSpeechSynthesis();

  // Voice Dish Search
  const handleVoiceDishQuery = async (spokenText: string) => {
    if (!spokenText.trim()) return;
    const cleanDish = spokenText
      .replace(/^alexa[, ]*/i, '')
      .replace(/recipe for|how to make|recipe of|make|cook|dishes for|show me(?: a)? recipe for|dish/gi, '')
      .replace(/with images|with image|images|image|please/gi, '')
      .trim();

    const queryToSearch = cleanDish || spokenText.trim();
    setSearchQuery(queryToSearch);
    await performSearch(queryToSearch);
  };

  const { isListening, toggleListening } = useSpeechRecognition(handleVoiceDishQuery);

  const performSearch = async (queryText: string) => {
    setIsLoading(true);
    try {
      const res = await api.getRecipes(queryText);
      setRecipes(res.recipes);
      if (res.recipes.length > 0) {
        setActiveRecipe(res.recipes[0]);
        speak(`Found recipe for ${res.recipes[0].title}. Displaying ingredients, instructions, and allergen safety profile.`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    api.getRecipes().then(res => {
      setRecipes(res.recipes);
      if (res.recipes.length > 0) {
        setActiveRecipe(res.recipes[0]);
      }
    }).catch(console.error);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      performSearch(searchQuery.trim());
    }
  };

  const cuisines = ['All', 'Italian', 'Asian', 'Indian', 'Mexican', 'French', 'Mediterranean', 'American'];
  const dietaryOptions = ['All', 'Nut-Free', 'Vegan', 'Dairy-Free', 'Gluten-Free', 'Keto-Friendly'];

  const filteredRecipes = recipes.filter(r => {
    const matchesSearch =
      !searchQuery ||
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.ingredients.some(i => i.toLowerCase().includes(searchQuery.toLowerCase())) ||
      r.cuisine.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCuisine =
      selectedCuisine === 'All' ||
      r.cuisine.toLowerCase().includes(selectedCuisine.toLowerCase());

    const matchesDiet =
      selectedDiet === 'All' ||
      r.dietaryTags.some(t => t.toLowerCase().includes(selectedDiet.toLowerCase())) ||
      r.allergenSafety.isSafeFor.some(s => s.toLowerCase().includes(selectedDiet.toLowerCase()));

    return matchesSearch && matchesCuisine && matchesDiet;
  });

  const toggleIngredient = (ing: string) => {
    setCheckedIngredients(prev => ({ ...prev, [ing]: !prev[ing] }));
  };

  const toggleStep = (idx: number) => {
    setCheckedSteps(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-[#111827] via-[#1E293B] to-[#111827] border border-cyan-500/30 p-6 rounded-3xl shadow-2xl relative overflow-hidden">
        <div className="space-y-1 relative z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center">
              <ChefHat className="w-4 h-4 text-cyan-400" />
            </div>
            <h1 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
              Alexa<span className="text-cyan-400">+</span> World Recipes & Food Safety
            </h1>
          </div>
          <p className="text-xs text-gray-400">
            Ask by voice for any dish in the world — discover authentic recipes with photography, step-by-step cooking, and allergen safety assessments.
          </p>
        </div>

        {/* Safety Assurance Badge & Voice Indicator */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-[#0B0F19]/80 border border-emerald-500/40 px-3.5 py-2 rounded-2xl shrink-0">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <div className="text-left text-xs">
              <span className="font-bold text-emerald-300 block">Allergen & Safety Vetted</span>
              <span className="text-[10px] text-gray-400">Evaluates dietary safety for all guests</span>
            </div>
          </div>
        </div>
      </div>

      {/* Voice & Text Search Bar */}
      <div className="bg-[#111827] p-4 rounded-3xl border border-gray-800 space-y-3 shadow-xl">
        <form onSubmit={handleSearchSubmit} className="flex gap-2 items-center">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Ask for any dish in the world (e.g., Butter Chicken, Tonkotsu Ramen, Paella, Tacos al Pastor)..."
              className="w-full bg-[#0B0F19] border border-gray-700 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-cyan-400 transition-colors"
            />
            {isLoading && (
              <Loader2 className="w-4 h-4 text-cyan-400 animate-spin absolute right-3.5 top-3" />
            )}
          </div>

          {/* Voice Search Button */}
          <button
            type="button"
            onClick={toggleListening}
            className={`p-2.5 rounded-2xl border transition-all flex items-center gap-2 text-xs font-bold shrink-0 ${
              isListening
                ? 'bg-rose-500 text-white border-rose-400 shadow-lg shadow-rose-500/30 animate-pulse'
                : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 hover:bg-cyan-500/30'
            }`}
            title="Ask in voice for any dish in the world"
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            <span className="hidden sm:inline">{isListening ? 'Listening...' : 'Voice Search'}</span>
          </button>

          <button
            type="submit"
            className="px-4 py-2.5 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs transition-all shrink-0"
          >
            Find Recipe
          </button>
        </form>

        {/* Cuisines & Diets Filter Tabs */}
        <div className="flex flex-col sm:flex-row gap-2 justify-between items-start sm:items-center pt-1 border-t border-gray-800/60">
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 text-xs">
            <span className="text-gray-400 font-semibold text-[11px] flex items-center gap-1 shrink-0">
              <Globe className="w-3.5 h-3.5 text-cyan-400" /> Cuisines:
            </span>
            {cuisines.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => setSelectedCuisine(c)}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-medium whitespace-nowrap transition-all ${
                  selectedCuisine === c
                    ? 'bg-cyan-500 text-black font-bold shadow-md'
                    : 'bg-gray-800/60 text-gray-400 hover:text-gray-200'
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 text-xs">
            {dietaryOptions.map(diet => (
              <button
                key={diet}
                type="button"
                onClick={() => setSelectedDiet(diet)}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-medium whitespace-nowrap transition-all ${
                  selectedDiet === diet
                    ? 'bg-purple-500/30 text-purple-200 border border-purple-400/50 shadow-sm'
                    : 'bg-gray-800/40 text-gray-400 hover:text-gray-200'
                }`}
              >
                {diet}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Recipe Explorer Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRecipes.map(recipe => {
          const isSafeForAll = recipe.allergenSafety.safetyRating === 'Safe for All';
          return (
            <div
              key={recipe.id}
              onClick={() => setActiveRecipe(recipe)}
              className="group bg-[#111827] border border-gray-800 hover:border-cyan-500/50 rounded-3xl overflow-hidden shadow-xl transition-all hover:scale-[1.01] cursor-pointer flex flex-col justify-between"
            >
              <div>
                {/* Photo Header */}
                <div className="relative h-48 w-full overflow-hidden">
                  <img
                    src={recipe.imageUrl}
                    alt={recipe.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />

                  {/* Safety Indicator Pill on Image */}
                  <div className="absolute top-3 right-3">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold backdrop-blur-md shadow-lg ${
                        isSafeForAll
                          ? 'bg-emerald-950/80 border border-emerald-400/50 text-emerald-300'
                          : 'bg-amber-950/80 border border-amber-400/50 text-amber-300'
                      }`}
                    >
                      {isSafeForAll ? (
                        <>
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Safe for All Guests</span>
                        </>
                      ) : (
                        <>
                          <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                          <span>Contains Allergens</span>
                        </>
                      )}
                    </span>
                  </div>

                  {/* Cuisine Tag */}
                  <div className="absolute bottom-3 left-3 px-2 py-0.5 rounded-lg bg-black/60 backdrop-blur-md border border-white/20 text-[10px] font-semibold text-cyan-300">
                    {recipe.cuisine}
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 space-y-3">
                  <h3 className="font-bold text-sm text-gray-100 group-hover:text-cyan-300 transition-colors line-clamp-1">
                    {recipe.title}
                  </h3>
                  <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                    {recipe.description}
                  </p>

                  {/* Metrics */}
                  <div className="flex items-center gap-3 text-[11px] text-gray-300 pt-1">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{recipe.totalTime}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5 text-orange-400" />
                      <span>{recipe.caloriesPerServing} kcal</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-purple-400" />
                      <span>{recipe.servings} Servings</span>
                    </div>
                  </div>

                  {/* Allergen Notice Card */}
                  <div
                    className={`p-2.5 rounded-xl text-xs space-y-1 ${
                      isSafeForAll
                        ? 'bg-emerald-950/30 border border-emerald-500/20 text-emerald-200'
                        : 'bg-amber-950/30 border border-amber-500/20 text-amber-200'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-semibold text-[11px]">
                      <AlertTriangle className={`w-3.5 h-3.5 ${isSafeForAll ? 'text-emerald-400' : 'text-amber-400'}`} />
                      <span>{isSafeForAll ? 'Safe Profile' : 'Allergen Alert'}</span>
                    </div>
                    <p className="text-[11px] line-clamp-2 leading-tight opacity-90">
                      {recipe.allergenSafety.safetyNotice}
                    </p>
                  </div>
                </div>
              </div>

              {/* Card Footer Button */}
              <div className="px-5 pb-5 pt-1">
                <button
                  type="button"
                  onClick={() => setActiveRecipe(recipe)}
                  className="w-full py-2 px-3 rounded-xl bg-gray-800 hover:bg-cyan-500 hover:text-black font-semibold text-xs text-cyan-300 transition-all flex items-center justify-center gap-1.5"
                >
                  <span>View Recipe & Instructions</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Detailed Recipe Modal */}
      {activeRecipe && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#111827] border border-cyan-500/40 rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative space-y-6 p-6">
            <button
              type="button"
              onClick={() => setActiveRecipe(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-gray-800 text-gray-400 hover:text-white transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Hero Banner with Dish Image */}
            <div className="relative h-64 rounded-2xl overflow-hidden border border-gray-700">
              <img
                src={activeRecipe.imageUrl}
                alt={activeRecipe.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#111827] via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 space-y-1">
                <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[10px] font-semibold">
                  {activeRecipe.cuisine}
                </span>
                <h2 className="text-xl font-extrabold text-white">{activeRecipe.title}</h2>
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-4 gap-2 text-center bg-[#0B0F19] p-3 rounded-2xl border border-gray-800 text-xs">
              <div>
                <span className="text-gray-400 block text-[10px]">Prep Time</span>
                <span className="font-bold text-gray-200">{activeRecipe.prepTime}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px]">Cook Time</span>
                <span className="font-bold text-gray-200">{activeRecipe.cookTime}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px]">Servings</span>
                <span className="font-bold text-purple-300">{activeRecipe.servings} People</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px]">Calories</span>
                <span className="font-bold text-orange-300">{activeRecipe.caloriesPerServing} kcal</span>
              </div>
            </div>

            {/* Comprehensive Allergen Safety Box */}
            <div
              className={`p-4 rounded-2xl space-y-3 ${
                activeRecipe.allergenSafety.safetyRating === 'Safe for All'
                  ? 'bg-emerald-950/40 border border-emerald-500/40'
                  : 'bg-amber-950/40 border border-amber-500/40'
              }`}
            >
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <h4 className="font-bold text-sm text-white">Allergen & Health Assessment</h4>
              </div>

              <p className="text-xs text-gray-300 leading-relaxed">
                {activeRecipe.allergenSafety.safetyNotice}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-1">
                <div>
                  <span className="font-bold text-emerald-300 block mb-1">Safe Groups:</span>
                  <ul className="list-disc list-inside space-y-0.5 text-gray-300 text-[11px]">
                    {activeRecipe.allergenSafety.isSafeFor.map((g, idx) => (
                      <li key={idx}>{g}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <span className="font-bold text-amber-300 block mb-1">Caution / Allergens:</span>
                  <ul className="list-disc list-inside space-y-0.5 text-gray-300 text-[11px]">
                    {activeRecipe.allergenSafety.cautionGroups.map((c, idx) => (
                      <li key={idx}>{c}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Ingredients & Step-by-Step Instructions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Ingredients List */}
              <div className="space-y-3">
                <h4 className="font-bold text-sm text-white flex items-center gap-2">
                  <Utensils className="w-4 h-4 text-cyan-400" /> Ingredients
                </h4>
                <div className="space-y-1.5 bg-[#0B0F19] p-3 rounded-2xl border border-gray-800 text-xs">
                  {activeRecipe.ingredients.map((ing, idx) => (
                    <label
                      key={idx}
                      className="flex items-start gap-2 p-1.5 rounded-lg hover:bg-gray-800/40 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={!!checkedIngredients[ing]}
                        onChange={() => toggleIngredient(ing)}
                        className="rounded border-gray-700 text-cyan-500 focus:ring-0 mt-0.5"
                      />
                      <span className={`text-[11px] ${checkedIngredients[ing] ? 'line-through text-gray-500' : 'text-gray-300'}`}>
                        {ing}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Instructions */}
              <div className="space-y-3">
                <h4 className="font-bold text-sm text-white flex items-center gap-2">
                  <ChefHat className="w-4 h-4 text-cyan-400" /> Cooking Instructions
                </h4>
                <div className="space-y-2 text-xs">
                  {activeRecipe.instructions.map((step, idx) => (
                    <div
                      key={idx}
                      onClick={() => toggleStep(idx)}
                      className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                        checkedSteps[idx]
                          ? 'bg-gray-900/60 border-gray-800 opacity-60'
                          : 'bg-[#0B0F19] border-gray-800 hover:border-cyan-500/40'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold text-[10px] flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span className="text-[10px] text-gray-400 font-semibold">Step {idx + 1}</span>
                      </div>
                      <p className="text-[11px] text-gray-300 leading-relaxed">{step}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
