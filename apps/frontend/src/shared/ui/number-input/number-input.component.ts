import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  booleanAttribute,
  forwardRef,
  inject
} from "@angular/core";
import type { ControlValueAccessor } from "@angular/forms";
import { NG_VALUE_ACCESSOR } from "@angular/forms";

let nextNumberInputId = 0;

@Component({
  selector: "app-number-input",
  standalone: true,
  templateUrl: "./number-input.component.html",
  styleUrl: "./number-input.component.css",
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => NumberInputComponent),
      multi: true
    }
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NumberInputComponent implements ControlValueAccessor {
  @Input({ required: true }) label = "";
  @Input() helpText = "";
  @Input() errorText = "";
  @Input() placeholder = "";
  @Input() name = "";
  @Input() min: number | null = null;
  @Input() max: number | null = null;
  @Input() step: number | "any" | null = null;
  @Input({ transform: booleanAttribute }) required = false;
  @Input({ transform: booleanAttribute }) disabled = false;
  @Input({ transform: booleanAttribute }) readonly = false;

  protected readonly inputId = `app-number-input-${nextNumberInputId.toString()}`;
  protected value: number | null = null;
  protected formDisabled = false;

  private readonly changeDetectorRef = inject(ChangeDetectorRef);
  private onChange: (value: number | null) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  public constructor() {
    nextNumberInputId += 1;
  }

  protected get isDisabled(): boolean {
    return this.disabled || this.formDisabled;
  }

  protected get hasError(): boolean {
    return this.errorText.length > 0;
  }

  protected get renderedValue(): string {
    return this.value === null ? "" : this.value.toString();
  }

  protected get helpId(): string {
    return `${this.inputId}-help`;
  }

  protected get errorId(): string {
    return `${this.inputId}-error`;
  }

  protected get describedBy(): string | null {
    const ids = [this.helpText ? this.helpId : "", this.errorText ? this.errorId : ""].filter(
      Boolean
    );

    return ids.length > 0 ? ids.join(" ") : null;
  }

  public writeValue(value: number | null): void {
    this.value = value;
    this.changeDetectorRef.markForCheck();
  }

  public registerOnChange(onChange: (value: number | null) => void): void {
    this.onChange = onChange;
  }

  public registerOnTouched(onTouched: () => void): void {
    this.onTouched = onTouched;
  }

  public setDisabledState(isDisabled: boolean): void {
    this.formDisabled = isDisabled;
    this.changeDetectorRef.markForCheck();
  }

  protected handleInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const nextValue = input.valueAsNumber;

    this.value = input.value === "" || Number.isNaN(nextValue) ? null : nextValue;
    this.onChange(this.value);
  }

  protected handleBlur(): void {
    this.onTouched();
  }
}
