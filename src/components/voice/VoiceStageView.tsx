import React, { useState, useEffect } from 'react';
import { 
  Mic, MicOff, Volume2, Hand, Radio, Shield, 
  Crown, Sparkles, MessageSquare, Music, UserCheck, Users 
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
  onLeave
}) => {
  const [handRaised, setHandRaised] = useState(false);
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
      console.warn("Could not play sound effect:", e);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-gradient-to-b from-[oklch(0.2_0.03_160)] via-[oklch(0.18_0.028_161)] to-[oklch(0.14_0.025_162)] overflow-y-auto p-6">
      {/* Stage / Channel Title Banner */}
      <div className="flex items-center justify-between p-4 mb-6 rounded-2xl bg-[oklch(0.17_0.028_161)] border border-white/5 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-tr from-[oklch(0.72_0.16_32)] to-[oklch(0.85_0.12_165)] shadow-md text-white">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white tracking-wide">{channel.name}</h2>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-[oklch(0.85_0.12_165)]/20 text-[oklch(0.85_0.12_165)] font-mono border border-[oklch(0.85_0.12_165)]/30">
                {isStage ? 'LIVE STAGE' : 'VOICE CHANNEL'}
              </span>
            </div>
            <p className="text-xs text-[oklch(0.7_0.03_155)] mt-0.5">
              {channel.topic || `${communityName} · High-definition spatial WebRTC audio room`}
            </p>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex items-center gap-2">
          {isStage && (
            <button
              onClick={() => {
                setHandRaised(!handRaised);
                playSoundEffect(520, 'triangle');
              }}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl border transition-all ${
                handRaised
                  ? 'bg-[oklch(0.72_0.16_32)] text-white border-[oklch(0.72_0.16_32)] shadow-lg'
                  : 'bg-[oklch(0.235_0.032_158)] text-[oklch(0.95_0.015_150)] border-white/5 hover:border-white/10'
              }`}
            >
              <Hand className="w-4 h-4" />
              <span>{handRaised ? 'Hand Raised' : 'Raise Hand'}</span>
            </button>
          )}

          <button
            onClick={onToggleMute}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl border transition-all ${
              isMuted
                ? 'bg-[oklch(0.72 0.15 355)]/20 text-[oklch(0.72 0.15 355)] border-[oklch(0.72 0.15 355)]/40'
                : 'bg-[oklch(0.235_0.032_158)] text-[oklch(0.95_0.015_150)] border-white/5 hover:border-white/10'
            }`}
          >
            {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            <span>{isMuted ? 'Muted' : 'Mute Mic'}</span>
          </button>
        </div>
      </div>

      {/* Stage Speakers Section */}
      {isStage && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4 text-xs font-bold text-[oklch(0.7_0.03_155)] uppercase tracking-wider">
            <Crown className="w-4 h-4 text-[oklch(0.84_0.14_85)]" />
            <span>On Stage (Speakers)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {participants.filter(p => p.isStageSpeaker).map((speaker) => (
              <div
                key={speaker.uid}
                className={`relative flex flex-col items-center p-5 rounded-2xl bg-[oklch(0.17_0.028_161)] border transition-all shadow-lg ${
                  speaker.isSpeaking
                    ? 'border-[oklch(0.85_0.12_165)] shadow-[oklch(0.85_0.12_165)]/20 shadow-md scale-[1.02]'
                    : 'border-white/5'
                }`}
              >
                <div className="relative mb-3">
                  <img
                    src={speaker.photoURL}
                    alt={speaker.displayName}
                    className="w-16 h-16 rounded-2xl object-cover bg-black/20"
                  />
                  {speaker.isSpeaking && (
                    <div className="absolute -inset-1 rounded-2xl border-2 border-[oklch(0.85_0.12_165)] animate-pulse" />
                  )}
                  {speaker.isMuted && (
                    <div className="absolute bottom-0 right-0 p-1 rounded-full bg-[oklch(0.72 0.15 355)] text-white shadow">
                      <MicOff className="w-3 h-3" />
                    </div>
                  )}
                </div>

                <span className="text-sm font-bold text-white tracking-wide">{speaker.displayName}</span>
                <span className="text-[11px] text-[oklch(0.85_0.12_165)] flex items-center gap-1 mt-0.5 font-medium">
                  <Shield className="w-3 h-3" /> Stage Speaker
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* General Participants Grid */}
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-4 text-xs font-bold text-[oklch(0.7_0.03_155)] uppercase tracking-wider">
          <Users className="w-4 h-4 text-[oklch(0.85_0.12_165)]" />
          <span>{isStage ? 'Audience' : 'Active In Voice'} ({participants.length})</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {participants.map((participant) => {
            const isSelf = participant.uid === currentUser.uid;
            return (
              <div
                key={participant.uid}
                className={`relative flex flex-col items-center p-4 rounded-2xl bg-[oklch(0.17_0.028_161)] border transition-all ${
                  participant.isSpeaking
                    ? 'border-[oklch(0.85_0.12_165)] shadow-[oklch(0.85_0.12_165)]/20 shadow-sm scale-105'
                    : 'border-white/5'
                }`}
              >
                <div className="relative mb-2.5">
                  <img
                    src={participant.photoURL}
                    alt={participant.displayName}
                    className="w-14 h-14 rounded-2xl object-cover bg-black/20"
                  />
                  {participant.isSpeaking && (
                    <div className="absolute -inset-1 rounded-2xl border-2 border-[oklch(0.85_0.12_165)]" />
                  )}
                  {participant.isMuted && (
                    <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-[oklch(0.72 0.15 355)] text-white shadow">
                      <MicOff className="w-3 h-3" />
                    </div>
                  )}
                </div>

                <div className="text-center w-full">
                  <span className="text-xs font-semibold text-white truncate block">
                    {participant.displayName} {isSelf && '(You)'}
                  </span>
                  <span className="text-[10px] text-[oklch(0.7_0.03_155)] font-mono">
                    {participant.isSpeaking ? 'Speaking...' : participant.isMuted ? 'Muted' : 'Listening'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Procedural Web Audio Soundboard (Interactive Feature) */}
      <div className="mt-8 p-4 rounded-2xl bg-[oklch(0.17_0.028_161)] border border-white/5">
        <div className="flex items-center gap-2 mb-3 text-xs font-bold text-white">
          <Music className="w-4 h-4 text-[oklch(0.72_0.16_32)]" />
          <span>Procedural Soundboard</span>
          <span className="text-[10px] text-[oklch(0.7_0.03_155)] font-normal font-mono">
            (Web Audio Synthesis · Zero External Files)
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => playSoundEffect(440, 'sine')}
            className="px-3 py-1.5 text-xs font-medium bg-[oklch(0.235_0.032_158)] hover:bg-[oklch(0.26_0.035_156)] text-white rounded-lg border border-white/5 transition-all"
          >
            🔔 Chime (440Hz)
          </button>
          <button
            onClick={() => playSoundEffect(880, 'triangle')}
            className="px-3 py-1.5 text-xs font-medium bg-[oklch(0.235_0.032_158)] hover:bg-[oklch(0.26_0.035_156)] text-white rounded-lg border border-white/5 transition-all"
          >
            ✨ Sparkle (880Hz)
          </button>
          <button
            onClick={() => playSoundEffect(220, 'sawtooth')}
            className="px-3 py-1.5 text-xs font-medium bg-[oklch(0.235_0.032_158)] hover:bg-[oklch(0.26_0.035_156)] text-white rounded-lg border border-white/5 transition-all"
          >
            ⚡ Bass Pulse (220Hz)
          </button>
          <button
            onClick={() => playSoundEffect(660, 'sine')}
            className="px-3 py-1.5 text-xs font-medium bg-[oklch(0.235_0.032_158)] hover:bg-[oklch(0.26_0.035_156)] text-white rounded-lg border border-white/5 transition-all"
          >
            🎯 Ping (660Hz)
          </button>
        </div>
      </div>
    </div>
  );
};
