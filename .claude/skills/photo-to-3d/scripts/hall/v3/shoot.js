// Headless shots of the WW page (hall3.html): phone 390×844 + desktop 1200×800, same cameras every time.
// usage: NODE_PATH=$(npm root -g) node shoot.js hall3.html <out prefix> [views] [phone|desk]
//   views: comma list of names below (default: door,up,roofclose,far). Writes <prefix>-<size>-<view>.png and <prefix>-console.txt
// One browser, one page load per size, all views shot from it (a load is the slow part, ~30 s under SwiftShader).
const { chromium } = require('playwright'); const path = require('path'); const fs = require('fs');
const C = process.env.HOME + '/.cache/jos3d/';
const TMO = +process.env.SHOT_TIMEOUT || 300000;   // 24 Oct 23:xx: on a 2-core container one desktop HQ frame can take > 300 s; SHOT_TIMEOUT=900000 for desk shots
const [page, pre, only, sizeOnly] = [process.argv[2], process.argv[3] || 'shot', process.argv[4], process.argv[5]];
const sizes = [['phone', 390, 844], ['desk', 1200, 800]].filter(s => !sizeOnly || s[0] === sizeOnly);
const VIEWS = { // [[cam], [target], roof visible]. Keep the target BELOW the camera: OrbitControls' maxPolarAngle (.495π) lifts a camera that looks up to the target's height
  door: 'door',                                              // the page's own walk-in view
  far: 'far',
  top: 'top',
  up: [[10, 2.6, -6], [10, 2.5, -30], true],                 // mid-aisle, eye a bit high, looking down the hall: roof fills the top half
  roofclose: [[11, 5.4, -14], [17, 5.3, -21], true],         // up close under the right-hand slope: sheets, purlins, a roof light, a high-bay
  floorclose: [[11, 1.4, -6], [13, 0, -10], true],
  wallleft: [[8, 3.4, -17], [0.5, 3.2, -25], true],          // left wall past the workshop, above the stillages: cladding, girts, posts
  wallfar: [[12, 3.6, -26], [9, 3.4, -39], true],            // the far gable end
  wallclose: [[4.2, 4.6, -27], [0, 4.4, -30.5], true],       // close on the left wall's upper cladding: profile, laps, fixings
  rackrun: [[14.5, 2.6, -0.8], [18.4, 1.5, -9], true],        // down the yard-bay orange racking from the door corner
  rackclose: [[16.6, 1.8, -4.6], [18.4, 1.1, -6.3], true],    // one upright of the orange run: beam ends, frame bracing, base plate
  rackhigh: [[17.2, 3.25, -10.3], [18.4, 2.95, -11.43], true], // the top beam's connector on an upright
  yellowclose: [[9.4, 2.4, -6.2], [7.2, 1.6, -8.0], true],    // the yellow racking on the workshop's outside wall
  cratefront: [[8.6, 1.9, -24.6], [7.6, 1.2, -28.0], true],   // the 14 ft crown crate fronts, mid-hall: labels, badge, check-sheet window
  crateclose: [[7.6, 0.95, -26.6], [7.1, 0.55, -27.9], true],  // close on one cover's lower front + side: weave, seams, hem, straps
  cratetop: [[9.2, 3.9, -25.6], [8.1, 2.9, -28.2], true],      // looking down on the stack tops: seams, sag, dust
  planters: [[14.6, 2.0, -5.9], [18.4, 1.45, -5.9], true],      // the yard-bay racking bays 2–3 from the aisle: planter pairs on levels 1–2
  planterclose: [[16.9, 1.25, -4.4], [18.4, .8, -5.6], true],   // close on one planter pair: ribs, trim, strap, ratchet, pallet
  bayfar: [[14.4, 2.1, -11.3], [18.4, 1.55, -11.3], true],      // yard-bay bays 1–2 from the far end (z −14.2…−8.63), levels 1–3
  gycrate: [[11.3, 2.5, -12.3], [9.4, .95, -14.3], true],    // the GY ply crate mid-hall (x 8.3–10.5, z −14.9…−13.7): lid, battens, clips, canvas roll (11 Nov)
  yardcrate:[[13.4, 1.75, -5.6], [16.6, .45, -8.6], true],    // the ply crate on the yard-bay floor (x 16.0–17.3, z −7.5…−9.5) from the aisle, racking behind (2 Nov, Y1)
  yardcrateclose:[[15.2, 1.15, -6.9], [16.3, .5, -8.3], true],  // close on its aisle-side corner: battens, screws, clips, lid
  yardsack:[[15.5, 1.5, -4.9], [17.6, .45, -2.3], true],     // the sack truck parked against the yard-bay racking by the door, the loose cable across the floor (2 Nov, Y2)
  yardsackclose:[[16.95, 1.05, -3.75], [17.95, .55, -2.45], true],  // close on the sack truck: toe plate, wheels, frame, grips
  yardframes:[[15.8, 1.35, -10.2], [18.0, .6, -11.9], true],   // the aluminium frames leaning on the far-end bay's front: the LiDAR's boards to 1.4 m at x 17.8–18.2, z −11.2…−12.6 (2 Nov, Y3c)
  yardframesclose:[[16.85, 1.05, -10.9], [18.0, .55, -11.8], true],  // close on the frames: corners, welds, feet
  yardkeg:[[15.5, 1.4, -11.0], [17.8, .35, -13.0], true],     // the floor in front of the far-end bay: the LiDAR's 0.6 m grey block at x 17.5–18.1, z −12.7…−13.4 (2 Nov, Y3b kegs)
  yardkegclose:[[16.85, .95, -12.15], [17.8, .35, -13.05], true],  // close on the kegs: chimes, hand holes, spears, steel
  yardstack:[[12.6, 1.65, -9.4], [15.0, .3, -12.5], true],     // the back of the yard bay: the LiDAR's flat block and the sheet leaning on it, x 13.75–16.5, z −11.9…−13.1 (2 Nov, Y3c)
  yardwrap:[[9.6, 1.55, -9.0], [12.1, .45, -11.9], true],   // the LiDAR's 2.2 × 1.2 × 1.0 m wrapped stack in the aisle, x 11.0–13.2, z −11.3…−12.5 (2 Nov 23:xx)
  yardwrapclose:[[14.05, 1.15, -10.2], [12.55, .45, -11.8], true],  // close on its door-end corner: film, strap, pallet, floor shadow
  yardbag:[[17.25, 1.75, -6.15], [18.0, .3, -8.6], true],     // the LiDAR's dark 0.48 m lump between the ply crate and the racking, x 17.78–18.22, z −8.3…−8.87 (3 Nov 00:xx, Y3c part 2b)
  yardbagclose:[[17.72, 1.0, -7.45], [18.0, .22, -8.55], true],  // close on it from the door side: neck, creases, floor shadow
  yardbench:[[10.1, 1.65, -.2], [12.0, .55, -2.3], true],     // the LiDAR's bench-sized block by the roller door, x 11.3–12.6, z −1.3…−3.15, top ≈ 1.05 m, under a tarp (3 Nov 01:xx, Y3d)
  yardbenchclose:[[10.75, .95, -3.75], [11.55, .42, -2.55], true],  // close on its far corner from the aisle: castors, legs, hem, eyelets
  yardbenchfar:[[13.3, 1.6, -5.0], [12.1, .6, -2.5], true],     // from the yard-bay side, far end: tarp over the corner, box section on top
  yardpad:[[12.7, 1.5, -9.2], [14.6, .2, -11.2], true],     // the LiDAR's low soft heap on the yard-bay floor, x 14–15.25, z −10.65…−11.7 (2 Nov, Y3c part 2)
  yardpadclose:[[15.75, .8, -9.95], [14.75, .2, -11.05], true],  // close on its folds from the door side: layers, blue-grey sheet, floor shadow
  yardstackclose:[[15.6, 1.2, -10.6], [15.1, .4, -12.4], true],  // close on the carton corner, strap, ratchet and the leaning panels
  yardshelf:[[16.9, .78, -2.0], [18.9, .32, -1.6], true],    // the door-end bay's bottom shelf: reels, tote, jerry cans (3 Nov)
  yardfluids:[[17.5, 1.3, -1.45], [18.9, 1.0, -1.29], true],    // close on the box on the tote in the door-end bay: lantern and bottles (3 Nov, Y4)
  walkbay:[[8.6, 4.75, -20.7], [2.6, 3.9, -20.7], true],    // over the cream sheet from the aisle: the LiDAR's face at x ≈ 2.6, z −19.6…−21.8, stock to 5 m (5 Nov, step 2c-iv part 2b)
  walkbayside:[[6.3, 4.4, -16.9], [2.7, 3.5, -20.6], true],    // from over the four-high pile's door end: the same bay's end frame and boards
  creamgap:[[8.4, 1.75, -20.45], [3.9, 1.95, -20.5], true],    // the gap between the 14 ft piles from the aisle: the LiDAR's cream block, x 3.0–4.3, z −19.6…−21, top 3.8 m (4 Nov, step 2c-iv part 2b)
  creamclose:[[6.1, 1.3, -20.75], [4.1, 1.8, -20.45], true],    // inside the gap: sheet folds, hem, the dark stack under it
  creamtie:[[5.05, 1.42, -20.3], [4.3, 1.27, -20.7], true],     // 9 Nov 06:xx: close on the cream sheet's tie ratchet: handle, tail
  creamup:[[7.2, 4.6, -16.6], [3.8, 2.7, -20.5], true],    // from above the piles: the hump over the pile tops
  loadtop:[[8.9, 3.75, -20.9], [4.6, 3.3, -22.3], true],    // from the aisle, high: the LiDAR's load on the three-high 14 ft pile, x 3.6–5.4, z −21.7…−22.85, top 3.9 m (4 Nov 06:xx, step 2c-iv part 2b)
  loadclose:[[6.3, 3.7, -21.5], [4.5, 3.42, -22.3], true],    // close from the pile's own low end: bag, bundles, timber, straps
  loadfar:[[5.3, 3.65, -25.1], [4.3, 3.35, -22.4], true],    // from the far side over the single pile: the timber pack and the red bag's flank
  stilldoor:[[7.7, 1.25, -23.7], [5.7, .62, -23.8], true],    // the single 14 ft stillage's aisle end: door sets, spigots, the low load's film (for the 4 Nov 02:xx build's review)
  yardlean:[[16.2, 1.5, -4.9], [18.25, .8, -3.3], true],    // the rack front at the door-end bay: scaffold board and yard broom leaning on the beam (4 Nov, Y4 part 2)
  yardleanclose:[[17.25, .55, -4.05], [18.05, .32, -3.4], true],    // close on the broom head and the board's foot
  yardbags:[[16.4, 3.8, -3.9], [18.9, 3.4, -2.3], true],    // up on the door-end bay's top level: white carry bags and the black crate
  yardfluidscard:[[17.5, 1.3, -1.45], [18.9, 1.0, -1.29], true, 'Fluids and a lantern'],   // same, card open
  yardjerry:[[16.7, 1.2, -11.5], [18.4, .4, -12.4], true],    // the far-end bay of the yard-bay run, bottom level: blue totes, jerry cans, folded sheeting (2 Nov, Y3a)
  yardtotecard:[[16.7, 1.2, -11.5], [18.4, .4, -12.4], true, 'Storage boxes'],   // same, with the Storage boxes card open
  yardjerrycard:[[16.7, 1.2, -11.5], [18.4, .4, -12.4], true, 'Jerry cans'],   // same, with the Jerry cans tap card open (4th item = card to open; BEFORE has none, so no card)
  baydoor: [[14.9, 2.3, -5.4], [18.4, 1.5, -1.8], true],     // yard-bay bay 5 by the door (z −3.13…−0.35)
  stockclose: [[16.9, 1.3, -9.0], [18.4, .75, -10.4], true],    // close on bay 2's lower shelf: what's stacked on it
  doorbay: [[16.4, 2.2, -5.6], [16.6, 1.5, -1.2], true],       // the door-wall orange bay (x 15.2–18.1), seen from the hall
  yellowback: [[16.0, 2.3, -10.6], [16.0, 1.5, -15.4], true],   // the yellow run across the back of the yard bay (x 13.6–18.5)
  backclose: [[15.3, 1.35, -12.9], [15.0, .8, -15.1], true],    // close on its lower shelf
  wsfront: [[10.4, 2.0, -2.0], [6.0, 1.3, -3.4], true],     // the workshop's aisle wall at the door end, from across the aisle: OSB, window, door
  wsclose: [[7.5, 1.55, -3.3], [6.0, 1.15, -4.9], true],     // close on the workshop's aisle wall: OSB sheets, joints, screws, the door
  wsend: [[8.8, 2.0, -14.2], [6.0, 1.5, -11.4], true],       // the far end of the workshop wall past the yellow racking, sewing-room wall above
  toolwall: [[12.2, 2.7, -8.05], [7.2, 2.3, -8.05], true],    // the yellow racking on the workshop wall, whole run from across the aisle
  toolhigh: [[9.8, 3.9, -6.6], [6.9, 3.5, -9.2], true],      // its top two levels
  toolclose: [[8.7, 1.25, -8.4], [7.0, .75, -10.1], true],   // close on its lower shelves, far bay
  canvasclose:[[3.4, 1.5, -20.0], [1.0, 1.0, -21.6], true],   // the red 14 ft canvas covers on the left wall
  sidedoor: [[12.0, 2.0, -6.8], [14.2, 1.3, 0.0], true],     // the door wall's side door (x 13.2–15.1) and the floor-panel pile in front of it
  panelclose:[[12.4, 1.5, -5.2], [14.0, .7, -3.45], true],   // close on the floor-panel pile
  mezz: [[12.6, 3.6, -1.6], [5.0, 3.5, -8.0], true],          // the workshop and the sewing room on top, from across the aisle by the door
  leftstacks:[[10.5, 3.6, -13.6], [3.6, 1.4, -21.6], true],  // the left-side stacks at z −18…−26 from the aisle: wall stillages, the cling-filmed stillage stacks
  leftside: [[9.2, 2.2, -21.0], [3.0, 1.6, -21.0], true],    // square on to them from mid-aisle
  leftclose: [[7.6, 1.6, -20.9], [4.6, 1.1, -22.4], true],   // close on the stack ends and the gap between them
  leftrack: [[5.2, 3.5, -14.9], [1.0, 2.5, -18.2], true],    // the left-wall racking bay at z −16.65…−19.4, from the aisle over the safari crates (17 Oct 03:xx)
  leftrackhi:[[3.9, 2.6, -16.0], [1.0, 3.6, -18.4], true],   // up close under its top two levels
  leftfar: [[6.4, 2.3, -24.0], [1.6, 1.2, -26.6], true],     // the pale sheeted block at z −25.1…−28.3 and the red pole stillages by it
  bandgap:  [[9.0, 2.5, -20.7], [1.5, 2.7, -20.6], true],    // through the walkway gap between the wrapped piles to the left band at z −19.3…−21.8 (23 Oct)
  bandgaphi:[[6.8, 4.4, -20.1], [1.6, 3.4, -20.7], true],    // the same band bay from higher up: deck, stock to 5 m
  bandhigh: [[7.6, 3.4, -27.2], [2.8, 3.0, -23.0], true],   // the left band's high bay at z −21.8…−25 (deck ≈ 2.4 m, stock to 5 m), over the single wrapped pile (17 Oct 06:xx)
  bandclose:[[4.8, 3.9, -26.0], [2.6, 3.5, -23.3], true],   // up close on its top level
  cream: [[8.0, 2.3, -20.7], [3.4, 1.9, -20.6], true],      // through the walkway between the wrapped piles: the cream sheeted stack at z −20…−21.1
  wsin: [[3.4, 2.05, -12.2], [3.1, 1.25, -5.2], true],             // inside the workshop from the far end, looking to the front (the "Workshop (inside)" button's view, 17 Oct)
  wsfrontin: [[2.0, 2.0, -7.9], [3.0, 1.0, -2.8], true],      // under the low ceiling: front bench, centre table, vice bench, banner
  wstool: [[3.3, 1.6, -9.6], [3.0, 1.35, -12.9], true],      // the far wall: tool wall, roll cabinet, extinguisher, way out
  wspeg:    [[3.45, 1.62, -11.75], [3.35, 1.5, -12.9], true],   // close on the pegboard: hammers, spanners, hand saws, clamps (23 Oct)
  wsspan:   [[3.08, 1.62, -12.45], [3.08, 1.6, -12.88], true],   // close on the spanner row on the pegboard (24 Oct 05:xx)
  wscab:    [[2.45, 1.45, -11.3], [1.45, .8, -12.6], true],     // close on the roll cabinet and the low cupboard, far left corner (23 Oct 05:xx)
  wsbin:    [[3.95, 1.35, -7.55], [3.25, .35, -8.45], true],     // close on the offcuts bin (23 Oct 05:xx)
  wshook:   [[3.62, 1.92, -12.5], [3.68, 1.86, -12.88], true],    // close on the hand-saw handles and their hooks (24 Oct 07:xx: hooks on the hole grid)
  wsham:    [[2.35, 1.72, -12.38], [2.35, 1.64, -12.88], true],    // close on the five hammers (25 Oct 00:xx)
  wsash:    [[2.24, 1.66, -12.5], [2.24, 1.6, -12.88], true],      // close on the plain-ash hammer, left of wsham's centre (31 Oct 06:xx)
  wsclamp:  [[4.05, 1.6, -11.95], [4.15, 1.5, -12.9], true],     // close on the pegboard's right half: F-clamps, saws (23 Oct 05:xx)
  wssaw:    [[3.75, 1.6, -7.45], [3.2, 1.15, -6.7], true],      // close on the mitre-saw bench (23 Oct 06:xx)
  wsmitre:  [[2.62, 1.42, -7.05], [3.22, 1.15, -6.66], true],    // the mitre saw from its blade side: blade, hood, lower guard, fence, pivot casting (25 Oct 02:xx)
  wscomp:   [[4.95, 1.05, -10.35], [4.25, .3, -11.2], true],    // close on the compressor (23 Oct 06:xx)
  wscompc:  [[3.85, .98, -11.92], [4.2, .45, -11.2], true],   // the compressor from its gauge side (tool-wall side): pump, crankcase, discharge pipe, gauges, switch (25 Oct 03:xx)
  wsvice:   [[1.75, 1.55, -3.0], [.85, 1.0, -3.5], true],       // close on the vice at the front of the left-wall bench (23 Oct 06:xx)
  wsdoor:   [[2.15, 1.05, -3.75], [1.15, .5, -4.55], true],      // close on the cupboard doors under the vice bench: panels, pulls, grime (27 Oct 00:xx)
  wsadoor:  [[4.55, .98, -5.55], [5.3, .5, -6.3], true],      // close on the long aisle bench's cupboard doors: pulls, their shadows, grime (30 Oct 06:xx)
  wsvicec:  [[1.72, 1.36, -2.98], [1.22, 1.0, -3.5], true],      // closer, the whole vice in a phone frame: casting, jaws, screw, tommy bar (25 Oct 01:xx)
  wsdrill:  [[1.95, 1.55, -3.55], [1.85, 1.02, -2.75], true],   // close on the front bench: two drills, a tool case (23 Oct)
  wsaisle: [[2.6, 1.9, -9.0], [5.9, 1.1, -7.2], true],       // the long aisle bench and its shelves, the window
  wsedge:   [[4.62, 1.08, -6.75], [5.31, .9, -7.45], true],      // close on the long aisle bench's dark front edge strip (27 Oct 02:xx)
  wstop:    [[5.05, 1.75, -8.05], [5.62, .95, -8.1], true],     // looking down on the long aisle bench's top by the post: tub, case, contact shadows (27 Oct 23:xx)
  wspost:   [[4.95, 1.4, -7.05], [5.85, .93, -7.62], true],     // close on where the mezzanine post meets the long aisle bench's top (27 Oct 06:xx)
  wsrail:   [[4.75, 1.55, -3.1], [5.95, 1.15, -6.4], true],     // along the aisle wall's socket conduit from the door end (28 Oct 06:xx)
  wsrailend:[[4.7, 1.5, -10.6], [5.95, 1.15, -12.6], true],    // the conduit's far end by the back corner (28 Oct 06:xx)
  wscase:   [[4.92, 1.2, -7.72], [5.6, .99, -8.12], true],    // low on the front of the tool case on the long bench by the post: latches, bumpers, grip (28 Oct 04:xx)
  wsleft: [[4.4, 2.0, -8.0], [0.6, 1.1, -9.4], true],
  wsfoot: [[2.75, .5, -8.5], [1.9, .12, -9.4], true],     // low, close on the tall shelving's near feet: slotted angle meeting the floor (1 Nov)        // the tall shelving on the left wall, sheet stock, offcuts bin
  wsout: [[6.2, 1.8, -14.8], [5.2, 1.1, -12.9], true],       // the far wall's doorway from the hall
  wswin: [[1.7, 1.75, -5.6], [5.6, 1.05, -3.9], true],        // the front window from inside: daylight on the long bench and the floor (W5b, 23 Oct 00:xx)
  wsconc:   [[4.3, 1.25, -7.9], [3.4, 0, -9.6], true],       // low over the workshop floor between the benches: concrete grain, sawdust, contact shadows (28 Oct 01:xx)
  wsfloor: [[3.5, 3.45, -9.85], [3.5, 0, -9.9], true],      // straight down on the back half of the workshop floor: contact shadows under the compressor, bin and buckets
  wsboard: [[4.3, 1.75, -5.2], [4.3, 1.55, -2.5], true],    // the front wall over the front bench: whiteboard, calendar, notice; the window light on the floor (23 Oct, W5b)
  wscal:   [[4.45, 1.45, -3.35], [4.78, 1.36, -2.5], true],     // close on the wall calendar from the front bench, a little to its left: curl, binding, nail, shadow (29 Oct 04:xx)
  wssigns: [[3.0, 2.8, -9.6], [3.2, 2.5, -12.9], true],     // the far wall above the tool wall: eye/ear signs, no smoking over the doorway
  wallstack: [[4.0, 1.9, -13.0], [0.8, 1.0, -15.4], true],     // the trellis wall stack on the left wall, z −14…−16.4, from the aisle side (6 Nov 23:xx)
  door16: [[12.3, 1.55, -23.2], [14.5, .45, -25.4], true],     // the 16 ft trellis + door stillages in front of the bag racks, from the aisle (7 Nov 02:xx: low loads' film)
  door16close: [[13.2, 1.0, -24.0], [14.5, .4, -25.0], true],  // close on one 16 ft stillage's corner: film, door set, frame
  wallstackclose: [[2.9, 1.3, -14.0], [0.9, .9, -15.6], true], // close on its levels: loads, film, frames (6 Nov 23:xx)
  tallface: [[6.8, 3.7, -26.4], [1.0, 3.3, -26.6], true],   // the left band's tall bay above the pale sheeted block, z −25…−28.2 (17 Oct 07:xx)
  tallclose:[[3.6, 4.1, -25.4], [0.9, 3.7, -27.0], true],   // up close on its two upper levels
};
const want = only ? only.split(',') : ['door', 'up', 'roofclose', 'far'];
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const errs = [], log = [];
  for (const [n, W, H] of sizes) {
    const p = await b.newPage({ viewport: { width: W, height: H } });
    p.on('pageerror', e => errs.push(n + ': ' + e.message));
    p.on('console', m => { log.push(n + ' ' + m.type() + ': ' + m.text()); if (m.type() === 'error' && !/ERR_FAILED/.test(m.text())) errs.push(n + ': ' + m.text()); });
    await p.route(/cdn\.jsdelivr\.net/, r => { const m = r.request().url().match(/three@[^/]+\/(.*)$/); return m ? r.fulfill({ path: C + 'three-r180/' + m[1], contentType: 'text/javascript' }) : r.abort(); });
    await p.route(/fonts\./, r => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));   // 6 Nov: was abort(), which logs ERR_FAILED on every run and cost a checker FAIL
    const t0 = Date.now();
    const died = new Promise((_, no) => p.on('pageerror', e => no(new Error(n + ' page error before ready: ' + e.message))));   // fail fast instead of a 300 s timeout
    await p.goto('file://' + path.resolve(page), { waitUntil: 'commit' }); await Promise.race([p.waitForFunction(() => window.__ready, null, { timeout: 300000 }), died]);
    log.push(`${n}: ready in ${((Date.now() - t0) / 1000).toFixed(1)} s`);
    const dbg = await p.evaluate(() => ({ topShadows: window.__topShadow, pegShadowPx: window.__pegShadowPx })); if (dbg.topShadows) log.push(`${n}: worktop shadow sheets [x0, z0, x1, z1, y, items] ${JSON.stringify(dbg.topShadows)}`);   // 28 Oct: bake checks in the console file
    for (const v of want) {
      const V = VIEWS[v];
      if (typeof V === 'string') { await p.evaluate(k => window.__view(k), V); await p.waitForTimeout(1800); }
      else await p.evaluate(a => window.__cam(...a), V.slice(0, 3));
      await p.evaluate(() => window.__pick && window.__pick('\u0000none'));   // card closed unless the view names one
      if (Array.isArray(V) && V[3]) { await p.waitForTimeout(1200); await p.evaluate(n => { const l = [...document.querySelectorAll('#labels .lb')].find(d => d.textContent === n && d.style.display !== 'none' && d.offsetParent !== null); if (l) l.click(); }, V[3]); }   // 4th item: tap that label as seen on screen (BEFORE has none, so no card)
      await p.waitForTimeout(700);
      await p.screenshot({ path: `${pre}-${n}-${v}.png`, timeout: TMO });
    }
    await p.close();
  }
  log.push('page errors: ' + JSON.stringify(errs));
  fs.writeFileSync(pre + '-console.txt', log.join('\n') + '\n');
  console.log('errors', JSON.stringify(errs)); await b.close();
})();
