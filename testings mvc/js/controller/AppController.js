import { AuthModel } from "./models/AuthModel.js";
import { DataModel } from "./models/DataModel.js";
import { UIView } from "./view/UIView.js";

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
            this.refreshPageData(user); // Презарежда данните според страницата
        });

        // 2. Setup Data
        await this.dataModel.fetchAllData();
        
        // 3. Setup UI (Dark mode, Tabs, etc)
        this.setupUIListeners();
        this.setupRoutingLogic(); // Проверява на коя страница сме
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
    setupRoutingLogic() {
        // Search & Filter
        const searchInput = document.getElementById("searchInput");
        if (searchInput) {
            searchInput.addEventListener("input", () => this.filterProducts());
        }

        const chips = document.querySelectorAll(".chip");
        chips.forEach(chip => {
            chip.addEventListener("click", (e) => {
                chips.forEach(c => c.classList.remove("active"));
                e.target.classList.add("active");
                this.currentCategory = e.target.dataset.category;
                this.filterProducts();
            });
        });

        // Cart Buttons
        const clearBtn = document.getElementById("clearBtn");
        if (clearBtn) clearBtn.onclick = () => {
            this.dataModel.clearCart();
            this.view.updateCartUI([], null);
            this.view.showToast("Кошницата е изчистена", "info");
        };

        const genBtn = document.getElementById("generateBtn");
        if (genBtn) genBtn.onclick = () => this.handleGenerateRecipe();
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

    handleGenerateRecipe() {
        const result = this.dataModel.findBestRecipe();

        if (result.status === "empty") {
            this.view.showToast("Кошницата е празна!", "error");
            return;
        }

        if (result.status === "found") {
            this.view.showToast("Намерена рецепта!", "success");
            this.view.showRecipeResult(result.recipe, this.dataModel.cart, true);
        } 
        else if (result.status === "partial") {
            const names = result.missing.map(p => p.name).join(", ");
            if (confirm(`За "${result.recipe.title}" липсват: ${names}. Да ги добавя ли?`)) {
                result.missing.forEach(p => this.dataModel.addToCart(p));
                this.view.updateCartUI(this.dataModel.cart, (id) => this.dataModel.removeFromCart(id));
                this.view.showRecipeResult(result.recipe, this.dataModel.cart, true);
                this.view.showToast("Продуктите са добавени!", "success");
            }
        } 
        else {
            this.view.showToast("Няма точна рецепта.", "info");
            this.view.showRecipeResult(null, this.dataModel.cart, false);
        }
    }

    // --- LOGIC: Recipes Page ---
    async loadRecipesPage(user, onlyFavs) {
        let userFavs = [];
        if (user) {
            userFavs = await this.dataModel.getUserFavorites(user.uid);
        }
        
        let recipesToShow = this.dataModel.recipes;
        
        // Филтър за любими
        if (onlyFavs) {
            if (!user) {
                recipesToShow = []; // Не си логнат -> няма любими
            } else {
                recipesToShow = recipesToShow.filter(r => userFavs.includes(r.title));
            }
        }
        
        // Филтър бутон (само за recipes.html)
        const btnFavFilter = document.getElementById("btnFavFilter");
        if(btnFavFilter && !onlyFavs) {
            // Малка хакерска логика за тогъла
            btnFavFilter.onclick = () => {
                const isActive = btnFavFilter.classList.toggle("active");
                if(isActive) {
                    btnFavFilter.innerHTML = "📃 Покажи всички";
                    const favsOnly = this.dataModel.recipes.filter(r => userFavs.includes(r.title));
                    this.view.renderRecipesGrid(favsOnly, userFavs, this.handleFavToggle.bind(this));
                } else {
                    btnFavFilter.innerHTML = "❤️ Само любими";
                    this.view.renderRecipesGrid(this.dataModel.recipes, userFavs, this.handleFavToggle.bind(this));
                }
            };
        }

        this.view.renderRecipesGrid(recipesToShow, userFavs, this.handleFavToggle.bind(this));
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