export interface CartLine {
  productId: string;
  quantity: number;
  type: "PRODUCT" | "DEAL";
}

export interface DealDefinition {
  id: string;
  price: number;
  productOnDeal: { productId: string; quantity: number }[];
}

export interface ExpandedCart {
  /** Cantidad total por producto a reservar/entregar (incluye lo que viene de deals). */
  prods: { productId: string; quantity: number }[];
  /** Cantidad por producto que se cobra individualmente — excluye las unidades ya pagadas dentro de un deal. */
  chargeableQuantities: Record<string, number>;
  /** Suma de precio * cantidad de los deals comprados. */
  dealsTotal: number;
}

export function expandDealsIntoProducts(cart: CartLine[], deals: DealDefinition[]): ExpandedCart {
  const quantities: Record<string, number> = {};
  const chargeableQuantities: Record<string, number> = {};

  for (const line of cart) {
    if (line.type !== "PRODUCT") continue;
    quantities[line.productId] = (quantities[line.productId] ?? 0) + line.quantity;
    chargeableQuantities[line.productId] = (chargeableQuantities[line.productId] ?? 0) + line.quantity;
  }

  let dealsTotal = 0;
  for (const line of cart) {
    if (line.type !== "DEAL") continue;
    const deal = deals.find((d) => d.id === line.productId);
    if (!deal) continue;
    dealsTotal += deal.price * line.quantity;
    for (const component of deal.productOnDeal) {
      const dealUnits = component.quantity * line.quantity;
      quantities[component.productId] = (quantities[component.productId] ?? 0) + dealUnits;
      // No tocamos chargeableQuantities: esas unidades ya están pagadas vía el precio del deal.
    }
  }

  return {
    prods: Object.entries(quantities).map(([productId, quantity]) => ({ productId, quantity })),
    chargeableQuantities,
    dealsTotal,
  };
}

export function sumChargeableTotal(
  chargeableQuantities: Record<string, number>,
  productPrices: Record<string, number>,
): number {
  let total = 0;
  for (const [productId, quantity] of Object.entries(chargeableQuantities)) {
    const price = productPrices[productId];
    if (price != null) {
      total += price * quantity;
    }
  }
  return total;
}
