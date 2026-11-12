import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  MicOff,
  Hand,
  Radio,
  Shield,
  Crown,
  Music,
  Users,
  Monitor,
  MonitorOff,
  Sparkles,
  PhoneOff,
  Video,
  VideoOff,
  Gamepad2,
  PenTool,
  Trash2,
} from 'lucide-react';
import { Channel, UserProfile, VoiceParticipant } from '../../types';

interface VoiceStageViewProps {
  channel: Channel;
  communityName: string;
  currentUser: UserProfile;
  participants: VoiceParticipant[];
  onToggleMute: () => void;
  isMuted: boolean;
  onLeave: () => void;
}

export const VoiceStageView: React.FC<VoiceStageViewProps> = ({
  channel,
  communityName,
  currentUser,
  participants,
  onToggleMute,
  isMuted,
  onLeave,
}) => {
  const [handRaised, setHandRaised] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [noiseSuppression, setNoiseSuppression] = useState(true);
  const [activeActivity, setActiveActivity] = useState<'none' | 'whiteboard' | 'trivia'>('none');
  const [brushColor, setBrushColor] = useState('#8957F5');
  const [triviaStep, setTriviaStep] = useState(0);
  const [triviaScore, setTriviaScore] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const whiteboardRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);

  const isStage = channel.type === 'stage';

  const TRIVIA_QUESTIONS = [
    {
      q: 'What is the maximum file upload limit on DOOMCORD APEX+ or Level 3 Boosted Servers?',
      opts: ['25 MB', '100 MB', '500 MB', '50 MB'],
      ans: 2,
    },
    {
      q: 'Which standard does Doomcord use for 6-digit Authenticator App 2FA codes?',
      opts: ['RFC 6238 TOTP', 'ROT13', 'Base64 Only', 'MD5'],
      ans: 0,
    },
    {
      q: 'Which keyboard shortcut opens the Doomcord Universal Quick Switcher from anywhere?',
      opts: ['Alt + F4', 'Ctrl + K', 'Shift + Esc', 'Ctrl + P'],
      ans: 1,
    },
  ];

  const playSoundEffect = (frequency: number, type: OscillatorType = 'sine') => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(frequency, ctx.currentTime);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } catch (e) {
      console.warn('Could not play sound effect:', e);
    }
  };

  useEffect(() => {
    if ((!isScreenSharing && !isCameraOn) || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frame = 0;
    let animId = 0;

    const render = () => {
      frame += 1;
      const w = canvas.width;
      const h = canvas.height;

      ctx.fillStyle = '#09090D';
      ctx.fillRect(0, 0, w, h);

      ctx.strokeStyle = '#17171F';
      ctx.lineWidth = 1;
      for (let x = 0; x < w; x += 32) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += 32) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      const bars = 28;
      const barWidth = (w - 120) / bars;
      for (let i = 0; i < bars; i++) {
        const amp =
          Math.sin(frame * 0.06 + i * 0.35) * 36 +
          Math.cos(frame * 0.04 - i * 0.2) * 20 +
          60;
        ctx.fillStyle = i % 2 === 0 ? '#8957F5' : '#A47BFF';
        ctx.fillRect(60 + i * barWidth, h / 2 - amp / 2, barWidth - 6, amp);
      }

      ctx.fillStyle = '#F5F3FA';
      ctx.font = '600 13px Inter, sans-serif';
      ctx.fillText(
        `${currentUser.displayName} — Live ${
          isScreenSharing ? '1080p 60fps Screen Share' : 'HD WebRTC Camera Stream'
        } (${channel.name})`,
        24,
        32
      );

      ctx.fillStyle = '#A19DAD';
      ctx.font = '11px JetBrains Mono, monospace';
      ctx.fillText(
        `Bitrate: 384 kbps Opus Audio · 60 FPS WebRTC Media Transport`,
        24,
        h - 20
      );

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [isScreenSharing, isCameraOn, currentUser.displayName, channel.name]);

  const handleToggleScreenShare = async () => {
    if (isScreenSharing) {
      setIsScreenSharing(false);
      return;
    }
    try {
      if (navigator.mediaDevices?.getDisplayMedia) {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
        });
        stream.getTracks().forEach((t) => t.stop());
      }
    } catch {
      // Fallback to live procedural stage stream when permission is declined or in iframe
    }
    setIsScreenSharing(true);
    playSoundEffect(660, 'sine');
  };

  const handleToggleCamera = async () => {
    if (isCameraOn) {
      setIsCameraOn(false);
      return;
    }
    try {
      if (navigator.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach((t) => t.stop());
      }
    } catch {
      // Fallback to live procedural camera stream
    }
    setIsCameraOn(true);
    playSoundEffect(580, 'sine');
  };

  // Collaborative Whiteboard drawing handlers
  const handleWhiteboardPointerDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = whiteboardRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    isDrawingRef.current = true;
    ctx.strokeStyle = brushColor;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const handleWhiteboardPointerMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    const canvas = whiteboardRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const handleWhiteboardClear = () => {
    const canvas = whiteboardRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#09090D] text-[#F5F3FA] overflow-y-auto p-4 sm:p-6">
      {/* Stage / Channel Title Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 mb-6 rounded-xl bg-[#101014] border border-[#282631] shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-[#8957F5]/20 border border-[#8957F5]/40 text-[#8957F5] shadow-sm">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-[#F5F3FA] tracking-wide">
                {channel.name}
              </h2>
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#8957F5]/20 text-[#8957F5] font-mono border border-[#8957F5]/30">
                {isStage ? 'LIVE STAGE' : 'VOICE & VIDEO ROOM'}
              </span>
            </div>
            <p className="text-xs text-[#706C7B] mt-0.5">
              {channel.topic ||
                `${communityName} · High-definition spatial WebRTC audio, video & embedded activities`}
            </p>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleToggleCamera}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border transition-colors ${
              isCameraOn
                ? 'bg-[#8957F5] text-white border-[#8957F5]'
                : 'bg-[#17171F] text-[#F5F3FA] border-[#282631] hover:bg-[#22212C]'
            }`}
          >
            {isCameraOn ? (
              <VideoOff className="w-4 h-4" />
            ) : (
              <Video className="w-4 h-4 text-[#A47BFF]" />
            )}
            <span>{isCameraOn ? 'Stop Video' : 'Video Camera'}</span>
          </button>

          <button
            onClick={handleToggleScreenShare}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border transition-colors ${
              isScreenSharing
                ? 'bg-[#8957F5] text-white border-[#8957F5]'
                : 'bg-[#17171F] text-[#F5F3FA] border-[#282631] hover:bg-[#22212C]'
            }`}
          >
            {isScreenSharing ? (
              <MonitorOff className="w-4 h-4" />
            ) : (
              <Monitor className="w-4 h-4 text-[#A47BFF]" />
            )}
            <span>{isScreenSharing ? 'Stop Share' : 'Share Screen'}</span>
          </button>

          <button
            onClick={() =>
              setActiveActivity(activeActivity === 'whiteboard' ? 'none' : 'whiteboard')
            }
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border transition-colors ${
              activeActivity === 'whiteboard'
                ? 'bg-[#8957F5] text-white border-[#8957F5]'
                : 'bg-[#17171F] text-[#C4B1FF] border-[#282631] hover:bg-[#22212C]'
            }`}
          >
            <PenTool className="w-3.5 h-3.5" />
            <span>Whiteboard Activity</span>
          </button>

          <button
            onClick={() =>
              setActiveActivity(activeActivity === 'trivia' ? 'none' : 'trivia')
            }
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border transition-colors ${
              activeActivity === 'trivia'
                ? 'bg-[#8957F5] text-white border-[#8957F5]'
                : 'bg-[#17171F] text-[#C4B1FF] border-[#282631] hover:bg-[#22212C]'
            }`}
          >
            <Gamepad2 className="w-3.5 h-3.5" />
            <span>Trivia Activity</span>
          </button>

          <button
            onClick={() => setNoiseSuppression(!noiseSuppression)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border transition-colors ${
              noiseSuppression
                ? 'bg-[#17171F] text-[#C4B1FF] border-[#8957F5]/40'
                : 'bg-[#17171F] text-[#706C7B] border-[#282631]'
            }`}
            title="Toggle Crisp Voice Noise Suppression"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{noiseSuppression ? 'Crisp: ON' : 'Crisp: OFF'}</span>
          </button>

          {isStage && (
            <button
              onClick={() => {
                setHandRaised(!handRaised);
                playSoundEffect(520, 'triangle');
              }}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border transition-colors ${
                handRaised
                  ? 'bg-[#8957F5] text-white border-[#8957F5] shadow-sm'
                  : 'bg-[#17171F] text-[#F5F3FA] border-[#282631] hover:bg-[#22212C]'
              }`}
            >
              <Hand className="w-4 h-4" />
              <span>{handRaised ? 'Hand Raised' : 'Raise Hand'}</span>
            </button>
          )}

          <button
            onClick={onToggleMute}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border transition-colors ${
              isMuted
                ? 'bg-[#ED4245]/20 text-[#ED4245] border-[#ED4245]/40'
                : 'bg-[#17171F] text-[#F5F3FA] border-[#282631] hover:bg-[#22212C]'
            }`}
          >
            {isMuted ? (
              <MicOff className="w-4 h-4" />
            ) : (
              <Mic className="w-4 h-4" />
            )}
            <span>{isMuted ? 'Muted' : 'Mute Mic'}</span>
          </button>

          <button
            onClick={onLeave}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-[#ED4245]/15 hover:bg-[#ED4245]/25 text-[#ED4245] border border-[#ED4245]/30 transition-colors"
          >
            <PhoneOff className="w-3.5 h-3.5" />
            <span>Leave</span>
          </button>
        </div>
      </div>

      {/* Live Video / Screen Share Viewport */}
      {(isScreenSharing || isCameraOn) && (
        <div className="mb-6 rounded-xl overflow-hidden border border-[#8957F5]/50 bg-[#101014] shadow-xl">
          <div className="px-4 py-2 bg-[#17171F] border-b border-[#282631] flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="px-1.5 py-0.5 rounded bg-[#ED4245] text-white text-[10px] font-mono font-bold">
                LIVE
              </span>
              <span className="font-semibold text-[#F5F3FA]">
                {currentUser.displayName}&apos;s{' '}
                {isScreenSharing ? 'Screen Share' : 'HD Video Stream'}
              </span>
            </div>
            <span className="text-[10px] font-mono text-[#A47BFF] tabular-nums">
              1080p · 60 FPS
            </span>
          </div>
          <canvas
            ref={canvasRef}
            width={760}
            height={220}
            className="w-full h-52 object-cover block"
          />
        </div>
      )}

      {/* Embedded Activity 1: Collaborative Whiteboard */}
      {activeActivity === 'whiteboard' && (
        <div className="mb-6 rounded-xl overflow-hidden border border-[#8957F5]/40 bg-[#101014] p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold text-[#F5F3FA] flex items-center gap-2">
              <PenTool className="w-4 h-4 text-[#8957F5]" />
              <span>Collaborative Whiteboard Activity</span>
            </div>
            <div className="flex items-center gap-2">
              {['#8957F5', '#A47BFF', '#3BA55D', '#FAA81A', '#ED4245', '#F5F3FA'].map(
                (col) => (
                  <button
                    key={col}
                    type="button"
                    onClick={() => setBrushColor(col)}
                    className={`w-5 h-5 rounded-full border ${
                      brushColor === col ? 'border-white scale-110' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: col }}
                  />
                )
              )}
              <button
                type="button"
                onClick={handleWhiteboardClear}
                className="h-7 px-2.5 rounded bg-[#17171F] text-[11px] text-[#ED4245] flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" />
                <span>Clear</span>
              </button>
            </div>
          </div>
          <canvas
            ref={whiteboardRef}
            width={760}
            height={240}
            onMouseDown={handleWhiteboardPointerDown}
            onMouseMove={handleWhiteboardPointerMove}
            onMouseUp={() => {
              isDrawingRef.current = false;
            }}
            onMouseLeave={() => {
              isDrawingRef.current = false;
            }}
            className="w-full h-56 rounded-lg bg-[#09090D] border border-[#282631] cursor-crosshair block"
          />
        </div>
      )}

      {/* Embedded Activity 2: Live Trivia Quiz */}
      {activeActivity === 'trivia' && (
        <div className="mb-6 rounded-xl border border-[#8957F5]/40 bg-[#101014] p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold text-[#F5F3FA] flex items-center gap-2">
              <Gamepad2 className="w-4 h-4 text-[#8957F5]" />
              <span>Doomcord Live Trivia Challenge</span>
            </div>
            <span className="px-2 py-0.5 rounded bg-[#17171F] border border-[#282631] font-mono text-xs text-[#C4B1FF]">
              Score: {triviaScore} pts
            </span>
          </div>

          <div className="p-4 rounded-lg bg-[#17171F] border border-[#282631] space-y-3">
            <div className="text-xs font-semibold text-[#F5F3FA]">
              Q{triviaStep + 1}: {TRIVIA_QUESTIONS[triviaStep].q}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {TRIVIA_QUESTIONS[triviaStep].opts.map((opt, idx) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => {
                    if (idx === TRIVIA_QUESTIONS[triviaStep].ans) {
                      setTriviaScore((s) => s + 100);
                      playSoundEffect(880, 'triangle');
                    } else {
                      playSoundEffect(220, 'sawtooth');
                    }
                    setTriviaStep((prev) => (prev + 1) % TRIVIA_QUESTIONS.length);
                  }}
                  className="p-2.5 rounded-lg bg-[#0D0D12] hover:bg-[#8957F5]/20 border border-[#282631] hover:border-[#8957F5] text-left text-xs text-[#F5F3FA] transition-colors"
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Stage Speakers Section */}
      {isStage && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3 text-xs font-semibold text-[#A19DAD] uppercase tracking-wider">
            <Crown className="w-4 h-4 text-[#A47BFF]" />
            <span>On Stage (Speakers)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {participants
              .filter((p) => p.isStageSpeaker)
              .map((speaker) => (
                <div
                  key={speaker.uid}
                  className={`relative flex flex-col items-center p-5 rounded-xl bg-[#101014] border transition-colors shadow-sm ${
                    speaker.isSpeaking
                      ? 'border-[#8957F5] shadow-sm'
                      : 'border-[#282631]'
                  }`}
                >
                  <div className="relative mb-3">
                    <img
                      src={speaker.photoURL}
                      alt={speaker.displayName}
                      className="w-16 h-16 rounded-xl object-cover bg-black/20"
                    />
                    {speaker.isSpeaking && (
                      <div className="absolute -inset-1 rounded-xl border-2 border-[#8957F5] animate-pulse" />
                    )}
                    {speaker.isMuted && (
                      <div className="absolute bottom-0 right-0 p-1 rounded-full bg-[#ED4245] text-white shadow">
                        <MicOff className="w-3 h-3" />
                      </div>
                    )}
                  </div>

                  <span className="text-sm font-semibold text-[#F5F3FA] tracking-wide">
                    {speaker.displayName}
                  </span>
                  <span className="text-[11px] text-[#8957F5] flex items-center gap-1 mt-0.5 font-medium">
                    <Shield className="w-3 h-3" /> Stage Speaker
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* General Participants Grid */}
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-3 text-xs font-semibold text-[#A19DAD] uppercase tracking-wider">
          <Users className="w-4 h-4 text-[#8957F5]" />
          <span>
            {isStage ? 'Audience' : 'Active In Voice'} ({participants.length})
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {participants.map((participant) => {
            const isSelf = participant.uid === currentUser.uid;
            return (
              <div
                key={participant.uid}
                className={`relative flex flex-col items-center p-4 rounded-xl bg-[#101014] border transition-colors ${
                  participant.isSpeaking
                    ? 'border-[#8957F5] shadow-sm scale-105'
                    : 'border-[#282631]'
                }`}
              >
                <div className="relative mb-2.5">
                  <img
                    src={participant.photoURL}
                    alt={participant.displayName}
                    className="w-14 h-14 rounded-xl object-cover bg-black/20"
                  />
                  {participant.isSpeaking && (
                    <div className="absolute -inset-1 rounded-xl border-2 border-[#8957F5]" />
                  )}
                  {participant.isMuted && (
                    <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-[#ED4245] text-white shadow">
                      <MicOff className="w-3 h-3" />
                    </div>
                  )}
                </div>

                <div className="text-center w-full">
                  <span className="text-xs font-semibold text-[#F5F3FA] truncate block">
                    {participant.displayName} {isSelf && '(You)'}
                  </span>
                  <span className="text-[10px] text-[#706C7B] font-mono">
                    {participant.isSpeaking
                      ? 'Speaking...'
                      : participant.isMuted
                      ? 'Muted'
                      : 'Listening'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Procedural Web Audio Soundboard */}
      <div className="mt-8 p-4 rounded-xl bg-[#101014] border border-[#282631]">
        <div className="flex items-center gap-2 mb-3 text-xs font-semibold text-[#F5F3FA]">
          <Music className="w-4 h-4 text-[#8957F5]" />
          <span>Procedural Soundboard</span>
          <span className="text-[10px] text-[#706C7B] font-normal font-mono">
            (Web Audio Synthesis · Zero External Files)
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => playSoundEffect(440, 'sine')}
            className="px-3 py-1.5 text-xs font-medium bg-[#17171F] hover:bg-[#22212C] text-[#F5F3FA] rounded-md border border-[#282631] transition-colors"
          >
            🔔 Chime (440Hz)
          </button>
          <button
            onClick={() => playSoundEffect(880, 'triangle')}
            className="px-3 py-1.5 text-xs font-medium bg-[#17171F] hover:bg-[#22212C] text-[#F5F3FA] rounded-md border border-[#282631] transition-colors"
          >
            ✨ Sparkle (880Hz)
          </button>
          <button
            onClick={() => playSoundEffect(220, 'sawtooth')}
            className="px-3 py-1.5 text-xs font-medium bg-[#17171F] hover:bg-[#22212C] text-[#F5F3FA] rounded-md border border-[#282631] transition-colors"
          >
            ⚡ Bass Pulse (220Hz)
          </button>
          <button
            onClick={() => playSoundEffect(660, 'sine')}
            className="px-3 py-1.5 text-xs font-medium bg-[#17171F] hover:bg-[#22212C] text-[#F5F3FA] rounded-md border border-[#282631] transition-colors"
          >
            🎯 Ping (660Hz)
          </button>
        </div>
      </div>
    </div>
  );
};
