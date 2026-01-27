import { AuthModel } from "../models/AuthModel.js";
import { DataModel } from "../models/DataModel.js";
import { UIView } from "../view/UIView.js";

export class AppController {
    constructor() {
        this.authModel = new AuthModel();
        this.dataModel = new DataModel();
        this.view = new UIView();
        
        this.currentCategory = "all";
    }

    async init() {
        console.log("🚀 App Started (MVC)");

        // 1. Setup Auth
        this.setupAuthListeners();
        this.authModel.monitorAuthState((user, isAdmin) => {
            this.view.updateAuthUI(user, isAdmin);
            // Това тук сработва, но понякога ПРЕДИ данните да са дошли, затова е празно
            this.refreshPageData(user); 
        });

        // 2. Setup Data
        await this.dataModel.fetchAllData();
        
        // 🔥 НОВО: Веднага покажи данните, след като са заредени!
        this.refreshPageData(this.authModel.currentUser);

        // 3. Setup UI (Dark mode, Tabs, etc)
        this.setupUIListeners();
        this.setupRoutingLogic(); 
    }

    // --- LOGIC: Routing (Какво да заредим?) ---
    refreshPageData(user) {
        // Ако сме на Index (Хладилник)
        if (document.getElementById("productList")) {
            this.filterProducts();
        }
        // Ако сме на Recipes (Рецепти)
        if (document.getElementById("recipeGrid")) {
            this.loadRecipesPage(user, false);
        }
        // Ако сме на Profile
        if (document.getElementById("favGrid")) {
            this.loadRecipesPage(user, true); // True = само любими
        }
    }

    // --- LOGIC: Products & Cart (Index) ---
    setupRoutingLogic() 
    {
        // 1. Търсачка
        const searchInput = document.getElementById("searchInput");
        if (searchInput) {
            searchInput.addEventListener("input", () => this.filterProducts());
        }

        // 2. Филтри (Чипове)
        const chips = document.querySelectorAll(".chip");
        chips.forEach(chip => {
            chip.addEventListener("click", (e) => {
                chips.forEach(c => c.classList.remove("active"));
                e.target.classList.add("active");
                this.currentCategory = e.target.dataset.category;
                this.filterProducts();
            });
        });

        // 3. Бутон "Изчисти количката"
        const clearBtn = document.getElementById("clearBtn");
        if (clearBtn) clearBtn.onclick = () => {
            this.dataModel.clearCart();
            this.view.updateCartUI([], null);
            this.view.showToast("Кошницата е изчистена", "info");
        };

        // 4. Бутон "ГОТВИ"
        const genBtn = document.getElementById("generateBtn");
        if (genBtn) genBtn.onclick = () => this.handleGenerateRecipe();

        // 5. 🔥 НОВО: Логика за Модала за Готвене
        // Затваряне от Х-чето
        if (this.view.elements.closeCookingBtn) {
            this.view.elements.closeCookingBtn.onclick = () => this.view.toggleCookingModal(false);
        }

        // Затваряне при клик извън прозореца (на тъмното)
        window.addEventListener("click", (e) => {
            if (this.view.elements.cookingModal && e.target === this.view.elements.cookingModal) {
                this.view.toggleCookingModal(false);
            }
        });
        const closeCook = document.querySelector(".close-cooking");
        const cookModal = document.getElementById("cookingModal");
        
        if (closeCook) closeCook.onclick = () => this.view.toggleCookingModal(false);
        window.onclick = (e) => {
            if (e.target === cookModal) this.view.toggleCookingModal(false);
        };
    }
    filterProducts() {
        const term = document.getElementById("searchInput")?.value.toLowerCase() || "";
        const filtered = this.dataModel.products.filter(p => {
            return p.name.toLowerCase().includes(term) && 
                   (this.currentCategory === "all" || p.category === this.currentCategory);
        });
        
        // Call View render
        this.view.renderProducts(filtered, (product) => {
            const res = this.dataModel.addToCart(product);
            this.view.updateCartUI(this.dataModel.cart, (id) => {
                this.dataModel.removeFromCart(id);
                this.view.updateCartUI(this.dataModel.cart, null);
            });
            this.view.showToast(`${res.product.name} добавен!`, "success");
        });
    }
    // --- LOGIC: Recipes Page ---
     handleGenerateRecipe() {
        // 1. Използваме новия метод за търсене (ще го добавим в DataModel след малко)
        const result = this.dataModel.findAllMatchingRecipes();

        if (result.status === "empty") {
            this.view.showToast("Кошницата е празна!", "error");
            return;
        }

        if (result.status === "none") {
            this.view.showToast("Няма подходящи рецепти.", "info");
        }

        // 2. Отваряме модала и показваме резултатите
        this.view.renderCookingResults(result);
        this.view.toggleCookingModal(true);
    }
    

