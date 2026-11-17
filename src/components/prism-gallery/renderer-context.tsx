"use client";

import { useEffect, useSyncExternalStore, type ReactNode } from "react";
import { ScrollRenderer } from "wtc-gl";

import styles from "./prism-gallery.module.css";

export interface PrismRendererSnapshot {
  renderer: ScrollRenderer | null;
  contextLost: boolean;
}

let snapshot: PrismRendererSnapshot = { renderer: null, contextLost: false };
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function update(patch: Partial<PrismRendererSnapshot>) {
  snapshot = { ...snapshot, ...patch };
  emit();
}

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const getSnapshot = () => snapshot;
const SERVER_SNAPSHOT: PrismRendererSnapshot = {
  renderer: null,
  contextLost: false,
};
const getServerSnapshot = () => SERVER_SNAPSHOT;

export function usePrismRenderer(): PrismRendererSnapshot {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function PrismGalleryProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const canvas = document.createElement("canvas");
    canvas.className = styles.canvas ?? "";
    canvas.setAttribute("aria-hidden", "true");
    document.body.appendChild(canvas);

    let instance: ScrollRenderer;
    try {
      instance = new ScrollRenderer({
        layout: "absolute",
        rendererProps: { canvas, antialias: true },
      });
    } catch (error) {
      console.warn("PrismGallery: WebGL2 unavailable, showing plain images", error);
      canvas.remove();
      return;
    }

    instance.renderer.onContextLost = () => update({ contextLost: true });
    instance.renderer.onContextRestored = () => update({ contextLost: false });
    instance.playing = true;
    update({ renderer: instance });

    return () => {
      instance.destroy();
      canvas.remove();
      update({ renderer: null, contextLost: false });
    };
  }, []);

  return children;
}
