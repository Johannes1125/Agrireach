/**
 * Skills utilities for small-scale agriculture
 * Focused on farmers, fishers, and small farms
 */

export type SkillLevel = 1 | 2 | 3 | 4;

export const SKILL_LEVELS = {
  1: "Beginner",
  2: "Intermediate",
  3: "Advanced",
  4: "Expert",
} as const;

export const SKILL_LEVEL_COLORS = {
  1: "bg-gray-100 text-gray-700 border-gray-300",
  2: "bg-blue-100 text-blue-700 border-blue-300",
  3: "bg-green-100 text-green-700 border-green-300",
  4: "bg-yellow-100 text-yellow-700 border-yellow-300",
} as const;

export interface Skill {
  name: string;
  level: SkillLevel;
  category: string;
}

export interface SkillRequirement {
  name: string;
  min_level?: SkillLevel;
  required: boolean;
}

export const SKILL_CATEGORIES = {
  "Crop Farming": [
    "Rice Cultivation",
    "Vegetable Farming",
    "Fruit Growing",
    "Crop Harvesting",
    "Seed Planting",
    "Organic Farming",
    "Crop Rotation",
    "Composting",
    "Pest Management",
    "Weed Control",
    "Soil Preparation",
    "Seedling Care",
  ],
  "Livestock & Poultry": [
    "Pig Raising",
    "Chicken Farming",
    "Goat Rearing",
    "Cattle Care",
    "Duck Farming",
    "Livestock Feeding",
    "Animal Health",
    "Breeding",
    "Milking",
    "Egg Collection",
    "Poultry Management",
    "Livestock Housing",
  ],
  "Fishing & Aquaculture": [
    "Fish Farming",
    "Net Fishing",
    "Aquaculture",
    "Fish Processing",
    "Boat Operation",
    "Catch Handling",
    "Fish Preservation",
    "Aquatic Farming",
    "Crab Farming",
    "Shrimp Farming",
    "Fish Feeding",
    "Water Quality Management",
  ],
  "Equipment & Tools": [
    "Hand Tools",
    "Farm Machinery",
    "Tractor Operation",
    "Irrigation Systems",
    "Harvesting Equipment",
    "Maintenance & Repair",
    "Tool Sharpening",
    "Equipment Safety",
    "Basic Repairs",
  ],
  "Processing & Value-Adding": [
    "Food Processing",
    "Packaging",
    "Drying & Preservation",
    "Fermentation",
    "Product Quality Control",
    "Traditional Methods",
    "Pickling",
    "Smoking",
    "Canning",
    "Product Labeling",
  ],
  "Farm Management": [
    "Farm Planning",
    "Resource Management",
    "Record Keeping",
    "Budget Management",
    "Market Knowledge",
    "Customer Relations",
    "Seasonal Planning",
    "Inventory Management",
    "Sales & Marketing",
    "Farm Safety",
    "Logistics Coordination",
    "Team Leadership",
    "Compliance Management",
  ],
} as const;

export type SkillCategory = keyof typeof SKILL_CATEGORIES;

export const CATEGORY_COLORS: Record<SkillCategory, string> = {
  "Crop Farming": "bg-green-50 text-green-700 border-green-200",
  "Livestock & Poultry": "bg-amber-50 text-amber-700 border-amber-200",
  "Fishing & Aquaculture": "bg-blue-50 text-blue-700 border-blue-200",
  "Equipment & Tools": "bg-gray-50 text-gray-700 border-gray-200",
  "Processing & Value-Adding": "bg-orange-50 text-orange-700 border-orange-200",
  "Farm Management": "bg-purple-50 text-purple-700 border-purple-200",
};

/**
 * Get all available skills as a flat array
 */
export function getAllSkills(): string[] {
  return Object.values(SKILL_CATEGORIES).flat();
}

/**
 * Get category for a skill
 */
