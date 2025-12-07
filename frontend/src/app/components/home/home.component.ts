import { Component, inject, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
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
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, FontAwesomeModule, TranslateModule],
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

  private meta = inject(Meta);
  private titleService = inject(Title);
  private translate = inject(TranslateService);

  ngOnInit(): void {
    // Set page title
    this.titleService.setTitle('BookWebApp - Home');

    // SEO description using translation
    this.translate.get('homeDescription').subscribe((translated: string) => {
      this.meta.updateTag({
        name: 'description',
        content: translated
      });
    });
  }
}