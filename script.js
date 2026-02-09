// ============================================
// Firebase Configuration - قاعدة البيانات الجديدة
// ============================================
const firebaseConfig = {
    apiKey: "AIzaSyBtm2gLJ1-D4j4wH7hD_gd9auM0Uo9Q1ZQ",
    authDomain: "coffee-dda5d.firebaseapp.com",
    databaseURL: "https://coffee-dda5d-default-rtdb.firebaseio.com",
    projectId: "coffee-dda5d",
    storageBucket: "coffee-dda5d.appspot.com",
    messagingSenderId: "727259997446",
    appId: "1:727259997446:web:2a673451f2f8c68b0a8f9c"
};

// ============================================
// تهيئة Firebase
// ============================================
let firebaseConnected = false;
let database;

try {
    firebase.initializeApp(firebaseConfig);
    database = firebase.database();
    console.log("✅ تم الاتصال بقاعدة بيانات Firebase الجديدة (coffee-dda5d)");
} catch (error) {
    console.error("❌ خطأ في الاتصال بقاعدة البيانات:", error);
    showNotification("خطأ في الاتصال بقاعدة البيانات، جاري استخدام النسخة المحلية", "error");
}

// ============================================
// بيانات التطبيق
// ============================================
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

// ============================================
// بيانات الوحدات السكنية
// ============================================
let localListings = JSON.parse(localStorage.getItem('studentHousingListings')) || [];

// بيانات تجريبية للاختبار
if (localListings.length === 0) {
    localListings = [
        {
            id: 1,
            gender: 'شباب',
            area: 'شرق',
            type: 'شقة',
            details: 'شقة مفروشة بالكامل بمنطقة هادئة قريبة من الجامعة، تحتوي على 3 غرف وصالة ومطبخ وحمامين',
            price: '1500',
            contact: '01012345678',
            date: new Date().toLocaleDateString('ar-EG'),
            timestamp: Date.now(),
            status: 'متاحة',
            views: 0
        },
        {
            id: 2,
            gender: 'بنات',
            area: 'غرب',
            type: 'سرير',
            details: 'سرير في غرفة مشتركة مع طالبات، الشقة تحتوي على 3 غرف وحمام مشترك ومطبخ',
            price: '600',
            contact: '01123456789',
            date: new Date().toLocaleDateString('ar-EG'),
            timestamp: Date.now(),
            status: 'متاحة',
            views: 0
        },
        {
            id: 3,
            gender: 'شباب',
            area: 'غرب',
            type: 'شقة',
            details: 'شقة جديدة بمنطقة غرب بني سويف، قريبة من وسائل المواصلات، تحتوي على غرفتين وصالة',
            price: '1200',
            contact: '01234567890',
            date: new Date().toLocaleDateString('ar-EG'),
            timestamp: Date.now(),
            status: 'متاحة',
            views: 0
        }
    ];
    localStorage.setItem('studentHousingListings', JSON.stringify(localListings));
}

// ============================================
// تهيئة التطبيق عند تحميل الصفحة
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    console.log("🚀 بدء تحميل تطبيق سكن طلاب بني سويف...");
    
    // التحقق من اتصال Firebase
    checkFirebaseConnection();
    
    // إعداد معالج النماذج
    const ownerForm = document.getElementById('owner-form');
    if (ownerForm) {
        ownerForm.addEventListener('submit', handleOwnerFormSubmit);
    }
    
    // إعداد تحديثات الوقت الفعلي
    setTimeout(() => {
        setupRealtimeUpdates();
        updateStats('page_views');
    }, 2000);
    
    // إعداد أزرار لوحة المفاتيح
    setupKeyboardNavigation();
    
    // تحسين إمكانية الوصول
    enhanceAccessibility();
});

