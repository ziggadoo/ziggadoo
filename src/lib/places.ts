export const START_POINTS = [
  { key: "arabian-ranches", label: "Arabian Ranches", lat: 25.05, lng: 55.27 },
  { key: "downtown", label: "Downtown", lat: 25.195, lng: 55.275 },
  { key: "dubai-hills", label: "Dubai Hills", lat: 25.11, lng: 55.248 },
  { key: "jumeirah", label: "Jumeirah", lat: 25.2, lng: 55.24 },
  { key: "jumeirah-park", label: "Jumeirah Park", lat: 25.0685, lng: 55.17 },
  { key: "jvc", label: "JVC", lat: 25.06, lng: 55.21 },
  { key: "marina", label: "Marina / JBR", lat: 25.0805, lng: 55.1403 },
  { key: "mirdif", label: "Mirdif", lat: 25.22, lng: 55.42 },
  { key: "palm", label: "Palm Jumeirah", lat: 25.1124, lng: 55.139 },
];
export const DEFAULT_START = START_POINTS.find((p) => p.key === "jumeirah-park")!;
