"use client";
import { useEffect, useRef, useState } from "react";
import { useProgress } from "@/hooks/useProgress";
import { previewRecording, useAudio } from "@/hooks/useAudio";
import { tts, audioKey } from "@/lib/tts";
import { getAllLessons } from "@/lib/gameData";
import { recordingKeys, saveRecording } from "@/lib/recordings";

const targets = [
  ...new Set(
    getAllLessons().flatMap(({ lesson }) =>
      lesson.exercises.flatMap((e) =>
        e.type === "intro"
          ? [`lettera:${e.target}`]
          : e.type === "word"
            ? [...e.syllables, e.target]
            : [e.target],
      ),
    ),
  ),
];

export default function VoiceSettings() {
  const { progress, updateSettings } = useProgress();
  const { speak, stop } = useAudio();
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selected, setSelected] = useState(targets[0]);
  const [keys, setKeys] = useState<string[]>([]);
  const [draft, setDraft] = useState<Blob | null>(null);
  const [recording, setRecording] = useState(false);
  const [message, setMessage] = useState("");
  const requesting = useRef(false);
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const previewStop = useRef<(() => void) | null>(null);
  const limit = useRef<ReturnType<typeof setTimeout> | null>(null);
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    const refresh = () => setVoices(tts.getVoices());
    refresh();
    const unbind = tts.subscribeVoices(refresh);
    void recordingKeys().then(setKeys);
    return () => {
      alive.current = false;
      unbind();
      if (recorder.current?.state === "recording") recorder.current.stop();
      stream.current?.getTracks().forEach((t) => t.stop());
      previewStop.current?.();
      if (limit.current) clearTimeout(limit.current);
      stop();
    };
  }, [stop]);
  async function record() {
    if (requesting.current || recorder.current) return;
    requesting.current = true;
    try {
      if (
        !navigator.mediaDevices?.getUserMedia ||
        typeof MediaRecorder === "undefined"
      )
        throw new Error(
          "Puoi importare un file audio: questo browser non permette la registrazione.",
        );
      stop();
      previewStop.current?.();
      const media = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!alive.current) {
        media.getTracks().forEach((t) => t.stop());
        return;
      }
      stream.current = media;
      const capture = new MediaRecorder(media);
      recorder.current = capture;
      const chunks: BlobPart[] = [];
      capture.ondataavailable = (event) => {
        if (event.data.size) chunks.push(event.data);
      };
      capture.onstop = () => {
        media.getTracks().forEach((t) => t.stop());
        recorder.current = null;
        if (limit.current) clearTimeout(limit.current);
        if (alive.current) {
          setRecording(false);
          setDraft(new Blob(chunks, { type: capture.mimeType }));
          setMessage("Ascolta la registrazione prima di salvarla.");
        }
      };
      capture.start();
      setRecording(true);
      setDraft(null);
      setMessage("");
      limit.current = setTimeout(() => {
        if (capture.state === "recording") capture.stop();
      }, 10000);
    } catch (error) {
      stream.current?.getTracks().forEach((t) => t.stop());
      setMessage(
        error instanceof Error
          ? error.message
          : "Microfono non disponibile: puoi importare un file audio.",
      );
    } finally {
      requesting.current = false;
    }
  }
  async function save(blob: Blob | null) {
    try {
      await saveRecording(audioKey(selected), blob);
      setKeys(await recordingKeys());
      setDraft(null);
      setMessage(
        blob
          ? "Pronuncia salvata su questo dispositivo, anche offline."
          : "Registrazione rimossa. Verrà usata la voce del dispositivo.",
      );
    } catch {
      setMessage(
        "Non riesco a salvare l’audio. Controlla lo spazio disponibile del browser.",
      );
    }
  }
  return (
    <section className="flex flex-col gap-4 rounded-3xl bg-white/70 p-5">
      <h2 className="text-xl font-extrabold">Voce e pronunce</h2>
      <label className="flex flex-col gap-2 font-bold">
        Voce italiana
        <select
          className="min-h-12 max-w-full rounded-xl border p-2"
          value={progress.settings.voiceURI}
          onChange={(e) => updateSettings({ voiceURI: e.target.value })}
        >
          <option value="">Automatica, preferisci voce offline</option>
          {voices.map((v) => (
            <option key={v.voiceURI} value={v.voiceURI}>
              {v.name}
              {v.localService ? " · sul dispositivo" : " · richiede rete"}
            </option>
          ))}
        </select>
      </label>
      {voices.length === 0 && (
        <p>
          Nessuna voce italiana disponibile al momento. Le tue registrazioni
          funzionano comunque.
        </p>
      )}
      <label className="font-bold">
        Velocità della voce
        <select
          className="ml-2 min-h-12 rounded-xl border p-2"
          value={progress.settings.speechRate}
          onChange={(e) =>
            updateSettings({ speechRate: Number(e.target.value) })
          }
        >
          <option value={0.75}>Lenta</option>
          <option value={0.85}>Naturale e calma</option>
          <option value={1}>Naturale</option>
        </select>
      </label>
      <div className="flex flex-wrap gap-2">
        {["MA", "ME", "PAPÀ"].map((t) => (
          <button
            key={t}
            className="quiet-button px-3"
            onClick={() => void speak(t)}
          >
            🔊 {t}
          </button>
        ))}
      </div>
      <p className="text-sm">
        La sintesi del dispositivo può pronunciare male le sillabe isolate. Puoi
        sostituire ogni pronuncia con un audio ascoltato e verificato da te.
        Nessun audio viene inviato online.
      </p>
      <label className="flex flex-col gap-2 font-bold">
        Pronuncia da verificare
        <select
          disabled={recording}
          className="min-h-12 rounded-xl border p-2"
          value={selected}
          onChange={(e) => {
            setSelected(e.target.value);
            setDraft(null);
            setMessage("");
            previewStop.current?.();
            stop();
          }}
        >
          {targets.map((t) => (
            <option key={t} value={t}>
              {t.startsWith("lettera:")
                ? `Nome della lettera ${t.slice(8)}`
                : t}
              {keys.includes(audioKey(t)) ? " · registrata" : ""}
            </option>
          ))}
        </select>
      </label>
      <p className="text-sm">
        Pronuncia la sillaba intera, senza scandire i nomi delle lettere. Per
        PAPÀ ed EMÙ registra anche la parola con il suo accento. Lascia una
        pausa breve prima e dopo.
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          disabled={recording}
          className="quiet-button px-4"
          onClick={() => void speak(selected)}
        >
          🔊 Ascolta attuale
        </button>
        <button
          className="quiet-button px-4"
          onClick={() => (recording ? recorder.current?.stop() : void record())}
        >
          {recording ? "■ Ferma registrazione" : "🎙 Registra"}
        </button>
      </div>
      <label className="flex flex-col gap-2 text-sm font-bold">
        Oppure importa un audio (massimo 5 MB)
        <input
          disabled={recording}
          type="file"
          accept="audio/*"
          className="min-h-12 w-full max-w-full"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            if (file.size > 5_000_000 || !file.type.startsWith("audio/")) {
              setMessage("Scegli un file audio fino a 5 MB.");
              return;
            }
            setDraft(file);
            setMessage("Ascolta il file prima di salvarlo.");
            e.target.value = "";
          }}
        />
      </label>
      {draft && (
        <div className="flex flex-wrap gap-2">
          <button
            className="quiet-button px-3"
            onClick={() => {
              previewStop.current?.();
              previewStop.current = previewRecording(draft);
            }}
          >
            ▶ Ascolta registrazione
          </button>
          <button
            className="quiet-button px-3"
            onClick={() => void save(draft)}
          >
            Pronuncia corretta: salva
          </button>
          <button className="quiet-button px-3" onClick={() => setDraft(null)}>
            Scarta
          </button>
        </div>
      )}
      {keys.includes(audioKey(selected)) && (
        <button
          disabled={recording}
          className="quiet-button px-3"
          onClick={() => void save(null)}
        >
          Usa di nuovo la voce del dispositivo
        </button>
      )}
      <p role="status" className="text-sm">
        {recording ? "Registrazione in corso, massimo 10 secondi…" : message}
      </p>
      <p className="text-sm">
        {keys.length} pronunce personali salvate. Sono legate a questo browser:
        cancellarne i dati rimuove anche gli audio.
      </p>
    </section>
  );
}
