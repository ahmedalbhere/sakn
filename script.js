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
    contact: '',
    location: ''
};

// دالة توليد هاش للوحدة (للكشف عن التكرار)
function generateListingHash(listingData) {
    // نقوم بتوليد هاش فريد بناءً على البيانات الأساسية
    const dataString = `${listingData.gender}-${listingData.area}-${listingData.type}-${listingData.details}-${listingData.price}-${listingData.contact}`;
    
    // دالة بسيطة لتوليد هاش
    let hash = 0;
    for (let i = 0; i < dataString.length; i++) {
        const char = dataString.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
}

// التحقق من التكرار قبل الإضافة
async function checkDuplicateListing(listingData) {
    const hash = generateListingHash(listingData);
    const duplicateRef = database.ref('duplicateCheck/' + hash);
    
    try {
        const snapshot = await duplicateRef.once('value');
        return snapshot.exists();
    } catch (error) {
        console.error("خطأ في التحقق من التكرار:", error);
        return false;
    }
}

// إضافة علامة التكرار
async function markAsDuplicate(hash) {
    const duplicateRef = database.ref('duplicateCheck/' + hash);
    try {
        await duplicateRef.set(true);
        // ضبط تاريخ انتهاء علامة التكرار (30 يومًا)
        setTimeout(() => {
            duplicateRef.remove();
        }, 30 * 24 * 60 * 60 * 1000);
    } catch (error) {
        console.error("خطأ في إضافة علامة التكرار:", error);
    }
}

// تهيئة التطبيق عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    // مراقبة حالة المصادقة
    auth.onAuthStateChanged((user) => {
        if (user) {
            document.getElementById('user-status').textContent = `مرحباً ${user.isAnonymous ? 'ضيف' : user.email}`;
            document.getElementById('auth-status').textContent = 'جاري تحميل البيانات...';
            
            // تحميل البيانات وإخفاء شاشة التحميل
            setTimeout(() => {
                document.getElementById('loader').style.opacity = '0';
                setTimeout(() => {
                    document.getElementById('loader').style.display = 'none';
                }, 500);
            }, 1000);
        } else {
            document.getElementById('auth-status').textContent = 'جاري تسجيل الدخول...';
            initializeAuth();
        }
    });
    
    // إعداد معالج النماذج
    document.getElementById('owner-form').addEventListener('submit', handleOwnerFormSubmit);
    
    // تفعيل التنظيف الدوري (كل ساعة)
    setInterval(cleanExpiredListings, 60 * 60 * 1000);
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
        searchListings();
        navigateToPage('student-results-page');
    }
}

// التنقل بين الصفحات
function navigateToPage(pageId) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    document.getElementById(pageId).classList.add('active');
    window.scrollTo(0, 0);
}

// العودة للصفحة السابقة
function goBack() {
    const currentPage = document.querySelector('.page.active').id;
    let previousPage = '';
    
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
        contact: '',
        location: ''
    };
    
    document.getElementById('owner-form').reset();
    document.getElementById('form-message').innerHTML = '';
    document.getElementById('form-message').className = 'form-message';
}

