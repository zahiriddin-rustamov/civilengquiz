'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  RotateCcw, 
  FastForward,
  CheckCircle,
  Clock,
  Award
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import ReactPlayer from 'react-player';

interface VideoPlayerProps {
  video: {
    id: string;
    title: string;
    description: string;
    url: string;
    duration: number; // in seconds
    thumbnail?: string;
    difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
    points: number;
    topics: string[];
  };
  onProgress: (videoId: string, progress: number, completed: boolean, points: number) => void;
  initialProgress?: number;
  isCompleted?: boolean;
}

export function VideoPlayer({ 
  video, 
  onProgress, 
  initialProgress = 0,
  isCompleted = false 
}: VideoPlayerProps) {
  const [playing, setPlaying] = useState(false);
  const [played, setPlayed] = useState(initialProgress);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [muted, setMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [hasStarted, setHasStarted] = useState(initialProgress > 0);
  const [watchTime, setWatchTime] = useState(0);
  
  const playerRef = useRef<ReactPlayer>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (playing) {
      interval = setInterval(() => {
        setWatchTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [playing]);

  const handlePlay = () => {
    setPlaying(true);
    if (!hasStarted) {
      setHasStarted(true);
    }
    hideControlsAfterDelay();
  };

  const handlePause = () => {
    setPlaying(false);
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
  };

  const handleProgress = (state: { played: number; playedSeconds: number }) => {
    setPlayed(state.played);
    
    // Mark as completed if watched 90% or more
    const completed = state.played >= 0.9;
    if (completed && !isCompleted) {
      onProgress(video.id, state.played, true, video.points);
    } else if (hasStarted) {
      onProgress(video.id, state.played, false, 0);
    }
  };

  const handleSeek = (value: number[]) => {
    const seekTo = value[0] / 100;
    setPlayed(seekTo);
    playerRef.current?.seekTo(seekTo);
  };

  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0] / 100);
    setMuted(value[0] === 0);
  };

  const toggleMute = () => {
    setMuted(!muted);
  };

  const changePlaybackRate = () => {
    const rates = [0.5, 0.75, 1, 1.25, 1.5, 2];
    const currentIndex = rates.indexOf(playbackRate);
    const nextIndex = (currentIndex + 1) % rates.length;
    setPlaybackRate(rates[nextIndex]);
  };

  const skipForward = () => {
    const currentTime = played * duration;
    const newTime = Math.min(currentTime + 10, duration);
    const seekTo = newTime / duration;
    setPlayed(seekTo);
    playerRef.current?.seekTo(seekTo);
  };

  const restart = () => {
    setPlayed(0);
    playerRef.current?.seekTo(0);
    setPlaying(true);
  };

  const hideControlsAfterDelay = () => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (playing) {
        setShowControls(false);
      }
    }, 3000);
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (playing) {
      hideControlsAfterDelay();
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'from-green-500 to-emerald-600';
      case 'Intermediate': return 'from-yellow-500 to-orange-600';
      case 'Advanced': return 'from-red-500 to-pink-600';
      default: return 'from-gray-400 to-gray-500';
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercentage = Math.round(played * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden"
    >
      {/* Video Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className={`px-3 py-1 rounded-full text-sm font-medium text-white bg-gradient-to-r ${getDifficultyColor(video.difficulty)}`}>
            {video.difficulty}
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            {isCompleted && (
              <div className="flex items-center gap-1 text-green-600">
                <CheckCircle className="w-4 h-4" />
                <span className="font-medium">Completed</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <Award className="w-4 h-4" />
              <span className="font-medium">{video.points} XP</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{formatTime(video.duration)}</span>
            </div>
          </div>
        </div>

        <h3 className="text-xl font-bold text-gray-900 mb-2">{video.title}</h3>
        <p className="text-gray-600 mb-4">{video.description}</p>

        {/* Topics */}
        <div className="flex flex-wrap gap-2">
          {video.topics.map((topic, index) => (
            <span
              key={index}
              className="px-2 py-1 bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-700 text-xs rounded-full border border-blue-200"
            >
              {topic}
            </span>
          ))}
        </div>
      </div>

      {/* Video Player */}
      <div 
        className="relative bg-black aspect-video"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => playing && hideControlsAfterDelay()}
      >
        <ReactPlayer
          ref={playerRef}
          url={video.url}
          width="100%"
          height="100%"
          playing={playing}
          volume={muted ? 0 : volume}
          playbackRate={playbackRate}
          onPlay={handlePlay}
          onPause={handlePause}
          onProgress={handleProgress}
          onDuration={setDuration}
          controls={false}
          config={{
            youtube: {
              playerVars: {
                showinfo: 0,
                controls: 0,
                modestbranding: 1,
                rel: 0
              }
            }
          }}
        />

        {/* Custom Controls Overlay */}
        <motion.div
          initial={{ opacity: 1 }}
          animate={{ opacity: showControls ? 1 : 0 }}
          transition={{ duration: 0.3 }}
          className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none"
        >
          {/* Play/Pause Button (Center) */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-auto">
            <Button
              onClick={() => playing ? handlePause() : handlePlay()}
              className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 hover:bg-white/30 transition-all duration-200"
              size="icon"
            >
              {playing ? (
                <Pause className="w-8 h-8 text-white" />
              ) : (
                <Play className="w-8 h-8 text-white ml-1" />
              )}
            </Button>
          </div>

          {/* Bottom Controls */}
          <div className="absolute bottom-0 left-0 right-0 p-4 pointer-events-auto">
            {/* Progress Bar */}
            <div className="mb-4">
              <Slider
                value={[played * 100]}
                onValueChange={handleSeek}
                max={100}
                step={0.1}
                className="w-full"
              />
            </div>

            {/* Control Buttons */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => playing ? handlePause() : handlePlay()}
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20"
                >
                  {playing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                </Button>

                <Button
                  onClick={restart}
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20"
                >
                  <RotateCcw className="w-5 h-5" />
                </Button>

                <Button
                  onClick={skipForward}
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20"
                >
                  <FastForward className="w-5 h-5" />
                </Button>

                <div className="flex items-center gap-2 ml-2">
                  <Button
                    onClick={toggleMute}
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/20"
                  >
                    {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                  </Button>
                  
                  <div className="w-20">
                    <Slider
                      value={[muted ? 0 : volume * 100]}
                      onValueChange={handleVolumeChange}
                      max={100}
                      step={1}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-white text-sm">
                <Button
                  onClick={changePlaybackRate}
                  variant="ghost"
                  className="text-white hover:bg-white/20 text-sm px-2 py-1 h-auto"
                >
                  {playbackRate}x
                </Button>
                
                <span>
                  {formatTime(played * duration)} / {formatTime(duration)}
                </span>

                <Button
                  onClick={() => {
                    if (document.fullscreenElement) {
                      document.exitFullscreen();
                    } else {
                      document.documentElement.requestFullscreen();
                    }
                  }}
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20"
                >
                  <Maximize className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Progress Stats */}
      <div className="p-6 bg-gradient-to-r from-gray-50 to-gray-100">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="p-3 bg-white rounded-lg border border-gray-200">
            <div className="text-2xl font-bold text-indigo-600">{progressPercentage}%</div>
            <div className="text-sm text-gray-600">Progress</div>
          </div>
          <div className="p-3 bg-white rounded-lg border border-gray-200">
            <div className="text-2xl font-bold text-green-600">{formatTime(watchTime)}</div>
            <div className="text-sm text-gray-600">Watch Time</div>
          </div>
          <div className="p-3 bg-white rounded-lg border border-gray-200">
            <div className="text-2xl font-bold text-purple-600">
              {isCompleted ? video.points : Math.round(played * video.points)}
            </div>
            <div className="text-sm text-gray-600">XP Earned</div>
          </div>
        </div>
      </div>
    </motion.div>
  );
} 