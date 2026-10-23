"""ORM models package — import all models here so Alembic can discover them."""

from app.models.employee import Employee  # noqa: F401
from app.models.salary_record import SalaryRecord  # noqa: F401

__all__ = ["Employee", "SalaryRecord"]

