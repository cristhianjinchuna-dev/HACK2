import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-amber-100 p-4 text-center">
      {/* Dibujo propio en SVG (no se permiten imágenes oficiales) */}
      <svg viewBox="0 0 400 240" className="w-full max-w-lg rounded-xl border-4 border-amber-800 bg-amber-50" role="img" aria-label="Mapa con un barco perdido cerca de una isla">
        <rect x="10" y="10" width="380" height="220" rx="8" fill="#bfdbfe" />
        <path d="M60 190 Q120 140 200 150 T340 60" fill="none" stroke="#92400e" strokeWidth="3" strokeDasharray="8 8" />
        <ellipse cx="300" cy="80" rx="60" ry="28" fill="#fcd34d" stroke="#92400e" strokeWidth="2" />
        <line x1="300" y1="78" x2="306" y2="45" stroke="#78350f" strokeWidth="4" />
        <path d="M306 45 q-20 -6 -30 6 M306 45 q20 -6 30 6 M306 45 q-8 -16 -24 -14 M306 45 q10 -16 26 -12" stroke="#15803d" strokeWidth="5" fill="none" />
        <text x="290" y="90" fontSize="20" fill="#b91c1c" fontWeight="bold">X</text>
        <g transform="translate(40 150)">
          <path d="M0 30 L60 30 L50 45 L10 45 Z" fill="#78350f" />
          <line x1="30" y1="30" x2="30" y2="0" stroke="#451a03" strokeWidth="3" />
          <path d="M30 2 L52 22 L30 22 Z" fill="#fff7ed" stroke="#451a03" />
        </g>
      </svg>
      <h1 className="text-4xl font-bold text-amber-900">404</h1>
      <p className="text-amber-900">Esta isla no aparece en ningún mapa. El Log Pose perdió el rumbo.</p>
      <Link to="/dashboard" className="rounded bg-amber-800 px-4 py-2 text-white">Volver a puerto</Link>
    </main>
  );
}