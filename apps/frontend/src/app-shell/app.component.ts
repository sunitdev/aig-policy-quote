import { ChangeDetectionStrategy, Component } from "@angular/core";

import { PolicyQuotePageComponent } from "../features/policy-quote/policy-quote.page";

@Component({
  selector: "app-root",
  standalone: true,
  imports: [PolicyQuotePageComponent],
  templateUrl: "./app.component.html",
  styleUrl: "./app.component.css",
  host: {
    "[attr.data-app]": "appId"
  },
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent {
  protected readonly appId = "policy-quote";
}
