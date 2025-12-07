import { Component, inject, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslationService } from '../../services/translation.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { 
  faBook, 
  faQuoteLeft, 
  faUser, 
  faPlus, 
  faStar, 
  faLightbulb,
  faChartLine,
  faHistory,
  faArrowRight
} from '@fortawesome/free-solid-svg-icons';
import { Meta, Title } from '@angular/platform-browser';
import { TranslationPipe } from '../../pipes/translation.pipe'; 

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, FontAwesomeModule, TranslationPipe], 
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class HomeComponent implements OnInit {
  
  faBook = faBook;
  faQuoteLeft = faQuoteLeft;
  faUser = faUser;
  faPlus = faPlus;
  faStar = faStar;
  faLightbulb = faLightbulb;
  faChartLine = faChartLine;
  faHistory = faHistory;
  faArrowRight = faArrowRight;

  translationService = inject(TranslationService);

  changeLanguage(lang: 'en' | 'sv') {
    this.translationService.setLanguage(lang);
  }

  private meta = inject(Meta);
  private titleService = inject(Title);

  ngOnInit(): void {
    // Set page title
    this.titleService.setTitle('BookWebApp - Home');

    // SEO description
    this.meta.updateTag({
      name: 'description',
      content: 'Manage your personal library with BookWebApp. Add books, save quotes, and enjoy reading!'
    });
  }
}