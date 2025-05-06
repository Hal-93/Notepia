import { atomWithStorage } from "jotai/utils";

export const locationAtom = atomWithStorage<[number, number]>(
  "location",
  [139.759, 35.684],
  undefined,
  { getOnInit: true }
);

export const zoomAtom = atomWithStorage<number>("zoom", 16, undefined, {
  getOnInit: true,
});

export const bearingAtom = atomWithStorage<number>(
  "bearingAtom",
  0,
  undefined,
  { getOnInit: true }
);
