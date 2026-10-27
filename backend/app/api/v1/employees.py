"""
Employees API — v1

Endpoints
---------
GET  /api/v1/employees          paginated list with filters + salary for a month
GET  /api/v1/employees/export   Excel download (same filters, no pagination)
GET  /api/v1/employees/meta/countries   distinct country list (for dropdowns)
GET  /api/v1/employees/meta/months      distinct salary months (for dropdowns)
GET  /api/v1/employees/{id}     single employee detail with full salary history

IMPORTANT: /export and /meta/* routes are declared BEFORE /{id} so FastAPI
doesn't mistake the literal path segments for an integer employee id.
"""

import io
import math
from datetime import date
from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill
from sqlalchemy import and_, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import aliased, selectinload

from app.core.database import get_db
from app.models.employee import Employee
from app.models.salary_record import SalaryRecord
from app.schemas.employee import (
    CountriesResponse,
    EmployeeDetail,
    EmployeeListItem,
    EmployeeListResponse,
    MonthsResponse,
    PaginationMeta,
    SalaryRecordOut,
)

router = APIRouter(prefix="/employees", tags=["Employees"])


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _parse_month(month: str) -> date:
    """Parse a 'YYYY-MM' string to the first day of that month."""
    try:
        year, mo = month.split("-")
        return date(int(year), int(mo), 1)
    except (ValueError, AttributeError):
        raise HTTPException(status_code=422, detail="month must be in YYYY-MM format")


async def _latest_salary_month(db: AsyncSession) -> date:
    """Return the most recent salary_month present in salary_records."""
    result = await db.execute(select(func.max(SalaryRecord.salary_month)))
    found = result.scalar_one_or_none()
    return found if found else date.today().replace(day=1)


def _apply_filters(stmt, *, sr_alias, search, country, is_paid):
    """Apply the common employee filter conditions to a SQLAlchemy statement."""
    if search:
        term = f"%{search}%"
        stmt = stmt.where(
            or_(
                Employee.first_name.ilike(term),
                Employee.last_name.ilike(term),
                Employee.email.ilike(term),
                Employee.employee_code.ilike(term),
                # full-name search (first + space + last)
                func.lower(Employee.first_name + " " + Employee.last_name).contains(
                    search.lower()
                ),
            )
        )
    if country:
        stmt = stmt.where(Employee.country == country)
    if is_paid is not None:
        stmt = stmt.where(sr_alias.is_paid == is_paid)
    return stmt


def _build_list_query(*, salary_date: date, search, country, is_paid):
    """Return (count_stmt, data_stmt_factory) for the employee list."""
    sr = aliased(SalaryRecord, name="sr")

    base = select(Employee, sr).outerjoin(
        sr,
        and_(sr.employee_id == Employee.id, sr.salary_month == salary_date),
    )
    base = _apply_filters(base, sr_alias=sr, search=search, country=country, is_paid=is_paid)
    return base, sr


# ---------------------------------------------------------------------------
# GET /employees
# ---------------------------------------------------------------------------

