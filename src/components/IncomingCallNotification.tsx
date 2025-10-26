import { useEffect, useState, useRef, useCallback } from 'react';
import { Bell, Phone, PhoneOff } from 'lucide-react';

interface Props {
  callerName: string;
  onAccept: () => void;
  onDecline: () => void;
}

export function IncomingCallNotification({ callerName, onAccept, onDecline }: Props) {
  const [isRinging, setIsRinging] = useState(true);
  const audioRef = useRef<HTMLAudioElement>(null);

  const handleDecline = useCallback(() => {
    const audio = audioRef.current;
    if (audio) audio.pause();
    setIsRinging(false);
    onDecline();
  }, [onDecline]);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.loop = true;
      audio.play().catch(e => console.error('Ringtone play failed:', e));
    }

    const timeout = setTimeout(() => {
      handleDecline();
    }, 30000);

    return () => {
      clearTimeout(timeout);
      if (audio) audio.pause();
    };
  }, [handleDecline]);

  const handleAccept = () => {
    if (audioRef.current) audioRef.current.pause();
    setIsRinging(false);
    onAccept();
  };

  if (!isRinging) return null;

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center">
      <audio ref={audioRef} src="/sounds/ringtone.mp3" />
      
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-sm w-full mx-4">
        <div className="text-center">
          <div className="mb-6 flex justify-center">
            <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center animate-pulse">
              <Bell className="w-10 h-10 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          
          <h2 className="text-2xl font-bold mb-2">{callerName}</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8">Inkommande samtal...</p>
          
          <div className="flex gap-4">
            <button
              onClick={handleDecline}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white py-4 rounded-full flex items-center justify-center gap-2 transition"
            >
              <PhoneOff className="w-5 h-5" />
              Avvisa
            </button>
            
            <button
              onClick={handleAccept}
              className="flex-1 bg-green-500 hover:bg-green-600 text-white py-4 rounded-full flex items-center justify-center gap-2 transition"
            >
              <Phone className="w-5 h-5" />
              Svara
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
