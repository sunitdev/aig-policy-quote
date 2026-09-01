import { ChangeDetectionStrategy, Component } from "@angular/core";
import { FormControl, ReactiveFormsModule } from "@angular/forms";

import {
  ButtonComponent,
  CardComponent,
  NumberInputComponent,
  RiskBandBadgeComponent,
  SelectInputComponent,
  type AppSelectOption,
  TextInputComponent
} from "../shared/ui";

@Component({
  selector: "app-root",
  standalone: true,
  imports: [
    ButtonComponent,
    CardComponent,
    NumberInputComponent,
    ReactiveFormsModule,
    RiskBandBadgeComponent,
    SelectInputComponent,
    TextInputComponent
  ],
  templateUrl: "./app.component.html",
  styleUrl: "./app.component.css",
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent {
  protected readonly textInputControl = new FormControl("North Atlantic Property", {
    nonNullable: true
  });
  protected readonly invalidTextInputControl = new FormControl("A", { nonNullable: true });
  protected readonly disabledTextInputControl = new FormControl(
    { value: "Bound by underwriter review", disabled: true },
    { nonNullable: true }
  );
  protected readonly readonlyTextInputControl = new FormControl("Policy reference AIG-2049", {
    nonNullable: true
  });

  protected readonly numberInputControl = new FormControl<number | null>(1250000);
  protected readonly invalidNumberInputControl = new FormControl<number | null>(0);
  protected readonly disabledNumberInputControl = new FormControl<number | null>({
    value: 500000,
    disabled: true
  });
  protected readonly readonlyNumberInputControl = new FormControl<number | null>(2500000);

  protected readonly selectInputControl = new FormControl("commercial-property", {
    nonNullable: true
  });
  protected readonly invalidSelectInputControl = new FormControl("", { nonNullable: true });
  protected readonly disabledSelectInputControl = new FormControl(
    { value: "professional-liability", disabled: true },
    { nonNullable: true }
  );
  protected readonly readonlySelectInputControl = new FormControl("cyber", { nonNullable: true });

  protected readonly productOptions: AppSelectOption[] = [
    { label: "Commercial property", value: "commercial-property" },
    { label: "Professional liability", value: "professional-liability" },
    { label: "Cyber liability", value: "cyber" }
  ];
}
