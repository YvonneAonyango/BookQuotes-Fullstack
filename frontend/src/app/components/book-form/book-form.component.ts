import { Component, EventEmitter, Input, Output, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Book, BookService } from '../../services/book.service';
import { TranslateService } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-book-form',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './book-form.component.html',
  styleUrls: ['./book-form.component.css']
})
export class BookFormComponent implements OnInit {
  @Input() book?: Book;
  @Output() close = new EventEmitter<boolean>();

  bookForm!: FormGroup; // fixed strict initialization
  isLoading = false;
  errorMessage = '';

  private bookService = inject(BookService);
  private fb = inject(FormBuilder);
  private translate = inject(TranslateService);

  ngOnInit(): void {
    this.bookForm = this.fb.group({
      title: [this.book?.title || '', [Validators.required, Validators.minLength(2)]],
      author: [this.book?.author || '', [Validators.required, Validators.minLength(2)]],
      publishDate: [this.book?.publishDate?.split('T')[0] || this.getTodayDate(), Validators.required]
    });
  }

  onSubmit(): void {
    if (!this.bookForm.valid) return;

    this.isLoading = true;
    const data: Book = this.bookForm.value; // includes publishDate

    const request = this.book?.id
      ? this.bookService.updateBook(this.book.id, data)
      : this.bookService.createBook(data);

    request.subscribe({
      next: () => this.close.emit(true),
      error: err => {
        console.error(err);
        this.errorMessage = this.translate.instant(this.book?.id ? 'errorUpdatingBook' : 'errorAddingBook');
        this.isLoading = false;
      }
    });
  }

  onCancel(): void {
    this.close.emit(false);
  }

  // Helper functions inside component
  formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch {
      return dateString;
    }
  }

  getTodayDate(): string {
    return new Date().toISOString().split('T')[0];
  }
}