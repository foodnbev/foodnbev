export const STATUS_LABEL = {
  planning: "Planning",
  underway: "Underway",
  completed: "Completed",
  unknown: "Unknown",
} as const;
export type ProjectStatus = keyof typeof STATUS_LABEL;

export const FACILITY_LABEL = {
  brewery: "Brewery",
  distillery: "Distillery",
  food_processing: "Food processing",
} as const;
export type FacilityType = keyof typeof FACILITY_LABEL;

export const FOOD_SUBTYPE_LABEL = {
  meat: "Meat",
  fish: "Fish",
  snacks: "Snacks",
  coldroom: "Coldroom",
  other: "Other",
} as const;
export type FoodSubtype = keyof typeof FOOD_SUBTYPE_LABEL;

export const WORK_TYPE_LABEL = {
  newbuild: "New build",
  extension: "Extension",
  refurbishment: "Refurbishment",
  modification: "Modification",
} as const;
export type WorkType = keyof typeof WORK_TYPE_LABEL;

export const PARTY_CATEGORY_LABEL = {
  end_user: "End-user in charge",
  architect: "Architect",
  general_contractor: "General contractor",
  me: "M&E",
  real_estate_planner: "Real estate planner",
  consultant: "Consultant",
  flooring: "Flooring company",
  groundworks: "Groundworks / Civil",
  drainage: "Drainage",
  other: "Other",
} as const;
export type PartyCategory = keyof typeof PARTY_CATEGORY_LABEL;

export const PARTY_CATEGORY_ORDER: PartyCategory[] = [
  "end_user",
  "architect",
  "general_contractor",
  "me",
  "real_estate_planner",
  "consultant",
  "flooring",
  "groundworks",
  "drainage",
  "other",
];

export const STATUS_TONE: Record<ProjectStatus, string> = {
  planning: "fnb-chip-teal",
  underway: "fnb-chip-sand",
  completed: "fnb-chip-ink",
  unknown: "fnb-chip",
};

export const COMPANY_CATEGORY_LABEL = {
  architect: "Architect",
  general_contractor: "General contractor",
  flooring: "Flooring",
  groundworks: "Groundworks",
  other: "Other",
} as const;
export type CompanyCategory = keyof typeof COMPANY_CATEGORY_LABEL;
export const COMPANY_CATEGORY_ORDER: CompanyCategory[] = [
  "architect", "general_contractor", "flooring", "groundworks", "other",
];
