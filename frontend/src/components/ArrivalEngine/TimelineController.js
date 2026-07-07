export const arrivalTimeline = {
  phases: [
    { id: "blackout", start: 0, end: 0.5 },
    { id: "wind", start: 0.5, end: 1.5 },
    { id: "fog", start: 1.5, end: 2.5 },
    { id: "particles", start: 2.5, end: 3.5 },
    { id: "lightning", start: 3.5, end: 4.5 },
    { id: "clouds", start: 4.5, end: 5.5 },
    { id: "glow", start: 5.5, end: 6.5 },
    { id: "silhouette", start: 6.5, end: 7.5 },
    { id: "push", start: 7.5, end: 8.5 },
    { id: "wings", start: 8.5, end: 9.5 },
    { id: "gold", start: 9.5, end: 10.5 },
    { id: "kingdom", start: 10.5, end: 12 }]
  ]
};

export function getTimelinePhase(currentTime) {
  return arrivalTimeline.phases.find((phase) => currentTime >= phase.start && currentTime < phase.end) || arrivalTimeline.phases[arrivalTimeline.phases.length - 1];
}
