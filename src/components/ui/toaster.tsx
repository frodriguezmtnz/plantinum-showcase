"use client"

import { useEffect, useRef, useState } from "react"
import {
  TOAST_REMOVE_DELAY,
  pauseAllToasts,
  resumeAllToasts,
  useToast,
} from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { cn } from "@/lib/utils"

// Space between the cards of the deck. The newest toast sits at the bottom,
// older ones pile above, slightly narrower, so every edge stays apart.
const STACK_GAP = "0.5rem"
const STACK_SCALE_STEP = 0.03

export function Toaster() {
  const { toasts, dismiss } = useToast()
  const [expanded, setExpanded] = useState(false)
  const viewportRef = useRef<HTMLOListElement>(null)

  // Radix portals each Toast.Root into the Viewport, so React synthetic
  // enter/leave events on the Viewport never see them. Native listeners on the
  // DOM node do (the portals are real children), which keeps the timers paused
  // exactly while the pile is hovered or focused.
  useEffect(() => {
    const node = viewportRef.current
    if (!node) return

    const pause = () => {
      pauseAllToasts()
      setExpanded(true)
    }
    const resume = () => {
      resumeAllToasts()
      setExpanded(false)
    }
    const onFocusOut = (event: FocusEvent) => {
      const next = event.relatedTarget as Node | null
      if (!next || !node.contains(next)) resume()
    }

    node.addEventListener("mouseenter", pause)
    node.addEventListener("mouseleave", resume)
    node.addEventListener("focusin", pause)
    node.addEventListener("focusout", onFocusOut)
    return () => {
      node.removeEventListener("mouseenter", pause)
      node.removeEventListener("mouseleave", resume)
      node.removeEventListener("focusin", pause)
      node.removeEventListener("focusout", onFocusOut)
    }
  }, [])

  return (
    <ToastProvider>
      {toasts.map(function (
        { id, title, description, action, variant, open, ...props },
        index,
      ) {
        const behind = index > 0
        // Radix portals append in mount order, so the DOM runs oldest → newest
        // even though the state array is newest → oldest. The gap belongs to
        // every card except the oldest, which is the one at the top of the DOM.
        const isOldest = index === toasts.length - 1

        return (
          <Toast
            key={id}
            variant={variant}
            open={open}
            {...props}
            aria-hidden={behind || undefined}
            inert={behind || undefined}
            style={{
              marginTop: isOldest ? undefined : STACK_GAP,
              zIndex: 50 - index,
              // Older cards shrink toward their bottom edge and stay centered,
              // which widens the gap just enough to read as a deck of cards.
              transform:
                expanded || !behind
                  ? undefined
                  : `scale(${1 - index * STACK_SCALE_STEP})`,
              transformOrigin: "bottom center",
              animation: behind ? "none" : undefined,
            }}
            className={cn(
              "transition-[margin-top,transform] duration-200 ease-out",
              behind
                ? "pointer-events-none ring-1 ring-black/10 dark:ring-white/10"
                : "cursor-pointer",
            )}
            onClick={(event) => {
              if (behind) return;
              const target = event.target as HTMLElement;
              if (target.closest("button, a")) return;
              dismiss(id);
            }}
          >
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            {!behind && <ToastClose />}
            {!behind && open !== false && (
              <span
                aria-hidden
                className={cn(
                  "toast-progress absolute inset-x-0 bottom-0 h-0.5 w-full origin-left",
                  variant === "default"
                    ? "bg-foreground/25"
                    : variant === "warning"
                      ? "bg-amber-950/40"
                      : "bg-white/60",
                  expanded && "[animation-play-state:paused]",
                )}
                style={{ animationDuration: `${TOAST_REMOVE_DELAY}ms` }}
              />
            )}
          </Toast>
        )
      })}
      <ToastViewport ref={viewportRef} />
    </ToastProvider>
  )
}
