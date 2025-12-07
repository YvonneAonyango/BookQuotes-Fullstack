import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Quote, QuoteService } from '../../services/quote.service';
import { Book, BookService } from '../../services/book.service';
import { Meta, Title } from '@angular/platform-browser';
import { TruncatePipe } from '../../pipes/truncate.pipe';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-quotes',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule,
    TruncatePipe,
    TranslateModule
  ],
  templateUrl: './quotes.component.html',
  styleUrls: ['./quotes.component.css']
})
export class QuotesComponent implements OnInit {
  quotes: Quote[] = [];
  addedQuotes: Quote[] = [];
  books: Book[] = [];
  quoteForm: FormGroup;
  isLoading = false;
  isEdit = false;
  editingQuoteId?: number;
  selectedQuoteId?: number;

  private meta = inject(Meta);
  private titleService = inject(Title);
  private translate = inject(TranslateService);

  constructor(
    private quoteService: QuoteService,
    private bookService: BookService,
    private fb: FormBuilder
  ) {
    this.quoteForm = this.fb.group({
      text: ['', [Validators.required, Validators.minLength(10)]],
      author: ['', Validators.required],
      bookId: [null]  // ✅ Initialize with null instead of empty string
    });
  }

  ngOnInit(): void {
    this.titleService.setTitle('BookWebApp - Quotes');
    
    this.translate.get('quoteCollectionDesc').subscribe((translated: string) => {
      this.meta.updateTag({
        name: 'description',
        content: translated || 'Save and manage your favorite quotes from books.'
      });
    });

    this.loadQuotes();
    this.loadBooks();
    this.loadBasketFromStorage();
  }

  loadQuotes(): void {
    this.isLoading = true;
    this.quoteService.getQuotes().subscribe({
      next: (quotes) => {
        this.quotes = quotes;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading quotes:', error);
        this.isLoading = false;
      }
    });
  }

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

  getBookTitle(bookId?: number | null): string {
    if (!bookId) return '';
    const book = this.books.find(b => b.id === bookId);
    return book ? book.title : '';
  }

  addToBasket(quote: Quote): void {
    if (!this.isInBasket(quote.id!)) {
      this.addedQuotes.push(quote);
      this.saveBasketToStorage();
    }
  }

  removeFromBasket(quoteId: number): void {
    this.addedQuotes = this.addedQuotes.filter(q => q.id !== quoteId);
    this.saveBasketToStorage();
    if (this.selectedQuoteId === quoteId) {
      this.selectedQuoteId = undefined;
    }
  }

  isInBasket(quoteId: number): boolean {
    return this.addedQuotes.some(q => q.id === quoteId);
  }

  editQuoteFromBadge(quote: Quote): void {
    this.selectedQuoteId = quote.id;
    this.isEdit = true;
    this.editingQuoteId = quote.id;
    
    // ✅ Handle null bookId properly
    this.quoteForm.patchValue({
      text: quote.text,
      author: quote.author,
      bookId: quote.bookId || null  // Convert to null if empty/undefined
    });
    
    document.querySelector('.quote-form-section')?.scrollIntoView({ behavior: 'smooth' });
  }

  saveBasketToStorage(): void {
    localStorage.setItem('quoteBasket', JSON.stringify(this.addedQuotes));
  }

  loadBasketFromStorage(): void {
    const saved = localStorage.getItem('quoteBasket');
    if (saved) {
      try {
        this.addedQuotes = JSON.parse(saved);
      } catch (e) {
        console.error('Error loading quote basket from storage:', e);
      }
    }
  }

  onSubmit(): void {
    if (this.quoteForm.valid) {
      this.isLoading = true;
      const formValue = this.quoteForm.value;
      
      // ✅ Properly format bookId (null if empty)
      const quoteData: Quote = {
        text: formValue.text,
        author: formValue.author,
        bookId: formValue.bookId && formValue.bookId !== '' 
          ? Number(formValue.bookId) 
          : null
      };

      console.log('Sending quote data:', quoteData); // Debug

      if (this.isEdit && this.editingQuoteId) {
        this.quoteService.updateQuote(this.editingQuoteId, quoteData).subscribe({
          next: (updatedQuote) => {
            console.log('Update successful:', updatedQuote);
            const index = this.quotes.findIndex(q => q.id === this.editingQuoteId);
            if (index !== -1) this.quotes[index] = updatedQuote;
            const basketIndex = this.addedQuotes.findIndex(q => q.id === this.editingQuoteId);
            if (basketIndex !== -1) this.addedQuotes[basketIndex] = updatedQuote;
            this.resetForm();
            this.saveBasketToStorage();
            this.isLoading = false;
          },
          error: (error) => {
            console.error('Error updating quote:', error);
            console.error('Error details:', error.error);
            this.isLoading = false;
          }
        });
      } else {
        this.quoteService.createQuote(quoteData).subscribe({
          next: (newQuote) => {
            console.log('Create successful:', newQuote);
            this.quotes.push(newQuote);
            this.addedQuotes.push(newQuote);
            this.resetForm();
            this.saveBasketToStorage();
            this.isLoading = false;
          },
          error: (error) => {
            console.error('Error adding quote:', error);
            console.error('Error details:', error.error);
            this.isLoading = false;
          }
        });
      }
    }
  }

  resetForm(): void {
    this.quoteForm.reset({
      text: '',
      author: '',
      bookId: null  // ✅ Reset to null
    });
    this.isEdit = false;
    this.editingQuoteId = undefined;
    this.selectedQuoteId = undefined;
  }

  cancelForm(): void {
    this.resetForm();
  }

  editQuote(quote: Quote): void {
    this.editQuoteFromBadge(quote);
  }

  deleteQuote(id: number): void {
    this.translate.get('confirmDeleteQuote').subscribe((translated: string) => {
      const confirmMessage = translated || 'Are you sure you want to delete this quote?';
      if (confirm(confirmMessage)) {
        this.quoteService.deleteQuote(id).subscribe({
          next: () => {
            this.quotes = this.quotes.filter(q => q.id !== id);
            this.addedQuotes = this.addedQuotes.filter(q => q.id !== id);
            this.saveBasketToStorage();
            if (this.selectedQuoteId === id) this.resetForm();
          },
          error: (error) => {
            console.error('Error deleting quote:', error);
          }
        });
      }
    });
  }
}