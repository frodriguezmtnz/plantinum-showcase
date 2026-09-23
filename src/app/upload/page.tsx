'use client';

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { CalendarIcon, UploadCloud } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { useState, useEffect } from "react"
import Image from "next/image"
import { useAuth } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"
import imageCompression from "browser-image-compression"
import { uploadPlatinum } from "@/app/actions"

const uploadFormSchema = z.object({
  gameName: z.string().min(5, {
    message: "Game name must be at least 5 characters.",
  }),
  platform: z.enum(["PS3", "PS4", "PS5"], {
    required_error: "You need to select a platform.",
  }),
  platinumDate: z.date({
    required_error: "A date for your platinum is required.",
  }),
  screenshot: z.custom<FileList>((files) => files instanceof FileList, {
    message: 'Image is required.',
  })
    .refine((files) => {
      const size = files[0]?.size;
      return size !== undefined && size <= 5000000;
    }, 'Max file size is 5MB.')
    .refine((files) => {
      const type = files[0]?.type;
      return type !== undefined && ["image/jpeg", "image/png", "image/webp"].includes(type);
    }, '.jpg, .png and .webp files are accepted.'),
  isSpoiler: z.boolean().default(false),
  comment: z.string().max(500, "Comment is too long.").optional(),
})

type UploadFormValues = z.infer<typeof uploadFormSchema>

export default function UploadPage() {
  const { toast } = useToast()
  const [preview, setPreview] = useState<string | null>(null);
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user === null) {
      router.push('/login');
    }
  }, [user, router]);

  const form = useForm<UploadFormValues>({
    resolver: zodResolver(uploadFormSchema),
    defaultValues: {
      gameName: "",
      isSpoiler: false,
      comment: "",
    },
  })
  
  async function onSubmit(data: UploadFormValues) {
    const originalFile = data.screenshot[0];
    if (!originalFile) {
      toast({
        title: "Upload Failed",
        description: "La captura es obligatoria.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Compress in the browser to keep the request small (serverless-friendly).
      const compressedFile = await imageCompression(originalFile, {
        maxSizeMB: 4,
        maxWidthOrHeight: 1600,
        useWebWorker: true,
      });

      const formData = new FormData();
      formData.set("gameName", data.gameName);
      formData.set("platform", data.platform);
      formData.set("platinumDate", data.platinumDate.toISOString());
      formData.set("isSpoiler", String(data.isSpoiler));
      if (data.comment) {
        formData.set("comment", data.comment);
      }
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

      toast({
        title: "Upload Successful!",
        description: `Your platinum for ${data.gameName} has been submitted.`,
      });
      form.reset();
      setPreview(null);
      router.push(`/platinum/${result.platinumId}`);
    } catch {
      toast({
        title: "Upload Failed",
        description: "Ha ocurrido un error inesperado. Inténtalo de nuevo.",
        variant: "destructive",
      });
    }
  }
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    const file = files?.[0];
    if (file) {
      form.setValue('screenshot', files);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  if (!user) {
    return <div className="container text-center py-12">Redirigiendo a inicio de sesión...</div>;
  }


  return (
    <div className="container max-w-2xl py-8 md:py-12">
       <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Upload a Platinum</CardTitle>
          <CardDescription>Showcase your latest achievement to the community.</CardDescription>
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
                      <Popover>
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
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date > new Date() || date < new Date("2006-11-11") // PS3 launch
                            }
                            initialFocus
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
                            <label htmlFor="dropzone-file" className={cn("flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors", {'h-auto': preview})}>
                                {preview ? (
                                  <div className="relative w-full aspect-video">
                                    <Image src={preview} alt="Screenshot preview" fill className="object-contain rounded-lg p-2" />
                                  </div>
                                ) : (
                                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                      <UploadCloud className="w-8 h-8 mb-4 text-muted-foreground" />
                                      <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold text-primary">Click to upload</span> or drag and drop</p>
                                      <p className="text-xs text-muted-foreground">PNG, JPG or WEBP (MAX. 5MB)</p>
                                  </div>
                                )}
                                <Input id="dropzone-file" type="file" className="hidden" accept=".jpg,.png,.webp" onChange={handleFileChange} />
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
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" size="lg" disabled={form.formState.isSubmitting}>
                <UploadCloud className="mr-2" />
                {form.formState.isSubmitting ? "Uploading..." : "Upload Platinum"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
