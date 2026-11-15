import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import music from "@/assets/home/quiet-voyage.mp3.asset.json";
import { assetUrl } from "@/lib/astra/local-assets";

export function HomeMusic() {
  const audio = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState(false);
  useEffect(() => {
    const stopWhenHidden = () => {
      if (document.hidden) { audio.current?.pause(); setPlaying(false); }
    };
    document.addEventListener("visibilitychange", stopWhenHidden);
    const removeGesture = () => ["pointerdown", "keydown"].forEach((t) => window.removeEventListener(t, startOnFirstGesture));
    // Try to start the music as soon as the Home page shows; if the browser blocks autoplay, fall back to the first tap, click or key press anywhere.
    const tryStart = () => {
      const player = audio.current;
      if (!player || !player.paused) return;
      player.volume = 0.15;
      player.play().then(() => { setPlaying(true); removeGesture(); }).catch(() => {});
    };
    const startOnFirstGesture = (e: Event) => {
      if ((e.target as Element | null)?.closest?.("[data-music-control]")) return;
      tryStart();
    };
    ["pointerdown", "keydown"].forEach((t) => window.addEventListener(t, startOnFirstGesture));
    tryStart();
    return () => { removeGesture(); document.removeEventListener("visibilitychange", stopWhenHidden); audio.current?.pause(); };
  }, []);
  async function toggle() {
    const player = audio.current;
    if (!player) return;
    if (playing) { player.pause(); setPlaying(false); return; }
    player.volume = 0.15;
    try { await player.play(); setPlaying(true); setError(false); }
    catch { setError(true); setPlaying(false); }
  }
  return <div className="flex items-center gap-2">
    <audio ref={audio} src={assetUrl(music, "quiet-voyage.mp3")} preload="auto" loop onError={() => setError(true)} />
    <Button data-music-control variant="glass" size="sm" onClick={toggle} aria-label={playing ? "Pause background music" : "Play background music"} aria-pressed={playing} title={playing ? "Pause background music" : "Play gentle background music"}>
      {playing ? <Volume2 /> : <VolumeX />}<span className="hidden sm:inline">{playing ? "Music on" : "Play music"}</span>
    </Button>
    <details className="relative text-xs text-muted-foreground">
      <summary className="cursor-pointer" title="Music and planet image credits">Credits</summary>
      <div className="absolute right-0 top-7 z-30 w-64 rounded-md border border-border bg-popover p-3 text-popover-foreground shadow-sm">
        <p>“Dreams Become Real” — Kevin MacLeod (<a className="text-primary" href="https://incompetech.com/" target="_blank" rel="noreferrer">incompetech.com</a>), <a className="text-primary" href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">CC BY 4.0</a>. Edited into a quiet loop.</p>
        <p className="mt-2">Planet textures: <a className="text-primary" href="https://www.solarsystemscope.com/textures/" target="_blank" rel="noreferrer">Solar System Scope</a>, CC BY 4.0.</p>
      </div>
    </details>
    {error && <span role="status" className="text-xs text-muted-foreground">Music unavailable</span>}
  </div>;
}