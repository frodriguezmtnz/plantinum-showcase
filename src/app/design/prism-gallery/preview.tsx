'use client';

import { useState } from 'react';
import { Info } from 'lucide-react';

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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

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
  description: string;
}> = [
  {
    key: 'cellWidth',
    label: 'Cell width',
    min: 10,
    max: 80,
    step: 1,
    description: 'Ancho en píxeles de una celda. Más alto = menos prismas, más anchos.',
  },
  {
    key: 'cellHeight',
    label: 'Cell height',
    min: 4,
    max: 30,
    step: 1,
    description: 'Alto en píxeles de una celda. Más alto = menos filas, más altas.',
  },
  {
    key: 'gap',
    label: 'Gap',
    min: 0,
    max: 1,
    step: 0.01,
    description: 'Separación entre prismas en reposo, relativa a la celda. 0 = sin huecos.',
  },
  {
    key: 'depth',
    label: 'Depth',
    min: 0,
    max: 3,
    step: 0.05,
    description:
      'Grosor de cada prisma respecto al lado menor de la celda. Más alto = bloques más gruesos.',
  },
  {
    key: 'duration',
    label: 'Duration',
    min: 0.2,
    max: 3,
    step: 0.05,
    description:
      'Segundos que tarda cada prisma en volar a la siguiente placa, tras su retardo.',
  },
  {
    key: 'stagger',
    label: 'Stagger',
    min: 0,
    max: 2,
    step: 0.05,
    description:
      'Reparte el retardo por la rejilla para que la transformación avance como una ola.',
  },
  {
    key: 'flowScale',
    label: 'Flow scale',
    min: 0.1,
    max: 2,
    step: 0.01,
    description:
      'Tamaño del campo de ruido. Bajo = remolinos amplios; alto = remolinos pequeños y nerviosos.',
  },
  {
    key: 'flowSpeed',
    label: 'Flow speed',
    min: 0,
    max: 3,
    step: 0.01,
    description: 'Multiplicador de velocidad del flujo que arrastra los prismas.',
  },
  {
    key: 'evolve',
    label: 'Evolve',
    min: 0,
    max: 1.5,
    step: 0.01,
    description:
      'Velocidad a la que cambia el campo de ruido con el tiempo. 0 congela el patrón.',
  },
  {
    key: 'steer',
    label: 'Steer',
    min: 0,
    max: 10,
    step: 0.1,
    description:
      'Con qué rapidez gira un prisma hacia el flujo. Más alto = reacción más inmediata; bajo = más inercia.',
  },
  {
    key: 'explode',
    label: 'Explode',
    min: 0,
    max: 4,
    step: 0.05,
    description:
      'Impulso inicial hacia fuera al empezar la transición. Más alto lanza los prismas más lejos.',
  },
  {
    key: 'drift',
    label: 'Drift',
    min: -2,
    max: 1,
    step: 0.01,
    description:
      'Sesgo lateral del flujo; el signo decide hacia dónde va respecto a la dirección de la transición.',
  },
  {
    key: 'tether',
    label: 'Tether',
    min: 0,
    max: 5,
    step: 0.05,
    description:
      'Muelle que devuelve cada prisma a su celda. Más alto mantiene el enjambre más compacto.',
  },
  {
    key: 'stretch',
    label: 'Stretch',
    min: 0,
    max: 1.5,
    step: 0.01,
    description:
      'Estira los prismas en la dirección de su velocidad mientras vuelan, creando estelas.',
  },
  {
    key: 'shrink',
    label: 'Shrink',
    min: 0,
    max: 1,
    step: 0.01,
    description: 'Adelgaza los prismas en movimiento. Más alto = más estrechos al volar.',
  },
  {
    key: 'gloss',
    label: 'Gloss',
    min: 0,
    max: 2,
    step: 0.05,
    description:
      'Intensidad de los brillos especulares y del borde. 0 = mate; más alto = más brillante.',
  },
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

function HelpLabel({
  label,
  description,
  className,
}: {
  label: string;
  description: string;
  className?: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={`${label}: ver descripción`}
          className={cn(
            'inline-flex cursor-help items-center gap-1 text-left outline-none transition-colors',
            'hover:underline focus-visible:underline',
            'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            className,
          )}
        >
          {label}
          <Info className="h-3 w-3 shrink-0 text-muted-foreground/70" aria-hidden="true" />
        </button>
      </TooltipTrigger>
      <TooltipContent
        side="left"
        align="start"
        collisionPadding={12}
        className="max-w-60 text-left text-xs font-normal leading-relaxed"
      >
        {description}
      </TooltipContent>
    </Tooltip>
  );
}

function NumberControl({
  label,
  description,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  description: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="block space-y-1">
      <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
        <HelpLabel label={label} description={description} />
        <span className="tabular text-foreground">{value.toFixed(2)}</span>
      </div>
      <Slider
        aria-label={label}
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={(values) => onChange(values[0] ?? value)}
      />
    </div>
  );
}

function SwitchControl({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 text-xs font-semibold text-muted-foreground">
      <HelpLabel label={label} description={description} />
      <Switch aria-label={label} checked={checked} onCheckedChange={onChange} />
    </div>
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
    <TooltipProvider delayDuration={150} skipDelayDuration={300}>
      <div className="pb-24">
        <aside className="fixed right-4 top-20 z-50 max-h-[calc(100vh-6rem)] w-80 overflow-y-auto rounded-xl border border-border bg-card/95 p-4 text-sm shadow-lift backdrop-blur">
        <div className="space-y-4">
          <div className="space-y-2">
            <HelpLabel
              label="Preset"
              description="Home es el ajuste suave de referencia; Explore es el muro actual."
              className="field-mark"
            />
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
              <div className="block space-y-1">
                <HelpLabel
                  label="Aspect ratio"
                  description="Forma del escenario. La cámara se adapta para llenarlo."
                  className="text-xs font-semibold text-muted-foreground"
                />
                <Select
                  value={config.aspectRatio}
                  onValueChange={(value) => updateConfig('aspectRatio', value)}
                >
                  <SelectTrigger aria-label="Aspect ratio">
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
              </div>

              <div className="block space-y-1">
                <HelpLabel
                  label="Width"
                  description="Ancho máximo del escenario. Cuanto más ancho, más columnas entran en la rejilla."
                  className="text-xs font-semibold text-muted-foreground"
                />
                <Select
                  value={config.widthClass}
                  onValueChange={(value) => updateConfig('widthClass', value)}
                >
                  <SelectTrigger aria-label="Width">
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
              </div>

              <NumberControl
                label="FOV"
                description="Campo de visión de la cámara. Menos = más plano/teleobjetivo; más = más perspectiva y profundidad."
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
                description="Desplaza media celda las filas impares para crear un patrón de ladrillo. Apagado usa una rejilla alineada."
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
                description="Avanza a la siguiente placa cada 6 segundos. Se pausa al pasar el ratón, al enfocar y cuando el escenario sale de pantalla."
                checked={config.autoplay}
                onChange={(checked) => updateConfig('autoplay', checked)}
              />
              <SwitchControl
                label="Animate initial"
                description="Hace que la primera placa entre volando con los prismas. Apagado la muestra ya colocada."
                checked={config.animateInitial}
                onChange={(checked) => updateConfig('animateInitial', checked)}
              />
              <SwitchControl
                label="Clip to viewport"
                description="Recorta el canvas al escenario. Apagado deja que los prismas salgan del marco."
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
                  description={control.description}
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
    </TooltipProvider>
  );
}
