export interface Reservoir {
  name: string;
  gww_id: number;
  location: string | { type: string; coordinates: number[] };
}

export interface TimeSeriesPoint {
  value: number;
  t: string;
  name: string;
  unit: string;
}

export interface ReservoirsResponse {
  results: Record<string, unknown>[];
  totalCount: number;
}