// معالجة نموذج المالك
async function handleOwnerFormSubmit(e) {
    e.preventDefault();
    
    // جمع البيانات من النموذج
    userData.details = document.getElementById('details').value.trim();
    userData.price = document.getElementById('price').value.trim();
    userData.contact = document.getElementById('contact').value.trim();
    userData.location = document.getElementById('location').value.trim();
    
    // التحقق من اكتمال البيانات
    if (!userData.details || !userData.price || !userData.contact) {
        showMessage('يرجى ملء جميع الحقول المطلوبة (*)', 'error');
        return;
    }
    
    // التحقق من السعر
    if (parseInt(userData.price) < 100) {
        showMessage('السعر يجب أن يكون 100 جنيهاً على الأقل', 'error');
        return;
    }
    
    // التحقق من رقم الهاتف
    if (!/^01[0125][0-9]{8}$/.test(userData.contact)) {
        showMessage('يرجى إدخال رقم هاتف مصري صحيح (11 رقماً)', 'error');
        return;
    }
    
    // تغيير حالة الزر
    const submitBtn = document.getElementById('submit-btn');
    const btnText = document.getElementById('btn-text');
    const btnIcon = document.getElementById('btn-icon');
    const btnSpinner = document.getElementById('btn-spinner');
    
    submitBtn.disabled = true;
    btnText.textContent = 'جاري التحقق...';
    btnIcon.style.display = 'none';
    btnSpinner.style.display = 'block';
    
    try {
        // التحقق من التكرار
        const isDuplicate = await checkDuplicateListing(userData);
        
        if (isDuplicate) {
            showMessage('⚠️ هذه الوحدة موجودة بالفعل في قاعدة البيانات', 'warning');
            submitBtn.disabled = false;
            btnText.textContent = 'إضافة الوحدة';
            btnIcon.style.display = 'inline-block';
            btnSpinner.style.display = 'none';
            return;
        }
        
        // إضافة الوحدة إذا لم تكن مكررة
        const success = await addListing();
        
        if (success) {
            // الانتقال إلى صفحة التأكيد
            setTimeout(() => {
                navigateToPage('confirmation-page');
                resetUserData();
            }, 1000);
        }
    } catch (error) {
        console.error("خطأ في الإضافة:", error);
        showMessage('حدث خطأ أثناء الإضافة. حاول مرة أخرى.', 'error');
        submitBtn.disabled = false;
        btnText.textContent = 'إضافة الوحدة';
        btnIcon.style.display = 'inline-block';
        btnSpinner.style.display = 'none';
    }
}

// إضافة وحدة سكنية جديدة
async function addListing() {
    return new Promise((resolve, reject) => {
        const user = auth.currentUser;
        if (!user) {
            reject(new Error("المستخدم غير مسجل"));
            return;
        }
        
        const timestamp = Date.now();
        const expiresAt = timestamp + (7 * 24 * 60 * 60 * 1000); // 7 أيام من الآن
        
        const newListing = {
            gender: userData.gender,
            area: userData.area,
            type: userData.type,
            details: userData.details,
            price: userData.price,
            contact: userData.contact,
            location: userData.location || '',
            ownerId: user.uid,
            createdAt: timestamp,
            expiresAt: expiresAt,
            status: 'active'
        };
        
        // توليد الهاش وإضافة علامة التكرار
        const hash = generateListingHash(userData);
        
        // إضافة إلى Firebase
        const newListingRef = database.ref('listings').push();
        newListingRef.set(newListing)
            .then(() => {
                // إضافة علامة التكرار
                return markAsDuplicate(hash);
            })
            .then(() => {
                console.log("تم الإضافة بنجاح إلى Firebase");
                showMessage('✅ تم إضافة الوحدة بنجاح', 'success');
                
                // تحديث حالة الزر
                const submitBtn = document.getElementById('submit-btn');
                const btnText = document.getElementById('btn-text');
                const btnIcon = document.getElementById('btn-icon');
                const btnSpinner = document.getElementById('btn-spinner');
                
                submitBtn.disabled = true;
                btnText.textContent = 'تمت الإضافة';
                btnIcon.style.display = 'inline-block';
                btnSpinner.style.display = 'none';
                btnIcon.className = 'fas fa-check-circle';
                
                resolve(true);
            })
            .catch(error => {
                console.error("خطأ في الإضافة:", error);
                reject(error);
            });
    });
}

// عرض الرسائل
function showMessage(text, type) {
    const messageDiv = document.getElementById('form-message');
    messageDiv.innerHTML = text;
    messageDiv.className = `form-message ${type}`;
    
    if (type === 'success') {
        setTimeout(() => {
            messageDiv.innerHTML = '';
            messageDiv.className = 'form-message';
        }, 3000);
    }
}

