'use client';

import { useState } from 'react';

import { PrismGallerySection } from '@/components/prism-gallery/loader';
import type { PrismGalleryItem } from '@/components/prism-gallery/prism-gallery';
import { PRISM_PRESETS } from '@/components/prism-gallery/presets';
import { PARAMS, type PrismParams } from '@/components/prism-gallery/prism-wall';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';

type PresetKey = keyof typeof PRISM_PRESETS;
type ActivePreset = PresetKey | 'custom';

type NumericPrismKey = Exclude<keyof PrismParams, 'bricks'>;

interface PreviewConfig {
  params: PrismParams;
  fov: number;
  aspectRatio: string;
  widthClass: string;
  animateInitial: boolean;
  clipToViewport: boolean;
  autoplay: boolean;
}

const PARAM_CONTROLS: Array<{
  key: NumericPrismKey;
  label: string;
  min: number;
  max: number;
  step: number;
}> = [
  { key: 'cellWidth', label: 'Cell width', min: 10, max: 80, step: 1 },
  { key: 'cellHeight', label: 'Cell height', min: 4, max: 30, step: 1 },
  { key: 'gap', label: 'Gap', min: 0, max: 1, step: 0.01 },
  { key: 'depth', label: 'Depth', min: 0, max: 3, step: 0.05 },
  { key: 'duration', label: 'Duration', min: 0.2, max: 3, step: 0.05 },
  { key: 'stagger', label: 'Stagger', min: 0, max: 2, step: 0.05 },
  { key: 'flowScale', label: 'Flow scale', min: 0.1, max: 2, step: 0.01 },
  { key: 'flowSpeed', label: 'Flow speed', min: 0, max: 3, step: 0.01 },
  { key: 'evolve', label: 'Evolve', min: 0, max: 1.5, step: 0.01 },
  { key: 'steer', label: 'Steer', min: 0, max: 10, step: 0.1 },
  { key: 'explode', label: 'Explode', min: 0, max: 4, step: 0.05 },
  { key: 'drift', label: 'Drift', min: -2, max: 1, step: 0.01 },
  { key: 'tether', label: 'Tether', min: 0, max: 5, step: 0.05 },
  { key: 'stretch', label: 'Stretch', min: 0, max: 1.5, step: 0.01 },
  { key: 'shrink', label: 'Shrink', min: 0, max: 1, step: 0.01 },
  { key: 'gloss', label: 'Gloss', min: 0, max: 2, step: 0.05 },
];

const ASPECT_RATIOS = ['16 / 9', '16 / 10', '21 / 9', '4 / 3'];
const WIDTH_CLASSES = [
  { value: 'max-w-3xl', label: '3xl' },
  { value: 'max-w-4xl', label: '4xl' },
  { value: 'max-w-5xl', label: '5xl' },
  { value: 'max-w-6xl', label: '6xl' },
  { value: 'w-full', label: 'Full' },
];

function configFromPreset(preset: PresetKey): PreviewConfig {
  const current = PRISM_PRESETS[preset];
  return {
    params: { ...PARAMS, ...current.params },
    fov: current.fov,
    aspectRatio: current.aspectRatio,
    widthClass: current.className,
    animateInitial: current.animateInitial,
    clipToViewport: current.clipToViewport,
    autoplay: current.autoplay,
  };
}

function NumberControl({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block space-y-1">
      <span className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
        <span>{label}</span>
        <span className="tabular text-foreground">{value.toFixed(2)}</span>
      </span>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={(values) => onChange(values[0] ?? value)}
      />
    </label>
  );
}

