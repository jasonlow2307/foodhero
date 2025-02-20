import { Timestamp } from "firebase/firestore";

export interface Location {
  place_id: number;
  display_name: string;
  boundingBox: number[];
  lon: number;
  lat: number;
}

export interface Visit {
  food: { [key: string]: number };
  date: Date | Timestamp;
}

export interface LocationFormProp {
  name: string;
  location: string;
  visits: Visit[];
  selectedLocation: Location | null;
}

export interface Images {
  [key: string]: string | null;
}
