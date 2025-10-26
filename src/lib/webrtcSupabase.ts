import { supabase } from "@/integrations/supabase/client";
import type { RealtimeChannel, RealtimePresenceState } from "@supabase/supabase-js";
import type { Json } from "@/types";
import { encryptionService } from "@/lib/encryption";

export type CallType = "video" | "audio";

export interface CallData {
  id: string;
  from_user_id: string;
  to_user_id: string;
  offer?: RTCSessionDescriptionInit;
  answer?: RTCSessionDescriptionInit;
  status: "ringing" | "active" | "ended";
  created_at: string;
}

interface RTCSessionDescriptionJSON {
  type: RTCSdpType;
  sdp: string;
}

interface RTCIceCandidateJSON {
  candidate: string;
  sdpMid: string | null;
  sdpMLineIndex: number | null;
}

class WebRTCSupabase {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private callChannel: RealtimeChannel | null = null;
  private candidatesChannel: RealtimeChannel | null = null;
  private currentCallId: string | null = null;
  private currentUserId: string | null = null;

  private configuration: RTCConfiguration = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" }
    ]
  };

  async initialize(userId: string) {
    this.currentUserId = userId;
  }

  async startCall(
    toUserId: string,
    callType: CallType
  ): Promise<{ callId: string; error?: string }> {
    if (!this.currentUserId) {
      return { callId: "", error: "User not initialized" };
    }

    try {
      const callId = `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      this.currentCallId = callId;

      const { error: insertError } = await supabase
        .from("webrtc_calls")
        .insert({
          id: callId,
          from_user_id: this.currentUserId,
          to_user_id: toUserId,
          status: "ringing"
        });

      if (insertError) throw insertError;

      await this.setupLocalStream(callType);
      await this.setupPeerConnection(callId);
      await this.createOffer(callId);

      return { callId };
    } catch (error) {
      console.error("Failed to start call:", error);
      return { callId: "", error: (error as Error).message };
    }
  }

  async answerCall(callId: string, callType: CallType): Promise<{ error?: string }> {
    try {
      this.currentCallId = callId;

      const { data: callData, error: fetchError } = await supabase
        .from("webrtc_calls")
        .select("*")
        .eq("id", callId)
        .single();

      if (fetchError) throw fetchError;

      await this.setupLocalStream(callType);
      await this.setupPeerConnection(callId);

      if (callData.offer) {
        // Fix: Properly handle Json to RTCSessionDescriptionInit conversion
        const offerJson = callData.offer as unknown as RTCSessionDescriptionJSON;
        await this.peerConnection!.setRemoteDescription(
          new RTCSessionDescription({ type: offerJson.type, sdp: offerJson.sdp })
        );
        await this.createAnswer(callId);
      }

      return {};
    } catch (error) {
      console.error("Failed to answer call:", error);
      return { error: (error as Error).message };
    }
  }

  private async setupLocalStream(callType: CallType) {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: callType === "video",
        audio: true
      });
    } catch (error) {
      console.error("Failed to get local stream:", error);
      throw error;
    }
  }

  private async setupPeerConnection(callId: string) {
    this.peerConnection = new RTCPeerConnection(this.configuration);

    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        this.peerConnection!.addTrack(track, this.localStream!);
      });
    }

    this.remoteStream = new MediaStream();

    this.peerConnection.ontrack = (event) => {
      event.streams[0].getTracks().forEach(track => {
        this.remoteStream!.addTrack(track);
      });
    };

    this.peerConnection.onicecandidate = async (event) => {
      if (event.candidate && this.currentUserId) {
        try {
          // Fix: Properly convert RTCIceCandidate to Json format
          const candidateJson: RTCIceCandidateJSON = {
            candidate: event.candidate.candidate,
            sdpMid: event.candidate.sdpMid,
            sdpMLineIndex: event.candidate.sdpMLineIndex,
          };
          
          await supabase
            .from("ice_candidates")
            .insert({
              call_id: callId,
              from_user_id: this.currentUserId,
              candidate: candidateJson as unknown as Json,
            });
        } catch (error) {
          console.error("Failed to save ICE candidate:", error);
        }
      }
    };

    await this.setupCallChannels(callId);
  }

  private async setupCallChannels(callId: string) {
    this.callChannel = supabase
      .channel(`call:${callId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "webrtc_calls",
          filter: `id=eq.${callId}`
        },
        async (payload) => {
          const callData = payload.new as CallData;
          
          if (callData.answer && !this.peerConnection!.currentRemoteDescription) {
            // Fix: Properly handle Json to RTCSessionDescriptionInit conversion
            const answerJson = callData.answer as unknown as RTCSessionDescriptionJSON;
            await this.peerConnection!.setRemoteDescription(
              new RTCSessionDescription({ type: answerJson.type, sdp: answerJson.sdp })
            );
          }

          if (callData.status === "ended") {
            this.endCall();
          }
        }
      )
      .subscribe();

    this.candidatesChannel = supabase
      .channel(`candidates:${callId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "ice_candidates",
          filter: `call_id=eq.${callId}`
        },
        async (payload) => {
          const candidateData = payload.new as { candidate: RTCIceCandidateJSON; from_user_id: string };
          
          if (candidateData.from_user_id !== this.currentUserId) {
            try {
              await this.peerConnection!.addIceCandidate(
                new RTCIceCandidate(candidateData.candidate)
              );
            } catch (error) {
              console.error("Failed to add ICE candidate:", error);
            }
          }
        }
      )
      .subscribe();
  }

  private async createOffer(callId: string) {
    try {
      const offer = await this.peerConnection!.createOffer();
      await this.peerConnection!.setLocalDescription(offer);

      // Fix: Properly convert RTCSessionDescriptionInit to Json
      const offerJson: RTCSessionDescriptionJSON = {
        type: this.peerConnection!.localDescription!.type,
        sdp: this.peerConnection!.localDescription!.sdp
      };

      await supabase
        .from("webrtc_calls")
        .update({ offer: offerJson as unknown as Json })
        .eq("id", callId);
    } catch (error) {
      console.error("Failed to create offer:", error);
      throw error;
    }
  }

  private async createAnswer(callId: string) {
    try {
      const answer = await this.peerConnection!.createAnswer();
      await this.peerConnection!.setLocalDescription(answer);

      // Fix: Properly convert RTCSessionDescriptionInit to Json
      const answerJson: RTCSessionDescriptionJSON = {
        type: this.peerConnection!.localDescription!.type,
        sdp: this.peerConnection!.localDescription!.sdp
      };

      await supabase
        .from("webrtc_calls")
        .update({
          answer: answerJson as unknown as Json,
          status: "active"
        })
        .eq("id", callId);
    } catch (error) {
      console.error("Failed to create answer:", error);
      throw error;
    }
  }

  async endCall() {
    if (this.currentCallId) {
      try {
        await supabase
          .from("webrtc_calls")
          .update({ status: "ended" })
          .eq("id", this.currentCallId);
      } catch (error) {
        console.error("Failed to update call status:", error);
      }
    }

    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    if (this.callChannel) {
      await supabase.removeChannel(this.callChannel);
      this.callChannel = null;
    }

    if (this.candidatesChannel) {
      await supabase.removeChannel(this.candidatesChannel);
      this.candidatesChannel = null;
    }

    this.currentCallId = null;
    this.remoteStream = null;
  }

  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  getRemoteStream(): MediaStream | null {
    return this.remoteStream;
  }

  listenForIncomingCalls(
    onIncomingCall: (callData: CallData) => void
  ): RealtimeChannel {
    if (!this.currentUserId) {
      throw new Error("User not initialized");
    }

    const channel = supabase
      .channel("incoming-calls")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "webrtc_calls",
          filter: `to_user_id=eq.${this.currentUserId}`
        },
        (payload) => {
          const callData = payload.new as CallData;
          if (callData.status === "ringing") {
            onIncomingCall(callData);
          }
        }
      )
      .subscribe();

    return channel;
  }

  async declineCall(callId: string) {
    try {
      await supabase
        .from("webrtc_calls")
        .update({ status: "ended" })
        .eq("id", callId);
    } catch (error) {
      console.error("Failed to decline call:", error);
    }
  }
}

export const webrtcSupabase = new WebRTCSupabase();