@router.get("", response_model=EmployeeListResponse, summary="List employees")
async def list_employees(
    search: Optional[str] = Query(None, description="Search by name, email or employee code"),
    country: Optional[str] = Query(None, description="Filter by country name"),
    month: Optional[str] = Query(None, description="Salary month (YYYY-MM). Defaults to latest."),
    is_paid: Optional[bool] = Query(None, description="Filter by salary paid status"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(50, ge=1, le=500, description="Records per page"),
    db: AsyncSession = Depends(get_db),
) -> EmployeeListResponse:
    """
    Returns a paginated list of employees.

    Each item includes salary information for the requested ``month``
    (defaults to the most recent month in the database when omitted).

    Setting ``is_paid`` without ``month`` applies the filter against the
    default (latest) month.
    """
    salary_date = _parse_month(month) if month else await _latest_salary_month(db)
    base_q, sr = _build_list_query(
        salary_date=salary_date, search=search, country=country, is_paid=is_paid
    )

    # --- Count ---
    count_q = select(func.count()).select_from(base_q.subquery())
    total: int = (await db.execute(count_q)).scalar_one()

    # --- Data (paginated) ---
    data_q = (
        base_q
        .order_by(Employee.last_name, Employee.first_name)
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    rows = (await db.execute(data_q)).all()

    items: list[EmployeeListItem] = []
    for emp, sr_row in rows:
        salary = SalaryRecordOut.model_validate(sr_row) if sr_row else None
        items.append(
            EmployeeListItem(
                id=emp.id,
                employee_code=emp.employee_code,
                first_name=emp.first_name,
                last_name=emp.last_name,
                email=emp.email,
                department=emp.department,
                job_title=emp.job_title,
                country=emp.country,
                hire_date=emp.hire_date,
                salary=salary,
            )
        )

    return EmployeeListResponse(
        data=items,
        meta=PaginationMeta.build(total=total, page=page, page_size=page_size),
        salary_month=salary_date,
    )


# ---------------------------------------------------------------------------
# GET /employees/export   ← must be before /{id}
# ---------------------------------------------------------------------------

def sanitize_excel_cell(value: Any) -> Any:
    """
    Neutralize CSV / Excel formula injection (CWE-1236).
    If a string starts with =, +, -, @, \t, or \r, prefix with a single quote (')
    to prevent spreadsheet software from executing it as a formula.
    """
    if isinstance(value, str) and value:
        if value[0] in ("=", "+", "-", "@", "\t", "\r"):
            return f"'{value}"
    return value


@router.get("/export", summary="Export employees to Excel")
async def export_employees(
    search: Optional[str] = Query(None),
    country: Optional[str] = Query(None),
    month: Optional[str] = Query(None, description="Salary month (YYYY-MM). Defaults to latest."),
    is_paid: Optional[bool] = Query(None),
    db: AsyncSession = Depends(get_db),
) -> StreamingResponse:
    """
    Download all matching employees (with salary for the requested month)
    as an Excel (.xlsx) file.  Applies the same filters as the list endpoint
    but without pagination — the complete result set is exported.
    Values are automatically sanitized against formula injection (CWE-1236).
    """
    salary_date = _parse_month(month) if month else await _latest_salary_month(db)
    base_q, _ = _build_list_query(
        salary_date=salary_date, search=search, country=country, is_paid=is_paid
    )
    data_q = base_q.order_by(Employee.last_name, Employee.first_name)
    rows = (await db.execute(data_q)).all()

    # Build workbook
    wb = Workbook()
    ws = wb.active
    ws.title = "Employees"

    header_font = Font(bold=True, color="FFFFFF")
    header_fill = PatternFill(fill_type="solid", fgColor="1F4E79")

    headers = [
        "Employee Code", "First Name", "Last Name", "Email",
        "Department", "Job Title", "Country", "Hire Date",
        "Salary Month", "Base Salary", "Currency", "Paid", "Paid Date",
    ]
    ws.append(headers)
    for cell in ws[1]:
        cell.font = header_font
        cell.fill = header_fill

    # Column widths
    col_widths = [14, 14, 14, 30, 18, 22, 16, 12, 14, 14, 10, 8, 12]
    for i, width in enumerate(col_widths, start=1):
        ws.column_dimensions[ws.cell(row=1, column=i).column_letter].width = width

    for emp, sr_row in rows:
        ws.append([
            sanitize_excel_cell(emp.employee_code),
            sanitize_excel_cell(emp.first_name),
            sanitize_excel_cell(emp.last_name),
            sanitize_excel_cell(emp.email),
            sanitize_excel_cell(emp.department),
            sanitize_excel_cell(emp.job_title),
            sanitize_excel_cell(emp.country),
            emp.hire_date.isoformat() if emp.hire_date else "",
            salary_date.strftime("%b %Y"),
            sr_row.base_salary if sr_row else "",
            sanitize_excel_cell(sr_row.currency if sr_row else ""),
            "Yes" if (sr_row and sr_row.is_paid) else ("No" if sr_row else ""),
            sr_row.paid_date.isoformat() if (sr_row and sr_row.paid_date) else "",
        ])

    buffer = io.BytesIO()
    wb.save(buffer)
    buffer.seek(0)

    filename = f"acme_employees_{salary_date.strftime('%Y_%m')}.xlsx"
    return StreamingResponse(
        buffer,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


# ---------------------------------------------------------------------------
# GET /employees/meta/countries   ← before /{id}
# ---------------------------------------------------------------------------

@router.get("/meta/countries", response_model=CountriesResponse, summary="List distinct countries")
async def list_countries(db: AsyncSession = Depends(get_db)) -> CountriesResponse:
    """Returns the sorted list of distinct countries present in the employees table."""
    result = await db.execute(
        select(Employee.country).distinct().order_by(Employee.country)
    )
    return CountriesResponse(countries=[row[0] for row in result.all()])


# ---------------------------------------------------------------------------
# GET /employees/meta/months   ← before /{id}
# ---------------------------------------------------------------------------

@router.get("/meta/months", response_model=MonthsResponse, summary="List distinct salary months")
async def list_months(db: AsyncSession = Depends(get_db)) -> MonthsResponse:
    """Returns the sorted list of distinct salary months (ISO date strings)."""
    result = await db.execute(
        select(SalaryRecord.salary_month).distinct().order_by(SalaryRecord.salary_month.desc())
    )
    return MonthsResponse(months=[row[0].isoformat() for row in result.all()])


# ---------------------------------------------------------------------------
# GET /employees/{id}
# ---------------------------------------------------------------------------

@router.get("/{employee_id}", response_model=EmployeeDetail, summary="Get employee detail")
async def get_employee(
    employee_id: int,
    db: AsyncSession = Depends(get_db),
) -> EmployeeDetail:
    """
    Returns a single employee with their complete salary record history,
    ordered newest month first.
    """
    result = await db.execute(
        select(Employee)
        .options(selectinload(Employee.salary_records))
        .where(Employee.id == employee_id)
    )
    emp = result.scalar_one_or_none()
    if emp is None:
        raise HTTPException(status_code=404, detail=f"Employee {employee_id} not found")

    salary_records = sorted(
        emp.salary_records, key=lambda r: r.salary_month, reverse=True
    )
    return EmployeeDetail(
        id=emp.id,
        employee_code=emp.employee_code,
        first_name=emp.first_name,
        last_name=emp.last_name,
        email=emp.email,
        department=emp.department,
        job_title=emp.job_title,
        country=emp.country,
        hire_date=emp.hire_date,
        salary_records=[SalaryRecordOut.model_validate(r) for r in salary_records],
    )

