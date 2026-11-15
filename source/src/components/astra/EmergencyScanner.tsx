import { useEffect, useRef, useState } from "react";
import { Camera, CameraOff, Check, ImagePlus, LoaderCircle, PhoneCall, RotateCcw, ScanLine, ShieldAlert, Trash2, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { assessmentSchema, MAX_PHOTO_BYTES, needsImmediateHelp, validPhotoType, type AssessmentSymptoms, type EmergencyAssessment } from "@/lib/astra/emergency-assessment";
import { PROTOCOLS, selectProtocol } from "@/lib/astra/emergency-protocols";
import { useAstra } from "@/lib/astra/store";

const STATUS_STYLE = { Emergency: "border-status-red text-status-red bg-status-red/10", Urgent: "border-status-orange text-status-orange bg-status-orange/10", "Non-urgent": "border-status-green text-status-green bg-status-green/10" };

export function EmergencyScanner({ chatContext }: { chatContext: string }) {
  const state = useAstra();
  const video = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const photoUrl = useRef("");
  const abort = useRef<AbortController | null>(null);
  const generation = useRef(0);
  const upload = useRef<HTMLInputElement>(null);
  const [camera, setCamera] = useState(false);
  const [cameraPending, setCameraPending] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [photo, setPhoto] = useState<Blob | null>(null);
  const [preview, setPreview] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [phase, setPhase] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState<EmergencyAssessment | null>(null);
  const [assistance, setAssistance] = useState(false);
  const described = chatContext.trim();
  const symptoms: AssessmentSymptoms = { symptoms: described, location: "Not specified", onset: "Not specified", severity: "moderate", progression: "unchanged", additional: "", chatContext: described, redFlags: [] };
  const emergency = needsImmediateHelp(symptoms);
  const protocol = PROTOCOLS[selectProtocol(described)];

  const stopCamera = () => {
    generation.current += 1;
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
    if (video.current) video.current.srcObject = null;
    setCamera(false); setCameraReady(false); setCameraPending(false);
  };
  const clearPhoto = () => {
    if (photoUrl.current) URL.revokeObjectURL(photoUrl.current);
    photoUrl.current = ""; setPreview(""); setPhoto(null); setConfirmed(false);
  };
  useEffect(() => () => {
    generation.current += 1;
    stream.current?.getTracks().forEach((t) => t.stop());
    if (photoUrl.current) URL.revokeObjectURL(photoUrl.current);
    abort.current?.abort();
  }, []);
  useEffect(() => {
    const visibility = () => { if (document.hidden) stopCamera(); };
    document.addEventListener("visibilitychange", visibility);
    return () => document.removeEventListener("visibilitychange", visibility);
  }, []);
  useEffect(() => { if (camera && video.current && stream.current) video.current.srcObject = stream.current; }, [camera]);

  const activate = async () => {
    const attempt = ++generation.current;
    setError(""); setCameraPending(true);
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error("Camera access is unavailable. Use a secure browser or upload a photograph.");
      const next = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 960 } }, audio: false });
      if (attempt !== generation.current) { next.getTracks().forEach((t) => t.stop()); return; }
      stream.current = next; setCamera(true);
    } catch (e) {
      const name = e instanceof Error ? e.name : "";
      setError(name === "NotAllowedError" ? "Camera permission was denied. Allow camera access in your browser, or upload a photograph." : name === "NotFoundError" ? "No camera was found. Upload a photograph instead." : name === "NotReadableError" ? "Camera is busy or unavailable. Close other camera apps or upload a photograph." : e instanceof Error ? e.message : "Camera could not open.");
    } finally { if (attempt === generation.current) setCameraPending(false); }
  };
  const usePhoto = (blob: Blob) => {
    clearPhoto(); stopCamera(); setPhoto(blob);
    photoUrl.current = URL.createObjectURL(blob); setPreview(photoUrl.current);
    setResult(null); setError("");
  };
  const capture = () => {
    const v = video.current;
    if (!v || !v.videoWidth || !cameraReady) return;
    const canvas = document.createElement("canvas");
    const ratio = Math.min(1, 1280 / Math.max(v.videoWidth, v.videoHeight));
    canvas.width = Math.round(v.videoWidth * ratio); canvas.height = Math.round(v.videoHeight * ratio);
    const context = canvas.getContext("2d");
    if (!context) { setError("Photograph capture is unavailable. Upload an image instead."); return; }
    context.drawImage(v, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => { if (blob) usePhoto(blob); else setError("Capture failed. Please try again."); canvas.width = 0; canvas.height = 0; }, "image/jpeg", 0.85);
  };
  const processUpload = async (file: File) => {
    if (!validPhotoType(file.type) || !file.size || file.size > MAX_PHOTO_BYTES) { setError("Choose a JPEG, PNG or WebP photograph up to 4 MB."); return; }
    try {
      // Re-encode locally to remove embedded location/EXIF metadata before submission.
      const bitmap = await createImageBitmap(file);
      const canvas = document.createElement("canvas");
      const ratio = Math.min(1, 1280 / Math.max(bitmap.width, bitmap.height));
      canvas.width = Math.round(bitmap.width * ratio); canvas.height = Math.round(bitmap.height * ratio);
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Unable to read photograph.");
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height); bitmap.close();
      canvas.toBlob((blob) => { if (blob) usePhoto(blob); else setError("Unable to read photograph."); canvas.width = 0; canvas.height = 0; }, "image/jpeg", 0.85);
    } catch { setError("Unable to read this photograph. Choose another JPEG, PNG or WebP image."); }
  };
  const assess = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!photo || !confirmed || !consent || !described || busy) return;
    const controller = new AbortController(); abort.current = controller;
    setBusy(true); setResult(null); setError(""); setPhase("Analysing symptoms and image…"); stopCamera();
    const form = new FormData(); form.set("photo", photo, "assessment.jpg"); form.set("symptoms", JSON.stringify(symptoms));
    // Remove the browser preview once processing begins; never persist the image.
    clearPhoto();
    try {
      const response = await fetch("/api/emergency-assessment", { method: "POST", body: form, signal: controller.signal });
      if (!response.ok) throw new Error(await response.text());
      const reader = response.body?.getReader();
      if (!reader) throw new Error("No assessment received. Contact qualified medical help.");
      const decoder = new TextDecoder(); let buffer = ""; let completed = false;
      while (true) {
        const chunk = await reader.read();
        buffer += decoder.decode(chunk.value, { stream: !chunk.done });
        const lines = buffer.split("\n"); buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue;
          const item = JSON.parse(line);
          if (item.type === "progress") setPhase(item.phase);
          if (item.type === "error") throw new Error(item.message);
          if (item.type === "result") { setResult(assessmentSchema.parse(item.assessment)); completed = true; }
        }
        if (chunk.done) break;
      }
      if (!completed) throw new Error("No complete assessment was returned. Contact qualified medical help.");
    } catch (e) { setError(controller.signal.aborted ? "Assessment stopped. Photograph cleared." : e instanceof Error ? e.message : "Assessment failed. Contact qualified help."); }
    finally { form.delete("photo"); form.delete("symptoms"); abort.current = null; setBusy(false); setConsent(false); }
  };

  return <section aria-label="Emergency camera assessment" className="space-y-5">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><p className="hud-label">Preliminary assessment</p><h2 className="mt-1 text-2xl font-semibold">Emergency Assessment Scanner</h2></div>
      <Button variant="destructive" onClick={() => setAssistance(true)}><PhoneCall /> Emergency assistance</Button>
    </div>
    <div className="border-l-2 border-status-red bg-status-red/10 p-4 text-sm"><p className="font-semibold">Not a diagnosis. A normal-looking photograph cannot rule out an emergency.</p><p className="mt-1">For serious symptoms, alert a crewmate and contact the mission medical officer now; on Earth call local emergency services.</p></div>
    {emergency && <div role="alert" className="border-2 border-status-red bg-status-red/10 p-4"><h3 className="flex items-center gap-2 font-semibold text-status-red"><ShieldAlert /> Possible emergency — get help now</h3><p className="mt-2 text-sm">Do not wait for camera capture or AI analysis. Contact qualified emergency help immediately.</p><ol className="mt-2 list-decimal space-y-1 pl-5 text-sm">{protocol.steps.map((step) => <li key={step}>{step}</li>)}</ol></div>}
    <form onSubmit={assess} className="grid items-start gap-6 lg:grid-cols-2">
      <div className="min-w-0 space-y-3">
        <h3 className="font-semibold">Affected area photograph</h3>
        <div className="relative grid aspect-[4/3] w-full place-items-center overflow-hidden rounded-md border border-border bg-muted">
          {preview ? <img src={preview} alt="Captured affected area" className="h-full w-full object-contain" /> : camera ? <video ref={video} aria-label="Live emergency camera" autoPlay playsInline muted onLoadedData={() => setCameraReady(true)} className="h-full w-full object-contain" /> : <div className="flex flex-col items-center gap-3 text-muted-foreground"><CameraOff className="size-10" /><span className="text-sm">Camera off</span></div>}
        </div>
        <input ref={upload} aria-label="Upload affected area photograph" type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => { const file = e.target.files?.[0]; if (file) void processUpload(file); e.target.value = ""; }} disabled={busy} />
        <div className="flex flex-wrap gap-2">
          {preview ? <><Button type="button" variant="outline" onClick={() => { clearPhoto(); void activate(); }}><RotateCcw /> Retake photograph</Button><Button type="button" disabled={confirmed} onClick={() => setConfirmed(true)}><Check /> {confirmed ? "Photograph confirmed" : "Confirm photograph"}</Button><Button type="button" variant="ghost" size="icon" aria-label="Delete photograph" title="Delete photograph" onClick={clearPhoto}><Trash2 /></Button></> : camera ? <><Button type="button" onClick={capture} disabled={!cameraReady}><Camera /> Capture photograph</Button><Button type="button" variant="outline" onClick={stopCamera}><CameraOff /> Turn camera off</Button></> : <Button type="button" variant="outline" disabled={busy || cameraPending} onClick={() => void activate()}>{cameraPending ? <LoaderCircle className="animate-spin motion-reduce:animate-none" /> : <Camera />} {cameraPending ? "Requesting camera…" : "Activate Emergency Camera"}</Button>}
          {!preview && <Button type="button" variant="outline" disabled={busy || cameraPending} onClick={() => upload.current?.click()}><ImagePlus /> Upload photograph</Button>}
        </div>
        <p className="text-xs text-muted-foreground">JPEG, PNG or WebP · up to 4 MB. Photographs are sent to Lovable AI only with your consent, are not saved by ASTRA and are cleared after processing. Avoid faces and identifying details.</p>
      </div>
      <div className="min-w-0 space-y-4">
        <h3 className="font-semibold">Symptoms from the emergency chatbot</h3>
        <p className="text-sm text-muted-foreground">Describe your symptoms to the emergency chatbot below — what you feel, where it hurts and when it started. Your chatbot messages are used as the symptom report for this assessment.</p>
        {described ? <div className="max-h-40 overflow-auto border-l-2 border-primary pl-3 text-sm text-muted-foreground whitespace-pre-wrap">{described}</div> : <p className="border-l-2 border-status-orange pl-3 text-sm text-muted-foreground">No symptoms described yet. Tell the emergency chatbot below what is wrong, then return here to analyse.</p>}
        <fieldset disabled={busy} className="space-y-4">
          <label className="flex items-start gap-2 text-sm"><Checkbox className="mt-0.5" checked={consent} onCheckedChange={(v) => setConsent(v === true)} />I consent to sending this photograph and my chatbot symptom description to Lovable AI for preliminary guidance.</label>
        </fieldset>
        {busy ? <div role="status" className="space-y-3 border-l-2 border-primary p-3"><p className="flex items-center gap-2 text-sm"><LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" />{phase}</p><progress aria-label="Assessment progress" className="h-2 w-full accent-primary" /><p className="text-xs text-muted-foreground">Processing time varies. Contact medical help without waiting for these results.</p><Button type="button" variant="outline" onClick={() => abort.current?.abort()}><Square /> Stop assessment</Button></div> : <Button type="submit" disabled={!photo || !confirmed || !consent || !described} className="w-full"><ScanLine /> Analyse symptoms and image</Button>}
      </div>
    </form>
    {error && <p role="alert" className="break-words text-sm text-status-red">{error}</p>}
    {result && <section aria-label="Emergency assessment results" className="space-y-4 border-t border-border pt-5">
      <div className={`border-l-4 p-4 ${STATUS_STYLE[result.status]}`}><p className="text-xs font-mono">Emergency status</p><h3 className="mt-1 text-2xl font-semibold">{result.status}</h3><p className="mt-2 text-sm">{result.status === "Non-urgent" ? "No obvious emergency signs identified. This is not proof of health; seek medical advice if symptoms persist or worsen." : result.status === "Urgent" ? "Prompt professional medical assessment recommended." : "Possible emergency requiring immediate medical assistance."}</p></div>
      <div className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
        <ResultList title="Visual observations" items={result.visualObservations} />
        <div><h4 className="font-semibold">Symptom analysis</h4><p className="mt-2 text-sm text-muted-foreground">{result.symptomAnalysis}</p></div>
        <ResultList title="Potential concerns" items={result.potentialConcerns} />
        <ResultList title="Recommended actions" items={result.recommendedActions} />
      </div>
      <div className="border-l-2 border-primary pl-4"><h4 className="font-semibold">Medical assistance</h4><p className="mt-2 text-sm">{result.medicalAssistance}</p><Button type="button" variant="destructive" className="mt-3" onClick={() => setAssistance(true)}><PhoneCall /> Emergency assistance</Button></div>
      <p className="text-xs text-muted-foreground">Photograph cleared. Preliminary AI guidance, not a medical diagnosis. <a className="text-primary underline" href={PROTOCOLS.general.source} target="_blank" rel="noreferrer">Red Cross first-aid reference</a></p>
    </section>}
    <Dialog open={assistance} onOpenChange={setAssistance}><DialogContent><DialogHeader><DialogTitle>Contact emergency medical help now</DialogTitle><DialogDescription>Alert a nearby crewmate and contact your mission medical officer using the approved emergency channel. On Earth, call your local emergency services. No call or alert has been placed by ASTRA.</DialogDescription></DialogHeader><ol className="list-decimal space-y-2 pl-5 text-sm">{PROTOCOLS.general.steps.map((step) => <li key={step}>{step}</li>)}</ol>{state.settings?.workPhone && <Button asChild variant="destructive"><a href={`tel:${state.settings.workPhone}`}><PhoneCall /> Dial workplace</a></Button>}</DialogContent></Dialog>
  </section>;
}

function ResultList({ title, items }: { title: string; items: string[] }) {
  return <div><h4 className="font-semibold">{title}</h4>{items.length ? <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">{items.map((item, i) => <li key={i}>{item}</li>)}</ul> : <p className="mt-2 text-sm text-muted-foreground">No specific findings reported; this does not exclude a medical problem.</p>}</div>;
}