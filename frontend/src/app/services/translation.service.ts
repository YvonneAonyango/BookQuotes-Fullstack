import { Injectable, signal, computed } from '@angular/core';

export type Language = 'en' | 'sv';

export interface Translations {
  [key: string]: {
    en: string;
    sv: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class TranslationService {
  private currentLanguage = signal<Language>('en');
  
  private translations: Translations = {
    // Navbar
    'home': { en: 'Home', sv: 'Hem' },
    'books': { en: 'Books', sv: 'Böcker' },
    'quotes': { en: 'Quotes', sv: 'Citat' },
    'login': { en: 'Login', sv: 'Logga in' },
    'register': { en: 'Register', sv: 'Registrera' },
    'logout': { en: 'Logout', sv: 'Logga ut' },
    'brand': { en: 'Book Quotes Buddy', sv: 'Bokcitat Kompis' },
    'switchToDark': { en: 'Switch to Dark Mode', sv: 'Byt till mörkt läge' },
    'switchToLight': { en: 'Switch to Light Mode', sv: 'Byt till ljust läge' },
    'switchLanguage': { en: 'Switch Language', sv: 'Byt språk' },
    'Book Quotes Buddy': { en: 'Book Quotes Buddy', sv: 'Bokcitat Kompis' },
    'adminPanel': { en: 'Admin Panel', sv: 'Admin Panel' },
    'addNewBook': { en: 'Add New Book', sv: 'Lägg Till Ny Bok' },
    'addBookShort': { en: 'Add Book', sv: 'Lägg Till Bok' },

    // Home Page - Updated for professional sidebar
    'welcome': { en: 'Welcome to Book Quotes Buddy', sv: 'Välkommen till Bokcitat Kompis' },
    'personalLibrary': { en: 'Your personal library companion', sv: 'Din personliga bibliotekskompis' },
    'libraryOverview': { en: 'Library Overview', sv: 'Biblioteksöversikt' },
    'browseBooks': { en: 'Browse Books', sv: 'Bläddra Böcker' },
    'myQuotes': { en: 'My Quotes', sv: 'Mina Citat' },
    'featuredQuotes': { en: 'Featured Quotes', sv: 'Utvalda Citat' },
    'bookManagement': { en: 'Book Management', sv: 'Bokhantering' },
    'bookManagementDesc': { en: 'Add, edit, and organize your book collection with ease', sv: 'Lägg till, redigera och organisera din boksamling med lätthet' },
    'quoteCollection': { en: 'Quote Collection', sv: 'Citatsamling' },
    'quoteCollectionDesc': { en: 'Save and manage your favorite quotes from books', sv: 'Spara och hantera dina favoritcitat från böcker' },
    'personalLibraryTitle': { en: 'Personal Library', sv: 'Personligt Bibliotek' },
    'personalLibraryDesc': { en: 'Your personal space for all your literary treasures', sv: 'Ditt personliga utrymme för alla dina litterära skatter' },
    'howItWorks': { en: 'How It Works', sv: 'Så här fungerar det' },
    'addYourBooks': { en: 'Add Your Books', sv: 'Lägg till dina böcker' },
    'addYourBooksDesc': { en: 'Start by adding books to your personal library with details like title, author, and publication date.', sv: 'Börja med att lägga till böcker i ditt personliga bibliotek med detaljer som titel, författare och publiceringsdatum.' },
    'manageQuotes': { en: 'Manage Quotes', sv: 'Hantera Citat' },
    'manageQuotesDesc': { en: 'Save inspiring quotes from your readings and organize them in your personal quote collection.', sv: 'Spara inspirerande citat från dina läsningar och organisera dem i din personliga citatsamling.' },
    'editUpdate': { en: 'Edit & Update', sv: 'Redigera & Uppdatera' },
    'editUpdateDesc': { en: 'Easily edit book information or update your favorite quotes whenever you want.', sv: 'Redigera enkelt bokinformation eller uppdatera dina favoritcitat när du vill.' },
    'enjoyReading': { en: 'Enjoy Reading', sv: 'Njut av Läsning' },
    'enjoyReadingDesc': { en: 'Access your personal library and quotes from any device, anytime.', sv: 'Få tillgång till ditt personliga bibliotek och citat från vilken enhet som helst, när som helst.' },
    'readyToStart': { en: 'Ready to Start Your Journey?', sv: 'Redo att börja din resa?' },
    'joinThousands': { en: 'Join thousands of readers who are already managing their book collections and favorite quotes with us.', sv: 'Gå med tusentals läsare som redan hanterar sina boksamlingar och favoritcitat med oss.' },
    'getStarted': { en: 'Get Started', sv: 'Kom igång' },
    'browseLibrary': { en: 'Browse Library', sv: 'Bläddra Bibliotek' },
    'quickActions': { en: 'Quick Actions', sv: 'Snabba Åtgärder' },
    
    // New keys for professional sidebar
    'quickAccess': { en: 'Quick Access', sv: 'Snabb Åtkomst' },
    'recentActivity': { en: 'Recent Activity', sv: 'Senaste Aktivitet' },
    'latestBookAdded': { en: 'Latest Book Added', sv: 'Senaste Boken Tillagd' },
    'quoteSaved': { en: 'Quote Saved', sv: 'Citat Sparat' },

    // Books Page
    'myBooksCollection': { en: 'My Books Collection', sv: 'Min Boksamling' },
    'managePersonalLibrary': { en: 'Manage your personal library', sv: 'Hantera ditt personliga bibliotek' },
    'yourPersonalLibrary': { en: 'Your personal library', sv: 'Ditt personliga bibliotek' },
    'loadingBooks': { en: 'Loading books', sv: 'Laddar böcker' },
    'loadingBooksProgress': { en: 'Loading your books collection...', sv: 'Laddar din boksamling...' },
    'noBooksYet': { en: 'No Books Yet', sv: 'Inga Böcker Än' },
    'startBuildingLibrary': { en: 'Start building your personal library', sv: 'Börja bygga ditt personliga bibliotek' },
    'addFirstBook': { en: 'Add Your First Book', sv: 'Lägg Till Din Första Bok' },
    'byAuthor': { en: 'by {{author}}', sv: 'av {{author}}' },
    'publishedOn': { en: 'Published', sv: 'Publicerad' },
    'edit': { en: 'Edit', sv: 'Redigera' },
    'delete': { en: 'Delete', sv: 'Ta bort' },
    'delShort': { en: 'Del', sv: 'Rad' },
    'editBookAria': { en: 'Edit book {{title}}', sv: 'Redigera bok {{title}}' },
    'deleteBookAria': { en: 'Delete book {{title}}', sv: 'Ta bort bok {{title}}' },
    'loadMoreBooks': { en: 'Load More Books', sv: 'Ladda Fler Böcker' },
    'confirmDeleteBook': { en: 'Are you sure you want to delete this book?', sv: 'Är du säker på att du vill ta bort den här boken?' },

    // Quotes Page
    'myQuotesBasket': { en: 'My Quotes Basket', sv: 'Min Citatkorg' },
    'quotesBasketDesc': { en: 'Your collection of inspirational words', sv: 'Din samling av inspirerande ord' },
    'addNewQuote': { en: 'Add New Quote', sv: 'Lägg Till Nytt Citat' },
    'editQuote': { en: 'Edit Quote', sv: 'Redigera Citat' },
    'addToBasket': { en: 'Add to Basket', sv: 'Lägg Till i Korgen' },
    'quoteText': { en: 'Quote Text', sv: 'Citattext' },
    'quotePlaceholder': { en: 'Enter your favorite quote...', sv: 'Ange ditt favoritcitat...' },
    'quoteAuthor': { en: 'Author', sv: 'Författare' },
    'authorPlaceholder': { en: 'Author name', sv: 'Författarens namn' },
    'authorRequired': { en: 'Author is required', sv: 'Författare krävs' },
    'minLength10': { en: 'Quote must be at least 10 characters', sv: 'Citatet måste vara minst 10 tecken långt' },
    'cancel': { en: 'Cancel', sv: 'Avbryt' },
    'update': { en: 'Update', sv: 'Uppdatera' },
    'yourQuotesCount': { en: 'Your Quotes ({{count}})', sv: 'Dina Citat ({{count}})' },
    'loadingQuotes': { en: 'Loading quotes', sv: 'Laddar citat' },
    'loadingQuotesProgress': { en: 'Loading your quotes basket...', sv: 'Laddar din citatkorg...' },
    'basketEmpty': { en: 'Your basket is empty', sv: 'Din korg är tom' },
    'addQuotesToStart': { en: 'Add some inspirational quotes to get started', sv: 'Lägg till några inspirerande citat för att komma igång' },
    'addFirstQuote': { en: 'Add First Quote', sv: 'Lägg Till Första Citatet' },
    'confirmDeleteQuote': { en: 'Are you sure you want to delete this quote?', sv: 'Är du säker på att du vill ta bort det här citatet?' }
  };

  public currentTranslations = computed(() => {
    const lang = this.currentLanguage();
    const translations: { [key: string]: string } = {};
    
    Object.keys(this.translations).forEach(key => {
      translations[key] = this.translations[key][lang];
    });
    
    return translations;
  });

  constructor() {
    this.loadLanguagePreference();
  }

  private loadLanguagePreference(): void {
    const savedLanguage = localStorage.getItem('language') as Language;
    if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'sv')) {
      this.currentLanguage.set(savedLanguage);
    } else {
      const browserLang = navigator.language.startsWith('sv') ? 'sv' : 'en';
      this.currentLanguage.set(browserLang);
    }
  }

  setLanguage(language: Language): void {
    this.currentLanguage.set(language);
    localStorage.setItem('language', language);
    document.documentElement.setAttribute('lang', language);
  }

  getCurrentLanguage(): Language {
    return this.currentLanguage();
  }

  translate(key: string, params?: Record<string, any>): string {
    const translation = this.translations[key];
    if (!translation) {
      console.warn(`Translation missing for key: ${key}`);
      return key;
    }
    
    let text = translation[this.currentLanguage()];
    
    // Replace template variables if params are provided
    if (params) {
      Object.keys(params).forEach(param => {
        text = text.replace(`{{${param}}}`, params[param]);
      });
    }
    
    return text;
  }
}