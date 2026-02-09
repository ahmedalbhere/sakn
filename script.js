// تهيئة Firebase
let firebaseConnected = false;
let database;

try {
    firebase.initializeApp(firebaseConfig);
    database = firebase.database();
    console.log("تم تهيئة Firebase بنجاح");
} catch (error) {
    console.error("خطأ في تهيئة Firebase:", error);
    document.getElementById('loader-text').textContent = "خطأ في الاتصال بقاعدة البيانات، جاري استخدام النسخة المحلية...";
}

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

// بيانات الوحدات السكنية المخزنة محلياً (للنسخ الاحتياطي)
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
            date: '2023-10-15'
        },
        {
            id: 2,
            gender: 'بنات',
            area: 'غرب',
            type: 'سرير',
            details: 'سرير في غرفة مشتركة مع طالبات، الشقة تحتوي على 3 غرف وحمام مشترك ومطبخ',
            price: '600',
            contact: '01123456789',
            date: '2023-10-10'
        },
        {
            id: 3,
            gender: 'شباب',
            area: 'غرب',
            type: 'شقة',
            details: 'شقة جديدة بمنطقة غرب بني سويف، قريبة من وسائل المواصلات، تحتوي على غرفتين وصالة',
            price: '1200',
            contact: '01234567890',
            date: '2023-10-05'
        }
    ];
    localStorage.setItem('studentHousingListings', JSON.stringify(localListings));
}

// تهيئة التطبيق عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    // التحقق من اتصال Firebase
    checkFirebaseConnection();
    
    // إعداد معالج النماذج
    document.getElementById('owner-form').addEventListener('submit', handleOwnerFormSubmit);
});

// التحقق من اتصال Firebase
function checkFirebaseConnection() {
    if (!database) {
        console.log("Firebase غير مهيئ، استخدام البيانات المحلية");
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
            console.log("Firebase متصل");
            firebaseConnected = true;
            document.getElementById('loader-text').textContent = "جاري تحميل البيانات...";
            
            // تحديث حالة الاتصال
            updateConnectionStatus();
            
            // تحميل البيانات من Firebase
            loadDataFromFirebase();
        } else {
            console.log("Firebase غير متصل، استخدام البيانات المحلية");
            firebaseConnected = false;
            updateConnectionStatus();
            setTimeout(() => {
                hideLoader();
            }, 1000);
        }
    });
}

// تحميل البيانات من Firebase
function loadDataFromFirebase() {
    if (!firebaseConnected || !database) {
        setTimeout(() => {
            hideLoader();
        }, 1000);
        return;
    }
    
    const listingsRef = database.ref('listings');
    listingsRef.once('value')
        .then((snapshot) => {
            const data = snapshot.val();
            if (data) {
                // تحويل البيانات من Firebase إلى مصفوفة
                localListings = Object.values(data);
                console.log("تم تحميل البيانات من Firebase:", localListings.length, "عنصر");
                // تحديث localStorage
                localStorage.setItem('studentHousingListings', JSON.stringify(localListings));
            } else {
                console.log("لا توجد بيانات في Firebase، استخدام البيانات المحلية");
                // إذا لم تكن هناك بيانات في Firebase، استخدم البيانات المحلية
                if (localListings.length > 0) {
                    // رفع البيانات المحلية إلى Firebase
                    uploadLocalDataToFirebase();
                }
            }
        })
        .catch((error) => {
            console.error("خطأ في تحميل البيانات من Firebase:", error);
        })
        .finally(() => {
            setTimeout(() => {
                hideLoader();
            }, 1000);
        });
}

// رفع البيانات المحلية إلى Firebase
function uploadLocalDataToFirebase() {
    if (!firebaseConnected || !database || localListings.length === 0) return;
    
    const listingsRef = database.ref('listings');
    localListings.forEach((listing, index) => {
        listingsRef.child(listing.id).set(listing)
            .then(() => {
                if (index === localListings.length - 1) {
                    console.log("تم رفع جميع البيانات المحلية إلى Firebase");
                }
            })
            .catch((error) => {
                console.error("خطأ في رفع البيانات إلى Firebase:", error);
            });
    });
}

// إخفاء شاشة التحميل
function hideLoader() {
    document.getElementById('loader').style.opacity = '0';
    setTimeout(() => {
        document.getElementById('loader').style.display = 'none';
    }, 500);
}

