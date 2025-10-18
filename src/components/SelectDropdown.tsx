"use client";

import React from "react";

export type SelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

type SelectDropdownProps = {
  label?: string;
  labelClassName?: string;
  helperText?: string;
  error?: string;
  options?: SelectOption[];
  placeholder?: string;
  fullWidth?: boolean;
  size?: "sm" | "md" | "lg";
  containerClassName?: string;
  className?: string;
  onValueChange?: (value: string) => void;
  children?: React.ReactNode;
} & Omit<
  React.SelectHTMLAttributes<HTMLSelectElement>,
  "size" | "children" | "onChange"
> & {
  onChange?: React.ChangeEventHandler<HTMLSelectElement>;
};

export const SelectDropdown = React.forwardRef<
  HTMLSelectElement,
  SelectDropdownProps
>(
  (
    {
      label,
      labelClassName = "",
      helperText,
      error,
      options,
      placeholder,
      fullWidth = false,
      size = "md",
      containerClassName = "",
      className = "",
      onValueChange,
      id,
      name,
      disabled,
      required,
      children,
      ...rest
    },
    ref
  ) => {
    const selectId = id;

    const describedByIds: string[] = [];
    if (error && selectId) describedByIds.push(`${selectId}-error`);
    if (helperText && selectId) describedByIds.push(`${selectId}-helper`);

    const sizeClasses =
      size === "sm"
        ? "px-3 py-1.5 text-sm"
        : size === "lg"
        ? "px-3.5 py-2.5 text-base"
        : "px-3 py-2 text-sm"; // md

    const baseClasses = [
      "rounded-md border shadow-sm",
      "focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600",
      "disabled:opacity-50 disabled:cursor-not-allowed",
      fullWidth ? "w-full" : "",
      error ? "border-red-500 focus:ring-red-600 focus:border-red-600" : "border-gray-300",
      sizeClasses,
      className,
    ]
      .filter(Boolean)
      .join(" ");

    const handleChange: React.ChangeEventHandler<HTMLSelectElement> = (e) => {
      if (onValueChange) onValueChange(e.target.value);
      if (rest.onChange) (rest.onChange as React.ChangeEventHandler<HTMLSelectElement>)(e);
    };

    return (
      <div
        className={["flex flex-col gap-1", fullWidth ? "w-full" : "", containerClassName]
          .join(" ")
          .trim()}
      >
        {label ? (
          <label htmlFor={selectId} className={["text-sm font-medium", labelClassName].join(" ")}> 
            {label}
            {required ? (
              <span aria-hidden="true" className="text-red-600"> *</span>
            ) : null}
          </label>
        ) : null}

        <select
          id={selectId}
          name={name}
          ref={ref}
          disabled={disabled}
          required={required}
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={describedByIds.length ? describedByIds.join(" ") : undefined}
          className={baseClasses}
          onChange={handleChange}
          {...rest}
        >
          {placeholder ? (
            <option
              value=""
              disabled={required}
              hidden={Boolean(rest.value !== undefined || rest.defaultValue !== undefined)}
            >
              {placeholder}
            </option>
          ) : null}

          {children
            ? children
            : options?.map((opt) => (
                <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                  {opt.label}
                </option>
              ))}
        </select>

        {error ? (
          <p id={selectId ? `${selectId}-error` : undefined} className="text-sm text-red-600">
            {error}
          </p>
        ) : helperText ? (
          <p id={selectId ? `${selectId}-helper` : undefined} className="text-sm text-gray-500">
            {helperText}
          </p>
        ) : null}
      </div>
    );
  }
);

SelectDropdown.displayName = "SelectDropdown";
