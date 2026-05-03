import { cn } from "@/lib/utils";

const COLORS = [
  { name: "blue", bg: "bg-palette-blue", light: "bg-palette-blue/10 text-palette-blue" },
  { name: "green", bg: "bg-palette-green", light: "bg-palette-green/10 text-palette-green" },
  { name: "red", bg: "bg-palette-red", light: "bg-palette-red/10 text-palette-red" },
  { name: "yellow", bg: "bg-palette-yellow", light: "bg-palette-yellow/10 text-palette-yellow" },
  { name: "purple", bg: "bg-palette-purple", light: "bg-palette-purple/10 text-palette-purple" },
  { name: "pink", bg: "bg-palette-pink", light: "bg-palette-pink/10 text-palette-pink" },
  { name: "orange", bg: "bg-palette-orange", light: "bg-palette-orange/10 text-palette-orange" },
];

export function getColorClasses(color: string) {
  return COLORS.find((c) => c.name === color)?.light ?? COLORS[0].light;
}

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
}

export default function ColorPicker({ value, onChange }: ColorPickerProps) {
  return (
    <div className="flex items-center gap-1.5">
      {COLORS.map((c) => (
        <button
          key={c.name}
          type="button"
          className={cn(
            "h-5 w-5 rounded-full transition-all",
            c.bg,
            value === c.name ? "ring-2 ring-offset-2 ring-foreground/30 scale-110" : "opacity-60 hover:opacity-100"
          )}
          onClick={() => onChange(c.name)}
        />
      ))}
    </div>
  );
}