function SwitchControl({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-3 text-xs font-semibold text-muted-foreground">
      <span>{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </label>
  );
}

export function PrismGalleryPreview({ items }: { items: PrismGalleryItem[] }) {
  const [activePreset, setActivePreset] = useState<ActivePreset>('home');
  const [config, setConfig] = useState<PreviewConfig>(() => configFromPreset('home'));

  const applyPreset = (preset: PresetKey) => {
    setActivePreset(preset);
    setConfig(configFromPreset(preset));
  };

  const updateParam = (key: NumericPrismKey, value: number) => {
    setActivePreset('custom');
    setConfig((previous) => ({
      ...previous,
      params: { ...previous.params, [key]: value },
    }));
  };

  const updateConfig = <K extends keyof PreviewConfig>(key: K, value: PreviewConfig[K]) => {
    setActivePreset('custom');
    setConfig((previous) => ({ ...previous, [key]: value }));
  };

  const json = JSON.stringify(
    {
      params: config.params,
      fov: config.fov,
      aspectRatio: config.aspectRatio,
      className: config.widthClass,
      animateInitial: config.animateInitial,
      clipToViewport: config.clipToViewport,
      autoplay: config.autoplay,
    },
    null,
    2,
  );

  const copyJson = async () => {
    await navigator.clipboard.writeText(json);
  };

  return (
    <div className="pb-24">
      <aside className="fixed right-4 top-20 z-50 max-h-[calc(100vh-6rem)] w-80 overflow-y-auto rounded-xl border border-border bg-card/95 p-4 text-sm shadow-lift backdrop-blur">
        <div className="space-y-4">
          <div className="space-y-2">
            <p className="field-mark">Preset</p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={activePreset === 'home' ? 'default' : 'outline'}
                onClick={() => applyPreset('home')}
              >
                Home
              </Button>
              <Button
                size="sm"
                variant={activePreset === 'explore' ? 'default' : 'outline'}
                onClick={() => applyPreset('explore')}
              >
                Explore
              </Button>
              {activePreset === 'custom' && (
                <Button size="sm" variant="secondary" disabled>
                  Custom
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <p className="field-mark">Layout</p>
            <div className="space-y-2">
              <label className="block space-y-1">
                <span className="text-xs font-semibold text-muted-foreground">Aspect ratio</span>
                <Select
                  value={config.aspectRatio}
                  onValueChange={(value) => updateConfig('aspectRatio', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ASPECT_RATIOS.map((ratio) => (
                      <SelectItem key={ratio} value={ratio}>
                        {ratio}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </label>

              <label className="block space-y-1">
                <span className="text-xs font-semibold text-muted-foreground">Width</span>
                <Select
                  value={config.widthClass}
                  onValueChange={(value) => updateConfig('widthClass', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {WIDTH_CLASSES.map((width) => (
                      <SelectItem key={width.value} value={width.value}>
                        {width.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </label>

              <NumberControl
                label="FOV"
                value={config.fov}
                min={10}
                max={60}
                step={1}
                onChange={(value) => updateConfig('fov', value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <p className="field-mark">Behavior</p>
            <div className="space-y-2">
              <SwitchControl
                label="Bricks"
                checked={config.params.bricks}
                onChange={(checked) => {
                  setActivePreset('custom');
                  setConfig((previous) => ({
                    ...previous,
                    params: { ...previous.params, bricks: checked },
                  }));
                }}
              />
              <SwitchControl
                label="Autoplay"
                checked={config.autoplay}
                onChange={(checked) => updateConfig('autoplay', checked)}
              />
              <SwitchControl
                label="Animate initial"
                checked={config.animateInitial}
                onChange={(checked) => updateConfig('animateInitial', checked)}
              />
              <SwitchControl
                label="Clip to viewport"
                checked={config.clipToViewport}
                onChange={(checked) => updateConfig('clipToViewport', checked)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <p className="field-mark">Parameters</p>
            <div className="space-y-3">
              {PARAM_CONTROLS.map((control) => (
                <NumberControl
                  key={control.key}
                  label={control.label}
                  value={config.params[control.key]}
                  min={control.min}
                  max={control.max}
                  step={control.step}
                  onChange={(value) => updateParam(control.key, value)}
                />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="field-mark">JSON</p>
              <Button size="sm" variant="outline" onClick={copyJson}>
                Copy
              </Button>
            </div>
            <pre className="max-h-48 overflow-auto rounded-lg border border-border bg-background/70 p-2 text-xs leading-relaxed">
              {json}
            </pre>
          </div>
        </div>
      </aside>

      <section className="container py-8">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
          <div>
            <span className="field-mark">Preview</span>
            <h1 className="font-headline mt-1 text-2xl font-bold tracking-tight md:text-3xl">
              Prism Gallery Playground
            </h1>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              const preset = activePreset === 'custom' ? 'home' : activePreset;
              applyPreset(preset);
            }}
          >
            Reset
          </Button>
        </div>

        <PrismGallerySection
          key={activePreset === 'custom' ? 'custom' : activePreset}
          items={items}
          label="Prism gallery preview"
          params={config.params}
          aspectRatio={config.aspectRatio}
          className={config.widthClass}
          animateInitial={config.animateInitial}
          clipToViewport={config.clipToViewport}
          autoplay={config.autoplay}
          fov={config.fov}
        />
      </section>
    </div>
  );
}
