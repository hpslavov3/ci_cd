using com.example.products from '../db/schema';

/**
 * Simple Products Service exposed via OData V4.
 * Endpoint: /odata/v4/products
 */
service ProductsService {

  entity Products as projection on products.Products;

  function  lowStock(threshold : Integer)        returns array of Products;
  action    restock(productId : Integer, qty : Integer) returns Products;
}
