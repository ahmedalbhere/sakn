// بيانات التطبيق
let userData = {
    userType: '',
    gender: '',
    area: '',
    type: '',
    studentGender: '',
    studentArea: '',
    studentType: '',
    details: '',
    price: '',
    contact: ''
};

// تهيئة Firebase
const firebaseConfig = {
    apiKey: "AIzaSyDwHZtB4Z-QrnpJbKpM_wfBJdRfK8D7m9w",
    authDomain: "coffee-dda5d.firebaseapp.com",
    databaseURL: "https://coffee-dda5d-default-rtdb.firebaseio.com",
    projectId: "coffee-dda5d",
    storageBucket: "coffee-dda5d.firebasestorage.app",
    messagingSenderId: "776696178390",
    appId: "1:776696178390:web:f5ca9a1f1ea9b5faa847ae"
};

// تهيئة Firebase
try {
    firebase.initializeApp(firebaseConfig);
    console.log("Firebase تم التهيئة بنجاح");
} catch (error) {
    console.error("خطأ في تهيئة Firebase:", error);
}

// الحصول على مرجع قاعدة البيانات
const database = firebase.database();

// تهيئة التطبيق عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    // إخفاء شاشة التحميل بعد تحميل الصفحة
    setTimeout(() => {
        document.getElementById('loader').style.opacity = '0';
        setTimeout(() => {
            document.getElementById('loader').style.display = 'none';
        }, 500);
    }, 1500);
    
    // إعداد معالج النماذج
    const ownerForm = document.getElementById('owner-form');
    if (ownerForm) {
        ownerForm.addEventListener('submit', handleOwnerFormSubmit);
    }
});

// اختيار نوع المستخدم
function selectUserType(type) {
    userData.userType = type;
    
    if (type === 'owner') {
        navigateToPage('owner-gender-page');
    } else if (type === 'student') {
        navigateToPage('student-gender-page');
    }
}

// اختيار خيار في النماذج
function selectOption(field, value) {
    userData[field] = value;
    
    // تحديد الصفحة التالية بناءً على الصفحة الحالية
    const currentPage = document.querySelector('.page.active').id;
    
    if (currentPage === 'owner-gender-page') {
        navigateToPage('owner-area-page');
    } else if (currentPage === 'owner-area-page') {
        navigateToPage('owner-type-page');
    } else if (currentPage === 'owner-type-page') {
        navigateToPage('owner-details-page');
    } else if (currentPage === 'student-gender-page') {
        navigateToPage('student-area-page');
    } else if (currentPage === 'student-area-page') {
        navigateToPage('student-type-page');
    } else if (currentPage === 'student-type-page') {
        // البحث عن الوحدات المتاحة وعرض النتائج
        searchListings();
        navigateToPage('student-results-page');
    }
}

// التنقل بين الصفحات
function navigateToPage(pageId) {
    // إخفاء جميع الصفحات
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    // إظهار الصفحة المطلوبة
    document.getElementById(pageId).classList.add('active');
    
    // التمرير إلى أعلى الصفحة
    window.scrollTo(0, 0);
}

// العودة للصفحة السابقة
function goBack() {
    const currentPage = document.querySelector('.page.active').id;
    let previousPage = '';
    
    // تحديد الصفحة السابقة بناءً على الصفحة الحالية
    switch(currentPage) {
        case 'owner-gender-page':
            previousPage = 'main-page';
            break;
        case 'owner-area-page':
            previousPage = 'owner-gender-page';
            break;
        case 'owner-type-page':
            previousPage = 'owner-area-page';
            break;
        case 'owner-details-page':
            previousPage = 'owner-type-page';
            break;
        case 'student-gender-page':
            previousPage = 'main-page';
            break;
        case 'student-area-page':
            previousPage = 'student-gender-page';
            break;
        case 'student-type-page':
            previousPage = 'student-area-page';
            break;
        case 'student-results-page':
            previousPage = 'student-type-page';
            break;
        default:
            previousPage = 'main-page';
    }
    
    navigateToPage(previousPage);
}

