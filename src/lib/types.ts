import { z } from 'zod';

export type Stage = 'immature' | 'ripening' | 'mature';

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

// This is the primary type for what the UI components will use.
// It's derived from the AI model's output but contains additional calculated fields.
export interface DetectionResult {
  plantId: number;
  detections: number;
  boxes: DetectionBox[];
  stageCounts: Record<Stage, number>;
  growthStage: 'Immature' | 'Ripening' | 'Mature';
  avgBboxArea: number;
  confidence: number;
  imageUrl: string;
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

// Input for the AI detection flow
export const TomatoDetectionInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a plant, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type TomatoDetectionInput = z.infer<typeof TomatoDetectionInputSchema>;


// The direct output from the AI detection model.
const DetectionBoxSchema = z.object({
  box: z.tuple([z.number(), z.number(), z.number(), z.number()]).describe("Bounding box coordinates [x1, y1, x2, y2] as percentages."),
  stage: z.enum(['immature', 'ripening', 'mature']).describe("Ripeness stage of the tomato."),
});

export const TomatoDetectionOutputSchema = z.object({
  boxes: z.array(DetectionBoxSchema).describe('An array of detected tomato boxes with their stages.'),
  confidence: z.number().optional().describe('The model\'s confidence score for the overall detection (from 0 to 1).'),
});
export type TomatoDetectionOutput = z.infer<typeof TomatoDetectionOutputSchema>;
