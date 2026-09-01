import { ChangeDetectionStrategy, Component, Input, booleanAttribute } from "@angular/core";

export type AppButtonVariant = "primary" | "secondary" | "danger" | "ghost";
export type AppButtonType = "button" | "submit" | "reset";

@Component({
  selector: "app-button",
  standalone: true,
  templateUrl: "./button.component.html",
  styleUrl: "./button.component.css",
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ButtonComponent {
  @Input() variant: AppButtonVariant = "primary";
  @Input() type: AppButtonType = "button";
  @Input({ transform: booleanAttribute }) disabled = false;
  @Input({ transform: booleanAttribute }) loading = false;
}
