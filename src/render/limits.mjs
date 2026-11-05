// Where the knob turns into the black hole. The level anchors are fixed (High is
// 2/3, Max is 1); collapse and BOOM sit a stretch past High, so High itself stays
// a charged knob and the hole only forms on the way to Max. Release still snaps
// at the High/Max midpoint. rearm: how far back below High a new BOOM is armed.
export const LIMITS=Object.freeze({high:2/3,collapse:.76,boom:.8,rearm:2/3-.012});
