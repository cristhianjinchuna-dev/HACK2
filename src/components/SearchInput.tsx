import { useEffect, useRef, useState, type ChangeEvent } from 'react';

interface Props {
  value: string;                    // valor actual de "q" en la URL
  onSearch: (text: string) => void; // se llama cuando el usuario deja de escribir
}

// Debounce: espera 300 ms sin teclear antes de buscar (no una request por tecla)
export default function SearchInput({ value, onSearch }: Props) {
  const [text, setText] = useState(value);
  const timer = useRef<number | undefined>(undefined);

  // Si la URL cambia desde fuera (atrás/adelante), sincroniza el input
  useEffect(() => {
    setText(value);
  }, [value]);

  // Limpia el timer al desmontar
  useEffect(() => () => window.clearTimeout(timer.current), []);

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const next = e.target.value;
    setText(next);
    window.clearTimeout(timer.current); // sigue escribiendo → cancela la búsqueda anterior
    timer.current = window.setTimeout(() => onSearch(next), 300);
  }

  return (
    <input
      value={text}
      onChange={handleChange}
      placeholder="Buscar por nombre o epíteto..."
      className="rounded border p-2"
    />
  );
}