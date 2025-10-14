
import { z } from 'zod';

export type Stage = 'immature' | 'ripening' | 'mature' | 'flower';

export interface AppControls {
  avgWeightG: number;
  postHarvestLossPct: number;
  numPlants: number;
  forecastDays: number;
  gddBaseC: number;
  harvestCapacityKgDay: number;
  useDetectionModel: boolean;
  useLiveWeather: boolean;
  includePriceForecast: boolean;
  district: string;
}

export interface DetectionBox {
  box: [number, number, number, number]; // [x1, y1, x2, y2] percentages
  stage: Stage;
}

export interface DetectionResult {
  plantId: number;
  detections: number;
  boxes: DetectionBox[];
  stageCounts: Record<Stage, number>;
  growthStage: 'Immature' | 'Ripening' | 'Mature';
  avgBboxArea: number;
  confidence: number;
  imageUrl: string;
  summary?: string;
}

export interface DailyForecast {
  date: string;
  ready_kg: number;
  gdd_cum: number;
}

export interface HarvestTask {
  date: string;
  harvest_kg: number;
}

export interface ForecastResult {
  yield_now_kg: number;
  sellable_kg: number;
  daily: DailyForecast[];
  harvest_plan: HarvestTask[];
  notes: string[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: React.ReactNode;
}


// == AI Flow Schemas ==

export const AnalyzeTomatoInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a plant, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  contentType: z.string().describe('The MIME type of the image, e.g., "image/jpeg".'),
});
export type AnalyzeTomatoInput = z.infer<typeof AnalyzeTomatoInputSchema>;

export const TomatoAnalysisResultSchema = z.object({
  summary: z.string().describe("A short summary of the detection results."),
  counts: z.object({
    flower: z.number().describe("Count of visible flowers."),
    immature: z.number().describe("Count of immature (green) tomatoes."),
    ripening: z.number().describe("Count of ripening (orange/yellow) tomatoes."),
    mature: z.number().describe("Count of mature (red) tomatoes."),
  }).describe("The counts of tomatoes and flowers classified by growth stage."),
});
export type TomatoAnalysisResult = z.infer<typeof TomatoAnalysisResultSchema>;
