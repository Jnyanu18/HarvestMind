
"use client";

import React, { useState, useMemo, useCallback } from 'react';
import { Camera, LineChart, MessageCircle, BarChartIcon } from 'lucide-react';
import type { AppControls, DetectionResult, ForecastResult, ChatMessage, TomatoAnalysisResult } from '@/lib/types';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Sidebar, SidebarContent, SidebarHeader, SidebarInset } from '@/components/ui/sidebar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AgriVisionHeader } from '@/components/agrivision/header';
import { SidebarControls } from '@/components/agrivision/sidebar-controls';
import { DetectionTab } from '@/components/agrivision/detection-tab';
import { ForecastTab } from '@/components/agrivision/forecast-tab';
import { MarketTab } from '@/components/agrivision/market-tab';
import { ChatTab } from '@/components/agrivision/chat-tab';
import { calculateYieldForecast, mockTomatoDetection } from '@/lib/mock-data';
import type { MarketPriceForecastingOutput } from '@/ai/flows/market-price-forecasting';
import { useToast } from '@/hooks/use-toast';
import { runTomatoAnalysis } from '@/app/actions';
import { dataURLtoFile } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';


export function Dashboard() {
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState('detection');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  const [image, setImage] = useState<{ url: string | null; file: File | null, contentType: string | null }>({
    url: PlaceHolderImages[0]?.imageUrl || null,
    file: null,
    contentType: 'image/jpeg', // Default for picsum
  });

  const [controls, setControls] = useState<AppControls>({
    avgWeightG: 85,
    postHarvestLossPct: 7,
    numPlants: 10,
    forecastDays: 14,
    gddBaseC: 10,
    harvestCapacityKgDay: 20,
    useDetectionModel: true,
    useLiveWeather: false,
    includePriceForecast: true,
    district: "Coimbatore",
  });

  const [detectionResult, setDetectionResult] = useState<DetectionResult | null>(null);
  const [forecastResult, setForecastResult] = useState<ForecastResult | null>(null);
  const [marketResult, setMarketResult] = useState<MarketPriceForecastingOutput | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);

  const handleImageUpload = (file: File) => {
    const newImageUrl = URL.createObjectURL(file);
    setImage({ url: newImageUrl, file, contentType: file.type });
    // Clear previous results when a new image is uploaded for a better user experience
    setDetectionResult(null);
    setForecastResult(null);
    setMarketResult(null);
  };
  
  const handleAnalysis = useCallback(async () => {
    if (!image.url) {
      toast({ variant: 'destructive', title: 'No Image', description: 'Please upload an image first.' });
      return;
    }
    setIsLoading(true);
    setDetectionResult(null);
    setForecastResult(null);

    try {
      let analysisResult: DetectionResult;

      if (controls.useDetectionModel && image.contentType) {
        const reader = new FileReader();
        reader.readAsDataURL(image.file || await dataURLtoFile(image.url, 'analysis-image.jpg', image.contentType));
        
        await new Promise<void>((resolve, reject) => {
          reader.onload = async () => {
            try {
              const photoDataUri = reader.result as string;
              const response = await runTomatoAnalysis({ photoDataUri, contentType: image.contentType! });

              if (!response.success || !response.data) {
                let errorMessage = 'An unknown error occurred during analysis.';
                if (response.error) {
                    if (response.error.includes('API key not valid')) {
                        errorMessage = 'Your Gemini API key is not valid. Please check your .env file.';
                    } else {
                        errorMessage = response.error;
                    }
                }
                throw new Error(errorMessage);
              }

              const analysis: TomatoAnalysisResult = response.data;
              
              const newDetectionResult: DetectionResult = {
                plantId: Date.now(),
                detections: analysis.counts.immature + analysis.counts.ripening + analysis.counts.mature,
                boxes: [], 
                stageCounts: analysis.counts,
                growthStage: analysis.counts.mature > analysis.counts.immature ? 'Mature' : 'Ripening',
                avgBboxArea: 0, 
                confidence: 0.9, 
                imageUrl: image.url!,
                summary: analysis.summary
              };
              analysisResult = newDetectionResult;
              resolve();
            } catch (error) {
              reject(error);
            }
          };
          reader.onerror = (error) => {
            reject(new Error("Failed to read image file."));
          }
        });

      } else {
        // Use mock data if the switch is off
        analysisResult = mockTomatoDetection(image.url);
      }
      
      setDetectionResult(analysisResult);
      
      if (analysisResult) {
          const forecast = calculateYieldForecast(analysisResult, controls);
          setForecastResult(forecast);
          setActiveTab('forecast');
      }

    } catch (error) {
      console.error("Analysis failed:", error);
      toast({ variant: 'destructive', title: 'Analysis Failed', description: error instanceof Error ? error.message : 'An unexpected error occurred.' });
    } finally {
      setIsLoading(false);
    }
  }, [image, controls, toast]);
  
  React.useEffect(() => {
    // Recalculate forecast whenever controls change AND a detection result exists
    if(detectionResult) {
      const forecast = calculateYieldForecast(detectionResult, controls);
      setForecastResult(forecast);
    }
  }, [controls, detectionResult]);

  const appState = useMemo(() => ({
    controls,
    detectionResult,
    forecastResult,
    marketResult
  }), [controls, detectionResult, forecastResult, marketResult]);

  const navItems = [
    { id: 'detection', label: 'Detection & Stage', icon: Camera },
    { id: 'forecast', label: 'Forecast Dashboard', icon: BarChartIcon },
    { id: 'market', label: 'Price & Profit', icon: LineChart },
    { id: 'chat', label: 'Chat Assistant', icon: MessageCircle },
  ];

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <Sidebar variant="inset" side="left" collapsible="icon" className="group/sidebar">
        <SidebarHeader>
           <h2 className="font-headline text-xl font-semibold text-primary">AgriVisionAI</h2>
        </SidebarHeader>
        <SidebarContent>
           <SidebarControls controls={controls} setControls={setControls} onImageUpload={handleImageUpload} onAnalyze={handleAnalysis} isLoading={isLoading} />
        </SidebarContent>
      </Sidebar>
      <SidebarInset className="flex flex-col">
        <AgriVisionHeader />
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className={isMobile ? 'grid w-full grid-cols-2' : ''}>
              {navItems.map(item => (
                <TabsTrigger key={item.id} value={item.id} className="gap-2">
                  <item.icon className="h-4 w-4" />
                  {!isMobile && item.label}
                </TabsTrigger>
              ))}
            </TabsList>
            <TabsContent value="detection">
              <DetectionTab result={detectionResult} isLoading={isLoading} imageUrl={image.url}/>
            </TabsContent>
            <TabsContent value="forecast">
              <ForecastTab result={forecastResult} isLoading={isLoading} />
            </TabsContent>
            <TabsContent value="market">
              <MarketTab 
                sellableKg={forecastResult?.sellable_kg || 0}
                district={controls.district}
                onMarketResultChange={setMarketResult}
              />
            </TabsContent>
            <TabsContent value="chat">
              <ChatTab 
                appState={appState}
                chatHistory={chatHistory}
                setChatHistory={setChatHistory}
              />
            </TabsContent>
          </Tabs>
        </main>
      </SidebarInset>
    </div>
  );
}
