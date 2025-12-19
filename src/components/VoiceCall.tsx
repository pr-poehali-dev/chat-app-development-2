import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import Icon from '@/components/ui/icon';

interface VoiceCallProps {
  currentUserId: string;
  targetUserId: string;
  targetUsername: string;
  isIncoming?: boolean;
  onClose: () => void;
  signalingUrl: string;
}

const VoiceCall = ({
  currentUserId,
  targetUserId,
  targetUsername,
  isIncoming = false,
  onClose,
  signalingUrl,
}: VoiceCallProps) => {
  const [callStatus, setCallStatus] = useState<'connecting' | 'ringing' | 'active' | 'ended'>(
    isIncoming ? 'ringing' : 'connecting'
  );
  const [isMuted, setIsMuted] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [callId, setCallId] = useState<string | null>(null);

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const callTimerRef = useRef<NodeJS.Timeout | null>(null);

  const ICE_SERVERS = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ],
  };

  useEffect(() => {
    if (!isIncoming) {
      initiateCall();
    }

    return () => {
      cleanup();
    };
  }, []);

  useEffect(() => {
    if (callStatus === 'active') {
      callTimerRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
    }

    return () => {
      if (callTimerRef.current) clearInterval(callTimerRef.current);
    };
  }, [callStatus]);

  const cleanup = async () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
    }
    if (callId) {
      await fetch(signalingUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': currentUserId,
        },
        body: JSON.stringify({
          action: 'end',
          callId,
        }),
      });
    }
  };

  const initiateCall = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = stream;

      const peerConnection = new RTCPeerConnection(ICE_SERVERS);
      peerConnectionRef.current = peerConnection;

      stream.getTracks().forEach(track => {
        peerConnection.addTrack(track, stream);
      });

      peerConnection.ontrack = event => {
        if (remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = event.streams[0];
          remoteAudioRef.current.play();
        }
      };

      peerConnection.onicecandidate = event => {
        if (event.candidate && callId) {
          fetch(signalingUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-User-Id': currentUserId,
            },
            body: JSON.stringify({
              action: 'ice_candidate',
              callId,
              candidate: event.candidate,
            }),
          });
        }
      };

      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);

      const response = await fetch(signalingUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': currentUserId,
        },
        body: JSON.stringify({
          action: 'call',
          targetUserId,
          offer: {
            type: offer.type,
            sdp: offer.sdp,
          },
        }),
      });

      const data = await response.json();
      setCallId(data.callId);
      setCallStatus('ringing');

      pollForAnswer(data.callId);
    } catch (error) {
      console.error('Error initiating call:', error);
      setCallStatus('ended');
    }
  };

  const pollForAnswer = async (callIdParam: string) => {
    const maxAttempts = 60;
    let attempts = 0;

    const interval = setInterval(async () => {
      attempts++;

      if (attempts > maxAttempts) {
        clearInterval(interval);
        setCallStatus('ended');
        return;
      }

      try {
        const response = await fetch(
          `${signalingUrl}?action=call_status&callId=${callIdParam}`,
          {
            headers: {
              'X-User-Id': currentUserId,
            },
          }
        );

        const data = await response.json();

        if (data.answer && peerConnectionRef.current) {
          clearInterval(interval);
          await peerConnectionRef.current.setRemoteDescription(
            new RTCSessionDescription(data.answer)
          );
          setCallStatus('active');

          if (data.iceCandidates) {
            data.iceCandidates.forEach((candidate: RTCIceCandidateInit) => {
              peerConnectionRef.current?.addIceCandidate(new RTCIceCandidate(candidate));
            });
          }
        }
      } catch (error) {
        console.error('Error polling for answer:', error);
      }
    }, 1000);
  };

  const answerCall = async (incomingCallId: string, offer: RTCSessionDescriptionInit) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = stream;

      const peerConnection = new RTCPeerConnection(ICE_SERVERS);
      peerConnectionRef.current = peerConnection;

      stream.getTracks().forEach(track => {
        peerConnection.addTrack(track, stream);
      });

      peerConnection.ontrack = event => {
        if (remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = event.streams[0];
          remoteAudioRef.current.play();
        }
      };

      peerConnection.onicecandidate = event => {
        if (event.candidate) {
          fetch(signalingUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-User-Id': currentUserId,
            },
            body: JSON.stringify({
              action: 'ice_candidate',
              callId: incomingCallId,
              candidate: event.candidate,
            }),
          });
        }
      };

      await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));

      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);

      await fetch(signalingUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': currentUserId,
        },
        body: JSON.stringify({
          action: 'answer',
          callId: incomingCallId,
          answer: {
            type: answer.type,
            sdp: answer.sdp,
          },
        }),
      });

      setCallId(incomingCallId);
      setCallStatus('active');
    } catch (error) {
      console.error('Error answering call:', error);
      setCallStatus('ended');
    }
  };

  const handleEndCall = async () => {
    await cleanup();
    setCallStatus('ended');
    setTimeout(() => {
      onClose();
    }, 1000);
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md animate-fade-in">
      <Card className="w-96 bg-gradient-to-br from-card via-card to-primary/10 border-border/50 p-8 shadow-2xl">
        <audio ref={remoteAudioRef} autoPlay />

        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <div
              className={`absolute inset-0 rounded-full blur-2xl ${
                callStatus === 'active'
                  ? 'bg-green-500/30 animate-pulse'
                  : 'bg-primary/30 animate-pulse'
              }`}
            />
            <Avatar className="h-32 w-32 relative border-4 border-primary/50">
              <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white text-5xl font-bold">
                {targetUsername[0]}
              </AvatarFallback>
            </Avatar>
          </div>

          <div className="text-center space-y-2">
            <h3 className="text-2xl font-bold">{targetUsername}</h3>
            <p className="text-lg text-muted-foreground">
              {callStatus === 'connecting' && 'Подключение...'}
              {callStatus === 'ringing' && 'Звоним...'}
              {callStatus === 'active' && formatDuration(callDuration)}
              {callStatus === 'ended' && 'Звонок завершён'}
            </p>
          </div>

          {callStatus === 'ringing' && isIncoming && (
            <div className="flex gap-4 w-full">
              <Button
                onClick={handleEndCall}
                className="flex-1 bg-destructive hover:bg-destructive/90 rounded-2xl h-14"
              >
                <Icon name="PhoneOff" size={24} />
              </Button>
              <Button
                onClick={() => {
                  
                }}
                className="flex-1 bg-green-500 hover:bg-green-600 rounded-2xl h-14"
              >
                <Icon name="Phone" size={24} />
              </Button>
            </div>
          )}

          {(callStatus === 'connecting' || callStatus === 'ringing' || callStatus === 'active') &&
            !isIncoming && (
              <div className="flex gap-4">
                {callStatus === 'active' && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={toggleMute}
                    className={`h-14 w-14 rounded-2xl transition-all ${
                      isMuted
                        ? 'bg-destructive/20 text-destructive border-destructive/50'
                        : 'hover:bg-accent/20'
                    }`}
                  >
                    <Icon name={isMuted ? 'MicOff' : 'Mic'} size={24} />
                  </Button>
                )}

                <Button
                  onClick={handleEndCall}
                  className="h-14 px-8 bg-destructive hover:bg-destructive/90 rounded-2xl"
                >
                  <Icon name="PhoneOff" size={24} className="mr-2" />
                  Завершить
                </Button>
              </div>
            )}

          {callStatus === 'ended' && (
            <Button onClick={onClose} className="w-full rounded-2xl" variant="outline">
              Закрыть
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
};

export default VoiceCall;
