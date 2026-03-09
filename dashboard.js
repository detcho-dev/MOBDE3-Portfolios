import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, onAuthStateChanged, isSignInWithEmailLink, signInWithEmailLink, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, collection, addDoc, query, where, onSnapshot } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// 1. إعدادات Firebase (ضع بياناتك هنا)
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// 2. معالجة رابط الدخول Passless (إذا وجد)
if (isSignInWithEmailLink(auth, window.location.href)) {
    let email = window.localStorage.getItem('emailForSignIn');
    if (!email) email = window.prompt('يرجى تأكيد بريدك الإلكتروني لإتمام الدخول:');
    
    signInWithEmailLink(auth, email, window.location.href)
        .then(() => window.localStorage.removeItem('emailForSignIn'))
        .catch(err => console.error(err));
}

// 3. مراقبة حالة المستخدم
onAuthStateChanged(auth, (user) => {
    if (user) {
        document.getElementById('userName').innerText = user.displayName || user.email;
        loadWorks(user.uid);
        
        // تفعيل زر نسخ الرابط
        document.getElementById('btnShareProfile').onclick = () => {
            const profileLink = `${window.location.origin}/profile.html?u=${user.uid}`;
            navigator.clipboard.writeText(profileLink);
            alert("تم نسخ رابط صفحتك بنجاح!");
        };
    } else {
        window.location.href = "index.html"; // إعادة للدخول إذا لم يكن مسجلاً
    }
});

// 4. إضافة عمل جديد لـ Firestore
document.getElementById('addProjectForm').onsubmit = async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btnSave');
    btn.innerText = "جاري النشر...";
    btn.disabled = true;

    try {
        await addDoc(collection(db, "projects"), {
            uid: auth.currentUser.uid,
            title: document.getElementById('pTitle').value,
            image: document.getElementById('pImage').value,
            desc: document.getElementById('pDesc').value,
            link: document.getElementById('pLink').value,
            createdAt: new Date()
        });
        document.getElementById('addProjectForm').reset();
        alert("تم نشر عملك بنجاح!");
    } catch (error) {
        alert("خطأ أثناء النشر: " + error.message);
    } finally {
        btn.innerText = "نشر العمل";
        btn.disabled = false;
    }
};

// 5. جلب الأعمال وعرضها في الوقت الفعلي
function loadWorks(uid) {
    const q = query(collection(db, "projects"), where("uid", "==", uid));
    const grid = document.getElementById('worksGrid');

    onSnapshot(q, (snapshot) => {
        grid.innerHTML = "";
        if (snapshot.empty) {
            grid.innerHTML = `<p>لا يوجد أعمال بعد.</p>`;
            return;
        }
        snapshot.forEach((doc) => {
            const data = doc.data();
            grid.innerHTML += `
                <div class="work-item">
                    <img src="${data.image}" alt="${data.title}">
                    <div class="work-info">
                        <h3>${data.title}</h3>
                        <p>${data.desc}</p>
                    </div>
                </div>
            `;
        });
    });
}

// 6. تسجيل الخروج
document.getElementById('btnLogout').onclick = () => signOut(auth);
