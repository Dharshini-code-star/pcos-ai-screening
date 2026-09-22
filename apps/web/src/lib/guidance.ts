import type { AssessRequest } from "@/lib/ml/types";

/**
 * PCOSense Personalized Guidance.
 *
 * General, evidence-aligned LIFESTYLE guidance — deliberately not a medical
 * diet, not a treatment plan, and not weight-loss advice. Hard rules this
 * module keeps:
 *   - no calorie targets, no macros, no supplements, no medication,
 *   - no "PCOS diet" and no foods-to-avoid blacklist,
 *   - no claim that any of this treats, reduces, or cures PCOS,
 *   - BMI is never used to trigger weight-loss advice or judgemental copy;
 *     weight only appears if the USER picks "maintain current weight".
 *
 * Everything here is derived from answers the user already gave — no new
 * model, no new scoring, no backend call.
 */

export type GuidanceGoal =
  | "general"
  | "maintain_weight"
  | "activity"
  | "eating"
  | "routine"
  | "consultation";

export const GUIDANCE_GOALS: { value: GuidanceGoal; label: string }[] = [
  { value: "general", label: "General healthy lifestyle" },
  { value: "maintain_weight", label: "Maintain current weight" },
  { value: "activity", label: "Improve physical activity" },
  { value: "eating", label: "Improve eating habits" },
  { value: "routine", label: "Improve routine consistency" },
  { value: "consultation", label: "Prepare for a healthcare consultation" },
];

export interface GuidanceCard {
  key: "food" | "movement" | "hydration" | "sleep";
  title: string;
  recommendation: string;
  why: string;
  action: string;
  /** Shown behind "Why am I seeing this?" — references the user's own inputs. */
  reason: string;
}

export interface TodaysFocus {
  text: string;
  reason: string;
}

export interface WeeklyGoal {
  id: string;
  label: string;
}

export interface GuidancePlan {
  focus: TodaysFocus;
  cards: GuidanceCard[];
  weeklyGoals: WeeklyGoal[];
}

const GENERIC_REASON =
  "This is general guidance shown to everyone, not something selected from your answers.";

/** §3 — one primary focus, chosen from information the user already gave. */
function buildFocus(a: AssessRequest, goal: GuidanceGoal): TodaysFocus {
  const lifestyleUnknown = a.regular_exercise == null && a.fast_food == null;

  if (lifestyleUnknown) {
    return {
      text: "Start by tracking one healthy habit today.",
      reason:
        "You didn't answer the lifestyle questions in your screening, so PCOSense couldn't tell which area would be most useful to focus on.",
    };
  }

  if (goal === "consultation") {
    return {
      text: "Note down your recent cycle dates and any symptom changes to bring to your appointment.",
      reason:
        "You chose \"Prepare for a healthcare consultation\" as your goal, so PCOSense focused on what is useful to have ready for that conversation.",
    };
  }

  if (a.regular_exercise === false || goal === "activity") {
    return {
      text: "Add a manageable period of movement.",
      reason:
        a.regular_exercise === false
          ? "You reported that you do not exercise regularly, so PCOSense selected physical activity as one area to focus on. This contributed to your screening profile."
          : "You chose \"Improve physical activity\" as your goal, so PCOSense made movement today's focus.",
    };
  }

  if (a.fast_food === true || goal === "eating") {
    return {
      text: "Make one meal today more balanced with vegetables and a protein source.",
      reason:
        a.fast_food === true
          ? "You reported eating fast food frequently, so PCOSense selected eating habits as one area to focus on. This contributed to your screening profile."
          : "You chose \"Improve eating habits\" as your goal, so PCOSense made a balanced meal today's focus.",
    };
  }

  if (goal === "routine") {
    return {
      text: "Pick a consistent wake-up time and keep it today.",
      reason:
        "You chose \"Improve routine consistency\" as your goal, so PCOSense focused on daily rhythm.",
    };
  }

  return {
    text: "Maintain the healthy habits that are already working for you.",
    reason:
      "Your reported lifestyle answers were already favourable, so PCOSense is suggesting you keep them going rather than change anything.",
  };
}

