import { describe, expect, it } from "vitest";

import { decodeGarageBuild, encodeGarageBuild } from "@/lib/garage/build-url";
import type { GarageBuildIds } from "@/lib/garage/default-assembly";

describe("build-url", () => {
  const fallback: GarageBuildIds = {
    rightArm: 1,
    leftArm: 2,
    rightBack: 3,
    leftBack: 4,
    head: 5,
    core: 6,
    arms: 7,
    legs: 8,
    booster: 9,
    fcs: 10,
    generator: 11,
    expansionId: 12,
  };
  const validIds = new Set(
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 99],
  );

  it("round-trips encode/decode", () => {
    const enc = encodeGarageBuild(fallback);
    expect(enc).toBe("1-2-3-4-5-6-7-8-9-10-11-12");
    const dec = decodeGarageBuild(enc, validIds, fallback);
    expect(dec).toEqual(fallback);
  });

  it("rejects bad token count and invalid ids", () => {
    expect(decodeGarageBuild("1-2-3", validIds, fallback)).toEqual(fallback);
    expect(decodeGarageBuild("1-2-3-4-5-6-7-8-9-10-11-999", validIds, fallback)).toEqual(
      fallback,
    );
  });
});
