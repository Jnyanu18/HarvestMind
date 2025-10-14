
'use server';

import {
  chatAssistantForInsights,
  type ChatAssistantForInsightsInput,
} from '@/ai/flows/chat-assistant-for-insights';
import {
  marketPriceForecasting,
  type MarketPriceForecastingInput,
} from '@/ai/flows/market-price-forecasting';
import {
  analyzeTomato,
  type AnalyzeTomatoInput,
} from '@/ai/flows/tomato-analysis';

export async function runMarketPriceForecasting(
  input: MarketPriceForecastingInput
) {
  try {
    const result = await marketPriceForecasting(input);
    return { success: true, data: result };
  } catch (error) {
    console.error('Error in market price forecasting flow:', error);
    return { success: false, error: 'Failed to forecast market prices.' };
  }
}

export async function runChatAssistant(input: ChatAssistantForInsightsInput) {
  try {
    const result = await chatAssistantForInsights(input);
    return { success: true, data: result };
  } catch (error) {
    console.error('Error in chat assistant flow:', error);
    return { success: false, error: 'The assistant is currently unavailable.' };
  }
}

export async function runTomatoAnalysis(input: AnalyzeTomatoInput) {
  try {
    const result = await analyzeTomato(input);
    return { success: true, data: result };
  } catch (error) {
    console.error('Error in tomato analysis flow:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during analysis.';
    return { success: false, error: errorMessage };
  }
}
