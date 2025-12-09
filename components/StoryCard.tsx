import React, { useEffect, useState, useRef } from 'react';
import { GeneratedStory } from '../types';
import { Play, Pause, Volume2, BookOpen, Star } from 'lucide-react';
import { Button } from './Button';

interface StoryCardProps {
  story: GeneratedStory;
  imageUrl: string | null;
  audioBuffer: AudioBuffer | null;
}

export const StoryCard: React.FC<StoryCardProps> = ({ story, imageUrl, audioBuffer }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const startTimeRef = useRef<number>(0);
  const pauseTimeRef = useRef<number>(0);

  // Initialize Audio Context lazily
  const getAudioContext = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  };

  const stopAudio = () => {
    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.stop();
        sourceNodeRef.current.disconnect();
      } catch (e) {
        // Ignore errors if already stopped
      }
      sourceNodeRef.current = null;
    }
    setIsPlaying(false);
  };

  const playAudio = async () => {
    if (!audioBuffer) return;

    const ctx = getAudioContext();
    
    // Resume context if suspended (browser policy)
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }

    // Stop any current playback
    stopAudio();

    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(ctx.destination);
    
    // Handle playback ending
    source.onended = () => {
        setIsPlaying(false);
        pauseTimeRef.current = 0; // Reset
    };

    // Start playing
    source.start(0); 
    startTimeRef.current = ctx.currentTime;
    sourceNodeRef.current = source;
    setIsPlaying(true);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => stopAudio();
  }, []);

  return (
    <div className="bg-slate-900/80 backdrop-blur-md rounded-3xl shadow-2xl overflow-hidden border border-white/10 ring-1 ring-black/20">
      {/* Image Section */}
      <div className="relative w-full h-64 md:h-[500px] bg-slate-800 overflow-hidden group">
        {imageUrl ? (
          <>
            <img 
              src={imageUrl} 
              alt={story.title} 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            {/* Gradient Overlay for Text Readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent flex items-end p-8 md:p-12">
              <h2 className="text-4xl md:text-5xl font-black text-white drop-shadow-lg tracking-tight leading-tight">{story.title}</h2>
            </div>
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-slate-800 text-slate-600">
             <BookOpen size={64} className="mb-4 opacity-50" />
             <span className="text-sm uppercase tracking-widest font-semibold">Ilustrasi Tidak Tersedia</span>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-8 md:p-12 space-y-8">
        {/* Controls */}
        <div className="flex flex-wrap items-center gap-4 pb-8 border-b border-white/5">
          {audioBuffer ? (
            <Button 
              onClick={isPlaying ? stopAudio : playAudio} 
              variant="secondary"
              className="!rounded-full px-8 py-4 !bg-indigo-600 !text-white !border-none hover:!bg-indigo-500 shadow-lg shadow-indigo-900/30"
            >
              {isPlaying ? <Pause size={20} className="fill-current" /> : <Play size={20} className="fill-current" />}
              {isPlaying ? 'Jeda Narasi' : 'Dengarkan Cerita'}
            </Button>
          ) : (
             <div className="flex items-center text-slate-500 text-sm italic px-4 py-2 rounded-full bg-slate-800/50 border border-slate-700/50">
              <Volume2 size={16} className="mr-2" />
              Audio sedang diproses atau tidak tersedia
            </div>
          )}
        </div>

        {/* Text */}
        <div className="prose prose-lg prose-invert prose-p:text-slate-300 prose-headings:text-white max-w-none leading-loose">
          {story.content}
        </div>

        {/* Moral */}
        <div className="mt-12 p-8 bg-gradient-to-br from-amber-950/40 to-slate-900/40 rounded-3xl border border-amber-500/20 flex flex-col md:flex-row items-start gap-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-32 bg-amber-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
          
          <div className="bg-amber-500/20 p-4 rounded-2xl text-amber-400 shrink-0 border border-amber-500/20 shadow-inner">
            <Star size={28} className="fill-current" />
          </div>
          <div className="relative z-10">
            <h3 className="text-lg font-bold text-amber-200 mb-2 uppercase tracking-wider">Pesan Moral</h3>
            <p className="text-amber-100/90 text-lg leading-relaxed">{story.moral}</p>
          </div>
        </div>
      </div>
    </div>
  );
};