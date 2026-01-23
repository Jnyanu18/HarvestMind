import { genkitAPIRoute } from "@genkit-ai/next";
import '@/ai/index'; // Make sure all flows are loaded

export const { GET, POST } = genkitAPIRoute();
