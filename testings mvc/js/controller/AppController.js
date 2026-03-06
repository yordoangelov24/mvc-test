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

        // 1. Настройка на Auth слушателите (Login/Register)
        this.setupAuthListeners();
        
        // 2. Следим дали потребителят е админ
        this.authModel.monitorAuthState((user, isAdmin) => {
            this.view.updateAuthUI(user, isAdmin);
            
            // ВАЖНО: Тук показваме/скриваме Админ бутона (Fab)
            const adminBtn = document.getElementById("adminFab");
            if (adminBtn) {
                if (isAdmin) adminBtn.classList.add("visible");
                else adminBtn.classList.remove("visible");
            }

            // Презареждаме данните според потребителя
            this.refreshPageData(user); 
        });

        // 3. Теглим всички данни от базата
        await this.dataModel.fetchAllData();
        
        // 4. Настройка на интерфейса (Dark Mode, Модални прозорци)
        this.setupUIListeners();
        
        // 5. Логика за страниците (Търсачка, Категории)
        this.setupRoutingLogic(); 
        
        // Първоначално зареждане
        this.refreshPageData(this.authModel.currentUser);
    }

    refreshPageData(user) {
        // Ако сме на index.html (Хладилника)
        if (document.getElementById("productList")) {
            this.filterProducts();
        }
        // Ако сме на recipes.html (Рецептите)
        if (document.getElementById("recipeGrid")) {
            this.loadRecipesPage(user, false);
        }
    }

    // --- ЛОГИКА ЗА РЕЦЕПТИТЕ ---
    async loadRecipesPage(user, onlyFavorites) {
        let recipes = this.dataModel.recipes;
        let userFavs = [];

        if (user) {
            userFavs = await this.dataModel.getUserFavorites(user.uid);
        }

        if (onlyFavorites) {
            recipes = recipes.filter(r => userFavs.includes(r.title));
        }

        this.view.renderRecipesGrid(recipes, userFavs, (title, btn) => {
            this.handleFavToggle(title, btn);
        });
    }

    // --- ЛОГИКА ЗА ХЛАДИЛНИКА И НАВИГАЦИЯТА ---
    setupRoutingLogic() {
        // Търсачка
        const searchInput = document.getElementById("searchInput");
        if (searchInput) {
            searchInput.addEventListener("input", () => this.filterProducts());
        }

        // КАТЕГОРИИ (Работи и за Desktop чиповете, и за Mobile чиповете)
        // Хващаме всички бутони, които имат data-category атрибут
        const allCategoryBtns = document.querySelectorAll(".chip, .mobile-chip");
        
        allCategoryBtns.forEach(btn => {
            btn.addEventListener("click", (e) => {
                // 1. Махаме активния клас от всички бутони
                allCategoryBtns.forEach(c => c.classList.remove("active"));
                
                // 2. Взимаме избраната категория
                const cat = e.target.dataset.category;
                
                // 3. Маркираме активни всички бутони с тази категория (за да светнат и горе, и долу)
                const siblings = document.querySelectorAll(`[data-category="${cat}"]`);
                siblings.forEach(s => s.classList.add("active"));

                // 4. Филтрираме
                this.currentCategory = cat;
                this.filterProducts();
            });
        });

        // Филтър "Любими" (само в recipes.html)
        const btnFavFilter = document.getElementById("btnFavFilter");
        if (btnFavFilter) {
            btnFavFilter.addEventListener("click", () => {
                const isActive = btnFavFilter.classList.toggle("active");
                btnFavFilter.style.background = isActive ? "#d63031" : "#ff6b6b";
                this.loadRecipesPage(this.authModel.currentUser, isActive);
            });
        }

        // Изчистване на количката
        const clearBtn = document.getElementById("clearBtn");
        if (clearBtn) clearBtn.onclick = () => {
            this.dataModel.clearCart();
            this.view.updateCartUI([], null);
            this.view.showToast("Кошницата е изчистена", "info");
        };

        // Бутон "ГОТВИ"
        const genBtn = document.getElementById("generateBtn");
        if (genBtn) genBtn.onclick = () => this.handleGenerateRecipe();

        // Затваряне на модала за готвене
        const closeCook = document.querySelector(".close-cooking");
        const cookModal = document.getElementById("cookingModal");
        if (closeCook) closeCook.onclick = () => this.view.toggleCookingModal(false);
        
        // Затваряне при клик извън прозореца
        window.onclick = (e) => {
            if (e.target === cookModal) this.view.toggleCookingModal(false);
        };
    }

    // --- ОБЩИ UI НАСТРОЙКИ ---
    setupUIListeners() {
        //  МОБИЛНА КОЛИЧКА (Отваряне/Затваряне на десния панел)
        const mobileToggle = document.getElementById("mobileCartToggle");
        const rightPanel = document.querySelector(".right-panel");
        
        if (mobileToggle && rightPanel) {
            mobileToggle.addEventListener("click", () => {
                rightPanel.classList.toggle("active");
            });
            
            // Затваряне при клик извън панела (за удобство)
            document.addEventListener("click", (e) => {
                if (window.innerWidth < 950 && 
                    !rightPanel.contains(e.target) && 
                    !mobileToggle.contains(e.target) && 
                    rightPanel.classList.contains("active")) {
                    rightPanel.classList.remove("active");
                }
            });
        }

        // Админ Модал (Отваряне/Затваряне)
        const adminBtn = document.getElementById("adminFab");
        const adminModal = document.getElementById("adminModal");
        const closeAdmin = document.querySelector(".close-admin");

        if(adminBtn) adminBtn.onclick = () => {
            if (adminModal) adminModal.style.display = "flex";
        };
        if(closeAdmin) closeAdmin.onclick = () => {
            if (adminModal) adminModal.style.display = "none";
        };

        // Dark Mode логика (ако имаш такава във View или тук)
        const themeSwitch = document.querySelector('.theme-switch input');
        if(themeSwitch) {
            themeSwitch.addEventListener('change', (e) => {
                if(e.target.checked) {
                    document.body.classList.add('dark-mode');
                    localStorage.setItem('theme', 'dark-mode');
                } else {
                    document.body.classList.remove('dark-mode');
                    localStorage.setItem('theme', 'light-mode');
                }
            });
            // Проверка при зареждане
            if(localStorage.getItem('theme') === 'dark-mode') {
                document.body.classList.add('dark-mode');
                themeSwitch.checked = true;
            }
        }
    }

    // --- ФИЛТРИРАНЕ НА ПРОДУКТИ (ХЛАДИЛНИК) ---
    filterProducts() {
        if (!document.getElementById("productList")) return; 
        
        const term = document.getElementById("searchInput")?.value.toLowerCase() || "";
        
        const filtered = this.dataModel.products.filter(p => {
            const matchesTerm = p.name.toLowerCase().includes(term);
            const matchesCat = (this.currentCategory === "all" || p.category === this.currentCategory);
            return matchesTerm && matchesCat;
        });
        
        this.view.renderProducts(filtered, (product) => {
            // Callback при клик върху продукт (Добавяне в количката)
            const res = this.dataModel.addToCart(product);
            
            this.view.updateCartUI(this.dataModel.cart, (id) => {
                // Callback при клик върху бутон в количката (Махане/Намаляване)
                this.dataModel.removeFromCart(id);
                this.view.updateCartUI(this.dataModel.cart, null);
            });
            
            this.view.showToast(`${res.product.name} добавен!`, "success");
        });
    }

    // --- ГЕНЕРИРАНЕ НА РЕЦЕПТА ---
    handleGenerateRecipe() {
        const result = this.dataModel.findAllMatchingRecipes();
        
        if (result.status === "empty") {
            this.view.showToast("Кошницата е празна!", "error");
            return;
        }
        if (result.status === "none") {
            this.view.showToast("Няма подходящи рецепти.", "info");
        }
        
        this.UIView.renderCookingResults(result, // (или data, зависи как ти се казва променливата там)
            this.dataModel.userFavs || [], // Подаваме масива с любимите рецепти
            (title, btn) => this.toggleFavorite(title, btn)) // Подаваме същата функция, която ползваш в главната страница);
        this.UIView.toggleCookingModal(true);
    }

    // --- ЛЮБИМИ (TOGGLE) ---
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
            this.view.showToast(isFav ? "Премахнато" : "Добавено", "success");
        } catch(e) { console.error(e); }
    }

    // --- AUTH LISTENER & ADMIN LOGIC ---
    setupAuthListeners() {
        const btn = document.getElementById("authBtn");
        if(btn) btn.onclick = () => {
            if(this.authModel.currentUser) this.authModel.logout();
            else this.view.toggleAuthModal(true);
        };

        const closeBtns = document.querySelectorAll(".close");
        closeBtns.forEach(b => b.onclick = () => this.view.toggleAuthModal(false));

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
        
        this.setupTabsAndEyes();
        this.setupAdminLogic();
    }

    // --- ДОБАВЯНЕ НА ПРОДУКТ (ADMIN) ---
    setupAdminLogic() {
        const addBtn = document.getElementById("addProductBtn");
        if (addBtn) {
            addBtn.addEventListener("click", async () => {
                const name = document.getElementById("prodName").value;
                const cal = document.getElementById("prodCal").value;
                
                if(!name) return this.view.showToast("Име?", "error");

                try {
                    await this.dataModel.addProductToDb({
                        name, 
                        calories: Number(cal),
                        category: document.getElementById("prodCat").value,
                    });
                    this.view.showToast("Успешно добавено!", "success");
                    document.getElementById("adminModal").style.display = "none";
                    // Рефреш след малко, за да се види новия продукт
                    setTimeout(() => window.location.reload(), 1000);
                } catch(e) { this.view.showToast("Грешка", "error"); }
            });
        }
    }

    setupTabsAndEyes() {
        const tabLogin = document.getElementById("tabLogin");
        const tabRegister = document.getElementById("tabRegister");
        const loginForm = document.getElementById("loginForm");
        const registerForm = document.getElementById("registerForm");

        if (tabLogin && tabRegister) {
            tabLogin.onclick = () => {
                loginForm.style.display = "block"; registerForm.style.display = "none";
                tabLogin.classList.add("active"); tabRegister.classList.remove("active");
            };
            tabRegister.onclick = () => {
                loginForm.style.display = "none"; registerForm.style.display = "block";
                tabRegister.classList.add("active"); tabLogin.classList.remove("active");
            };
        }
        
        // Око за паролата
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