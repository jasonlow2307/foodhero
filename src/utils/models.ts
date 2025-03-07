import { Timestamp } from "firebase/firestore";

export type Fullness = "not enough" | "perfect" | "too much";

export interface Location {
  place_id: number;
  display_name: string;
  boundingBox: number[];
  lon: number;
  lat: number;
  distance?: number;
  sharedWith?: string[];
  sharedBy?: string;
  isShared?: boolean;
}

export interface Visit {
  food: { [key: string]: number };
  date: Date | Timestamp;
  fullness: Fullness;
  notes?: string;
  mealType?: string;
}

export interface LocationFormProp {
  index: number;
  name: string;
  userId: string;
  location: string;
  visits: Visit[];
  selectedLocation: Location | null;
}

export interface Images {
  [key: string]: string | null;
}
