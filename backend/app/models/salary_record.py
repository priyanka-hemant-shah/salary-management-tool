"""SalaryRecord ORM model — one record per employee per month."""

from datetime import date, datetime

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    Float,
    ForeignKey,
    Index,
    Integer,
    String,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class SalaryRecord(Base):
    """
    Monthly salary record for one employee.

    ``salary_month`` is always the first day of the month (e.g. 2024-03-01)
    so queries like "all records for March 2024" are a simple date equality.
    """

    __tablename__ = "salary_records"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    employee_id: Mapped[int] = mapped_column(
        ForeignKey("employees.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # First day of the payroll month (e.g. date(2024, 3, 1) for March 2024)
    salary_month: Mapped[date] = mapped_column(Date, nullable=False, index=True)

    base_salary: Mapped[float] = mapped_column(Float, nullable=False)

    # ISO-4217 currency code, e.g. "USD", "GBP", "EUR"
    currency: Mapped[str] = mapped_column(String(3), nullable=False)

    is_paid: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False, index=True)

    # Populated when is_paid = True
    paid_date: Mapped[date | None] = mapped_column(Date, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships
    employee: Mapped["Employee"] = relationship(  # noqa: F821
        "Employee",
        back_populates="salary_records",
    )

    __table_args__ = (
        # Each employee has exactly one record per month
        UniqueConstraint("employee_id", "salary_month", name="uq_employee_salary_month"),
        # Composite index for analytics: filter by month + country (via join) + paid status
        Index("ix_salary_records_month_paid", "salary_month", "is_paid"),
    )

    @property
    def month_label(self) -> str:
        """Human-readable month label, e.g. 'Mar 2024'."""
        return self.salary_month.strftime("%b %Y")

    def __repr__(self) -> str:
        return (
            f"<SalaryRecord employee_id={self.employee_id} "
            f"month={self.salary_month} {self.currency} {self.base_salary:.2f}>"
        )

