import React, { useState, useEffect } from 'react';
import {
  Utensils,
  Clock,
  Flame,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Search,
  CheckCircle2,
  Sparkles,
  ChevronRight,
  Info,
  X,
  ChefHat,
  Users,
} from 'lucide-react';
import { api, KitchenRecipe } from '../services/api';

export const RecipeHubView: React.FC = () => {
  const [recipes, setRecipes] = useState<KitchenRecipe[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDiet, setSelectedDiet] = useState('All');
  const [activeRecipe, setActiveRecipe] = useState<KitchenRecipe | null>(null);
  const [checkedIngredients, setCheckedIngredients] = useState<Record<string, boolean>>({});
  const [checkedSteps, setCheckedSteps] = useState<Record<number, boolean>>({});

  useEffect(() => {
    api.getRecipes().then(res => {
      setRecipes(res.recipes);
      if (res.recipes.length > 0) {
        setActiveRecipe(res.recipes[0]);
      }
    }).catch(console.error);
  }, []);

  const dietaryOptions = ['All', 'Nut-Free', 'Vegan', 'Dairy-Free', 'Gluten-Free', 'Keto-Friendly'];

  const filteredRecipes = recipes.filter(r => {
    const matchesSearch =
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.ingredients.some(i => i.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesDiet =
      selectedDiet === 'All' ||
      r.dietaryTags.some(t => t.toLowerCase().includes(selectedDiet.toLowerCase())) ||
      r.allergenSafety.isSafeFor.some(s => s.toLowerCase().includes(selectedDiet.toLowerCase()));

    return matchesSearch && matchesDiet;
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
              Alexa<span className="text-cyan-400">+</span> Kitchen & Recipe Intelligence
            </h1>
          </div>
          <p className="text-xs text-gray-400">
            Smart culinary assistance with high-resolution food photography, step-by-step cooking, and comprehensive dietary & allergen safety analysis.
          </p>
        </div>

        {/* Safety Assurance Badge */}
        <div className="flex items-center gap-2 bg-[#0B0F19]/80 border border-emerald-500/40 px-3.5 py-2 rounded-2xl shrink-0">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <div className="text-left text-xs">
            <span className="font-bold text-emerald-300 block">Allergen & Safety Vetted</span>
            <span className="text-[10px] text-gray-400">Evaluates safe consumption for all guests</span>
          </div>
        </div>
      </div>

      {/* Search & Dietary Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-[#111827] p-3 rounded-2xl border border-gray-800">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search recipes, ingredients, cuisines..."
            className="w-full bg-[#0B0F19] border border-gray-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-cyan-400"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {dietaryOptions.map(diet => (
            <button
              key={diet}
              type="button"
              onClick={() => setSelectedDiet(diet)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                selectedDiet === diet
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'bg-gray-800/60 text-gray-400 hover:text-gray-200 border border-transparent'
              }`}
            >
              {diet}
            </button>
          ))}
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
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

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
              className="absolute top-4 right-4 p-2 rounded-full bg-gray-800 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Hero Banner */}
            <div className="relative h-64 rounded-2xl overflow-hidden border border-gray-700">
              <img
                src={activeRecipe.imageUrl}
                alt={activeRecipe.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#111827] via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 space-y-1">
                <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[10px] font-semibold">
                  {activeRecipe.cuisine} • {activeRecipe.difficulty} Difficulty
                </span>
                <h2 className="text-xl font-extrabold text-white">{activeRecipe.title}</h2>
              </div>
            </div>

            {/* Comprehensive Allergen & Safety Analysis Box (Highlighted) */}
            <div className="p-4 rounded-2xl bg-[#0B0F19] border border-cyan-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-cyan-400" />
                  <span className="font-bold text-sm text-cyan-200">
                    Comprehensive Safety & Allergen Assessment
                  </span>
                </div>
                <span
                  className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                    activeRecipe.allergenSafety.safetyRating === 'Safe for All'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  }`}
                >
                  {activeRecipe.allergenSafety.safetyRating}
                </span>
              </div>

              <p className="text-xs text-gray-300 leading-relaxed">
                {activeRecipe.allergenSafety.safetyNotice}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 text-xs">
                <div className="space-y-1 p-2.5 rounded-xl bg-emerald-950/20 border border-emerald-500/20">
                  <span className="font-bold text-emerald-300 text-[11px] block">
                    ✅ Safe For Other People / Diets:
                  </span>
                  <ul className="list-disc list-inside space-y-0.5 text-gray-300 text-[11px]">
                    {activeRecipe.allergenSafety.isSafeFor.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-1 p-2.5 rounded-xl bg-amber-950/20 border border-amber-500/20">
                  <span className="font-bold text-amber-300 text-[11px] block">
                    ⚠️ Caution Groups / Allergens Present:
                  </span>
                  <ul className="list-disc list-inside space-y-0.5 text-gray-300 text-[11px]">
                    {activeRecipe.allergenSafety.cautionGroups.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Population Guidelines (Pregnancy, Toddlers, Diabetics) */}
              {activeRecipe.allergenSafety.populationWarnings && (
                <div className="p-2.5 rounded-xl bg-cyan-950/30 border border-cyan-500/20 text-[11px] text-gray-300 space-y-1">
                  <span className="font-bold text-cyan-300 flex items-center gap-1">
                    <Info className="w-3.5 h-3.5" />
                    Special Population Guidelines:
                  </span>
                  {activeRecipe.allergenSafety.populationWarnings.pregnancyCaution && (
                    <p>🤰 <strong>Pregnancy:</strong> {activeRecipe.allergenSafety.populationWarnings.pregnancyCaution}</p>
                  )}
                  {activeRecipe.allergenSafety.populationWarnings.toddlerCaution && (
                    <p>👶 <strong>Children & Toddlers:</strong> {activeRecipe.allergenSafety.populationWarnings.toddlerCaution}</p>
                  )}
                  {activeRecipe.allergenSafety.populationWarnings.diabeticCaution && (
                    <p>🩺 <strong>Diabetic / Blood Sugar:</strong> {activeRecipe.allergenSafety.populationWarnings.diabeticCaution}</p>
                  )}
                </div>
              )}
            </div>

            {/* Ingredients Section */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-gray-200 flex items-center gap-2">
                <Utensils className="w-4 h-4 text-cyan-400" />
                <span>Ingredients Checklist</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                {activeRecipe.ingredients.map((ing, idx) => (
                  <div
                    key={idx}
                    onClick={() => toggleIngredient(ing)}
                    className={`flex items-center gap-2.5 p-2 rounded-xl border cursor-pointer transition-all ${
                      checkedIngredients[ing]
                        ? 'bg-emerald-950/30 border-emerald-500/40 text-gray-400 line-through'
                        : 'bg-gray-800/40 border-gray-700/60 text-gray-200 hover:border-cyan-500/40'
                    }`}
                  >
                    <CheckCircle2 className={`w-4 h-4 ${checkedIngredients[ing] ? 'text-emerald-400' : 'text-gray-500'}`} />
                    <span>{ing}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Step-by-Step Directions */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-gray-200 flex items-center gap-2">
                <ChefHat className="w-4 h-4 text-cyan-400" />
                <span>Step-by-Step Cooking Instructions</span>
              </h3>
              <div className="space-y-2.5">
                {activeRecipe.instructions.map((step, idx) => (
                  <div
                    key={idx}
                    onClick={() => toggleStep(idx)}
                    className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                      checkedSteps[idx]
                        ? 'bg-emerald-950/30 border-emerald-500/40 text-gray-400'
                        : 'bg-[#0B0F19] border-gray-800 text-gray-200 hover:border-cyan-500/40'
                    }`}
                  >
                    <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold text-xs flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <p className={`text-xs leading-relaxed ${checkedSteps[idx] ? 'line-through' : ''}`}>
                      {step}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Alexa Vocal Assist Banner */}
            <div className="p-3 rounded-2xl bg-cyan-950/50 border border-cyan-500/30 flex items-center justify-between text-xs text-cyan-200">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span>Hands-free kitchen voice control: <em>"Alexa, what is step {activeRecipe.instructions.length > 1 ? '2' : '1'}?"</em></span>
              </div>
              <button
                type="button"
                onClick={() => setActiveRecipe(null)}
                className="px-3 py-1 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-xs transition-colors"
              >
                Done Cooking
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
