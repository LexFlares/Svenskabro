// Complete WebRTC Service for Voice/Video Calls
import { createClient } from '@supabase/supabase-js';
import SimplePeer from 'simple-peer';

interface CallSession {
  id: string;
  caller_id: string;
  callee_id: string;
  call_type: 'voice' | 'video' | 'screen_share';
  status: 'ringing' | 'active' | 'ended' | 'missed' | 'declined';
  started_at: string;
  ended_at?: string;
}

interface SignalData {
  type: 'offer' | 'answer' | 'ice-candidate';
  data: any;
}

class WebRTCService {
  private peer: SimplePeer.Instance | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private supabase: any;
  private currentCallId: string | null = null;
  private userId: string | null = null;
  
  // Event callbacks
  public onIncomingCall?: (callData: CallSession) => void;
  public onCallEnded?: () => void;
  public onRemoteStream?: (stream: MediaStream) => void;
  public onError?: (error: Error) => void;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.setupRealtimeListeners();
  }

  async initialize(userId: string) {
    this.userId = userId;
    console.log('✅ WebRTC Service initialized for user:', userId);
  }

  private setupRealtimeListeners() {
    // Listen for incoming call signals
    const signalChannel = this.supabase
      .channel('webrtc_signaling')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'webrtc_signaling',
          filter: `to_user_id=eq.${this.userId}`
        },
        (payload: any) => {
          this.handleIncomingSignal(payload.new);
        }
      )
      .subscribe();

    // Listen for call status changes
    const callChannel = this.supabase
      .channel('call_sessions')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'call_sessions',
          filter: `callee_id=eq.${this.userId}`
        },
        (payload: any) => {
          if (payload.eventType === 'INSERT') {
            this.handleIncomingCall(payload.new);
          } else if (payload.eventType === 'UPDATE') {
            this.handleCallUpdate(payload.new);
          }
        }
      )
      .subscribe();
  }

  async startVoiceCall(targetUserId: string): Promise<string> {
    try {
      // 1. Create call session in database
      const { data: callSession, error } = await this.supabase
        .from('call_sessions')
        .insert({
          caller_id: this.userId,
          callee_id: targetUserId,
          call_type: 'voice',
          status: 'ringing'
        })
        .select()
        .single();

      if (error) throw error;
      this.currentCallId = callSession.id;

      // 2. Get user media (audio only)
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        },
        video: false
      });

      // 3. Create peer connection as initiator
      this.peer = new SimplePeer({
        initiator: true,
        stream: this.localStream,
        trickle: true,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' }
          ]
        }
      });

      this.setupPeerListeners();

      // 4. Send offer when generated
      this.peer.on('signal', async (data) => {
        await this.sendSignal(targetUserId, 'offer', data);
      });

      console.log('📞 Voice call initiated to:', targetUserId);
      return callSession.id;
    } catch (error) {
      console.error('❌ Failed to start voice call:', error);
      this.onError?.(error as Error);
      throw error;
    }
  }

  async startVideoCall(targetUserId: string): Promise<string> {
    try {
      // Similar to voice call but with video enabled
      const { data: callSession, error } = await this.supabase
        .from('call_sessions')
        .insert({
          caller_id: this.userId,
          callee_id: targetUserId,
          call_type: 'video',
          status: 'ringing'
        })
        .select()
        .single();

      if (error) throw error;
      this.currentCallId = callSession.id;

      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        },
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        }
      });

      this.peer = new SimplePeer({
        initiator: true,
        stream: this.localStream,
        trickle: true,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
          ]
        }
      });

      this.setupPeerListeners();

      this.peer.on('signal', async (data) => {
        await this.sendSignal(targetUserId, 'offer', data);
      });

      console.log('📹 Video call initiated to:', targetUserId);
      return callSession.id;
    } catch (error) {
      console.error('❌ Failed to start video call:', error);
      this.onError?.(error as Error);
      throw error;
    }
  }

  

  async answerCall(callId: string) {
    try {
      this.currentCallId = callId;

      // Get call details
      const { data: callSession } = await this.supabase
        .from('call_sessions')
        .select('*')
        .eq('id', callId)
        .single();

      // Get user media based on call type
      const constraints: MediaStreamConstraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        },
        video: callSession.call_type === 'video'
      };

      this.localStream = await navigator.mediaDevices.getUserMedia(constraints);

      // Create peer connection as non-initiator
      this.peer = new SimplePeer({
        initiator: false,
        stream: this.localStream,
        trickle: true,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
          ]
        }
      });

      this.setupPeerListeners();

      // Update call status
      await this.supabase
        .from('call_sessions')
        .update({ status: 'active' })
        .eq('id', callId);

      // Send answer signal
      this.peer.on('signal', async (data) => {
        await this.sendSignal(callSession.caller_id, 'answer', data);
      });

      console.log('✅ Call answered:', callId);
    } catch (error) {
      console.error('❌ Failed to answer call:', error);
      this.onError?.(error as Error);
      throw error;
    }
  }

  async declineCall(callId: string) {
    try {
      await this.supabase
        .from('call_sessions')
        .update({ 
          status: 'declined',
          ended_at: new Date().toISOString()
        })
        .eq('id', callId);

      console.log('❌ Call declined:', callId);
    } catch (error) {
      console.error('Failed to decline call:', error);
    }
  }

  async endCall() {
    try {
      if (this.currentCallId) {
        // Calculate duration
        const { data: callSession } = await this.supabase
          .from('call_sessions')
          .select('started_at')
          .eq('id', this.currentCallId)
          .single();

        const duration = Math.floor(
          (Date.now() - new Date(callSession.started_at).getTime()) / 1000
        );

        await this.supabase
          .from('call_sessions')
          .update({ 
            status: 'ended',
            ended_at: new Date().toISOString(),
            duration_seconds: duration
          })
          .eq('id', this.currentCallId);
      }

      // Clean up peer connection
      if (this.peer) {
        this.peer.destroy();
        this.peer = null;
      }

      // Stop local stream
      if (this.localStream) {
        this.localStream.getTracks().forEach(track => track.stop());
        this.localStream = null;
      }

      this.currentCallId = null;
      this.onCallEnded?.();

      console.log('📴 Call ended');
    } catch (error) {
      console.error('Failed to end call:', error);
    }
  }

  private setupPeerListeners() {
    if (!this.peer) return;

    this.peer.on('stream', (stream: MediaStream) => {
      console.log('📡 Received remote stream');
      this.remoteStream = stream;
      this.onRemoteStream?.(stream);
    });

    this.peer.on('connect', () => {
      console.log('🔗 Peer connection established');
    });

    this.peer.on('error', (err: Error) => {
      console.error('❌ Peer error:', err);
      this.onError?.(err);
    });

    this.peer.on('close', () => {
      console.log('🔌 Peer connection closed');
      this.endCall();
    });
  }

  private async sendSignal(targetUserId: string, type: string, data: any) {
    try {
      await this.supabase
        .from('webrtc_signaling')
        .insert({
          call_id: this.currentCallId,
          from_user_id: this.userId,
          to_user_id: targetUserId,
          signal_type: type,
          signal_data: data
        });
    } catch (error) {
      console.error('Failed to send signal:', error);
    }
  }

  private async handleIncomingSignal(signal: any) {
    if (!this.peer) return;

    try {
      if (signal.signal_type === 'offer' || signal.signal_type === 'answer') {
        this.peer.signal(signal.signal_data);
      } else if (signal.signal_type === 'ice-candidate') {
        this.peer.signal(signal.signal_data);
      }
    } catch (error) {
      console.error('Failed to handle incoming signal:', error);
    }
  }

  private handleIncomingCall(callData: CallSession) {
    console.log('📞 Incoming call from:', callData.caller_id);
    this.onIncomingCall?.(callData);
  }

  private handleCallUpdate(callData: CallSession) {
    if (callData.status === 'ended' || callData.status === 'declined') {
      this.endCall();
    }
  }

  // Utility methods
  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  getRemoteStream(): MediaStream | null {
    return this.remoteStream;
  }

  toggleMute() {
    if (this.localStream) {
      const audioTrack = this.localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        return !audioTrack.enabled; // Return muted state
      }
    }
    return false;
  }

  toggleVideo() {
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        return !videoTrack.enabled; // Return video off state
      }
    }
    return false;
  }
}

export default WebRTCService;
export type { CallSession, SignalData };
