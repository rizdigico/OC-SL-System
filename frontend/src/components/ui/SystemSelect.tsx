"use client";

interface SystemSelectProps {
    label: string;
    value: string;
    onChange: (val: string) => void;
    options: { value: string; label: string }[];
}

export default function SystemSelect({ label, value, onChange, options }: SystemSelectProps) {
    return (
        <div className="space-y-2">
            <label className="block text-xs text-system-neon/50 uppercase tracking-[0.15em] font-caros">
                {label}
            </label>
            <div className="grid grid-cols-2 gap-2">
                {options.map((opt) => (
                    <button
                        key={opt.value}
                        type="button"
                        onClick={() => onChange(opt.value)}
                        className={`py-2.5 px-3 text-xs font-caros rounded-sm border transition-all duration-200 text-left
              ${value === opt.value
                                ? "border-system-neon/80 bg-system-neon/15 text-system-neon shadow-[0_0_12px_rgba(17,210,239,0.2)]"
                                : "border-system-blue/25 bg-system-black/30 text-system-neon/50 hover:border-system-blue/50 hover:bg-system-black/50"
                            }`}
                    >
                        {opt.label}
                    </button>
                ))}
            </div>
        </div>
    );
}
