import { AppController } from "./controller/AppController.js";

document.addEventListener("DOMContentLoaded", () => {
    const app = new AppController();
    app.init();
});