// ============================================
// التحقق من اتصال Firebase
// ============================================
function checkFirebaseConnection() {
    if (!database) {
        console.log("⚠️ Firebase غير مهيئ، استخدام البيانات المحلية");
        firebaseConnected = false;
        updateConnectionStatus();
        setTimeout(() => {
            hideLoader();
        }, 1000);
        return;
    }

    const connectedRef = database.ref(".info/connected");
    connectedRef.on("value", function(snap) {
        if (snap.val() === true) {
            console.log("✅ Firebase متصل بنجاح");
            firebaseConnected = true;
            updateConnectionStatus();
            loadDataFromFirebase();
        } else {
            console.log("⚠️ Firebase غير متصل، استخدام البيانات المحلية");
            firebaseConnected = false;
            updateConnectionStatus();
            setTimeout(() => {
                hideLoader();
            }, 1000);
        }
    });
}

// ============================================
// تحميل البيانات من Firebase
// ============================================
function loadDataFromFirebase() {
    if (!firebaseConnected || !database) {
        console.log("⚠️ لا يمكن تحميل البيانات، استخدم البيانات المحلية");
        setTimeout(() => {
            hideLoader();
        }, 1000);
        return;
    }
    
    console.log("📥 جاري تحميل البيانات من قاعدة البيانات الجديدة...");
    
    const listingsRef = database.ref('listings');
    listingsRef.once('value')
        .then((snapshot) => {
            const data = snapshot.val();
            if (data) {
                // تحويل البيانات من Firebase إلى مصفوفة
                const firebaseListings = Object.values(data);
                
                // دمج البيانات المحلية مع بيانات Firebase
                mergeListings(firebaseListings);
                
                console.log(`✅ تم تحميل ${firebaseListings.length} عنصر من قاعدة البيانات الجديدة`);
                
                // إظهار إشعار
                showNotification(`تم تحميل ${firebaseListings.length} وحدة سكنية`, 'success');
            } else {
                console.log("ℹ️ لا توجد بيانات في قاعدة البيانات الجديدة، استخدام البيانات المحلية");
                // رفع البيانات المحلية إلى قاعدة البيانات الجديدة
                if (localListings.length > 0) {
                    uploadLocalDataToFirebase();
                }
            }
        })
        .catch((error) => {
            console.error("❌ خطأ في تحميل البيانات من قاعدة البيانات الجديدة:", error);
            showNotification("خطأ في تحميل البيانات من قاعدة البيانات", 'error');
        })
        .finally(() => {
            setTimeout(() => {
                hideLoader();
            }, 1000);
        });
}

// ============================================
// دمج البيانات المحلية مع بيانات Firebase
// ============================================
function mergeListings(firebaseListings) {
    // إنشاء خريطة للبيانات الحالية
    const localMap = new Map();
    localListings.forEach(listing => {
        localMap.set(listing.id, listing);
    });
    
    // تحديث البيانات المحلية ببيانات Firebase
    firebaseListings.forEach(firebaseListing => {
        localMap.set(firebaseListing.id, firebaseListing);
    });
    
    // تحويل الخريطة إلى مصفوفة
    localListings = Array.from(localMap.values());
    
    // ترتيب حسب التاريخ (الأحدث أولاً)
    localListings.sort((a, b) => b.timestamp - a.timestamp);
    
    // تحديث localStorage
    localStorage.setItem('studentHousingListings', JSON.stringify(localListings));
}

// ============================================
// رفع البيانات المحلية إلى قاعدة البيانات الجديدة
// ============================================
function uploadLocalDataToFirebase() {
    if (!firebaseConnected || !database || localListings.length === 0) {
        console.log("⚠️ لا يمكن رفع البيانات المحلية إلى قاعدة البيانات الجديدة");
        return;
    }
    
    console.log("⬆️ جاري رفع البيانات المحلية إلى قاعدة البيانات الجديدة...");
    
    const listingsRef = database.ref('listings');
    const batch = {};
    
    localListings.forEach(listing => {
        batch[listing.id] = listing;
    });
    
    listingsRef.update(batch)
        .then(() => {
            console.log(`✅ تم رفع ${localListings.length} عنصر إلى قاعدة البيانات الجديدة`);
            showNotification("تم مزامنة البيانات مع قاعدة البيانات الجديدة", 'success');
        })
        .catch((error) => {
            console.error("❌ خطأ في رفع البيانات إلى قاعدة البيانات الجديدة:", error);
        });
}

