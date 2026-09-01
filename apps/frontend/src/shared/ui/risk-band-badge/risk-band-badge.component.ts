import { ChangeDetectionStrategy, Component, Input } from "@angular/core";
import type { RiskBand } from "@policy-quote/api-contract";

const RISK_BAND_LABELS: Record<RiskBand, string> = {
  STANDARD: "Standard",
  ELEVATED: "Elevated",
  HIGH_RISK: "High risk"
};

@Component({
  selector: "app-risk-band-badge",
  standalone: true,
  templateUrl: "./risk-band-badge.component.html",
  styleUrl: "./risk-band-badge.component.css",
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RiskBandBadgeComponent {
  @Input({ required: true }) riskBand!: RiskBand;

  protected get label(): string {
    return RISK_BAND_LABELS[this.riskBand];
  }
}
