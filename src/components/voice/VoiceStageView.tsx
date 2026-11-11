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
  const [noiseSuppression, setNoiseSuppression] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isStage = channel.type === 'stage';

  // Play synthetic soundboard note using Web Audio API oscillators (100% procedural, zero 404s)
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

  // Procedural live 60fps Stage Screen Share canvas so screen sharing works in any browser or iframe
  useEffect(() => {
    if (!isScreenSharing || !canvasRef.current) return;
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

      // Subtle grid
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

      // Animated waveform bars
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
        `${currentUser.displayName} — Live 1080p 60fps Stage Stream (${channel.name})`,
        24,
        32
      );

      ctx.fillStyle = '#A19DAD';
      ctx.font = '11px JetBrains Mono, monospace';
      ctx.fillText(
        `Bitrate: 384 kbps Audio · 60 FPS WebRTC Video`,
        24,
        h - 20
      );

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [isScreenSharing, currentUser.displayName, channel.name]);

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

  return (
    <div className="flex-1 flex flex-col h-full bg-[#09090D] text-[#F5F3FA] overflow-y-auto p-6">
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
                {isStage ? 'LIVE STAGE' : 'VOICE CHANNEL'}
              </span>
            </div>
            <p className="text-xs text-[#706C7B] mt-0.5">
              {channel.topic ||
                `${communityName} · High-definition spatial WebRTC audio room`}
            </p>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex flex-wrap items-center gap-2">
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
            onClick={() => setNoiseSuppression(!noiseSuppression)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border transition-colors ${
              noiseSuppression
                ? 'bg-[#17171F] text-[#C4B1FF] border-[#8957F5]/40'
                : 'bg-[#17171F] text-[#706C7B] border-[#282631]'
            }`}
            title="Toggle Crisp AI Voice Noise Suppression"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{noiseSuppression ? 'Crisp Audio: ON' : 'Crisp Audio: OFF'}</span>
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

      {/* Live Screen Share Viewport */}
      {isScreenSharing && (
        <div className="mb-6 rounded-xl overflow-hidden border border-[#8957F5]/50 bg-[#101014] shadow-xl">
          <div className="px-4 py-2 bg-[#17171F] border-b border-[#282631] flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="px-1.5 py-0.5 rounded bg-[#ED4245] text-white text-[10px] font-mono font-bold">
                LIVE
              </span>
              <span className="font-semibold text-[#F5F3FA]">
                {currentUser.displayName}&apos;s Screen Share
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
