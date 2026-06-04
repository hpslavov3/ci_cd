namespace com.example.products;

entity Products {
  key ID          : Integer;
      name        : String(100);
      description : String(500);
      category    : String(50);
      price       : Decimal(9, 2);
      quantity    : Integer;
}
