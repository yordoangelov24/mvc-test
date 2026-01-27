export class UIView {
    constructor() {
        this.elements = {
            toastContainer: document.getElementById('toast-container'),
            authModal: document.getElementById("authModal"),
            adminModal: document.getElementById("adminModal"),
            authBtnSide: document.getElementById("authBtn"),
            adminFab: document.getElementById("adminFab"),
            productList: document.getElementById("productList"),
            recipeGrid: document.getElementById("recipeGrid"),
            favGrid: document.getElementById("favGrid"),
            itemsContainer: document.getElementById("itemsContainer"),
            cartEmpty: document.getElementById("cartEmpty"),
            countTag: document.getElementById("countTag"),
            recipeBox: document.getElementById("recipeBox"),
            recipeText: document.getElementById("recipeText"),
            cookingModal: document.getElementById("cookingModal"), 
            cookingResultsList: document.getElementById("cookingResultsList"), 
            closeCookingBtn: document.querySelector(".close-cooking"),
            cookingModal : document.getElementById("cookingModal"),
            bars: {
                prot: { bar: document.getElementById("proteinBar"), val: document.getElementById("proteinVal") },
                fat: { bar: document.getElementById("fatBar"), val: document.getElementById("fatVal") }
            }
        };
    }

    // --- TOAST ИЗВЕСТИЯ ---
    showToast(message, type = 'success') {
        if (!this.elements.toastContainer) {
            const c = document.createElement('div');
            c.id = 'toast-container'; c.className = 'toast-container';
            document.body.appendChild(c);
            this.elements.toastContainer = c;
        }
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        const icon = type === 'error' ? '❌' : (type === 'info' ? 'ℹ️' : '✅');
        toast.innerHTML = `<div class="toast-icon">${icon}</div><div class="toast-content">${message}</div>`;
        this.elements.toastContainer.appendChild(toast);
        setTimeout(() => {
            toast.classList.add('hide');
            toast.addEventListener('animationend', () => toast.remove());
        }, 3000);
    }

    // --- МОДАЛИ ---
    toggleAuthModal(show) { if (this.elements.authModal) this.elements.authModal.style.display = show ? "flex" : "none"; }
    toggleAdminModal(show) { if (this.elements.adminModal) this.elements.adminModal.style.display = show ? "flex" : "none"; }

    shakeModal() {
        const content = document.querySelector(".modal-content");
        if (content) {
            content.classList.add("shake-animation");
            setTimeout(() => content.classList.remove("shake-animation"), 500);
        }
    }

    // --- БУТОНИ И UI СТАТУС ---
    updateAuthUI(user, isAdmin) {
        if (this.elements.authBtnSide) {
            this.elements.authBtnSide.innerHTML = user ? `🚪 Изход` : `🔑 Вход`;
        }
        if (this.elements.adminFab) {
            this.elements.adminFab.style.display = (user && isAdmin) ? "flex" : "none";
        }
        // Ако сме в профила, обновяваме имейла
        const emailEl = document.getElementById("userEmail");
        if (emailEl && user) emailEl.textContent = user.email;
    }

    setLoading(btn, isLoading, originalText = "ВЛЕЗ") {
        if (!btn) return;
        if (isLoading) {
            btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ...`;
            btn.disabled = true;
        } else {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    }

    // --- РЕНДИРАНЕ НА ПРОДУКТИ (Index) ---
    renderProducts(list, addToCartCallback) {
        if (!this.elements.productList) return;
        this.elements.productList.innerHTML = "";
        
        if (list.length === 0) {
            this.elements.productList.innerHTML = "<div style='padding:20px; text-align:center'>Няма намерени продукти.</div>";
            return;
        }

        list.forEach((p, index) => {
            const div = document.createElement("div");
            div.className = "product";
            div.style.animationDelay = `${index * 0.05}s`;
            div.innerHTML = `
                <div class="p-thumb">${p.name.charAt(0)}</div>
                <div class="p-info">
                    <div class="p-name">${p.name}</div>
                    <div class="p-nutrition">${p.calories} kcal</div>
                </div>
                <button class="add-btn">Добави</button>
            `;
            div.querySelector(".add-btn").onclick = () => addToCartCallback(p);
            this.elements.productList.appendChild(div);
        });
    }

    // --- КОШНИЦА UI ---
    updateCartUI(cart, removeCallback) {
        if (!this.elements.itemsContainer) return;
        
        this.elements.itemsContainer.innerHTML = "";
        if (cart.length === 0) {
            if(this.elements.cartEmpty) this.elements.cartEmpty.style.display = "block";
            this.elements.itemsContainer.style.display = "none";
            if(this.elements.countTag) this.elements.countTag.textContent = "0";
            if(this.elements.recipeBox) this.elements.recipeBox.style.display = "none";
        } else {
            if(this.elements.cartEmpty) this.elements.cartEmpty.style.display = "none";
            this.elements.itemsContainer.style.display = "flex";
            if(this.elements.countTag) this.elements.countTag.textContent = cart.length;

            cart.forEach(item => {
                const div = document.createElement("div");
                div.className = "item";
                div.innerHTML = `
                    <div class="qty">${item.qty}</div>
                    <div class="meta"><div class="name">${item.name}</div></div>
                    <button class="rm-btn" style="background:none; border:none; cursor:pointer;">❌</button>
                `;
                div.querySelector(".rm-btn").onclick = () => removeCallback(item.id);
                this.elements.itemsContainer.appendChild(div);
            });
        }
        this.updateNutritionBars(cart);
    }

    updateNutritionBars(cart) {
        if(!this.elements.bars.prot.bar) return;
        
        const total = cart.reduce((acc, i) => ({
            p: acc.p + (i.protein || 0) * i.qty,
            f: acc.f + (i.fat || 0) * i.qty
        }), { p: 0, f: 0 });

        this._setBar(this.elements.bars.prot, total.p, 100);
        this._setBar(this.elements.bars.fat, total.f, 70);
    }

    _setBar(el, val, limit) {
        const pct = Math.min((val / limit) * 100, 100);
        el.bar.style.width = pct + "%";
        el.val.textContent = `${val.toFixed(1)}g`;
        // Цветове
        if(val > limit) el.bar.style.background = "#ff4757"; // Червено ако прекали
        else el.bar.style.background = "#2ed573"; // Зелено
    }

    // --- РЕНДИРАНЕ НА РЕЦЕПТИ (Recipes Page) ---
    renderRecipesGrid(recipes, userFavs, toggleFavCallback) {
        const grid = this.elements.recipeGrid || this.elements.favGrid; // Работи и за двете страници
        if (!grid) return;
        
        grid.innerHTML = "";
        if (recipes.length === 0) {
            grid.innerHTML = "<div style='padding:20px'>Няма рецепти.</div>";
            return;
        }

        recipes.forEach((r, index) => {
            const isFav = userFavs.includes(r.title);
            const div = document.createElement("div");
            div.className = "recipe-card";
            div.style.animation = "popIn 0.5s forwards";
            div.style.animationDelay = `${index * 0.05}s`;
            
            div.innerHTML = `
                <button class="fav-btn ${isFav ? 'is-favorite' : ''}">❤️</button>
                <h3>${r.title}</h3>
                <div style="font-size:11px; color:#888; text-transform:uppercase; margin-bottom:5px;">${r.level || 'Лесно'}</div>
                <p>${r.description}</p>
            `;
            
            div.querySelector(".fav-btn").onclick = (e) => toggleFavCallback(r.title, e.target);
            grid.appendChild(div);
        });
    }

    // --- ПОКАЗВАНЕ НА ГОТОВА РЕЦЕПТА ---
    showRecipeResult(recipe, cart, isExact) {
        if (!this.elements.recipeBox) return;
        
        const total = cart.reduce((acc, item) => ({
            cal: acc.cal + item.calories * item.qty,
            prot: acc.prot + item.protein * item.qty
        }), { cal: 0, prot: 0 });

        this.elements.recipeBox.style.display = "block";
        
        if (recipe) {
             this.elements.recipeText.innerHTML = `
                <h3 style="color:var(--primary)">${recipe.title}</h3>
                <p>${recipe.description}</p>
                <hr style="border:0; border-top:1px solid #ddd; margin:10px 0;">
                <p>📊 <strong>Кал:</strong> ${total.cal.toFixed(0)} | <strong>Прот:</strong> ${total.prot.toFixed(1)}g</p>
            `;
        } else {
             this.elements.recipeText.innerHTML = `
                <h3>Няма точна рецепта 🤷‍♂️</h3>
                <p>Пробвай да сготвиш нещо с наличните продукти.</p>
                <hr>
                 <p>📊 <strong>Кал:</strong> ${total.cal.toFixed(0)} | <strong>Прот:</strong> ${total.prot.toFixed(1)}g</p>
            `;
        }
    }
    toggleCookingModal(show) {
    if (this.elements.cookingModal) {
        this.elements.cookingModal.style.display = show ? "flex" : "none";
    }
}

renderCookingResults(data) {
        const list = this.elements.cookingResultsList;
        const modalContent = document.querySelector("#cookingModal .modal-content");
        
        // Добавяме класа за стъклен ефект
        if (modalContent) {
            modalContent.classList.add("glass-modal");
        }

        if (!list) return;
        list.innerHTML = ""; 

        // Помощна функция за създаване на HTML с класове
        const createRecipeCard = (item, type) => {
            const r = item.recipe;
            const usedNames = item.used.map(p => p.name).join(", ");
            
            let missingHtml = "";
            let borderColor = "#2ed573"; // Зелено по подразбиране

            if (type === "partial") {
                borderColor = "#ffa502"; // Оранжево
                const missingNames = item.missing.map(p => p.name).join(", ");
                missingHtml = `<div class="recipe-missing">🛑 Липсва: <strong>${missingNames}</strong></div>`;
            }

            const div = document.createElement("div");
            div.className = "recipe-result-card";
            div.style.borderLeftColor = borderColor; // Само цветът на бордера остава тук

            div.innerHTML = `
                <h3 class="recipe-title">${r.title}</h3>
                ${missingHtml}
                <div class="recipe-used">✅ Ползваш: <strong>${usedNames}</strong></div>
                <p class="recipe-desc">${r.description}</p>
                <hr style="border-color:rgba(255,255,255,0.1); margin:15px 0;">
                <p class="recipe-steps-title">🔪 Начин на приготвяне:</p>
                <p class="recipe-steps-text">${r.steps || "Няма въведени стъпки."}</p>
            `;
            return div;
        };

        // Рендиране на ТОЧНИТЕ
        if (data.exact.length > 0) {
            const h3 = document.createElement("h3");
            h3.className = "section-exact";
            h3.textContent = `✨ Можеш да сготвиш веднага (${data.exact.length})`;
            list.appendChild(h3);
            data.exact.forEach(item => list.appendChild(createRecipeCard(item, "exact")));
        }

        // Рендиране на ЧАСТИЧНИТЕ
        if (data.partial.length > 0) {
            const h3 = document.createElement("h3");
            h3.className = "section-partial";
            h3.textContent = `🛒 Трябва да купиш малко (${data.partial.length})`;
            list.appendChild(h3);
            data.partial.forEach(item => list.appendChild(createRecipeCard(item, "partial")));
        }

        if (data.exact.length === 0 && data.partial.length === 0) {
            list.innerHTML = "<div style='text-align:center; padding:40px; color:#888;'>Не намерихме рецепти с тези продукти... 🤷‍♂️<br>Опитай да добавиш основни неща като яйца, мляко или брашно.</div>";
        }
    }
}