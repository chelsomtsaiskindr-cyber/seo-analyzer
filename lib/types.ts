export interface CheckItem {
  item: string;
  pass: boolean;
}

export interface CategoryResult {
  score: number;
  details: CheckItem[];
  suggestions: string[];
}

export interface AnalysisResult {
  url: string;
  site_name: string;
  overall_score: number;
  seo: CategoryResult;
  aeo: CategoryResult;
  geo: CategoryResult;
  summary: string;
  analyzedAt: string;
  id: string;
}