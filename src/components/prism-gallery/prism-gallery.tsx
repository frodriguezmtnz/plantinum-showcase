"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type CSSProperties } from "react";

import { usePrismRenderer } from "./renderer-context";
import { PrismWall, type PrismParams } from "./prism-wall";
import { isStoredImage } from "@/lib/utils";
import styles from "./prism-gallery.module.css";

const AUTOPLAY_SECONDS = 6;
const DEFAULT_ASPECT = "16 / 10";

export interface PrismGalleryItem {
  id: string;
  image: string;
  thumb?: string;
  alt: string;
}

export interface PrismGalleryProps {
  items: PrismGalleryItem[];
  label: string;
  fov?: number;
  params?: Partial<PrismParams>;
  autoplay?: boolean;
  animateInitial?: boolean;
  clipToViewport?: boolean;
  aspectRatio?: string;
  className?: string;
}

const Chevron = ({ points }: { points: string }) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <polyline points={points} />
  </svg>
);

function motionDisabled(): boolean {
  if (typeof window === "undefined") return true;
  if (new URLSearchParams(window.location.search).get("motion") === "off") {
    return true;
  }
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function PrismGallery({
  items,
  label,
  fov,
  params,
  autoplay = true,
  animateInitial = false,
  clipToViewport = true,
  aspectRatio = DEFAULT_ASPECT,
  className,
}: PrismGalleryProps) {
  const { renderer, contextLost } = usePrismRenderer();

  const stageRef = useRef<HTMLDivElement>(null);
  const wallRef = useRef<PrismWall | null>(null);
  const indexRef = useRef(0);
  const paramsRef = useRef<Partial<PrismParams> | undefined>(params);
  const skipInitialTransitionRef = useRef(true);

  const [motionOff, setMotionOff] = useState<boolean | null>(null);
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [onScreen, setOnScreen] = useState(true);

  const paramsKey = JSON.stringify(params ?? {});

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setMotionOff(motionDisabled());
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!renderer || contextLost || motionOff !== false) return;
    const stage = stageRef.current;
    if (!stage) return;

    let wall: PrismWall;
    try {
      wall = new PrismWall(renderer.gl, stage, {
        images: items.map((item) => item.image),
        startIndex: indexRef.current,
        margin: renderer.overscanPx,
        fov,
        params: paramsRef.current,
        animateInitial,
        clipToViewport,
        initializedClass: styles.sceneReady,
      });
    } catch (error) {
      console.warn("PrismGallery: falling back to plain images", error);
      return;
    }

    renderer.addScene(wall.scene);
    wallRef.current = wall;

    return () => {
      renderer.removeScene(wall.scene);
      wall.destroy();
      if (styles.sceneReady) stage.classList.remove(styles.sceneReady);
      wallRef.current = null;
    };
  }, [renderer, contextLost, motionOff, items, fov, animateInitial, clipToViewport]);

  useEffect(() => {
    const wall = wallRef.current;
    paramsRef.current = params;
    if (!wall) return;
    wall.overrides = params ?? {};
    wall.applyParams();
  }, [params, paramsKey]);

  useEffect(() => {
    indexRef.current = index;
    if (wallRef.current && fov !== undefined) wallRef.current.fov = fov;
    if (skipInitialTransitionRef.current) {
      skipInitialTransitionRef.current = false;
      return;
    }
    wallRef.current?.transition(index, direction);
  }, [index, direction, fov]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const observer = new IntersectionObserver(
      ([entry]) => setOnScreen(entry?.isIntersecting ?? false),
      { rootMargin: `${Math.max(0, Math.round(renderer?.overscanPx ?? 0))}px` },
    );
    observer.observe(stage);
    return () => observer.disconnect();
  }, [renderer]);

  if (items.length === 0) return null;

  const goTo = (nextIndex: number, nextDirection: 1 | -1) => {
    const total = items.length;
    const normalized = ((nextIndex % total) + total) % total;
    indexRef.current = normalized;
    setIndex(normalized);
    setDirection(nextDirection);
    wallRef.current?.transition(normalized, nextDirection);
  };

  const next = () => goTo(index + 1, 1);
  const previous = () => goTo(index - 1, -1);
  const showAutoplay = autoplay && motionOff === false;

  return (
    <section
      className={className ? `${styles.root} ${className}` : styles.root}
      aria-label={label}
      aria-roledescription="carousel"
      style={
        {
          "--autoplay": `${AUTOPLAY_SECONDS}s`,
          "--prismGallery-aspect": aspectRatio,
        } as CSSProperties
      }
      data-paused={!onScreen || undefined}
    >
      <div className={styles.stage} ref={stageRef}>
        <div className={styles.slides}>
          {items.map((item, i) => (
            <div
              key={item.id}
              className={
                i === index ? `${styles.slide} ${styles.slideActive}` : styles.slide
              }
              aria-hidden={i !== index}
            >
              <Image
                src={item.image}
                alt={item.alt}
                fill
                sizes="100vw"
                unoptimized={isStoredImage(item.image)}
                loading={i === 0 ? "eager" : "lazy"}
              />
            </div>
          ))}
        </div>

        <button
          type="button"
          className={`${styles.nav} ${styles.navPrev}`}
          onClick={previous}
        >
          <Chevron points="15 18 9 12 15 6" />
          <span className={styles.srOnly}>Previous image</span>
        </button>

        <button
          type="button"
          className={`${styles.nav} ${styles.navNext}`}
          onClick={next}
        >
          <Chevron points="9 18 15 12 9 6" />
          <span className={styles.srOnly}>Next image</span>
        </button>
      </div>

      <ul className={styles.thumbs}>
        {items.map((item, i) => (
          <li key={item.id} className={styles.thumb}>
            <button
              type="button"
              className={styles.thumbButton}
              aria-current={i === index}
              onClick={() => goTo(i, i >= index ? 1 : -1)}
            >
              <Image
                src={item.thumb ?? item.image}
                alt=""
                width={80}
                height={50}
                unoptimized={isStoredImage(item.thumb ?? item.image)}
              />
              {showAutoplay && i === index && (
                <span
                  className={styles.autoplay}
                  aria-hidden="true"
                  onAnimationEnd={next}
                />
              )}
              <span className={styles.srOnly}>Show {item.alt}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