// ============================================
// إخفاء شاشة التحميل
// ============================================
function hideLoader() {
    const loader = document.getElementById('loader');
    if (loader) {
        loader.style.opacity = '0';
        setTimeout(() => {
            loader.style.display = 'none';
        }, 500);
    }
}

// ============================================
// تحديث مؤشر حالة الاتصال
// ============================================
function updateConnectionStatus() {
    const connectionDot = document.getElementById('connection-dot');
    const connectionText = document.getElementById('connection-text');
    
    if (!connectionDot || !connectionText) return;
    
    if (firebaseConnected) {
        connectionDot.classList.add('connected');
        connectionText.textContent = '✅ متصل بقاعدة البيانات';
        connectionText.style.color = '#00C851';
    } else {
        connectionDot.classList.remove('connected');
        connectionText.textContent = '⚠️ غير متصل (بيانات محلية)';
        connectionText.style.color = '#ff4444';
    }
}

// ============================================
// اختيار نوع المستخدم
// ============================================
function selectUserType(type) {
    userData.userType = type;
    
    // تحديث الإحصائيات
    updateStats(type === 'owner' ? 'owner_selected' : 'student_selected');
    
    if (type === 'owner') {
        navigateToPage('owner-gender-page');
        showNotification('مرحباً بك! يمكنك الآن إضافة وحدة سكنية', 'info');
    } else if (type === 'student') {
        navigateToPage('student-gender-page');
        showNotification('مرحباً بك! يمكنك الآن البحث عن سكن مناسب', 'info');
    }
}

// ============================================
// اختيار خيار في النماذج
// ============================================
function selectOption(field, value) {
    userData[field] = value;
    
    // تحديد الصفحة التالية بناءً على الصفحة الحالية
    const currentPage = document.querySelector('.page.active')?.id;
    
    if (!currentPage) return;
    
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

// ============================================
// التنقل بين الصفحات
// ============================================
function navigateToPage(pageId) {
    // إخفاء جميع الصفحات
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    // إظهار الصفحة المطلوبة
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.add('active');
        targetPage.setAttribute('aria-hidden', 'false');
        
        // إخفاء الصفحات الأخرى
        document.querySelectorAll('.page:not(.active)').forEach(page => {
            page.setAttribute('aria-hidden', 'true');
        });
    }
    
    // التمرير إلى أعلى الصفحة
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // تحديث عنوان الصفحة للSEO
    updatePageTitleForPage(pageId);
    
    // تحديث الإحصائيات
    updateStats('page_navigation');
}

// ============================================
// تحديث عنوان الصفحة حسب المحتوى
// ============================================
function updatePageTitleForPage(pageId) {
    const titles = {
        'main-page': 'سكن طلاب بني سويف | المنصة الرسمية',
        'owner-gender-page': 'إضافة سكن | اختر نوع السكن',
        'owner-area-page': 'إضافة سكن | اختر المنطقة',
        'owner-type-page': 'إضافة سكن | اختر نوع الوحدة',
        'owner-details-page': 'إضافة سكن | أدخل التفاصيل',
        'student-gender-page': 'بحث عن سكن | اختر النوع',
        'student-area-page': 'بحث عن سكن | اختر المنطقة',
        'student-type-page': 'بحث عن سكن | اختر نوع السكن',
        'student-results-page': 'نتائج البحث | وحدات سكنية متاحة',
        'confirmation-page': 'تمت الإضافة بنجاح'
    };
    
    if (titles[pageId]) {
        document.title = titles[pageId] + ' | سكن طلاب بني سويف';
        
        // تحديث وصف meta للSEO
        updateMetaDescriptionForPage(pageId);
    }
}

// ============================================
// تحديث وصف الصفحة للSEO
// ============================================
function updateMetaDescriptionForPage(pageId) {
    const descriptions = {
        'main-page': 'منصة سكن طلاب بني سويف الرسمية للبحث عن وإضافة وحدات سكنية للطلاب',
        'owner-details-page': 'أضف وحدة سكنية للطلاب في بني سويف - أدخل التفاصيل والسعر ورقم الاتصال',
        'student-results-page': 'شاهد الوحدات السكنية المتاحة للطلاب في بني سويف حسب معايير البحث'
    };
    
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription && descriptions[pageId]) {
        metaDescription.content = descriptions[pageId];
    }
}

