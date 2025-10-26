import { database } from "./firebase";
import { ref, set, onValue, off, remove } from "firebase/database";

export interface CallOffer {
  from: string;
  to: string;
  offer: RTCSessionDescriptionInit;
  timestamp: number;
}

export interface CallAnswer {
  answer: RTCSessionDescriptionInit;
}

export interface IceCandidate {
  candidate: RTCIceCandidateInit;
  from: string;
}

export class WebRTCManager {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private callId: string | null = null;
  private userId: string;
  private configuration: RTCConfiguration = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
    ]
  };

  constructor(userId: string) {
    this.userId = userId;
  }

  // Starta samtal (utgående)
  async startCall(targetUserId: string, audioOnly: boolean = false): Promise<string> {
    try {
      // Skapa call ID
      this.callId = `call_${this.userId}_${targetUserId}_${Date.now()}`;

      // Hämta media stream
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: !audioOnly
      });

      // Skapa peer connection
      this.peerConnection = new RTCPeerConnection(this.configuration);

      // Lägg till local tracks
      this.localStream.getTracks().forEach(track => {
        this.peerConnection?.addTrack(track, this.localStream!);
      });

      // Hantera remote stream
      this.peerConnection.ontrack = (event) => {
        if (!this.remoteStream) {
          this.remoteStream = new MediaStream();
        }
        event.streams[0].getTracks().forEach(track => {
          this.remoteStream?.addTrack(track);
        });
      };

      // Hantera ICE candidates
      this.peerConnection.onicecandidate = (event) => {
        if (event.candidate && this.callId) {
          this.sendIceCandidate(event.candidate);
        }
      };

      // Skapa offer
      const offer = await this.peerConnection.createOffer();
      await this.peerConnection.setLocalDescription(offer);

      // Skicka offer via Firebase
      await this.sendCallOffer(targetUserId, offer);

      // Lyssna på svar
      this.listenForAnswer();
      this.listenForIceCandidates();

      return this.callId;
    } catch (error) {
      console.error("Error starting call:", error);
      throw error;
    }
  }

  // Svara på samtal (inkommande)
  async answerCall(callId: string, offer: RTCSessionDescriptionInit, audioOnly: boolean = false): Promise<void> {
    try {
      this.callId = callId;

      // Hämta media stream
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: !audioOnly
      });

      // Skapa peer connection
      this.peerConnection = new RTCPeerConnection(this.configuration);

      // Lägg till local tracks
      this.localStream.getTracks().forEach(track => {
        this.peerConnection?.addTrack(track, this.localStream!);
      });

      // Hantera remote stream
      this.peerConnection.ontrack = (event) => {
        if (!this.remoteStream) {
          this.remoteStream = new MediaStream();
        }
        event.streams[0].getTracks().forEach(track => {
          this.remoteStream?.addTrack(track);
        });
      };

      // Hantera ICE candidates
      this.peerConnection.onicecandidate = (event) => {
        if (event.candidate && this.callId) {
          this.sendIceCandidate(event.candidate);
        }
      };

      // Sätt remote description (offer)
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));

      // Skapa answer
      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);

      // Skicka answer via Firebase
      await this.sendCallAnswer(answer);

      // Lyssna på ICE candidates
      this.listenForIceCandidates();
    } catch (error) {
      console.error("Error answering call:", error);
      throw error;
    }
  }

  // Avsluta samtal
  async endCall(): Promise<void> {
    // Stäng peer connection
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    // Stoppa local stream
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    // Rensa remote stream
    this.remoteStream = null;

    // Ta bort call data från Firebase
    if (this.callId && database) {
      const callRef = ref(database, `calls/${this.callId}`);
      await remove(callRef);
    }

    this.callId = null;
  }

  // Toggle mikrofon
  toggleMute(): boolean {
    if (this.localStream) {
      const audioTrack = this.localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        return !audioTrack.enabled;
      }
    }
    return false;
  }

  // Toggle kamera
  toggleVideo(): boolean {
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        return !videoTrack.enabled;
      }
    }
    return false;
  }

  // Getters för streams
  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  getRemoteStream(): MediaStream | null {
    return this.remoteStream;
  }

  // Firebase signaling methods
  private async sendCallOffer(targetUserId: string, offer: RTCSessionDescriptionInit): Promise<void> {
    if (!database || !this.callId) return;

    const callRef = ref(database, `calls/${this.callId}`);
    await set(callRef, {
      from: this.userId,
      to: targetUserId,
      offer: offer,
      timestamp: Date.now(),
      status: "ringing"
    });
  }

  private async sendCallAnswer(answer: RTCSessionDescriptionInit): Promise<void> {
    if (!database || !this.callId) return;

    const answerRef = ref(database, `calls/${this.callId}/answer`);
    await set(answerRef, {
      answer: answer,
      timestamp: Date.now()
    });

    const statusRef = ref(database, `calls/${this.callId}/status`);
    await set(statusRef, "active");
  }

  private async sendIceCandidate(candidate: RTCIceCandidate): Promise<void> {
    if (!database || !this.callId) return;

    const candidateRef = ref(database, `calls/${this.callId}/candidates/${this.userId}_${Date.now()}`);
    await set(candidateRef, {
      candidate: candidate.toJSON(),
      from: this.userId,
      timestamp: Date.now()
    });
  }

  private listenForAnswer(): void {
    if (!database || !this.callId) return;

    const answerRef = ref(database, `calls/${this.callId}/answer`);
    onValue(answerRef, async (snapshot) => {
      const data = snapshot.val();
      if (data && data.answer && this.peerConnection) {
        await this.peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
      }
    });
  }

  private listenForIceCandidates(): void {
    if (!database || !this.callId) return;

    const candidatesRef = ref(database, `calls/${this.callId}/candidates`);
    onValue(candidatesRef, (snapshot) => {
      snapshot.forEach((childSnapshot) => {
        const data = childSnapshot.val();
        if (data && data.from !== this.userId && this.peerConnection) {
          this.peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate))
            .catch(error => {
              console.error("Error adding ICE candidate:", error);
            });
        }
      });
    });
  }
}

// Lyssna på inkommande samtal
export const subscribeToIncomingCalls = (
  userId: string,
  callback: (callData: CallOffer) => void
): (() => void) => {
  if (!database) {
    return () => {};
  }

  const callsRef = ref(database, "calls");

  const unsubscribe = onValue(callsRef, (snapshot) => {
    snapshot.forEach((childSnapshot) => {
      const callData = childSnapshot.val();
      if (callData.to === userId && callData.status === "ringing") {
        callback({
          from: callData.from,
          to: callData.to,
          offer: callData.offer,
          timestamp: callData.timestamp
        });
      }
    });
  });

  return () => off(callsRef);
};
