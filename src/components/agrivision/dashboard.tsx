"use client";

import React, { useState, useMemo, useCallback } from 'react';
import { Camera, BarChart3, LineChart, MessageCircle } from 'lucide-react';
import type { AppControls, DetectionResult, ForecastResult, ChatMessage } from '@/lib/types';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Sidebar, SidebarContent, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuItem, SidebarMenuButton, useSidebar } from '@/components/ui/sidebar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AgriVisionHeader } from '@/components/agrivision/header';
import { SidebarControls } from '@/components/agrivision/sidebar-controls';
import { DetectionTab } from '@/components/agrivision/detection-tab';
import { ForecastTab } from '@/components/agrivision/forecast-tab';
import { MarketTab } from '@/components/agrivision/market-tab';
import { ChatTab } from '@/components/agrivision/chat-tab';
import { mockTomatoDetection, calculateYieldForecast } from '@/lib/mock-data';
import type { MarketPriceForecastingOutput } from '@/ai/flows/market-price-forecasting';
import { runTomatoDetection } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { dataURLtoFile } from '@/lib/utils';


export function Dashboard() {
  const { isMobile } = useSidebar();
  const [activeTab, setActiveTab] = useState('detection');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  // Use a state object for the image to store both URL and File object
  const [image, setImage] = useState<{ url: string | null; file: File | null }>({
    url: PlaceHolderImages[0]?.imageUrl || null,
    file: null,
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
    setImage({ url: newImageUrl, file });
    // Clear previous results when a new image is uploaded
    setDetectionResult(null);
    setForecastResult(null);
    setMarketResult(null);
  };
  
  const handleAnalysis = useCallback(async () => {
    if (!image.url) return;
    setIsLoading(true);

    try {
      let detection;
      if (controls.useDetectionModel) {
        // Ensure we have a file to send. If not, fetch the placeholder.
        let imageFile = image.file;
        if (!imageFile && image.url) {
           const fetchedFile = await dataURLtoFile(image.url, 'placeholder.jpg', 'image/jpeg');
           imageFile = fetchedFile;
        }

        if(imageFile) {
            const reader = new FileReader();
            reader.readAsDataURL(imageFile);
            reader.onload = async () => {
                const dataUri = reader.result as string;
                const response = await runTomatoDetection({ photoDataUri: dataUri });

                if (response.success && response.data) {
                    detection = { ...response.data, imageUrl: image.url! };
                } else {
                    toast({ variant: 'destructive', title: 'Detection Model Error', description: response.error });
                    setIsLoading(false);
                    return;
                }
                 setDetectionResult(detection);
                 const forecast = calculateYieldForecast(detection, controls);
                 setForecastResult(forecast);
                 setIsLoading(false);
            };
        }
      } else {
        // Simulate model inference
        detection = mockTomatoDetection(image.url);
        setDetectionResult(detection);
        const forecast = calculateYieldForecast(detection, controls);
        setForecastResult(forecast);
        setTimeout(() => setIsLoading(false), 1000);
      }
    } catch (error) {
        console.error("Analysis failed:", error);
        toast({ variant: 'destructive', title: 'Analysis Failed', description: 'An unexpected error occurred.' });
        setIsLoading(false);
    }
  }, [image, controls, toast]);
  
  React.useEffect(() => {
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
    { id: 'forecast', label: 'Forecast Dashboard', icon: BarChart3 },
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
