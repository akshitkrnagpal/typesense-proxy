import type { ElementType, ComponentPropsWithRef } from "react";
import type { Override } from "./types";

/**
 * Resolve the component and props for a sub-element, applying any overrides.
 *
 * @example
 * const root = getOverride("div", overrides?.Root);
 * <root.Component {...root.resolveProps({ className: "default" })} />
 */
export function getOverride<D extends ElementType>(
  defaultComponent: D,
  override?: Override<D>,
) {
  const Component = (override?.component ?? defaultComponent) as ElementType;

  function resolveProps(
    defaultProps: ComponentPropsWithRef<D>,
  ): ComponentPropsWithRef<D> {
    if (!override?.props) return defaultProps;
    const extra =
      typeof override.props === "function"
        ? override.props(defaultProps)
        : override.props;
    return { ...defaultProps, ...extra } as ComponentPropsWithRef<D>;
  }

  return { Component, resolveProps } as const;
}
