"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

export type SliderProps = {
  value?: number;
  defaultValue?: number;
  min?: number;
  max?: number;
  step?: number;
  onChange?: (value: number) => void;
  onChangeEnd?: (value: number) => void;
  disabled?: boolean;
  orientation?: "horizontal" | "vertical";
  showTooltip?: boolean;
  formatValue?: (value: number) => string;
  className?: string;
  trackClassName?: string;
  rangeClassName?: string;
  thumbClassName?: string;
  id?: string;
  name?: string;
  "aria-label"?: string;
  "aria-labelledby"?: string;
  marks?: Array<{ value: number; label?: string }>;
};

function clamp(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) return min;
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

function roundToStep(value: number, min: number, max: number, step: number): number {
  if (!Number.isFinite(step) || step <= 0) return clamp(value, min, max);
  const offset = value - min;
  const steps = Math.round(offset / step);
  const rounded = min + steps * step;
  // guard floating point drift
  const precision = Math.max(0, (step.toString().split(".")[1]?.length ?? 0));
  const fixed = Number(rounded.toFixed(precision));
  return clamp(fixed, min, max);
}

export function Slider({
  value,
  defaultValue,
  min = 0,
  max = 100,
  step = 1,
  onChange,
  onChangeEnd,
  disabled = false,
  orientation = "horizontal",
  showTooltip = false,
  formatValue,
  className = "",
  trackClassName = "",
  rangeClassName = "",
  thumbClassName = "",
  id,
  name,
  marks,
  ...aria
}: SliderProps) {
  const [uncontrolledValue, setUncontrolledValue] = useState<number>(() => {
    const initial = defaultValue ?? min;
    return clamp(roundToStep(initial, min, max, step), min, max);
  });

  const isControlled = value != null;
  const currentValue = isControlled
    ? clamp(roundToStep(value as number, min, max, step), min, max)
    : uncontrolledValue;

  const trackRef = useRef<HTMLDivElement | null>(null);
  const thumbRef = useRef<HTMLDivElement | null>(null);
  const pointerIdRef = useRef<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const percent = useMemo(() => {
    if (max === min) return 0;
    return ((currentValue - min) / (max - min)) * 100;
  }, [currentValue, min, max]);

  const ariaValueText = useMemo(() => {
    const formatter = formatValue ?? ((v: number) => String(v));
    return formatter(currentValue);
  }, [currentValue, formatValue]);

  const setValue = useCallback(
    (next: number, { emitEnd = false }: { emitEnd?: boolean } = {}) => {
      const nextClamped = clamp(roundToStep(next, min, max, step), min, max);
      if (!isControlled) {
        setUncontrolledValue(nextClamped);
      }
      if (onChange) onChange(nextClamped);
      if (emitEnd && onChangeEnd) onChangeEnd(nextClamped);
    },
    [isControlled, max, min, onChange, onChangeEnd, step]
  );

  const getValueFromPointerEvent = useCallback(
    (event: PointerEvent | React.PointerEvent) => {
      const track = trackRef.current;
      if (!track) return currentValue;
      const rect = track.getBoundingClientRect();

      if (orientation === "horizontal") {
        const x = ("clientX" in event ? event.clientX : (event as any).clientX) as number;
        const pos = clamp(x - rect.left, 0, rect.width);
        const pct = rect.width === 0 ? 0 : pos / rect.width;
        const raw = min + pct * (max - min);
        return roundToStep(raw, min, max, step);
      } else {
        const y = ("clientY" in event ? event.clientY : (event as any).clientY) as number;
        const pos = clamp(rect.bottom - y, 0, rect.height); // bottom is 0%
        const pct = rect.height === 0 ? 0 : pos / rect.height;
        const raw = min + pct * (max - min);
        return roundToStep(raw, min, max, step);
      }
    },
    [currentValue, max, min, orientation, step]
  );

  const handlePointerDown = useCallback(
    (event: React.PointerEvent) => {
      if (disabled) return;
      // Enable dragging from both track and thumb
      const target = event.target as HTMLElement;
      if (target) target.setPointerCapture?.(event.pointerId);
      pointerIdRef.current = event.pointerId;
      setIsDragging(true);

      // Move to pointer position on initial down if starting from track
      const next = getValueFromPointerEvent(event);
      setValue(next);

      event.preventDefault();
      event.stopPropagation();
    },
    [disabled, getValueFromPointerEvent, setValue]
  );

  const handlePointerMove = useCallback(
    (event: React.PointerEvent) => {
      if (!isDragging) return;
      if (disabled) return;
      if (pointerIdRef.current !== event.pointerId) return;
      const next = getValueFromPointerEvent(event);
      setValue(next);
      event.preventDefault();
    },
    [disabled, getValueFromPointerEvent, isDragging, setValue]
  );

  const endDrag = useCallback(
    (event?: React.PointerEvent | PointerEvent) => {
      if (!isDragging) return;
      setIsDragging(false);
      pointerIdRef.current = null;
      if (event && "pointerId" in event) {
        const target = event.target as HTMLElement | null;
        target?.releasePointerCapture?.((event as any).pointerId);
      }
      if (onChangeEnd) onChangeEnd(currentValue);
    },
    [currentValue, isDragging, onChangeEnd]
  );

  useEffect(() => {
    if (!isDragging) return;

    const handlePointerUpDoc = (evt: PointerEvent) => {
      endDrag(evt);
    };

    // Fallback to document events in case pointer capture is not supported
    document.addEventListener("pointerup", handlePointerUpDoc);
    return () => {
      document.removeEventListener("pointerup", handlePointerUpDoc);
    };
  }, [endDrag, isDragging]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (disabled) return;
      let next = currentValue;
      const tenSteps = Math.max(step * 10, (max - min) / 10);
      switch (event.key) {
        case "ArrowLeft":
        case "ArrowDown":
          next = currentValue - step;
          break;
        case "ArrowRight":
        case "ArrowUp":
          next = currentValue + step;
          break;
        case "PageDown":
          next = currentValue - tenSteps;
          break;
        case "PageUp":
          next = currentValue + tenSteps;
          break;
        case "Home":
          next = min;
          break;
        case "End":
          next = max;
          break;
        default:
          return;
      }
      setValue(next, { emitEnd: true });
      event.preventDefault();
    },
    [currentValue, disabled, max, min, setValue, step]
  );

  const commonClasses = useMemo(() => {
    const orientationClasses =
      orientation === "horizontal"
        ? "h-2 w-full"
        : "w-2 h-full";

    return [
      "relative select-none touch-none", // container
      orientation === "horizontal" ? "py-3" : "px-3",
      className,
      orientationClasses,
    ]
      .filter(Boolean)
      .join(" ");
  }, [className, orientation]);

  const trackClasses = useMemo(() => {
    return [
      "absolute left-0 top-1/2 -translate-y-1/2",
      orientation === "horizontal" ? "h-2 w-full" : "w-2 h-full left-1/2 -translate-x-1/2 top-0 translate-y-0",
      "rounded-full bg-neutral-200 dark:bg-neutral-700",
      disabled ? "opacity-50" : null,
      trackClassName,
    ]
      .filter(Boolean)
      .join(" ");
  }, [disabled, orientation, trackClassName]);

  const rangeStyles: React.CSSProperties = useMemo(() => {
    if (orientation === "horizontal") {
      return { width: `${percent}%` };
    }
    return { height: `${percent}%` };
  }, [orientation, percent]);

  const rangeClasses = useMemo(() => {
    return [
      "absolute left-0 top-0",
      orientation === "horizontal" ? "h-full" : "w-full bottom-0 top-auto",
      "rounded-full bg-blue-600",
      rangeClassName,
    ]
      .filter(Boolean)
      .join(" ");
  }, [orientation, rangeClassName]);

  const thumbStyles: React.CSSProperties = useMemo(() => {
    if (orientation === "horizontal") {
      return { left: `${percent}%` };
    }
    return { bottom: `${percent}%` };
  }, [orientation, percent]);

  const thumbClasses = useMemo(() => {
    return [
      "absolute z-10",
      orientation === "horizontal" ? "top-1/2 -translate-y-1/2 -translate-x-1/2" : "left-1/2 -translate-x-1/2 translate-y-1/2",
      "h-5 w-5 rounded-full border-2 border-white bg-blue-600 shadow",
      disabled ? "cursor-not-allowed" : "cursor-grab active:cursor-grabbing",
      "outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2",
      thumbClassName,
    ]
      .filter(Boolean)
      .join(" ");
  }, [disabled, orientation, thumbClassName]);

  const tooltip = (
    <div
      className={[
        "pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-black/80 px-1.5 py-0.5 text-xs text-white",
        isDragging || showTooltip ? "opacity-100" : "opacity-0",
        "transition-opacity",
      ].join(" ")}
      aria-hidden
    >
      {ariaValueText}
    </div>
  );

  const marksElements = useMemo(() => {
    if (!marks || marks.length === 0) return null;
    return (
      <div className="absolute inset-0">
        {marks.map((mark) => {
          const pct = clamp(((mark.value - min) / (max - min)) * 100, 0, 100);
          const style = orientation === "horizontal" ? { left: `${pct}%` } : { bottom: `${pct}%` };
          return (
            <div key={mark.value} className="absolute" style={style} aria-hidden>
              <div
                className={[
                  "bg-neutral-400 dark:bg-neutral-500",
                  orientation === "horizontal" ? "h-2 w-0.5 -translate-x-1/2" : "w-2 h-0.5 translate-y-1/2 -translate-x-1/2",
                  "rounded-sm",
                ].join(" ")}
              />
              {mark.label ? (
                <div
                  className={[
                    "text-xs text-neutral-600 dark:text-neutral-300",
                    orientation === "horizontal" ? "mt-2 -translate-x-1/2" : "ml-2 -translate-y-1/2",
                  ].join(" ")}
                >
                  {mark.label}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    );
  }, [marks, max, min, orientation]);

  return (
    <div
      id={id}
      ref={trackRef}
      className={commonClasses}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endDrag}
      onLostPointerCapture={() => endDrag()}
      role="none"
      style={{ position: "relative" }}
    >
      {/* Track */}
      <div className={trackClasses} aria-hidden>
        <div className={rangeClasses} style={rangeStyles} />
        {marksElements}
      </div>

      {/* Thumb (focusable slider handle) */}
      <div
        ref={thumbRef}
        role="slider"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled || undefined}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={currentValue}
        aria-valuetext={ariaValueText}
        aria-orientation={orientation}
        className={thumbClasses}
        style={thumbStyles}
        onKeyDown={handleKeyDown}
        onPointerDown={handlePointerDown}
      >
        {tooltip}
      </div>

      {/* Hidden input for forms */}
      {name ? <input type="hidden" name={name} value={currentValue} /> : null}
    </div>
  );
}

export default Slider;
