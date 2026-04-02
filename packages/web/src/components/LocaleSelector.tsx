import { useLocale } from "../context/LocaleContext.js";

interface LocaleOption {
  code: string;
  label: string;
}

interface LocaleSelectorProps {
  locales: LocaleOption[];
  className?: string;
}

export function LocaleSelector({ locales, className }: LocaleSelectorProps) {
  const { locale, setLocale } = useLocale();

  return (
    <select
      className={className}
      value={locale ?? ""}
      onChange={(e) => setLocale(e.target.value)}
      aria-label="Select locale"
    >
      {locales.map((loc) => (
        <option key={loc.code} value={loc.code}>
          {loc.label}
        </option>
      ))}
    </select>
  );
}
