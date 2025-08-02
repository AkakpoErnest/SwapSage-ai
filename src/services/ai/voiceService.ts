export interface VoiceRecognitionResult {
  text: string;
  confidence: number;
  language?: string;
  isFinal: boolean;
}

export interface VoiceServiceConfig {
  language: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
}

class VoiceService {
  private recognition: SpeechRecognition | null = null;
  private isSupported: boolean = false;
  private isListening: boolean = false;
  private config: VoiceServiceConfig;

  constructor() {
    this.config = {
      language: 'en-US',
      continuous: true,
      interimResults: true,
      maxAlternatives: 1
    };
    this.initializeSpeechRecognition();
  }

  private initializeSpeechRecognition(): void {
    // Check for browser support
    if ('webkitSpeechRecognition' in window) {
      this.recognition = new (window as any).webkitSpeechRecognition();
      this.isSupported = true;
    } else if ('SpeechRecognition' in window) {
      this.recognition = new (window as any).SpeechRecognition();
      this.isSupported = true;
    } else {
      console.warn('Speech recognition not supported in this browser');
      this.isSupported = false;
    }

    if (this.recognition) {
      this.setupRecognitionHandlers();
    }
  }

  private setupRecognitionHandlers(): void {
    if (!this.recognition) return;

    this.recognition.continuous = this.config.continuous;
    this.recognition.interimResults = this.config.interimResults;
    this.recognition.maxAlternatives = this.config.maxAlternatives;
    this.recognition.lang = this.config.language;

    this.recognition.onstart = () => {
      this.isListening = true;
      console.log('Voice recognition started');
    };

    this.recognition.onend = () => {
      this.isListening = false;
      console.log('Voice recognition ended');
    };

    this.recognition.onerror = (event) => {
      console.error('Voice recognition error:', event.error);
      this.isListening = false;
    };
  }

  isAvailable(): boolean {
    return this.isSupported;
  }

  isActive(): boolean {
    return this.isListening;
  }

  setLanguage(language: string): void {
    this.config.language = language;
    if (this.recognition) {
      this.recognition.lang = language;
    }
  }

  startListening(
    onResult: (result: VoiceRecognitionResult) => void,
    onError?: (error: string) => void
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.recognition || !this.isSupported) {
        const error = 'Speech recognition not supported';
        onError?.(error);
        reject(new Error(error));
        return;
      }

      if (this.isListening) {
        resolve();
        return;
      }

      this.recognition.onresult = (event) => {
        const result = event.results[event.results.length - 1];
        const transcript = result[0].transcript;
        const confidence = result[0].confidence;

        onResult({
          text: transcript,
          confidence: confidence,
          language: this.config.language,
          isFinal: result.isFinal
        });
      };

      this.recognition.onerror = (event) => {
        const error = `Voice recognition error: ${event.error}`;
        onError?.(error);
        this.isListening = false;
        reject(new Error(error));
      };

      this.recognition.onend = () => {
        this.isListening = false;
        resolve();
      };

      try {
        this.recognition.start();
      } catch (error) {
        const errorMsg = `Failed to start voice recognition: ${error}`;
        onError?.(errorMsg);
        reject(new Error(errorMsg));
      }
    });
  }

  stopListening(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }

  // Get supported languages
  getSupportedLanguages(): string[] {
    return [
      'en-US', 'en-GB', 'en-AU',
      'es-ES', 'es-MX', 'es-AR',
      'fr-FR', 'fr-CA', 'fr-CH',
      'ja-JP', 'zh-CN', 'zh-TW',
      'de-DE', 'it-IT', 'pt-BR',
      'ru-RU', 'ko-KR', 'ar-SA'
    ];
  }

  // Convert language code to display name
  getLanguageDisplayName(languageCode: string): string {
    const languageMap: Record<string, string> = {
      'en-US': 'English (US)',
      'en-GB': 'English (UK)',
      'en-AU': 'English (Australia)',
      'es-ES': 'Español (España)',
      'es-MX': 'Español (México)',
      'es-AR': 'Español (Argentina)',
      'fr-FR': 'Français (France)',
      'fr-CA': 'Français (Canada)',
      'fr-CH': 'Français (Suisse)',
      'ja-JP': '日本語 (日本)',
      'zh-CN': '中文 (简体)',
      'zh-TW': '中文 (繁體)',
      'de-DE': 'Deutsch (Deutschland)',
      'it-IT': 'Italiano (Italia)',
      'pt-BR': 'Português (Brasil)',
      'ru-RU': 'Русский (Россия)',
      'ko-KR': '한국어 (대한민국)',
      'ar-SA': 'العربية (السعودية)'
    };

    return languageMap[languageCode] || languageCode;
  }

  // Get language code from display name
  getLanguageCode(displayName: string): string {
    const languageMap: Record<string, string> = {
      'English (US)': 'en-US',
      'English (UK)': 'en-GB',
      'English (Australia)': 'en-AU',
      'Español (España)': 'es-ES',
      'Español (México)': 'es-MX',
      'Español (Argentina)': 'es-AR',
      'Français (France)': 'fr-FR',
      'Français (Canada)': 'fr-CA',
      'Français (Suisse)': 'fr-CH',
      '日本語 (日本)': 'ja-JP',
      '中文 (简体)': 'zh-CN',
      '中文 (繁體)': 'zh-TW',
      'Deutsch (Deutschland)': 'de-DE',
      'Italiano (Italia)': 'it-IT',
      'Português (Brasil)': 'pt-BR',
      'Русский (Россия)': 'ru-RU',
      '한국어 (대한민국)': 'ko-KR',
      'العربية (السعودية)': 'ar-SA'
    };

    return languageMap[displayName] || 'en-US';
  }
}

export const voiceService = new VoiceService(); 