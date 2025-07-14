"use client";
import React, { useRef, useState, useEffect } from "react";
import { Slider } from "@/components/ui/slider";
import "./audioSliderField.css"; // Import your CSS file for styles

interface AudioSliderFieldProps {
  audioSrc: string;
  value: Array<[number, number]>; // [audioTime, sliderValue]
  onChange: (data: Array<[number, number]>) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  required?: boolean;
  onValidChange?: (valid: boolean) => void;
}

export const AudioSliderField: React.FC<AudioSliderFieldProps> = ({
  audioSrc,
  value = [], // fallback to empty array if undefined
  onChange,
  min = 0,
  max = 1000,
  step = 1,
  label,
  required = false,
  onValidChange,
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [slider, setSlider] = useState(min);
  const [isPlaying, setIsPlaying] = useState(false);
  const [lastTime, setLastTime] = useState<number | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [vertical, setVertical] = useState(true); //
  const [ended, setEnded] = useState(false);
  const [listenedFromStart, setListenedFromStart] = useState(false);
  const [duration, setDuration] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);

  // Responsive: vertical always (customize if you want to switch back)
  // useEffect(() => {
  //   const check = () => setVertical(window.innerWidth < 640);
  //   check();
  //   window.addEventListener("resize", check);
  //   return () => window.removeEventListener("resize", check);
  // }, []);

  // Play/pause logic
  const handlePlay = () => {
    if (audioRef.current) {
      audioRef.current.play();
    }
  };
  const handlePause = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
  };

  // Listen for play/pause/end events and update current time/duration
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onPlay = () => {
      setIsPlaying(true);
      setEnded(false);
    };
    const onPause = () => setIsPlaying(false);
    const onEnded = () => {
      setIsPlaying(false);
      setEnded(true);
    };
    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => setDuration(audio.duration);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    return () => {
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
    };
  }, []);
  // Format seconds to mm:ss
  const formatTime = (s: number) => {
    if (!isFinite(s) || s < 0) return "00:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m.toString().padStart(2, "0")}:${sec
      .toString()
      .padStart(2, "0")}`;
  };

  // Record slider value with timestamp when changed during playback
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = Number(e.target.value);
    setSlider(newValue);
    if (isPlaying && audioRef.current) {
      const t = audioRef.current.currentTime;
      // Only record if time changed (avoid duplicate entries)
      if (lastTime !== t) {
        onChange([...value, [t, newValue]]);
        setLastTime(t);
      }
    }
  };

  // Keyboard arrow support
  const handleSliderKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    let newValue = slider;
    if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
      newValue = Math.max(min, slider - step);
    } else if (e.key === "ArrowRight" || e.key === "ArrowUp") {
      newValue = Math.min(max, slider + step);
    } else {
      return;
    }
    setSlider(newValue);
    if (isPlaying && audioRef.current) {
      const t = audioRef.current.currentTime;
      if (lastTime !== t) {
        onChange([...value, [t, newValue]]);
        setLastTime(t);
      }
    }
    e.preventDefault();
  };

  // Reset lastTime when playback position changes (e.g. user seeks)
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onSeek = () => setLastTime(null);
    audio.addEventListener("seeked", onSeek);
    return () => audio.removeEventListener("seeked", onSeek);
  }, []);

  // Track if audio was played from the beginning to the end
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    let startedAtZero = false;
    const onPlay = () => {
      if (audio.currentTime < 0.1) startedAtZero = true;
    };
    const onEnded = () => {
      if (startedAtZero) setListenedFromStart(true);
    };
    audio.addEventListener("play", onPlay);
    audio.addEventListener("ended", onEnded);
    return () => {
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("ended", onEnded);
    };
  }, []);

  // Notify parent if valid (for required)
  useEffect(() => {
    if (onValidChange) {
      if (!required) onValidChange(true);
      else onValidChange(listenedFromStart);
    }
  }, [listenedFromStart, required, onValidChange]);

  return (
    <div
      className={
        vertical
          ? "flex flex-col gap-3 w-full items-center"
          : "flex flex-col gap-3 w-full"
      }
      style={{
        background: `rgba(59,130,246,${
          0 + ((slider - min) / (max - min)) * 0.68
        })`,
        boxShadow: `0 0 ${((slider - min) / (max - min)) * 40}px ${
          ((slider - min) / (max - min)) * 20
        }px rgba(59,130,246,${0.2 + ((slider - min) / (max - min)) * 0.6})`,
        borderRadius: "6px",
        animation:
          slider > min
            ? `pulse-bg ${
                1.2 - ((slider - min) / (max - min)) * 0.4
              }s cubic-bezier(.4,0,.6,1) infinite`
            : undefined,
      }}
    >
      {label && <label className="font-medium mb-1">{label}</label>}
      {/* <audio ref={audioRef} src={audioSrc} controls className="w-full" /> */}
      <audio ref={audioRef} src={audioSrc} style={{ display: "none" }} />
      <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
        {formatTime(currentTime)} / {formatTime(duration)}
      </div>
      <div
        className={vertical ? "flex flex-col items-center w-full" : "w-full"}
      >
        <Slider
          min={min}
          max={max}
          step={step}
          value={slider}
          onChange={handleSliderChange}
          onKeyDown={handleSliderKeyDown}
          data-orientation={vertical ? "vertical" : undefined}
          style={{
            ...(vertical
              ? { height: "60vh", transform: "rotate(180deg)" }
              : {}),
          }}
        />
      </div>
      {/* <div className="text-xs text-gray-500 dark:text-gray-400">
        Zanotowane punkty: {value.length}
      </div> */}
      {ended ? (
        <button type="button" className="btn" onClick={handlePlay}>
          ▶️ Odtwórz ponownie
        </button>
      ) : isPlaying ? (
        <button type="button" className="btn" onClick={handlePause}>
          ⏸️ Pauza
        </button>
      ) : (
        <button type="button" className="btn" onClick={handlePlay}>
          ▶️ Odtwórz
        </button>
      )}
    </div>
  );
};