    async handleFavToggle(title, btnElement) {
        if (!this.authModel.currentUser) {
            this.view.showToast("Влезте в профила си!", "info");
            this.view.toggleAuthModal(true);
            return;
        }

        const isFav = btnElement.classList.contains("is-favorite");
        try {
            await this.dataModel.toggleFavorite(this.authModel.currentUser.uid, title, !isFav);
            btnElement.classList.toggle("is-favorite");
            
            // Ако сме в профила и махнем любима -> веднага я скриваме
            if(isFav && document.getElementById("favGrid")) {
                btnElement.closest(".recipe-card").remove();
            }
            
            this.view.showToast(isFav ? "Премахнато" : "Добавено", "success");
        } catch(e) { console.error(e); }
    }

    // --- LOGIC: Admin ---
    setupAdminLogic() {
        const addBtn = document.getElementById("addProductBtn");
        if (addBtn) {
            addBtn.addEventListener("click", async () => {
                const name = document.getElementById("prodName").value;
                const cal = document.getElementById("prodCal").value;
                // ... събираш другите полета
                
                if(!name) return this.view.showToast("Име?", "error");

                try {
                    await this.dataModel.addProductToDb({
                        name, 
                        calories: Number(cal),
                        category: document.getElementById("prodCat").value,
                        // Добави и другите (protein, fat...)
                    });
                    this.view.showToast("Успешно добавено!", "success");
                    this.view.toggleAdminModal(false);
                    setTimeout(() => window.location.reload(), 1000);
                } catch(e) { this.view.showToast("Грешка", "error"); }
            });
        }
    }

    // --- LOGIC: Auth UI Listeners ---
    setupAuthListeners() {
        // Modal Open/Close
        const btn = document.getElementById("authBtn");
        if(btn) btn.onclick = () => {
            if(this.authModel.currentUser) this.authModel.logout();
            else this.view.toggleAuthModal(true);
        };

        const closeBtns = document.querySelectorAll(".close, .close-admin");
        closeBtns.forEach(b => b.onclick = () => {
            this.view.toggleAuthModal(false);
            this.view.toggleAdminModal(false);
        });

        // Login Logic
        const loginBtn = document.getElementById("loginSubmitBtn");
        if(loginBtn) loginBtn.onclick = async () => {
            const email = document.getElementById("loginEmail").value;
            const pass = document.getElementById("loginPass").value;
            this.view.setLoading(loginBtn, true);
            try {
                await this.authModel.login(email, pass);
                this.view.showToast("Успешен вход!", "success");
                this.view.toggleAuthModal(false);
            } catch(e) { 
                this.view.showToast("Грешка!", "error"); 
                this.view.shakeModal();
            } finally {
                this.view.setLoading(loginBtn, false);
            }
        };

        // Register Logic
        const regBtn = document.getElementById("regSubmitBtn");
        if(regBtn) regBtn.onclick = async () => {
             const email = document.getElementById("regEmail").value;
             const pass = document.getElementById("regPass").value;
             try {
                 await this.authModel.register(email, pass);
                 this.view.showToast("Регистриран!", "success");
                 this.view.toggleAuthModal(false);
             } catch(e) { this.view.showToast(e.message, "error"); }
        };

        // Tabs & Eyes Logic (Copy-Paste from previous steps)
        this.setupTabsAndEyes();
        this.setupAdminLogic();
    }

    setupUIListeners() {
        // Dark Mode
        const toggle = document.querySelector('.theme-switch input');
        const theme = localStorage.getItem('theme');
        if(theme) document.body.classList.add(theme);
        if(theme === 'dark-mode' && toggle) toggle.checked = true;

        if(toggle) toggle.onchange = (e) => {
            if(e.target.checked) {
                document.body.classList.add('dark-mode');
                localStorage.setItem('theme', 'dark-mode');
            } else {
                document.body.classList.remove('dark-mode');
                localStorage.setItem('theme', 'light-mode');
            }
        };
    }

    setupTabsAndEyes() {
        const tabLogin = document.getElementById("tabLogin");
        const tabRegister = document.getElementById("tabRegister");
        const loginForm = document.getElementById("loginForm");
        const registerForm = document.getElementById("registerForm");

        if (tabLogin && tabRegister) {
            tabLogin.onclick = () => {
                loginForm.style.display = "block";
                registerForm.style.display = "none";
                tabLogin.classList.add("active");
                tabRegister.classList.remove("active");
            };
            tabRegister.onclick = () => {
                loginForm.style.display = "none";
                registerForm.style.display = "block";
                tabRegister.classList.add("active");
                tabLogin.classList.remove("active");
            };
        }
         function setupEye(toggleId, inputId) {
        const eyeBtn = document.getElementById(toggleId);
        const input = document.getElementById(inputId);
        if (eyeBtn && input) {
            eyeBtn.addEventListener("click", () => {
                const type = input.getAttribute("type") === "password" ? "text" : "password";
                input.setAttribute("type", type);
                eyeBtn.classList.toggle("fa-eye");
                eyeBtn.classList.toggle("fa-eye-slash");
            });
        }
    }
    setupEye("toggleLoginPass", "loginPass");
    setupEye("toggleRegPass", "regPass");
    }
}