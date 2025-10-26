export interface VoiceCommand {
  command: string;
  action: () => Promise<void> | void;
  synonyms: string[];
  category: 'navigation' | 'job' | 'bridge' | 'communication' | 'report';
}

export class VoiceCommandService {
  private recognition: any = null;
  private synthesis: SpeechSynthesis | null = null;
  private isListening = false;
  private commands: VoiceCommand[] = [];
  private onCommandCallback?: (command: string) => void;

  constructor() {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = false;
        this.recognition.lang = 'sv-SE';
        this.setupRecognition();
      }

      this.synthesis = window.speechSynthesis;
    }
  }

  private setupRecognition() {
    if (!this.recognition) return;

    this.recognition.onresult = (event: any) => {
      const last = event.results.length - 1;
      const command = event.results[last][0].transcript.toLowerCase().trim();

      console.log('🎤 Voice command detected:', command);
      this.processCommand(command);
    };

    this.recognition.onerror = (event: any) => {
      console.error('Voice recognition error:', event.error);
      if (event.error === 'no-speech') {
        this.speak('Jag hörde inget kommando');
      }
    };

    this.recognition.onend = () => {
      if (this.isListening) {
        this.recognition.start();
      }
    };
  }

  registerCommand(command: VoiceCommand) {
    this.commands.push(command);
  }

  registerDefaultCommands(router: any) {
    this.registerCommand({
      command: 'gå till dashboard',
      action: () => router.push('/'),
      synonyms: ['visa dashboard', 'hem', 'start'],
      category: 'navigation'
    });

    this.registerCommand({
      command: 'visa broar',
      action: () => router.push('/bridges'),
      synonyms: ['öppna broregister', 'lista broar', 'broregister'],
      category: 'navigation'
    });

    this.registerCommand({
      command: 'starta nytt jobb',
      action: () => router.push('/new-job'),
      synonyms: ['skapa jobb', 'nytt uppdrag', 'börja jobb'],
      category: 'job'
    });

    this.registerCommand({
      command: 'visa trafikvarningar',
      action: () => router.push('/traffic-alerts'),
      synonyms: ['trafik', 'varningar', 'trafikinfo'],
      category: 'navigation'
    });

    this.registerCommand({
      command: 'öppna chat',
      action: () => router.push('/chat'),
      synonyms: ['visa meddelanden', 'chatt', 'meddelanden'],
      category: 'communication'
    });

    this.registerCommand({
      command: 'visa kontakter',
      action: () => router.push('/contacts'),
      synonyms: ['kontaktlista', 'kollegor'],
      category: 'navigation'
    });

    this.registerCommand({
      command: 'visa dokument',
      action: () => router.push('/documents'),
      synonyms: ['kma dokument', 'filer'],
      category: 'navigation'
    });

    this.registerCommand({
      command: 'visa journal',
      action: () => router.push('/journal'),
      synonyms: ['jobbhistorik', 'arbetsjournal'],
      category: 'report'
    });

    this.registerCommand({
      command: 'ai assistent',
      action: () => router.push('/ai-assistant'),
      synonyms: ['hjälp', 'assistent', 'fråga ai'],
      category: 'navigation'
    });

    this.registerCommand({
      command: 'visa avvikelser',
      action: () => router.push('/deviations'),
      synonyms: ['avvikelsehantering', 'rapporter'],
      category: 'report'
    });
  }

  private processCommand(spokenText: string) {
    const normalizedText = spokenText.toLowerCase().trim();

    const matchedCommand = this.commands.find(cmd => {
      if (normalizedText.includes(cmd.command)) return true;
      return cmd.synonyms.some(syn => normalizedText.includes(syn));
    });

    if (matchedCommand) {
      console.log('✅ Executing command:', matchedCommand.command);
      this.speak(`Utför ${matchedCommand.command}`);
      matchedCommand.action();

      if (this.onCommandCallback) {
        this.onCommandCallback(matchedCommand.command);
      }
    } else {
      console.log('❌ No matching command found');
      this.speak('Okänt kommando. Säg "hjälp" för tillgängliga kommandon.');
    }
  }

  startListening() {
    if (!this.recognition) {
      console.warn('Speech recognition not available');
      return false;
    }

    if (!this.isListening) {
      this.isListening = true;
      this.recognition.start();
      console.log('🎤 Voice commands activated');
      this.speak('Röstkommandon aktiverade');
      return true;
    }
    return false;
  }

  stopListening() {
    if (this.recognition && this.isListening) {
      this.isListening = false;
      this.recognition.stop();
      console.log('🔇 Voice commands deactivated');
      this.speak('Röstkommandon avaktiverade');
    }
  }

  speak(text: string, lang: string = 'sv-SE') {
    if (!this.synthesis) {
      console.warn('Speech synthesis not available');
      return;
    }

    this.synthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    const voices = this.synthesis.getVoices();
    const swedishVoice = voices.find(voice => voice.lang.startsWith('sv'));
    if (swedishVoice) {
      utterance.voice = swedishVoice;
    }

    this.synthesis.speak(utterance);
  }

  isRecognitionAvailable(): boolean {
    return this.recognition !== null;
  }

  isSynthesisAvailable(): boolean {
    return this.synthesis !== null;
  }

  getIsListening(): boolean {
    return this.isListening;
  }

  onCommand(callback: (command: string) => void) {
    this.onCommandCallback = callback;
  }

  getAvailableCommands(): Array<{ command: string; synonyms: string[]; category: string }> {
    return this.commands.map(cmd => ({
      command: cmd.command,
      synonyms: cmd.synonyms,
      category: cmd.category
    }));
  }

  async transcribeAudio(audioBlob: Blob): Promise<string> {
    const formData = new FormData();
    formData.append('audio', audioBlob);

    const response = await fetch('/api/ai/transcribe', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error('Transcription failed');
    }

    const data = await response.json();
    return data.text;
  }

  async generateVoiceReport(jobId: string): Promise<Blob> {
    const response = await fetch(`/api/reports/voice/${jobId}`);

    if (!response.ok) {
      throw new Error('Failed to generate voice report');
    }

    return await response.blob();
  }
}

export const voiceCommands = new VoiceCommandService();
