import { getResults } from "./normalize";

describe("getResults", () => {
  it("returns arrays as-is", () => {
    const payload = [{ id: 1 }, { id: 2 }];
    expect(getResults(payload)).toEqual(payload);
  });

  it("returns paginated result arrays", () => {
    const payload = { count: 2, results: [{ id: 1 }, { id: 2 }] };
    expect(getResults(payload)).toEqual(payload.results);
  });

  it("returns an empty array for unsupported payloads", () => {
    expect(getResults(null)).toEqual([]);
    expect(getResults({ message: "noop" })).toEqual([]);
  });
});
