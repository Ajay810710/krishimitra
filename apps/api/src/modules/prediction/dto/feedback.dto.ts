import { IsNumber, Min } from 'class-validator';

export class PredictionFeedbackDto {
  @IsNumber() @Min(0) actualPriceKg!: number;
}
