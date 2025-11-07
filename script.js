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

// بيانات الوحدات السكنية المخزنة
let listings = JSON.parse(localStorage.getItem('studentHousingListings')) || [];

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
    document.getElementById('owner-form').addEventListener('submit', handleOwnerFormSubmit);
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
    document.getElementById('owner-form').reset();
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
    
    // إضافة الوحدة إلى القائمة
    addListing();
    
    // الانتقال إلى صفحة التأكيد
    navigateToPage('confirmation-page');
}

// إضافة وحدة سكنية جديدة
function addListing() {
    const newListing = {
        id: Date.now(),
        gender: userData.gender,
        area: userData.area,
        type: userData.type,
        details: userData.details,
        price: userData.price,
        contact: userData.contact,
        date: new Date().toLocaleDateString('ar-EG')
    };
    
    listings.push(newListing);
    localStorage.setItem('studentHousingListings', JSON.stringify(listings));
}

// البحث عن الوحدات المتاحة للطالب
function searchListings() {
    const filteredListings = listings.filter(listing => {
        return listing.gender === userData.studentGender &&
               listing.area === userData.studentArea &&
               listing.type === userData.studentType;
    });
    
    displayListings(filteredListings);
}

// عرض الوحدات السكنية
function displayListings(listingsToShow) {
    const container = document.getElementById('listings-container');
    
    if (listingsToShow.length === 0) {
        container.innerHTML = `
            <div class="no-results">
                <i class="fas fa-home" style="font-size: 4rem; color: var(--text-light); margin-bottom: 20px;"></i>
                <h3 style="color: var(--text-light
