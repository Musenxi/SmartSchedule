"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown } from "lucide-react"
import { DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
    className,
    classNames,
    showOutsideDays = true,
    ...props
}: CalendarProps) {
    return (
        <DayPicker
            showOutsideDays={showOutsideDays}
            className={cn("p-0", className)}
            classNames={{
                months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                month: "space-y-2",
                caption: "flex justify-center pt-1 relative items-center mb-2",
                caption_label: "text-sm font-medium",
                nav: "space-x-1 flex items-center",
                nav_button: "p-1 hover:bg-muted rounded-md transition-colors h-auto w-auto bg-transparent",
                nav_button_previous: "absolute left-1",
                nav_button_next: "absolute right-1",
                table: "w-full border-collapse",
                head_row: "!grid !grid-cols-7 gap-1 mb-1",
                head_cell: "text-center text-xs text-muted-foreground py-1",
                row: "!grid !grid-cols-7 gap-1 mt-0",
                cell: "text-center text-xs p-0 relative",
                day: "w-full aspect-square rounded-lg text-xs font-medium transition-all flex items-center justify-center hover:bg-muted aria-selected:opacity-100",
                day_range_end: "day-range-end",
                day_selected:
                    "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                day_today: "bg-primary text-primary-foreground hover:bg-primary/90",
                day_outside:
                    "day-outside text-muted-foreground/40",
                day_disabled: "text-muted-foreground opacity-50",
                day_range_middle:
                    "aria-selected:bg-accent aria-selected:text-accent-foreground",
                day_hidden: "invisible",
                ...classNames,
            }}
            components={{
                Chevron: ({ orientation, ...props }) => {
                    if (orientation === "left") {
                        return <ChevronLeft className="h-4 w-4" {...props} />
                    }
                    if (orientation === "right") {
                        return <ChevronRight className="h-4 w-4" {...props} />
                    }
                    if (orientation === "up") {
                        return <ChevronUp className="h-4 w-4" {...props} />
                    }
                    if (orientation === "down") {
                        return <ChevronDown className="h-4 w-4" {...props} />
                    }
                    return <ChevronLeft className="h-4 w-4" {...props} />
                },
            }}
            {...props}
        />
    )
}
Calendar.displayName = "Calendar"

export { Calendar }
