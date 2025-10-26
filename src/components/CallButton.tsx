'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { callService } from '@/lib/webrtcService';
import { Phone, PhoneOff } from 'lucide-react';

export function CallButton({ targetUserId, targetUserName }: { targetUserId: string; targetUserName: string }) {
  const [calling, setCalling] = useState(false);

  return calling ? (
    <Button onClick={async () => { await callService.endCall(); setCalling(false); }} variant="destructive">
      <PhoneOff className="w-4 h-4 mr-2" /> Lägg på
    </Button>
  ) : (
    <Button onClick={async () => { if (await callService.startVoiceCall(targetUserId)) setCalling(true); }} className="bg-green-600">
      <Phone className="w-4 h-4 mr-2" /> Ring {targetUserName}
    </Button>
  );
}
