"use client"

// Inspired by react-hot-toast library
import * as React from "react"

import type {
  ToastActionElement,
  ToastProps,
} from "@/components/ui/toast"

const TOAST_LIMIT = 3
export const TOAST_REMOVE_DELAY = 5000

type ToasterToast = ToastProps & {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: ToastActionElement
}

type ActionType = {
  ADD_TOAST: "ADD_TOAST"
  UPDATE_TOAST: "UPDATE_TOAST"
  DISMISS_TOAST: "DISMISS_TOAST"
  REMOVE_TOAST: "REMOVE_TOAST"
}

let count = 0

function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER
  return count.toString()
}

type Action =
  | {
      type: ActionType["ADD_TOAST"]
      toast: ToasterToast
    }
  | {
      type: ActionType["UPDATE_TOAST"]
      toast: Partial<ToasterToast>
    }
  | {
      type: ActionType["DISMISS_TOAST"]
      toastId?: ToasterToast["id"]
    }
  | {
      type: ActionType["REMOVE_TOAST"]
      toastId?: ToasterToast["id"]
    }

interface State {
  toasts: ToasterToast[]
}

interface TimerState {
  handle: ReturnType<typeof setTimeout> | null
  startedAt: number
  remaining: number
}

const toastTimers = new Map<string, TimerState>()

function scheduleRemoval(toastId: string, delay: number) {
  const existing = toastTimers.get(toastId)
  if (existing?.handle) clearTimeout(existing.handle)

  const state: TimerState = {
    handle: null,
    startedAt: Date.now(),
    remaining: delay,
  }
  state.handle = setTimeout(() => {
    toastTimers.delete(toastId)
    dispatch({
      type: "REMOVE_TOAST",
      toastId: toastId,
    })
  }, delay)
  toastTimers.set(toastId, state)
}

const addToRemoveQueue = (toastId: string) => {
  if (toastTimers.has(toastId)) {
    return
  }
  scheduleRemoval(toastId, TOAST_REMOVE_DELAY)
}

/**
 * The Toaster pauses every countdown while the stack is hovered or focused so
 * the progress bar and the actual removal stay in sync.
 */
export function pauseToast(toastId: string) {
  const timer = toastTimers.get(toastId)
  if (!timer?.handle) return
  clearTimeout(timer.handle)
  timer.handle = null
  timer.remaining = Math.max(0, timer.remaining - (Date.now() - timer.startedAt))
}

export function resumeToast(toastId: string) {
  const timer = toastTimers.get(toastId)
  if (!timer || timer.handle) return
  scheduleRemoval(toastId, timer.remaining)
}

export function pauseAllToasts() {
  for (const toastId of toastTimers.keys()) pauseToast(toastId)
}

export function resumeAllToasts() {
  for (const toastId of toastTimers.keys()) resumeToast(toastId)
}

export const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "ADD_TOAST":
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      }

    case "UPDATE_TOAST":
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      }

    case "DISMISS_TOAST": {
      const { toastId } = action

      // ! Side effects ! - This could be extracted into a dismissToast() action,
      // but I'll keep it here for simplicity
      if (toastId) {
        addToRemoveQueue(toastId)
      } else {
        state.toasts.forEach((toast) => {
          addToRemoveQueue(toast.id)
        })
      }

      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId || toastId === undefined
            ? {
                ...t,
                open: false,
              }
            : t
        ),
      }
    }
    case "REMOVE_TOAST":
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        }
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      }
  }
}

const listeners: Array<(state: State) => void> = []

let memoryState: State = { toasts: [] }

function dispatch(action: Action) {
  const previous = memoryState.toasts
  memoryState = reducer(memoryState, action)

  // Dropped toasts (limit overflow or removal) must not keep a timer alive.
  const nextIds = new Set(memoryState.toasts.map((toast) => toast.id))
  for (const toast of previous) {
    if (nextIds.has(toast.id)) continue
    const timer = toastTimers.get(toast.id)
    if (timer?.handle) clearTimeout(timer.handle)
    toastTimers.delete(toast.id)
  }

  listeners.forEach((listener) => {
    listener(memoryState)
  })
}

type Toast = Omit<ToasterToast, "id">

function toast({ ...props }: Toast) {
  const id = genId()

  const update = (props: ToasterToast) =>
    dispatch({
      type: "UPDATE_TOAST",
      toast: { ...props, id },
    })
  const dismiss = () => dispatch({ type: "DISMISS_TOAST", toastId: id })

  dispatch({
    type: "ADD_TOAST",
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (open) => {
        if (!open) dismiss()
      },
    },
  })

  return {
    id: id,
    dismiss,
    update,
  }
}

function useToast() {
  const [state, setState] = React.useState<State>(memoryState)

  React.useEffect(() => {
    listeners.push(setState)
    return () => {
      const index = listeners.indexOf(setState)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }, [state])

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => dispatch({ type: "DISMISS_TOAST", toastId }),
  }
}

export { useToast, toast }
