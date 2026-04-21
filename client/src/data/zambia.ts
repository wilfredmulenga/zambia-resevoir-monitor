import type { Polygon } from "geojson";

// Simplified polygon of Zambia's borders, accurate enough to filter out
// reservoirs from neighbouring countries (DRC, Tanzania, Malawi, Mozambique,
// Zimbabwe, Botswana, Namibia, Angola) that fall inside the rectangular
// bounding box used during the GWW import.
const zambiaBoundary: Polygon = {
  type: "Polygon",
  coordinates: [
    [
      [22.0, -8.4],
      [22.5, -8.2],
      [24.0, -8.2],
      [25.3, -8.4],
      [26.0, -8.4],
      [27.0, -8.3],
      [28.0, -8.4],
      [29.0, -8.2],
      [29.5, -8.4],
      [30.2, -8.5],
      [31.0, -8.6],
      [31.5, -8.9],
      [32.0, -9.1],
      [32.7, -9.4],
      [33.2, -9.6],
      [33.5, -10.0],
      [33.7, -10.8],
      [33.7, -11.5],
      [33.5, -12.3],
      [33.2, -12.9],
      [32.9, -13.4],
      [33.1, -14.0],
      [33.0, -14.5],
      [32.6, -15.2],
      [32.2, -15.8],
      [31.8, -16.3],
      [31.2, -16.6],
      [30.4, -16.1],
      [30.0, -16.5],
      [29.5, -17.2],
      [29.0, -17.7],
      [28.5, -17.9],
      [28.0, -18.1],
      [27.0, -18.1],
      [26.0, -18.1],
      [25.3, -17.9],
      [24.4, -17.5],
      [23.9, -17.7],
      [23.3, -17.5],
      [22.5, -17.4],
      [22.0, -16.5],
      [22.0, -8.4],
    ],
  ],
};

export default zambiaBoundary;
