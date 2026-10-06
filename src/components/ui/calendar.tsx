"use client"

import * as React from "react"
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from "lucide-react"
import { DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

const CURRENT_YEAR = new Date().getFullYear()

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  weekStartsOn = 1,
  captionLayout = "dropdown",
  fromYear = 2006, // PS3 launch — no platinum can predate it
  toYear = CURRENT_YEAR,
  autoFocus = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      weekStartsOn={weekStartsOn}
      captionLayout={captionLayout}
      fromYear={fromYear}
      toYear={toYear}
      autoFocus={autoFocus}
      // A definite width keeps the shared popover from stretching on phones.
      className={cn("w-[19.5rem] max-w-[calc(100vw-2rem)] p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-3",
        month_caption: "flex min-h-10 items-center justify-center px-1",
        caption_label: "text-sm font-medium",
        dropdowns: "flex items-center justify-center gap-1",
        dropdown_root: "relative",
        dropdown:
          "h-9 max-sm:h-11 cursor-pointer rounded-md bg-transparent px-1 text-sm font-medium outline-hidden hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring",
        months_dropdown: "",
        years_dropdown: "",
        nav: "flex items-center",
        button_previous: cn(
          buttonVariants({ variant: "outline" }),
          "absolute left-1 h-9 w-9 bg-transparent p-0 opacity-60 hover:opacity-100 max-sm:h-11 max-sm:w-11"
        ),
        button_next: cn(
          buttonVariants({ variant: "outline" }),
          "absolute right-1 h-9 w-9 bg-transparent p-0 opacity-60 hover:opacity-100 max-sm:h-11 max-sm:w-11"
        ),
        chevron: "h-4 w-4",
        // React Day Picker v9 renders a real <table>; keep it a table (no flex
        // rows) and let fixed layout split the width evenly on any screen.
        month_grid: "w-full border-collapse table-fixed",
        weekdays: "",
        weekday:
          "h-9 text-[0.8rem] font-normal text-muted-foreground align-middle",
        week: "",
        day: "p-0 text-center align-middle text-sm",
        // The pill is painted on the button (not the cell) so its own text
        // color always wins over the ghost variant's `text-secondary-foreground`
        // — otherwise the number vanished on the selected cell (white on white).
        day_button: cn(
          buttonVariants({ variant: "ghost" }),
          "aspect-square w-full p-0 font-normal",
          "data-[selected=true]:bg-primary data-[selected=true]:text-primary-foreground",
          "data-[selected=true]:hover:bg-primary data-[selected=true]:hover:text-primary-foreground"
        ),
        selected: "rounded-full",
        today: "rounded-full bg-accent text-accent-foreground",
        outside: "text-muted-foreground opacity-50",
        disabled: "text-muted-foreground opacity-50",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        // v9 puts the selection/today flags on the <td>; copy them onto the
        // button so the Tailwind `data-*` variants above can do their job.
        DayButton: ({ day, modifiers, className, ...props }) => (
          <button
            type="button"
            data-day={day.isoDate}
            data-selected={modifiers.selected || undefined}
            data-today={modifiers.today || undefined}
            data-outside={modifiers.outside || undefined}
            className={className}
            {...props}
          />
        ),
        Chevron: ({ orientation, className, ...props }) => {
          const Icon =
            orientation === "up"
              ? ChevronUp
              : orientation === "down"
                ? ChevronDown
                : orientation === "left"
                  ? ChevronLeft
                  : ChevronRight;
          return <Icon className={cn("h-4 w-4", className)} {...props} />;
        },
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