/** §2 — the four daily cards, lightly adapted to the user's own answers. */
function buildCards(a: AssessRequest, goal: GuidanceGoal): GuidanceCard[] {
  const eatingFocused = a.fast_food === true || goal === "eating";
  const activityFocused = a.regular_exercise === false || goal === "activity";
  const routineFocused = goal === "routine" || a.cycle_regularity === true;

  return [
    {
      key: "food",
      title: "Food",
      recommendation:
        "Build meals around vegetables, a protein source, and a fibre-rich carbohydrate.",
      why: "Balanced, sustainable eating is recommended as part of healthy lifestyle management. No single diet composition is recommended over another for PCOS.",
      action: eatingFocused
        ? "Add a vegetable to one meal today."
        : "Keep one meal today built around that balance.",
      reason: eatingFocused
        ? a.fast_food === true
          ? "You reported eating fast food frequently, so PCOSense highlighted balanced meals. This contributed to your screening profile."
          : "You chose \"Improve eating habits\" as your goal."
        : GENERIC_REASON,
    },
    {
      key: "movement",
      title: "Movement",
      recommendation: "Choose an activity you enjoy and can maintain consistently.",
      why: "Regular physical activity supports general and metabolic health.",
      action: activityFocused
        ? "Take a 10-minute walk today — short and repeatable beats intense and occasional."
        : "Keep your usual activity going today.",
      reason: activityFocused
        ? a.regular_exercise === false
          ? "You reported that you do not exercise regularly, so PCOSense selected physical activity as one area to focus on. This contributed to your screening profile."
          : "You chose \"Improve physical activity\" as your goal."
        : GENERIC_REASON,
    },
    {
      key: "hydration",
      title: "Hydration",
      recommendation:
        "Keep water available throughout the day and drink according to your individual needs.",
      why: "Staying hydrated supports everyday wellbeing. There is no PCOS-specific water target.",
      action: "Keep a filled bottle where you'll actually see it.",
      reason: GENERIC_REASON,
    },
    {
      key: "sleep",
      title: "Sleep / Routine",
      recommendation: "Try to keep a consistent sleep and wake schedule.",
      why: "Consistent routine supports general wellbeing, and regular habits are easier to sustain over time.",
      action: routineFocused
        ? "Set one fixed wake-up time for tomorrow."
        : "Aim to wind down at a similar time tonight.",
      reason: routineFocused
        ? a.cycle_regularity === true
          ? "You reported an irregular cycle. Tracking a steady daily routine can make it easier to notice patterns over time — this is about consistency of tracking, not a treatment for cycle irregularity."
          : "You chose \"Improve routine consistency\" as your goal."
        : GENERIC_REASON,
    },
  ];
}

/** §4 — three simple, checkable weekly goals. */
function buildWeeklyGoals(a: AssessRequest, goal: GuidanceGoal): WeeklyGoal[] {
  const goals: WeeklyGoal[] = [
    { id: "veg-meal", label: "Include a vegetable-rich meal each day" },
    { id: "movement", label: "Add regular movement during the week" },
    { id: "sleep", label: "Track sleep consistency" },
  ];

  if (a.regular_exercise === false || goal === "activity") {
    goals[1] = { id: "movement", label: "Move for at least 10 minutes on 4 days this week" };
  }
  if (a.fast_food === true || goal === "eating") {
    goals[0] = { id: "veg-meal", label: "Swap one fast-food meal for a home-style balanced meal" };
  }
  if (goal === "consultation") {
    goals[2] = { id: "sleep", label: "Write down your cycle dates and symptom changes for your appointment" };
  } else if (goal === "routine") {
    goals[2] = { id: "sleep", label: "Keep the same wake-up time on 5 days this week" };
  }

  return goals;
}

export function buildGuidancePlan(a: AssessRequest, goal: GuidanceGoal): GuidancePlan {
  return {
    focus: buildFocus(a, goal),
    cards: buildCards(a, goal),
    weeklyGoals: buildWeeklyGoals(a, goal),
  };
}

/**
 * §6 — flexible meal EXAMPLES, not a prescribed plan and not a food blacklist.
 * `diet` is here so vegetarian/non-vegetarian filtering can be added later
 * without reshaping this data; nothing is filtered today.
 */
export const MEAL_EXAMPLES: { meal: string; example: string; diet: "veg" | "any" }[] = [
  { meal: "Breakfast", example: "Idli + sambar + a side of vegetables", diet: "veg" },
  { meal: "Breakfast", example: "Dosa + sambar + a protein-rich side", diet: "veg" },
  { meal: "Lunch", example: "Rice + dal + vegetables + curd", diet: "veg" },
  { meal: "Dinner", example: "Chapati + dal or paneer + vegetables", diet: "veg" },
  { meal: "Snack", example: "Fruit + a small handful of nuts", diet: "veg" },
];

export const GUIDANCE_DISCLAIMER =
  "PCOSense provides general lifestyle guidance, not medical treatment or a personalized medical diet. For individualized nutrition advice, especially when you have a medical condition, are pregnant, or have specific dietary needs, consult a qualified healthcare professional or dietitian.";
