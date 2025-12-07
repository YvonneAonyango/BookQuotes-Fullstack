import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Book, BookService } from '../../services/book.service';
import { Meta, Title } from '@angular/platform-browser';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-book-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './book-form.component.html',
  styleUrls: ['./book-form.component.css']
})
export class BookFormComponent implements OnInit {
  bookForm: FormGroup;
  isEdit = false;
  bookId?: number;
  isLoading = false;
  showBackButton = true;
  errorMessage: string = '';

  private meta = inject(Meta);
  private titleService = inject(Title);
  private translate = inject(TranslateService);

  constructor(
    private fb: FormBuilder,
    private bookService: BookService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.bookForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(200)]],
      author: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      publicationDate: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEdit = true;
        this.bookId = +params['id'];
        this.loadBook();
      }

      // Set page title
      const title = this.isEdit ? 'Edit Book - BookWebApp' : 'Add Book - BookWebApp';
      this.titleService.setTitle(title);
    });

    // Set meta description
    this.translate.get('bookFormDescription').subscribe((translated: string) => {
      this.meta.updateTag({
        name: 'description',
        content: translated || 'Add or edit book details in your personal library.'
      });
    });
  }

  loadBook(): void {
    if (this.bookId) {
      this.isLoading = true;
      this.errorMessage = '';
      
      this.bookService.getBook(this.bookId).subscribe({
        next: (book: Book) => {
          // Safely handle publication date
          let pubDate = '';
          if (book.publicationDate) {
            try {
              // Handle various date formats for form input (YYYY-MM-DD)
              const date = new Date(book.publicationDate);
              if (!isNaN(date.getTime())) {
                pubDate = date.toISOString().split('T')[0];
              } else if (book.publicationDate.includes('T')) {
                pubDate = book.publicationDate.split('T')[0];
              } else {
                pubDate = book.publicationDate;
              }
            } catch (error) {
              console.warn('Date parsing error:', error);
              pubDate = '';
            }
          }
          
          this.bookForm.patchValue({
            title: book.title || '',
            author: book.author || '',
            publicationDate: pubDate
          });
          this.isLoading = false;
        },
        error: (error: any) => {
          console.error('Error loading book:', error);
          this.errorMessage = this.translate.instant('errorLoadingBook') || 'Failed to load book details. Please try again.';
          this.isLoading = false;
        }
      });
    }
  }

  onSubmit(): void {
    if (this.bookForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';
      
      const formValue = this.bookForm.value;
      const bookData: Book = {
        title: formValue.title.trim(),
        author: formValue.author.trim(),
        publicationDate: formValue.publicationDate
      };

      const operation = this.isEdit && this.bookId
        ? this.bookService.updateBook(this.bookId, bookData)
        : this.bookService.createBook(bookData);

      operation.subscribe({
        next: () => {
          this.isLoading = false;
          this.router.navigate(['/books']);
        },
        error: (error: any) => {
          console.error('Error saving book:', error);
          this.errorMessage = this.isEdit 
            ? (this.translate.instant('errorUpdatingBook') || 'Failed to update book. Please try again.')
            : (this.translate.instant('errorAddingBook') || 'Failed to add book. Please try again.');
          this.isLoading = false;
        }
      });
    } else {
      // Mark all fields as touched to show validation errors
      Object.keys(this.bookForm.controls).forEach(key => {
        const control = this.bookForm.get(key);
        control?.markAsTouched();
      });
    }
  }

  onCancel(): void {
    this.router.navigate(['/books']);
  }

  // Helper method to get today's date in YYYY-MM-DD format
  getTodayDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  // Helper method to format date for display
  formatDateForDisplay(dateString: string): string {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return dateString;
    }
  }
}