// البحث عن الوحدات المتاحة للطالب
function searchListings() {
    const listingsRef = database.ref('listings');
    const now = Date.now();
    
    listingsRef.once('value')
        .then(snapshot => {
            const allListings = snapshot.val() || {};
            const filteredListings = [];
            
            // تحويل الكائن إلى مصفوفة وتصفية
            Object.keys(allListings).forEach(key => {
                const listing = allListings[key];
                
                // التحقق من انتهاء الصلاحية
                if (listing.expiresAt && listing.expiresAt < now) {
                    // حذف السجلات المنتهية (تنظيف)
                    database.ref('listings/' + key).remove();
                    return;
                }
                
                // الفلترة حسب معايير البحث
                if (listing.gender && 
                    listing.gender.includes(userData.studentGender) &&
                    listing.area === userData.studentArea &&
                    listing.type === userData.studentType &&
                    listing.status === 'active') {
                    
                    listing.id = key;
                    listing.daysLeft = Math.ceil((listing.expiresAt - now) / (24 * 60 * 60 * 1000));
                    filteredListings.push(listing);
                }
            });
            
            // ترتيب حسب الأحدث
            filteredListings.sort((a, b) => b.createdAt - a.createdAt);
            displayListings(filteredListings);
        })
        .catch(error => {
            console.error("خطأ في جلب البيانات:", error);
            document.getElementById('listings-container').innerHTML = 
                '<div class="error-message"><i class="fas fa-exclamation-circle"></i><p>حدث خطأ أثناء تحميل البيانات. حاول مرة أخرى.</p></div>';
        });
}

// تنظيف السجلات المنتهية
async function cleanExpiredListings() {
    const listingsRef = database.ref('listings');
    const now = Date.now();
    
    try {
        const snapshot = await listingsRef.once('value');
        const allListings = snapshot.val() || {};
        const deletePromises = [];
        
        Object.keys(allListings).forEach(key => {
            const listing = allListings[key];
            if (listing.expiresAt && listing.expiresAt < now) {
                deletePromises.push(database.ref('listings/' + key).remove());
            }
        });
        
        await Promise.all(deletePromises);
        if (deletePromises.length > 0) {
            console.log(`تم حذف ${deletePromises.length} إعلان منتهي`);
        }
    } catch (error) {
        console.error("خطأ في تنظيف السجلات:", error);
    }
}

// عرض الوحدات السكنية
function displayListings(listingsArray) {
    const container = document.getElementById('listings-container');
    
    if (!listingsArray || listingsArray.length === 0) {
        container.innerHTML = `
            <div class="no-results">
                <i class="fas fa-search"></i>
                <h3>لا توجد وحدات متطابقة مع بحثك</h3>
                <p>حاول تغيير معايير البحث أو عد لاحقاً</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    
    listingsArray.forEach(listing => {
        const createdDate = new Date(listing.createdAt).toLocaleDateString('ar-EG');
        const daysLeft = listing.daysLeft > 0 ? listing.daysLeft : 0;
        
        html += `
            <div class="listing-card">
                <div class="listing-header">
                    <h3 class="listing-title">${listing.type === 'شقة' ? 'شقة كاملة' : 'سرير مفرد'}</h3>
                    <div class="listing-price">${listing.price} ج.م / شهر</div>
                </div>
                
                <div class="listing-details">
                    <span class="listing-detail">
                        <i class="fas ${listing.gender.includes('بنات') ? 'fa-female' : 'fa-male'}"></i>
                        ${listing.gender}
                    </span>
                    <span class="listing-detail">
                        <i class="fas fa-map-marker-alt"></i>
                        ${listing.area} بني سويف
                    </span>
                    <span class="listing-detail">
                        <i class="fas fa-calendar"></i>
                        ${createdDate}
                    </span>
                    <span class="listing-detail ${daysLeft < 3 ? 'urgent' : ''}">
                        <i class="fas fa-clock"></i>
                        ${daysLeft} يوم متبقي
                    </span>
                </div>
                
                ${listing.location ? `<p class="listing-location"><i class="fas fa-map-pin"></i> ${listing.location}</p>` : ''}
                
                <p class="listing-description">${listing.details}</p>
                
                <div class="listing-contact">
                    <div class="contact-info">
                        <i class="fas fa-phone"></i>
                        ${listing.contact}
                    </div>
                    <button class="contact-btn" onclick="contactOwner('${listing.contact}')">
                        <i class="fas fa-comment"></i>
                        تواصل مع المالك
                    </button>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// دالة الاتصال بالملاك
function contactOwner(phoneNumber) {
    if (confirm(`هل تريد الاتصال على الرقم: ${phoneNumber}؟`)) {
        window.open(`tel:${phoneNumber}`);
    }
}
