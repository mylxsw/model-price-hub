"use client";

import { ApiClient } from "./apiClient";
import { useAuthStore } from "./hooks/useAuth";

interface PresignedUpload {
  uploadUrl: string;
  fields: Record<string, string>;
  fileUrl: string;
}

const client = new ApiClient({
  getToken: () => useAuthStore.getState().token ?? null
});

export async function uploadImageToS3(file: File): Promise<string> {
  const presigned = await client.post<PresignedUpload>("/api/admin/uploads/presign", {
    filename: file.name,
    contentType: file.type || "application/octet-stream"
  });

  const formData = new FormData();
  Object.entries(presigned.fields).forEach(([key, value]) => {
    formData.append(key, value);
  });
  formData.append("file", file);

  const response = await fetch(presigned.uploadUrl, {
    method: "POST",
    body: formData
  });

  if (!response.ok) {
    throw new Error("File upload failed. Please try again.");
  }

  return presigned.fileUrl;
}
