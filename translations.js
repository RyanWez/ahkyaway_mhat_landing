// Translations for Landing Page
const translations = {
    en: {
        app: {
            name: "AhKyaway Mhat"
        },
        nav: {
            home: "Home",
            about: "About",
            download: "Download"
        },
        hero: {
            badge: "For Small Businesses",
            title: "Track Debts, <br><span class=\"gradient-text\">Simplify Life</span>",
            description: "AhKyaway Mhat is a beautifully designed debt tracking app perfect for small shopkeepers, community lending groups, and anyone who needs to manage debts efficiently.",
            feature1: "Dashboard & Analytics",
            feature2: "Customer Management",
            feature3: "Debt Tracking",
            feature4: "Dark & Light Themes",
            download: "Download Now",
            github: "View on GitHub",
            scroll: "Scroll to explore"
        },
        screenshots: {
            title: "App Screenshots",
            subtitle: "Explore the beautiful interface designed for clarity and ease of use",
            hint: "← Drag or swipe to explore →"
        },
        download: {
            title: "Ready to Get Started?",
            description: "Download AhKyaway Mhat now and take control of your debt tracking. Available for Android, Windows, macOS, Linux, and Web.",
            button: "Download from GitHub"
        },
        footer: {
            made: "Made with ❤️ using Flutter",
            copyright: "© 2025 AhKyaway Mhat."
        }
    },
    my: {
        app: {
            name: "အကြွေးမှတ်"
        },
        nav: {
            home: "ပင်မ",
            about: "အကြောင်း",
            download: "ဒေါင်းလုဒ်"
        },
        hero: {
            badge: "စီးပွားရေးလုပ်ငန်းငယ်များအတွက်",
            title: "အကြွေးများကို <br><span class=\"gradient-text\">လွယ်ကူစွာ မှတ်ပါ</span>",
            description: "အကြွေးမှတ်သည် ဆိုင်ငယ်လေးများ၊ ရပ်ကွက်ချေးငွေအဖွဲ့များနှင့် အကြွေးများကို ထိရောက်စွာ စီမံခန့်ခွဲလိုသူတိုင်းအတွက် လှပစွာ ဒီဇိုင်းထုတ်ထားသော အက်ပ်တစ်ခုဖြစ်ပါသည်။",
            feature1: "Dashboard နှင့် စာရင်းအင်း",
            feature2: "ဖောက်သည် စီမံခန့်ခွဲမှု",
            feature3: "အကြွေး ခြေရာခံခြင်း",
            feature4: "အမှောင်/အလင်း Theme",
            download: "ယခုပဲ ဒေါင်းလုဒ်လုပ်ပါ",
            github: "GitHub တွင် ကြည့်ရန်",
            scroll: "ဆွဲချပြီး လေ့လာပါ"
        },
        screenshots: {
            title: "App ပုံများ",
            subtitle: "ရှင်းလင်းပြီး အသုံးပြုရလွယ်ကူအောင် ဒီဇိုင်းထုတ်ထားသော လှပသော interface ကို လေ့လာပါ",
            hint: "← ဆွဲဖို့ သို့မဟုတ် Swipe လုပ်ပါ →"
        },
        download: {
            title: "စတင်ဖို့ အဆင်သင့်ဖြစ်ပြီလား?",
            description: "အကြွေးမှတ်ကို ယခုပဲ ဒေါင်းလုဒ်လုပ်ပြီး သင့်အကြွေးခြေရာခံမှုကို ထိန်းချုပ်ပါ။ Android, Windows, macOS, Linux နှင့် Web အတွက် ရနိုင်ပါသည်။",
            button: "GitHub မှ ဒေါင်းလုဒ်လုပ်ပါ"
        },
        footer: {
            made: "Flutter ဖြင့် ❤️ နဲ့ ဖန်တီးထားပါသည်",
            copyright: "© 2025 အကြွေးမှတ်။"
        }
    }
};

// Get nested value from object using dot notation
function getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj);
}

// Apply translations to page
function applyTranslations(lang) {
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(el => {
        const key = el.getAttribute('data-i18n');
        const translation = getNestedValue(translations[lang], key);
        if (translation) {
            // Check if translation contains HTML
            if (translation.includes('<')) {
                el.innerHTML = translation;
            } else {
                el.textContent = translation;
            }
        }
    });

    // Update lang attribute
    document.documentElement.lang = lang === 'my' ? 'my' : 'en';

    // Update language toggle button with flag
    const langToggle = document.getElementById('lang-toggle');
    if (langToggle) {
        const flagIcon = langToggle.querySelector('.flag-icon');
        if (flagIcon) {
            flagIcon.textContent = lang === 'my' ? '🇲🇲' : '🇺🇸';
        }
    }
}

// Initialize language from localStorage
function initLanguage() {
    const savedLang = localStorage.getItem('landing-language') || 'en';
    applyTranslations(savedLang);
    return savedLang;
}

// Toggle language
function toggleLanguage() {
    const currentLang = localStorage.getItem('landing-language') || 'en';
    const newLang = currentLang === 'en' ? 'my' : 'en';
    localStorage.setItem('landing-language', newLang);
    applyTranslations(newLang);
}