// العودة للصفحة الرئيسية
function goToMainPage() {
    navigateToPage('main-page');
    resetUserData();
}

// إعادة تعيين بيانات المستخدم
function resetUserData() {
    userData = {
        userType: '',
        gender: '',
        area: '',
        type: '',
        studentGender: '',
        studentArea: '',
        studentType: '',
        details: '',
        price: '',
        contact: ''
    };
    
    // إعادة تعيين النموذج
    const ownerForm = document.getElementById('owner-form');
    if (ownerForm) {
        ownerForm.reset();
    }
}

// معالجة نموذج المالك
function handleOwnerFormSubmit(e) {
    e.preventDefault();
    
    // جمع البيانات من النموذج
    userData.details = document.getElementById('details').value;
    userData.price = document.getElementById('price').value;
    userData.contact = document.getElementById('contact').value;
    
    // التحقق من اكتمال البيانات
    if (!userData.details || !userData.price || !userData.contact) {
        alert('يرجى ملء جميع الحقول المطلوبة');
        return;
    }
    
    // إضافة الوحدة إلى Firebase
    addListingToFirebase();
}

// إضافة وحدة سكنية جديدة إلى Firebase
function addListingToFirebase() {
    const newListing = {
        gender: userData.gender,
        area: userData.area,
        type: userData.type,
        details: userData.details,
        price: userData.price,
        contact: userData.contact,
        date: new Date().toISOString(),
        timestamp: firebase.database.ServerValue.TIMESTAMP
    };
    
    // إضافة إلى Firebase
    const listingsRef = database.ref('listings');
    const newListingRef = listingsRef.push();
    
    newListingRef.set(newListing)
        .then(() => {
            console.log("تم إضافة الوحدة إلى Firebase بنجاح");
            
            // الانتقال إلى صفحة التأكيد
            navigateToPage('confirmation-page');
            
            // إعادة تعيين البيانات
            resetUserData();
        })
        .catch((error) => {
            console.error("خطأ في إضافة الوحدة:", error);
            alert("حدث خطأ أثناء حفظ البيانات. يرجى المحاولة مرة أخرى.");
        });
}

// البحث عن الوحدات المتاحة للطالب
function searchListings() {
    const listingsContainer = document.getElementById('listings-container');
    if (!listingsContainer) return;
    
    listingsContainer.innerHTML = '<div class="loading-text">جاري البحث عن الوحدات المتاحة...</div>';
    
    const listingsRef = database.ref('listings');
    
    listingsRef.once('value')
        .then((snapshot) => {
            const listings = [];
            snapshot.forEach((childSnapshot) => {
                const listing = childSnapshot.val();
                listing.id = childSnapshot.key;
                listings.push(listing);
            });
            
            // تصفية النتائج بناءً على اختيارات الطالب
            const filteredListings = listings.filter(listing => {
                // مطابقة النوع (شباب/بنات)
                const genderMatch = userData.studentGender === 'شاب' ? 
                    listing.gender === 'شباب' : listing.gender === 'بنات';
                
                // مطابقة المنطقة
                const areaMatch = listing.area === userData.studentArea;
                
                // مطابقة نوع الوحدة
                const typeMatch = listing.type === userData.studentType;
                
                return genderMatch && areaMatch && typeMatch;
            });
            
            displayListings(filteredListings);
        })
        .catch((error) => {
            console.error("خطأ في جلب البيانات:", error);
            listingsContainer.innerHTML = '<div class="error-text">حدث خطأ في جلب البيانات. يرجى المحاولة مرة أخرى.</div>';
        });
}

