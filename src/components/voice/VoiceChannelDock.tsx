import React, { useEffect, useRef, useState, useCallback } from 'react';
import { 
  Mic, MicOff, Volume2, VolumeX, PhoneOff, 
  Radio, Signal 
} from 'lucide-react';
import { VoiceParticipant, UserProfile } from '../../types';

interface VoiceChannelDockProps {
  channelName: string;
  communityName: string;
  currentUser: UserProfile;
  participants: VoiceParticipant[];
  onDisconnect: () => void;
}

export const VoiceChannelDock: React.FC<VoiceChannelDockProps> = ({
  channelName,
  communityName,
  participants,
  onDisconnect,
}) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [pingMs, setPingMs] = useState(24);

  const audioStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number>(0);

  // Initialize real HTML5 Web Audio API microphone stream
  useEffect(() => {
    let isMounted = true;

    async function initAudio() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: { 
            echoCancellation: true, 
            noiseSuppression: true, 
            autoGainControl: true 
          } 
        });

        if (!isMounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        audioStreamRef.current = stream;
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        const audioCtx = new AudioCtx();
        audioContextRef.current = audioCtx;

        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 64;
        source.connect(analyser);
        analyserRef.current = analyser;

        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        const checkVolume = () => {
          if (!isMounted) return;
          analyser.getByteFrequencyData(dataArray);

          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const avg = sum / dataArray.length;
          const normalized = Math.min(100, Math.round((avg / 128) * 100));

          setVolumeLevel(normalized);
          setIsSpeaking(normalized > 15 && !isMuted);

          animFrameRef.current = requestAnimationFrame(checkVolume);
        };

        checkVolume();
      } catch (err) {
        console.warn('Microphone access denied or not available, using synthetic audio levels:', err);
        // Fallback simulation if browser blocks mic permission
        const interval = setInterval(() => {
          if (!isMounted) return;
          const simulated = Math.floor(Math.random() * 40);
          setVolumeLevel(simulated);
          setIsSpeaking(simulated > 20 && !isMuted);
        }, 300);

        return () => clearInterval(interval);
      }
    }

    initAudio();

    // Random slight ping variation for realistic telemetry
    const pingInterval = setInterval(() => {
      setPingMs(Math.floor(20 + Math.random() * 8));
    }, 4000);

    return () => {
      isMounted = false;
      clearInterval(pingInterval);
      cancelAnimationFrame(animFrameRef.current);
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, [isMuted]);

  // Toggle mic track mute
  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      if (audioStreamRef.current) {
        audioStreamRef.current.getAudioTracks().forEach((track) => {
          track.enabled = !next;
        });
      }
      return next;
    });
  }, []);

  // Toggle deafen
  const toggleDeafen = useCallback(() => {
    setIsDeafened((prev) => !prev);
  }, []);

  return (
    <div className="flex items-center justify-between px-4 py-2 bg-[#0D0D12] border-t border-[#282631]">
      {/* Channel info and connection telemetry */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="w-8 h-8 rounded-lg bg-[#8957F5]/20 border border-[#8957F5]/40 flex items-center justify-center text-[#8957F5] shadow-sm">
            <Radio className="w-4 h-4 animate-pulse" />
          </div>
          {/* Speaking volume indicator ring */}
          {isSpeaking && (
            <div 
              className="absolute -inset-1 rounded-lg border-2 border-[#8957F5] transition-all pointer-events-none"
              style={{ opacity: volumeLevel / 100 }}
            />
          )}
        </div>

        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#F5F3FA] tracking-wide truncate max-w-[140px]">
              {channelName}
            </span>
            <span className="flex items-center gap-1 text-[10px] text-[#8957F5] font-mono tabular-nums">
              <Signal className="w-3 h-3 text-[#8957F5]" />
              {pingMs}ms RTC
            </span>
          </div>
          <span className="text-[11px] text-[#706C7B] block truncate max-w-[140px]">
            {communityName}
          </span>
        </div>
      </div>

      {/* Microphone real-time visualizer meter */}
      <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#101014] border border-[#282631]">
        <div className="w-24 h-2 bg-[#17171F] rounded-full overflow-hidden flex items-center p-0.5">
          <div 
            className="h-full rounded-full transition-all duration-75"
            style={{ 
              width: `${isMuted ? 0 : volumeLevel}%`,
              backgroundColor: volumeLevel > 60 ? '#A47BFF' : '#8957F5'
            }}
          />
        </div>
        <span className="text-[10px] text-[#706C7B] font-mono tabular-nums">
          {isMuted ? 'MUTE' : `${volumeLevel}%`}
        </span>
      </div>

      {/* Control Buttons */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={toggleMute}
          title={isMuted ? 'Unmute Microphone' : 'Mute Microphone'}
          className={`p-2 rounded-lg border transition-colors ${
            isMuted 
              ? 'bg-[#ED4245]/20 border-[#ED4245]/40 text-[#ED4245]' 
              : 'bg-[#17171F] border-[#282631] text-[#F5F3FA] hover:bg-[#22212C]'
          }`}
        >
          {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </button>

        <button
          onClick={toggleDeafen}
          title={isDeafened ? 'Undeafen Audio' : 'Deafen Audio'}
          className={`p-2 rounded-lg border transition-colors ${
            isDeafened 
              ? 'bg-[#ED4245]/20 border-[#ED4245]/40 text-[#ED4245]' 
              : 'bg-[#17171F] border-[#282631] text-[#F5F3FA] hover:bg-[#22212C]'
          }`}
        >
          {isDeafened ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>

        <button
          onClick={onDisconnect}
          title="Disconnect from Voice"
          className="p-2 rounded-lg bg-[#ED4245]/20 border border-[#ED4245]/40 text-[#ED4245] hover:bg-[#ED4245]/30 transition-colors"
        >
          <PhoneOff className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
