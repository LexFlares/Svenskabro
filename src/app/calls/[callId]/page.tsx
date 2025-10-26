"use client";

import { CallInterface } from '@/components/calls/CallInterface';
import { use } from 'react';

export default function CallPage({ params }: { params: Promise<{ callId: string }> }) {
  const { callId } = use(params);

  return <CallInterface callId={callId} />;
}
