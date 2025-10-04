"use client";

import { ApiClient } from "./apiClient";
import { useAuthStore } from "./hooks/useAuth";

type PresignedFields = Record<string, string>;

interface PresignedUpload {
  uploadUrl: string;
  fields: PresignedFields;
  fileUrl: string;
}

function buildApiClient() {
  let cachedToken: string | null = null;
  return new ApiClient({
    getToken: () => {
      const currentToken = useAuthStore.getState().token ?? null;
      if (currentToken !== cachedToken) {
        cachedToken = currentToken;
      }
      return cachedToken;
    }
  });
}

const client = buildApiClient();

export async function uploadImageToS3(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await client.post<{ file_url: string; filename: string }>(
    "/api/admin/uploads/file",
    formData
  );

  return response.file_url;
}
