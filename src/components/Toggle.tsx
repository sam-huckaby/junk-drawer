"use client";

import React from "react";

export type ToggleProps = {
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  id?: string;
  name?: string;
  value?: string;
  label?: React.ReactNode;
  labelPosition?: "left" | "right";
  size?: "sm" | "md" | "lg";
  className?: string;
};

export function Toggle({
  checked,
  defaultChecked = false,
  onChange,
  disabled = false,
  id,
  name,
  value,
  label,
  labelPosition = "right",
  size = "md",
  className = "",
}: ToggleProps) {
  const isControlled = typeof checked === "boolean";
  const [uncontrolledChecked, setUncontrolledChecked] = React.useState(
    defaultChecked
  );
  const currentChecked = isControlled ? (checked as boolean) : uncontrolledChecked;

  const autoId = React.useId();
  const controlId = id ?? `toggle-${autoId}`;
  const labelId = `${controlId}-label`;

  const sizes = {
    sm: { track: "h-5 w-9", thumb: "h-4 w-4", on: "translate-x-4", off: "translate-x-1" },
    md: { track: "h-6 w-11", thumb: "h-5 w-5", on: "translate-x-5", off: "translate-x-1" },
    lg: { track: "h-7 w-14", thumb: "h-6 w-6", on: "translate-x-7", off: "translate-x-1" },
  } as const;

  const sizeCfg = sizes[size] ?? sizes.md;

  function toggle() {
    if (disabled) return;
    const next = !currentChecked;
    if (!isControlled) {
      setUncontrolledChecked(next);
    }
    onChange?.(next);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      toggle();
    }
  }

  const baseTrack = [
    "relative inline-flex shrink-0 cursor-pointer items-center rounded-full",
    "transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
    sizeCfg.track,
    disabled ? "opacity-50 cursor-not-allowed" : "",
    currentChecked ? "bg-blue-600" : "bg-gray-300",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const thumb = [
    "pointer-events-none inline-block rounded-full bg-white shadow",
    "transition-transform",
    sizeCfg.thumb,
    currentChecked ? sizeCfg.on : sizeCfg.off,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="inline-flex items-center gap-3">
      {label && labelPosition === "left" ? (
        <span id={labelId} className={disabled ? "opacity-70" : undefined}>
          {label}
        </span>
      ) : null}

      {/* Accessible switch control */}
      <button
        id={controlId}
        type="button"
        role="switch"
        aria-checked={currentChecked}
        aria-labelledby={label ? labelId : undefined}
        aria-disabled={disabled || undefined}
        onClick={toggle}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className={baseTrack}
        data-state={currentChecked ? "checked" : "unchecked"}
      >
        <span className={thumb} />
      </button>

      {/* Hidden input for form compatibility */}
      {name ? (
        <input
          type="checkbox"
          name={name}
          value={value}
          checked={currentChecked}
          readOnly
          tabIndex={-1}
          aria-hidden="true"
          className="hidden"
        />
      ) : null}

      {label && labelPosition === "right" ? (
        <span id={labelId} className={disabled ? "opacity-70" : undefined}>
          {label}
        </span>
      ) : null}
    </div>
  );
}
