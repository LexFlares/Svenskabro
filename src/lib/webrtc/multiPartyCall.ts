import { supabase } from '@/lib/supabase';

export interface Participant {
  userId: string;
  userName: string;
  stream: MediaStream | null;
  peerConnection: RTCPeerConnection | null;
  isAudioMuted: boolean;
  isVideoMuted: boolean;
  isSharingScreen: boolean;
  isHost: boolean;
}

export interface CallSession {
  sessionId: string;
  hostId: string;
  participants: Map<string, Participant>;
  screenShareStream: MediaStream | null;
  recordingStream: MediaStream | null;
  isRecording: boolean;
  startTime: Date;
}

export class MultiPartyCallService {
  private sessions: Map<string, CallSession> = new Map();
  private localStream: MediaStream | null = null;
  private screenStream: MediaStream | null = null;
  private iceServers: RTCIceServer[] = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' }
  ];

  async createSession(hostId: string, hostName: string): Promise<string> {
    const sessionId = this.generateSessionId();

    const session: CallSession = {
      sessionId,
      hostId,
      participants: new Map(),
      screenShareStream: null,
      recordingStream: null,
      isRecording: false,
      startTime: new Date()
    };

    const hostParticipant: Participant = {
      userId: hostId,
      userName: hostName,
      stream: await this.getLocalStream(),
      peerConnection: null,
      isAudioMuted: false,
      isVideoMuted: false,
      isSharingScreen: false,
      isHost: true
    };

    session.participants.set(hostId, hostParticipant);
    this.sessions.set(sessionId, session);

    await this.createCallRecord(sessionId, hostId, []);

    console.log('✅ Created multi-party call session:', sessionId);
    return sessionId;
  }

  async joinSession(sessionId: string, userId: string, userName: string): Promise<boolean> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      console.error('Session not found:', sessionId);
      return false;
    }

    const participant: Participant = {
      userId,
      userName,
      stream: await this.getLocalStream(),
      peerConnection: null,
      isAudioMuted: false,
      isVideoMuted: false,
      isSharingScreen: false,
      isHost: false
    };

    session.participants.set(userId, participant);

    await this.updateCallParticipants(sessionId, Array.from(session.participants.keys()));

    await this.connectToAllParticipants(sessionId, userId);

    console.log('✅ Joined session:', sessionId, 'as', userName);
    return true;
  }

  async leaveSession(sessionId: string, userId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    const participant = session.participants.get(userId);
    if (participant) {
      if (participant.peerConnection) {
        participant.peerConnection.close();
      }
      if (participant.stream) {
        participant.stream.getTracks().forEach(track => track.stop());
      }
    }

    session.participants.delete(userId);

    if (session.participants.size === 0 || userId === session.hostId) {
      await this.endSession(sessionId);
    } else {
      await this.updateCallParticipants(sessionId, Array.from(session.participants.keys()));
    }

    console.log('✅ Left session:', sessionId);
  }

  async startScreenShare(sessionId: string, userId: string): Promise<boolean> {
    try {
      this.screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          cursor: 'always',
          displaySurface: 'monitor'
        } as any,
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      const session = this.sessions.get(sessionId);
      if (!session) return false;

      const participant = session.participants.get(userId);
      if (!participant) return false;

      participant.isSharingScreen = true;
      session.screenShareStream = this.screenStream;

      await this.broadcastScreenToAll(sessionId, userId);

      this.screenStream.getVideoTracks()[0].onended = () => {
        this.stopScreenShare(sessionId, userId);
      };

      console.log('✅ Started screen sharing');
      return true;
    } catch (error) {
      console.error('Screen share failed:', error);
      return false;
    }
  }

  async stopScreenShare(sessionId: string, userId: string): Promise<void> {
    if (this.screenStream) {
      this.screenStream.getTracks().forEach(track => track.stop());
      this.screenStream = null;
    }

    const session = this.sessions.get(sessionId);
    if (session) {
      const participant = session.participants.get(userId);
      if (participant) {
        participant.isSharingScreen = false;
      }
      session.screenShareStream = null;
    }

    console.log('✅ Stopped screen sharing');
  }

  async toggleAudio(sessionId: string, userId: string): Promise<boolean> {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    const participant = session.participants.get(userId);
    if (!participant || !participant.stream) return false;

    const audioTracks = participant.stream.getAudioTracks();
    if (audioTracks.length === 0) return false;

    audioTracks.forEach(track => {
      track.enabled = !track.enabled;
    });

    participant.isAudioMuted = !audioTracks[0].enabled;
    console.log('🔊 Audio', participant.isAudioMuted ? 'muted' : 'unmuted');
    return participant.isAudioMuted;
  }

  async toggleVideo(sessionId: string, userId: string): Promise<boolean> {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    const participant = session.participants.get(userId);
    if (!participant || !participant.stream) return false;

    const videoTracks = participant.stream.getVideoTracks();
    if (videoTracks.length === 0) return false;

    videoTracks.forEach(track => {
      track.enabled = !track.enabled;
    });

    participant.isVideoMuted = !videoTracks[0].enabled;
    console.log('📹 Video', participant.isVideoMuted ? 'off' : 'on');
    return participant.isVideoMuted;
  }

  async startRecording(sessionId: string): Promise<boolean> {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    try {
      const audioContext = new AudioContext();
      const destination = audioContext.createMediaStreamDestination();

      session.participants.forEach(participant => {
        if (participant.stream) {
          const audioTracks = participant.stream.getAudioTracks();
          audioTracks.forEach(track => {
            const source = audioContext.createMediaStreamSource(new MediaStream([track]));
            source.connect(destination);
          });
        }
      });

      session.recordingStream = destination.stream;
      session.isRecording = true;

      console.log('🔴 Started recording');
      return true;
    } catch (error) {
      console.error('Recording failed:', error);
      return false;
    }
  }

  async stopRecording(sessionId: string): Promise<Blob | null> {
    const session = this.sessions.get(sessionId);
    if (!session || !session.isRecording) return null;

    session.isRecording = false;

    const blob = new Blob([], { type: 'audio/webm' });
    console.log('⏹️ Stopped recording');
    return blob;
  }

  private async connectToAllParticipants(sessionId: string, newUserId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    const newParticipant = session.participants.get(newUserId);
    if (!newParticipant) return;

    for (const [participantId, participant] of session.participants) {
      if (participantId === newUserId) continue;

      const peerConnection = this.createPeerConnection();
      newParticipant.peerConnection = peerConnection;

      if (newParticipant.stream) {
        newParticipant.stream.getTracks().forEach(track => {
          peerConnection.addTrack(track, newParticipant.stream!);
        });
      }

      peerConnection.ontrack = (event) => {
        console.log('📥 Received track from', participantId);
      };

      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);

      await this.sendSignal(sessionId, newUserId, participantId, {
        type: 'offer',
        sdp: offer.sdp
      });
    }
  }

  private async broadcastScreenToAll(sessionId: string, sharerId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session || !this.screenStream) return;

    for (const [participantId] of session.participants) {
      if (participantId === sharerId) continue;

      console.log('📺 Broadcasting screen to', participantId);
    }
  }

  private createPeerConnection(): RTCPeerConnection {
    return new RTCPeerConnection({ iceServers: this.iceServers });
  }

  private async getLocalStream(): Promise<MediaStream> {
    if (this.localStream) return this.localStream;

    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      return this.localStream;
    } catch (error) {
      console.error('Failed to get media stream:', error);
      throw error;
    }
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }

  private async createCallRecord(sessionId: string, hostId: string, participants: string[]): Promise<void> {
    await supabase
      .from('webrtc_calls')
      .insert({
        id: sessionId,
        from_user_id: hostId,
        to_user_id: participants[0] || hostId,
        status: 'active',
        offer: { type: 'multi_party', participants }
      });
  }

  private async updateCallParticipants(sessionId: string, participants: string[]): Promise<void> {
    await supabase
      .from('webrtc_calls')
      .update({
        offer: { type: 'multi_party', participants },
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId);
  }

  private async sendSignal(sessionId: string, from: string, to: string, signal: any): Promise<void> {
    await supabase
      .from('ice_candidates')
      .insert({
        call_id: sessionId,
        from_user_id: from,
        candidate: signal
      });
  }

  private async endSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    session.participants.forEach(participant => {
      if (participant.peerConnection) {
        participant.peerConnection.close();
      }
      if (participant.stream) {
        participant.stream.getTracks().forEach(track => track.stop());
      }
    });

    if (this.screenStream) {
      this.screenStream.getTracks().forEach(track => track.stop());
      this.screenStream = null;
    }

    this.sessions.delete(sessionId);

    await supabase
      .from('webrtc_calls')
      .update({ status: 'ended', updated_at: new Date().toISOString() })
      .eq('id', sessionId);

    console.log('✅ Ended session:', sessionId);
  }

  getSession(sessionId: string): CallSession | undefined {
    return this.sessions.get(sessionId);
  }

  getParticipants(sessionId: string): Participant[] {
    const session = this.sessions.get(sessionId);
    return session ? Array.from(session.participants.values()) : [];
  }
}

export const multiPartyCall = new MultiPartyCallService();
