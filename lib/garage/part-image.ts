import imageMap from "./part-image-map.generated.json";
import { garageUiAsset } from "./garage-ui-assets";

type PartImageMapFile = {
  partImageByName: Record<string, string>;
  manufacturerImageByName: Record<string, string>;
};

const { partImageByName, manufacturerImageByName } = imageMap as PartImageMapFile;

export function partImageFileForPartName(name: string): string | null {
  return partImageByName[name] ?? null;
}

export function partImageUrlForPartName(name: string): string | null {
  const f = partImageFileForPartName(name);
  return f ? garageUiAsset(f) : null;
}

export function manufacturerImageFile(name: string | undefined): string | null {
  if (!name) return null;
  return manufacturerImageByName[name] ?? null;
}

export function manufacturerImageUrl(name: string | undefined): string | null {
  const f = manufacturerImageFile(name);
  return f ? garageUiAsset(f) : null;
}
