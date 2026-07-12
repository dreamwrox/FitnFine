import React, { useState, useMemo, useEffect, useCallback } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { supabase } from "./supabaseClient.js";
import { useAuth } from "./useAuth.js";

/* =========================================================================
   TOKENS
   ========================================================================= */
const COLOR = {
  ink: "#15181B",
  panel: "#1D2124",
  panel2: "#262B2F",
  paperDim: "#DAD4C2",
  hairline: "#3A3F43",
  text: "#ECE7DA",
  textDim: "#9AA0A6",
  brass: "#D9A441",
  brassDim: "#8A6E2E",
  sage: "#7BAE83",
  clay: "#C96A4B",
  ink2: "#0F1214",
};

const FONT_STYLE = `
@import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap');
.gg-display { font-family: 'Oswald', sans-serif; letter-spacing: 0.02em; }
.gg-body { font-family: 'Inter', sans-serif; }
.gg-mono { font-family: 'IBM Plex Mono', monospace; }
input[type=range] { -webkit-appearance: none; height: 4px; border-radius: 2px; background: ${COLOR.hairline}; }
input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; width: 16px; height: 16px; border-radius: 50%; background: ${COLOR.brass}; cursor: pointer; border: 2px solid ${COLOR.ink}; }
.gg-tab { transition: color .15s ease, border-color .15s ease; }
.gg-btn { transition: transform .1s ease, background .15s ease; }
.gg-btn:active { transform: scale(0.97); }
.gg-input:focus, .gg-select:focus { outline: 2px solid ${COLOR.brass}; outline-offset: 2px; }
.gg-chip:focus-visible, .gg-btn:focus-visible, .gg-tab:focus-visible { outline: 2px solid ${COLOR.brass}; outline-offset: 2px; }
.gg-check { width: 18px; height: 18px; accent-color: ${COLOR.brass}; cursor: pointer; }
`;

/* =========================================================================
   DATA: FOODS
   ========================================================================= */
const FOODS = [
  { id: "roti", name: "Whole wheat roti", serving: "1 medium (40g)", cal: 120, p: 3, c: 18, f: 3.7, na: 2, k: 80, ca: 10, fe: 1, vc: 0, vd: 0, fib: 3 },
  { id: "rice", name: "Steamed rice", serving: "1 cup (150g)", cal: 200, p: 4, c: 45, f: 0.4, na: 1, k: 55, ca: 10, fe: 0.4, vc: 0, vd: 0, fib: 0.6 },
  { id: "brown_rice", name: "Brown rice", serving: "1 cup cooked (195g)", cal: 215, p: 5, c: 45, f: 1.8, na: 10, k: 84, ca: 20, fe: 0.8, vc: 0, vd: 0, fib: 3.5 },
  { id: "dal", name: "Dal (toor/moong)", serving: "1 cup cooked (200g)", cal: 180, p: 12, c: 30, f: 1.5, na: 4, k: 350, ca: 40, fe: 3, vc: 0, vd: 0, fib: 8 },
  { id: "paneer", name: "Paneer", serving: "100g", cal: 265, p: 18, c: 3.4, f: 20, na: 18, k: 138, ca: 480, fe: 0.2, vc: 0, vd: 0, fib: 0 },
  { id: "curd", name: "Curd / yogurt (plain)", serving: "1 cup (245g)", cal: 150, p: 8, c: 11, f: 8, na: 110, k: 380, ca: 300, fe: 0.1, vc: 0, vd: 0, fib: 0 },
  { id: "greek_yogurt", name: "Greek yogurt", serving: "1 cup (245g)", cal: 130, p: 22, c: 9, f: 0.7, na: 65, k: 240, ca: 230, fe: 0.1, vc: 0, vd: 0, fib: 0 },
  { id: "milk", name: "Milk (toned)", serving: "1 cup (240ml)", cal: 120, p: 6, c: 10, f: 5, na: 105, k: 350, ca: 300, fe: 0.1, vc: 0, vd: 2.5, fib: 0 },
  { id: "egg", name: "Egg, boiled", serving: "1 large", cal: 78, p: 6.3, c: 0.6, f: 5.3, na: 62, k: 63, ca: 25, fe: 0.6, vc: 0, vd: 1.1, fib: 0 },
  { id: "chicken", name: "Chicken breast", serving: "100g cooked", cal: 165, p: 31, c: 0, f: 3.6, na: 74, k: 256, ca: 15, fe: 1, vc: 0, vd: 0, fib: 0 },
  { id: "fish", name: "Fish (rohu/salmon)", serving: "100g cooked", cal: 175, p: 24, c: 0, f: 8, na: 60, k: 380, ca: 20, fe: 1, vc: 0, vd: 8, fib: 0 },
  { id: "oats", name: "Oats, cooked", serving: "40g dry", cal: 150, p: 5, c: 27, f: 2.5, na: 2, k: 130, ca: 20, fe: 1.7, vc: 0, vd: 0, fib: 4 },
  { id: "banana", name: "Banana", serving: "1 medium (120g)", cal: 105, p: 1.3, c: 27, f: 0.4, na: 1, k: 420, ca: 6, fe: 0.3, vc: 10, vd: 0, fib: 3 },
  { id: "apple", name: "Apple", serving: "1 medium (180g)", cal: 95, p: 0.5, c: 25, f: 0.3, na: 2, k: 195, ca: 11, fe: 0.2, vc: 8, vd: 0, fib: 4.4 },
  { id: "orange", name: "Orange", serving: "1 medium (130g)", cal: 62, p: 1.2, c: 15, f: 0.2, na: 0, k: 240, ca: 52, fe: 0.1, vc: 70, vd: 0, fib: 3 },
  { id: "pb", name: "Peanut butter", serving: "2 tbsp (32g)", cal: 190, p: 7, c: 6, f: 16, na: 150, k: 200, ca: 15, fe: 0.6, vc: 0, vd: 0, fib: 2 },
  { id: "almonds", name: "Almonds", serving: "10 pcs (12g)", cal: 70, p: 2.6, c: 2.5, f: 6, na: 0, k: 90, ca: 30, fe: 0.5, vc: 0, vd: 0, fib: 1.5 },
  { id: "mixed_nuts", name: "Mixed nuts", serving: "30g", cal: 180, p: 5, c: 8, f: 15, na: 5, k: 200, ca: 40, fe: 1.2, vc: 0, vd: 0, fib: 3 },
  { id: "spinach", name: "Spinach, cooked", serving: "1 cup (180g)", cal: 40, p: 5, c: 7, f: 0.5, na: 125, k: 840, ca: 245, fe: 6.4, vc: 18, vd: 0, fib: 4 },
  { id: "broccoli", name: "Broccoli, cooked", serving: "1 cup (155g)", cal: 55, p: 3.7, c: 11, f: 0.6, na: 30, k: 460, ca: 62, fe: 1, vc: 100, vd: 0, fib: 5 },
  { id: "sweet_potato", name: "Sweet potato, baked", serving: "1 medium (130g)", cal: 115, p: 2, c: 27, f: 0.1, na: 45, k: 540, ca: 40, fe: 0.7, vc: 20, vd: 0, fib: 4 },
  { id: "potato", name: "Potato, boiled", serving: "1 medium (170g)", cal: 160, p: 3, c: 37, f: 0.2, na: 10, k: 900, ca: 15, fe: 0.6, vc: 15, vd: 0, fib: 3.5 },
  { id: "bread", name: "Whole wheat bread", serving: "2 slices (60g)", cal: 160, p: 6, c: 28, f: 2.4, na: 300, k: 140, ca: 60, fe: 1.5, vc: 0, vd: 0, fib: 4 },
  { id: "salad", name: "Cucumber-tomato salad", serving: "1 bowl (150g)", cal: 45, p: 2, c: 9, f: 0.3, na: 15, k: 350, ca: 30, fe: 0.8, vc: 20, vd: 0, fib: 2 },
  { id: "chana", name: "Chana (chickpeas)", serving: "1 cup cooked (165g)", cal: 270, p: 15, c: 45, f: 4, na: 11, k: 480, ca: 80, fe: 4.7, vc: 0, vd: 0, fib: 12 },
  { id: "rajma", name: "Rajma (kidney beans)", serving: "1 cup cooked (175g)", cal: 225, p: 15, c: 40, f: 1, na: 2, k: 700, ca: 50, fe: 5, vc: 0, vd: 0, fib: 11 },
  { id: "whey", name: "Whey protein", serving: "1 scoop (30g)", cal: 120, p: 24, c: 3, f: 1.5, na: 50, k: 150, ca: 100, fe: 0.2, vc: 0, vd: 0, fib: 0 },
  { id: "idli", name: "Idli", serving: "2 pieces", cal: 78, p: 2, c: 16, f: 0.4, na: 200, k: 60, ca: 15, fe: 0.5, vc: 0, vd: 0, fib: 1 },
  { id: "dosa", name: "Plain dosa", serving: "1 medium", cal: 133, p: 3, c: 20, f: 4, na: 250, k: 70, ca: 20, fe: 0.8, vc: 0, vd: 0, fib: 1 },
  { id: "poha", name: "Poha", serving: "1 cup (150g)", cal: 180, p: 4, c: 30, f: 5, na: 300, k: 150, ca: 20, fe: 2, vc: 0, vd: 0, fib: 2 },
  { id: "upma", name: "Upma", serving: "1 cup (200g)", cal: 220, p: 5, c: 30, f: 8, na: 350, k: 160, ca: 25, fe: 1.5, vc: 0, vd: 0, fib: 2.5 },
  { id: "soya_chunks", name: "Soya chunks, cooked", serving: "50g dry wt.", cal: 230, p: 26, c: 17, f: 0.3, na: 20, k: 900, ca: 175, fe: 10, vc: 0, vd: 0, fib: 6.5 },
  { id: "watermelon", name: "Watermelon", serving: "1 cup (150g)", cal: 46, p: 1, c: 11, f: 0.2, na: 1, k: 170, ca: 8, fe: 0.2, vc: 12, vd: 0, fib: 0.6 },
  { id: "tofu", name: "Tofu", serving: "100g", cal: 144, p: 15, c: 3, f: 8, na: 12, k: 150, ca: 350, fe: 2.7, vc: 0, vd: 0, fib: 1 },
  { id: "sprouts", name: "Moong sprouts", serving: "1 cup (100g)", cal: 105, p: 7, c: 19, f: 0.4, na: 5, k: 230, ca: 27, fe: 1.6, vc: 8, vd: 0, fib: 4 },
  { id: "quinoa", name: "Quinoa, cooked", serving: "1 cup (185g)", cal: 222, p: 8, c: 39, f: 3.6, na: 13, k: 318, ca: 31, fe: 2.8, vc: 0, vd: 0, fib: 5 },
  { id: "shrimp", name: "Shrimp, cooked", serving: "100g", cal: 99, p: 24, c: 0.2, f: 0.3, na: 111, k: 259, ca: 70, fe: 0.5, vc: 0, vd: 0, fib: 0 },
  { id: "tuna", name: "Tuna, canned", serving: "100g", cal: 132, p: 29, c: 0, f: 1, na: 247, k: 252, ca: 8, fe: 1.3, vc: 0, vd: 2, fib: 0 },
  { id: "avocado", name: "Avocado", serving: "1/2 medium (100g)", cal: 160, p: 2, c: 9, f: 15, na: 7, k: 485, ca: 12, fe: 0.6, vc: 10, vd: 0, fib: 7 },
  { id: "flaxseed", name: "Flaxseed, ground", serving: "1 tbsp (10g)", cal: 55, p: 2, c: 3, f: 4, na: 3, k: 60, ca: 26, fe: 0.6, vc: 0, vd: 0, fib: 3 },
  { id: "walnuts", name: "Walnuts", serving: "6 halves (15g)", cal: 98, p: 2.3, c: 2, f: 9.8, na: 0, k: 68, ca: 14, fe: 0.4, vc: 0, vd: 0, fib: 1 },
  { id: "chia", name: "Chia seeds", serving: "1 tbsp (12g)", cal: 58, p: 2, c: 5, f: 3.7, na: 1, k: 44, ca: 63, fe: 0.9, vc: 0, vd: 0, fib: 4 },
  { id: "pumpkin_seeds", name: "Pumpkin seeds", serving: "1 oz (28g)", cal: 151, p: 7, c: 5, f: 13, na: 5, k: 229, ca: 18, fe: 2.7, vc: 0, vd: 0, fib: 1.7 },
  { id: "guava", name: "Guava", serving: "1 medium (100g)", cal: 68, p: 2.6, c: 14, f: 1, na: 2, k: 417, ca: 18, fe: 0.3, vc: 228, vd: 0, fib: 5 },
  { id: "pomegranate", name: "Pomegranate", serving: "1 cup arils (174g)", cal: 144, p: 3, c: 33, f: 2, na: 5, k: 411, ca: 28, fe: 0.5, vc: 18, vd: 0, fib: 7 },
  { id: "carrot", name: "Carrot, raw", serving: "1 cup (128g)", cal: 52, p: 1.2, c: 12, f: 0.3, na: 88, k: 410, ca: 42, fe: 0.4, vc: 7, vd: 0, fib: 3.6 },
  { id: "bell_pepper", name: "Bell pepper", serving: "1 cup (149g)", cal: 46, p: 1.5, c: 9, f: 0.5, na: 4, k: 314, ca: 14, fe: 0.8, vc: 190, vd: 0, fib: 3.4 },
  { id: "beetroot", name: "Beetroot, cooked", serving: "1 cup (170g)", cal: 75, p: 2.9, c: 17, f: 0.3, na: 131, k: 519, ca: 27, fe: 1.3, vc: 6, vd: 0, fib: 3.4 },
  { id: "ragi", name: "Ragi porridge", serving: "1 cup (200g)", cal: 170, p: 5, c: 36, f: 1.5, na: 5, k: 150, ca: 230, fe: 3.5, vc: 0, vd: 0, fib: 4 },
];
const FOOD_MAP = Object.fromEntries(FOODS.map((f) => [f.id, f]));

