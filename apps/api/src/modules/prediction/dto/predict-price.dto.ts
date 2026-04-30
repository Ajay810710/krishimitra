import { IsString, IsNumber, IsDateString, IsOptional, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';

class InputCostsDto {
  @IsNumber() @Min(0) seedCostInr!: number;
  @IsNumber() @Min(0) fertilizerCostInr!: number;
  @IsNumber() @Min(0) labourCostInr!: number;
  @IsNumber() @Min(0) irrigationCostInr!: number;
}

export class PredictPriceDto {
  @IsString() cropId!: string;
  @IsString() mandiId!: string;
  @IsOptional() @IsString() landParcelId?: string;
  @IsDateString() plantingDate!: string;
  @IsDateString() harvestDate!: string;
  @IsNumber() @Min(0.1) landSizeAcres!: number;
  @IsOptional() @IsString() seedVariety?: string;
  @IsOptional() @IsString() seedBrand?: string;
  @ValidateNested() @Type(() => InputCostsDto) inputCosts!: InputCostsDto;
}
