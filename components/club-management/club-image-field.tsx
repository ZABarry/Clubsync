"use client";

import { useRef, useState } from "react";
import { Loader2, Upload } from "lucide-react";
import { toast } from "sonner";

import { ClubImage } from "@/components/club/club-image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ClubImageFieldProps = {
  clubId?: string;
  imageUrl: string;
  onImageUrlChange: (url: string) => void;
};

export function ClubImageField({
  clubId = "new",
  imageUrl,
  onImageUrlChange,
}: ClubImageFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const uploadFile = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/clubs/upload-image", {
        method: "POST",
        body: formData,
      });
      const payload = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !payload.url) {
        throw new Error(payload.error ?? "Upload failed");
      }
      onImageUrlChange(payload.url);
      toast.success("Image uploaded");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to upload image",
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-3">
      <Label>Club image</Label>
      {imageUrl ? (
        <ClubImage
          clubId={clubId}
          src={imageUrl}
          alt="Club preview"
          wrapperClassName="max-w-md"
          className="aspect-[16/9] w-full rounded-lg object-cover"
        />
      ) : null}
      <div className="flex flex-wrap gap-2">
        <Input
          value={imageUrl}
          onChange={(e) => onImageUrlChange(e.target.value)}
          placeholder="https://example.com/image.jpg"
          type="url"
        />
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void uploadFile(file);
          }}
        />
        <Button
          type="button"
          variant="outline"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Upload className="size-4" />
          )}
          Upload
        </Button>
      </div>
    </div>
  );
}