// تحديث مؤشر حالة الاتصال
function updateConnectionStatus() {
    const connectionDot = document.getElementById('connection-dot');
    const connectionText = document.getElementById('connection-text');
    
    if (firebaseConnected) {
        connectionDot.classList.add('connected');
        connectionText.textContent = 'متصل بقاعدة البيانات';
        connectionText.style.color = '#00C851';
    } else {
        connectionDot.classList.remove('connected');
        connectionText.textContent = 'غير متصل (بيانات محلية)';
        connectionText.style.color = '#ff4444';
    }
}

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
    document.getElementById('owner-form').reset();
}

// معالجة نموذج المالك
async function handleOwnerFormSubmit(e) {
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
    
    // التحقق من صحة رقم الهاتف (اختياري)
    if (!isValidPhoneNumber(userData.contact)) {
        alert('يرجى إدخال رقم هاتف صحيح (يبدأ بـ 01)');
        return;
    }
    
    // إضافة الوحدة إلى القائمة
    await addListing();
    
    // الانتقال إلى صفحة التأكيد
    navigateToPage('confirmation-page');
}

// التحقق من صحة رقم الهاتف
function isValidPhoneNumber(phone) {
    // التحقق من أن الرقم يبدأ بـ 01 ويحتوي على 11 رقماً
    const phoneRegex = /^01[0-9]{9}$/;
    return phoneRegex.test(phone.replace(/\D/g, ''));
}

// إضافة وحدة سكنية جديدة
async function addListing() {
    const newListing = {
        id: Date.now(),
        gender: userData.gender,
        area: userData.area,
        type: userData.type,
        details: userData.details,
        price: userData.price,
        contact: userData.contact,
        date: new Date().toLocaleDateString('ar-EG'),
        timestamp: Date.now()
    };
    
    // إضافة إلى المصفوفة المحلية
    localListings.push(newListing);
    localStorage.setItem('studentHousingListings', JSON.stringify(localListings));
    
    // محاولة الإضافة إلى Firebase
    if (firebaseConnected && database) {
        try {
            await database.ref('listings/' + newListing.id).set(newListing);
            console.log("تم إضافة الوحدة إلى Firebase بنجاح");
        } catch (error) {
            console.error("خطأ في إضافة الوحدة إلى Firebase:", error);
        }
    }
}

// البحث عن الوحدات المتاحة للطالب
function searchListings() {
    const filteredListings = localListings.filter(listing => {
        // تحويل القيم للبحث المنطقي
        const studentGender = userData.studentGender === 'شاب' ? 'شباب' : userData.studentGender === 'بنت' ? 'بنات' : userData.studentGender;
        
        return listing.gender.includes(studentGender) &&
               listing.area === userData.studentArea &&
               listing.type === userData.studentType;
    });
    
    // ترتيب النتائج حسب التاريخ (الأحدث أولاً)
    filteredListings.sort((a, b) => b.timestamp - a.timestamp);
    
    displayListings(filteredListings);
}

