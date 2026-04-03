import type { ComponentType, ComponentPropsWithRef, ElementType } from "react";

/**
 * Override for a single sub-element.
 * - component: replace the default element entirely
 * - props: merge additional props (static object or function of computed props)
 */
export type Override<DefaultComponent extends ElementType> = {
  component?: ComponentType<ComponentPropsWithRef<DefaultComponent>>;
  props?:
    | Partial<ComponentPropsWithRef<DefaultComponent>>
    | ((
        props: ComponentPropsWithRef<DefaultComponent>,
      ) => Partial<ComponentPropsWithRef<DefaultComponent>>);
};

/**
 * Build an overrides map from a record of default element types.
 *
 * @example
 * type SearchBoxOverrides = Overrides<{ Root: "div"; Input: "input" }>;
 * // { Root?: Override<"div">; Input?: Override<"input"> }
 */
export type Overrides<T extends Record<string, ElementType>> = {
  [K in keyof T]?: Override<T[K]>;
};
