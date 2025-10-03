export const MODEL_CATEGORIES = [
  { value: "文本生成", label: "文本生成" },
  { value: "音频生成", label: "音频生成" },
  { value: "视频生成", label: "视频生成" },
  { value: "图像生成", label: "图像生成" }
] as const;

export type ModelCategoryValue = (typeof MODEL_CATEGORIES)[number]["value"];
