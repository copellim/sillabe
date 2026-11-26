import BigButton from "@/components/BigButton";
import ProgressCaterpillar from "@/components/ProgressCaterpillar";

export default function Home() {
  return (
    <main className="relative flex flex-1 flex-col items-center px-6 pb-10 text-center">
      {/* Settings (parent area) */}
      <div className="flex w-full justify-end pt-2">
        <a
          href="/settings"
          aria-label="impostazioni"
          className="flex h-12 w-12 items-center justify-center rounded-full text-2xl opacity-60 active:scale-95"
        >
          ⚙️
        </a>
      </div>

      {/* Caterpillar + title, centred in the available space */}
      <div className="flex flex-1 flex-col items-center justify-center gap-6">
        <ProgressCaterpillar className="max-w-[260px]" expanded />
        <div className="flex flex-col items-center gap-2">
          <h1 className="text-4xl font-extrabold">Sillabe</h1>
          <p className="max-w-xs text-lg font-semibold opacity-70">
            Impara a leggere, una sillaba alla volta.
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex w-full flex-col items-center gap-4">
        <BigButton href="/play" ariaLabel="Gioca">
          Gioca
        </BigButton>
        <BigButton href="/laboratory">🔊 Laboratorio dei suoni</BigButton>
        <a
          href="/levels"
          aria-label="Scegli livello"
          className="min-h-12 px-4 text-lg font-bold text-[var(--color-ink)] opacity-70 active:scale-95"
        >
          Scegli livello
        </a>
      </div>
    </main>
  );
}
