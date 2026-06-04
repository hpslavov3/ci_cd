package com.example;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Integration tests for the BooksService OData V4 endpoint.
 *
 * Uses Spring Boot's built-in MockMvc (no SAP-specific test starter needed).
 * An in-memory SQLite database is configured in application.properties and
 * seeded from db/data/com.example.books-Books.csv by the CDS runtime.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
class BooksServiceTest {

    private static final String BOOKS_URL = "/odata/v4/books/Books";

    @Autowired
    private MockMvc mockMvc;

    // ── Entity read tests ─────────────────────────────────────────────────

    @Test
    @DisplayName("GET /Books returns HTTP 200 with a value array")
    void testGetBooks_returnsOk() throws Exception {
        mockMvc.perform(get(BOOKS_URL).accept(MediaType.APPLICATION_JSON))
               .andExpect(status().isOk())
               .andExpect(jsonPath("$.value").isArray());
    }

    @Test
    @DisplayName("GET /Books returns seeded books")
    void testGetBooks_returnsSeedData() throws Exception {
        mockMvc.perform(get(BOOKS_URL).accept(MediaType.APPLICATION_JSON))
               .andExpect(status().isOk())
               .andExpect(jsonPath("$.value.length()").value(greaterThanOrEqualTo(1)));
    }

    @Test
    @DisplayName("GET /Books(1) returns 'The Pragmatic Programmer'")
    void testGetBookById_returnsCorrectBook() throws Exception {
        mockMvc.perform(get(BOOKS_URL + "(1)").accept(MediaType.APPLICATION_JSON))
               .andExpect(status().isOk())
               .andExpect(jsonPath("$.title").value("The Pragmatic Programmer"))
               .andExpect(jsonPath("$.author").value("David Thomas"));
    }

    @Test
    @DisplayName("GET /Books supports $top OData query option")
    void testGetBooks_supportsTopQuery() throws Exception {
        mockMvc.perform(get(BOOKS_URL + "?$top=2").accept(MediaType.APPLICATION_JSON))
               .andExpect(status().isOk())
               .andExpect(jsonPath("$.value.length()").value(lessThanOrEqualTo(2)));
    }

    @Test
    @DisplayName("GET /Books supports $filter OData query option")
    void testGetBooks_supportsFilterQuery() throws Exception {
        mockMvc.perform(get(BOOKS_URL + "?$filter=author eq 'Robert C. Martin'")
                .accept(MediaType.APPLICATION_JSON))
               .andExpect(status().isOk())
               .andExpect(jsonPath("$.value[0].title").value("Clean Code"));
    }

    @Test
    @DisplayName("GET /Books supports $select OData query option")
    void testGetBooks_supportsSelectQuery() throws Exception {
        mockMvc.perform(get(BOOKS_URL + "?$select=title,author").accept(MediaType.APPLICATION_JSON))
               .andExpect(status().isOk())
               .andExpect(jsonPath("$.value[0].title").exists())
               .andExpect(jsonPath("$.value[0].stock").doesNotExist());
    }

    // ── Function / Action tests ───────────────────────────────────────────

    @Test
    @DisplayName("GET /totalStock() returns an integer value")
    void testTotalStock_returnsInteger() throws Exception {
        mockMvc.perform(get("/odata/v4/books/totalStock()").accept(MediaType.APPLICATION_JSON))
               .andExpect(status().isOk())
               .andExpect(jsonPath("$.value").isNumber());
    }

    @Test
    @DisplayName("POST /addBook creates and returns a new book")
    void testAddBook_createsBook() throws Exception {
        String body = """
                {
                  "title":  "Effective Java",
                  "author": "Joshua Bloch",
                  "price":  49.99
                }
                """;

        mockMvc.perform(post("/odata/v4/books/addBook")
                .contentType(MediaType.APPLICATION_JSON)
                .content(body)
                .accept(MediaType.APPLICATION_JSON))
               .andExpect(status().isOk())
               .andExpect(jsonPath("$.title").value("Effective Java"))
               .andExpect(jsonPath("$.author").value("Joshua Bloch"));
    }

    // ── Error / edge-case tests ───────────────────────────────────────────

    @Test
    @DisplayName("GET /Books(9999) returns 404 for non-existent entity")
    void testGetBook_notFound() throws Exception {
        mockMvc.perform(get(BOOKS_URL + "(9999)").accept(MediaType.APPLICATION_JSON))
               .andExpect(status().isNotFound());
    }
}
