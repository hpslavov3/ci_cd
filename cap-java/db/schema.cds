namespace com.example.books;

entity Books {
  key ID     : Integer;
      title  : String(100);
      author : String(100);
      stock  : Integer;
      price  : Decimal(9, 2);
}
