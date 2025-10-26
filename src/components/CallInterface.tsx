'use client';

import React, { useState, useEffect, useRef } from 'react';
import { PhoneOff, Mic, MicOff, Video, VideoOff, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import WebRTCService, { CallSession } from '@/lib/services/webRTCService';

interface CallInterfaceProps {
  callSession: CallSession;
  webRTCService: WebRTCService;
  onEndCall: () => void;
  callerName?: string;
  callerAvatar?: string;
}

export function CallInterface({
  callSession,
  webRTCService,
  onEndCall,
  callerName = 'Unknown',
  callerAvatar
}: CallInterfaceProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [callStatus, setCallStatus] = useState<string>('connecting');
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localAudioRef = useRef<HTMLAudioElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    // Setup video/audio streams
    const localStream = webRTCService.getLocalStream();
    if (localStream) {
      if (callSession.call_type === 'video' && localVideoRef.current) {
        localVideoRef.current.srcObject = localStream;
      } else if (localAudioRef.current) {
        localAudioRef.current.srcObject = localStream;
      }
    }

    // Setup remote stream handler
    webRTCService.onRemoteStream = (stream: MediaStream) => {
      setCallStatus('connected');
      
      if (callSession.call_type === 'video' && remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = stream;
      } else if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = stream;
      }
    };

    // Call duration timer
    const startTime = Date.now();
    const timer = setInterval(() => {
      setCallDuration(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, [callSession, webRTCService]);

  const handleToggleMute = () => {
    const muted = webRTCService.toggleMute();
    setIsMuted(muted);
  };

  const handleToggleVideo = () => {
    const videoOff = webRTCService.toggleVideo();
    setIsVideoOff(videoOff);
  };

  const handleEndCall = () => {
    webRTCService.endCall();
    onEndCall();
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center">
      <Card className="w-full max-w-4xl bg-gray-900 text-white border-gray-700">
        <CardContent className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-4">
              <Avatar className="h-12 w-12">
                <AvatarImage src={callerAvatar} />
                <AvatarFallback>{callerName[0]}</AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-xl font-semibold">{callerName}</h2>
                <p className="text-sm text-gray-400">
                  {callStatus === 'connecting' && 'Ansluter...'}
                  {callStatus === 'connected' && formatDuration(callDuration)}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleEndCall}
              className="text-gray-400 hover:text-white"
            >
              <X className="h-6 w-6" />
            </Button>
          </div>

          {/* Video/Audio Display */}
          <div className="relative mb-6">
            {callSession.call_type === 'video' ? (
              <div className="relative aspect-video bg-gray-800 rounded-lg overflow-hidden">
                {/* Remote Video (Main) */}
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
                
                {/* Local Video (Picture-in-Picture) */}
                <div className="absolute bottom-4 right-4 w-48 h-36 bg-gray-700 rounded-lg overflow-hidden border-2 border-gray-600">
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Video Off Overlay */}
                {isVideoOff && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                    <Avatar className="h-32 w-32">
                      <AvatarImage src={callerAvatar} />
                      <AvatarFallback className="text-4xl">{callerName[0]}</AvatarFallback>
                    </Avatar>
                  </div>
                )}
              </div>
            ) : (
              // Voice Call Display
              <div className="flex flex-col items-center justify-center py-16 bg-gradient-to-b from-blue-900 to-purple-900 rounded-lg">
                <Avatar className="h-32 w-32 mb-6">
                  <AvatarImage src={callerAvatar} />
                  <AvatarFallback className="text-5xl">{callerName[0]}</AvatarFallback>
                </Avatar>
                <h3 className="text-2xl font-semibold mb-2">{callerName}</h3>
                <p className="text-lg text-gray-300">
                  {callStatus === 'connecting' ? 'Ansluter...' : formatDuration(callDuration)}
                </p>
                {callStatus === 'connecting' && (
                  <div className="mt-4 flex space-x-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                )}
              </div>
            )}

            {/* Hidden audio elements */}
            <audio ref={localAudioRef} autoPlay muted />
            <audio ref={remoteAudioRef} autoPlay />
          </div>

          {/* Call Controls */}
          <div className="flex justify-center items-center space-x-6">
            {/* Mute Button */}
            <Button
              variant={isMuted ? 'destructive' : 'secondary'}
              size="lg"
              onClick={handleToggleMute}
              className="rounded-full h-16 w-16"
            >
              {isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
            </Button>

            {/* Video Toggle (only for video calls) */}
            {callSession.call_type === 'video' && (
              <Button
                variant={isVideoOff ? 'destructive' : 'secondary'}
                size="lg"
                onClick={handleToggleVideo}
                className="rounded-full h-16 w-16"
              >
                {isVideoOff ? <VideoOff className="h-6 w-6" /> : <Video className="h-6 w-6" />}
              </Button>
            )}

            {/* End Call Button */}
            <Button
              variant="destructive"
              size="lg"
              onClick={handleEndCall}
              className="rounded-full h-16 w-16 bg-red-600 hover:bg-red-700"
            >
              <PhoneOff className="h-6 w-6" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default CallInterface;
