import { useState, useRef, useCallback, useEffect } from "react";
import { Mic, MicOff, Pause, Play, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface VoiceControllerProps {
  onVoiceUpdate: (itemName: string, count: number) => void;
  isActive: boolean;
  onActiveChange: (active: boolean) => void;
}


export const VoiceController = ({ onVoiceUpdate, isActive, onActiveChange }: VoiceControllerProps) => {
  const [isListening, setIsListening] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [confidence, setConfidence] = useState(0);
  const [currentItem, setCurrentItem] = useState("");
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const isProcessingRef = useRef(false);
  const lastProcessedRef = useRef("");

  // Initialize speech recognition
  useEffect(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast.error("Speech recognition not supported in this browser");
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      toast.success("Voice recognition started");
    };

    recognition.onend = () => {
      setIsListening(false);
      if (isActive && !isPaused) {
        // Restart recognition if it should be active
        setTimeout(() => {
          try {
            recognition.start();
          } catch (error) {
            console.error("Failed to restart recognition:", error);
          }
        }, 100);
      }
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
      
      if (event.error === 'no-speech') {
        toast.info("No speech detected, continuing to listen...");
      } else if (event.error !== 'aborted') {
        toast.error(`Speech recognition error: ${event.error}`);
      }
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      if (isProcessingRef.current) return;
      
      let interimTranscript = '';
      let finalTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript;
        
        if (result.isFinal) {
          finalTranscript += transcript;
          setConfidence(result[0].confidence * 100);
        } else {
          interimTranscript += transcript;
        }
      }
      
      const fullTranscript = finalTranscript || interimTranscript;
      setTranscript(fullTranscript);
      
      if (finalTranscript && finalTranscript.trim() !== lastProcessedRef.current) {
        const processed = finalTranscript.trim();
        processVoiceInput(processed);
        lastProcessedRef.current = processed;
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
 }, [isActive, isPaused]);

  const processVoiceInput = useCallback((text: string) => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;

    try {
      const cleanedText = text
            .replace(/[.,!?]/g, "")
            .replace(/\bbottles?\b/gi, "")
            .trim();      
          // Extract item names and counts using regex patterns
          const patterns = [
        // Pattern: "Chardonnay 12" or "Chardonnay twelve"
        /^(.+?)\s+(\d+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty)$/i,        // Pattern: "12 bottles of Chardonnay" or "twelve bottles of Chardonnay"
        /^(\d+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty)\s+(?:bottles?\s+of\s+)?(.+)$/i,        // Pattern: "count 5 for Merlot"
        /^count\s+(\d+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|\d+)\s+(?:for\s+)?(.+)$/i,
      ];

      const numberWords: Record<string, number> = {
        one: 1, two: 2, three: 3, four: 4, five: 5,
        six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
        eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15,
        sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20
      };

      const convertToNumber = (str: string): number => {
        const lowerStr = str.toLowerCase();
        return numberWords[lowerStr] || parseInt(str) || 0;
      };

      let itemName = "";
      let count = 0;

      for (const pattern of patterns) {
        const match = cleanedText.match(pattern);
        if (match) {
          if (pattern.source.startsWith('^(.+?)')) {
            // First pattern: item name first
            itemName = match[1].trim();
            count = convertToNumber(match[2]);
          } else {
            // Other patterns: count first
            count = convertToNumber(match[1]);
            itemName = match[2].trim();
          }
          break;
        }
      }

      if (itemName && count > 0) {
        setCurrentItem(itemName);
        onVoiceUpdate(itemName, count);
        
        // Clear transcript after successful processing
        setTimeout(() => {
          setTranscript("");
          setCurrentItem("");
        }, 2000);
      } else {
        console.log("Could not parse:", text);
      }
    } catch (error) {
      console.error("Error processing voice input:", error);
    } finally {
      setTimeout(() => {
        isProcessingRef.current = false;
      }, 500);
    }
  }, [onVoiceUpdate]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) {
      toast.error("Speech recognition not initialized");
      return;
    }

    try {
      setIsPaused(false);
      onActiveChange(true);
      recognitionRef.current.start();
    } catch (error) {
      console.error("Error starting recognition:", error);
      toast.error("Failed to start voice recognition");
    }
  }, [onActiveChange]);

  const pauseListening = useCallback(() => {
    if (recognitionRef.current) {
      setIsPaused(true);
      recognitionRef.current.abort();
    }
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      onActiveChange(false);
      setIsPaused(false);
      recognitionRef.current.abort();
      setTranscript("");
      setCurrentItem("");
      toast.info("Voice recognition stopped");
    }
  }, [onActiveChange]);

  const getStatusColor = () => {
    if (isListening && !isPaused) return "bg-gradient-wine animate-pulse-wine";
    if (isPaused) return "bg-wine-gold";
    return "bg-muted";
  };

  const getStatusText = () => {
    if (isListening && !isPaused) return "Listening...";
    if (isPaused) return "Paused";
    return "Ready";
  };

  return (
    <Card className="shadow-elegant">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-wine-burgundy">
          <div className="flex items-center gap-2">
            <Volume2 className="h-5 w-5" />
            Voice Control
          </div>
          <Badge variant={isListening && !isPaused ? "default" : "secondary"} className={getStatusColor()}>
            {getStatusText()}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Control Buttons */}
        <div className="flex justify-center gap-4">
          {!isActive ? (
            <Button
              onClick={startListening}
              size="lg"
              className="bg-gradient-wine hover:shadow-glow transition-all duration-300 text-wine-champagne shadow-wine px-8 py-6 text-lg font-semibold rounded-xl"
            >
              <Mic className="h-6 w-6 mr-3" />
              Start Listening
            </Button>
          ) : (
            <div className="flex gap-3">
              <Button
                onClick={isPaused ? startListening : pauseListening}
                size="lg"
                variant={isPaused ? "default" : "secondary"}
                className="px-6 py-4 rounded-xl font-medium"
              >
                {isPaused ? (
                  <>
                    <Play className="h-5 w-5 mr-2" />
                    Resume
                  </>
                ) : (
                  <>
                    <Pause className="h-5 w-5 mr-2" />
                    Pause
                  </>
                )}
              </Button>
              <Button
                onClick={stopListening}
                size="lg"
                variant="destructive"
                className="px-6 py-4 rounded-xl font-medium"
              >
                <MicOff className="h-5 w-5 mr-2" />
                Stop
              </Button>
            </div>
          )}
        </div>

        {/* Live Transcript */}
        {(transcript || currentItem) && (
          <div className="space-y-3">
            {transcript && (
              <div className="p-4 bg-muted rounded-lg">
                <Label className="text-sm font-medium text-muted-foreground">
                  Live Transcript:
                </Label>
                <p className="text-lg font-medium mt-1">{transcript}</p>
                {confidence > 0 && (
                  <div className="mt-2">
                    <div className="flex justify-between text-sm text-muted-foreground mb-1">
                      <span>Confidence</span>
                      <span>{confidence.toFixed(0)}%</span>
                    </div>
                    <Progress value={confidence} className="h-2" />
                  </div>
                )}
              </div>
            )}
            
            {currentItem && (
              <div className="p-4 bg-wine-champagne border border-wine-gold rounded-lg">
                <Label className="text-sm font-medium text-wine-burgundy">
                  Processing:
                </Label>
                <p className="text-lg font-semibold text-wine-burgundy mt-1">
                  {currentItem}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Instructions */}
        <div className="text-center space-y-2 text-sm text-muted-foreground">
          <p className="font-medium">How to use:</p>
          <div className="text-xs space-y-1">
            <p>• You can say phrases such as: <strong>"Chardonnay 12"</strong> or <strong>"12 bottles of Chardonnay"</strong> or <strong>"Count 5 for Merlot"</strong></p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
