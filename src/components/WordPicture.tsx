import { wordPictures } from "@/data/wordPictures";

/** Local SVG drawings for the less unambiguous emoji; no remote image requests. */
export default function WordPicture({ word }: { word: string }) {
  const picture = wordPictures[word];
  const shapes: Record<string, React.ReactNode> = {
    EMÙ: (
      <>
        <ellipse cx="96" cy="83" rx="43" ry="30" fill="#99765a" />
        <path
          d="M121 75 Q146 63 139 29"
          fill="none"
          stroke="#99765a"
          strokeWidth="17"
        />
        <ellipse cx="139" cy="25" rx="17" ry="12" fill="#ac8b68" />
        <path d="m153 22 18 8-18 3" fill="#e6b044" />
        <circle cx="143" cy="22" r="3" />
        <path
          d="m81 108-6 29h-17m49-29 7 29h17"
          stroke="#775333"
          strokeWidth="6"
          fill="none"
        />
      </>
    ),
    PUPA: (
      <>
        <path d="M30 19h141" stroke="#987654" strokeWidth="9" />
        <path d="M100 20v16" stroke="#6b824b" strokeWidth="5" />
        <path
          d="M100 35C53 51 64 117 100 143c36-26 47-92 0-108"
          fill="#94b77b"
        />
        <path
          d="m79 67 44 12m-49 13 48 12m-38 12 26 8"
          stroke="#577e4b"
          strokeWidth="5"
        />
      </>
    ),
    PUMA: (
      <>
        <ellipse cx="98" cy="91" rx="49" ry="25" fill="#cda374" />
        <circle cx="139" cy="64" r="23" fill="#cda374" />
        <circle cx="123" cy="46" r="9" fill="#cda374" />
        <circle cx="153" cy="46" r="9" fill="#cda374" />
        <path
          d="M52 91Q18 94 24 61m49 48-8 24m54-24 8 24"
          stroke="#cda374"
          strokeWidth="12"
          fill="none"
        />
        <circle cx="133" cy="60" r="3" />
        <circle cx="149" cy="60" r="3" />
        <path d="m136 73 5 5 5-5" fill="#553e2c" />
      </>
    ),
    MIMO: (
      <>
        <path d="M66 52v-15h67v15" fill="#343d50" />
        <path d="M51 51h98" stroke="#343d50" strokeWidth="9" />
        <circle
          cx="100"
          cy="74"
          r="26"
          fill="white"
          stroke="#343d50"
          strokeWidth="3"
        />
        <circle cx="90" cy="70" r="3" />
        <circle cx="111" cy="70" r="3" />
        <path
          d="M88 86q12 9 24 0M70 110h60m-60 12h60m-60 12h60"
          fill="none"
          stroke="#343d50"
          strokeWidth="6"
        />
        <path d="m68 111-23-26m87 26 22-26" stroke="#343d50" strokeWidth="9" />
      </>
    ),
    TELA: (
      <>
        <rect x="35" y="22" width="130" height="118" rx="5" fill="#fae5b7" />
        {[50, 70, 90, 110, 130, 150].map((n) => (
          <g key={n} strokeWidth="7">
            <path d={`M${n} 22v118`} stroke="#a2cbd0" />
            <path d={`M35 ${n - 15}h130`} stroke="#d9a87c" />
          </g>
        ))}
      </>
    ),
    TUTA: (
      <>
        <path
          d="m39 36 22-13 15 12 15-12 23 13 15 29-21 9-9-18v44H54V56l-9 18-21-9Z"
          fill="#6a9ac7"
        />
        <path d="M120 84h47l11 61h-22l-12-36-7 36h-23Z" fill="#5678a7" />
      </>
    ),
    NANO: (
      <>
        <path d="m66 63 32-52 36 52" fill="#df7765" />
        <circle cx="100" cy="83" r="26" fill="#f6d2ac" />
        <path d="m72 88 28 52 28-52-17 10-11-8-11 8Z" fill="white" />
        <circle cx="91" cy="78" r="3" />
        <circle cx="109" cy="78" r="3" />
        <circle cx="100" cy="87" r="7" fill="#e4a382" />
      </>
    ),
    ALA: (
      <>
        <path
          d="M45 114Q55 22 160 25q-8 28-28 40 14-3 22-1-13 25-40 32 8 1 17 5-35 27-86 13"
          fill="#b0d4e8"
          stroke="#5e8eaa"
          strokeWidth="4"
        />
        <path d="m53 107 82-59m-67 51 51-12" stroke="#5e8eaa" strokeWidth="4" />
      </>
    ),
    PALA: (
      <>
        <path
          d="M80 15h40v24H80Z"
          fill="none"
          stroke="#a7794c"
          strokeWidth="8"
        />
        <path d="M100 40v65" stroke="#a7794c" strokeWidth="10" />
        <path d="M70 97h60v29q-30 33-60 0Z" fill="#87a5ae" />
      </>
    ),
    AMO: (
      <>
        <path
          d="M99 8v59m0 0v39q0 36-31 28-25-7-14-29"
          stroke="#80949e"
          strokeWidth="8"
          fill="none"
        />
        <path d="m54 105-3 21 17-12" fill="#80949e" />
        <circle
          cx="99"
          cy="54"
          r="8"
          fill="none"
          stroke="#80949e"
          strokeWidth="5"
        />
      </>
    ),
  };
  return (
    <span
      className="inline-flex h-32 w-40 items-center justify-center"
      role="img"
      aria-label={word.toLocaleLowerCase("it-IT")}
    >
      {shapes[word] ? (
        <svg viewBox="0 0 200 160" className="h-full w-full" aria-hidden>
          {shapes[word]}
        </svg>
      ) : (
        <span aria-hidden className="text-8xl leading-none">
          {word === "FARFALLA" ? "🦋" : (picture?.symbol ?? "🌱")}
        </span>
      )}
    </span>
  );
}
