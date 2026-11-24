"""Validated inputs. Amounts represent eligible annual INR, never monthly CTC."""
from dataclasses import asdict, dataclass, fields
from decimal import Decimal, InvalidOperation
from typing import Any, Mapping

MONEY_FIELDS = ('annual_gross_salary', 'hra_received', 'hra_salary', 'rent_paid',
                'deduction_80c', 'deduction_80ccd1b', 'medical_self_family',
                'medical_parents', 'home_loan_interest')
BOOLEAN_FIELDS = ('resident', 'metro', 'self_family_senior', 'parents_senior')


@dataclass(frozen=True, slots=True)
class TaxInput:
    fiscal_year: str
    annual_gross_salary: Decimal
    age: int = 30
    resident: bool = True
    hra_received: Decimal = Decimal(0)
    hra_salary: Decimal = Decimal(0)
    rent_paid: Decimal = Decimal(0)
    metro: bool = False
    deduction_80c: Decimal = Decimal(0)
    deduction_80ccd1b: Decimal = Decimal(0)
    medical_self_family: Decimal = Decimal(0)
    medical_parents: Decimal = Decimal(0)
    self_family_senior: bool = False
    parents_senior: bool = False
    home_loan_interest: Decimal = Decimal(0)

    def __post_init__(self):
        if self.fiscal_year not in ('2024-25', '2025-26'):
            raise ValueError('fiscal_year must be 2024-25 or 2025-26 (financial year, not assessment year)')
        if type(self.age) is not int or not 0 <= self.age <= 120:
            raise ValueError('age must be an integer from 0 to 120, attained during the financial year')
        for name in BOOLEAN_FIELDS:
            if type(getattr(self, name)) is not bool:
                raise ValueError(f'{name} must be a JSON boolean')
        for name in MONEY_FIELDS:
            raw = getattr(self, name)
            if isinstance(raw, bool) or not isinstance(raw, (str, int, float, Decimal)):
                raise ValueError(f'{name} must be a nonnegative money amount')
            try:
                amount = Decimal(str(raw))
                if not amount.is_finite() or amount < 0 or amount > Decimal('1000000000000'):
                    raise ValueError(f'{name} must be finite and between 0 and 1 trillion INR')
                if amount != amount.quantize(Decimal('.01')):
                    raise ValueError(f'{name} supports at most two decimal places')
            except InvalidOperation as exc:
                raise ValueError(f'{name} must be a valid INR amount') from exc
            object.__setattr__(self, name, amount)
        if self.hra_received + self.hra_salary > self.annual_gross_salary:
            raise ValueError('hra_received plus hra_salary cannot exceed gross salary')
        if self.hra_received and not self.hra_salary:
            raise ValueError('hra_salary is required when hra_received is supplied')

    @classmethod
    def from_dict(cls, data: Mapping[str, Any]):
        if not isinstance(data, Mapping):
            raise ValueError('Tax input must be a JSON object')
        unknown = set(data) - {field.name for field in fields(cls)}
        if unknown:
            raise ValueError('Unsupported input fields: ' + ', '.join(sorted(map(str, unknown))))
        missing = {'fiscal_year', 'annual_gross_salary'} - set(data)
        if missing:
            raise ValueError('Missing required fields: ' + ', '.join(sorted(missing)))
        return cls(**data)

    def to_dict(self):
        return {key: float(value) if isinstance(value, Decimal) else value
                for key, value in asdict(self).items()}