/* Good-source tags shown next to a food when it clears a meaningful threshold */
function getFoodTags(f) {
  const tags = [];
  if (f.fe >= 3) tags.push({ label: "iron", color: COLOR.clay });
  if (f.vc >= 15) tags.push({ label: "vit C", color: COLOR.sage });
  if (f.ca >= 150) tags.push({ label: "calcium", color: COLOR.brass });
  if (f.k >= 400) tags.push({ label: "potassium", color: COLOR.brassDim });
  if (f.vd >= 1) tags.push({ label: "vit D", color: COLOR.sage });
  return tags;
}

/* =========================================================================
   DATA: EXERCISES / ACTIVITY / CONDITIONS
   ========================================================================= */
const EXERCISES = [
  { id: "walk", name: "Walking (moderate)", met: 3.5 },
  { id: "brisk_walk", name: "Brisk walking", met: 4.3 },
  { id: "jog", name: "Jogging", met: 7 },
  { id: "run", name: "Running", met: 9.8 },
  { id: "cycle", name: "Cycling (moderate)", met: 6.8 },
  { id: "swim", name: "Swimming", met: 6 },
  { id: "yoga", name: "Yoga", met: 2.5 },
  { id: "weights", name: "Weight training", met: 5 },
  { id: "hiit", name: "HIIT", met: 8 },
  { id: "skip", name: "Skipping rope", met: 10 },
  { id: "elliptical", name: "Elliptical", met: 5 },
  { id: "sport", name: "Sport (football/basketball)", met: 7 },
  { id: "badminton", name: "Badminton", met: 5.5 },
  { id: "stairs", name: "Stair climbing", met: 8 },
  { id: "rowing", name: "Rowing machine", met: 7 },
  { id: "pilates", name: "Pilates", met: 3 },
  { id: "dance", name: "Dance / Zumba", met: 6.5 },
  { id: "tennis", name: "Tennis (singles)", met: 8 },
  { id: "boxing", name: "Boxing (heavy bag)", met: 8.3 },
  { id: "hiking", name: "Hiking (with pack)", met: 6 },
  { id: "kettlebell", name: "Kettlebell circuit", met: 9 },
  { id: "spin", name: "Indoor cycling class", met: 8.5 },
  { id: "martial_arts", name: "Martial arts", met: 10.3 },
  { id: "trekking", name: "Trekking (light pack)", met: 7 },
];

const ACTIVITY_LEVELS = [
  { id: "sedentary", label: "Sedentary", desc: "Little to no exercise", mult: 1.2 },
  { id: "light", label: "Lightly active", desc: "Light exercise 1–3 days/wk", mult: 1.375 },
  { id: "moderate", label: "Moderately active", desc: "Moderate exercise 3–5 days/wk", mult: 1.55 },
  { id: "active", label: "Very active", desc: "Hard exercise 6–7 days/wk", mult: 1.725 },
  { id: "athlete", label: "Extra active", desc: "Physical job or 2x/day training", mult: 1.9 },
];

