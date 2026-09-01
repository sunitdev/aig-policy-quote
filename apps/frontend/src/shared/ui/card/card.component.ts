import { ChangeDetectionStrategy, Component, Input } from "@angular/core";

export type AppCardVariant = "default" | "subtle" | "elevated";

@Component({
  selector: "app-card",
  standalone: true,
  templateUrl: "./card.component.html",
  styleUrl: "./card.component.css",
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CardComponent {
  @Input() variant: AppCardVariant = "default";
}
