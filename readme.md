# CAP Multi-Stack Project

A monorepo containing three SAP BTP applications deployable via a single `mta.yaml`:

| Module | Tech | Port (local) | Endpoint |
|---|---|---|---|
| `cap-java-srv` | CAP Java + Spring Boot | `8080` | `/odata/v4/books` |
| `cap-node-srv` | CAP Node.js | `4004` | `/odata/v4/products` |
| `ui5-app` | SAP UI5 (standalone) | `8888` | — |

---

## Prerequisites

| Tool | Version |
|---|---|
| Java JDK | 17+ |
| Maven | 3.8+ |
| Node.js | 18+ |
| npm | 9+ |
| `@sap/cds-dk` (global) | `npm i -g @sap/cds-dk` |
| `@ui5/cli` (global) | `npm i -g @ui5/cli` |
| `mbt` (for MTA build) | `npm i -g mbt` |

---

## Run Locally

### 1. CAP Java Service

```bash
cd cap-java
mvn spring-boot:run
# → http://localhost:8080/odata/v4/books
```

### 2. CAP Node.js Service

```bash
cd cap-node
npm install
cds watch
# → http://localhost:4004/odata/v4/products
```

### 3. UI5 Frontend

```bash
cd ui5-app
npm install
npx ui5 serve
# → http://localhost:8888
```

The UI5 app proxies the Java service at `/java-api` and the Node service at `/node-api`
via the `ui5.yaml` middleware configuration (local dev only).

---

## Run Tests

### CAP Java – JUnit

```bash
cd cap-java
mvn test
```

### CAP Node.js – Jest

```bash
cd cap-node
npm test
```

### UI5 – QUnit

```bash
cd ui5-app
npm test
# Opens: http://localhost:8080/test/unit/unitTests.qunit.html
```

---

## Build MTA Archive (for BTP deployment)

```bash
# from project root
mbt build
# produces: mta_archives/cap-multi-stack_1.0.0.mtar
```

---

## Project Structure

```
cap-multi-stack/
├── mta.yaml                      ← single deployment descriptor
├── cap-java/                     ← CAP Java service
│   ├── pom.xml
│   ├── srv/books-service.cds
│   └── src/
│       ├── main/java/com/example/
│       │   ├── Application.java
│       │   └── handlers/BooksHandler.java
│       └── test/java/com/example/
│           └── BooksServiceTest.java
├── cap-node/                     ← CAP Node.js service
│   ├── package.json
│   ├── srv/products-service.cds
│   ├── srv/products-service.js
│   └── test/products.test.js
└── ui5-app/                      ← Standalone SAP UI5 app
    ├── package.json
    ├── ui5.yaml
    └── webapp/
        ├── index.html
        ├── manifest.json
        ├── controller/App.controller.js
        ├── view/App.view.xml
        ├── model/DataService.js
        └── test/
            ├── unit/unitTests.qunit.html
            ├── unit/controller/App.controller.test.js
            └── integration/opaTests.qunit.html
```
