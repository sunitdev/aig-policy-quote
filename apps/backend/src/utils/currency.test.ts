import { roundCurrency } from "./currency";

describe("roundCurrency", () => {
  it("rounds values to two decimal places", () => {
    expect(roundCurrency(8.333333333)).toBe(8.33);
    expect(roundCurrency(66.005)).toBe(66.01);
  });
});
