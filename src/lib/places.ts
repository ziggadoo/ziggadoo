export const START_POINTS = [
  { key: "arabian-ranches", label: "Arabian Ranches", lat: 25.05, lng: 55.27 },
  { key: "deira", label: "Deira", lat: 25.27, lng: 55.32 },
  { key: "downtown", label: "Downtown", lat: 25.195, lng: 55.275 },
  { key: "creek-harbour", label: "Dubai Creek Harbour", lat: 25.205, lng: 55.35 },
  { key: "dubai-hills", label: "Dubai Hills", lat: 25.11, lng: 55.248 },
  { key: "jumeirah", label: "Jumeirah", lat: 25.2, lng: 55.24 },
  { key: "jumeirah-park", label: "Jumeirah Park", lat: 25.0685, lng: 55.17 },
  { key: "jvc", label: "JVC", lat: 25.06, lng: 55.21 },
  { key: "marina", label: "Marina / JBR", lat: 25.0805, lng: 55.1403 },
  { key: "mirdif", label: "Mirdif", lat: 25.22, lng: 55.42 },
  { key: "palm", label: "Palm Jumeirah", lat: 25.1124, lng: 55.139 },
  { key: "town-square", label: "Town Square", lat: 25.005, lng: 55.29 },
  { key: "warsan", label: "Warsan", lat: 25.16, lng: 55.42 },
];
export const DEFAULT_START = START_POINTS.find((p) => p.key === "palm")!;
