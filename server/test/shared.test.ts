import { describe, expect, it } from "vitest";
import {
  cartTotals,
  clampQty,
  priceRangeError,
  validateCheckout,
  validateField,
} from "shared";

describe("clampQty", () => {
  it("clamps below 1 up to 1", () => {
    expect(clampQty(0, 10)).toBe(1);
    expect(clampQty(-5, 10)).toBe(1);
  });

  it("clamps above stock down to stock", () => {
    expect(clampQty(99, 10)).toBe(10);
  });

  it("floors fractional input and survives NaN", () => {
    expect(clampQty(2.9, 10)).toBe(2);
    expect(clampQty(NaN, 10)).toBe(1);
  });
});

describe("cartTotals", () => {
  it("computes subtotal, 5% tax, and total rounded to paise", () => {
    const totals = cartTotals([
      { price: 399, qty: 2 },
      { price: 250, qty: 1 },
    ]);
    expect(totals.subtotal).toBe(1048);
    expect(totals.tax).toBe(52.4);
    expect(totals.total).toBe(1100.4);
  });

  it("returns zeros for an empty cart", () => {
    expect(cartTotals([])).toEqual({ subtotal: 0, tax: 0, total: 0 });
  });
});

describe("checkout validation", () => {
  const valid = {
    name: "Dan Tester",
    email: "dan@example.com",
    phone: "9876543210",
    address: "42 Library Lane",
    city: "Chennai",
    state: "Tamil Nadu",
    pin: "600001",
  };

  it("accepts a fully valid form", () => {
    expect(validateCheckout(valid)).toEqual({});
  });

  it("rejects malformed email, short phone, and short pin", () => {
    const errors = validateCheckout({
      ...valid,
      email: "nope",
      phone: "123",
      pin: "60000",
    });
    expect(Object.keys(errors).sort()).toEqual(["email", "phone", "pin"]);
  });

  it("requires every field", () => {
    const errors = validateCheckout({
      name: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      state: "",
      pin: "",
    });
    expect(Object.keys(errors)).toHaveLength(7);
  });

  it("rejects letters in phone and pin", () => {
    expect(validateField("phone", "98765abcde")).toBeTruthy();
    expect(validateField("pin", "60000a")).toBeTruthy();
  });
});

describe("priceRangeError", () => {
  it("accepts an empty, partial, or ascending range", () => {
    expect(priceRangeError(undefined, undefined)).toBeNull();
    expect(priceRangeError("100", undefined)).toBeNull();
    expect(priceRangeError(undefined, "500")).toBeNull();
    expect(priceRangeError("100", "500")).toBeNull();
    expect(priceRangeError("100", "100")).toBeNull();
  });

  it("rejects min greater than max", () => {
    expect(priceRangeError("500", "100")).toMatch(/greater than maximum/);
  });

  it("rejects negative bounds", () => {
    expect(priceRangeError("-50", undefined)).toMatch(/negative/);
    expect(priceRangeError(undefined, "-1")).toMatch(/negative/);
  });
});
