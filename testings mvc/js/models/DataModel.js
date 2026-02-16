import { db } from "../firebase-config.js";
import { 
    collection, getDocs, doc, updateDoc, arrayUnion, arrayRemove, getDoc, addDoc, deleteDoc 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

export class DataModel {
    constructor() {
        this.products = [];
        this.recipes = [];
        this.cart = [];
    }

    // Тегли всичко от Firebase
    async fetchAllData() {
        // Продукти
        const pSnap = await getDocs(collection(db, "products"));
        this.products = pSnap.docs.map(d => ({ id: Number(d.id) || d.id, ...d.data() })); // Подсигуряваме ID

        // Рецепти
        const rSnap = await getDocs(collection(db, "recipes"));
        this.recipes = rSnap.docs.map(d => d.data());

        return { products: this.products, recipes: this.recipes };
    }

    // Кошница: Добавяне
    addToCart(product) {
        const existing = this.cart.find(i => i.id === product.id);
        if (!existing) {
            this.cart.push({ ...product, qty: 1 });
            return { action: "added", product };
        } else {
            existing.qty++;
            return { action: "increased", product };
        }
    }

    // Кошница: Премахване
    removeFromCart(id) {
        this.cart = this.cart.filter(i => i.id !== id);
    }

    clearCart() {
        this.cart = [];
    }

   // Търси ВСИЧКИ подходящи рецепти (с подобрена логика)
    findAllMatchingRecipes() {
        if (this.cart.length === 0) return { status: "empty" };

        const cartIds = this.cart.map(i => i.id);
        const exactMatches = [];
        const partialMatches = [];

        this.recipes.forEach(recipe => {
            // 1. Какво липсва?
            const missingIds = recipe.ingredients.filter(id => !cartIds.includes(id));
            
            // 2. Какво имаме?
            const usedIds = recipe.ingredients.filter(id => cartIds.includes(id));

            // АКО рецептата не ползва нито един продукт от количката -> ПРОПУСКАМЕ Я
            if (usedIds.length === 0) return;

            // ВАЖНО: Намираме целите обекти на продуктите, за да им вземем имената
            const usedProducts = this.products.filter(p => usedIds.includes(p.id));

            if (missingIds.length === 0) {
                // Точно попадение (Добавяме и usedProducts!)
                exactMatches.push({ 
                    recipe: recipe, 
                    used: usedProducts  // <--- ТОВА ЛИПСВАШЕ
                });
            } else if (missingIds.length <= 2) {
                // Частично попадение
                const missingProducts = this.products.filter(p => missingIds.includes(p.id));
                partialMatches.push({ 
                    recipe: recipe, 
                    missing: missingProducts, 
                    used: usedProducts // <--- ТОВА ЛИПСВАШЕ
                });
            }
        });

        // Сортиране
        exactMatches.sort((a, b) => b.used.length - a.used.length);
        partialMatches.sort((a, b) => a.used.length - b.used.length);

        return { 
            status: (exactMatches.length > 0 || partialMatches.length > 0) ? "found" : "none",
            exact: exactMatches,
            partial: partialMatches
        };
    }
    // Админ: Добавяне на продукт
    async addProductToDb(productData) {
        await addDoc(collection(db, "products"), productData);
    }

    // Любими: Взимане
    async getUserFavorites(uid) {
        const snap = await getDoc(doc(db, "users", uid));
        if (snap.exists()) return snap.data().favorites || [];
        return [];
    }

    // Любими: Toggle
    async toggleFavorite(uid, title, isAdding) {
        const ref = doc(db, "users", uid);
        if (isAdding) {
            await updateDoc(ref, { favorites: arrayUnion(title) });
        } else {
            await updateDoc(ref, { favorites: arrayRemove(title) });
        }
    }
}