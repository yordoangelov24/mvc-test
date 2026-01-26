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

    // Алгоритъм за намиране на рецепта
    findBestRecipe() {
        if (this.cart.length === 0) return { status: "empty" };

        const cartIds = this.cart.map(i => i.id);

        // 1. Пълно съвпадение
        const exactMatches = this.recipes.filter(r => r.ingredients.every(id => cartIds.includes(id)));
        exactMatches.sort((a, b) => b.ingredients.length - a.ingredients.length);

        if (exactMatches.length > 0) {
            return { status: "found", recipe: exactMatches[0] };
        }

        // 2. Частично съвпадение (Almost Match)
        let almostMatch = this.recipes.find(r => {
            const missing = r.ingredients.filter(id => !cartIds.includes(id));
            return missing.length > 0 && missing.length <= 2;
        });

        if (almostMatch) {
            const missingIds = almostMatch.ingredients.filter(id => !cartIds.includes(id));
            const missingProducts = this.products.filter(p => missingIds.includes(p.id));
            return { status: "partial", recipe: almostMatch, missing: missingProducts };
        }

        return { status: "none" };
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