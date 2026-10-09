export interface SalesReport {
  summary: {
    orderCount: number
    deliveredOrderCount: number
    orderedValuePaise: number
    deliveredSalesPaise: number
    collectedCodPaise: number
    pendingCodPaise: number
  }
  topProducts: { productId: string; name: string; deliveredQuantity: number; deliveredSalesPaise: number }[]
  dailySales: {
    from: string
    to: string
    days: { date: string; orderCount: number; orderedValuePaise: number }[]
  }
}
