const app_server = require("express").Router();
const user_router = require("./controller/user-controller.js");
const contact_router = require("./controller/contact-controller.js");
const apiKey_router = require("./controller/apikey-controller.js");
const company_router = require("./controller/company-controller.js");
const CombinedAuth = require("./middleware/Auth.js");
const { router: mailer_router }  = require("./controller/mailer.js");

app_server.use("/", apiKey_router);
app_server.use("/users", user_router);
app_server.use("/contacts", CombinedAuth, contact_router);
app_server.use("/companies", CombinedAuth, company_router);
app_server.use("/companies", CombinedAuth, company_router);
app_server.use("/api", mailer_router);

module.exports = app_server;
