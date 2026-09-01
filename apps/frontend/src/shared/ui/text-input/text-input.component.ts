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

let nextTextInputId = 0;

@Component({
  selector: "app-text-input",
  standalone: true,
  templateUrl: "./text-input.component.html",
  styleUrl: "./text-input.component.css",
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TextInputComponent),
      multi: true
    }
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TextInputComponent implements ControlValueAccessor {
  @Input({ required: true }) label = "";
  @Input() helpText = "";
  @Input() errorText = "";
  @Input() placeholder = "";
  @Input() name = "";
  @Input({ transform: booleanAttribute }) required = false;
  @Input({ transform: booleanAttribute }) disabled = false;
  @Input({ transform: booleanAttribute }) readonly = false;

  protected readonly inputId = `app-text-input-${nextTextInputId.toString()}`;
  protected value = "";
  protected formDisabled = false;

  private readonly changeDetectorRef = inject(ChangeDetectorRef);
  private onChange: (value: string) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  public constructor() {
    nextTextInputId += 1;
  }

  protected get isDisabled(): boolean {
    return this.disabled || this.formDisabled;
  }

  protected get hasError(): boolean {
    return this.errorText.length > 0;
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

  public writeValue(value: string | null): void {
    this.value = value ?? "";
    this.changeDetectorRef.markForCheck();
  }

  public registerOnChange(onChange: (value: string) => void): void {
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
    this.value = input.value;
    this.onChange(this.value);
  }

  protected handleBlur(): void {
    this.onTouched();
  }
}
