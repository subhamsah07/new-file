import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

export type SupportedLanguage = 'en' | 'hi' | 'bn' | 'pa';

export const LANGUAGES: { code: SupportedLanguage; label: string; nativeName: string }[] = [
  { code: 'en', label: 'English', nativeName: 'English' },
  { code: 'hi', label: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'pa', label: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ' },
  { code: 'bn', label: 'Bengali', nativeName: 'বাংলা' },
];

const resources = {
  en: {
    translation: {
      brand: {
        name: 'SmartProcure',
        tagline: 'Less Waiting. More Farming.',
        subtagline: 'Smart procurement. Less waiting. Better planning.',
      },
      nav: {
        home: 'Home',
        howItWorks: 'How It Works',
        whySmartProcure: 'Why SmartProcure',
        liveQueue: 'Live Queue',
        help: 'Help & Support',
        login: 'Farmer Login',
        register: 'Register as Farmer',
        dashboard: 'Farmer Dashboard',
      },
      hero: {
        title: 'Digital Agricultural Procurement Platform',
        headline: 'Less Waiting. More Farming.',
        subtitle: 'Skip the endless mandi queues. SmartProcure assigns intelligent arrival slots, delivers real-time queue intelligence, and updates your arrival ETA dynamically as centre operations unfold.',
        ctaPrimary: 'Book a Procurement Slot',
        ctaSecondary: 'Track My Token',
      },
      queue: {
        token: 'Token',
        position: 'Queue Position',
        farmersAhead: 'Farmers Ahead',
        estimatedWait: 'Estimated Wait',
        expectedTime: 'Expected Arrival',
        nowServing: 'Now Serving',
        you: 'YOU',
        status: 'Status',
        waiting: 'Waiting',
        inProgress: 'In Progress',
        completed: 'Completed',
        delayNotice: 'Centre Delay Detected',
        delayDesc: 'Processing at this centre is currently slower than usual. Your arrival ETA has been adjusted automatically.',
      },
    },
  },
  hi: {
    translation: {
      brand: {
        name: 'स्मार्टप्रोक्योर',
        tagline: 'कम इंतज़ार। अधिक खेती।',
        subtagline: 'स्मार्ट खरीद। कम इंतज़ार। बेहतर योजना।',
      },
      nav: {
        home: 'होम',
        howItWorks: 'यह कैसे काम करता है',
        whySmartProcure: 'स्मार्टप्रोक्योर क्यों',
        liveQueue: 'लाइव कतार',
        help: 'सहायता एवं समर्थन',
        login: 'किसान लॉगिन',
        register: 'किसान पंजीकरण',
        dashboard: 'किसान डैशबोर्ड',
      },
      hero: {
        title: 'डिजिटल कृषि खरीद एवं कतार प्रबंधन मंच',
        headline: 'कम इंतज़ार। अधिक खेती।',
        subtitle: 'मंडी की लंबी कतारों से मुक्ति। स्मार्टप्रोक्योर किसानों को सटीक समय स्लॉट देता है और केंद्र की वास्तविक स्थिति के अनुसार आपके पहुंचने का समय अपडेट करता है।',
        ctaPrimary: 'खरीद स्लॉट बुक करें',
        ctaSecondary: 'अपना टोकन ट्रैक करें',
      },
      queue: {
        token: 'टोकन',
        position: 'कतार स्थिति',
        farmersAhead: 'आगे किसान',
        estimatedWait: 'अनुमानित प्रतीक्षा',
        expectedTime: 'अनुमानित समय',
        nowServing: 'वर्तमान टोकन',
        you: 'आप',
        status: 'स्थिति',
        waiting: 'प्रतीक्षारत',
        inProgress: 'प्रक्रियाधीन',
        completed: 'संपन्न',
        delayNotice: 'केंद्र पर विलंब की सूचना',
        delayDesc: 'इस केंद्र पर आज कार्य सामान्य से धीमा चल रहा है। आपके आगमन का समय स्वतः संशोधित कर दिया गया है।',
      },
    },
  },
  pa: {
    translation: {
      brand: {
        name: 'ਸਮਾਰਟਪ੍ਰੋਕਿਓਰ',
        tagline: 'ਘੱਟ ਉਡੀਕ। ਵੱਧ ਖੇਤੀ।',
        subtagline: 'ਸਮਾਰਟ ਖਰੀਦ। ਘੱਟ ਉਡੀਕ। ਬਿਹਤਰ ਯੋਜਨਾਬੰਦੀ।',
      },
      nav: {
        home: 'ਮੁੱਖ ਪੰਨਾ',
        howItWorks: 'ਇਹ ਕਿਵੇਂ ਕੰਮ ਕਰਦਾ ਹੈ',
        whySmartProcure: 'ਸਮਾਰਟਪ੍ਰੋਕਿਓਰ ਕਿਉਂ',
        liveQueue: 'ਲਾਈਵ ਕਤਾਰ',
        help: 'ਮਦਦ ਅਤੇ ਸਹਾਇਤਾ',
        login: 'ਕਿਸਾਨ ਲੌਗਇਨ',
        register: 'ਕਿਸਾਨ ਰਜਿਸਟ੍ਰੇਸ਼ਨ',
        dashboard: 'ਕਿਸਾਨ ਡੈਸ਼ਬੋਰਡ',
      },
      hero: {
        title: 'ਡਿਜੀਟਲ ਖੇਤੀਬਾੜੀ ਖਰੀਦ ਪਲੇਟਫਾਰਮ',
        headline: 'ਘੱਟ ਉਡੀਕ। ਵੱਧ ਖੇਤੀ।',
        subtitle: 'ਮੰਡੀਆਂ ਵਿੱਚ ਲੰਬੀਆਂ ਕਤਾਰਾਂ ਤੋਂ ਛੁਟਕਾਰਾ। ਆਪਣਾ ਖਰੀਦ ਟੋਕਨ ਬੁੱਕ ਕਰੋ ਅਤੇ ਸਹੀ ਸਮੇਂ ਤੇ ਪਹੁੰਚੋ।',
        ctaPrimary: 'ਸਲਾਟ ਬੁੱਕ ਕਰੋ',
        ctaSecondary: 'ਟੋਕਨ ਟਰੈਕ ਕਰੋ',
      },
      queue: {
        token: 'ਟੋਕਨ',
        position: 'ਕਤਾਰ ਨੰਬਰ',
        farmersAhead: 'ਅੱਗੇ ਕਿਸਾਨ',
        estimatedWait: 'ਅਨੁਮਾਨਿਤ ਸਮਾਂ',
        expectedTime: 'ਪਹੁੰਚਣ ਦਾ ਸਮਾਂ',
        nowServing: 'ਚੱਲ ਰਿਹਾ ਟੋਕਨ',
        you: 'ਤੁਸੀਂ',
        status: 'ਸਥਿਤੀ',
        waiting: 'ਉਡੀਕ ਵਿੱਚ',
        inProgress: 'ਪ੍ਰਕਿਰਿਆ ਵਿੱਚ',
        completed: 'ਮੁਕੰਮਲ',
        delayNotice: 'ਕੇਂਦਰ ਦੇਰੀ ਸੂਚਨਾ',
        delayDesc: 'ਕੇਂਦਰ ਵਿੱਚ ਕੰਮ ਹੌਲੀ ਚੱਲ ਰਿਹਾ ਹੈ। ਤੁਹਾਡਾ ਸਮਾਂ ਅੱਪਡੇਟ ਕੀਤਾ ਗਿਆ ਹੈ।',
      },
    },
  },
  bn: {
    translation: {
      brand: {
        name: 'স্মার্টপ্রকিওর',
        tagline: 'কম অপেক্ষা। বেশি চাষ।',
        subtagline: 'স্মার্ট সংগ্রহ। কম অপেক্ষা। উন্নত পরিকল্পনা।',
      },
      nav: {
        home: 'হোম',
        howItWorks: 'কীভাবে কাজ করে',
        whySmartProcure: 'কেন স্মার্টপ্রকিওর',
        liveQueue: 'লাইভ লাইন',
        help: 'সাহায্য ও সহায়তা',
        login: 'কৃষক লগইন',
        register: 'কৃষক নিবন্ধন',
        dashboard: 'কৃষক ড্যাশবোর্ড',
      },
      hero: {
        title: 'ডিজিটাল কৃষি সংগ্রহ প্ল্যাটফর্ম',
        headline: 'কম অপেক্ষা। বেশি চাষ।',
        subtitle: 'মান্ডিতে দীর্ঘ লাইনে দাঁড়ানোর দিন শেষ। স্মার্টপ্রকিওরের মাধ্যমে নির্দিষ্ট স্লট বুক করুন।',
        ctaPrimary: 'স্লট বুক করুন',
        ctaSecondary: 'টোকেন ট্র্যাক করুন',
      },
      queue: {
        token: 'টোকেন',
        position: 'লাইনের অবস্থান',
        farmersAhead: 'সামনে কৃষক',
        estimatedWait: 'আনুমানিক সময়',
        expectedTime: 'পৌঁছানোর সময়',
        nowServing: 'বর্তমান টোকেন',
        you: 'আপনি',
        status: 'অবস্থা',
        waiting: 'অপেক্ষমাণ',
        inProgress: 'চলমান',
        completed: 'সম্পন্ন',
        delayNotice: 'বিলম্বের বিজ্ঞপ্তি',
        delayDesc: 'কেন্দ্রে প্রক্রিয়াকরণ স্বাভাবিকের চেয়ে ধীরগতিতে চলছে।',
      },
    },
  },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
