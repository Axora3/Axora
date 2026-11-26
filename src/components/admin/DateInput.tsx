"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type ComponentProps,
  type KeyboardEvent,
} from "react";
import { Popover } from "radix-ui";
import { Icon } from "@/components/ui/icon";
import {
  addDays,
  addMonths,
  allowedDate,
  calendarDate,
  monthGrid,
  ulaanbaatarToday,
} from "@/lib/admin/calendar";
import { isCalendarDate } from "@/lib/admin/dates";
import "./date-picker.css";

type Props = Omit<ComponentProps<"input">, "type" | "ref">;
const WEEKDAYS = ["Да", "Мя", "Лх", "Пү", "Ба", "Бя", "Ня"];

/** Branded calendar over a real date input: names, ISO values and form validity stay native. */
export function DateInput({
  className = "",
  onChange,
  onKeyDown,
  disabled,
  readOnly,
  min,
  max,
  required,
  ...props
}: Props) {
  const input = useRef<HTMLInputElement>(null);
  const grid = useRef<HTMLDivElement>(null);
  const focusDay = useRef(false);
  const titleId = useId();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [cursor, setCursor] = useState("2000-01-01");
  const [month, setMonth] = useState("2000-01-01");
  const [today, setToday] = useState("");
  const [range, setRange] = useState({ from: "", to: "" });

  const clamp = (value: string) =>
    min && value < String(min)
      ? String(min)
      : max && value > String(max)
        ? String(max)
        : value;
  const days = monthGrid(month);
  const rangeFrom = props.name === "from" ? draft : range.from;
  const rangeTo = props.name === "to" ? draft : range.to;
  const showRange =
    isCalendarDate(rangeFrom) &&
    isCalendarDate(rangeTo) &&
    rangeFrom <= rangeTo;
  const monthDate = calendarDate(month);
  const monthTitle = `${monthDate.getUTCFullYear()} оны ${monthDate.getUTCMonth() + 1}-р сар`;

  function changeOpen(next: boolean) {
    if (next && !disabled && !readOnly) {
      const date = input.current?.value ?? "";
      const now = ulaanbaatarToday();
      const initial = clamp(isCalendarDate(date) ? date : now);
      setToday(now);
      setDraft(date);
      setCursor(initial);
      setMonth(initial);
      const form = input.current?.form;
      setRange({
        from:
          form?.querySelector<HTMLInputElement>(
            'input[type="date"][name="from"]',
          )?.value ?? "",
        to:
          form?.querySelector<HTMLInputElement>('input[type="date"][name="to"]')
            ?.value ?? "",
      });
    }
    setOpen(next && !disabled && !readOnly);
  }

  function commit(value: string) {
    const node = input.current;
    if (
      !node ||
      disabled ||
      readOnly ||
      (value && !allowedDate(value, min, max)) ||
      (!value && required)
    )
      return;
    // Use the native setter so React's controlled-input tracker receives the same
    // change events as typing, including the existing form/unsaved-change handlers.
    Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value",
    )!.set!.call(node, value);
    node.dispatchEvent(new Event("input", { bubbles: true }));
    node.dispatchEvent(new Event("change", { bubbles: true }));
    setOpen(false);
  }

  function move(value: string) {
    const next = clamp(value);
    focusDay.current = true;
    setCursor(next);
    setMonth(next);
  }

  function dayKey(event: KeyboardEvent<HTMLButtonElement>, day: string) {
    let next: string | undefined;
    const weekday = (calendarDate(day).getUTCDay() + 6) % 7;
    if (event.key === "ArrowLeft") next = addDays(day, -1);
    if (event.key === "ArrowRight") next = addDays(day, 1);
    if (event.key === "ArrowUp") next = addDays(day, -7);
    if (event.key === "ArrowDown") next = addDays(day, 7);
    if (event.key === "Home") next = addDays(day, -weekday);
    if (event.key === "End") next = addDays(day, 6 - weekday);
    if (event.key === "PageUp")
      next = addMonths(day, event.shiftKey ? -12 : -1);
    if (event.key === "PageDown")
      next = addMonths(day, event.shiftKey ? 12 : 1);
    if (next) {
      event.preventDefault();
      move(next);
    }
  }

  useEffect(() => {
    if (focusDay.current) {
      grid.current
        ?.querySelector<HTMLButtonElement>(`[data-day="${cursor}"]`)
        ?.focus();
      focusDay.current = false;
    }
  }, [cursor, month]);

  useEffect(() => {
    if (!open) return;
    const form = input.current?.form;
    const reset = () => setOpen(false);
    form?.addEventListener("reset", reset);
    return () => form?.removeEventListener("reset", reset);
  }, [open]);

  const previous = addMonths(`${month.slice(0, 7)}-01`, -1);
  const next = addMonths(`${month.slice(0, 7)}-01`, 1);

  return (
    <Popover.Root open={open} onOpenChange={changeOpen}>
      <Popover.Anchor asChild>
        <span className="ax-date-field">
          <input
            {...props}
            ref={input}
            type="date"
            className={`ax-date-input ${className}`}
            min={min}
            max={max}
            required={required}
            disabled={disabled}
            readOnly={readOnly}
            onChange={onChange}
            onKeyDown={(event) => {
              onKeyDown?.(event);
              if (
                !event.defaultPrevented &&
                ((event.altKey && event.key === "ArrowDown") ||
                  event.key === "F4")
              ) {
                event.preventDefault();
                changeOpen(true);
              }
            }}
          />
          <Popover.Trigger asChild>
            <button
              type="button"
              className="ax-date-trigger"
              aria-label="Хуанли нээх"
              disabled={disabled || readOnly}
            >
              <span aria-hidden="true" className="ax-schedule-icon" />
            </button>
          </Popover.Trigger>
        </span>
      </Popover.Anchor>
      <Popover.Portal>
        <Popover.Content
          className="ax-date-calendar"
          align="start"
          sideOffset={8}
          collisionPadding={12}
          aria-labelledby={titleId}
          onEscapeKeyDown={(event) => {
            event.preventDefault();
            event.stopPropagation();
            setOpen(false);
          }}
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            requestAnimationFrame(() =>
              grid.current
                ?.querySelector<HTMLButtonElement>(`[data-day="${cursor}"]`)
                ?.focus(),
            );
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.preventDefault();
              event.stopPropagation();
              setOpen(false);
            }
          }}
        >
          <div className="ax-calendar-heading">
            <button
              type="button"
              aria-label="Өмнөх сар"
              disabled={!!min && previous.slice(0, 7) < String(min).slice(0, 7)}
              onClick={() => {
                setMonth(previous);
                setCursor(clamp(previous));
              }}
            >
              <Icon name="chevron-left" size={21} />
            </button>
            <h2 id={titleId} aria-live="polite">
              {monthTitle}
            </h2>
            <button
              type="button"
              aria-label="Дараагийн сар"
              disabled={!!max && next.slice(0, 7) > String(max).slice(0, 7)}
              onClick={() => {
                setMonth(next);
                setCursor(clamp(next));
              }}
            >
              <Icon name="chevron-right" size={21} />
            </button>
          </div>
          <div role="grid" aria-labelledby={titleId} ref={grid}>
            <div role="row" className="ax-calendar-weekdays">
              {WEEKDAYS.map((day) => (
                <span key={day} role="columnheader">
                  {day}
                </span>
              ))}
            </div>
            {Array.from({ length: 6 }, (_, week) => (
              <div role="row" key={week} className="ax-calendar-week">
                {days.slice(week * 7, week * 7 + 7).map((day) => (
                  <span
                    role="gridcell"
                    key={day}
                    aria-selected={draft === day}
                    className="ax-calendar-cell"
                    data-in-range={
                      (showRange && day >= rangeFrom && day <= rangeTo) ||
                      undefined
                    }
                    data-range-start={
                      (showRange && day === rangeFrom) || undefined
                    }
                    data-range-end={(showRange && day === rangeTo) || undefined}
                  >
                    <button
                      type="button"
                      data-day={day}
                      data-outside={
                        day.slice(0, 7) !== month.slice(0, 7) || undefined
                      }
                      data-selected={
                        draft === day ||
                        (showRange && (day === rangeFrom || day === rangeTo)) ||
                        undefined
                      }
                      aria-label={day}
                      aria-current={day === today ? "date" : undefined}
                      disabled={!allowedDate(day, min, max)}
                      tabIndex={day === cursor ? 0 : -1}
                      onKeyDown={(event) => dayKey(event, day)}
                      onClick={() => {
                        setDraft(day);
                        setCursor(day);
                        setMonth(day);
                      }}
                    >
                      {Number(day.slice(-2))}
                    </button>
                  </span>
                ))}
              </div>
            ))}
          </div>
          <div className="ax-calendar-shortcuts">
            <button
              type="button"
              disabled={!allowedDate(today, min, max)}
              onClick={() => {
                setDraft(today);
                setCursor(today);
                setMonth(today);
              }}
            >
              Өнөөдөр
            </button>
            <button
              type="button"
              disabled={required}
              onClick={() => commit("")}
            >
              Цэвэрлэх
            </button>
          </div>
          <button
            type="button"
            className="ax-calendar-apply"
            disabled={!allowedDate(draft, min, max)}
            onClick={() => commit(draft)}
          >
            Хэрэглэх
          </button>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