// عرض الوحدات السكنية
function displayListings(listings) {
    const listingsContainer = document.getElementById('listings-container');
    if (!listingsContainer) return;
    
    if (listings.length === 0) {
        listingsContainer.innerHTML = `
            <div class="no-results">
                <i class="fas fa-search" style="font-size: 3rem; color: var(--text-light); margin-bottom: 20px;"></i>
                <h3>لا توجد وحدات متاحة</h3>
                <p>لا توجد وحدات سكنية تطابق معايير البحث الخاصة بك</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    
    listings.forEach(listing => {
        const date = new Date(listing.date);
        const formattedDate = date.toLocaleDateString('ar-EG');
        
        // تنسيق السعر
        const formattedPrice = new Intl.NumberFormat('ar-EG').format(listing.price);
        
        html += `
            <div class="listing-card">
                <div class="listing-header">
                    <h3 class="listing-title">${listing.type === 'شقة' ? 'شقة كاملة' : 'سرير مفرد'} - ${listing.area}</h3>
                    <div class="listing-price">${formattedPrice} ج.م <span style="font-size: 0.9rem; color: var(--text-light)">/شهر</span></div>
                </div>
                
                <div class="listing-details">
                    <span class="listing-detail">
                        <i class="fas ${listing.gender === 'شباب' ? 'fa-male' : 'fa-female'}"></i>
                        ${listing.gender === 'شباب' ? 'سكن شباب' : 'سكن بنات'}
                    </span>
                    <span class="listing-detail">
                        <i class="fas fa-map-marker-alt"></i>
                        ${listing.area === 'شرق' ? 'شرق بني سويف' : 'غرب بني سويف'}
                    </span>
                    <span class="listing-detail">
                        <i class="fas fa-calendar-alt"></i>
                        ${formattedDate}
                    </span>
                </div>
                
                <div class="listing-description">
                    ${listing.details}
                </div>
                
                <div class="listing-contact">
                    <div class="contact-info">
                        <i class="fas fa-phone"></i>
                        ${listing.contact}
                    </div>
                    <button class="contact-btn" onclick="contactOwner('${listing.contact}')">
                        <i class="fas fa-comment"></i> تواصل الآن
                    </button>
                </div>
            </div>
        `;
    });
    
    listingsContainer.innerHTML = html;
}

// التواصل مع المالك
function contactOwner(contactInfo) {
    // يمكن توسيع هذه الوظيفة لإضافة خيارات اتصال أكثر
    const message = `مرحباً، أنا مهتم بالوحدة السكنية التي أعلنت عنها. هل يمكنك إعطائي المزيد من التفاصيل؟`;
    
    // عرض خيارات التواصل
    const userChoice = confirm(`رقم التواصل: ${contactInfo}\n\nهل تريد نسخ رقم الهاتف للتواصل؟`);
    
    if (userChoice) {
        // نسخ رقم الهاتف للحافظة
        navigator.clipboard.writeText(contactInfo)
            .then(() => {
                alert('تم نسخ رقم الهاتف إلى الحافظة');
            })
            .catch(() => {
                // طريقة بديلة للمتصفحات القديمة
                const tempInput = document.createElement('input');
                tempInput.value = contactInfo;
                document.body.appendChild(tempInput);
                tempInput.select();
                document.execCommand('copy');
                document.body.removeChild(tempInput);
                alert('تم نسخ رقم الهاتف إلى الحافظة');
            });
    }
}

// دالة لتحميل جميع الإعلانات (للتطوير والاختبار)
function loadAllListings() {
    const listingsRef = database.ref('listings');
    
    listingsRef.once('value')
        .then((snapshot) => {
            const listings = [];
            snapshot.forEach((childSnapshot) => {
                const listing = childSnapshot.val();
                listing.id = childSnapshot.key;
                listings.push(listing);
            });
            
            console.log("جميع الإعلانات:", listings);
            return listings;
        })
        .catch((error) => {
            console.error("خطأ في جلب البيانات:", error);
        });
}

// استدعاء الدالة عند الحاجة
// loadAllListings();
