// Real photographs of ten famous sights (ESA/Hubble, CC BY 4.0, credit:
// ESA/Hubble & NASA; see ASSETS_CREDITS.md), shown as distant flat objects on
// the classic sky strip. Where a photo exists, it replaces the procedural
// drawing of the same object (classic: its name in classics.mjs); two have no
// procedural twin and get their own place on the strip. They drift with the
// voyage like the classics and are never used for the nebula flythrough.
//
// crop: [x, y, w, h] in the original; floor/ramp: brightness that counts as
// sky background and how quickly the alpha rises above it; radius: on-screen
// half-size in px (of the longer side); edge: share of the radius over which
// the elliptical fade runs (1 for frame-filling photos); stars: how sharp a
// peak must be to count as a baked-in star (default .1).
export const PHOTOS = Object.freeze([
  { id: 'heic1501a', file: 'heic1501a.jpg', title: '创生之柱（鹰状星云 M16）', classic: '创生之柱 M16', crop: [0, 28, 1280, 1280], floor: .05, ramp: .25,edge: 1, radius: 46 },
  { id: 'heic0506a', file: 'heic0506a.jpg', title: '涡状星系 M51 及伴星系', classic: '涡状星系 M51', crop: [0, 0, 1280, 888], floor: .06, ramp: .3, radius: 44 },
  { id: 'opo0328a', file: 'opo0328a.jpg', title: '草帽星系 M104', classic: '草帽星系 M104', crop: [140, 78, 1000, 560], floor: .06, ramp: .3, radius: 40 },
  { id: 'heic0515a', file: 'heic0515a.jpg', title: '蟹状星云 M1', classic: '蟹状星云 M1', crop: [90, 90, 1100, 1100], floor: .05, ramp: .25,stars: .3, radius: 36 },
  { id: 'heic0707a', file: 'heic0707a.jpg', title: '船底座星云', classic: null, strip: [1460, 196], crop: [0, 0, 1280, 620], floor: .04, ramp: .25,edge: 1, radius: 56 },
  { id: 'heic0601a', file: 'heic0601a.jpg', title: '猎户座大星云 M42', classic: '猎户座大星云 M42', crop: [0, 0, 1280, 1280], floor: .05, ramp: .25,edge: 1, radius: 50 },
  { id: 'heic0414a', file: 'heic0414a.jpg', title: '猫眼星云 NGC 6543', classic: '猫眼星云 NGC 6543', crop: [240, 240, 800, 800], floor: .12, ramp: .3, radius: 24 },
  { id: 'heic0615a', file: 'heic0615a.jpg', title: '触须星系 NGC 4038/4039', classic: '触须星系 NGC 4038/9', crop: [140, 135, 1000, 1000], floor: .06, ramp: .3, radius: 38 },
  { id: 'heic0711a', file: 'heic0711a.jpg', title: '星暴星系 NGC 4449', classic: null, strip: [2190, 190], crop: [0, 0, 1280, 825], floor: .07, ramp: .3,edge: .8, radius: 42 },
  { id: 'heic0910h', file: 'heic0910h.jpg', title: '蝴蝶星云 NGC 6302', classic: '蝴蝶星云 NGC 6302', crop: [90, 96, 1100, 1300], floor: .05, ramp: .25,stars: .25, radius: 36 },
].map(Object.freeze));
export const PHOTO_CREDIT = 'ESA/Hubble & NASA';