// ============================================
// العودة للصفحة السابقة
// ============================================
function goBack() {
    const currentPage = document.querySelector('.page.active')?.id;
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

// ============================================
// العودة للصفحة الرئيسية
// ============================================
function goToMainPage() {
    navigateToPage('main-page');
    resetUserData();
    showNotification('مرحباً بك في الصفحة الرئيسية', 'info');
}

// ============================================
// إعادة تعيين بيانات المستخدم
// ============================================
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

// ============================================
// معالجة نموذج المالك
// ============================================
async function handleOwnerFormSubmit(e) {
    e.preventDefault();
    
    // جمع البيانات من النموذج
    userData.details = document.getElementById('details')?.value.trim() || '';
    userData.price = document.getElementById('price')?.value.trim() || '';
    userData.contact = document.getElementById('contact')?.value.trim() || '';
    
    // التحقق من اكتمال البيانات
    if (!userData.details || !userData.price || !userData.contact) {
        showNotification('يرجى ملء جميع الحقول المطلوبة', 'error');
        return;
    }
    
    // التحقق من صحة رقم الهاتف
    if (!isValidPhoneNumber(userData.contact)) {
        showNotification('يرجى إدخال رقم هاتف مصري صحيح (يبدأ بـ 01)', 'error');
        return;
    }
    
    // التحقق من السعر
    const price = parseInt(userData.price);
    if (isNaN(price) || price <= 0 || price > 10000) {
        showNotification('يرجى إدخال سعر صحيح بين 1 و 10000 جنيه', 'error');
        return;
    }
    
    // التحقق من طول الوصف
    if (userData.details.length < 20) {
        showNotification('يرجى إدخال وصف مفصل للوحدة (20 حرف على الأقل)', 'error');
        return;
    }
    
    // إضافة الوحدة إلى القائمة
    const success = await addListing();
    
    if (success) {
        // الانتقال إلى صفحة التأكيد
        navigateToPage('confirmation-page');
        showNotification('تم إضافة الوحدة السكنية بنجاح', 'success');
    }
}

// ============================================
// التحقق من صحة رقم الهاتف المصري
// ============================================
function isValidPhoneNumber(phone) {
    // تنظيف الرقم من المسافات والشارات
    const cleaned = phone.replace(/\D/g, '');
    
    // التحقق من أن الرقم يبدأ بـ 01 ويحتوي على 11 رقماً
    const phoneRegex = /^01[0-9]{9}$/;
    return phoneRegex.test(cleaned);
}

// ============================================
// إضافة وحدة سكنية جديدة
// ============================================
async function addListing() {
    try {
        const newListing = {
            id: Date.now(),
            gender: userData.gender,
            area: userData.area,
            type: userData.type,
            details: userData.details,
            price: userData.price,
            contact: userData.contact,
            date: new Date().toLocaleDateString('ar-EG'),
            timestamp: Date.now(),
            status: 'متاحة',
            views: 0,
            addedBy: 'مالك'
        };
        
        // إضافة إلى المصفوفة المحلية
        localListings.unshift(newListing);
        localStorage.setItem('studentHousingListings', JSON.stringify(localListings));
        
        // محاولة الإضافة إلى قاعدة البيانات الجديدة
        if (firebaseConnected && database) {
            try {
                await database.ref('listings/' + newListing.id).set(newListing);
                console.log("✅ تم إضافة الوحدة إلى قاعدة البيانات الجديدة بنجاح");
                
                // إضافة بيانات إحصائية
                updateStats('listings_added');
                updateStats('total_listings', localListings.length);
                
                return true;
            } catch (error) {
                console.error("❌ خطأ في إضافة الوحدة إلى قاعدة البيانات الجديدة:", error);
                showNotification("تمت الإضافة محلياً، لكن حدث خطأ في قاعدة البيانات", 'warning');
                return true;
            }
        } else {
            showNotification("تمت الإضافة محلياً (غير متصل بالإنترنت)", 'warning');
            return true;
        }
    } catch (error) {
        console.error("❌ خطأ في إضافة الوحدة:", error);
        showNotification("حدث خطأ أثناء إضافة الوحدة", 'error');
        return false;
    }
}

// ============================================
// البحث عن الوحدات المتاحة للطالب
// ============================================
function searchListings() {
    // تحديث الإحصائيات
    updateStats('searches_performed');
    
    const filteredListings = localListings.filter(listing => {
        // تحويل القيم للبحث المنطقي
        const studentGender = userData.studentGender === 'شاب' ? 'شباب' : 
                             userData.studentGender === 'بنت' ? 'بنات' : 
                             userData.studentGender;
        
        return listing.gender.includes(studentGender) &&
               listing.area === userData.studentArea &&
               listing.type === userData.studentType &&
               listing.status === 'متاحة';
    });
    
    // ترتيب النتائج حسب التاريخ (الأحدث أولاً)
    filteredListings.sort((a, b) => b.timestamp - a.timestamp);
    
    displayListings(filteredListings);
}

// ============================================
// عرض الوحدات السكنية
// ============================================
function displayListings(listings) {
    const container = document.getElementById('listings-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (listings.length === 0) {
        container.innerHTML = `
            <div class="no-results" style="text-align: center; padding: 60px 20px; background: var(--dark-light); border-radius: 15px;">
                <i class="fas fa-search" style="font-size: 4rem; color: var(--text-light); margin-bottom: 20px;"></i>
                <h3 style="color: var(--text); margin-bottom: 10px;">😔 لا توجد وحدات متاحة</h3>
                <p style="color: var(--text-light); margin-bottom: 20px;">لا توجد وحدات سكنية تطابق معايير البحث الخاصة بك</p>
                <button class="btn-secondary" onclick="goBack()" style="margin: 10px;">
                    <i class="fas fa-arrow-right"></i> تعديل معايير البحث
                </button>
                <button class="btn-primary" onclick="goToMainPage()" style="margin: 10px;">
                    <i class="fas fa-home"></i> العودة للرئيسية
                </button>
            </div>
        `;
        return;
    }
    
    listings.forEach((listing, index) => {
        const listingElement = document.createElement('div');
        listingElement.className = 'listing-card';
        listingElement.setAttribute('itemscope', '');
        listingElement.setAttribute('itemtype', 'https://schema.org/Apartment');
        listingElement.innerHTML = `
            <div class="listing-header">
                <div class="listing-title" itemprop="name">🏠 وحدة سكنية في ${listing.area} بني سويف</div>
                <div class="listing-price" itemprop="offers" itemscope itemtype="https://schema.org/Offer">
                    <span itemprop="price">${listing.price}</span>
                    <span itemprop="priceCurrency">ج.م</span>/شهر
                </div>
            </div>
            <div class="listing-details">
                <span class="listing-detail" itemprop="gender">👥 ${listing.gender}</span>
                <span class="listing-detail" itemprop="type">🏡 ${listing.type}</span>
                <span class="listing-detail" itemprop="dateCreated">📅 ${listing.date}</span>
                <span class="listing-detail" style="background: #00C851;">✅ ${listing.status}</span>
                ${listing.views > 0 ? `<span class="listing-detail">👁️ ${listing.views} مشاهدة</span>` : ''}
            </div>
            <div class="listing-description" itemprop="description">
                ${listing.details}
            </div>
            <div class="listing-contact" itemprop="contactPoint" itemscope itemtype="https://schema.org/ContactPoint">
                <div class="contact-info">
                    <i class="fas fa-phone"></i> 
                    <span itemprop="telephone">📞 ${listing.contact}</span>
                </div>
                <div>
                    <button class="contact-btn" onclick="contactOwner('${listing.contact}', '${listing.details}', ${listing.id})">
                        <i class="fas fa-phone-alt"></i> اتصل الآن
                    </button>
                    <button class="btn-secondary" onclick="showListingDetails(${listing.id})" style="margin-right: 10px; padding: 8px 15px;">
                        <i class="fas fa-info-circle"></i> تفاصيل
                    </button>
                </div>
            </div>
        `;
        container.appendChild(listingElement);
    });
    
    // إضافة معلومات عن مصدر البيانات
    const sourceInfo = document.createElement('div');
    sourceInfo.style.marginTop = '20px';
    sourceInfo.style.color = 'var(--text-light)';
    sourceInfo.style.fontSize = '0.9rem';
    sourceInfo.style.textAlign = 'center';
    sourceInfo.style.padding = '15px';
    sourceInfo.style.backgroundColor = 'var(--dark-light)';
    sourceInfo.style.borderRadius = '10px';
    sourceInfo.innerHTML = `
        <i class="fas fa-database"></i> عرض ${listings.length} وحدة • 
        ${firebaseConnected ? '<i class="fas fa-cloud" style="color: #00C851;"></i> قاعدة بيانات سحابية' : 
        '<i class="fas fa-laptop" style="color: #ff4444;"></i> بيانات محلية'} •
        <button onclick="refreshData()" style="background: none; border: none; color: var(--primary); cursor: pointer; margin-right: 10px;">
            <i class="fas fa-sync-alt"></i> تحديث
        </button>
    `;
    container.appendChild(sourceInfo);
    
    // إضافة Structured Data للقائمة
    addListingsStructuredData(listings);
}

// ============================================
// إضافة Structured Data للقوائم
// ============================================
function addListingsStructuredData(listings) {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    
    const structuredData = {
        "@context": "https://schema.org",
        "@type": "ItemList",
        "name": "وحدات سكنية للطلاب في بني سويف",
        "description": "قائمة بالوحدات السكنية المتاحة للإيجار للطلاب في بني سويف",
        "numberOfItems": listings.length,
        "itemListElement": listings.map((listing, index) => ({
            "@type": "ListItem",
            "position": index + 1,
            "item": {
                "@type": "Apartment",
                "name": `سكن طلابي في ${listing.area} بني سويف`,
                "description": listing.details.substring(0, 150) + '...',
                "address": {
                    "@type": "PostalAddress",
                    "addressLocality": "بني سويف",
                    "addressRegion": "بني سويف",
                    "addressCountry": "EG"
                },
                "offers": {
                    "@type": "Offer",
                    "price": listing.price,
                    "priceCurrency": "EGP",
                    "availability": "https://schema.org/InStock"
                }
            }
        }))
    };
    
    script.textContent = JSON.stringify(structuredData);
    document.head.appendChild(script);
}

// ============================================
// الاتصال بالمالك
// ============================================
function contactOwner(phoneNumber, details, listingId) {
    const message = `مرحباً، أنا مهتم بالوحدة السكنية التي أعلنت عنها:\n${details.substring(0, 100)}...`;
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    
    const choice = confirm(`هل تريد الاتصال بالرقم: ${phoneNumber}؟\n\nيمكنك إرسال رسالة واتساب تحتوي على استفسارك`);
    
    if (choice) {
        // تحسين تجربة الاتصال
        const whatsappUrl = `https://wa.me/2${cleanPhone}?text=${encodeURIComponent(message)}`;
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        if (isMobile) {
            // فتح واتساب مباشرة على الجوال
            window.open(whatsappUrl, '_blank');
        } else {
            // عرض رابط واتساب ويب على الكمبيوتر
            window.open(`https://web.whatsapp.com/send?phone=2${cleanPhone}&text=${encodeURIComponent(message)}`, '_blank');
        }
        
        // تحديث إحصائيات الاتصال
        updateStats('contacts_made');
        
        // تحديث عدد المشاهدات في قاعدة البيانات الجديدة
        if (firebaseConnected && database && listingId) {
            // زيادة المشاهدات
            database.ref(`listings/${listingId}/views`).transaction(current => {
                return (current || 0) + 1;
            });
            
            // تحديث الإحصائيات
            database.ref(`listings/${listingId}/lastContacted`).set(new Date().toISOString());
        }
    }
}

// ============================================
// عرض تفاصيل الوحدة
// ============================================
function showListingDetails(listingId) {
    const listing = localListings.find(l => l.id === listingId);
    if (!listing) {
        showNotification('الوحدة غير موجودة', 'error');
        return;
    }
    
    // زيادة عدد المشاهدات
    if (firebaseConnected && database) {
        database.ref(`listings/${listingId}/views`).transaction(current => {
            return (current || 0) + 1;
        });
    }
    
    // إنشاء النافذة المنبثقة
    const modalHTML = `
        <div id="listing-modal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.9); z-index: 10000; display: flex; justify-content: center; align-items: center; padding: 20px; backdrop-filter: blur(5px);">
            <div style="background: linear-gradient(135deg, var(--dark-light) 0%, #1E1E1E 100%); border-radius: 20px; padding: 30px; max-width: 700px; width: 100%; max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 60px rgba(0,0,0,0.5); border: 1px solid #333;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px;">
                    <h3 style="color: var(--text); margin: 0; font-size: 1.5rem;">📋 تفاصيل الوحدة السكنية</h3>
                    <button onclick="closeModal()" style="background: none; border: none; color: var(--text-light); font-size: 1.8rem; cursor: pointer; padding: 0 10px; border-radius: 50%;" aria-label="إغلاق">
                        ×
                    </button>
                </div>
                
                <div style="display: flex; gap: 15px; margin-bottom: 25px; flex-wrap: wrap;">
                    <span style="background: var(--primary); color: white; padding: 8px 20px; border-radius: 25px; font-weight: 500;">${listing.gender}</span>
                    <span style="background: var(--darker); color: var(--text); padding: 8px 20px; border-radius: 25px; font-weight: 500;">${listing.area}</span>
                    <span style="background: var(--darker); color: var(--text); padding: 8px 20px; border-radius: 25px; font-weight: 500;">${listing.type}</span>
                    <span style="background: #00C851; color: white; padding: 8px 20px; border-radius: 25px; font-weight: bold;">${listing.price} ج.م</span>
                </div>
                
                <div style="margin-bottom: 25px;">
                    <h4 style="color: var(--text); margin-bottom: 12px; font-size: 1.2rem;">📝 الوصف التفصيلي:</h4>
                    <p style="color: var(--text-light); line-height: 1.7; background: var(--darker); padding: 20px; border-radius: 12px; border-right: 4px solid var(--primary);">
                        ${listing.details}
                    </p>
                </div>
                
                <div style="margin-bottom: 25px;">
                    <h4 style="color: var(--text); margin-bottom: 12px; font-size: 1.2rem;">📞 معلومات الاتصال:</h4>
                    <div style="display: flex; align-items: center; gap: 15px; background: var(--darker); padding: 20px; border-radius: 12px;">
                        <i class="fas fa-phone" style="color: var(--primary); font-size: 1.3rem;"></i>
                        <span style="color: var(--text); font-size: 1.3rem; font-weight: 600; direction: ltr;">${listing.contact}</span>
                    </div>
                </div>
                
                <div style="margin-bottom: 25px;">
                    <h4 style="color: var(--text); margin-bottom: 12px; font-size: 1.2rem;">📊 معلومات إضافية:</h4>
                    <div style="display: flex; gap: 15px; flex-wrap: wrap;">
                        <span style="background: #2A2A2A; padding: 10px 20px; border-radius: 10px; color: var(--text-light); display: flex; align-items: center; gap: 8px;">
                            <i class="fas fa-calendar"></i> ${listing.date}
                        </span>
                        <span style="background: #2A2A2A; padding: 10px 20px; border-radius: 10px; color: var(--text-light); display: flex; align-items: center; gap: 8px;">
                            <i class="fas fa-database"></i> ${firebaseConnected ? 'مخزن في السحابة' : 'مخزن محلياً'}
                        </span>
                        ${listing.views > 0 ? `
                        <span style="background: #2A2A2A; padding: 10px 20px; border-radius: 10px; color: var(--text-light); display: flex; align-items: center; gap: 8px;">
                            <i class="fas fa-eye"></i> ${listing.views} مشاهدة
                        </span>` : ''}
                    </div>
                </div>
                
                <div style="display: flex; gap: 15px; margin-top: 30px; flex-wrap: wrap;">
                    <button onclick="contactOwner('${listing.contact}', '${listing.details}', ${listing.id})" 
                            style="flex: 1; background: linear-gradient(45deg, var(--primary), var(--primary-dark)); color: white; border: none; padding: 16px; border-radius: 12px; cursor: pointer; font-family: 'T
