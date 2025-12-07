import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Quote, QuoteInput, QuoteService } from '../../services/quote.service';
import { Book, BookService } from '../../services/book.service';
import { Meta, Title } from '@angular/platform-browser';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-quotes',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule,
    TranslateModule
  ],
  templateUrl: './quotes.component.html',
  styleUrls: ['./quotes.component.css']
})
export class QuotesComponent implements OnInit {
  allQuotes: Quote[] = [];  // All quotes from API
  favouriteQuotes: Quote[] = [];  // Local favourites list
  books: Book[] = [];
  quoteForm: FormGroup;
  isLoading = false;
  isEdit = false;
  editingQuoteId?: number;

  private meta = inject(Meta);
  private titleService = inject(Title);
  private translate = inject(TranslateService);

  constructor(
    private quoteService: QuoteService,
    private bookService: BookService,
    private fb: FormBuilder
  ) {
    this.quoteForm = this.fb.group({
      text: ['', [Validators.required, Validators.minLength(3)]],
      author: ['', Validators.required],
      bookId: [null]  // Can be null - quotes don't need books
    });
  }

  ngOnInit(): void {
    this.titleService.setTitle('BookWebApp - Quotes');
    
    this.translate.get('quoteCollectionDesc').subscribe((translated: string) => {
      this.meta.updateTag({
        name: 'description',
        content: translated || 'Save your favourite quotes for later!'
      });
    });

    this.loadAllQuotes();
    this.loadBooks();
    this.loadFavouritesFromStorage();
  }

  // Load all quotes from API
  loadAllQuotes(): void {
    this.isLoading = true;
    this.quoteService.getQuotes().subscribe({
      next: (quotes) => {
        this.allQuotes = quotes;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading quotes:', error);
        this.isLoading = false;
      }
    });
  }

  // Load books for dropdown
  loadBooks(): void {
    this.bookService.getBooks().subscribe({
      next: (books) => {
        this.books = books;
      },
      error: (error) => {
        console.error('Error loading books:', error);
      }
    });
  }

  // Get book title for display
  getBookTitle(bookId?: number | null): string {
    if (!bookId) return '';
    const book = this.books.find(b => b.id === bookId);
    return book ? book.title : '';
  }

  // ============ FAVOURITES FUNCTIONALITY ============

  // Add quote to favourites list
  addToFavourites(quote: Quote): void {
    if (!this.isInFavourites(quote.id!)) {
      this.favouriteQuotes.push(quote);
      this.saveFavouritesToStorage();
    }
  }

  // Remove quote from favourites list
  removeFromFavourites(quoteId: number): void {
    this.favouriteQuotes = this.favouriteQuotes.filter(q => q.id !== quoteId);
    this.saveFavouritesToStorage();
  }

  // Check if quote is in favourites
  isInFavourites(quoteId: number): boolean {
    return this.favouriteQuotes.some(q => q.id === quoteId);
  }

  // Save favourites to localStorage
  saveFavouritesToStorage(): void {
    localStorage.setItem('favouriteQuotes', JSON.stringify(this.favouriteQuotes));
  }

  // Load favourites from localStorage
  loadFavouritesFromStorage(): void {
    const saved = localStorage.getItem('favouriteQuotes');
    if (saved) {
      try {
        this.favouriteQuotes = JSON.parse(saved);
      } catch (e) {
        console.error('Error loading favourite quotes:', e);
      }
    }
  }

  // ============ CRUD OPERATIONS ============

  // Submit form for create/update
  onSubmit(): void {
    if (this.quoteForm.valid) {
      this.isLoading = true;
      const formValue = this.quoteForm.value;
      
      // Prepare quote data - bookId can be null
      const quoteData: QuoteInput = {
        text: formValue.text,
        author: formValue.author,
        bookId: formValue.bookId || null  // Explicitly set to null if empty
      };

      console.log('Sending quote data:', quoteData); // Debug log

      if (this.isEdit && this.editingQuoteId) {
        // Update existing quote
        this.quoteService.updateQuote(this.editingQuoteId, quoteData).subscribe({
          next: (updatedQuote) => {
            console.log('Quote updated:', updatedQuote); // Debug log
            
            // Update in all quotes list
            const index = this.allQuotes.findIndex(q => q.id === this.editingQuoteId);
            if (index !== -1) this.allQuotes[index] = updatedQuote;
            
            // Update in favourites if exists
            const favIndex = this.favouriteQuotes.findIndex(q => q.id === this.editingQuoteId);
            if (favIndex !== -1) this.favouriteQuotes[favIndex] = updatedQuote;
            
            this.resetForm();
            this.saveFavouritesToStorage();
            this.isLoading = false;
          },
          error: (error) => {
            console.error('Error updating quote:', error);
            // Log more details
            console.error('Error response:', error.error);
            this.isLoading = false;
          }
        });
      } else {
        // Create new quote
        this.quoteService.createQuote(quoteData).subscribe({
          next: (newQuote) => {
            console.log('Quote created:', newQuote); // Debug log
            this.allQuotes.push(newQuote);
            this.resetForm();
            this.isLoading = false;
          },
          error: (error) => {
            console.error('Error creating quote:', error);
            // Log more details
            console.error('Error response:', error.error);
            this.isLoading = false;
          }
        });
      }
    }
  }

  // Edit a quote
  editQuote(quote: Quote): void {
    this.isEdit = true;
    this.editingQuoteId = quote.id;
    
    this.quoteForm.patchValue({
      text: quote.text,
      author: quote.author,
      bookId: quote.bookId || null
    });
    
    console.log('Editing quote ID:', quote.id); // Debug log
    
    // Scroll to form
    document.querySelector('.quote-form-section')?.scrollIntoView({ 
      behavior: 'smooth' 
    });
  }

  // Delete a quote
  deleteQuote(quoteId: number): void {
    this.translate.get('confirmDeleteQuote').subscribe((translated: string) => {
      const confirmMessage = translated || 'Are you sure you want to delete this quote?';
      
      if (confirm(confirmMessage)) {
        console.log('Deleting quote ID:', quoteId); // Debug log
        this.quoteService.deleteQuote(quoteId).subscribe({
          next: () => {
            console.log('Quote deleted successfully'); // Debug log
            
            // Remove from all quotes
            this.allQuotes = this.allQuotes.filter(q => q.id !== quoteId);
            
            // Remove from favourites
            this.removeFromFavourites(quoteId);
            
            // Reset form if editing this quote
            if (this.editingQuoteId === quoteId) {
              this.resetForm();
            }
          },
          error: (error) => {
            console.error('Error deleting quote:', error);
          }
        });
      }
    });
  }

  // Reset form
  resetForm(): void {
    this.quoteForm.reset({
      text: '',
      author: '',
      bookId: null
    });
    this.isEdit = false;
    this.editingQuoteId = undefined;
  }

  // Cancel editing
  cancelEdit(): void {
    this.resetForm();
  }
}