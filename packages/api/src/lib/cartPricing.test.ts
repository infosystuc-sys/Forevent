import { describe, expect, it } from "vitest";
import { expandDealsIntoProducts, sumChargeableTotal } from "./cartPricing";

describe("expandDealsIntoProducts", () => {
  it("passes through direct products without touching deal logic", () => {
    const result = expandDealsIntoProducts(
      [{ productId: "beer", quantity: 2, type: "PRODUCT" }],
      [],
    );

    expect(result.prods).toEqual([{ productId: "beer", quantity: 2 }]);
    expect(result.chargeableQuantities).toEqual({ beer: 2 });
    expect(result.dealsTotal).toBe(0);
  });

  it("expands a pure deal purchase into its component products for stock, without charging them individually", () => {
    const result = expandDealsIntoProducts(
      [{ productId: "deal1", quantity: 2, type: "DEAL" }],
      [{ id: "deal1", price: 100, productOnDeal: [{ productId: "beer", quantity: 1 }] }],
    );

    expect(result.prods).toEqual([{ productId: "beer", quantity: 2 }]);
    expect(result.chargeableQuantities).toEqual({});
    expect(result.dealsTotal).toBe(200);
  });

  it("does not undercharge when a product is bought both directly and as part of a deal in the same order", () => {
    // Regresión: 2 cervezas sueltas + 1 combo que también trae 1 cerveza.
    // Bug original: al mezclar cantidades (3) y detectar que la cerveza "es parte de un deal",
    // se salteaba el cobro completo de las 3 unidades en vez de cobrar solo las 2 sueltas.
    const result = expandDealsIntoProducts(
      [
        { productId: "beer", quantity: 2, type: "PRODUCT" },
        { productId: "deal1", quantity: 1, type: "DEAL" },
      ],
      [{ id: "deal1", price: 100, productOnDeal: [{ productId: "beer", quantity: 1 }] }],
    );

    // Stock a reservar: 3 unidades físicas (2 sueltas + 1 del combo)
    expect(result.prods).toEqual([{ productId: "beer", quantity: 3 }]);
    // Pero solo las 2 sueltas se cobran individualmente (la del combo ya está en dealsTotal)
    expect(result.chargeableQuantities).toEqual({ beer: 2 });
    expect(result.dealsTotal).toBe(100);
  });

  it("accumulates deal-sourced quantities across multiple deals sharing a component", () => {
    const result = expandDealsIntoProducts(
      [
        { productId: "deal1", quantity: 1, type: "DEAL" },
        { productId: "deal2", quantity: 1, type: "DEAL" },
      ],
      [
        { id: "deal1", price: 100, productOnDeal: [{ productId: "beer", quantity: 1 }] },
        { id: "deal2", price: 150, productOnDeal: [{ productId: "beer", quantity: 2 }] },
      ],
    );

    expect(result.prods).toEqual([{ productId: "beer", quantity: 3 }]);
    expect(result.chargeableQuantities).toEqual({});
    expect(result.dealsTotal).toBe(250);
  });
});

describe("sumChargeableTotal", () => {
  it("sums price times quantity for each chargeable product", () => {
    const total = sumChargeableTotal({ beer: 2, wine: 1 }, { beer: 500, wine: 1200 });
    expect(total).toBe(2 * 500 + 1 * 1200);
  });

  it("ignores products with no known price", () => {
    const total = sumChargeableTotal({ beer: 2 }, {});
    expect(total).toBe(0);
  });
});
