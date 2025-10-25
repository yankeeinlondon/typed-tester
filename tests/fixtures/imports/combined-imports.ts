// File with combined imports (runtime + type symbols mixed)

// Combined: both User (type) and fetchUser (function) in one import
import { type User, fetchUser } from "./types-and-functions";

// Combined: multiple mixed symbols
import {
  type Product,
  type Category,
  addProduct,
  deleteProduct
} from "./products";

// This is the pattern we want to detect as problematic
const user: User = { id: 1, name: "Test" };
const result = fetchUser(1);
const newProduct = addProduct({ id: 1, name: "Widget" });
