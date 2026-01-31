
import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Settings, RotateCcw, FastForward, SkipBack } from 'lucide-react';

interface PandaPlayerProps {
  videoUrl: string;
  videoType: 'youtube' | 'drive' | 'upload';
  title?: string;
}

const PandaPlayer: React.FC<PandaPlayerProps> = ({ videoUrl, videoType, title }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const controlsTimeoutRef = useRef<number | null>(null);

  // Auto-hide controls
  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) window.clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = window.setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3000);
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) videoRef.current.pause();
      else videoRef.current.play();
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const p = (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setProgress(p);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (videoRef.current) {
      const time = (parseFloat(e.target.value) / 100) * videoRef.current.duration;
      videoRef.current.currentTime = time;
      setProgress(parseFloat(e.target.value));
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    setVolume(v);
    if (videoRef.current) {
      videoRef.current.volume = v;
      videoRef.current.muted = v === 0;
      setIsMuted(v === 0);
    }
  };

  const toggleFullScreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen();
      setIsFullScreen(true);
    } else {
      document.exitFullscreen();
      setIsFullScreen(false);
    }
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;
      
      switch(e.key.toLowerCase()) {
        case ' ':
          e.preventDefault();
          togglePlay();
          break;
        case 'f':
          toggleFullScreen();
          break;
        case 'm':
          toggleMute();
          break;
        case 'arrowright':
          if (videoRef.current) videoRef.current.currentTime += 5;
          break;
        case 'arrowleft':
          if (videoRef.current) videoRef.current.currentTime -= 5;
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, isMuted]);

  if (videoType === 'youtube') {
    return (
      <div className="w-full aspect-video rounded-[2rem] overflow-hidden bg-black shadow-2xl border border-white/5">
        <iframe
          className="w-full h-full"
          src={`https://www.youtube.com/embed/${videoUrl}?modestbranding=1&rel=0&iv_load_policy=3&color=white`}
          title={title || "Video Player"}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        ></iframe>
      </div>
    );
  }

  if (videoType === 'drive') {
    return (
      <div className="w-full aspect-video rounded-[2rem] overflow-hidden bg-black shadow-2xl border border-white/5">
        <iframe
          className="w-full h-full"
          src={videoUrl}
          title={title || "Video Player"}
          allow="autoplay"
          allowFullScreen
        ></iframe>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="relative w-full aspect-video rounded-[2rem] overflow-hidden bg-black group select-none shadow-2xl border border-white/5"
    >
      <video
        ref={videoRef}
        src={videoUrl}
        className="w-full h-full cursor-pointer"
        onClick={togglePlay}
        onTimeUpdate={handleTimeUpdate}
        onEnded={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        playsInline
      />

      {/* Center Play Button Overlay */}
      {!isPlaying && (
        <div 
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[2px] cursor-pointer group-hover:bg-black/40 transition-all"
        >
          <div className="w-20 h-20 bg-[#ff6b6b] rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(255,107,107,0.5)] transform scale-100 hover:scale-110 transition-transform">
            <Play fill="white" className="text-white ml-1" size={32} />
          </div>
        </div>
      )}

      {/* Controls Overlay */}
      <div className={`absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black/90 via-black/40 to-transparent transition-opacity duration-500 ${showControls || !isPlaying ? 'opacity-100' : 'opacity-0'}`}>
        {/* Progress Bar */}
        <div className="relative w-full h-1.5 mb-6 group/progress">
          <input
            type="range"
            min="0"
            max="100"
            value={progress}
            onChange={handleSeek}
            className="absolute inset-0 w-full h-full appearance-none bg-white/20 rounded-full cursor-pointer accent-[#ff6b6b] group-hover/progress:h-2 transition-all"
          />
          <div 
            className="absolute top-0 left-0 h-full bg-[#ff6b6b] rounded-full pointer-events-none shadow-[0_0_10px_rgba(255,107,107,0.8)]"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={togglePlay} className="text-white hover:text-[#ff6b6b] transition-colors">
              {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
            </button>

            <div className="flex items-center gap-2 group/volume">
              <button onClick={toggleMute} className="text-white hover:text-[#ff6b6b] transition-colors">
                {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={handleVolumeChange}
                className="w-0 group-hover/volume:w-20 transition-all duration-300 appearance-none bg-white/20 h-1 rounded-full accent-white"
              />
            </div>

            <div className="text-xs font-bold text-white/80 tabular-nums">
              {videoRef.current ? (
                <>
                  {formatTime(videoRef.current.currentTime)} / {formatTime(videoRef.current.duration)}
                </>
              ) : '00:00 / 00:00'}
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="relative group/speed">
              <button className="text-[10px] font-black text-white bg-white/10 px-3 py-1 rounded-full hover:bg-[#ff6b6b] transition-all">
                {playbackSpeed}x
              </button>
              <div className="absolute bottom-full right-0 mb-4 bg-black/90 backdrop-blur-xl border border-white/10 rounded-2xl p-2 opacity-0 group-hover/speed:opacity-100 pointer-events-none group-hover/speed:pointer-events-auto transition-all shadow-2xl flex flex-col gap-1 min-w-[80px]">
                {[0.5, 0.75, 1, 1.25, 1.5, 2].map(s => (
                  <button 
                    key={s}
                    onClick={() => {
                      setPlaybackSpeed(s);
                      if (videoRef.current) videoRef.current.playbackRate = s;
                    }}
                    className={`text-[10px] font-bold px-4 py-2 rounded-lg text-left transition-colors ${playbackSpeed === s ? 'bg-[#ff6b6b] text-white' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            </div>

            <button onClick={toggleFullScreen} className="text-white hover:text-[#ff6b6b] transition-colors">
              <Maximize size={22} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const formatTime = (seconds: number) => {
  if (isNaN(seconds)) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export default PandaPlayer;
