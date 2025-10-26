"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import WebRTCService from '@/lib/services/webRTCService';
import { Button } from '@/components/ui/button';
import { Phone, PhoneOff, User } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface IncomingCall {
  id: string;
  caller_id: string;
  caller_name?: string;
  call_type: 'voice' | 'video';
}

export function IncomingCallAlert() {
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);
  const [callerInfo, setCallerInfo] = useState<any>(null);
  const router = useRouter();
  const webRTC = new WebRTCService(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    // Get current user
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user?.id;
    };

    // Setup realtime listener for incoming calls
    const setupCallListener = async () => {
      const currentUserId = await getCurrentUser();
      if (!currentUserId) return;

      const channel = supabase
        .channel('incoming-calls')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'call_sessions',
            filter: `callee_id=eq.${currentUserId}`,
          },
          async (payload: any) => {
            const call = payload.new;
            if (call.status === 'ringing') {
              setIncomingCall(call);
              
              // Fetch caller info
              const { data: profile } = await supabase
                .from('profiles')
                .select('full_name, avatar_url')
                .eq('id', call.caller_id)
                .single();

              setCallerInfo(profile);
              playRingtone();
            }
          }
        )
        .subscribe();

      return () => {
        channel.unsubscribe();
      };
    };

    setupCallListener();
  }, []);

  const playRingtone = () => {
    // Play ringtone sound
    const audio = new Audio('/sounds/ringtone.mp3');
    audio.loop = true;
    audio.play().catch(err => console.log('Audio play failed:', err));
  };

  const stopRingtone = () => {
    // Stop all audio
    document.querySelectorAll('audio').forEach(audio => {
      audio.pause();
      audio.currentTime = 0;
    });
  };

  const handleAnswer = async () => {
    if (!incomingCall) return;

    stopRingtone();

    try {
      // Fetch offer from signaling table
      const { data: signal } = await supabase
        .from('webrtc_signaling')
        .select('*')
        .eq('call_id', incomingCall.id)
        .eq('signal_type', 'offer')
        .single();

      if (signal) {
        await webRTC.answerCall(incomingCall.id);
        router.push(`/calls/${incomingCall.id}`);
      }
    } catch (error) {
      console.error('Failed to answer call:', error);
    }
  };

  const handleDecline = async () => {
    if (!incomingCall) return;

    stopRingtone();

    try {
      await supabase
        .from('call_sessions')
        .update({ status: 'declined', ended_at: new Date().toISOString() })
        .eq('id', incomingCall.id);

      setIncomingCall(null);
      setCallerInfo(null);
    } catch (error) {
      console.error('Failed to decline call:', error);
    }
  };

  if (!incomingCall) return null;

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center backdrop-blur-sm">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl animate-in fade-in zoom-in duration-300">
        {/* Caller Avatar */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mb-4 animate-pulse">
            {callerInfo?.avatar_url ? (
              <img 
                src={callerInfo.avatar_url} 
                alt="Caller" 
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <User size={48} className="text-white" />
            )}
          </div>

          <h2 className="text-2xl font-bold mb-2">
            {callerInfo?.full_name || 'Okänd'}
          </h2>
          <p className="text-gray-600 mb-1">
            Inkommande {incomingCall.call_type === 'video' ? 'videosamtal' : 'röstsamtal'}
          </p>
          <div className="flex items-center gap-1 text-sm text-gray-500">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span>Ringer...</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Button
            size="lg"
            variant="destructive"
            onClick={handleDecline}
            className="flex-1 rounded-full py-6"
          >
            <PhoneOff className="mr-2" size={20} />
            Neka
          </Button>

          <Button
            size="lg"
            onClick={handleAnswer}
            className="flex-1 bg-green-600 hover:bg-green-700 rounded-full py-6"
          >
            <Phone className="mr-2" size={20} />
            Svara
          </Button>
        </div>
      </div>
    </div>
  );
}
