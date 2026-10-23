"""Employee ORM model."""

from datetime import date, datetime

from sqlalchemy import Date, DateTime, Index, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Employee(Base):
    """
    Represents an ACME employee.

    One employee has many SalaryRecords (one per month).
    """

    __tablename__ = "employees"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    # Human-readable identifier, e.g. "EMP-00042"
    employee_code: Mapped[str] = mapped_column(String(20), unique=True, nullable=False, index=True)

    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    last_name: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)

    department: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    job_title: Mapped[str] = mapped_column(String(100), nullable=False)

    # ISO-3166-1 alpha-2 country code, e.g. "US", "GB", "DE"
    country: Mapped[str] = mapped_column(String(100), nullable=False, index=True)

    hire_date: Mapped[date] = mapped_column(Date, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships
    salary_records: Mapped[list["SalaryRecord"]] = relationship(  # noqa: F821
        "SalaryRecord",
        back_populates="employee",
        cascade="all, delete-orphan",
    )

    # Composite index used by analytics queries
    __table_args__ = (
        Index("ix_employees_country_department", "country", "department"),
    )

    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}"

    def __repr__(self) -> str:
        return f"<Employee {self.employee_code} {self.full_name}>"