// عرض الوحدات السكنية
function displayListings(listings) {
    const container = document.getElementById('listings-container');
    container.innerHTML = '';
    
    if (listings.length === 0) {
        container.innerHTML = `
            <div class="no-results">
                <i class="fas fa-search" style="font-size: 4rem; color: var(--text-light); margin-bottom: 20px;"></i>
                <h3 style="color: var(--text); margin-bottom: 10px;">لا توجد وحدات متاحة</h3>
                <p style="color: var(--text-light);">لا توجد وحدات سكنية تطابق معايير البحث الخاصة بك</p>
                <button class="btn-secondary" onclick="goBack()" style="margin-top: 20px;">
                    <i class="fas fa-arrow-right"></i> تعديل معايير البحث
                </button>
            </div>
        `;
        return;
    }
    
    listings.forEach(listing => {
        const listingElement = document.createElement('div');
        listingElement.className = 'listing-card';
        listingElement.innerHTML = `
            <div class="listing-header">
                <div class="listing-title">وحدة سكنية في ${listing.area} بني سويف</div>
                <div class="listing-price">${listing.price} ج.م/شهر</div>
            </div>
            <div class="listing-details">
                <span class="listing-detail">${listing.gender}</span>
                <span class="listing-detail">${listing.type}</span>
                <span class="listing-detail">${listing.date}</span>
            </div>
            <div class="listing-description">
                ${listing.details}
            </div>
            <div class="listing-contact">
                <div class="contact-info">
                    <i class="fas fa-phone"></i> ${listing.contact}
                </div>
                <div>
                    <button class="contact-btn" onclick="contactOwner('${listing.contact}', '${listing.details}')">
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
        ${firebaseConnected ? '<i class="fas fa-cloud" style="color: #00C851;"></i> بيانات محدثة من السحابة' : 
        '<i class="fas fa-laptop" style="color: #ff4444;"></i> بيانات محلية'} •
        <button onclick="refreshData()" style="background: none; border: none; color: var(--primary); cursor: pointer; margin-right: 10px;">
            <i class="fas fa-sync-alt"></i> تحديث
        </button>
    `;
    container.appendChild(sourceInfo);
}

// الاتصال بالمالك
function contactOwner(phoneNumber, details) {
    const message = `مرحباً، أنا مهتم بالوحدة السكنية التي أعلنت عنها:\n${details.substring(0, 100)}...`;
    
    if (confirm(`هل تريد الاتصال بالرقم: ${phoneNumber}؟\n\nيمكنك أيضاً إرسال رسالة واتساب تحتوي على استفسارك`)) {
        const whatsappUrl = `https://wa.me/${phoneNumber.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
        const choice = confirm('اختر طريقة الاتصال:\n• موافق: فتح واتساب\n• إلغاء: الاتصال هاتفياً');
        
        if (choice) {
            window.open(whatsappUrl, '_blank');
        } else {
            window.open(`tel:${phoneNumber}`, '_self');
        }
    }
}

// عرض تفاصيل الوحدة
function showListingDetails(listingId) {
    const listing = localListings.find(l => l.id === listingId);
    if (!listing) return;
    
    const modalHTML = `
        <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 1000; display: flex; justify-content: center; align-items: center; padding: 20px;">
            <div style="background: var(--dark-light); border-radius: 15px; padding: 30px; max-width: 600px; width: 100%; max-height: 90vh; overflow-y: auto;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h3 style="color: var(--text); margin: 0;">تفاصيل الوحدة السكنية</h3>
                    <button onclick="closeModal()" style="background: none; border: none; color: var(--text-light); font-size: 1.5rem; cursor: pointer;">×</button>
                </div>
                
                <div style="display: flex; gap: 15px; margin-bottom: 20px; flex-wrap: wrap;">
                    <span style="background: var(--primary); color: white; padding: 5px 15px; border-radius: 20px;">${listing.gender}</span>
                    <span style="background: var(--darker); color: var(--text); padding: 5px 15px; border-radius: 20px;">${listing.area}</span>
                    <span style="background: var(--darker); color: var(--text); padding: 5px 15px; border-radius: 20px;">${listing.type}</span>
                    <span style="background: #00C851; color: white; padding: 5px 15px; border-radius: 20px;">${listing.price} ج.م</span>
                </div>
                
                <div style="margin-bottom: 20px;">
                    <h4 style="color: var(--text); margin-bottom: 10px;">الوصف التفصيلي:</h4>
                    <p style="color: var(--text-light); line-height: 1.6; background: var(--darker); padding: 15px; border-radius: 10px;">${listing.details}</p>
                </div>
                
                <div style="margin-bottom: 20px;">
                    <h4 style="color: var(--text); margin-bottom: 10px;">معلومات الاتصال:</h4>
                    <div style="display: flex; align-items: center; gap: 10px; background: var(--darker); padding: 15px; border-radius: 10px;">
                        <i class="fas fa-phone" style="color: var(--primary);"></i>
                        <span style="color: var(--text); font-size: 1.1rem; font-weight: 500;">${listing.contact}</span>
                    </div>
                </div>
                
                <div style="display: flex; gap: 10px; margin-top: 30px;">
                    <button onclick="contactOwner('${listing.contact}', '${listing.details}')" style="flex: 1; background: var(--primary); color: white; border: none; padding: 12px; border-radius: 8px; cursor: pointer; font-family: 'Tajawal';">
                        <i class="fas fa-phone-alt"></i> اتصل بالمالك
                    </button>
                    <button onclick="closeModal()" style="flex: 1; background: var(--dark); color: var(--text); border: 1px solid var(--border); padding: 12px; border-radius: 8px; cursor: pointer; font-family: 'Tajawal';">
                        إغلاق
                    </button>
                </div>
            </div>
        </div>
    `;
    
    const modal = document.createElement('div');
    modal.id = 'listing-modal';
    modal.innerHTML = modalHTML;
    document.body.appendChild(modal);
}

// إغلاق النافذة المنبثقة
function closeModal() {
    const modal = document.getElementById('listing-modal');
    if (modal) {
        modal.remove();
    }
}

// تحديث البيانات
function refreshData() {
    if (firebaseConnected && database) {
        document.getElementById('loader-text').textContent = "جاري تحديث البيانات...";
        document.getElementById('loader').style.display = 'flex';
        document.getElementById('loader').style.opacity = '1';
        
        loadDataFromFirebase();
        
        setTimeout(() => {
            hideLoader();
            if (document.getElementById('student-results-page').classList.contains('active')) {
                searchListings();
                showNotification('تم تحديث البيانات بنجاح', 'success');
            }
        }, 1500);
    } else {
        showNotification('لا يوجد اتصال بالإنترنت لتحديث البيانات', 'error');
    }
}

// عرض إشعار
function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.style.position = 'fixed';
    notification.style.top = '20px';
    notification.style.right = '20px';
    notification.style.padding = '15px 20px';
    notification.style.borderRadius = '8px';
    notification.style.color = 'white';
    notification.style.fontFamily = "'Tajawal', sans-serif";
    notification.style.zIndex = '1000';
    notification.style.boxShadow = '0 5px 15px rgba(0,0,0,0.3)';
    notification.style.display = 'flex';
    notification.style.alignItems = 'center';
    notification.style.gap = '10px';
    notification.style.maxWidth = '300px';
    notification.style.animation = 'slideInLeft 0.3s ease';
    
    if (type === 'success') {
        notification.style.background = 'linear-gradient(45deg, #00C851, #007E33)';
    } else if (type === 'error') {
        notification.style.background = 'linear-gradient(45deg, #ff4444, #CC0000)';
    } else {
        notification.style.background = 'linear-gradient(45deg, var(--primary), var(--primary-dark))';
    }
    
    notification.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideInLeft 0.3s ease reverse';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// دالة لاختبار اتصال Firebase
function testFirebaseConnection() {
    if (firebaseConnected) {
        showNotification("Firebase متصل بنجاح ✓", "success");
    } else {
        showNotification("Firebase غير متصل، يتم استخدام البيانات المحلية", "error");
    }
}

// إضافة أسلوب للرسوم المتحركة للإشعارات
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInLeft {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
`;
document.head.appendChild(style);

// إضافة معالج لاستلام التحديثات في الوقت الفعلي من Firebase
function setupRealtimeUpdates() {
    if (!firebaseConnected || !database) return;
    
    const listingsRef = database.ref('listings');
    listingsRef.on('child_added', (snapshot) => {
        const newListing = snapshot.val();
        // التحقق إذا كانت الوحدة الجديدة غير موجودة محلياً
        if (!localListings.some(listing => listing.id === newListing.id)) {
            localListings.push(newListing);
            localStorage.setItem('studentHousingListings', JSON.stringify(localListings));
            
            // إذا كنا في صفحة النتائج، قم بتحديث العرض
            if (document.getElementById('student-results-page').classList.contains('active')) {
                searchListings();
                showNotification('تمت إضافة وحدة سكنية جديدة', 'success');
            }
        }
    });
    
    listingsRef.on('child_changed', (snapshot) => {
        const updatedListing = snapshot.val();
        const index = localListings.findIndex(listing => listing.id === updatedListing.id);
        if (index !== -1) {
            localListings[index] = updatedListing;
            localStorage.setItem('studentHousingListings', JSON.stringify(localListings));
            
            if (document.getElementById('student-results-page').classList.contains('active')) {
                searchListings();
            }
        }
    });
    
    listingsRef.on('child_removed', (snapshot) => {
        const removedId = snapshot.val().id;
        localListings = localListings.filter(listing => listing.id !== removedId);
        localStorage.setItem('studentHousingListings', JSON.stringify(localListings));
        
        if (document.getElementById('student-results-page').classList.contains('active')) {
            searchListings();
        }
    });
}

// استدعاء إعداد التحديثات في الوقت الفعلي بعد التأكد من الاتصال
setTimeout(() => {
    if (firebaseConnected) {
        setupRealtimeUpdates();
    }
}, 2000);

// دالة للحصول على أحدث البيانات من Firebase
async function getLatestData() {
    if (!firebaseConnected || !database) return localListings;
    
    try {
        const snapshot = await database.ref('listings').once('value');
        const data = snapshot.val();
        if (data) {
            localListings = Object.values(data);
            localStorage.setItem('studentHousingListings', JSON.stringify(localListings));
            return localListings;
        }
    } catch (error) {
        console.error('خطأ في الحصول على أحدث البيانات:', error);
    }
    
    return localListings;
}

// تصدير الدوال للاستخدام العام
window.selectUserType = selectUserType;
window.selectOption = selectOption;
window.goBack = goBack;
window.goToMainPage = goToMainPage;
window.contactOwner = contactOwner;
window.showListingDetails = showListingDetails;
window.refreshData = refreshData;
window.testFirebaseConnection = testFirebaseConnection;
