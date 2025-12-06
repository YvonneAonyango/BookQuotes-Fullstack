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
    // ================= NAVBAR =================
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
    'adminPanel': { en: 'Admin Panel', sv: 'Admin Panel' },
    'adminDashboard': { en: 'Admin Dashboard', sv: 'Admin Panel' },
    'addNewBook': { en: 'Add New Book', sv: 'Lägg Till Ny Bok' },
    'addBookShort': { en: 'Add Book', sv: 'Lägg Till Bok' },
    'adminLogin': { en: 'Admin Login', sv: 'Admin Inloggning' },
    'language': { en: 'Language', sv: 'Språk' },

    // ================= HOME PAGE =================
    'welcome': { en: 'Welcome to Book Quotes Buddy', sv: 'Välkommen till Bokcitat Kompis' },
    'personalLibrary': { en: 'Your personal library companion', sv: 'Din personliga bibliotekskompis' },
    'libraryOverview': { en: 'Library Overview', sv: 'Biblioteksöversikt' },
    'quickAccess': { en: 'Quick Access', sv: 'Snabb Åtkomst' },
    'recentActivity': { en: 'Recent Activity', sv: 'Senaste Aktivitet' },
    'latestBookAdded': { en: 'Latest Book Added', sv: 'Senaste Boken Tillagd' },
    'quoteSaved': { en: 'Quote Saved', sv: 'Citat Sparat' },
    'featuredQuotes': { en: 'Featured Quotes', sv: 'Utvalda Citat' },
    'browseBooks': { en: 'Browse Books', sv: 'Bläddra Böcker' },
    'myQuotes': { en: 'My Quotes', sv: 'Mina Citat' },
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
    'join our other users': { en: 'Join thousands of readers who are already managing their book collections and favorite quotes with us.', sv: 'Gå med tusentals läsare som redan hanterar sina boksamlingar och favoritcitat med oss.' },
    'getStarted': { en: 'Get Started', sv: 'Kom igång' },
    'browseLibrary': { en: 'Browse Library', sv: 'Bläddra Bibliotek' },
    'quickActions': { en: 'Quick Actions', sv: 'Snabba Åtgärder' },
    'booksCount': { en: 'Books', sv: 'Böcker' },
    'quotesCount': { en: 'Quotes', sv: 'Citat' },

    // ================= BOOKS PAGE =================
    'myBooks': { en: 'My Books', sv: 'Mina Böcker' },
    'manageBookCollection': { en: 'Manage your book collection', sv: 'Hantera din boksamling' },
    'addNewBookTitle': { en: 'Add New Book', sv: 'Lägg Till Ny Bok' },
    'editBook': { en: 'Edit Book', sv: 'Redigera Bok' },
    'deleteBook': { en: 'Delete Book', sv: 'Radera Bok' },
    'bookTitle': { en: 'Book Title', sv: 'Boktitel' },
    'author': { en: 'Author', sv: 'Författare' },
    'addBook': { en: 'Add Book', sv: 'Lägg Till Bok' },
    'updateBook': { en: 'Update Book', sv: 'Uppdatera Bok' },
    'cancel': { en: 'Cancel', sv: 'Avbryt' },
    'yourBookBasket': { en: 'Your Book Basket', sv: 'Din Bokkorg' },
    'allBooks': { en: 'All Books', sv: 'Alla Böcker' },
    'addToBasket': { en: 'Add to Basket', sv: 'Lägg till i Korg' },
    'noBooksYet': { en: 'No books yet', sv: 'Inga böcker än' },
    'startAddingBooks': { en: 'Start by adding your first book!', sv: 'Börja med att lägga till din första bok!' },
    'loadingBooks': { en: 'Loading books...', sv: 'Laddar böcker...' },
    'confirmDeleteBook': { en: 'Are you sure you want to delete this book?', sv: 'Är du säker på att du vill ta bort den här boken?' },
    'by': { en: 'by', sv: 'av' },
    'selectToEdit': { en: 'Select to Edit', sv: 'Välj för att redigera' },
    'selectToDelete': { en: 'Select to Delete', sv: 'Välj för att radera' },
    'basketEmpty': { en: 'Your basket is empty', sv: 'Din korg är tom' },
    'addFirstBook': { en: 'Add First Book', sv: 'Lägg till första bok' },
    'inBasket': { en: 'In Basket', sv: 'I korgen' },
    'startByAddingFirstBook': { en: 'Start by adding your first book to your collection', sv: 'Börja med att lägga till din första bok i din samling' },

    // ================= QUOTES PAGE =================
    'My Quotes': { en: 'My Quotes', sv: 'Mina Citat' },
    'Save and manage your favorite quotes': { en: 'Save and manage your favorite quotes', sv: 'Spara och hantera dina favoritcitat' },
    'Edit Quote': { en: 'Edit Quote', sv: 'Redigera Citat' },
    'Add New Quote': { en: 'Add New Quote', sv: 'Lägg Till Nytt Citat' },
    'Quote Text': { en: 'Quote Text', sv: 'Citattext' },
    'Quote text is required': { en: 'Quote text is required', sv: 'Citattext krävs' },
    'Quote must be at least 10 characters long': { en: 'Quote must be at least 10 characters long', sv: 'Citatet måste vara minst 10 tecken långt' },
    'From Book (Optional)': { en: 'From Book (Optional)', sv: 'Från Bok (Valfritt)' },
    'Select a book...': { en: 'Select a book...', sv: 'Välj en bok...' },
    'Update Quote': { en: 'Update Quote', sv: 'Uppdatera Citat' },
    'Add Quote': { en: 'Add Quote', sv: 'Lägg Till Citat' },
    'Your Quote Basket': { en: 'Your Quote Basket', sv: 'Din Citatkorg' },
    'All Quotes': { en: 'All Quotes', sv: 'Alla Citat' },
    'Loading quotes...': { en: 'Loading quotes...', sv: 'Laddar citat...' },
    'No quotes yet': { en: 'No quotes yet', sv: 'Inga citat än' },
    'Start by adding your first quote using the form above!': { en: 'Start by adding your first quote using the form above!', sv: 'Börja med att lägga till ditt första citat med formuläret ovan!' },
    'confirmDeleteQuote': { en: 'Are you sure you want to delete this quote?', sv: 'Är du säker på att du vill ta bort detta citat?' },
    'From:': { en: 'From:', sv: 'Från:' },

    // ================= AUTH =================
    'Create Account': { en: 'Create Account', sv: 'Skapa Konto' },
    'Join Book Quotes Buddy today': { en: 'Join Book Quotes Buddy today', sv: 'Gå med i Bokcitat Kompis idag' },
    'Username': { en: 'Username', sv: 'Användarnamn' },
    'Username is required': { en: 'Username is required', sv: 'Användarnamn krävs' },
    'Username must be at least 3 characters long': { en: 'Username must be at least 3 characters long', sv: 'Användarnamn måste vara minst 3 tecken långt' },
    'Username looks good!': { en: 'Username looks good!', sv: 'Användarnamn ser bra ut!' },
    'Password': { en: 'Password', sv: 'Lösenord' },
    'Create a password': { en: 'Create a password', sv: 'Skapa ett lösenord' },
    'Minimum 6 characters': { en: 'Minimum 6 characters', sv: 'Minst 6 tecken' },
    'At least one lowercase letter': { en: 'At least one lowercase letter', sv: 'Minst en gemen bokstav' },
    'At least one uppercase letter': { en: 'At least one uppercase letter', sv: 'Minst en versal bokstav' },
    'At least one number': { en: 'At least one number', sv: 'Minst en siffra' },
    'At least one special character (!@#$%^&*)': { en: 'At least one special character (!@#$%^&*)', sv: 'Minst ett specialtecken (!@#$%^&*)' },
    'Password is required': { en: 'Password is required', sv: 'Lösenord krävs' },
    'Password looks strong!': { en: 'Password looks strong!', sv: 'Lösenordet ser starkt ut!' },
    'Confirm Password': { en: 'Confirm Password', sv: 'Bekräfta Lösenord' },
    'Confirm your password': { en: 'Confirm your password', sv: 'Bekräfta ditt lösenord' },
    'Please confirm your password': { en: 'Please confirm your password', sv: 'Vänligen bekräfta ditt lösenord' },
    'Passwords do not match': { en: 'Passwords do not match', sv: 'Lösenorden matchar inte' },
    'Passwords match!': { en: 'Passwords match!', sv: 'Lösenorden matchar!' },
    'Creating Account...': { en: 'Creating Account...', sv: 'Skapar konto...' },
    'Already have an account?': { en: 'Already have an account?', sv: 'Har du redan ett konto?' },
    'Login to Your Account': { en: 'Login to Your Account', sv: 'Logga in på ditt konto' },
    'Your data is secure and encrypted': { en: 'Your data is secure and encrypted', sv: 'Din data är säker och krypterad' },
    'welcomeBack': { en: 'Welcome Back', sv: 'Välkommen Tillbaka' },
    'loginToContinue': { en: 'Login to continue to your library', sv: 'Logga in för att fortsätta till ditt bibliotek' },
    'dontHaveAccount': { en: "Don't have an account?", sv: 'Har du inget konto?' },
    'createAccountHere': { en: 'Create Account', sv: 'Skapa Konto' },
    'rememberMe': { en: 'Remember me', sv: 'Kom ihåg mig' },
    'forgotPassword': { en: 'Forgot password?', sv: 'Glömt lösenord?' },
    'loggingIn': { en: 'Logging in...', sv: 'Loggar in...' },
    'invalidCredentials': { en: 'Invalid username or password', sv: 'Ogiltigt användarnamn eller lösenord' },
    'Login failed. Please try again.': { en: 'Login failed. Please try again.', sv: 'Inloggning misslyckades. Försök igen.' },

    // ================= FORM PLACEHOLDERS =================
    'Enter your username': { en: 'Enter your username', sv: 'Ange ditt användarnamn' },
    'Enter the quote text...': { en: 'Enter the quote text...', sv: 'Ange citattexten...' },
    'Enter author name': { en: 'Enter author name', sv: 'Ange författarens namn' },
    'Enter book title': { en: 'Enter book title', sv: 'Ange boktitel' },

    // ================= COMMON =================
    'required': { en: 'Required', sv: 'Obligatoriskt' },
    'invalid': { en: 'Invalid', sv: 'Ogiltigt' },
    'loading': { en: 'Loading...', sv: 'Laddar...' },
    'saving': { en: 'Saving...', sv: 'Sparar...' },
    'deleting': { en: 'Deleting...', sv: 'Raderar...' },
    'confirmDelete': { en: 'Are you sure you want to delete this?', sv: 'Är du säker på att du vill radera detta?' },
    'errorOccurred': { en: 'An error occurred', sv: 'Ett fel uppstod' },
    'success': { en: 'Success', sv: 'Lyckades' },
    'warning': { en: 'Warning', sv: 'Varning' },
    'info': { en: 'Info', sv: 'Info' },
    'save': { en: 'Save', sv: 'Spara' },
    'editItem': { en: 'Edit', sv: 'Redigera' },
    'deleteItem': { en: 'Delete', sv: 'Radera' },
    'close': { en: 'Close', sv: 'Stäng' },
    'back': { en: 'Back', sv: 'Tillbaka' },
    'next': { en: 'Next', sv: 'Nästa' },
    'previous': { en: 'Previous', sv: 'Föregående' },
    'search': { en: 'Search', sv: 'Sök' },
    'filter': { en: 'Filter', sv: 'Filtrera' },
    'clear': { en: 'Clear', sv: 'Rensa' },
    'apply': { en: 'Apply', sv: 'Applicera' },
    'reset': { en: 'Reset', sv: 'Återställ' },
    'submit': { en: 'Submit', sv: 'Skicka' },
    'update': { en: 'Update', sv: 'Uppdatera' },
    'create': { en: 'Create', sv: 'Skapa' },
    'view': { en: 'View', sv: 'Visa' },
    'details': { en: 'Details', sv: 'Detaljer' },
    'settings': { en: 'Settings', sv: 'Inställningar' },
    'profile': { en: 'Profile', sv: 'Profil' },
    'help': { en: 'Help', sv: 'Hjälp' },
    'about': { en: 'About', sv: 'Om' },
    'contact': { en: 'Contact', sv: 'Kontakt' },
    'privacy': { en: 'Privacy', sv: 'Integritet' },
    'terms': { en: 'Terms', sv: 'Villkor' },
    'copyright': { en: 'Copyright', sv: 'Upphovsrätt' },
    'allRightsReserved': { en: 'All rights reserved', sv: 'Alla rättigheter förbehållna' },
    'optional': { en: 'Optional', sv: 'Valfritt' },

    // ================= NOTIFICATIONS =================
    'bookAdded': { en: 'Book added successfully', sv: 'Bok tillagd framgångsrikt' },
    'bookUpdated': { en: 'Book updated successfully', sv: 'Bok uppdaterad framgångsrikt' },
    'bookDeleted': { en: 'Book deleted successfully', sv: 'Bok raderad framgångsrikt' },
    'quoteAdded': { en: 'Quote added successfully', sv: 'Citat tillagt framgångsrikt' },
    'quoteUpdated': { en: 'Quote updated successfully', sv: 'Citat uppdaterat framgångsrikt' },
    'quoteDeleted': { en: 'Quote deleted successfully', sv: 'Citat raderat framgångsrikt' },
    'registrationSuccessful': { en: 'Registration successful!', sv: 'Registrering lyckades!' },
    'loginSuccessful': { en: 'Login successful!', sv: 'Inloggning lyckades!' },
    'logoutSuccessful': { en: 'Logout successful!', sv: 'Utloggning lyckades!' }
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