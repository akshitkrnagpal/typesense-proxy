import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from "react";

interface LocaleContextValue {
  locale: string | undefined;
  setLocale: (locale: string) => void;
}

export const LocaleContext = createContext<LocaleContextValue | null>(null);

export function useLocale(): LocaleContextValue {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error("useLocale must be used within a LocaleProvider or SearchProvider");
  }
  return context;
}

interface LocaleProviderProps {
  initialLocale?: string;
  children: ReactNode;
}

export function LocaleProvider({ initialLocale, children }: LocaleProviderProps) {
  const [locale, setLocaleState] = useState<string | undefined>(initialLocale);

  const setLocale = useCallback((newLocale: string) => {
    setLocaleState(newLocale);
  }, []);

  const value = useMemo(
    () => ({ locale, setLocale }),
    [locale, setLocale],
  );

  return (
    <LocaleContext.Provider value={value}>
      {children}
    </LocaleContext.Provider>
  );
}
