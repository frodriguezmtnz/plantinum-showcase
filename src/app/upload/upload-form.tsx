'use client';

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useWatch } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { CalendarIcon, UploadCloud, ImagePlus, ShieldCheck, AlertTriangle, CheckCircle2 } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { format } from "date-fns"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { useState, useEffect } from "react"
import Image from "next/image"
import imageCompression from "browser-image-compression"
import { uploadPlatinum, getUploadQuota } from "@/app/actions"
import { pixelateImage } from "@/lib/pixelate-client"
import { platinumMetaSchema, watermarkPositionSchema } from "@/lib/schemas"
import { WATERMARK_POSITIONS, type WatermarkPosition } from "@/lib/watermark-position"

const uploadFormSchema = platinumMetaSchema.extend({
  screenshot: z.custom<FileList>((files) => files instanceof FileList, {
    message: 'Image is required.',
  })
    .refine((files) => {
      const size = files[0]?.size;
      return size !== undefined && size <= 6 * 1024 * 1024;
    }, 'Max file size is 6MB.')
    .refine((files) => {
      const type = files[0]?.type;
      return type !== undefined && ["image/jpeg", "image/png", "image/webp"].includes(type);
    }, '.jpg, .png and .webp files are accepted.'),
  watermarkPosition: watermarkPositionSchema,
  agreedToRules: z
    .boolean()
    .refine((value) => value, 'You must accept the content rules to upload.'),
})

const WATERMARK_POSITION_LABELS: Record<WatermarkPosition, string> = {
  'top-left': 'Top left',
  'top-right': 'Top right',
  'bottom-left': 'Bottom left',
  'bottom-right': 'Bottom right',
}

const WATERMARK_POSITION_DOT: Record<WatermarkPosition, string> = {
  'top-left': 'left-1 top-1',
  'top-right': 'right-1 top-1',
  'bottom-left': 'left-1 bottom-1',
  'bottom-right': 'right-1 bottom-1',
}

type UploadFormValues = z.infer<typeof uploadFormSchema>

type UploadStage = 'idle' | 'compressing' | 'uploading'

interface SubmittedPlate {
  id: string;
  gameName: string;
  /** True when the screenshot was caught by the flag list and never went public. */
  blocked: boolean;
}

