
'use server';

import { chatAssistantForInsights, type ChatAssistantForInsightsInput, type ChatAssistantForInsightsOutput } from '@/ai/flows/chat-assistant-for-insights';
import { marketPriceForecasting, type MarketPriceForecastingInput, type MarketPriceForecastingOutput } from '@/ai/flows/market-price-forecasting';
import { analyzePlant } from '@/ai/flows/plant-analysis';
import { forecastYield } from '@/ai/flows/yield-forecasting';
import type { AnalyzePlantInput, PlantAnalysisResult, YieldForecastInput, YieldForecastOutput } from '@/lib/types';

// Generic helper to wrap flow execution and normalize error handling
async function executeFlow<Input, Output>(flow: (input: Input) => Promise<Output>, input: Input): Promise<{ success: boolean; data?: Output; error?: string; }> {
    try {
        const data = await flow(input);
        return { success: true, data };
    } catch (error) {
        console.error(`Error running flow '${flow.name}':`, error);
        let errorMessage = 'An unknown error occurred.';
        if (error instanceof Error) {
             errorMessage = error.message.includes('API key not valid')
                ? 'Your Gemini API key is not valid. Please check your environment variables.'
                : error.message;
        }
        return { success: false, error: errorMessage };
    }
}


export async function runMarketPriceForecasting(input: MarketPriceForecastingInput) {
    return executeFlow<MarketPriceForecastingInput, MarketPriceForecastingOutput>(marketPriceForecasting, input);
}

export async function runChatAssistant(input: ChatAssistantForInsightsInput) {
    return executeFlow<ChatAssistantForInsightsInput, ChatAssistantForInsightsOutput>(chatAssistantForInsights, input);
}

export async function runPlantAnalysis(input: AnalyzePlantInput) {
    return executeFlow<AnalyzePlantInput, PlantAnalysisResult>(analyzePlant, input);
}

export async function runYieldForecast(input: YieldForecastInput): Promise<{ success: boolean, data?: YieldForecastOutput, error?: string }> {
    return executeFlow<YieldForecastInput, YieldForecastOutput>(forecastYield, input);
}
