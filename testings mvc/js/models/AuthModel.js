import { auth, db } from "../firebase-config.js";
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged, 
    sendPasswordResetEmail 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

export class AuthModel {
    constructor() {
        this.currentUser = null;
        this.isAdmin = false;
    }

    // Следи дали някой влиза/излиза
    monitorAuthState(callback) {
        onAuthStateChanged(auth, async (user) => {
            this.currentUser = user;
            this.isAdmin = false;

            if (user) {
                try {
                    const snap = await getDoc(doc(db, "users", user.uid));
                    if (snap.exists() && snap.data().role === "admin") {
                        this.isAdmin = true;
                    }
                } catch (e) { console.error("Admin Check Error:", e); }
            }
            callback(user, this.isAdmin);
        });
    }

    async login(email, pass) {
        return await signInWithEmailAndPassword(auth, email, pass);
    }

    async register(email, pass) {
        const cred = await createUserWithEmailAndPassword(auth, email, pass);
        // Записваме потребителя в базата
        await setDoc(doc(db, "users", cred.user.uid), {
            email: email, role: "user", favorites: []
        });
        return cred;
    }

    async logout() {
        return await signOut(auth);
    }

    async resetPassword(email) {
        return await sendPasswordResetEmail(auth, email);
    }
}