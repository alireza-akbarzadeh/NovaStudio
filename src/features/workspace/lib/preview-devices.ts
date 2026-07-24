/** Device size presets for the preview chrome. */

export type PreviewDeviceId = "responsive" | "mobile" | "tablet" | "desktop";

export type PreviewDevice = {
  id: PreviewDeviceId;
  label: string;
  /** null = fill available space */
  width: number | null;
  height: number | null;
};

export const PREVIEW_DEVICES: PreviewDevice[] = [
  { id: "responsive", label: "Fit", width: null, height: null },
  { id: "mobile", label: "Mobile", width: 390, height: 844 },
  { id: "tablet", label: "Tablet", width: 768, height: 1024 },
  { id: "desktop", label: "Desktop", width: 1280, height: 800 },
];

export function getPreviewDevice(id: PreviewDeviceId): PreviewDevice {
  return (
    PREVIEW_DEVICES.find((device) => device.id === id) ?? PREVIEW_DEVICES[0]!
  );
}