export function getSkillCategory(skillName: string): SkillCategory | null {
  for (const [category, skills] of Object.entries(SKILL_CATEGORIES)) {
    if ((skills as readonly string[]).includes(skillName)) {
      return category as SkillCategory;
    }
  }
  return null;
}

/**
 * Normalize skills to new format (for backward compatibility)
 */
export function normalizeSkills(
  skills: string[] | Skill[] | undefined
): Skill[] {
  if (!skills || skills.length === 0) return [];

  // If already in new format
  if (typeof skills[0] === "object" && "name" in skills[0]) {
    return skills as Skill[];
  }

  // Convert old string format to new format
  return (skills as string[]).map((skill) => ({
    name: skill,
    level: 2 as SkillLevel, // Default to Intermediate
    category: getSkillCategory(skill) || "Farm Management",
  }));
}

/**
 * Normalize skill requirements
 */
export function normalizeSkillRequirements(
  requirements: string[] | SkillRequirement[] | undefined
): SkillRequirement[] {
  if (!requirements || requirements.length === 0) return [];

  // If already in new format
  if (typeof requirements[0] === "object" && "name" in requirements[0]) {
    return requirements as SkillRequirement[];
  }

  // Convert old string format to new format
  return (requirements as string[]).map((skill) => ({
    name: skill,
    required: true,
  }));
}

/**
 * Calculate match score between job requirements and worker skills
 */
export function calculateMatchScore(
  jobSkills: SkillRequirement[] | string[],
  workerSkills: Skill[] | string[]
): {
  score: number;
  matched: number;
  total: number;
  details: Array<{
    skill: string;
    match: boolean;
    level?: number;
    required_level?: number;
    weight: number;
  }>;
} {
  const normalizedJobSkills = normalizeSkillRequirements(jobSkills);
  const normalizedWorkerSkills = normalizeSkills(workerSkills);

  if (normalizedJobSkills.length === 0) {
    return { score: 0, matched: 0, total: 0, details: [] };
  }

  const details: Array<{
    skill: string;
    match: boolean;
    level?: number;
    required_level?: number;
    weight: number;
  }> = [];

  let totalWeight = 0;
  let matchedWeight = 0;
  let matchedCount = 0;

  for (const jobSkill of normalizedJobSkills) {
    const workerSkill = normalizedWorkerSkills.find(
      (ws) => ws.name.toLowerCase() === jobSkill.name.toLowerCase()
    );

    const weight = jobSkill.required ? 1.0 : 0.5; // Required skills count more
    totalWeight += weight;

    if (workerSkill) {
      const requiredLevel = jobSkill.min_level || 1;
      const workerLevel = workerSkill.level;

      let skillWeight = 0;

      if (workerLevel >= requiredLevel) {
        // Perfect match or exceeds requirement
        skillWeight = weight;
        matchedWeight += weight;
        matchedCount++;
      } else {
        // Partial match - worker has skill but lower level
        const levelGap = requiredLevel - workerLevel;
        skillWeight = weight * (1 - levelGap * 0.25); // Reduce by 25% per level gap
        matchedWeight += skillWeight;
        matchedCount++;
      }

      details.push({
        skill: jobSkill.name,
        match: true,
        level: workerLevel,
        required_level: requiredLevel,
        weight: skillWeight,
      });
    } else {
      // Skill not found
      details.push({
        skill: jobSkill.name,
        match: false,
        required_level: jobSkill.min_level || 1,
        weight: 0,
      });
    }
  }

  const score = totalWeight > 0 ? Math.round((matchedWeight / totalWeight) * 100) : 0;

  return {
    score,
    matched: matchedCount,
    total: normalizedJobSkills.length,
    details,
  };
}

/**
 * Group skills by category
 */
export function groupSkillsByCategory(skills: Skill[]): Record<string, Skill[]> {
  const grouped: Record<string, Skill[]> = {};

  for (const skill of skills) {
    if (!grouped[skill.category]) {
      grouped[skill.category] = [];
    }
    grouped[skill.category].push(skill);
  }

  return grouped;
}

