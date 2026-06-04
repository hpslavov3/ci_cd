module.exports = (srv) => {
   srv.on('sayHello', () => { return 'Hello World from SAP Build Code CI/CD!'; 
   });
};