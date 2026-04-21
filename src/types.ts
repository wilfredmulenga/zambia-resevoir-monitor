import { z } from "zod";

// ── Global Water Watch ────────────────────────────────────────────────────────

export const GWWReservoirSchema = z.object({
  id: z.number(),
  type: z.literal("Feature"),
  geometry: z.object({
    type: z.literal("MultiPolygon"),
    coordinates: z.array(z.array(z.array(z.array(z.number())))),
  }),
  properties: z.object({
    name: z.string().nullable(),
    name_en: z.string().nullable(),
    grand_id: z.string().nullable(),
  }),
});

export const GWWResponseSchema = z.object({
  type: z.literal("FeatureCollection"),
  features: z.array(GWWReservoirSchema),
});

export const GWWTimeSeriesPointSchema = z.object({
  value: z.number(),
  t: z.string(),
  name: z.string(),
  unit: z.string(),
});

export const GWWTimeSeriesSchema = z.array(GWWTimeSeriesPointSchema);

export type GWWReservoir = z.infer<typeof GWWReservoirSchema>;
export type GWWTimeSeriesPoint = z.infer<typeof GWWTimeSeriesPointSchema>;
export type GWWTimeSeries = z.infer<typeof GWWTimeSeriesSchema>;

// ── Re:Earth CMS ──────────────────────────────────────────────────────────────

export const CMSReservoirFieldsSchema = z.object({
  name: z.string(),
  gww_id: z.number(),
  location: z.string(), // GeoJSON Point string
});

export const CMSItemSchema = z.object({
  id: z.string(),
  fields: z.array(
    z.object({
      key: z.string(),
      type: z.string(),
      value: z.unknown(),
    })
  ),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const CMSPublicResponseSchema = z.object({
  results: z.array(z.record(z.unknown())),
  totalCount: z.number(),
  hasMore: z.boolean(),
  page: z.number(),
});

export type CMSItem = z.infer<typeof CMSItemSchema>;
export type CMSPublicResponse = z.infer<typeof CMSPublicResponseSchema>;