export function UploadForm() {
  const { toast } = useToast()
  const [preview, setPreview] = useState<string | null>(null);
  const [pixelPreview, setPixelPreview] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<SubmittedPlate | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [stage, setStage] = useState<UploadStage>('idle');
  const [compressPct, setCompressPct] = useState(0);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [quota, setQuota] = useState<Awaited<ReturnType<typeof getUploadQuota>>>(null);

  useEffect(() => {
    let alive = true;
    getUploadQuota().then((q) => {
      if (alive) setQuota(q);
    });
    return () => {
      alive = false;
    };
  }, []);

  const form = useForm<UploadFormValues>({
    resolver: zodResolver(uploadFormSchema),
    defaultValues: {
      gameName: "",
      isSpoiler: false,
      comment: "",
      watermarkPosition: "bottom-right",
      agreedToRules: false,
    },
  })

  const watchWatermarkPosition = useWatch({
    control: form.control,
    name: 'watermarkPosition',
  })

  function acceptFiles(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    form.setValue('screenshot', files);
    form.clearErrors('screenshot');
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    acceptFiles(e.dataTransfer.files);
  }

  const busy = stage !== 'idle';
  
  async function onSubmit(data: UploadFormValues) {
    const originalFile = data.screenshot[0];
    if (!originalFile) {
      toast({
        title: "Upload Failed",
        description: "A screenshot is required.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Compress in the browser to keep the request small (serverless-friendly).
      setStage('compressing');
      setCompressPct(0);
      const compressedFile = await imageCompression(originalFile, {
        maxSizeMB: 4,
        maxWidthOrHeight: 1600,
        useWebWorker: true,
        onProgress: (progress) => setCompressPct(Math.round(progress)),
      });

      setStage('uploading');

      const formData = new FormData();
      formData.set("gameName", data.gameName);
      formData.set("platform", data.platform);
      formData.set("platinumDate", data.platinumDate.toISOString());
      formData.set("isSpoiler", String(data.isSpoiler));
      if (data.comment) {
        formData.set("comment", data.comment);
      }
      formData.set("watermarkPosition", data.watermarkPosition);
      formData.set("screenshot", compressedFile, compressedFile.name);

      const result = await uploadPlatinum(formData);

      if (!result.success) {
        toast({
          title: "Upload Failed",
          description: result.error,
          variant: "destructive",
        });
        return;
      }

      const blocked = result.moderationStatus === 'HIDDEN';
      // Show the owner exactly what the gallery sees while the plate is not
      // public: the mosaic, not the screenshot.
      const mosaic = preview ? await pixelateImage(preview) : null;

      setPixelPreview(mosaic);
      setSubmitted({ id: result.platinumId, gameName: data.gameName, blocked });
      form.reset();
      setPreview(null);

      toast({
        title: blocked ? "Screenshot not accepted" : "Sent for review",
        description: blocked
          ? "That screenshot is on the disallowed list and was not published."
          : `Your platinum for ${data.gameName} is being checked by the screener.`,
        variant: blocked ? "destructive" : undefined,
      });
    } catch {
      toast({
        title: "Upload Failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setStage('idle');
      setCompressPct(0);
    }
  }
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    acceptFiles(e.target.files);
  };
  
  const quotaBlocked = quota !== null && quota.remaining === 0;

  const submitLabel =
    quotaBlocked ? 'Monthly limit reached' :
    stage === 'compressing' ? `Compressing\u2026 ${compressPct}%` :
    stage === 'uploading' ? 'Hanging it on the wall\u2026' :
    form.formState.isSubmitting ? 'Uploading\u2026' : 'Upload Platinum';

  if (submitted) {
    return (
      <div className="container max-w-2xl py-8 md:py-12">
        <Card>
          <CardContent className="space-y-5 p-6">
            <div className="flex items-center gap-3">
              {submitted.blocked ? (
                <AlertTriangle className="h-7 w-7 shrink-0 text-destructive" aria-hidden />
              ) : (
                <CheckCircle2 className="h-7 w-7 shrink-0 text-live" aria-hidden />
              )}
              <div>
                <h2 className="text-xl font-bold font-headline">
                  {submitted.blocked ? 'Screenshot not accepted' : 'Sent for review'}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {submitted.blocked
                    ? 'This image is on the disallowed list, so it was taken down on arrival and never appears in the gallery.'
                    : 'A screener checks every upload before it goes public. Nothing else for you to do — you will get a notice here.'}
                </p>
              </div>
            </div>

            {pixelPreview && (
              <figure className="space-y-2">
                <div className="relative overflow-hidden rounded-lg border border-border">
                  <Image
                    src={pixelPreview}
                    alt={`Pixelated preview of ${submitted.gameName}`}
                    width={640}
                    height={360}
                    className="h-auto w-full"
                    unoptimized
                  />
                  <div className="absolute inset-x-0 top-0 bg-destructive py-1 text-center text-[0.7rem] font-bold uppercase tracking-[0.22em] text-destructive-foreground">
                    {submitted.blocked ? 'Hidden' : 'Under review'}
                  </div>
                </div>
                <figcaption className="text-xs text-muted-foreground">
                  This is what everyone else sees while the plate is not public. Moderators see
                  the full screenshot.
                </figcaption>
              </figure>
            )}

            <div className="flex flex-wrap gap-2">
              <Button asChild>
                <Link href={`/platinum/${submitted.id}`}>View your platinum</Link>
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setSubmitted(null);
                  setPixelPreview(null);
                }}
              >
                Upload another
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl py-8 md:py-12">
       <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Upload a Platinum</CardTitle>
          <CardDescription>Showcase your latest achievement to the community.</CardDescription>
          {quota ? (
            <p className="pt-2 text-sm text-muted-foreground" aria-live="polite">
              <span className="field-mark mr-2">{quota.plan}</span>
              {quota.remaining === null ? (
                <>Unlimited uploads this month.</>
              ) : quotaBlocked ? (
                <>
                  You&apos;ve used all {quota.limit} uploads for this month. The allowance resets next month,
                  or raise it with a higher tier — see{' '}
                  <Link href="/pricing" className="text-primary underline underline-offset-4">
                    Pricing
                  </Link>
                  .
                </>
              ) : (
                <>
                  <span className="tabular font-semibold text-live">
                    {quota.remaining} of {quota.limit}
                  </span>{' '}
                  uploads left this month.
                </>
              )}
            </p>
          ) : null}
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="gameName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Game Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Elden Ring" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="platform"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Platform</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a PlayStation console" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="PS5">PlayStation 5</SelectItem>
                        <SelectItem value="PS4">PlayStation 4</SelectItem>
                        <SelectItem value="PS3">PlayStation 3</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                  control={form.control}
                  name="platinumDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Platinum Date</FormLabel>
                      <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={(date) => {
                              if (date) {
                                field.onChange(date);
                                setCalendarOpen(false);
                              }
                            }}
                            disabled={(date) =>
                              date > new Date() || date < new Date("2006-11-11") // PS3 launch
                            }
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="screenshot"
                  render={() => (
                    <FormItem>
                      <FormLabel>Screenshot</FormLabel>
                       <FormControl>
                        <div className="flex items-center justify-center w-full">
                            <label
                              htmlFor="dropzone-file"
                              onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                              onDragEnter={(e) => { e.preventDefault(); setDragActive(true); }}
                              onDragLeave={(e) => { e.preventDefault(); setDragActive(false); }}
                              onDrop={handleDrop}
                              className={cn(
                                "flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer transition-colors duration-200",
                                dragActive
                                  ? "border-primary bg-primary/5"
                                  : "border-border hover:bg-muted/50",
                                {'h-auto': preview}
                              )}
                            >
                                {preview ? (
                                  <div className="relative w-full aspect-video">
                                    <Image src={preview} alt="Screenshot preview" fill className="object-contain rounded-lg p-2" />
                                    <p className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs text-muted-foreground bg-background/80 rounded-full px-3 py-1">
                                      Drop another file or click to replace
                                    </p>
                                  </div>
                                ) : (
                                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                      <div className={cn("mb-4 rounded-full bg-muted p-4 transition-colors", dragActive && "bg-primary/15 text-primary")}>
                                        {dragActive ? <ImagePlus className="w-8 h-8" /> : <UploadCloud className="w-8 h-8 text-muted-foreground" />}
                                      </div>
                                      <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold text-primary">Click to upload</span> or drag and drop</p>
                                      <p className="text-xs text-muted-foreground">PNG, JPG or WEBP (MAX. 6MB)</p>
                                  </div>
                                )}
                                <Input id="dropzone-file" type="file" className="hidden" accept=".jpg,.png,.webp" onChange={handleFileChange} disabled={busy} />
                            </label>
                        </div> 
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

              <FormField
                control={form.control}
                name="comment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Comment (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Tell us about your journey to this platinum..."
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Share any thoughts, feelings, or tips about this achievement.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

               <FormField
                control={form.control}
                name="isSpoiler"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Spoiler Warning
                      </FormLabel>
                      <FormDescription>
                        Mark this if your screenshot contains story spoilers.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={busy}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="space-y-4 rounded-lg border p-4">
                <div className="flex flex-row items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="watermark-locked" className="text-base">
                        Site watermark
                      </Label>
                      <span className="field-mark text-primary">{quota?.plan ?? 'Free'}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {quota && !quota.watermark ? (
                        <>{quota.plan} uploads go up clean — no watermark on your screenshots.</>
                      ) : (
                        <>
                          Free uploads carry a Platinum Showcase watermark.{' '}
                          <Link href="/pricing" className="text-primary underline underline-offset-4">
                            PRO and PLATINUM
                          </Link>{' '}
                          (coming soon) skip it.
                        </>
                      )}
                    </p>
                  </div>
                  <Checkbox
                    id="watermark-locked"
                    checked={quota?.watermark ?? true}
                    disabled
                    aria-label={`Site watermark (${(quota?.watermark ?? true) ? 'on' : 'off'} for your ${(quota?.plan ?? 'FREE').toLowerCase()} plan)`}
                  />
                </div>

                {quota?.watermark ? (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Watermark position</p>
                    <div
                      role="radiogroup"
                      aria-label="Watermark position"
                      className="grid grid-cols-2 gap-2"
                    >
                      {WATERMARK_POSITIONS.map((position) => {
                        const selected = watchWatermarkPosition === position
                        return (
                          <button
                            key={position}
                            type="button"
                            role="radio"
                            aria-checked={selected}
                            onClick={() =>
                              form.setValue('watermarkPosition', position, { shouldValidate: true })
                            }
                            className={cn(
                              'flex items-center gap-3 rounded-md border p-2 text-left text-sm transition-colors',
                              selected
                                ? 'border-primary/60 bg-primary/5 text-foreground'
                                : 'border-input text-muted-foreground hover:bg-muted/50',
                            )}
                          >
                            <span className="relative block h-8 w-12 shrink-0 rounded-sm border border-border bg-muted/40">
                              <span
                                className={cn(
                                  'absolute h-2.5 w-6 rounded-full bg-primary',
                                  WATERMARK_POSITION_DOT[position],
                                )}
                              />
                            </span>
                            <span>{WATERMARK_POSITION_LABELS[position]}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ) : null}
              </div>

              <FormField
                control={form.control}
                name="agreedToRules"
                render={({ field }) => (
                  <FormItem className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
                    <div className="flex items-start gap-2">
                      <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-destructive" aria-hidden />
                      <p className="text-sm text-muted-foreground">
                        Screenshots go through an automatic screener and a human review queue.
                        No sexual content, no graphic violence, no hate or advertising — only
                        real in-game platinum screenshots.
                      </p>
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <Checkbox
                        id="content-rules"
                        checked={field.value}
                        onCheckedChange={(checked) => field.onChange(checked === true)}
                        disabled={busy}
                      />
                      <Label htmlFor="content-rules" className="text-sm font-normal">
                        This is my own screenshot and it follows the content rules.
                      </Label>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {busy && (                <div className="space-y-2">
                  <Progress value={stage === 'compressing' ? compressPct : 100} className="h-2" />
                  <p className="text-sm text-muted-foreground">
                    {stage === 'compressing'
                      ? 'Compressing your screenshot for a faster upload\u2026'
                      : 'Posting your platinum to the gallery\u2026'}
                  </p>
                </div>
              )}

              <Button type="submit" className="w-full" size="lg" disabled={form.formState.isSubmitting || quotaBlocked}>
                <UploadCloud className="mr-2" />
                {submitLabel}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
