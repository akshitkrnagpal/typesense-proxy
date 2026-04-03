import { useSearchBox } from "react-instantsearch";
import { getOverride } from "../overrides/getOverride";
import type { Overrides } from "../overrides/types";
import { type FormEvent, useRef } from "react";

type SearchBoxElements = {
  Root: "div";
  Form: "form";
  Input: "input";
  SubmitButton: "button";
  ResetButton: "button";
};

interface SearchBoxProps {
  placeholder?: string;
  autoFocus?: boolean;
  overrides?: Overrides<SearchBoxElements>;
  queryHook?: (query: string, search: (value: string) => void) => void;
}

export function SearchBox({
  placeholder = "Search...",
  autoFocus = false,
  overrides,
  queryHook,
}: SearchBoxProps) {
  const { query, refine, clear } = useSearchBox({ queryHook });
  const inputRef = useRef<HTMLInputElement>(null);

  const root = getOverride("div", overrides?.Root);
  const form = getOverride("form", overrides?.Form);
  const input = getOverride("input", overrides?.Input);
  const submit = getOverride("button", overrides?.SubmitButton);
  const reset = getOverride("button", overrides?.ResetButton);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
  };

  const handleReset = () => {
    clear();
    inputRef.current?.focus();
  };

  return (
    <root.Component {...root.resolveProps({})}>
      <form.Component
        {...form.resolveProps({
          onSubmit: handleSubmit,
          role: "search",
          noValidate: true,
        })}
      >
        <input.Component
          {...input.resolveProps({
            ref: inputRef,
            type: "search",
            placeholder,
            autoFocus,
            value: query,
            onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
              refine(e.currentTarget.value),
            autoComplete: "off",
            autoCorrect: "off",
            spellCheck: false,
          })}
        />
        <submit.Component
          {...submit.resolveProps({ type: "submit", children: "Search" })}
        />
        <reset.Component
          {...reset.resolveProps({
            type: "reset",
            onClick: handleReset,
            hidden: !query,
            children: "Reset",
          })}
        />
      </form.Component>
    </root.Component>
  );
}

export type { SearchBoxProps, SearchBoxElements };
