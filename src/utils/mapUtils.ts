export const getBoundingBox = (boundingBox: number[]) => {
  const [minLat, maxLat, minLon, maxLon] = boundingBox;
  return `${minLon},${minLat},${maxLon},${maxLat}`;
};

export const getMapCenter = (boundingBox: number[]) => {
  const [minLat, maxLat, minLon, maxLon] = boundingBox.map(Number);
  const centerLat =
    Number.isFinite(minLat) && Number.isFinite(maxLat)
      ? (minLat + maxLat) / 2
      : 0;
  const centerLon =
    Number.isFinite(minLon) && Number.isFinite(maxLon)
      ? (minLon + maxLon) / 2
      : 0;
  return `${centerLat},${centerLon}`;
};

export const getGoogleMapsLink = (boundingBox: number[]) => {
  const [minLat, maxLat, minLon, maxLon] = boundingBox.map(Number);
  const centerLat =
    Number.isFinite(minLat) && Number.isFinite(maxLat)
      ? (minLat + maxLat) / 2
      : 0;
  const centerLon =
    Number.isFinite(minLon) && Number.isFinite(maxLon)
      ? (minLon + maxLon) / 2
      : 0;
  return `https://www.google.com/maps/dir/?api=1&destination=${centerLat},${centerLon}`;
};

export const getWazeLink = (boundingBox: number[]) => {
  const [minLat, maxLat, minLon, maxLon] = boundingBox.map(Number);
  const centerLat =
    Number.isFinite(minLat) && Number.isFinite(maxLat)
      ? (minLat + maxLat) / 2
      : 0;
  const centerLon =
    Number.isFinite(minLon) && Number.isFinite(maxLon)
      ? (minLon + maxLon) / 2
      : 0;
  return `https://waze.com/ul?ll=${centerLat},${centerLon}&navigate=yes`;
};
