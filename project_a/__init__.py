"""Auditable salary tax calculator with no runtime dependencies."""
from .engine import calculate, compare
from .models import TaxInput

__all__ = ['TaxInput', 'calculate', 'compare']
