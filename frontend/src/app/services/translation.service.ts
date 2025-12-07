import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

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
  private currentLanguage: Language = 'en';
  private languageChangeSubject = new Subject<Language>();

  // Observable for components to subscribe to language changes
  languageChange$ = this.languageChangeSubject.asObservable();

  private translations: Translations = {
    // ================= NAVBAR =================
    home: { en: 'Home', sv: 'Hem' },
    books: { en: 'Books', sv: 'Böcker' },
    quotes: { en: 'Quotes', sv: 'Citat' },
    login: { en: 'Login', sv: 'Logga in' },
    register: { en: 'Register', sv: 'Registrera' },
    logout: { en: 'Logout', sv: 'Logga ut' },
    brand: { en: 'Book Quotes Buddy', sv: 'Bokcitat Kompis' },
    switchToDark: { en: 'Switch to Dark Mode', sv: 'Byt till mörkt läge' },
    switchToLight: { en: 'Switch to Light Mode', sv: 'Byt till ljust läge' },
    switchLanguage: { en: 'Switch Language', sv: 'Byt språk' },
    adminPanel: { en: 'Admin Panel', sv: 'Admin Panel' },
    adminDashboard: { en: 'Admin Dashboard', sv: 'Admin Panel' },
    addNewBook: { en: 'Add New Book', sv: 'Lägg Till Ny Bok' },
    addBookShort: { en: 'Add Book', sv: 'Lägg Till Bok' },
    adminLogin: { en: 'Admin Login', sv: 'Admin Inloggning' },
    language: { en: 'Language', sv: 'Språk' },

    // ================= HOME PAGE =================
    welcome: { en: 'Welcome to Book Quotes Buddy', sv: 'Välkommen till Bokcitat Kompis' },
    personalLibrary: { en: 'Your personal library companion', sv: 'Din personliga bibliotekskompis' },
    quickAccess: { en: 'Quick Access', sv: 'Snabb Åtkomst' },
    featuredQuotes: { en: 'Featured Quotes', sv: 'Utvalda Citat' },
    browseBooks: { en: 'Browse Books', sv: 'Bläddra Böcker' },
    myQuotes: { en: 'My Quotes', sv: 'Mina Citat' },
    bookManagement: { en: 'Book Management', sv: 'Bokhantering' },
    bookManagementDesc: { en: 'Add, edit, and organize your book collection with ease', sv: 'Lägg till, redigera och organisera din boksamling med lätthet' },
    quoteCollection: { en: 'Quote Collection', sv: 'Citatsamling' },
    quoteCollectionDesc: { en: 'Save and manage your favorite quotes from books', sv: 'Spara och hantera dina favoritcitat från böcker' },
    personalLibraryTitle: { en: 'Personal Library', sv: 'Personligt Bibliotek' },
    personalLibraryDesc: { en: 'Your personal space for all your literary treasures', sv: 'Ditt personliga utrymme för alla dina litterära skatter' },
    howItWorks: { en: 'How It Works', sv: 'Så här fungerar det' },
    addYourBooks: { en: 'Add Your Books', sv: 'Lägg till dina böcker' },
    addYourBooksDesc: { en: 'Start by adding books to your personal library with details like title, author, and publication date.', sv: 'Börja med att lägga till böcker i ditt personliga bibliotek med detaljer som titel, författare och publiceringsdatum.' },
    manageQuotes: { en: 'Manage Quotes', sv: 'Hantera Citat' },
    manageQuotesDesc: { en: 'Save inspiring quotes from your readings and organize them in your personal quote collection.', sv: 'Spara inspirerande citat från dina läsningar och organisera dem i din personliga citatsamling.' },
    editUpdate: { en: 'Edit & Update', sv: 'Redigera & Uppdatera' },
    editUpdateDesc: { en: 'Easily edit book information or update your favorite quotes whenever you want.', sv: 'Redigera enkelt bokinformation eller uppdatera dina favoritcitat när du vill.' },
    enjoyReading: { en: 'Enjoy Reading', sv: 'Njut av Läsning' },
    enjoyReadingDesc: { en: 'Access your personal library and quotes from any device, anytime.', sv: 'Få tillgång till ditt personliga bibliotek och citat från vilken enhet som helst, när som helst.' },
    readyToStart: { en: 'Ready to Start Your Journey?', sv: 'Redo att börja din resa?' },
    getStarted: { en: 'Get Started', sv: 'Kom igång' },
    browseLibrary: { en: 'Browse Library', sv: 'Bläddra Bibliotek' },

    // ================= BOOKS PAGE =================
    myBooks: { en: 'My Books', sv: 'Mina Böcker' },
    manageBookCollection: { en: 'Manage your book collection', sv: 'Hantera din boksamling' },
    addNewBookTitle: { en: 'Add New Book', sv: 'Lägg Till Ny Bok' },
    editBook: { en: 'Edit Book', sv: 'Redigera Bok' },
    deleteBook: { en: 'Delete Book', sv: 'Radera Bok' },
    bookTitle: { en: 'Book Title', sv: 'Boktitel' },
    author: { en: 'Author', sv: 'Författare' },
    addBook: { en: 'Add Book', sv: 'Lägg Till Bok' },
    updateBook: { en: 'Update Book', sv: 'Uppdatera Bok' },
    cancel: { en: 'Cancel', sv: 'Avbryt' },
    noBooksYet: { en: 'No books yet', sv: 'Inga böcker än' },
    startByAddingFirstBook: { en: 'Start by adding your first book to your collection', sv: 'Börja med att lägga till din första bok i din samling' },
    loadingBooks: { en: 'Loading books...', sv: 'Laddar böcker...' },
    loading: { en: 'Loading...', sv: 'Laddar...' },
    confirmDeleteBook: { en: 'Are you sure you want to delete this book?', sv: 'Är du säker på att du vill ta bort den här boken?' },
    by: { en: 'by', sv: 'av' },
    editItem: { en: 'Edit', sv: 'Redigera' },
    deleteItem: { en: 'Delete', sv: 'Radera' },

    // ================= AUTH =================
    Username: { en: 'Username', sv: 'Användarnamn' },
    Password: { en: 'Password', sv: 'Lösenord' },
    'Username is required': { en: 'Username is required', sv: 'Användarnamn krävs' },
    'Password is required': { en: 'Password is required', sv: 'Lösenord krävs' },
    loggingIn: { en: 'Logging in...', sv: 'Loggar in...' },
    invalidCredentials: { en: 'Invalid username or password', sv: 'Ogiltigt användarnamn eller lösenord' },
    loginDescription: { en: 'Login to access your personal library and manage your books and quotes.', sv: 'Logga in för att komma åt ditt personliga bibliotek och hantera dina böcker och citat.' },
    'EnterUsername': { en: 'Enter username', sv: 'Ange användarnamn' },
    'EnterPassword': { en: 'Enter password', sv: 'Ange lösenord' },
    dontHaveAccount: { en: "Don't have an account?", sv: "Har du inget konto?" },
    registerHere: { en: 'Register here', sv: 'Registrera här' },

    // ================= QUOTES PAGE =================
    'Save and manage your favorite quotes': { en: 'Save and manage your favorite quotes', sv: 'Spara och hantera dina favoritcitat' },
    'editQuote': { en: 'Edit Quote', sv: 'Redigera Citat' },
    'addNewQuote': { en: 'Add New Quote', sv: 'Lägg Till Nytt Citat' },
    'Quote Text': { en: 'Quote Text', sv: 'Citattext' },
    'Enter the quote text...': { en: 'Enter the quote text...', sv: 'Ange citattexten...' },
    'Quote text is required': { en: 'Quote text is required', sv: 'Citattext krävs' },
    'Quote must be at least 10 characters long': { en: 'Quote must be at least 10 characters long', sv: 'Citatet måste vara minst 10 tecken långt' },
    'Enter author name': { en: 'Enter author name', sv: 'Ange författarens namn' },
    'Author is required': { en: 'Author is required', sv: 'Författare krävs' },
    'From Book (Optional)': { en: 'From Book (Optional)', sv: 'Från Bok (Valfritt)' },
    'Select a book...': { en: 'Select a book...', sv: 'Välj en bok...' },
    'Your Quote Basket': { en: 'Your Quote Basket', sv: 'Din Citatkorg' },
    'Click any quote to edit': { en: 'Click any quote to edit', sv: 'Klicka på ett citat för att redigera' },
    'From:': { en: 'From:', sv: 'Från:' },
    'All Quotes': { en: 'All Quotes', sv: 'Alla Citat' },
    'Add to Basket': { en: 'Add to Basket', sv: 'Lägg till i korg' },
    'Loading quotes...': { en: 'Loading quotes...', sv: 'Laddar citat...' },
    'No quotes yet': { en: 'No quotes yet', sv: 'Inga citat ännu' },
    'Start by adding your first quote using the form above!': { en: 'Start by adding your first quote using the form above!', sv: 'Börja med att lägga till ditt första citat med formuläret ovan!' },
    'confirmDeleteQuote': { en: 'Are you sure you want to delete this quote?', sv: 'Är du säker på att du vill ta bort detta citat?' },

    // ================= REGISTRATION PAGE =================
    'Create Account': { en: 'Create Account', sv: 'Skapa Konto' },
    'Join Book Quotes Buddy today': { en: 'Join Book Quotes Buddy today', sv: 'Gå med i Bokcitat Kompis idag' },
    'Enter your username': { en: 'Enter your username', sv: 'Ange ditt användarnamn' },
    'Username must be at least 3 characters long': { en: 'Username must be at least 3 characters long', sv: 'Användarnamnet måste vara minst 3 tecken långt' },
    'Username looks good!': { en: 'Username looks good!', sv: 'Användarnamn ser bra ut!' },
    'Create a password': { en: 'Create a password', sv: 'Skapa ett lösenord' },
    'Minimum 6 characters': { en: 'Minimum 6 characters', sv: 'Minst 6 tecken' },
    'At least one lowercase letter': { en: 'At least one lowercase letter', sv: 'Minst en liten bokstav' },
    'At least one uppercase letter': { en: 'At least one uppercase letter', sv: 'Minst en stor bokstav' },
    'At least one number': { en: 'At least one number', sv: 'Minst en siffra' },
    'At least one special character (!@#$%^&*)': { en: 'At least one special character (!@#$%^&*)', sv: 'Minst ett specialtecken (!@#$%^&*)' },
    'Password looks strong!': { en: 'Password looks strong!', sv: 'Lösenordet ser starkt ut!' },
    'Confirm Password': { en: 'Confirm Password', sv: 'Bekräfta lösenord' },
    'Confirm your password': { en: 'Confirm your password', sv: 'Bekräfta ditt lösenord' },
    'Please confirm your password': { en: 'Please confirm your password', sv: 'Var god bekräfta ditt lösenord' },
    'Passwords do not match': { en: 'Passwords do not match', sv: 'Lösenorden matchar inte' },
    'Passwords match!': { en: 'Passwords match!', sv: 'Lösenorden matchar!' },
    'Creating Account...': { en: 'Creating Account...', sv: 'Skapar konto...' },
    'Already have an account?': { en: 'Already have an account?', sv: 'Har du redan ett konto?' },
    'Login to Your Account': { en: 'Login to Your Account', sv: 'Logga in på ditt konto' },
    'Your data is secure and encrypted': { en: 'Your data is secure and encrypted', sv: 'Dina data är säkra och krypterade' },
    'Please fill in all fields correctly.': { en: 'Please fill in all fields correctly.', sv: 'Var god fyll i alla fält korrekt.' },
    'Registration failed. Please check your information.': { en: 'Registration failed. Please check your information.', sv: 'Registrering misslyckades. Kontrollera din information.' },
    'Server error. Please try again later.': { en: 'Server error. Please try again later.', sv: 'Serverfel. Försök igen senare.' },
    'An error occurred:': { en: 'An error occurred:', sv: 'Ett fel uppstod:' },
    'Registration successful!': { en: 'Registration successful!', sv: 'Registrering lyckades!' },

    // ================= BOOK FORM PAGE =================
    'goBack': { en: 'Go back', sv: 'Gå tillbaka' },
    'enterBookTitle': { en: 'Enter book title', sv: 'Ange boktitel' },
    'titleRequired': { en: 'Book title is required', sv: 'Boktitel krävs' },
    'looksGood': { en: 'Looks good!', sv: 'Ser bra ut!' },
    'enterAuthorName': { en: 'Enter author name', sv: 'Ange författarens namn' },
    'authorRequired': { en: 'Author name is required', sv: 'Författarens namn krävs' },
    'perfect': { en: 'Perfect!', sv: 'Perfekt!' },
    'publicationDate': { en: 'Publication Date', sv: 'Publiceringsdatum' },
    'publicationDateRequired': { en: 'Publication date is required', sv: 'Publiceringsdatum krävs' },
    'dateLooksGood': { en: 'Date looks good!', sv: 'Datum ser bra ut!' },
    'fillAllRequiredFields': { en: 'Please fill in all required fields.', sv: 'Var god fyll i alla obligatoriska fält.' },
    'bookFormTip': { en: 'Tip: You can edit this information later if needed.', sv: 'Tips: Du kan redigera denna information senare om det behövs.' },
    'bookFormDescription': { en: 'Add or edit book details in your personal library.', sv: 'Lägg till eller redigera bokdetaljer i ditt personliga bibliotek.' },

    // ================= NAVBAR ADDITIONAL =================
    'English': { en: 'English', sv: 'Engelska' },
    'Swedish': { en: 'Swedish', sv: 'Svenska' },
    'Toggle navigation': { en: 'Toggle navigation', sv: 'Växla navigation' },
  };

  constructor() {
    this.loadLanguagePreference();
  }

  private loadLanguagePreference() {
    const savedLang = localStorage.getItem('language') as Language;
    if (savedLang === 'en' || savedLang === 'sv') {
      this.currentLanguage = savedLang;
    } else {
      this.currentLanguage = navigator.language.startsWith('sv') ? 'sv' : 'en';
    }
    document.documentElement.lang = this.currentLanguage;
  }

  setLanguage(lang: Language) {
    this.currentLanguage = lang;
    localStorage.setItem('language', lang);
    document.documentElement.lang = lang;
    // Emit the language change event
    this.languageChangeSubject.next(lang);
  }

  getCurrentLanguage(): Language {
    return this.currentLanguage;
  }

  translate(key: string, params?: Record<string, string>): string {
    const translation = this.translations[key];
    if (!translation) {
      console.warn(`Missing translation for key: "${key}"`);
      return key;
    }

    let text = translation[this.currentLanguage];
    if (params) {
      Object.keys(params).forEach(k => {
        text = text.replace(`{{${k}}}`, params[k]);
      });
    }
    return text;
  }
}