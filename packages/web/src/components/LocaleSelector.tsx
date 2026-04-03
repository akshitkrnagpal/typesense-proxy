import { useLocale } from "../context/LocaleContext";
import { getOverride } from "../overrides/getOverride";
import type { Overrides } from "../overrides/types";

type LocaleSelectorElements = {
  Root: "div";
  Select: "select";
  Option: "option";
};

interface LocaleOption {
  code: string;
  label: string;
}

interface LocaleSelectorProps {
  locales: LocaleOption[];
  overrides?: Overrides<LocaleSelectorElements>;
}

export function LocaleSelector({ locales, overrides }: LocaleSelectorProps) {
  const { locale, setLocale } = useLocale();

  const root = getOverride("div", overrides?.Root);
  const select = getOverride("select", overrides?.Select);
  const option = getOverride("option", overrides?.Option);

  return (
    <root.Component {...root.resolveProps({})}>
      <select.Component
        {...select.resolveProps({
          value: locale ?? "",
          onChange: (e: React.ChangeEvent<HTMLSelectElement>) =>
            setLocale(e.target.value),
          "aria-label": "Select locale",
        })}
      >
        {locales.map((loc) => (
          <option.Component
            key={loc.code}
            {...option.resolveProps({
              value: loc.code,
              children: loc.label,
            })}
          />
        ))}
      </select.Component>
    </root.Component>
  );
}

export type { LocaleSelectorProps, LocaleSelectorElements, LocaleOption };