const CONDITIONS = [
  { id: "knee", label: "Knee issues" },
  { id: "back", label: "Back issues" },
  { id: "diabetes", label: "Diabetes" },
  { id: "hypertension", label: "Hypertension" },
  { id: "thyroid", label: "Thyroid condition" },
  { id: "pcos", label: "PCOS / PCOD" },
  { id: "heart", label: "Heart condition" },
];

/* =========================================================================
   DATE HELPERS
   ========================================================================= */
function dateStr(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function addDays(d, n) {
  const nd = new Date(d);
  nd.setDate(nd.getDate() + n);
  return nd;
}

/* =========================================================================
   CALCULATIONS
   ========================================================================= */
function calcBMR(p) {
  const base = 10 * p.weight + 6.25 * p.height - 5 * p.age;
  if (p.gender === "male") return base + 5;
  if (p.gender === "female") return base - 161;
  return base - 78;
}

function calcTargets(p) {
  const bmr = calcBMR(p);
  const mult = ACTIVITY_LEVELS.find((a) => a.id === p.activity)?.mult || 1.375;
  const tdee = bmr * mult;

  let delta = 0;
  if (p.goal !== "maintain") {
    delta = Math.min((p.rate * 7700) / 7, tdee * 0.25);
  }
  let targetCalories = p.goal === "lose" ? tdee - delta : p.goal === "gain" ? tdee + delta : tdee;
  const floor = p.gender === "female" ? 1200 : 1500;
  targetCalories = Math.max(Math.round(targetCalories), floor);

  const proteinPerKg = p.goal === "lose" ? 2.0 : p.goal === "gain" ? 1.8 : 1.6;
  const proteinG = Math.round(proteinPerKg * p.weight);
  const proteinCal = proteinG * 4;
  const fatCal = targetCalories * 0.25;
  const fatG = Math.round(fatCal / 9);
  const carbCal = Math.max(targetCalories - proteinCal - fatCal, 0);
  const carbG = Math.round(carbCal / 4);

  const conditions = p.conditions || [];
  const sodium = conditions.includes("hypertension") ? 1500 : 2300;
  const fiber = Math.round((targetCalories / 1000) * 14);
  const potassium = p.gender === "male" ? 3400 : 2600;
  const calcium = p.age > 50 ? 1200 : 1000;
  const iron = p.gender === "female" ? (p.age > 50 ? 8 : 18) : 8;
  const vitC = p.gender === "male" ? 90 : 75;
  const vitD = p.age > 70 ? 20 : 15;

  return {
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    calories: targetCalories,
    protein: proteinG,
    carbs: carbG,
    fat: fatG,
    fiber,
    sodium,
    potassium,
    calcium,
    iron,
    vitC,
    vitD,
  };
}

/* =========================================================================
   DIET: 3 rotating variants per meal per diet-pref, chosen by day-of-week
   ========================================================================= */
const DIET_VARIANTS = {
  breakfast: {
    veg: [
      [{ id: "oats", q: 1 }, { id: "milk", q: 1 }, { id: "banana", q: 1 }, { id: "almonds", q: 1 }],
      [{ id: "idli", q: 2 }, { id: "curd", q: 1 }, { id: "apple", q: 1 }],
      [{ id: "poha", q: 1 }, { id: "milk", q: 1 }, { id: "orange", q: 1 }],
      [{ id: "ragi", q: 1 }, { id: "curd", q: 1 }, { id: "guava", q: 1 }],
    ],
    vegan: [
      [{ id: "oats", q: 1 }, { id: "banana", q: 1 }, { id: "pb", q: 1 }, { id: "almonds", q: 1 }],
      [{ id: "dosa", q: 2 }, { id: "orange", q: 1 }],
      [{ id: "upma", q: 1 }, { id: "mixed_nuts", q: 1 }],
      [{ id: "quinoa", q: 1 }, { id: "chia", q: 1 }, { id: "pomegranate", q: 1 }],
    ],
    egg: [
      [{ id: "egg", q: 2 }, { id: "bread", q: 1 }, { id: "banana", q: 1 }],
      [{ id: "egg", q: 2 }, { id: "idli", q: 2 }, { id: "apple", q: 1 }],
      [{ id: "egg", q: 3 }, { id: "oats", q: 1 }],
      [{ id: "egg", q: 2 }, { id: "avocado", q: 1 }, { id: "bread", q: 1 }],
    ],
    nonveg: [
      [{ id: "egg", q: 2 }, { id: "bread", q: 1 }, { id: "banana", q: 1 }],
      [{ id: "egg", q: 3 }, { id: "oats", q: 1 }],
      [{ id: "egg", q: 2 }, { id: "poha", q: 1 }],
      [{ id: "egg", q: 2 }, { id: "avocado", q: 1 }, { id: "bread", q: 1 }],
    ],
  },
  lunch: {
    veg: [
      [{ id: "roti", q: 2 }, { id: "dal", q: 1 }, { id: "salad", q: 1 }, { id: "curd", q: 1 }],
      [{ id: "rice", q: 1 }, { id: "chana", q: 1 }, { id: "salad", q: 1 }],
      [{ id: "roti", q: 2 }, { id: "paneer", q: 1 }, { id: "salad", q: 1 }],
      [{ id: "quinoa", q: 1 }, { id: "tofu", q: 1 }, { id: "bell_pepper", q: 1 }],
    ],
    vegan: [
      [{ id: "rice", q: 1 }, { id: "rajma", q: 1 }, { id: "salad", q: 1 }],
      [{ id: "brown_rice", q: 1 }, { id: "chana", q: 1 }, { id: "spinach", q: 1 }],
      [{ id: "roti", q: 2 }, { id: "dal", q: 1 }, { id: "salad", q: 1 }],
      [{ id: "quinoa", q: 1 }, { id: "tofu", q: 1 }, { id: "carrot", q: 1 }],
    ],
    egg: [
      [{ id: "roti", q: 2 }, { id: "dal", q: 1 }, { id: "salad", q: 1 }, { id: "curd", q: 1 }],
      [{ id: "rice", q: 1 }, { id: "chana", q: 1 }, { id: "salad", q: 1 }],
      [{ id: "roti", q: 2 }, { id: "paneer", q: 1 }, { id: "salad", q: 1 }],
      [{ id: "quinoa", q: 1 }, { id: "sprouts", q: 1 }, { id: "bell_pepper", q: 1 }],
    ],
    nonveg: [
      [{ id: "rice", q: 1 }, { id: "chicken", q: 1 }, { id: "salad", q: 1 }],
      [{ id: "roti", q: 2 }, { id: "chicken", q: 1 }, { id: "salad", q: 1 }],
      [{ id: "rice", q: 1 }, { id: "fish", q: 1 }, { id: "spinach", q: 1 }],
      [{ id: "quinoa", q: 1 }, { id: "shrimp", q: 1 }, { id: "bell_pepper", q: 1 }],
    ],
  },
  dinner: {
    veg: [
      [{ id: "roti", q: 2 }, { id: "paneer", q: 1 }, { id: "broccoli", q: 1 }],
      [{ id: "roti", q: 2 }, { id: "dal", q: 1 }, { id: "spinach", q: 1 }],
      [{ id: "rice", q: 1 }, { id: "chana", q: 1 }, { id: "salad", q: 1 }],
      [{ id: "tofu", q: 1 }, { id: "brown_rice", q: 1 }, { id: "beetroot", q: 1 }],
    ],
    vegan: [
      [{ id: "brown_rice", q: 1 }, { id: "chana", q: 1 }, { id: "spinach", q: 1 }],
      [{ id: "roti", q: 2 }, { id: "rajma", q: 1 }, { id: "broccoli", q: 1 }],
      [{ id: "soya_chunks", q: 1 }, { id: "brown_rice", q: 1 }, { id: "salad", q: 1 }],
      [{ id: "tofu", q: 1 }, { id: "quinoa", q: 1 }, { id: "beetroot", q: 1 }],
    ],
    egg: [
      [{ id: "roti", q: 2 }, { id: "paneer", q: 1 }, { id: "broccoli", q: 1 }],
      [{ id: "egg", q: 2 }, { id: "roti", q: 2 }, { id: "spinach", q: 1 }],
      [{ id: "rice", q: 1 }, { id: "dal", q: 1 }, { id: "salad", q: 1 }],
      [{ id: "egg", q: 2 }, { id: "brown_rice", q: 1 }, { id: "beetroot", q: 1 }],
    ],
    nonveg: [
      [{ id: "sweet_potato", q: 1 }, { id: "fish", q: 1 }, { id: "spinach", q: 1 }],
      [{ id: "roti", q: 2 }, { id: "chicken", q: 1 }, { id: "broccoli", q: 1 }],
      [{ id: "rice", q: 1 }, { id: "fish", q: 1 }, { id: "salad", q: 1 }],
      [{ id: "tuna", q: 1 }, { id: "brown_rice", q: 1 }, { id: "beetroot", q: 1 }],
    ],
  },
  snack: {
    veg: [
      [{ id: "greek_yogurt", q: 1 }, { id: "apple", q: 1 }],
      [{ id: "mixed_nuts", q: 1 }, { id: "orange", q: 1 }],
      [{ id: "curd", q: 1 }, { id: "watermelon", q: 1 }],
      [{ id: "walnuts", q: 1 }, { id: "pomegranate", q: 1 }],
    ],
    vegan: [
      [{ id: "mixed_nuts", q: 1 }, { id: "orange", q: 1 }],
      [{ id: "pb", q: 1 }, { id: "apple", q: 1 }],
      [{ id: "almonds", q: 1 }, { id: "banana", q: 1 }],
      [{ id: "pumpkin_seeds", q: 1 }, { id: "guava", q: 1 }],
    ],
    egg: [
      [{ id: "greek_yogurt", q: 1 }, { id: "apple", q: 1 }],
      [{ id: "mixed_nuts", q: 1 }, { id: "orange", q: 1 }],
      [{ id: "egg", q: 2 }, { id: "watermelon", q: 1 }],
      [{ id: "walnuts", q: 1 }, { id: "pomegranate", q: 1 }],
    ],
    nonveg: [
      [{ id: "whey", q: 1 }, { id: "banana", q: 1 }],
      [{ id: "greek_yogurt", q: 1 }, { id: "apple", q: 1 }],
      [{ id: "mixed_nuts", q: 1 }, { id: "orange", q: 1 }],
      [{ id: "pumpkin_seeds", q: 1 }, { id: "guava", q: 1 }],
    ],
  },
};

const MEAL_SHARE = { breakfast: 0.25, lunch: 0.35, dinner: 0.3, snack: 0.1 };
const MEAL_LABEL = { breakfast: "Breakfast", lunch: "Lunch", dinner: "Dinner", snack: "Snack" };

function genDietForVariant(p, targets, variantIdx) {
  const dietPref = p.dietPref || "veg";
  const day = {};
  Object.keys(DIET_VARIANTS).forEach((slot) => {
    const pool = DIET_VARIANTS[slot][dietPref] || DIET_VARIANTS[slot].veg;
    const template = pool[variantIdx % pool.length];
    const baseCal = template.reduce((s, it) => s + FOOD_MAP[it.id].cal * it.q, 0);
    const mealTarget = targets.calories * MEAL_SHARE[slot];
    const scale = baseCal > 0 ? mealTarget / baseCal : 1;
    const items = template.map((it) => {
      let q = Math.round(it.q * scale * 2) / 2;
      if (q < 0.5) q = 0.5;
      const f = FOOD_MAP[it.id];
      return {
        id: it.id,
        name: f.name,
        serving: f.serving,
        qty: q,
        cal: Math.round(f.cal * q),
        p: Math.round(f.p * q * 10) / 10,
        c: Math.round(f.c * q * 10) / 10,
        f: Math.round(f.f * q * 10) / 10,
        na: Math.round(f.na * q),
        k: Math.round(f.k * q),
        ca: Math.round(f.ca * q),
        fe: Math.round(f.fe * q * 10) / 10,
        vc: Math.round(f.vc * q),
        vd: Math.round(f.vd * q * 10) / 10,
        fiber: Math.round(f.fib * q * 10) / 10,
        tags: getFoodTags(f),
      };
    });
    day[slot] = items;
  });
  return day;
}

function totalsOf(items) {
  return items.reduce(
    (acc, it) => {
      acc.cal += it.cal;
      acc.p += it.p;
      acc.c += it.c;
      acc.f += it.f;
      acc.na += it.na || 0;
      acc.k += it.k || 0;
      acc.ca += it.ca || 0;
      acc.fe += it.fe || 0;
      acc.vc += it.vc || 0;
      acc.vd += it.vd || 0;
      acc.fiber += it.fiber || 0;
      return acc;
    },
    { cal: 0, p: 0, c: 0, f: 0, na: 0, k: 0, ca: 0, fe: 0, vc: 0, vd: 0, fiber: 0 }
  );
}

function conditionNotes(conditions) {
  const notes = [];
  if (conditions.includes("diabetes")) notes.push("Favor low-GI carbs (oats, legumes, whole grains) and spread carbs evenly through the day.");
  if (conditions.includes("hypertension")) notes.push("Sodium target lowered to 1500mg/day — go easy on pickles, papad and packaged snacks.");
  if (conditions.includes("thyroid")) notes.push("Keep meal timing consistent and include iodine sources (dairy, eggs, seafood) unless advised otherwise.");
  if (conditions.includes("pcos")) notes.push("Extra fiber and protein here to support insulin sensitivity; go light on refined sugar.");
  if (conditions.includes("heart")) notes.push("Leaning on unsaturated fats (nuts, fish) over ghee/butter, sodium kept in check.");
  if (conditions.includes("knee") || conditions.includes("back")) notes.push("Added omega-3 sources (fish, walnuts, flax) which may help with joint and tissue recovery.");
  return notes;
}

/* =========================================================================
   WORKOUT: weekly split, cycled by calendar day so "today" always maps
   to a specific session (including rest days)
   ========================================================================= */
function genWorkoutWeek(p) {
  const knee = p.conditions?.includes("knee");
  const back = p.conditions?.includes("back");

  const sub = (name) => {
    let out = name;
    if (knee) {
      out = out.replace(/Jump squats|Box jumps/i, "Cycling or swimming (low-impact)");
      out = out.replace(/Running/i, "Cycling or brisk walking");
      out = out.replace(/Lunges/i, "Supported step-ups (controlled)");
      out = out.replace(/^Squats$/i, "Box squats or leg press");
    }
    if (back) {
      out = out.replace(/Deadlifts/i, "Hip thrusts / glute bridges");
      out = out.replace(/Sit-ups|Crunches/i, "Dead bug / bird-dog");
    }
    return out;
  };
  const mk = (name, sets, reps) => ({ name: sub(name), sets, reps });
  const rest = { day: "Rest", focus: "Recovery", items: [], isRest: true };

  const days = p.daysPerWeek || 4;
  let training = [];
  if (p.goal === "gain") {
    training = [
      { day: "Push", focus: "Chest, shoulders, triceps", items: [mk("Barbell/DB bench press", 4, "6-10"), mk("Overhead press", 3, "8-10"), mk("Incline dumbbell press", 3, "10-12"), mk("Lateral raises", 3, "12-15"), mk("Triceps pushdown", 3, "10-12")] },
      { day: "Pull", focus: "Back, biceps", items: [mk("Deadlifts", 3, "5-8"), mk("Pull-ups / lat pulldown", 4, "6-10"), mk("Barbell rows", 3, "8-10"), mk("Face pulls", 3, "12-15"), mk("Barbell curls", 3, "10-12")] },
      { day: "Legs", focus: "Quads, hamstrings, glutes", items: [mk("Squats", 4, "6-10"), mk("Romanian deadlifts", 3, "8-10"), mk("Leg press", 3, "10-12"), mk("Lunges", 3, "10 each leg"), mk("Calf raises", 3, "15")] },
      { day: "Upper accessory", focus: "Upper body + core", items: [mk("Incline press", 3, "8-10"), mk("Seated cable row", 3, "10-12"), mk("Dumbbell shoulder press", 3, "10"), mk("Sit-ups", 3, "15"), mk("Plank", 3, "45s")] },
      { day: "Lower + cardio", focus: "Legs + conditioning", items: [mk("Front squats", 3, "8-10"), mk("Hip thrusts", 3, "10-12"), mk("Leg curls", 3, "12"), mk("Incline walk (cardio)", 1, "15 min")] },
    ].slice(0, days);
  } else if (p.goal === "lose") {
    training = [
      { day: "Full body", focus: "Strength", items: [mk("Squats", 3, "10-12"), mk("Push-ups / bench press", 3, "10-12"), mk("Barbell rows", 3, "10-12"), mk("Plank", 3, "40s")] },
      { day: "HIIT", focus: "Conditioning", items: [mk("Skipping rope", 4, "1 min"), mk("Jump squats", 3, "12"), mk("Mountain climbers", 3, "30s"), mk("Burpees", 3, "10")] },
      { day: "Full body", focus: "Strength", items: [mk("Deadlifts", 3, "8-10"), mk("Overhead press", 3, "10"), mk("Lunges", 3, "10 each leg"), mk("Sit-ups", 3, "15")] },
      { day: "Steady cardio", focus: "Cardio + core", items: [mk("Brisk walk / jog", 1, "30 min"), mk("Dead bug", 3, "12"), mk("Side plank", 3, "30s each")] },
      { day: "Mobility", focus: "Mobility + light cardio", items: [mk("Yoga flow", 1, "20 min"), mk("Cycling", 1, "20 min")] },
    ].slice(0, days);
  } else {
    training = [
      { day: "Full body", focus: "Strength", items: [mk("Squats", 3, "10"), mk("Bench press", 3, "10"), mk("Barbell rows", 3, "10"), mk("Plank", 3, "40s")] },
      { day: "Cardio", focus: "Cardio + mobility", items: [mk("Brisk walk / cycling", 1, "25 min"), mk("Yoga flow", 1, "15 min")] },
      { day: "Full body", focus: "Strength", items: [mk("Deadlifts", 3, "8"), mk("Overhead press", 3, "10"), mk("Lunges", 3, "10 each leg")] },
      { day: "Active recovery", focus: "Recovery", items: [mk("Yoga / stretching", 1, "25 min"), mk("Walk", 1, "20 min")] },
    ].slice(0, days);
  }

  // Spread training days across a 7-day week with rest days interleaved
  const week = new Array(7).fill(null).map(() => rest);
  const gap = 7 / training.length;
  training.forEach((t, i) => {
    const slot = Math.round(i * gap);
    week[slot] = t;
  });
  return week; // index 0 = Sunday ... 6 = Saturday
}

function burnCalories(met, weightKg, minutes) {
  return Math.round(((met * 3.5 * weightKg) / 200) * minutes);
}

/* =========================================================================
   WORKOUT PROGRESSION — simple 4-week mesocycle applied on top of the base
   split, so the same weekday's session gets harder week over week, then
   deloads and repeats.
   ========================================================================= */
const WEEK_CUES = {
  1: "Baseline week — lock in form and a moderate, controlled weight.",
  2: "Add 1 rep per set on each move if you completed all reps cleanly last week.",
  3: "Add one working set, or add ~2.5–5% load if reps have felt easy.",
  4: "Deload week — lighter effort, fewer sets. Let your body recover before the next block.",
};

function weeksSince(startDateStr) {
  if (!startDateStr) return 1;
  const start = new Date(startDateStr);
  const now = new Date();
  const diffDays = Math.floor((now - start) / (1000 * 60 * 60 * 24));
  return Math.max(1, Math.floor(diffDays / 7) + 1);
}

function parseReps(reps) {
  const m = String(reps).match(/(\d+)(?:-(\d+))?(.*)/);
  if (!m) return { low: null, high: null, suffix: reps };
  return { low: Number(m[1]), high: m[2] ? Number(m[2]) : Number(m[1]), suffix: m[3] || "" };
}

function formatReps(low, high, suffix) {
  return high != null && high !== low ? `${low}-${high}${suffix}` : `${low}${suffix}`;
}

// Only nudge rep numbers for count-based moves (e.g. "10-12"), not
// time-based ones (e.g. "40s", "20 min") — those progress via duration,
// which the person controls directly, not via this scheme.
function isTimeBased(suffix) {
  return /s\b|sec|min/i.test(suffix);
}

function progressItem(item, weekInCycle) {
  if (!item.sets) return item;
  let sets = item.sets;
  const { low, high, suffix } = parseReps(item.reps);
  let newHigh = high;

  if (weekInCycle === 2 && low != null && !isTimeBased(suffix)) newHigh = high + 1;
  if (weekInCycle === 3) sets = sets + 1;
  if (weekInCycle === 4) {
    sets = Math.max(2, sets - 1);
    if (low != null && !isTimeBased(suffix)) newHigh = Math.max(low, high - 2);
  }

  const reps = low != null ? formatReps(low, newHigh, suffix) : item.reps;
  return { ...item, sets, reps };
}

function progressDay(day, weekInCycle) {
  if (day.isRest || !day.items) return day;
  return { ...day, items: day.items.map((it) => progressItem(it, weekInCycle)) };
}


/* =========================================================================
   PERSISTED STATE (per-user, via window.storage)
   ========================================================================= */
function useStorageState(key, initial) {
  const [value, setValue] = useState(initial);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await window.storage.get(key, false);
        if (!cancelled && res) setValue(JSON.parse(res.value));
      } catch (e) {
        // key not found yet — keep initial
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const update = useCallback(
    (next) => {
      setValue((prev) => {
        const resolved = typeof next === "function" ? next(prev) : next;
        window.storage.set(key, JSON.stringify(resolved), false).catch(() => {});
        return resolved;
      });
    },
    [key]
  );

  return [value, update, loaded];
}

function computeStreak(checkinDates) {
  if (!checkinDates || checkinDates.length === 0) return 0;
  const set = new Set(checkinDates);
  let streak = 0;
  let cursor = new Date();
  // if today isn't checked in yet, start counting from yesterday
  if (!set.has(dateStr(cursor))) cursor = addDays(cursor, -1);
  while (set.has(dateStr(cursor))) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

/* =========================================================================
   SMALL UI PRIMITIVES
   ========================================================================= */
function TapeGauge({ label, value, target, unit, color, sub }) {
  const pct = target > 0 ? Math.min(value / target, 1) : 0;
  const over = target > 0 && value > target;
  return (
    <div className="gg-body" style={{ width: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
        <span style={{ fontSize: 12, color: COLOR.textDim, textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</span>
        <span className="gg-mono" style={{ fontSize: 13, color: over ? COLOR.clay : COLOR.text }}>
          {Math.round(value)}
          <span style={{ color: COLOR.textDim }}> / {Math.round(target)} {unit}</span>
        </span>
      </div>
      <div style={{ height: 8, borderRadius: 4, background: COLOR.hairline, overflow: "hidden" }}>
        <div style={{ width: `${pct * 100}%`, height: "100%", background: over ? COLOR.clay : color, borderRadius: 4, transition: "width .4s ease" }} />
      </div>
      {sub && <div style={{ fontSize: 11, color: COLOR.textDim, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function Card({ children, style }) {
  return (
    <div style={{ background: COLOR.panel, border: `1px solid ${COLOR.hairline}`, borderRadius: 10, padding: 18, position: "relative", ...style }}>
      {children}
    </div>
  );
}

function SectionLabel({ children, right }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
      <div className="gg-display" style={{ fontSize: 12, color: COLOR.brass, textTransform: "uppercase", letterSpacing: "0.12em", fontWeight: 600 }}>
        {children}
      </div>
      {right}
    </div>
  );
}

function Chip({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="gg-body gg-btn gg-chip"
      style={{
        padding: "8px 14px",
        borderRadius: 999,
        border: `1px solid ${active ? COLOR.brass : COLOR.hairline}`,
        background: active ? "rgba(217,164,65,0.14)" : "transparent",
        color: active ? COLOR.brass : COLOR.textDim,
        fontSize: 13,
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

function Field({ label, children }) {
  return (
    <label className="gg-body" style={{ display: "block", marginBottom: 16 }}>
      <div style={{ fontSize: 12, color: COLOR.textDim, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>{label}</div>
      {children}
    </label>
  );
}

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  padding: "10px 12px",
  borderRadius: 6,
  border: `1px solid ${COLOR.hairline}`,
  background: COLOR.ink2,
  color: COLOR.text,
  fontSize: 14,
};

/* =========================================================================
   ONBOARDING
   ========================================================================= */
function Onboarding({ initial, onSubmit }) {
  const [form, setForm] = useState(
    initial || {
      age: 28,
      gender: "male",
      height: 170,
      weight: 70,
      activity: "moderate",
      goal: "lose",
      rate: 0.5,
      dietPref: "veg",
      conditions: [],
      daysPerWeek: 4,
    }
  );
  const [error, setError] = useState("");

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const toggleCondition = (id) =>
    setForm((f) => ({ ...f, conditions: f.conditions.includes(id) ? f.conditions.filter((c) => c !== id) : [...f.conditions, id] }));

  const handleSubmit = () => {
    if (!form.age || form.age < 10 || form.age > 100) return setError("Enter an age between 10 and 100.");
    if (!form.height || form.height < 100 || form.height > 250) return setError("Enter a height between 100–250 cm.");
    if (!form.weight || form.weight < 30 || form.weight > 250) return setError("Enter a weight between 30–250 kg.");
    setError("");
    onSubmit(form);
  };

  return (
    <div className="gg-body" style={{ maxWidth: 560, margin: "0 auto", padding: "32px 20px 60px" }}>
      <div style={{ marginBottom: 28 }}>
        <div className="gg-display" style={{ fontSize: 13, color: COLOR.brass, letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 6 }}>
          Fitness Freek — Intake
        </div>
        <h1 className="gg-display" style={{ fontSize: 30, color: COLOR.text, margin: 0, fontWeight: 600 }}>
          Let's set your targets
        </h1>
        <p style={{ color: COLOR.textDim, fontSize: 14, marginTop: 8, lineHeight: 1.5 }}>
          A few details, and I'll build your calorie/macro targets, a meal plan that rotates through the week, and a
          training split — all tracked day by day.
        </p>
      </div>

      <Card>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Field label="Age">
            <input className="gg-input" style={inputStyle} type="number" value={form.age} onChange={(e) => set("age", Number(e.target.value))} />
          </Field>
          <Field label="Gender">
            <select className="gg-select" style={inputStyle} value={form.gender} onChange={(e) => set("gender", e.target.value)}>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </Field>
          <Field label="Height (cm)">
            <input className="gg-input" style={inputStyle} type="number" value={form.height} onChange={(e) => set("height", Number(e.target.value))} />
          </Field>
          <Field label="Weight (kg)">
            <input className="gg-input" style={inputStyle} type="number" value={form.weight} onChange={(e) => set("weight", Number(e.target.value))} />
          </Field>
        </div>

        <Field label="Activity level">
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {ACTIVITY_LEVELS.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => set("activity", a.id)}
                className="gg-btn"
                style={{
                  textAlign: "left",
                  padding: "10px 12px",
                  borderRadius: 6,
                  border: `1px solid ${form.activity === a.id ? COLOR.brass : COLOR.hairline}`,
                  background: form.activity === a.id ? "rgba(217,164,65,0.1)" : COLOR.ink2,
                  color: COLOR.text,
                  cursor: "pointer",
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 600 }}>{a.label}</div>
                <div style={{ fontSize: 12, color: COLOR.textDim }}>{a.desc}</div>
              </button>
            ))}
          </div>
        </Field>

        <Field label="Goal">
          <div style={{ display: "flex", gap: 8 }}>
            {[{ id: "lose", label: "Lose weight" }, { id: "maintain", label: "Maintain" }, { id: "gain", label: "Gain muscle" }].map((g) => (
              <div key={g.id} style={{ flex: 1 }}>
                <Chip active={form.goal === g.id} onClick={() => set("goal", g.id)}>{g.label}</Chip>
              </div>
            ))}
          </div>
        </Field>

        {form.goal !== "maintain" && (
          <Field label={`Target rate: ${form.rate} kg/week`}>
            <input type="range" min={0.25} max={1} step={0.25} value={form.rate} onChange={(e) => set("rate", Number(e.target.value))} style={{ width: "100%" }} />
          </Field>
        )}

        <Field label="Dietary preference">
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {[{ id: "veg", label: "Vegetarian" }, { id: "vegan", label: "Vegan" }, { id: "egg", label: "Eggetarian" }, { id: "nonveg", label: "Non-veg" }].map((d) => (
              <Chip key={d.id} active={form.dietPref === d.id} onClick={() => set("dietPref", d.id)}>{d.label}</Chip>
            ))}
          </div>
        </Field>

        <Field label="Training days / week">
          <div style={{ display: "flex", gap: 8 }}>
            {[3, 4, 5].map((n) => (
              <Chip key={n} active={form.daysPerWeek === n} onClick={() => set("daysPerWeek", n)}>{n} days</Chip>
            ))}
          </div>
        </Field>

        <Field label="Any conditions to account for? (optional)">
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {CONDITIONS.map((c) => (
              <Chip key={c.id} active={form.conditions.includes(c.id)} onClick={() => toggleCondition(c.id)}>{c.label}</Chip>
            ))}
          </div>
        </Field>

        {error && <div style={{ color: COLOR.clay, fontSize: 13, marginBottom: 12 }}>{error}</div>}

        <button
          type="button"
          onClick={handleSubmit}
          className="gg-btn gg-display"
          style={{ width: "100%", padding: "14px 0", borderRadius: 8, border: "none", background: COLOR.brass, color: COLOR.ink, fontSize: 15, fontWeight: 600, letterSpacing: "0.04em", cursor: "pointer", marginTop: 4 }}
        >
          {initial ? "Update my plan" : "Generate my plan"}
        </button>
        <p style={{ fontSize: 11, color: COLOR.textDim, marginTop: 10, lineHeight: 1.5 }}>
          General estimates, not medical advice. Check with a doctor or dietitian before starting a new diet or
          exercise program, especially with an existing health condition.
        </p>
      </Card>
    </div>
  );
}

/* =========================================================================
   DASHBOARD
   ========================================================================= */
function Dashboard({ profile, onReset, userId }) {
  const [tab, setTab] = useState("today");
  const today = new Date();
  const dow = today.getDay(); // 0-6, Sunday-Saturday
  const variantIdx = dow % 4;
  const todayKey = dateStr(today);

  const targets = useMemo(() => calcTargets(profile), [profile]);
  const todayDiet = useMemo(() => genDietForVariant(profile, targets, variantIdx), [profile, targets, variantIdx]);
  const baseWeek = useMemo(() => genWorkoutWeek(profile), [profile]);
  const notes = useMemo(() => conditionNotes(profile.conditions || []), [profile.conditions]);

  // --- persisted: program start date, drives progressive overload ---
  const [programStart, setProgramStart] = useStorageState("program-start", null);
  useEffect(() => {
    if (!programStart) setProgramStart(todayKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [programStart]);

  const programWeek = useMemo(() => weeksSince(programStart), [programStart]);
  const weekInCycle = ((programWeek - 1) % 4) + 1;
  const week = useMemo(() => baseWeek.map((d) => progressDay(d, weekInCycle)), [baseWeek, weekInCycle]);
  const todayWorkout = week[dow];

  const dayTotals = useMemo(() => totalsOf(Object.values(todayDiet).flat()), [todayDiet]);

  // --- persisted: today's checklist ---
  const [checklist, setChecklist] = useStorageState(`checkin:${todayKey}`, { meals: {}, workoutDone: false });
  // --- persisted: history of check-in dates for streak ---
  const [history, setHistory] = useStorageState("checkin-history", []);
  // --- persisted: weight log ---
  const [weightLog, setWeightLog] = useStorageState("weight-log", []);

  const streak = useMemo(() => computeStreak(history), [history]);

  // Keep the admin tracker's view of this user's streak up to date.
  useEffect(() => {
    if (!userId) return;
    supabase.from("profiles").update({ current_streak: streak }).eq("id", userId).then(() => {});
  }, [streak, userId]);

  const markMeal = (slot, done) => {
    setChecklist((prev) => {
      const next = { ...prev, meals: { ...prev.meals, [slot]: done } };
      return next;
    });
  };
  const markWorkout = (done) => {
    setChecklist((prev) => ({ ...prev, workoutDone: done }));
  };

  // whenever anything in today's checklist becomes true, ensure today is in history
  useEffect(() => {
    const anyDone = checklist.workoutDone || Object.values(checklist.meals || {}).some(Boolean);
    if (anyDone) {
      setHistory((prev) => (prev.includes(todayKey) ? prev : [...prev, todayKey]));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checklist]);

  const [weightInput, setWeightInput] = useState(profile.weight);
  const logWeight = () => {
    const w = Number(weightInput);
    if (!w || w < 30 || w > 250) return;
    setWeightLog((prev) => {
      const filtered = prev.filter((e) => e.date !== todayKey);
      return [...filtered, { date: todayKey, weight: w }].sort((a, b) => (a.date > b.date ? 1 : -1));
    });
  };

  const chartData = weightLog.slice(-30).map((e) => ({ date: e.date.slice(5), weight: e.weight }));

  const [exId, setExId] = useState(EXERCISES[0].id);
  const [minutes, setMinutes] = useState(30);
  const ex = EXERCISES.find((e) => e.id === exId);
  const burned = burnCalories(ex.met, profile.weight, minutes);

  const TABS = [
    { id: "today", label: "Today" },
    { id: "overview", label: "Targets" },
    { id: "week", label: "Week plan" },
    { id: "burn", label: "Burn calc" },
  ];

  return (
    <div className="gg-body" style={{ maxWidth: 720, margin: "0 auto", padding: "28px 20px 60px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div>
          <div className="gg-display" style={{ fontSize: 13, color: COLOR.brass, letterSpacing: "0.18em", textTransform: "uppercase" }}>Fitness Freek</div>
          <h1 className="gg-display" style={{ fontSize: 26, color: COLOR.text, margin: "2px 0 0", fontWeight: 600 }}>
            {today.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}
          </h1>
        </div>
        <div style={{ textAlign: "right" }}>
          <div className="gg-mono" style={{ fontSize: 20, color: streak > 0 ? COLOR.brass : COLOR.textDim, fontWeight: 600 }}>
            {streak} {streak === 1 ? "day" : "days"}
          </div>
          <div style={{ fontSize: 10, color: COLOR.textDim, textTransform: "uppercase" }}>streak</div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 4, borderBottom: `1px solid ${COLOR.hairline}`, marginBottom: 20, overflowX: "auto" }}>
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className="gg-tab gg-display"
            style={{
              padding: "10px 14px",
              background: "transparent",
              border: "none",
              borderBottom: `2px solid ${tab === t.id ? COLOR.brass : "transparent"}`,
              color: tab === t.id ? COLOR.text : COLOR.textDim,
              fontSize: 13,
              letterSpacing: "0.04em",
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            {t.label}
          </button>
        ))}
        <button
          type="button"
          onClick={onReset}
          className="gg-btn"
          style={{ marginLeft: "auto", background: "transparent", border: "none", color: COLOR.textDim, fontSize: 12, cursor: "pointer", padding: "10px 4px" }}
        >
          Edit details
        </button>
      </div>

      {tab === "today" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Card>
            <TapeGauge label="Calories so far (planned)" value={dayTotals.cal} target={targets.calories} unit="kcal" color={COLOR.brass} />
          </Card>

          <Card>
            <SectionLabel>Today's meals</SectionLabel>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {Object.keys(todayDiet).map((slot) => {
                const items = todayDiet[slot];
                const t = totalsOf(items);
                const done = !!checklist.meals?.[slot];
                return (
                  <div key={slot} style={{ display: "flex", alignItems: "flex-start", gap: 12, borderBottom: `1px solid ${COLOR.hairline}`, paddingBottom: 10 }}>
                    <input type="checkbox" className="gg-check" checked={done} onChange={(e) => markMeal(slot, e.target.checked)} style={{ marginTop: 3 }} />
                    <div style={{ flex: 1, opacity: done ? 0.55 : 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ fontSize: 13, color: COLOR.text, fontWeight: 600, textDecoration: done ? "line-through" : "none" }}>{MEAL_LABEL[slot]}</span>
                        <span className="gg-mono" style={{ fontSize: 12, color: COLOR.textDim }}>{t.cal} kcal</span>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 4 }}>
                        {items.map((it) => (
                          <div key={it.id} style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 6 }}>
                            <span style={{ fontSize: 12, color: COLOR.textDim }}>
                              {it.name}{it.qty !== 1 ? ` ×${it.qty}` : ""}
                            </span>
                            {it.tags.map((tag) => (
                              <span
                                key={tag.label}
                                style={{
                                  fontSize: 9,
                                  textTransform: "uppercase",
                                  letterSpacing: "0.04em",
                                  color: tag.color,
                                  border: `1px solid ${tag.color}`,
                                  borderRadius: 999,
                                  padding: "1px 6px",
                                }}
                              >
                                {tag.label}
                              </span>
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card>
            <SectionLabel right={<span style={{ fontSize: 10, color: COLOR.brass, textTransform: "uppercase" }}>Program week {programWeek}</span>}>
              Today's training
            </SectionLabel>
            <div style={{ fontSize: 11, color: COLOR.textDim, marginBottom: 12, lineHeight: 1.5 }}>
              {WEEK_CUES[weekInCycle]}
            </div>
            {todayWorkout.isRest ? (
              <div style={{ fontSize: 13, color: COLOR.textDim }}>Rest day — light walk or stretching if you feel like moving.</div>
            ) : (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                  <input type="checkbox" className="gg-check" checked={!!checklist.workoutDone} onChange={(e) => markWorkout(e.target.checked)} />
                  <span style={{ fontSize: 13, color: COLOR.text, fontWeight: 600, textDecoration: checklist.workoutDone ? "line-through" : "none" }}>
                    {todayWorkout.day} — {todayWorkout.focus}
                  </span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, opacity: checklist.workoutDone ? 0.55 : 1 }}>
                  {todayWorkout.items.map((it, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: COLOR.text }}>
                      <span>{it.name}</span>
                      <span className="gg-mono" style={{ color: COLOR.textDim }}>{it.sets} × {it.reps}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </Card>

          <Card>
            <SectionLabel>Log today's weight</SectionLabel>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <input className="gg-input" style={{ ...inputStyle, flex: 1 }} type="number" value={weightInput} onChange={(e) => setWeightInput(e.target.value)} />
              <button type="button" onClick={logWeight} className="gg-btn" style={{ padding: "10px 16px", borderRadius: 6, border: "none", background: COLOR.brass, color: COLOR.ink, fontWeight: 600, cursor: "pointer", fontSize: 13 }}>
                Save
              </button>
            </div>
            {chartData.length > 1 && (
              <div style={{ height: 140, marginTop: 16 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid stroke={COLOR.hairline} strokeDasharray="3 3" />
                    <XAxis dataKey="date" stroke={COLOR.textDim} fontSize={11} />
                    <YAxis stroke={COLOR.textDim} fontSize={11} domain={["auto", "auto"]} />
                    <Tooltip contentStyle={{ background: COLOR.panel2, border: `1px solid ${COLOR.hairline}`, fontSize: 12 }} labelStyle={{ color: COLOR.text }} />
                    <Line type="monotone" dataKey="weight" stroke={COLOR.brass} strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
            <p style={{ fontSize: 11, color: COLOR.textDim, marginTop: 10 }}>
              Your targets recalculate from whatever weight you last logged — update "Edit details" with your new
              weight periodically to keep calories accurate as you progress.
            </p>
          </Card>

          {notes.length > 0 && (
            <Card>
              <SectionLabel>Notes for your conditions</SectionLabel>
              <ul style={{ margin: 0, paddingLeft: 18, color: COLOR.text, fontSize: 13, lineHeight: 1.7 }}>
                {notes.map((n, i) => <li key={i}>{n}</li>)}
              </ul>
            </Card>
          )}
        </div>
      )}

      {tab === "overview" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Card>
            <SectionLabel>Daily targets</SectionLabel>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 11, color: COLOR.textDim, textTransform: "uppercase" }}>BMR</div>
                <div className="gg-mono" style={{ fontSize: 20, color: COLOR.text }}>{targets.bmr}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: COLOR.textDim, textTransform: "uppercase" }}>TDEE</div>
                <div className="gg-mono" style={{ fontSize: 20, color: COLOR.text }}>{targets.tdee}</div>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <TapeGauge label="Calories" value={dayTotals.cal} target={targets.calories} unit="kcal" color={COLOR.brass} />
              <TapeGauge label="Protein" value={dayTotals.p} target={targets.protein} unit="g" color={COLOR.sage} />
              <TapeGauge label="Carbs" value={dayTotals.c} target={targets.carbs} unit="g" color={COLOR.brassDim} />
              <TapeGauge label="Fat" value={dayTotals.f} target={targets.fat} unit="g" color={COLOR.clay} />
            </div>
          </Card>
          <Card>
            <SectionLabel>Micronutrients (today's plan)</SectionLabel>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <TapeGauge label="Potassium" value={dayTotals.k} target={targets.potassium} unit="mg" color={COLOR.brassDim} sub="Balances sodium, supports heart & muscle function" />
              <TapeGauge label="Calcium" value={dayTotals.ca} target={targets.calcium} unit="mg" color={COLOR.brass} sub="Bone density" />
              <TapeGauge label="Iron" value={dayTotals.fe} target={targets.iron} unit="mg" color={COLOR.clay} sub="Oxygen transport, prevents anemia" />
              <TapeGauge label="Vitamin C" value={dayTotals.vc} target={targets.vitC} unit="mg" color={COLOR.sage} sub="Immunity, helps absorb iron" />
              <TapeGauge label="Vitamin D" value={dayTotals.vd} target={targets.vitD} unit="mcg" color={COLOR.sage} sub="Bone health, immune function" />
              <TapeGauge label="Fiber" value={dayTotals.fiber || 0} target={targets.fiber} unit="g" color={COLOR.brassDim} />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: COLOR.text, paddingTop: 4 }}>
                <span>Sodium (keep under)</span>
                <span className="gg-mono" style={{ color: dayTotals.na > targets.sodium ? COLOR.clay : COLOR.textDim }}>
                  {Math.round(dayTotals.na)} / {targets.sodium} mg
                </span>
              </div>
            </div>
            <p style={{ fontSize: 11, color: COLOR.textDim, marginTop: 12, lineHeight: 1.5 }}>
              These are general RDA-style targets adjusted for age, sex, and any conditions you flagged — not a
              personalized medical prescription.
            </p>
          </Card>
        </div>
      )}

      {tab === "week" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Card style={{ background: COLOR.panel2 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span className="gg-display" style={{ fontSize: 13, color: COLOR.brass, letterSpacing: "0.08em" }}>
                PROGRAM WEEK {programWeek} <span style={{ color: COLOR.textDim }}>(block {weekInCycle} of 4)</span>
              </span>
            </div>
            <div style={{ fontSize: 12, color: COLOR.textDim, marginTop: 6, lineHeight: 1.5 }}>{WEEK_CUES[weekInCycle]}</div>
          </Card>
          {week.map((d, i) => {
            const isToday = i === dow;
            const dayName = new Date(2024, 0, 7 + i).toLocaleDateString(undefined, { weekday: "long" }); // Jan 7 2024 was a Sunday
            return (
              <Card key={i} style={isToday ? { border: `1px solid ${COLOR.brass}` } : undefined}>
                <SectionLabel right={isToday ? <span style={{ fontSize: 10, color: COLOR.brass, textTransform: "uppercase" }}>Today</span> : null}>
                  {dayName} {d.isRest ? "— Rest" : `— ${d.day}`}
                </SectionLabel>
                {d.isRest ? (
                  <div style={{ fontSize: 13, color: COLOR.textDim }}>Recovery day.</div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {d.items.map((it, j) => (
                      <div key={j} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: COLOR.text, borderBottom: `1px solid ${COLOR.hairline}`, paddingBottom: 8 }}>
                        <span>{it.name}</span>
                        <span className="gg-mono" style={{ color: COLOR.textDim }}>{it.sets} × {it.reps}</span>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {tab === "burn" && (
        <Card>
          <SectionLabel>Calorie burn calculator</SectionLabel>
          <Field label="Activity">
            <select className="gg-select" style={inputStyle} value={exId} onChange={(e) => setExId(e.target.value)}>
              {EXERCISES.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          </Field>
          <Field label={`Duration: ${minutes} min`}>
            <input type="range" min={5} max={120} step={5} value={minutes} onChange={(e) => setMinutes(Number(e.target.value))} style={{ width: "100%" }} />
          </Field>
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div className="gg-mono" style={{ fontSize: 40, color: COLOR.brass, fontWeight: 600 }}>{burned}</div>
            <div style={{ fontSize: 12, color: COLOR.textDim, textTransform: "uppercase", letterSpacing: "0.08em" }}>kcal burned, estimated</div>
          </div>
          <p style={{ fontSize: 11, color: COLOR.textDim, lineHeight: 1.5, textAlign: "center" }}>
            Based on your bodyweight ({profile.weight}kg) and a MET value of {ex.met} for {ex.name.toLowerCase()}.
          </p>
        </Card>
      )}
    </div>
  );
}

/* =========================================================================
   INSTALL / SHARE / VISITOR COUNT
   ========================================================================= */
function isIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}
function isStandalone() {
  return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
}

function useInstallPrompt() {
  const [deferred, setDeferred] = useState(null);
  const [installed, setInstalled] = useState(isStandalone());

  useEffect(() => {
    const onPrompt = (e) => {
      e.preventDefault();
      setDeferred(e);
    };
    const onInstalled = () => setInstalled(true);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const promptInstall = async () => {
    if (!deferred) return "unavailable";
    deferred.prompt();
    const choice = await deferred.userChoice;
    setDeferred(null);
    return choice.outcome; // "accepted" | "dismissed"
  };

  return { canPrompt: !!deferred, installed, promptInstall };
}

function InstallButton() {
  const { canPrompt, installed, promptInstall } = useInstallPrompt();
  const [msg, setMsg] = useState("");

  if (installed) {
    return <span style={{ fontSize: 11, color: COLOR.sage }}>Installed ✓</span>;
  }

  const handleClick = async () => {
    if (canPrompt) {
      const outcome = await promptInstall();
      if (outcome === "dismissed") setMsg("Maybe next time");
      return;
    }
    if (isIOS()) {
      setMsg("On iPhone: tap Share, then \"Add to Home Screen\"");
    } else {
      setMsg("Open this in Chrome/Edge on your phone to install");
    }
  };

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        className="gg-btn"
        style={{ background: "transparent", border: `1px solid ${COLOR.hairline}`, color: COLOR.textDim, borderRadius: 6, padding: "6px 10px", fontSize: 11, cursor: "pointer" }}
      >
        Install app
      </button>
      {msg && <div style={{ fontSize: 10, color: COLOR.textDim, marginTop: 4, maxWidth: 160 }}>{msg}</div>}
    </div>
  );
}

function ShareButton() {
  const [msg, setMsg] = useState("");
  const handleShare = async () => {
    const shareData = { title: "Fitness Freek", text: "My daily diet & workout planner", url: window.location.href };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (e) {
        // user cancelled — ignore
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareData.url);
        setMsg("Link copied");
        setTimeout(() => setMsg(""), 2000);
      } catch (e) {
        setMsg(shareData.url);
      }
    }
  };
  return (
    <button
      type="button"
      onClick={handleShare}
      className="gg-btn"
      style={{ background: "transparent", border: `1px solid ${COLOR.hairline}`, color: COLOR.textDim, borderRadius: 6, padding: "6px 10px", fontSize: 11, cursor: "pointer" }}
    >
      {msg || "Share"}
    </button>
  );
}

// Anonymous global visit counter — no accounts, no identity, just a running
// total of page loads via a free public counter API (countapi.dev).
// Falls back to a local-only counter if the network call fails.
function useVisitorCount() {
  const [count, setCount] = useState(null);

  useEffect(() => {
    const namespace = "fitness-freek-app-v1";
    const key = "visits";
    fetch(`https://api.countapi.xyz/hit/${namespace}/${key}`)
      .then((r) => r.json())
      .then((d) => setCount(d.value))
      .catch(() => {
        const local = Number(localStorage.getItem("local-visit-count") || "0") + 1;
        localStorage.setItem("local-visit-count", String(local));
        setCount(local);
      });
  }, []);

  return count;
}

function VisitorBadge() {
  const count = useVisitorCount();
  return (
    <div style={{ fontSize: 10, color: COLOR.textDim, textAlign: "right" }}>
      {count === null ? "—" : count.toLocaleString()} visits
    </div>
  );
}

function SignOutButton() {
  const { signOut } = useAuth();
  return (
    <button
      type="button"
      onClick={signOut}
      className="gg-btn"
      style={{ background: "transparent", border: `1px solid ${COLOR.hairline}`, color: COLOR.textDim, borderRadius: 6, padding: "6px 10px", fontSize: 11, cursor: "pointer" }}
    >
      Sign out
    </button>
  );
}

/* =========================================================================
   ROOT
   ========================================================================= */
export default function App({ userId }) {
  const [profile, setProfile] = useStorageState("profile", null);
  const [editing, setEditing] = useState(false);

  return (
    <div style={{ minHeight: "100vh", background: COLOR.ink, position: "relative" }}>
      <style>{FONT_STYLE}</style>

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "14px 20px 0", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
        <VisitorBadge />
        <div style={{ display: "flex", gap: 8 }}>
          <ShareButton />
          <InstallButton />
          <SignOutButton />
        </div>
      </div>

      {profile && !editing ? (
        <Dashboard profile={profile} onReset={() => setEditing(true)} userId={userId} />
      ) : (
        <Onboarding
          initial={profile}
          onSubmit={(p) => {
            setProfile(p);
            setEditing(false);
          }}
        />
      )}
    </div>
  );
}
