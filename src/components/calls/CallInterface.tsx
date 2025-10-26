"use client";

import { useEffect, useState, useRef } from 'react';
import WebRTCService from '@/lib/services/webRTCService';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Video, VideoOff, PhoneOff } from 'lucide-react';

interface CallInterfaceProps {
  callId: string;
  isIncoming?: boolean;
}

export function CallInterface({ callId, isIncoming = false }: CallInterfaceProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const webRTC = new WebRTCService(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

  useEffect(() => {
    // Setup local stream
    const localStream = webRTC.getLocalStream();
    if (localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }

    // Listen for remote stream
    const handleRemoteStream = (e: any) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = e.detail.stream;
      }
    };

    window.addEventListener('remoteStreamReady', handleRemoteStream);

    // Start call duration timer
    const timer = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);

    return () => {
      window.removeEventListener('remoteStreamReady', handleRemoteStream);
      clearInterval(timer);
    };
  }, []);

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleMuteToggle = () => {
    const muted = webRTC.toggleMute();
    setIsMuted(muted);
  };

  const handleVideoToggle = () => {
    const videoOff = webRTC.toggleVideo();
    setIsVideoOff(videoOff);
  };

  const handleEndCall = async () => {
    await webRTC.endCall();
    window.location.href = '/dashboard';
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Remote Video (full screen) */}
      <div className="relative w-full h-full">
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        />

        {/* Call Info Overlay */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/50 px-4 py-2 rounded-full backdrop-blur-sm">
          <span className="text-white font-medium">{formatDuration(callDuration)}</span>
        </div>

        {/* Local Video (picture-in-picture) */}
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          className="absolute top-4 right-4 w-32 h-48 rounded-lg object-cover border-2 border-white shadow-lg"
        />
      </div>

      {/* Call Controls */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-4">
        <Button
          size="lg"
          variant={isMuted ? "destructive" : "secondary"}
          onClick={handleMuteToggle}
          className="rounded-full w-14 h-14"
        >
          {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
        </Button>

        <Button
          size="lg"
          variant={isVideoOff ? "destructive" : "secondary"}
          onClick={handleVideoToggle}
          className="rounded-full w-14 h-14"
        >
          {isVideoOff ? <VideoOff size={24} /> : <Video size={24} />}
        </Button>

        <Button
          size="lg"
          variant="destructive"
          onClick={handleEndCall}
          className="rounded-full w-14 h-14"
        >
          <PhoneOff size={24} />
        </Button>
      </div>
    </div>
  );
}
