using com.example.books from '../db/schema';

/**
 * Simple Books Service exposed via OData V4.
 * Endpoint: /odata/v4/books
 */
service BooksService {

  @readonly
  entity Books as projection on books.Books;

  action   addBook(title : String, author : String, price : Decimal) returns Books;
  function totalStock()                                              returns Integer;
}
