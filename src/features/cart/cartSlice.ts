import {
  createAsyncThunk,
  createSlice,
  PayloadAction,
  createSelector,
} from "@reduxjs/toolkit";
import { checkout } from "../../app/api";
import type { RootState } from "../../app/store";

type checkoutState = "READY" | "LOADING" | "ERROR" | "SUCCESS";

export interface CartState {
  items: { [productID: string]: number };
  checkoutState: checkoutState;
  errorMessage: string;
}

const initialState: CartState = {
  items: {},
  checkoutState: "READY",
  errorMessage: "",
};

export const checkoutCart = createAsyncThunk(
  "cart/checkout",
  async (_, thunkAPI) => {
    const state = thunkAPI.getState() as RootState;
    const items = state.cart.items;
    const response = await checkout(items);
    return response;
  }
);

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    addToCart(state, action: PayloadAction<string>) {
      const id = action.payload;
      if (state.items[id]) {
        state.items[id]++;
      } else {
        state.items[id] = 1;
      }
    },
    removeFromCart(state, action: PayloadAction<string>) {
      delete state.items[action.payload];
    },
    updateQuantity(
      state,
      action: PayloadAction<{ id: string; quantity: number }>
    ) {
      const { id, quantity } = action.payload;
      state.items[id] = quantity;
    },
  },
  extraReducers: function (builder) {
    builder.addCase(checkoutCart.pending, (state) => {
      state.checkoutState = "LOADING";
    });
    builder.addCase(
      checkoutCart.fulfilled,
      (state, action: PayloadAction<{ success: boolean }>) => {
        const { success } = action.payload;
        if (success) {
          state.checkoutState = "READY";
          state.items = {};
        } else {
          state.checkoutState = "ERROR";
        }
      }
    );
    builder.addCase(checkoutCart.rejected, (state, action) => {
      state.checkoutState = "ERROR";
      state.errorMessage = action.error.message || "";
    });
  },
});

export const { addToCart, removeFromCart, updateQuantity } = cartSlice.actions;
export default cartSlice.reducer;

export function getNumItems(state: RootState): number {
  return Object.values(state.cart.items).reduce((a, b) => a + b, 0);
}

export const getMemoizedNumItems = createSelector(
  (state: RootState) => state.cart.items,
  (items) => {
    return Object.values(items).reduce((a, b) => a + b, 0);
  }
);

export const getTotalPrice = createSelector(
  (state: RootState) => state.cart.items,
  (state: RootState) => state.products.products,
  (items, products) => {
    const totalAmount = Object.entries(items).reduce(
      (total, [id, numItems]) => {
        const product = products[id];
        return total + product.price * numItems;
      },
      0
    );
    return totalAmount.toFixed(2);
  }
);
