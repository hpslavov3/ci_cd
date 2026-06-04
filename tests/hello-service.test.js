const cds = require('@sap/cds/lib');
const path = require('path');

describe('Hello Service', () => {
    let srv;

    beforeAll(async () => {
        // Load the CDS model
        const csn = await cds.load(path.join(__dirname, '../srv/hello-service.cds'));

        // Deploy the model to an in-memory database
        await cds.deploy(csn);

        // Get the service
        srv = await cds.serve('HelloService').from(csn);
    });

    test('sayHello returns correct message', async () => {
        const result = await srv.tx().send('sayHello');
        expect(result).toBe('Hello World from SAP Build Code CI/CD!');
    });
});