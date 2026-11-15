import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useEffect, useRef, useState } from "react";
import { PhoneCall, ShieldAlert, Trash2 } from "lucide-react";
import { Conversation, ConversationContent, ConversationScrollButton } from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import { PromptInput, PromptInputTextarea, PromptInputFooter, PromptInputSubmit } from "@/components/ai-elements/prompt-input";
import { Reasoning, ReasoningTrigger, ReasoningContent } from "@/components/ai-elements/reasoning";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { Button } from "@/components/ui/button";
import { AstraMark } from "./AstraLogo";
import { EMERGENCY_HISTORY_KEY, parseEmergencyHistory } from "@/lib/astra/emergency-history";
import { PROTOCOLS, selectProtocol } from "@/lib/astra/emergency-protocols";
import { offlineAnswer } from "@/lib/astra/offline-assistant";
import { useAstra } from "@/lib/astra/store";

const transport = new DefaultChatTransport({ api: "/api/emergency-chat" });

export function EmergencyChat({ onUserContextChange }: { onUserContextChange?: (text: string) => void } = {}) {
  const [initial, setInitial] = useState<UIMessage[] | null>(null);
  const [storageError, setStorageError] = useState("");
  useEffect(() => {
    try { setInitial(parseEmergencyHistory(localStorage.getItem(EMERGENCY_HISTORY_KEY))); }
    catch { setStorageError("Browser history is unavailable; this conversation will not be saved."); setInitial([]); }
  }, []);
  if (!initial) return <p className="text-muted-foreground">Loading emergency chat…</p>;
  return <ChatSession initial={initial} storageError={storageError} onUserContextChange={onUserContextChange} />;
}

