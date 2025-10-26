export class WebRTCCallService {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;

  async startVoiceCall(targetUserId: string): Promise<boolean> {
    try {
      this.peerConnection = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      });

      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true }
      });

      this.localStream.getTracks().forEach(track => {
        this.peerConnection!.addTrack(track, this.localStream!);
      });

      console.log('Call started to:', targetUserId);
      return true;
    } catch (error) {
      console.error('Call failed:', error);
      return false;
    }
  }

  async endCall() {
    if (this.localStream) {
      this.localStream.getTracks().forEach(t => t.stop());
    }
    if (this.peerConnection) {
      this.peerConnection.close();
    }
  }
}

export const callService = new WebRTCCallService();
