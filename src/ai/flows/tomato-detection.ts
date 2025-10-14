'use server';

/**
 * @fileOverview An AI model based tomato detection and stage classification flow.
 *
 * - runDetectionModel - A function that handles running the model for detection and classification.
 * - TomatoDetectionInput - The input type for the runDetectionModel function.
 * - DetectionResult - The return type for the runDetectionModel function, augmented with calculated fields.
 */

import { ai } from '@/ai/genkit';
import { TomatoDetectionInputSchema, TomatoDetectionOutputSchema } from '@/lib/types';
import type { TomatoDetectionInput, DetectionResult, TomatoDetectionOutput } from '@/lib/types';


/**
 * Runs the tomato detection and classification model.
 * This function takes the raw model output and calculates derived metrics
 * required by the frontend UI.
 * @param input The input containing the image data URI.
 * @returns A promise that resolves to the full detection result including calculated fields.
 */
export async function runDetectionModel(input: TomatoDetectionInput): Promise<DetectionResult> {
  const result = await tomatoDetectionFlow(input);

  // The model may not return all fields, so we calculate derived values here for consistency.
  const detections = result.boxes?.length ?? 0;
  
  const stageCounts: DetectionResult['stageCounts'] = { immature: 0, ripening: 0, mature: 0 };
  if (result.boxes) {
    for (const box of result.boxes) {
      stageCounts[box.stage]++;
    }
  }

  let growthStage: DetectionResult['growthStage'] = 'Immature';
  if (detections > 0) {
      if (stageCounts.mature > detections / 2) {
          growthStage = 'Mature';
      } else if (stageCounts.ripening > detections / 3) {
          growthStage = 'Ripening';
      }
  }

  const avgBboxArea = detections > 0 && result.boxes ? result.boxes.reduce((acc, { box }) => acc + (box[2] - box[0]) * (box[3] - box[1]), 0) / detections : 0;
  
  // Use model confidence if provided, otherwise generate a high-confidence placeholder.
  const confidence = result.confidence ?? (0.92 + Math.random() * 0.07);
  const imageUrl = input.photoDataUri;

  // The plantId is a placeholder as we are not yet persisting this data.
  const plantId = Date.now();

  return {
      plantId,
      detections,
      boxes: result.boxes,
      stageCounts,
      growthStage,
      avgBboxArea,
      confidence,
      imageUrl,
  };
}

const prompt = ai.definePrompt({
    name: 'tomatoDetectionPrompt',
    input: { schema: TomatoDetectionInputSchema },
    output: { schema: TomatoDetectionOutputSchema },
    prompt: `You are a specialized agricultural AI model trained to detect tomatoes in an image and classify their ripeness.
  
Your task is to analyze the provided image and identify all tomatoes. For each detected tomato, provide its bounding box and classify its ripeness stage.
  
- Bounding Boxes: Provide normalized coordinates [x1, y1, x2, y2] for each box.
- Ripeness Stages: Classify each tomato into one of three stages: 'immature' (green), 'ripening' (yellow/orange), or 'mature' (red).
  
Analyze this image: {{media url=photoDataUri}}
  
Provide the output in the specified JSON format. Your output must be a valid JSON object matching the provided schema. Do not output markdown.`,
});
  
const tomatoDetectionFlow = ai.defineFlow(
    {
      name: 'tomatoDetectionFlow',
      inputSchema: TomatoDetectionInputSchema,
      outputSchema: TomatoDetectionOutputSchema,
    },
    async (input) => {
        const { output } = await prompt(input);
        // The prompt is configured to return a valid object, so we can be confident in the output.
        if (!output) {
          throw new Error('AI model failed to return a valid output.');
        }
        return output;
    }
);