function ChatSession({ initial, storageError, onUserContextChange }: { initial: UIMessage[]; storageError: string; onUserContextChange?: (text: string) => void }) {
  const state = useAstra();
  const textarea = useRef<HTMLTextAreaElement>(null);
  const [text, setText] = useState("");
  const [historyError, setHistoryError] = useState(storageError);
  const { messages, sendMessage, status, stop, setMessages, error, clearError } = useChat({
    id: "astra-emergency", messages: initial, transport,
    onFinish: ({ messages: completed }) => {
      try { localStorage.setItem(EMERGENCY_HISTORY_KEY, JSON.stringify(completed)); }
      catch { setHistoryError("Chat could not be saved in this browser."); }
    },
  });
  const busy = status === "submitted" || status === "streaming";
  useEffect(() => {
    onUserContextChange?.(messages.filter((m) => m.role === "user").map((m) => m.parts.filter((p) => p.type === "text").map((p) => p.text).join(" ")).join("\n").slice(-8000));
  }, [messages, onUserContextChange]);
  useEffect(() => {
    if (!busy) {
      try { localStorage.setItem(EMERGENCY_HISTORY_KEY, JSON.stringify(messages)); }
      catch { setHistoryError("Chat could not be saved in this browser."); }
      if (!(document.activeElement instanceof HTMLInputElement)) textarea.current?.focus();
    }
  }, [messages, busy]);
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  const protocol = PROTOCOLS[selectProtocol(lastUser?.parts.filter((p) => p.type === "text").map((p) => p.text).join(" ") ?? "")];
  const send = (value: string) => {
    if (busy || !value.trim()) return;
    clearError(); setText("");
    const trimmed = value.trim();
    // Offline: the AI gateway is unreachable, so answer from the local rule-based
    // demonstration assistant instead of sending anything to the network.
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      const reply = offlineAnswer(trimmed);
      const stamp = Date.now();
      setMessages([
        ...messages,
        { id: `u_${stamp}`, role: "user", parts: [{ type: "text", text: trimmed }] },
        { id: `a_${stamp}`, role: "assistant", parts: [{ type: "text", text: `*(Offline demonstration assistant — not the full AI)*\n\n${reply.text}` }] },
      ]);
      textarea.current?.focus();
      return;
    }
    void sendMessage({ text: trimmed }); textarea.current?.focus();
  };
  const lastAssistant = messages.at(-1);
  const waiting = busy && (lastAssistant?.role !== "assistant" || !lastAssistant.parts.some((p) => p.type === "text" && p.text));

  return (
    <section aria-label="Emergency AI chat" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3"><AstraMark /><div><h2 className="font-display text-xl font-semibold">Emergency AI Guide</h2><p className="text-xs text-muted-foreground">One conversation · saved in this browser</p></div></div>
        <Button variant="ghost" size="icon" aria-label="Clear emergency chat" title="Clear emergency chat" disabled={busy || !messages.length} onClick={() => { if (window.confirm("Delete this emergency conversation from this browser?")) { setMessages([]); clearError(); localStorage.removeItem(EMERGENCY_HISTORY_KEY); } }}><Trash2 /></Button>
      </div>
      <div role="note" className="border-l-2 border-status-red bg-status-red/10 p-4 text-sm">
        <p className="flex items-center gap-2 font-semibold text-status-red"><ShieldAlert className="size-4" /> Contact qualified help now. Do not wait for AI.</p>
        <p className="mt-2">General first-aid information, not diagnosis or mission-approved medical advice. This chat cannot send alerts or call a doctor.</p>
        {state.settings?.workPhone && <Button asChild variant="outline" size="sm" className="mt-3"><a href={`tel:${state.settings.workPhone}`}><PhoneCall /> Dial workplace</a></Button>}
      </div>
      <div aria-live="polite" className="border-l-2 border-primary pl-4">
        <h3 className="font-semibold">{protocol.title}</h3>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm">{protocol.steps.map((s) => <li key={s}>{s}</li>)}</ol>
        <a className="mt-2 inline-block text-xs text-primary underline" href={protocol.source} target="_blank" rel="noreferrer">General first-aid reference</a>
      </div>
      <div className="flex flex-wrap gap-2">{["Severe bleeding", "Chest pain", "Unresponsive, not breathing normally"].map((s) => <Button key={s} variant="outline" size="sm" className="h-auto min-h-8 whitespace-normal text-left" disabled={busy} onClick={() => send(s)}>{s}</Button>)}</div>
      <Conversation className="h-[26rem] min-h-0 border-y border-border" aria-label="Emergency conversation">
        <ConversationContent>
          {!messages.length && <Message from="assistant"><MessageContent><MessageResponse>What is happening, and is the person awake and breathing normally? Alert a crewmate and contact qualified medical help now.</MessageResponse></MessageContent></Message>}
          {messages.map((m) => <Message key={m.id} from={m.role}><MessageContent className={m.role === "user" ? "group-[.is-user]:bg-primary group-[.is-user]:text-primary-foreground" : "w-full"}>
            {m.parts.map((p, i) => p.type === "text" ? <MessageResponse key={i}>{p.text}</MessageResponse> : p.type === "reasoning" ? <Reasoning key={i} defaultOpen={false} isStreaming={busy && m.id === lastAssistant?.id}><ReasoningTrigger /><ReasoningContent>{p.text}</ReasoningContent></Reasoning> : null)}
          </MessageContent></Message>)}
          {waiting && <Message from="assistant"><MessageContent><Shimmer>Preparing basic guidance… Contact medical help now.</Shimmer></MessageContent></Message>}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>
      {error && <p role="alert" className="text-sm text-status-red">{error.message} Contact qualified help now; do not wait for chat.</p>}
      {historyError && <p role="alert" className="text-sm text-status-yellow">{historyError}</p>}
      <PromptInput onSubmit={() => send(text)}>
        <PromptInputTextarea ref={textarea} aria-label="Describe the emergency" placeholder="Describe symptoms, when they started, and breathing…" value={text} onChange={(e) => setText(e.target.value)} maxLength={4000} autoFocus />
        <PromptInputFooter className="justify-end"><PromptInputSubmit status={status} onStop={stop} disabled={!busy && !text.trim()} /></PromptInputFooter>
      </PromptInput>
      <p className="text-xs text-muted-foreground">Messages are sent to Lovable AI for replies. History stays in this browser and may be visible to anyone using this device. Avoid names, phone numbers and identifying medical details.</p>
    </section>
  );
}