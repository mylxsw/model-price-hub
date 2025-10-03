"use client";

import { ChangeEvent, useRef, useState } from "react";

import { Button } from "../ui/Button";
import { uploadImageToS3 } from "../../lib/uploads";

interface ImageUploadButtonProps {
  onUploaded: (url: string) => void;
  onError?: (message: string) => void;
  label?: string;
  className?: string;
}

export function ImageUploadButton({ onUploaded, onError, label = "Upload image", className }: ImageUploadButtonProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setUploading(true);
    try {
      const url = await uploadImageToS3(file);
      onUploaded(url);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to upload image";
      onError?.(message);
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
        disabled={uploading}
      />
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className={className}
      >
        {uploading ? "Uploading..." : label}
      </Button>
    </>
  );
}
