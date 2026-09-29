from sqlalchemy import Integer
from sqlalchemy import Numeric
from datetime import datetime, date
from sqlalchemy import Date
import uuid

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    String,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from .database import Base


class Agent(Base):
    __tablename__ = "agents"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    slug: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    name_en: Mapped[str] = mapped_column(String(100))
    name_ar: Mapped[str] = mapped_column(String(100))
    role: Mapped[str] = mapped_column(String(255))
    system_prompt: Mapped[str] = mapped_column(Text)
    enabled: Mapped[bool] = mapped_column(Boolean, default=True)

    created_at: Mapped[object] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )
    updated_at: Mapped[object] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )


class Conversation(Base):
    __tablename__ = "conversations"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    agent_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("agents.id"),
        index=True,
    )
    title: Mapped[str | None] = mapped_column(String(255), nullable=True)

    created_at: Mapped[object] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )


class Message(Base):
    __tablename__ = "messages"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    conversation_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("conversations.id"),
        index=True,
    )
    role: Mapped[str] = mapped_column(String(30))
    content: Mapped[str] = mapped_column(Text)
    message_metadata: Mapped[dict] = mapped_column(
        JSONB,
        default=dict,
    )

    created_at: Mapped[object] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )


class Task(Base):
    __tablename__ = "tasks"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    agent_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("agents.id"),
        nullable=True,
        index=True,
    )

    source_conversation_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("conversations.id"),
        nullable=True,
        index=True,
    )

    title: Mapped[str] = mapped_column(String(255))

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    status: Mapped[str] = mapped_column(
        String(30),
        default="pending",
        index=True,
    )

    priority: Mapped[str] = mapped_column(
        String(20),
        default="normal",
        index=True,
    )

    payload: Mapped[dict] = mapped_column(
        JSONB,
        default=dict,
    )

    due_at: Mapped[object | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        index=True,
    )

    completed_at: Mapped[object | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    created_at: Mapped[object] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )

    updated_at: Mapped[object] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    actor: Mapped[str] = mapped_column(String(100))
    action: Mapped[str] = mapped_column(String(255))
    details: Mapped[dict] = mapped_column(JSONB, default=dict)

    created_at: Mapped[object] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )


class Memory(Base):
    __tablename__ = "memories"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    agent_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("agents.id"),
        nullable=True,
        index=True,
    )

    source_conversation_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("conversations.id"),
        nullable=True,
        index=True,
    )

    scope: Mapped[str] = mapped_column(
        String(30),
        default="agent",
        index=True,
    )

    memory_type: Mapped[str] = mapped_column(
        String(50),
        default="fact",
        index=True,
    )

    content: Mapped[str] = mapped_column(Text)

    importance: Mapped[str] = mapped_column(
        String(20),
        default="normal",
    )

    memory_metadata: Mapped[dict] = mapped_column(
        JSONB,
        default=dict,
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        index=True,
    )

    created_at: Mapped[object] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )

    updated_at: Mapped[object] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )


class Approval(Base):
    __tablename__ = "approvals"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    agent_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("agents.id"),
        nullable=True,
        index=True,
    )

    source_conversation_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("conversations.id"),
        nullable=True,
        index=True,
    )

    title: Mapped[str] = mapped_column(
        String(255),
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    action_type: Mapped[str] = mapped_column(
        String(100),
        index=True,
    )

    risk_level: Mapped[str] = mapped_column(
        String(20),
        default="medium",
        index=True,
    )

    status: Mapped[str] = mapped_column(
        String(30),
        default="pending",
        index=True,
    )

    action_payload: Mapped[dict] = mapped_column(
        JSONB,
        default=dict,
    )

    decision_reason: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    decided_at: Mapped[object | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    executed_at: Mapped[object | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    created_at: Mapped[object] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )

    updated_at: Mapped[object] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )



class MorningBrief(Base):
    __tablename__ = "morning_briefs"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    brief_date: Mapped[date] = mapped_column(
        Date,
        nullable=False,
        unique=True,
        index=True,
    )

    brief: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    model: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    snapshot: Mapped[dict] = mapped_column(
        JSONB,
        default=dict,
        nullable=False,
    )

    generation_type: Mapped[str] = mapped_column(
        String(30),
        default="scheduled",
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )



class WeeklyExecutiveReview(Base):
    __tablename__ = "weekly_executive_reviews"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    review_date: Mapped[date] = mapped_column(
        Date,
        nullable=False,
        unique=True,
        index=True,
    )

    period_start: Mapped[date] = mapped_column(
        Date,
        nullable=False,
    )

    period_end: Mapped[date] = mapped_column(
        Date,
        nullable=False,
    )

    review: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    model: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    snapshot: Mapped[dict] = mapped_column(
        JSONB,
        default=dict,
        nullable=False,
    )

    generation_type: Mapped[str] = mapped_column(
        String(30),
        default="scheduled",
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )



# ============================================================
# HR CORE
# ============================================================

class HRDepartment(Base):
    __tablename__ = "hr_departments"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    code: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        nullable=False,
        index=True,
    )

    name_ar: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    name_en: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    parent_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("hr_departments.id"),
        nullable=True,
        index=True,
    )

    cost_center: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
        index=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


class HRPosition(Base):
    __tablename__ = "hr_positions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    code: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        nullable=False,
        index=True,
    )

    title_ar: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    title_en: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    department_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("hr_departments.id"),
        nullable=True,
        index=True,
    )

    grade: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
    )

    employment_level: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    headcount_budget: Mapped[int] = mapped_column(
        Integer,
        default=1,
        nullable=False,
    )

    min_salary: Mapped[float | None] = mapped_column(
        Numeric(14, 2),
        nullable=True,
    )

    midpoint_salary: Mapped[float | None] = mapped_column(
        Numeric(14, 2),
        nullable=True,
    )

    max_salary: Mapped[float | None] = mapped_column(
        Numeric(14, 2),
        nullable=True,
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
        index=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


class HREmployee(Base):
    __tablename__ = "hr_employees"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    employee_number: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        nullable=False,
        index=True,
    )

    full_name_ar: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    full_name_en: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    national_id_or_iqama: Mapped[str | None] = mapped_column(
        String(50),
        unique=True,
        nullable=True,
        index=True,
    )

    nationality: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    gender: Mapped[str | None] = mapped_column(
        String(30),
        nullable=True,
    )

    date_of_birth: Mapped[date | None] = mapped_column(
        Date,
        nullable=True,
    )

    work_email: Mapped[str | None] = mapped_column(
        String(255),
        unique=True,
        nullable=True,
        index=True,
    )

    personal_email: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    mobile: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
    )

    department_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("hr_departments.id"),
        nullable=True,
        index=True,
    )

    position_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("hr_positions.id"),
        nullable=True,
        index=True,
    )

    manager_employee_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("hr_employees.id"),
        nullable=True,
        index=True,
    )

    hire_date: Mapped[date | None] = mapped_column(
        Date,
        nullable=True,
    )

    probation_end_date: Mapped[date | None] = mapped_column(
        Date,
        nullable=True,
    )

    termination_date: Mapped[date | None] = mapped_column(
        Date,
        nullable=True,
    )

    employment_status: Mapped[str] = mapped_column(
        String(50),
        default="active",
        nullable=False,
        index=True,
    )

    employment_type: Mapped[str] = mapped_column(
        String(50),
        default="full_time",
        nullable=False,
        index=True,
    )

    work_location: Mapped[str | None] = mapped_column(
        String(150),
        nullable=True,
    )

    gosi_registered: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )

    notes: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    employee_metadata: Mapped[dict] = mapped_column(
        JSONB,
        default=dict,
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


class HREmploymentContract(Base):
    __tablename__ = "hr_employment_contracts"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    employee_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("hr_employees.id"),
        nullable=False,
        index=True,
    )

    contract_number: Mapped[str | None] = mapped_column(
        String(100),
        unique=True,
        nullable=True,
        index=True,
    )

    contract_type: Mapped[str] = mapped_column(
        String(50),
        default="fixed_term",
        nullable=False,
        index=True,
    )

    start_date: Mapped[date] = mapped_column(
        Date,
        nullable=False,
    )

    end_date: Mapped[date | None] = mapped_column(
        Date,
        nullable=True,
    )

    auto_renew: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )

    notice_period_days: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    currency: Mapped[str] = mapped_column(
        String(10),
        default="SAR",
        nullable=False,
    )

    basic_salary: Mapped[float] = mapped_column(
        Numeric(14, 2),
        default=0,
        nullable=False,
    )

    housing_allowance: Mapped[float] = mapped_column(
        Numeric(14, 2),
        default=0,
        nullable=False,
    )

    transport_allowance: Mapped[float] = mapped_column(
        Numeric(14, 2),
        default=0,
        nullable=False,
    )

    other_fixed_allowances: Mapped[float] = mapped_column(
        Numeric(14, 2),
        default=0,
        nullable=False,
    )

    employer_gosi_cost: Mapped[float] = mapped_column(
        Numeric(14, 2),
        default=0,
        nullable=False,
    )

    medical_insurance_cost_annual: Mapped[float] = mapped_column(
        Numeric(14, 2),
        default=0,
        nullable=False,
    )

    other_annual_cost: Mapped[float] = mapped_column(
        Numeric(14, 2),
        default=0,
        nullable=False,
    )

    status: Mapped[str] = mapped_column(
        String(50),
        default="active",
        nullable=False,
        index=True,
    )

    contract_metadata: Mapped[dict] = mapped_column(
        JSONB,
        default=dict,
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )



# ============================================================
# HR RECRUITMENT
# ============================================================

class HRVacancy(Base):
    __tablename__ = "hr_vacancies"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    position_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("hr_positions.id"),
        nullable=True,
        index=True,
    )

    title_ar: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    title_en: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    status: Mapped[str] = mapped_column(
        String(50),
        default="open",
        nullable=False,
        index=True,
    )

    openings: Mapped[int] = mapped_column(
        Integer,
        default=1,
        nullable=False,
    )

    employment_type: Mapped[str] = mapped_column(
        String(50),
        default="full_time",
        nullable=False,
    )

    work_location: Mapped[str | None] = mapped_column(
        String(150),
        nullable=True,
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    requirements: Mapped[dict] = mapped_column(
        JSONB,
        default=dict,
        nullable=False,
    )

    salary_min: Mapped[float | None] = mapped_column(
        Numeric(14, 2),
        nullable=True,
    )

    salary_max: Mapped[float | None] = mapped_column(
        Numeric(14, 2),
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


class HRCandidate(Base):
    __tablename__ = "hr_candidates"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    vacancy_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("hr_vacancies.id"),
        nullable=True,
        index=True,
    )

    full_name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    email: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
        index=True,
    )

    mobile: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
    )

    source: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    current_title: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    years_experience: Mapped[float | None] = mapped_column(
        Numeric(5, 2),
        nullable=True,
    )

    stage: Mapped[str] = mapped_column(
        String(50),
        default="applied",
        nullable=False,
        index=True,
    )

    fit_score: Mapped[float | None] = mapped_column(
        Numeric(5, 2),
        nullable=True,
        index=True,
    )

    ai_summary: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    ai_strengths: Mapped[dict] = mapped_column(
        JSONB,
        default=dict,
        nullable=False,
    )

    ai_gaps: Mapped[dict] = mapped_column(
        JSONB,
        default=dict,
        nullable=False,
    )

    cv_text: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    cv_file_name: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    notes: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


class HRInterview(Base):
    __tablename__ = "hr_interviews"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    candidate_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("hr_candidates.id"),
        nullable=False,
        index=True,
    )

    interview_type: Mapped[str] = mapped_column(
        String(50),
        default="hr",
        nullable=False,
    )

    scheduled_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    interviewer: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    score: Mapped[float | None] = mapped_column(
        Numeric(5, 2),
        nullable=True,
    )

    recommendation: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
    )

    feedback: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


class HROffer(Base):
    __tablename__ = "hr_offers"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    candidate_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("hr_candidates.id"),
        nullable=False,
        index=True,
    )

    status: Mapped[str] = mapped_column(
        String(50),
        default="draft",
        nullable=False,
        index=True,
    )

    proposed_start_date: Mapped[date | None] = mapped_column(
        Date,
        nullable=True,
    )

    basic_salary: Mapped[float] = mapped_column(
        Numeric(14, 2),
        default=0,
        nullable=False,
    )

    housing_allowance: Mapped[float] = mapped_column(
        Numeric(14, 2),
        default=0,
        nullable=False,
    )

    transport_allowance: Mapped[float] = mapped_column(
        Numeric(14, 2),
        default=0,
        nullable=False,
    )

    other_allowances: Mapped[float] = mapped_column(
        Numeric(14, 2),
        default=0,
        nullable=False,
    )

    offer_metadata: Mapped[dict] = mapped_column(
        JSONB,
        default=dict,
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )



# ============================================================
# HR ONBOARDING
# ============================================================

class HROnboardingPlan(Base):
    __tablename__ = "hr_onboarding_plans"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    employee_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("hr_employees.id"),
        nullable=False,
        unique=True,
        index=True,
    )

    status: Mapped[str] = mapped_column(
        String(50),
        default="active",
        nullable=False,
        index=True,
    )

    start_date: Mapped[date] = mapped_column(
        Date,
        nullable=False,
    )

    notes: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


class HROnboardingItem(Base):
    __tablename__ = "hr_onboarding_items"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    plan_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("hr_onboarding_plans.id"),
        nullable=False,
        index=True,
    )

    category: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        index=True,
    )

    title: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    owner: Mapped[str | None] = mapped_column(
        String(150),
        nullable=True,
    )

    status: Mapped[str] = mapped_column(
        String(50),
        default="pending",
        nullable=False,
        index=True,
    )

    is_required: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )

    due_date: Mapped[date | None] = mapped_column(
        Date,
        nullable=True,
        index=True,
    )

    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    completion_note: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    item_metadata: Mapped[dict] = mapped_column(
        JSONB,
        default=dict,
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )



# ============================================================
# HR EMPLOYEE LIFECYCLE
# ============================================================

class HRProbationReview(Base):
    __tablename__ = "hr_probation_reviews"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    employee_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("hr_employees.id"),
        nullable=False,
        index=True,
    )

    review_date: Mapped[date] = mapped_column(
        Date,
        nullable=False,
    )

    reviewer: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    performance_score: Mapped[float | None] = mapped_column(
        Numeric(5, 2),
        nullable=True,
    )

    outcome: Mapped[str] = mapped_column(
        String(50),
        default="review",
        nullable=False,
        index=True,
    )

    comments: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


class HREmployeeChange(Base):
    __tablename__ = "hr_employee_changes"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    employee_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("hr_employees.id"),
        nullable=False,
        index=True,
    )

    change_type: Mapped[str] = mapped_column(
        String(80),
        nullable=False,
        index=True,
    )

    status: Mapped[str] = mapped_column(
        String(50),
        default="pending_approval",
        nullable=False,
        index=True,
    )

    effective_date: Mapped[date] = mapped_column(
        Date,
        nullable=False,
    )

    approval_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("approvals.id"),
        nullable=True,
        index=True,
    )

    before_state: Mapped[dict] = mapped_column(
        JSONB,
        default=dict,
        nullable=False,
    )

    proposed_state: Mapped[dict] = mapped_column(
        JSONB,
        default=dict,
        nullable=False,
    )

    notes: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    applied_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


class HROffboardingPlan(Base):
    __tablename__ = "hr_offboarding_plans"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    employee_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("hr_employees.id"),
        nullable=False,
        unique=True,
        index=True,
    )

    termination_date: Mapped[date] = mapped_column(
        Date,
        nullable=False,
    )

    status: Mapped[str] = mapped_column(
        String(50),
        default="active",
        nullable=False,
        index=True,
    )

    reason: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


class HROffboardingItem(Base):
    __tablename__ = "hr_offboarding_items"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    plan_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("hr_offboarding_plans.id"),
        nullable=False,
        index=True,
    )

    category: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    title: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    owner: Mapped[str | None] = mapped_column(
        String(150),
        nullable=True,
    )

    due_date: Mapped[date | None] = mapped_column(
        Date,
        nullable=True,
    )

    status: Mapped[str] = mapped_column(
        String(50),
        default="pending",
        nullable=False,
        index=True,
    )

    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    notes: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )



# ============================================================
# HR PERFORMANCE MANAGEMENT
# ============================================================

class HRPerformanceCycle(Base):
    __tablename__ = "hr_performance_cycles"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    cycle_type: Mapped[str] = mapped_column(
        String(50),
        default="annual",
        nullable=False,
        index=True,
    )

    start_date: Mapped[date] = mapped_column(
        Date,
        nullable=False,
    )

    end_date: Mapped[date] = mapped_column(
        Date,
        nullable=False,
    )

    status: Mapped[str] = mapped_column(
        String(50),
        default="draft",
        nullable=False,
        index=True,
    )

    bell_curve_enabled: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )

    notes: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


class HRKPITemplate(Base):
    __tablename__ = "hr_kpi_templates"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    position_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("hr_positions.id"),
        nullable=True,
        index=True,
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    status: Mapped[str] = mapped_column(
        String(50),
        default="active",
        nullable=False,
        index=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


class HRKPIMetric(Base):
    __tablename__ = "hr_kpi_metrics"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    template_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("hr_kpi_templates.id"),
        nullable=False,
        index=True,
    )

    name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    weight: Mapped[float] = mapped_column(
        Numeric(5, 2),
        nullable=False,
    )

    target_value: Mapped[float | None] = mapped_column(
        Numeric(14, 2),
        nullable=True,
    )

    unit: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    direction: Mapped[str] = mapped_column(
        String(30),
        default="higher_better",
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


class HRPerformancePlan(Base):
    __tablename__ = "hr_performance_plans"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    employee_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("hr_employees.id"),
        nullable=False,
        index=True,
    )

    cycle_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("hr_performance_cycles.id"),
        nullable=False,
        index=True,
    )

    template_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("hr_kpi_templates.id"),
        nullable=False,
        index=True,
    )

    status: Mapped[str] = mapped_column(
        String(50),
        default="active",
        nullable=False,
        index=True,
    )

    self_score: Mapped[float | None] = mapped_column(
        Numeric(5, 2),
        nullable=True,
    )

    manager_score: Mapped[float | None] = mapped_column(
        Numeric(5, 2),
        nullable=True,
    )

    final_score: Mapped[float | None] = mapped_column(
        Numeric(5, 2),
        nullable=True,
        index=True,
    )

    rating: Mapped[str | None] = mapped_column(
        String(80),
        nullable=True,
        index=True,
    )

    manager_comments: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    employee_comments: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


class HRPerformanceMetricResult(Base):
    __tablename__ = "hr_performance_metric_results"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    plan_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("hr_performance_plans.id"),
        nullable=False,
        index=True,
    )

    metric_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("hr_kpi_metrics.id"),
        nullable=False,
        index=True,
    )

    actual_value: Mapped[float | None] = mapped_column(
        Numeric(14, 2),
        nullable=True,
    )

    self_score: Mapped[float | None] = mapped_column(
        Numeric(5, 2),
        nullable=True,
    )

    manager_score: Mapped[float | None] = mapped_column(
        Numeric(5, 2),
        nullable=True,
    )

    final_score: Mapped[float | None] = mapped_column(
        Numeric(5, 2),
        nullable=True,
    )

    comments: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )



# ============================================================
# HR COMPENSATION & REWARDS
# ============================================================

class HRCompensationCycle(Base):
    __tablename__ = "hr_compensation_cycles"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    performance_cycle_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("hr_performance_cycles.id"),
        nullable=True,
        index=True,
    )

    status: Mapped[str] = mapped_column(
        String(50),
        default="active",
        nullable=False,
        index=True,
    )

    merit_budget_amount: Mapped[float | None] = mapped_column(
        Numeric(16, 2),
        nullable=True,
    )

    bonus_budget_amount: Mapped[float | None] = mapped_column(
        Numeric(16, 2),
        nullable=True,
    )

    notes: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


class HRMeritRule(Base):
    __tablename__ = "hr_merit_rules"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    cycle_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("hr_compensation_cycles.id"),
        nullable=False,
        index=True,
    )

    performance_rating: Mapped[str] = mapped_column(
        String(80),
        nullable=False,
        index=True,
    )

    compa_ratio_min: Mapped[float] = mapped_column(
        Numeric(7, 2),
        nullable=False,
    )

    compa_ratio_max: Mapped[float] = mapped_column(
        Numeric(7, 2),
        nullable=False,
    )

    increase_pct: Mapped[float] = mapped_column(
        Numeric(7, 2),
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )


class HRBonusRule(Base):
    __tablename__ = "hr_bonus_rules"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    cycle_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("hr_compensation_cycles.id"),
        nullable=False,
        index=True,
    )

    performance_rating: Mapped[str] = mapped_column(
        String(80),
        nullable=False,
        index=True,
    )

    bonus_pct_of_monthly_basic: Mapped[float] = mapped_column(
        Numeric(7, 2),
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )


class HRCompensationRecommendation(Base):
    __tablename__ = "hr_compensation_recommendations"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    cycle_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("hr_compensation_cycles.id"),
        nullable=False,
        index=True,
    )

    employee_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("hr_employees.id"),
        nullable=False,
        index=True,
    )

    contract_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("hr_employment_contracts.id"),
        nullable=False,
        index=True,
    )

    performance_plan_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("hr_performance_plans.id"),
        nullable=True,
        index=True,
    )

    approval_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("approvals.id"),
        nullable=True,
        index=True,
    )

    effective_date: Mapped[date] = mapped_column(
        Date,
        nullable=False,
    )

    current_basic: Mapped[float] = mapped_column(
        Numeric(14, 2),
        nullable=False,
    )

    salary_min: Mapped[float] = mapped_column(
        Numeric(14, 2),
        nullable=False,
    )

    salary_mid: Mapped[float] = mapped_column(
        Numeric(14, 2),
        nullable=False,
    )

    salary_max: Mapped[float] = mapped_column(
        Numeric(14, 2),
        nullable=False,
    )

    compa_ratio: Mapped[float] = mapped_column(
        Numeric(8, 2),
        nullable=False,
    )

    performance_score: Mapped[float] = mapped_column(
        Numeric(7, 2),
        nullable=False,
    )

    performance_rating: Mapped[str] = mapped_column(
        String(80),
        nullable=False,
        index=True,
    )

    merit_pct: Mapped[float] = mapped_column(
        Numeric(7, 2),
        default=0,
        nullable=False,
    )

    proposed_basic: Mapped[float] = mapped_column(
        Numeric(14, 2),
        nullable=False,
    )

    monthly_increase: Mapped[float] = mapped_column(
        Numeric(14, 2),
        default=0,
        nullable=False,
    )

    annual_merit_cost: Mapped[float] = mapped_column(
        Numeric(16, 2),
        default=0,
        nullable=False,
    )

    bonus_eligible: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )

    bonus_pct: Mapped[float] = mapped_column(
        Numeric(7, 2),
        default=0,
        nullable=False,
    )

    bonus_amount: Mapped[float] = mapped_column(
        Numeric(16, 2),
        default=0,
        nullable=False,
    )

    total_year1_cost: Mapped[float] = mapped_column(
        Numeric(16, 2),
        default=0,
        nullable=False,
    )

    status: Mapped[str] = mapped_column(
        String(50),
        default="draft",
        nullable=False,
        index=True,
    )

    notes: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )



# ============================================================
# HR PAYROLL & BENEFITS
# ============================================================

class HRPayrollCycle(Base):
    __tablename__ = "hr_payroll_cycles"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    year: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        index=True,
    )

    month: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        index=True,
    )

    status: Mapped[str] = mapped_column(
        String(50),
        default="draft",
        nullable=False,
        index=True,
    )

    approval_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("approvals.id"),
        nullable=True,
        index=True,
    )

    variance_threshold_pct: Mapped[float] = mapped_column(
        Numeric(7, 2),
        default=10,
        nullable=False,
    )

    notes: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    closed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


class HRPayrollEntry(Base):
    __tablename__ = "hr_payroll_entries"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    cycle_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("hr_payroll_cycles.id"),
        nullable=False,
        index=True,
    )

    employee_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("hr_employees.id"),
        nullable=False,
        index=True,
    )

    contract_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("hr_employment_contracts.id"),
        nullable=False,
        index=True,
    )

    basic_salary: Mapped[float] = mapped_column(
        Numeric(14, 2),
        default=0,
        nullable=False,
    )

    housing_allowance: Mapped[float] = mapped_column(
        Numeric(14, 2),
        default=0,
        nullable=False,
    )

    transport_allowance: Mapped[float] = mapped_column(
        Numeric(14, 2),
        default=0,
        nullable=False,
    )

    other_fixed_allowances: Mapped[float] = mapped_column(
        Numeric(14, 2),
        default=0,
        nullable=False,
    )

    overtime_amount: Mapped[float] = mapped_column(
        Numeric(14, 2),
        default=0,
        nullable=False,
    )

    other_earnings: Mapped[float] = mapped_column(
        Numeric(14, 2),
        default=0,
        nullable=False,
    )

    employee_gosi_deduction: Mapped[float] = mapped_column(
        Numeric(14, 2),
        default=0,
        nullable=False,
    )

    other_deductions: Mapped[float] = mapped_column(
        Numeric(14, 2),
        default=0,
        nullable=False,
    )

    employer_gosi_cost: Mapped[float] = mapped_column(
        Numeric(14, 2),
        default=0,
        nullable=False,
    )

    benefit_cost_monthly: Mapped[float] = mapped_column(
        Numeric(14, 2),
        default=0,
        nullable=False,
    )

    gross_pay: Mapped[float] = mapped_column(
        Numeric(14, 2),
        default=0,
        nullable=False,
    )

    net_pay: Mapped[float] = mapped_column(
        Numeric(14, 2),
        default=0,
        nullable=False,
    )

    employer_total_cost: Mapped[float] = mapped_column(
        Numeric(16, 2),
        default=0,
        nullable=False,
    )

    entry_metadata: Mapped[dict] = mapped_column(
        JSONB,
        default=dict,
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


class HROvertimeRecord(Base):
    __tablename__ = "hr_overtime_records"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    employee_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("hr_employees.id"),
        nullable=False,
        index=True,
    )

    work_date: Mapped[date] = mapped_column(
        Date,
        nullable=False,
        index=True,
    )

    hours: Mapped[float] = mapped_column(
        Numeric(8, 2),
        nullable=False,
    )

    approved_amount: Mapped[float] = mapped_column(
        Numeric(14, 2),
        default=0,
        nullable=False,
    )

    status: Mapped[str] = mapped_column(
        String(50),
        default="pending",
        nullable=False,
        index=True,
    )

    notes: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


class HRBenefitEnrollment(Base):
    __tablename__ = "hr_benefit_enrollments"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    employee_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("hr_employees.id"),
        nullable=False,
        index=True,
    )

    benefit_type: Mapped[str] = mapped_column(
        String(80),
        nullable=False,
        index=True,
    )

    provider: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    plan_name: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    annual_employer_cost: Mapped[float] = mapped_column(
        Numeric(14, 2),
        default=0,
        nullable=False,
    )

    employee_monthly_deduction: Mapped[float] = mapped_column(
        Numeric(14, 2),
        default=0,
        nullable=False,
    )

    status: Mapped[str] = mapped_column(
        String(50),
        default="active",
        nullable=False,
        index=True,
    )

    start_date: Mapped[date | None] = mapped_column(
        Date,
        nullable=True,
    )

    end_date: Mapped[date | None] = mapped_column(
        Date,
        nullable=True,
    )

    notes: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

# ============================================================
# HR - Leave & Attendance
# ============================================================

class HRLeaveType(Base):
    __tablename__ = "hr_leave_types"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    code: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        unique=True,
        index=True,
    )

    name_en: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
    )

    name_ar: Mapped[str | None] = mapped_column(
        String(150),
        nullable=True,
    )

    annual_entitlement: Mapped[float] = mapped_column(
        Numeric(8, 2),
        default=0,
        nullable=False,
    )

    is_paid: Mapped[bool] = mapped_column(
        default=True,
        nullable=False,
    )

    carry_forward_allowed: Mapped[bool] = mapped_column(
        default=False,
        nullable=False,
    )

    max_carry_forward_days: Mapped[float] = mapped_column(
        Numeric(8, 2),
        default=0,
        nullable=False,
    )

    status: Mapped[str] = mapped_column(
        String(30),
        default="active",
        nullable=False,
        index=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


class HRLeaveBalance(Base):
    __tablename__ = "hr_leave_balances"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    employee_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("hr_employees.id"),
        nullable=False,
        index=True,
    )

    leave_type_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("hr_leave_types.id"),
        nullable=False,
        index=True,
    )

    balance_year: Mapped[str] = mapped_column(
        String(4),
        nullable=False,
        index=True,
    )

    entitlement_days: Mapped[float] = mapped_column(
        Numeric(8, 2),
        default=0,
        nullable=False,
    )

    carried_forward_days: Mapped[float] = mapped_column(
        Numeric(8, 2),
        default=0,
        nullable=False,
    )

    used_days: Mapped[float] = mapped_column(
        Numeric(8, 2),
        default=0,
        nullable=False,
    )

    pending_days: Mapped[float] = mapped_column(
        Numeric(8, 2),
        default=0,
        nullable=False,
    )

    adjustment_days: Mapped[float] = mapped_column(
        Numeric(8, 2),
        default=0,
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


class HRLeaveRequest(Base):
    __tablename__ = "hr_leave_requests"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    employee_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("hr_employees.id"),
        nullable=False,
        index=True,
    )

    contract_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("hr_employment_contracts.id"),
        nullable=True,
        index=True,
    )

    leave_type_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("hr_leave_types.id"),
        nullable=False,
        index=True,
    )

    start_date: Mapped[date] = mapped_column(
        Date,
        nullable=False,
        index=True,
    )

    end_date: Mapped[date] = mapped_column(
        Date,
        nullable=False,
        index=True,
    )

    total_days: Mapped[float] = mapped_column(
        Numeric(8, 2),
        nullable=False,
    )

    status: Mapped[str] = mapped_column(
        String(30),
        default="pending",
        nullable=False,
        index=True,
    )

    reason: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    attachment_url: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
    )

    approver_name: Mapped[str | None] = mapped_column(
        String(150),
        nullable=True,
    )

    decision_note: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    requested_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    decided_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


class HRAttendanceRecord(Base):
    __tablename__ = "hr_attendance_records"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    employee_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("hr_employees.id"),
        nullable=False,
        index=True,
    )

    contract_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("hr_employment_contracts.id"),
        nullable=True,
        index=True,
    )

    work_date: Mapped[date] = mapped_column(
        Date,
        nullable=False,
        index=True,
    )

    clock_in: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    clock_out: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    scheduled_hours: Mapped[float] = mapped_column(
        Numeric(6, 2),
        default=8,
        nullable=False,
    )

    worked_hours: Mapped[float] = mapped_column(
        Numeric(6, 2),
        default=0,
        nullable=False,
    )

    late_minutes: Mapped[float] = mapped_column(
        Numeric(8, 2),
        default=0,
        nullable=False,
    )

    early_leave_minutes: Mapped[float] = mapped_column(
        Numeric(8, 2),
        default=0,
        nullable=False,
    )

    overtime_hours: Mapped[float] = mapped_column(
        Numeric(6, 2),
        default=0,
        nullable=False,
    )

    status: Mapped[str] = mapped_column(
        String(30),
        default="present",
        nullable=False,
        index=True,
    )

    source: Mapped[str] = mapped_column(
        String(50),
        default="manual",
        nullable=False,
    )

    notes: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


class HRAttendanceException(Base):
    __tablename__ = "hr_attendance_exceptions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    employee_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("hr_employees.id"),
        nullable=False,
        index=True,
    )

    attendance_record_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("hr_attendance_records.id"),
        nullable=True,
        index=True,
    )

    exception_date: Mapped[date] = mapped_column(
        Date,
        nullable=False,
        index=True,
    )

    exception_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        index=True,
    )

    minutes: Mapped[float] = mapped_column(
        Numeric(8, 2),
        default=0,
        nullable=False,
    )

    status: Mapped[str] = mapped_column(
        String(30),
        default="open",
        nullable=False,
        index=True,
    )

    reason: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    resolution_note: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


# ============================================================
# HR - Employee Payments & Claims
# Payroll remains payroll-only.
# ============================================================

class HREmployeePaymentBatch(Base):
    __tablename__ = "hr_employee_payment_batches"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    cycle_month: Mapped[date] = mapped_column(
        Date,
        nullable=False,
        unique=True,
        index=True,
    )

    cutoff_date: Mapped[date] = mapped_column(
        Date,
        nullable=False,
        index=True,
    )

    due_date: Mapped[date] = mapped_column(
        Date,
        nullable=False,
        index=True,
    )

    status: Mapped[str] = mapped_column(
        String(30),
        default="open",
        nullable=False,
        index=True,
    )

    total_requests: Mapped[int] = mapped_column(
        default=0,
        nullable=False,
    )

    total_amount: Mapped[float] = mapped_column(
        Numeric(16, 2),
        default=0,
        nullable=False,
    )

    notes: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


class HREmployeePaymentRequest(Base):
    __tablename__ = "hr_employee_payment_requests"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    employee_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("hr_employees.id"),
        nullable=False,
        index=True,
    )

    batch_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("hr_employee_payment_batches.id"),
        nullable=True,
        index=True,
    )

    payment_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        index=True,
    )

    source_type: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
        index=True,
    )

    source_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        nullable=True,
        index=True,
    )

    amount: Mapped[float] = mapped_column(
        Numeric(16, 2),
        nullable=False,
    )

    currency: Mapped[str] = mapped_column(
        String(3),
        default="SAR",
        nullable=False,
    )

    request_date: Mapped[date] = mapped_column(
        Date,
        nullable=False,
        index=True,
    )

    eligible_cycle_month: Mapped[date] = mapped_column(
        Date,
        nullable=False,
        index=True,
    )

    status: Mapped[str] = mapped_column(
        String(30),
        default="pending",
        nullable=False,
        index=True,
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    attachment_url: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
    )

    approver_name: Mapped[str | None] = mapped_column(
        String(150),
        nullable=True,
    )

    approval_note: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    approved_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    paid_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    payment_reference: Mapped[str | None] = mapped_column(
        String(150),
        nullable=True,
    )

    submitted_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


# ============================================================
# HR - Annual Leave Carry Forward
# Standard policy: maximum 10 days.
# Exceptional cases may be manually approved above 10 days.
# ============================================================

class HRLeaveCarryForwardOverride(Base):
    __tablename__ = "hr_leave_carry_forward_overrides"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    employee_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("hr_employees.id"),
        nullable=False,
        index=True,
    )

    leave_type_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("hr_leave_types.id"),
        nullable=False,
        index=True,
    )

    from_year: Mapped[str] = mapped_column(
        String(4),
        nullable=False,
        index=True,
    )

    to_year: Mapped[str] = mapped_column(
        String(4),
        nullable=False,
        index=True,
    )

    unused_days_at_year_end: Mapped[float] = mapped_column(
        Numeric(8, 2),
        default=0,
        nullable=False,
    )

    standard_carry_limit: Mapped[float] = mapped_column(
        Numeric(8, 2),
        default=10,
        nullable=False,
    )

    approved_carry_days: Mapped[float] = mapped_column(
        Numeric(8, 2),
        nullable=False,
    )

    reason: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    approved_by: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
    )

    approval_reference: Mapped[str | None] = mapped_column(
        String(250),
        nullable=True,
    )

    notes: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


# ============================================================
# HR - EOSB / Final Settlement
# ============================================================

class HRFinalSettlement(Base):
    __tablename__ = "hr_final_settlements"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    employee_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("hr_employees.id"),
        nullable=False,
        index=True,
    )

    contract_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("hr_employment_contracts.id"),
        nullable=False,
        index=True,
    )

    offboarding_plan_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("hr_offboarding_plans.id"),
        nullable=True,
        index=True,
    )

    status: Mapped[str] = mapped_column(
        String(30),
        default="draft",
        nullable=False,
        index=True,
    )

    termination_initiator: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        index=True,
    )

    termination_reason: Mapped[str] = mapped_column(
        String(80),
        nullable=False,
        index=True,
    )

    service_start_date: Mapped[date] = mapped_column(
        Date,
        nullable=False,
    )

    last_working_day: Mapped[date] = mapped_column(
        Date,
        nullable=False,
        index=True,
    )

    service_days: Mapped[int] = mapped_column(
        default=0,
        nullable=False,
    )

    # --------------------------------------------------------
    # Salary snapshot at termination
    # --------------------------------------------------------

    basic_salary: Mapped[float] = mapped_column(
        Numeric(14, 2),
        default=0,
        nullable=False,
    )

    housing_allowance: Mapped[float] = mapped_column(
        Numeric(14, 2),
        default=0,
        nullable=False,
    )

    transport_allowance: Mapped[float] = mapped_column(
        Numeric(14, 2),
        default=0,
        nullable=False,
    )

    other_fixed_allowances: Mapped[float] = mapped_column(
        Numeric(14, 2),
        default=0,
        nullable=False,
    )

    eosb_wage_basis: Mapped[float] = mapped_column(
        Numeric(14, 2),
        default=0,
        nullable=False,
    )

    # --------------------------------------------------------
    # EOSB
    # --------------------------------------------------------

    eosb_full_amount: Mapped[float] = mapped_column(
        Numeric(16, 2),
        default=0,
        nullable=False,
    )

    eosb_entitlement_ratio: Mapped[float] = mapped_column(
        Numeric(8, 4),
        default=1,
        nullable=False,
    )

    eosb_amount: Mapped[float] = mapped_column(
        Numeric(16, 2),
        default=0,
        nullable=False,
    )

    # --------------------------------------------------------
    # Salary due
    # --------------------------------------------------------

    salary_due_days: Mapped[float] = mapped_column(
        Numeric(8, 2),
        default=0,
        nullable=False,
    )

    salary_due_amount: Mapped[float] = mapped_column(
        Numeric(16, 2),
        default=0,
        nullable=False,
    )

    # --------------------------------------------------------
    # Annual leave payable at Last Working Day
    # IMPORTANT:
    # This is accrued/payable leave through LWD,
    # not the front-loaded 30-day available balance.
    # --------------------------------------------------------

    leave_current_year_accrued: Mapped[float] = mapped_column(
        Numeric(8, 2),
        default=0,
        nullable=False,
    )

    leave_carried_forward: Mapped[float] = mapped_column(
        Numeric(8, 2),
        default=0,
        nullable=False,
    )

    leave_used_to_last_working_day: Mapped[float] = mapped_column(
        Numeric(8, 2),
        default=0,
        nullable=False,
    )

    leave_adjustment_days: Mapped[float] = mapped_column(
        Numeric(8, 2),
        default=0,
        nullable=False,
    )

    leave_payable_days: Mapped[float] = mapped_column(
        Numeric(8, 2),
        default=0,
        nullable=False,
    )

    leave_daily_rate: Mapped[float] = mapped_column(
        Numeric(14, 4),
        default=0,
        nullable=False,
    )

    leave_encashment_amount: Mapped[float] = mapped_column(
        Numeric(16, 2),
        default=0,
        nullable=False,
    )

    # --------------------------------------------------------
    # Other statutory / contractual settlement items
    # --------------------------------------------------------

    notice_compensation_amount: Mapped[float] = mapped_column(
        Numeric(16, 2),
        default=0,
        nullable=False,
    )

    article_77_compensation_amount: Mapped[float] = mapped_column(
        Numeric(16, 2),
        default=0,
        nullable=False,
    )

    other_entitlements: Mapped[float] = mapped_column(
        Numeric(16, 2),
        default=0,
        nullable=False,
    )

    deductions: Mapped[float] = mapped_column(
        Numeric(16, 2),
        default=0,
        nullable=False,
    )

    gross_settlement: Mapped[float] = mapped_column(
        Numeric(16, 2),
        default=0,
        nullable=False,
    )

    net_settlement: Mapped[float] = mapped_column(
        Numeric(16, 2),
        default=0,
        nullable=False,
    )

    statutory_due_date: Mapped[date | None] = mapped_column(
        Date,
        nullable=True,
        index=True,
    )

    calculation_version: Mapped[str] = mapped_column(
        String(50),
        default="saudi_labor_2026_v1",
        nullable=False,
    )

    calculation_notes: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    approved_by: Mapped[str | None] = mapped_column(
        String(150),
        nullable=True,
    )

    approved_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    paid_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    payment_reference: Mapped[str | None] = mapped_column(
        String(150),
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


# ============================================================
# HR - Employee Relations & Disciplinary
# ============================================================

class HREmployeeRelationCase(Base):
    __tablename__ = "hr_employee_relation_cases"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    employee_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("hr_employees.id"),
        nullable=False,
        index=True,
    )

    case_number: Mapped[str] = mapped_column(
        String(60),
        nullable=False,
        unique=True,
        index=True,
    )

    case_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        index=True,
    )

    category: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
        index=True,
    )

    incident_date: Mapped[date | None] = mapped_column(
        Date,
        nullable=True,
        index=True,
    )

    severity: Mapped[str] = mapped_column(
        String(30),
        default="medium",
        nullable=False,
        index=True,
    )

    status: Mapped[str] = mapped_column(
        String(30),
        default="open",
        nullable=False,
        index=True,
    )

    confidential: Mapped[bool] = mapped_column(
        default=True,
        nullable=False,
    )

    description: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    reported_by: Mapped[str | None] = mapped_column(
        String(150),
        nullable=True,
    )

    assigned_to: Mapped[str | None] = mapped_column(
        String(150),
        nullable=True,
    )

    investigation_findings: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    final_decision: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    attachment_url: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
    )

    closed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


class HRDisciplinaryAction(Base):
    __tablename__ = "hr_disciplinary_actions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    case_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("hr_employee_relation_cases.id"),
        nullable=False,
        index=True,
    )

    employee_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("hr_employees.id"),
        nullable=False,
        index=True,
    )

    action_type: Mapped[str] = mapped_column(
        String(60),
        nullable=False,
        index=True,
    )

    action_date: Mapped[date] = mapped_column(
        Date,
        nullable=False,
        index=True,
    )

    effective_date: Mapped[date | None] = mapped_column(
        Date,
        nullable=True,
    )

    expiry_date: Mapped[date | None] = mapped_column(
        Date,
        nullable=True,
    )

    status: Mapped[str] = mapped_column(
        String(30),
        default="issued",
        nullable=False,
        index=True,
    )

    reason: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    reference_number: Mapped[str | None] = mapped_column(
        String(120),
        nullable=True,
    )

    issued_by: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
    )

    employee_comment: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    acknowledged_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    attachment_url: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


class HRGrievanceAppeal(Base):
    __tablename__ = "hr_grievance_appeals"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    employee_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("hr_employees.id"),
        nullable=False,
        index=True,
    )

    case_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("hr_employee_relation_cases.id"),
        nullable=True,
        index=True,
    )

    submitted_date: Mapped[date] = mapped_column(
        Date,
        nullable=False,
        index=True,
    )

    subject: Mapped[str] = mapped_column(
        String(200),
        nullable=False,
    )

    details: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    status: Mapped[str] = mapped_column(
        String(30),
        default="pending",
        nullable=False,
        index=True,
    )

    reviewed_by: Mapped[str | None] = mapped_column(
        String(150),
        nullable=True,
    )

    decision: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    decided_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    attachment_url: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


# ============================================================
# HR - Government & Corporate Compliance Register
# ============================================================

class HRCorporateComplianceRecord(Base):
    __tablename__ = "hr_corporate_compliance_records"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    record_type: Mapped[str] = mapped_column(
        String(80),
        nullable=False,
        index=True,
    )

    category: Mapped[str] = mapped_column(
        String(80),
        default="government_license",
        nullable=False,
        index=True,
    )

    entity_name: Mapped[str] = mapped_column(
        String(200),
        nullable=False,
        index=True,
    )

    branch_name: Mapped[str | None] = mapped_column(
        String(200),
        nullable=True,
        index=True,
    )

    issuing_authority: Mapped[str | None] = mapped_column(
        String(200),
        nullable=True,
    )

    document_number: Mapped[str | None] = mapped_column(
        String(150),
        nullable=True,
        index=True,
    )

    issue_date: Mapped[date | None] = mapped_column(
        Date,
        nullable=True,
    )

    expiry_date: Mapped[date | None] = mapped_column(
        Date,
        nullable=True,
        index=True,
    )

    status: Mapped[str] = mapped_column(
        String(30),
        default="active",
        nullable=False,
        index=True,
    )

    responsible_owner: Mapped[str | None] = mapped_column(
        String(150),
        nullable=True,
        index=True,
    )

    renewal_lead_days: Mapped[int] = mapped_column(
        default=90,
        nullable=False,
    )

    escalation_lead_days: Mapped[int] = mapped_column(
        default=30,
        nullable=False,
    )

    renewal_cost: Mapped[float] = mapped_column(
        Numeric(16, 2),
        default=0,
        nullable=False,
    )

    currency: Mapped[str] = mapped_column(
        String(3),
        default="SAR",
        nullable=False,
    )

    attachment_url: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
    )

    notes: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    last_renewed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


class HREmployeeGovernmentDocument(Base):
    __tablename__ = "hr_employee_government_documents"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    employee_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("hr_employees.id"),
        nullable=False,
        index=True,
    )

    document_type: Mapped[str] = mapped_column(
        String(80),
        nullable=False,
        index=True,
    )

    issuing_authority: Mapped[str | None] = mapped_column(
        String(200),
        nullable=True,
    )

    document_number: Mapped[str | None] = mapped_column(
        String(150),
        nullable=True,
        index=True,
    )

    issue_date: Mapped[date | None] = mapped_column(
        Date,
        nullable=True,
    )

    expiry_date: Mapped[date | None] = mapped_column(
        Date,
        nullable=True,
        index=True,
    )

    status: Mapped[str] = mapped_column(
        String(30),
        default="active",
        nullable=False,
        index=True,
    )

    responsible_owner: Mapped[str | None] = mapped_column(
        String(150),
        nullable=True,
    )

    renewal_lead_days: Mapped[int] = mapped_column(
        default=90,
        nullable=False,
    )

    escalation_lead_days: Mapped[int] = mapped_column(
        default=30,
        nullable=False,
    )

    renewal_cost: Mapped[float] = mapped_column(
        Numeric(16, 2),
        default=0,
        nullable=False,
    )

    currency: Mapped[str] = mapped_column(
        String(3),
        default="SAR",
        nullable=False,
    )

    attachment_url: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
    )

    notes: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    last_renewed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


class HRComplianceRenewalHistory(Base):
    __tablename__ = "hr_compliance_renewal_history"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    record_scope: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        index=True,
    )

    record_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        nullable=False,
        index=True,
    )

    previous_expiry_date: Mapped[date | None] = mapped_column(
        Date,
        nullable=True,
    )

    new_issue_date: Mapped[date | None] = mapped_column(
        Date,
        nullable=True,
    )

    new_expiry_date: Mapped[date | None] = mapped_column(
        Date,
        nullable=True,
    )

    renewal_cost: Mapped[float] = mapped_column(
        Numeric(16, 2),
        default=0,
        nullable=False,
    )

    currency: Mapped[str] = mapped_column(
        String(3),
        default="SAR",
        nullable=False,
    )

    renewed_by: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
    )

    reference_number: Mapped[str | None] = mapped_column(
        String(150),
        nullable=True,
    )

    notes: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    renewed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )



# ============================================================
# HR - Training & Development
# Operational / ad-hoc training only.
# No annual training plan in the initial version.
# ============================================================

class HRTrainingCourse(Base):
    __tablename__ = "hr_training_courses"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    code: Mapped[str] = mapped_column(
        String(60),
        nullable=False,
        unique=True,
        index=True,
    )

    title: Mapped[str] = mapped_column(
        String(250),
        nullable=False,
        index=True,
    )

    category: Mapped[str] = mapped_column(
        String(100),
        default="professional",
        nullable=False,
        index=True,
    )

    provider: Mapped[str | None] = mapped_column(
        String(200),
        nullable=True,
    )

    delivery_mode: Mapped[str] = mapped_column(
        String(50),
        default="in_person",
        nullable=False,
        index=True,
    )

    duration_hours: Mapped[float] = mapped_column(
        Numeric(8, 2),
        default=0,
        nullable=False,
    )

    standard_cost: Mapped[float] = mapped_column(
        Numeric(16, 2),
        default=0,
        nullable=False,
    )

    currency: Mapped[str] = mapped_column(
        String(3),
        default="SAR",
        nullable=False,
    )

    certification: Mapped[bool] = mapped_column(
        default=False,
        nullable=False,
    )

    certification_validity_months: Mapped[int | None] = mapped_column(
        nullable=True,
    )

    mandatory: Mapped[bool] = mapped_column(
        default=False,
        nullable=False,
        index=True,
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    status: Mapped[str] = mapped_column(
        String(30),
        default="active",
        nullable=False,
        index=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


class HRTrainingSession(Base):
    __tablename__ = "hr_training_sessions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    course_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("hr_training_courses.id"),
        nullable=False,
        index=True,
    )

    request_source: Mapped[str] = mapped_column(
        String(50),
        default="hr",
        nullable=False,
        index=True,
    )

    requested_by: Mapped[str | None] = mapped_column(
        String(150),
        nullable=True,
    )

    request_date: Mapped[date] = mapped_column(
        Date,
        default=date.today,
        nullable=False,
        index=True,
    )

    start_date: Mapped[date | None] = mapped_column(
        Date,
        nullable=True,
        index=True,
    )

    end_date: Mapped[date | None] = mapped_column(
        Date,
        nullable=True,
    )

    location: Mapped[str | None] = mapped_column(
        String(250),
        nullable=True,
    )

    provider: Mapped[str | None] = mapped_column(
        String(200),
        nullable=True,
    )

    delivery_mode: Mapped[str] = mapped_column(
        String(50),
        default="in_person",
        nullable=False,
        index=True,
    )

    capacity: Mapped[int | None] = mapped_column(
        nullable=True,
    )

    estimated_cost: Mapped[float] = mapped_column(
        Numeric(16, 2),
        default=0,
        nullable=False,
    )

    actual_cost: Mapped[float] = mapped_column(
        Numeric(16, 2),
        default=0,
        nullable=False,
    )

    currency: Mapped[str] = mapped_column(
        String(3),
        default="SAR",
        nullable=False,
    )

    status: Mapped[str] = mapped_column(
        String(30),
        default="requested",
        nullable=False,
        index=True,
    )

    notes: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


class HRTrainingEnrollment(Base):
    __tablename__ = "hr_training_enrollments"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    session_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("hr_training_sessions.id"),
        nullable=False,
        index=True,
    )

    employee_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("hr_employees.id"),
        nullable=False,
        index=True,
    )

    nomination_source: Mapped[str] = mapped_column(
        String(50),
        default="hr",
        nullable=False,
        index=True,
    )

    status: Mapped[str] = mapped_column(
        String(30),
        default="nominated",
        nullable=False,
        index=True,
    )

    attendance_pct: Mapped[float] = mapped_column(
        Numeric(6, 2),
        default=0,
        nullable=False,
    )

    result: Mapped[str | None] = mapped_column(
        String(60),
        nullable=True,
    )

    score: Mapped[float | None] = mapped_column(
        Numeric(8, 2),
        nullable=True,
    )

    completion_date: Mapped[date | None] = mapped_column(
        Date,
        nullable=True,
    )

    certificate_number: Mapped[str | None] = mapped_column(
        String(150),
        nullable=True,
    )

    certificate_issue_date: Mapped[date | None] = mapped_column(
        Date,
        nullable=True,
    )

    certificate_expiry_date: Mapped[date | None] = mapped_column(
        Date,
        nullable=True,
        index=True,
    )

    employee_paid_amount: Mapped[float] = mapped_column(
        Numeric(16, 2),
        default=0,
        nullable=False,
    )

    reimbursement_eligible: Mapped[bool] = mapped_column(
        default=False,
        nullable=False,
    )

    reimbursement_amount: Mapped[float] = mapped_column(
        Numeric(16, 2),
        default=0,
        nullable=False,
    )

    reimbursement_status: Mapped[str] = mapped_column(
        String(30),
        default="not_applicable",
        nullable=False,
        index=True,
    )

    reimbursement_payment_request_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("hr_employee_payment_requests.id"),
        nullable=True,
        index=True,
    )

    notes: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )



# ============================================================
# HR - Succession & Talent Management
# Reuses existing HR Positions and Performance Plans.
# ============================================================

class HRCriticalPosition(Base):
    __tablename__ = "hr_critical_positions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    position_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("hr_positions.id"),
        nullable=False,
        unique=True,
        index=True,
    )

    criticality_level: Mapped[str] = mapped_column(
        String(30),
        default="high",
        nullable=False,
        index=True,
    )

    vacancy_risk: Mapped[str] = mapped_column(
        String(30),
        default="medium",
        nullable=False,
        index=True,
    )

    business_impact: Mapped[str] = mapped_column(
        String(30),
        default="high",
        nullable=False,
        index=True,
    )

    succession_required: Mapped[bool] = mapped_column(
        default=True,
        nullable=False,
        index=True,
    )

    target_successors: Mapped[int] = mapped_column(
        default=2,
        nullable=False,
    )

    notes: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    status: Mapped[str] = mapped_column(
        String(30),
        default="active",
        nullable=False,
        index=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


class HRTalentProfile(Base):
    __tablename__ = "hr_talent_profiles"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    employee_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("hr_employees.id"),
        nullable=False,
        unique=True,
        index=True,
    )

    potential_score: Mapped[float | None] = mapped_column(
        Numeric(5, 2),
        nullable=True,
    )

    potential_level: Mapped[str | None] = mapped_column(
        String(30),
        nullable=True,
        index=True,
    )

    high_potential: Mapped[bool] = mapped_column(
        default=False,
        nullable=False,
        index=True,
    )

    talent_pool: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
        index=True,
    )

    retention_risk: Mapped[str] = mapped_column(
        String(30),
        default="low",
        nullable=False,
        index=True,
    )

    mobility: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
    )

    career_aspiration: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    strengths: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    development_gaps: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    development_actions: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    assessed_by: Mapped[str | None] = mapped_column(
        String(150),
        nullable=True,
    )

    assessment_date: Mapped[date | None] = mapped_column(
        Date,
        nullable=True,
        index=True,
    )

    notes: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )


class HRSuccessionCandidate(Base):
    __tablename__ = "hr_succession_candidates"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    critical_position_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("hr_critical_positions.id"),
        nullable=False,
        index=True,
    )

    employee_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("hr_employees.id"),
        nullable=False,
        index=True,
    )

    performance_plan_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("hr_performance_plans.id"),
        nullable=True,
        index=True,
    )

    performance_score: Mapped[float | None] = mapped_column(
        Numeric(5, 2),
        nullable=True,
    )

    potential_score: Mapped[float | None] = mapped_column(
        Numeric(5, 2),
        nullable=True,
    )

    nine_box: Mapped[str | None] = mapped_column(
        String(60),
        nullable=True,
        index=True,
    )

    readiness: Mapped[str] = mapped_column(
        String(30),
        default="3_plus_years",
        nullable=False,
        index=True,
    )

    candidate_rank: Mapped[int | None] = mapped_column(
        nullable=True,
        index=True,
    )

    nomination_reason: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    development_gaps: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    development_actions: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    status: Mapped[str] = mapped_column(
        String(30),
        default="active",
        nullable=False,
        index=True,
    )

    nominated_by: Mapped[str | None] = mapped_column(
        String(150),
        nullable=True,
    )

    nomination_date: Mapped[date] = mapped_column(
        Date,
        default=date.today,
        nullable=False,
        index=True,
    )

    last_review_date: Mapped[date | None] = mapped_column(
        Date,
        nullable=True,
    )

    notes: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )



# ============================================================
# HR - Workforce Planning & Manpower
# Reuses HRDepartment + HRPosition.
# ============================================================

class HRWorkforcePlan(Base):
    __tablename__ = "hr_workforce_plans"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    year: Mapped[int] = mapped_column(
        nullable=False,
        index=True,
    )

    name: Mapped[str] = mapped_column(
        String(200),
        nullable=False,
    )

    version: Mapped[int] = mapped_column(
        default=1,
        nullable=False,
    )

    status: Mapped[str] = mapped_column(
        String(30),
        default="draft",
        nullable=False,
        index=True,
    )

    created_by: Mapped[str | None] = mapped_column(
        String(150),
        nullable=True,
    )

    submitted_by: Mapped[str | None] = mapped_column(
        String(150),
        nullable=True,
    )

    submitted_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    approved_by: Mapped[str | None] = mapped_column(
        String(150),
        nullable=True,
    )

    approved_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    frozen_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    notes: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


class HRWorkforcePlanLine(Base):
    __tablename__ = "hr_workforce_plan_lines"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    plan_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("hr_workforce_plans.id"),
        nullable=False,
        index=True,
    )

    department_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("hr_departments.id"),
        nullable=False,
        index=True,
    )

    # Existing position from Position Control.
    # Nullable when requesting a completely new position.
    position_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("hr_positions.id"),
        nullable=True,
        index=True,
    )

    is_new_position: Mapped[bool] = mapped_column(
        default=False,
        nullable=False,
        index=True,
    )

    proposed_position_code: Mapped[str | None] = mapped_column(
        String(60),
        nullable=True,
    )

    proposed_position_title: Mapped[str | None] = mapped_column(
        String(250),
        nullable=True,
    )

    proposed_grade: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
    )

    proposed_employment_type: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    # replacement / new_hire / expansion
    hire_type: Mapped[str] = mapped_column(
        String(30),
        default="new_hire",
        nullable=False,
        index=True,
    )

    replacement_employee_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("hr_employees.id"),
        nullable=True,
        index=True,
    )

    # Snapshot when the plan line is created/updated.
    current_headcount_snapshot: Mapped[int] = mapped_column(
        default=0,
        nullable=False,
    )

    approved_headcount: Mapped[int] = mapped_column(
        default=0,
        nullable=False,
    )

    planned_hires: Mapped[int] = mapped_column(
        default=0,
        nullable=False,
    )

    planned_exits: Mapped[int] = mapped_column(
        default=0,
        nullable=False,
    )

    priority: Mapped[str] = mapped_column(
        String(30),
        default="medium",
        nullable=False,
        index=True,
    )

    target_hiring_date: Mapped[date | None] = mapped_column(
        Date,
        nullable=True,
        index=True,
    )

    # Salary snapshots preserve the approved planning assumptions
    # even if Position Control salary ranges change later.
    min_salary_snapshot: Mapped[float] = mapped_column(
        Numeric(14, 2),
        default=0,
        nullable=False,
    )

    mid_salary_snapshot: Mapped[float] = mapped_column(
        Numeric(14, 2),
        default=0,
        nullable=False,
    )

    max_salary_snapshot: Mapped[float] = mapped_column(
        Numeric(14, 2),
        default=0,
        nullable=False,
    )

    budget_scenario: Mapped[str] = mapped_column(
        String(20),
        default="mid",
        nullable=False,
        index=True,
    )

    budgeted_monthly_salary: Mapped[float] = mapped_column(
        Numeric(14, 2),
        default=0,
        nullable=False,
    )

    budgeted_annual_salary: Mapped[float] = mapped_column(
        Numeric(16, 2),
        default=0,
        nullable=False,
    )

    justification: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    notes: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    status: Mapped[str] = mapped_column(
        String(30),
        default="active",
        nullable=False,
        index=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )



# ============================================================
# HR - Policies & Compliance
# ============================================================

class HRPolicy(Base):
    __tablename__ = "hr_policies"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    code: Mapped[str] = mapped_column(
        String(60),
        nullable=False,
        unique=True,
        index=True,
    )

    title_ar: Mapped[str] = mapped_column(
        String(300),
        nullable=False,
    )

    title_en: Mapped[str | None] = mapped_column(
        String(300),
        nullable=True,
    )

    category: Mapped[str] = mapped_column(
        String(100),
        default="hr_policy",
        nullable=False,
        index=True,
    )

    scope: Mapped[str] = mapped_column(
        String(100),
        default="all_employees",
        nullable=False,
        index=True,
    )

    policy_owner: Mapped[str | None] = mapped_column(
        String(150),
        nullable=True,
        index=True,
    )

    status: Mapped[str] = mapped_column(
        String(30),
        default="active",
        nullable=False,
        index=True,
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    notes: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


class HRPolicyVersion(Base):
    __tablename__ = "hr_policy_versions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    policy_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("hr_policies.id"),
        nullable=False,
        index=True,
    )

    version_number: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        index=True,
    )

    status: Mapped[str] = mapped_column(
        String(30),
        default="draft",
        nullable=False,
        index=True,
    )

    is_current: Mapped[bool] = mapped_column(
        default=False,
        nullable=False,
        index=True,
    )

    effective_date: Mapped[date | None] = mapped_column(
        Date,
        nullable=True,
        index=True,
    )

    review_date: Mapped[date | None] = mapped_column(
        Date,
        nullable=True,
        index=True,
    )

    prepared_by: Mapped[str | None] = mapped_column(
        String(150),
        nullable=True,
    )

    reviewed_by: Mapped[str | None] = mapped_column(
        String(150),
        nullable=True,
    )

    approved_by: Mapped[str | None] = mapped_column(
        String(150),
        nullable=True,
    )

    approved_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    approval_notes: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    change_summary: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    # Plain text is stored to support future AI
    # comparison/conflict analysis.
    content_text: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    attachment_url: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


class HRPolicyConflict(Base):
    __tablename__ = "hr_policy_conflicts"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    source_version_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("hr_policy_versions.id"),
        nullable=False,
        index=True,
    )

    conflicting_version_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("hr_policy_versions.id"),
        nullable=False,
        index=True,
    )

    conflict_type: Mapped[str] = mapped_column(
        String(80),
        default="content_conflict",
        nullable=False,
        index=True,
    )

    severity: Mapped[str] = mapped_column(
        String(30),
        default="medium",
        nullable=False,
        index=True,
    )

    status: Mapped[str] = mapped_column(
        String(30),
        default="open",
        nullable=False,
        index=True,
    )

    description: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    detected_by: Mapped[str] = mapped_column(
        String(50),
        default="manual",
        nullable=False,
        index=True,
    )

    resolution: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    resolved_by: Mapped[str | None] = mapped_column(
        String(150),
        nullable=True,
    )

    resolved_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


class HRComplianceChecklist(Base):
    __tablename__ = "hr_compliance_checklists"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    code: Mapped[str] = mapped_column(
        String(60),
        nullable=False,
        unique=True,
        index=True,
    )

    title: Mapped[str] = mapped_column(
        String(250),
        nullable=False,
    )

    category: Mapped[str] = mapped_column(
        String(100),
        default="hr_compliance",
        nullable=False,
        index=True,
    )

    frequency: Mapped[str] = mapped_column(
        String(50),
        default="annual",
        nullable=False,
        index=True,
    )

    responsible_owner: Mapped[str | None] = mapped_column(
        String(150),
        nullable=True,
        index=True,
    )

    due_date: Mapped[date | None] = mapped_column(
        Date,
        nullable=True,
        index=True,
    )

    status: Mapped[str] = mapped_column(
        String(30),
        default="open",
        nullable=False,
        index=True,
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    notes: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


class HRComplianceChecklistItem(Base):
    __tablename__ = "hr_compliance_checklist_items"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    checklist_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("hr_compliance_checklists.id"),
        nullable=False,
        index=True,
    )

    item_order: Mapped[int] = mapped_column(
        default=1,
        nullable=False,
    )

    title: Mapped[str] = mapped_column(
        String(300),
        nullable=False,
    )

    requirement_reference: Mapped[str | None] = mapped_column(
        String(300),
        nullable=True,
    )

    responsible_owner: Mapped[str | None] = mapped_column(
        String(150),
        nullable=True,
    )

    due_date: Mapped[date | None] = mapped_column(
        Date,
        nullable=True,
        index=True,
    )

    status: Mapped[str] = mapped_column(
        String(30),
        default="pending",
        nullable=False,
        index=True,
    )

    evidence_url: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
    )

    evidence_notes: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    completed_by: Mapped[str | None] = mapped_column(
        String(150),
        nullable=True,
    )

    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )



# ============================================================
# HR - Confidential Employee Notes
# ============================================================

class HRConfidentialNote(Base):
    __tablename__ = "hr_confidential_notes"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    employee_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("hr_employees.id"),
        nullable=False,
        index=True,
    )

    note_type: Mapped[str] = mapped_column(
        String(80),
        default="general",
        nullable=False,
        index=True,
    )

    confidentiality_level: Mapped[str] = mapped_column(
        String(30),
        default="confidential",
        nullable=False,
        index=True,
    )

    subject: Mapped[str] = mapped_column(
        String(300),
        nullable=False,
    )

    content: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    authored_by: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
        index=True,
    )

    event_date: Mapped[date | None] = mapped_column(
        Date,
        nullable=True,
        index=True,
    )

    follow_up_date: Mapped[date | None] = mapped_column(
        Date,
        nullable=True,
        index=True,
    )

    follow_up_status: Mapped[str] = mapped_column(
        String(30),
        default="none",
        nullable=False,
        index=True,
    )

    tags: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    source_reference: Mapped[str | None] = mapped_column(
        String(300),
        nullable=True,
    )

    status: Mapped[str] = mapped_column(
        String(30),
        default="active",
        nullable=False,
        index=True,
    )

    archived_by: Mapped[str | None] = mapped_column(
        String(150),
        nullable=True,
    )

    archived_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    archive_reason: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )



# ============================================================
# HR - Calendar
# ============================================================

class HRCalendarEvent(Base):
    __tablename__ = "hr_calendar_events"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    code: Mapped[str | None] = mapped_column(
        String(60),
        nullable=True,
        index=True,
    )

    title_en: Mapped[str] = mapped_column(
        String(300),
        nullable=False,
    )

    title_ar: Mapped[str | None] = mapped_column(
        String(300),
        nullable=True,
    )

    category: Mapped[str] = mapped_column(
        String(80),
        default="general",
        nullable=False,
        index=True,
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    responsible_owner: Mapped[str | None] = mapped_column(
        String(150),
        nullable=True,
        index=True,
    )

    priority: Mapped[str] = mapped_column(
        String(30),
        default="medium",
        nullable=False,
        index=True,
    )

    start_date: Mapped[date] = mapped_column(
        Date,
        nullable=False,
        index=True,
    )

    end_date: Mapped[date | None] = mapped_column(
        Date,
        nullable=True,
        index=True,
    )

    all_day: Mapped[bool] = mapped_column(
        default=True,
        nullable=False,
    )

    recurrence_type: Mapped[str] = mapped_column(
        String(30),
        default="none",
        nullable=False,
        index=True,
    )

    recurrence_interval: Mapped[int] = mapped_column(
        default=1,
        nullable=False,
    )

    recurrence_end_date: Mapped[date | None] = mapped_column(
        Date,
        nullable=True,
        index=True,
    )

    alert_days_before: Mapped[int] = mapped_column(
        default=7,
        nullable=False,
    )

    status: Mapped[str] = mapped_column(
        String(30),
        default="active",
        nullable=False,
        index=True,
    )

    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    completed_by: Mapped[str | None] = mapped_column(
        String(150),
        nullable=True,
    )

    source_type: Mapped[str] = mapped_column(
        String(80),
        default="manual",
        nullable=False,
        index=True,
    )

    source_reference: Mapped[str | None] = mapped_column(
        String(300),
        nullable=True,
    )

    notes: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    created_by: Mapped[str | None] = mapped_column(
        String(150),
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )



# ============================================================
# HR - Unified Attachments
# ============================================================

class HRAttachment(Base):
    __tablename__ = "hr_attachments"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    # HR module owning the attachment:
    # employee, recruitment, payroll, employee_payments,
    # employee_relations, government_compliance,
    # policies_compliance, training, performance, etc.
    module: Mapped[str] = mapped_column(
        String(80),
        nullable=False,
        index=True,
    )

    # Logical entity type inside the module:
    # employee, candidate, payment_request, relation_case,
    # policy_version, checklist_item, compliance_record, etc.
    entity_type: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        index=True,
    )

    # Generic UUID of the business record this file belongs to.
    entity_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        nullable=False,
        index=True,
    )

    # Optional direct employee relationship for faster
    # employee-document retrieval across HR modules.
    employee_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("hr_employees.id"),
        nullable=True,
        index=True,
    )

    document_type: Mapped[str] = mapped_column(
        String(100),
        default="attachment",
        nullable=False,
        index=True,
    )

    title: Mapped[str | None] = mapped_column(
        String(300),
        nullable=True,
    )

    original_file_name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    stored_file_name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        unique=True,
        index=True,
    )

    storage_key: Mapped[str] = mapped_column(
        String(500),
        nullable=False,
        unique=True,
    )

    mime_type: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
    )

    file_extension: Mapped[str | None] = mapped_column(
        String(20),
        nullable=True,
    )

    file_size_bytes: Mapped[int] = mapped_column(
        nullable=False,
    )

    sha256: Mapped[str] = mapped_column(
        String(64),
        nullable=False,
        index=True,
    )

    confidentiality_level: Mapped[str] = mapped_column(
        String(30),
        default="confidential",
        nullable=False,
        index=True,
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    uploaded_by: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
        index=True,
    )

    status: Mapped[str] = mapped_column(
        String(30),
        default="active",
        nullable=False,
        index=True,
    )

    archived_by: Mapped[str | None] = mapped_column(
        String(150),
        nullable=True,
    )

    archived_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    archive_reason: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )



# ============================================================
# Shared - Policy Impact & Enforcement Engine
# ============================================================

class PolicyImpactAssessment(Base):
    __tablename__ = "policy_impact_assessments"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    policy_version_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("hr_policy_versions.id"),
        nullable=False,
        index=True,
    )

    trigger_source: Mapped[str] = mapped_column(
        String(50),
        default="policy_approval",
        nullable=False,
        index=True,
    )

    status: Mapped[str] = mapped_column(
        String(30),
        default="draft",
        nullable=False,
        index=True,
    )

    overall_risk: Mapped[str] = mapped_column(
        String(20),
        default="medium",
        nullable=False,
        index=True,
    )

    analyzed_by: Mapped[str | None] = mapped_column(
        String(150),
        nullable=True,
    )

    analysis_summary: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    requires_user_approval: Mapped[bool] = mapped_column(
        default=True,
        nullable=False,
    )

    approval_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("approvals.id"),
        nullable=True,
        index=True,
    )

    effective_date: Mapped[date | None] = mapped_column(
        Date,
        nullable=True,
        index=True,
    )

    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


class PolicyImpactItem(Base):
    __tablename__ = "policy_impact_items"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    assessment_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("policy_impact_assessments.id"),
        nullable=False,
        index=True,
    )

    # Examples:
    # agent_behavior
    # configuration
    # application_code
    # workflow
    # database
    # calculator
    # reporting
    # integration
    # no_system_impact
    impact_type: Mapped[str] = mapped_column(
        String(60),
        nullable=False,
        index=True,
    )

    domain: Mapped[str] = mapped_column(
        String(80),
        default="hr",
        nullable=False,
        index=True,
    )

    affected_module: Mapped[str | None] = mapped_column(
        String(120),
        nullable=True,
        index=True,
    )

    affected_component: Mapped[str | None] = mapped_column(
        String(200),
        nullable=True,
    )

    change_type: Mapped[str] = mapped_column(
        String(30),
        default="modify",
        nullable=False,
        index=True,
    )

    description: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    recommended_action: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    severity: Mapped[str] = mapped_column(
        String(20),
        default="medium",
        nullable=False,
        index=True,
    )

    # automatic
    # configuration
    # it_task
    # manual_review
    # documentation_only
    enforcement_mode: Mapped[str] = mapped_column(
        String(40),
        default="manual_review",
        nullable=False,
        index=True,
    )

    auto_applicable: Mapped[bool] = mapped_column(
        default=False,
        nullable=False,
    )

    current_value: Mapped[dict] = mapped_column(
        JSONB,
        default=dict,
        nullable=False,
    )

    proposed_value: Mapped[dict] = mapped_column(
        JSONB,
        default=dict,
        nullable=False,
    )

    acceptance_criteria: Mapped[dict] = mapped_column(
        JSONB,
        default=dict,
        nullable=False,
    )

    status: Mapped[str] = mapped_column(
        String(30),
        default="pending",
        nullable=False,
        index=True,
    )

    task_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("tasks.id"),
        nullable=True,
        index=True,
    )

    approval_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("approvals.id"),
        nullable=True,
        index=True,
    )

    effective_date: Mapped[date | None] = mapped_column(
        Date,
        nullable=True,
        index=True,
    )

    applied_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    applied_by: Mapped[str | None] = mapped_column(
        String(150),
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


class PolicyEnforcementRule(Base):
    __tablename__ = "policy_enforcement_rules"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    policy_version_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("hr_policy_versions.id"),
        nullable=False,
        index=True,
    )

    impact_item_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("policy_impact_items.id"),
        nullable=True,
        index=True,
    )

    # instruction
    # configuration
    # validation
    # calculation
    # workflow
    rule_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        index=True,
    )

    rule_key: Mapped[str] = mapped_column(
        String(180),
        nullable=False,
        index=True,
    )

    domain: Mapped[str] = mapped_column(
        String(80),
        default="hr",
        nullable=False,
        index=True,
    )

    target_agent_slug: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
        index=True,
    )

    target_module: Mapped[str | None] = mapped_column(
        String(120),
        nullable=True,
        index=True,
    )

    rule_value: Mapped[dict] = mapped_column(
        JSONB,
        default=dict,
        nullable=False,
    )

    source_clause: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    status: Mapped[str] = mapped_column(
        String(30),
        default="pending",
        nullable=False,
        index=True,
    )

    effective_from: Mapped[date | None] = mapped_column(
        Date,
        nullable=True,
        index=True,
    )

    effective_to: Mapped[date | None] = mapped_column(
        Date,
        nullable=True,
        index=True,
    )

    activated_by: Mapped[str | None] = mapped_column(
        String(150),
        nullable=True,
    )

    activated_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    superseded_by_rule_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("policy_enforcement_rules.id"),
        nullable=True,
        index=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


class PolicySystemMismatch(Base):
    __tablename__ = "policy_system_mismatches"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    policy_version_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("hr_policy_versions.id"),
        nullable=False,
        index=True,
    )

    impact_item_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("policy_impact_items.id"),
        nullable=True,
        index=True,
    )

    task_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("tasks.id"),
        nullable=True,
        index=True,
    )

    mismatch_type: Mapped[str] = mapped_column(
        String(80),
        default="policy_system_mismatch",
        nullable=False,
        index=True,
    )

    domain: Mapped[str] = mapped_column(
        String(80),
        default="hr",
        nullable=False,
        index=True,
    )

    affected_module: Mapped[str | None] = mapped_column(
        String(120),
        nullable=True,
        index=True,
    )

    affected_component: Mapped[str | None] = mapped_column(
        String(200),
        nullable=True,
    )

    description: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    expected_behavior: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    current_behavior: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    severity: Mapped[str] = mapped_column(
        String(20),
        default="high",
        nullable=False,
        index=True,
    )

    status: Mapped[str] = mapped_column(
        String(30),
        default="open",
        nullable=False,
        index=True,
    )

    detected_by: Mapped[str] = mapped_column(
        String(150),
        default="agent:hr",
        nullable=False,
    )

    detected_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    effective_date: Mapped[date | None] = mapped_column(
        Date,
        nullable=True,
        index=True,
    )

    resolution_notes: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    resolved_by: Mapped[str | None] = mapped_column(
        String(150),
        nullable=True,
    )

    resolved_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )



# ============================================================
# Shared - Policy Technical Verification
# ============================================================

class PolicyTechnicalVerification(Base):
    __tablename__ = "policy_technical_verifications"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    mismatch_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("policy_system_mismatches.id"),
        nullable=False,
        index=True,
    )

    task_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("tasks.id"),
        nullable=False,
        index=True,
    )

    impact_item_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("policy_impact_items.id"),
        nullable=True,
        index=True,
    )

    assessment_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("policy_impact_assessments.id"),
        nullable=True,
        index=True,
    )

    policy_version_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("hr_policy_versions.id"),
        nullable=False,
        index=True,
    )

    # passed
    # failed
    # awaiting_approval
    # approved
    # rejected
    status: Mapped[str] = mapped_column(
        String(30),
        default="awaiting_verification",
        nullable=False,
        index=True,
    )

    verification_method: Mapped[str] = mapped_column(
        String(80),
        default="manual_test",
        nullable=False,
        index=True,
    )

    test_summary: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    test_results: Mapped[dict] = mapped_column(
        JSONB,
        default=dict,
        nullable=False,
    )

    evidence: Mapped[dict] = mapped_column(
        JSONB,
        default=dict,
        nullable=False,
    )

    verified_by: Mapped[str] = mapped_column(
        String(150),
        default="agent:it",
        nullable=False,
    )

    verified_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    approval_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("approvals.id"),
        nullable=True,
        index=True,
    )

    final_decision_by: Mapped[str | None] = mapped_column(
        String(150),
        nullable=True,
    )

    final_decision_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    final_decision_notes: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


# ============================================================
# Shared - Policy Change Decision Review
# ============================================================

class PolicyChangeDecision(Base):
    __tablename__ = "policy_change_decisions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    impact_item_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("policy_impact_items.id"),
        nullable=False,
        unique=True,
        index=True,
    )

    assessment_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("policy_impact_assessments.id"),
        nullable=False,
        index=True,
    )

    policy_version_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("hr_policy_versions.id"),
        nullable=False,
        index=True,
    )

    # pending
    # approve_add
    # approve_modify
    # approve_remove
    # keep_existing
    # ignore
    decision: Mapped[str] = mapped_column(
        String(40),
        default="pending",
        nullable=False,
        index=True,
    )

    decision_notes: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    # Stores the normalized execution proposal produced by AI.
    # Nothing in this payload is executed until the user makes
    # an explicit change decision.
    execution_payload: Mapped[dict] = mapped_column(
        JSONB,
        default=dict,
        nullable=False,
    )

    decided_by: Mapped[str | None] = mapped_column(
        String(150),
        nullable=True,
    )

    decided_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    # pending
    # accepted
    # rejected
    # executed
    status: Mapped[str] = mapped_column(
        String(30),
        default="pending",
        nullable=False,
        index=True,
    )

    executed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

# ============================================================
# Shared - Document Intelligence & Approval Pipeline
# ============================================================
import uuid as _di_uuid

from sqlalchemy import (
    DateTime as _DIDateTime,
    ForeignKey as _DIForeignKey,
    Integer as _DIInteger,
    String as _DIString,
    Text as _DIText,
    func as _di_func,
)
from sqlalchemy.dialects.postgresql import (
    JSONB as _DIJSONB,
    UUID as _DIUUID,
)
from sqlalchemy.orm import (
    Mapped as _DIMapped,
    mapped_column as _di_mapped_column,
)


class DocumentIntelligenceJob(Base):
    __tablename__ = "document_intelligence_jobs"

    id: _DIMapped[_di_uuid.UUID] = _di_mapped_column(
        _DIUUID(as_uuid=True),
        primary_key=True,
        default=_di_uuid.uuid4,
    )
    source_attachment_id: _DIMapped[_di_uuid.UUID | None] = _di_mapped_column(
        _DIUUID(as_uuid=True),
        _DIForeignKey("hr_attachments.id"),
        nullable=True,
        index=True,
    )
    approval_id: _DIMapped[_di_uuid.UUID | None] = _di_mapped_column(
        _DIUUID(as_uuid=True),
        _DIForeignKey("approvals.id"),
        nullable=True,
        index=True,
    )
    requested_by: _DIMapped[str] = _di_mapped_column(
        _DIString(150),
        nullable=False,
        index=True,
    )
    target_domain: _DIMapped[str] = _di_mapped_column(
        _DIString(80),
        default="shared",
        nullable=False,
        index=True,
    )
    target_module: _DIMapped[str] = _di_mapped_column(
        _DIString(100),
        default="document_intelligence",
        nullable=False,
        index=True,
    )
    target_adapter: _DIMapped[str] = _di_mapped_column(
        _DIString(100),
        nullable=False,
        index=True,
    )
    document_type: _DIMapped[str] = _di_mapped_column(
        _DIString(100),
        default="data_import",
        nullable=False,
        index=True,
    )
    original_file_name: _DIMapped[str] = _di_mapped_column(
        _DIString(255),
        nullable=False,
    )
    file_extension: _DIMapped[str | None] = _di_mapped_column(
        _DIString(20),
        nullable=True,
    )
    status: _DIMapped[str] = _di_mapped_column(
        _DIString(40),
        default="uploaded",
        nullable=False,
        index=True,
    )
    extraction_method: _DIMapped[str | None] = _di_mapped_column(
        _DIString(80),
        nullable=True,
    )
    source_metadata: _DIMapped[dict] = _di_mapped_column(
        _DIJSONB,
        default=dict,
        nullable=False,
    )
    extracted_text: _DIMapped[str | None] = _di_mapped_column(
        _DIText,
        nullable=True,
    )
    extracted_data: _DIMapped[dict] = _di_mapped_column(
        _DIJSONB,
        default=dict,
        nullable=False,
    )
    validation_summary: _DIMapped[dict] = _di_mapped_column(
        _DIJSONB,
        default=dict,
        nullable=False,
    )
    commit_result: _DIMapped[dict] = _di_mapped_column(
        _DIJSONB,
        default=dict,
        nullable=False,
    )
    error_message: _DIMapped[str | None] = _di_mapped_column(
        _DIText,
        nullable=True,
    )
    approved_at: _DIMapped[object | None] = _di_mapped_column(
        _DIDateTime(timezone=True),
        nullable=True,
    )
    committed_at: _DIMapped[object | None] = _di_mapped_column(
        _DIDateTime(timezone=True),
        nullable=True,
    )
    created_at: _DIMapped[object] = _di_mapped_column(
        _DIDateTime(timezone=True),
        server_default=_di_func.now(),
        nullable=False,
    )
    updated_at: _DIMapped[object] = _di_mapped_column(
        _DIDateTime(timezone=True),
        server_default=_di_func.now(),
        onupdate=_di_func.now(),
        nullable=False,
    )


class DocumentIntelligenceDraftRow(Base):
    __tablename__ = "document_intelligence_draft_rows"

    id: _DIMapped[_di_uuid.UUID] = _di_mapped_column(
        _DIUUID(as_uuid=True),
        primary_key=True,
        default=_di_uuid.uuid4,
    )
    job_id: _DIMapped[_di_uuid.UUID] = _di_mapped_column(
        _DIUUID(as_uuid=True),
        _DIForeignKey(
            "document_intelligence_jobs.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )
    source_row_number: _DIMapped[int] = _di_mapped_column(
        _DIInteger,
        nullable=False,
        index=True,
    )
    entity_type: _DIMapped[str] = _di_mapped_column(
        _DIString(100),
        nullable=False,
        index=True,
    )
    external_key: _DIMapped[str | None] = _di_mapped_column(
        _DIString(255),
        nullable=True,
        index=True,
    )
    action: _DIMapped[str] = _di_mapped_column(
        _DIString(30),
        default="create",
        nullable=False,
        index=True,
    )
    source_data: _DIMapped[dict] = _di_mapped_column(
        _DIJSONB,
        default=dict,
        nullable=False,
    )
    mapped_data: _DIMapped[dict] = _di_mapped_column(
        _DIJSONB,
        default=dict,
        nullable=False,
    )
    validation_status: _DIMapped[str] = _di_mapped_column(
        _DIString(30),
        default="pending",
        nullable=False,
        index=True,
    )
    validation_issues: _DIMapped[dict] = _di_mapped_column(
        _DIJSONB,
        default=dict,
        nullable=False,
    )
    review_status: _DIMapped[str] = _di_mapped_column(
        _DIString(30),
        default="pending",
        nullable=False,
        index=True,
    )
    review_notes: _DIMapped[str | None] = _di_mapped_column(
        _DIText,
        nullable=True,
    )
    reviewed_data: _DIMapped[dict] = _di_mapped_column(
        _DIJSONB,
        default=dict,
        nullable=False,
    )
    committed_entity_id: _DIMapped[_di_uuid.UUID | None] = _di_mapped_column(
        _DIUUID(as_uuid=True),
        nullable=True,
        index=True,
    )
    created_at: _DIMapped[object] = _di_mapped_column(
        _DIDateTime(timezone=True),
        server_default=_di_func.now(),
        nullable=False,
    )
    updated_at: _DIMapped[object] = _di_mapped_column(
        _DIDateTime(timezone=True),
        server_default=_di_func.now(),
        onupdate=_di_func.now(),
        nullable=False,
    )

# ============================================================
# Finance - Core Accounting
# Chart of Accounts, Periods, Journals and Double-Entry Ledger
# ============================================================
import uuid as _fin_uuid

from sqlalchemy import (
    Boolean as _FinBoolean,
    Date as _FinDate,
    DateTime as _FinDateTime,
    ForeignKey as _FinForeignKey,
    Integer as _FinInteger,
    Numeric as _FinNumeric,
    String as _FinString,
    Text as _FinText,
    func as _fin_func,
)
from sqlalchemy.dialects.postgresql import (
    JSONB as _FinJSONB,
    UUID as _FinUUID,
)
from sqlalchemy.orm import (
    Mapped as _FinMapped,
    mapped_column as _fin_mapped_column,
)


class FinanceAccount(Base):
    __tablename__ = "finance_accounts"

    id: _FinMapped[_fin_uuid.UUID] = _fin_mapped_column(
        _FinUUID(as_uuid=True),
        primary_key=True,
        default=_fin_uuid.uuid4,
    )
    code: _FinMapped[str] = _fin_mapped_column(
        _FinString(50),
        unique=True,
        nullable=False,
        index=True,
    )
    name_ar: _FinMapped[str] = _fin_mapped_column(
        _FinString(255),
        nullable=False,
    )
    name_en: _FinMapped[str | None] = _fin_mapped_column(
        _FinString(255),
        nullable=True,
    )
    account_type: _FinMapped[str] = _fin_mapped_column(
        _FinString(30),
        nullable=False,
        index=True,
    )
    normal_balance: _FinMapped[str] = _fin_mapped_column(
        _FinString(10),
        nullable=False,
        index=True,
    )
    parent_id: _FinMapped[_fin_uuid.UUID | None] = _fin_mapped_column(
        _FinUUID(as_uuid=True),
        _FinForeignKey("finance_accounts.id"),
        nullable=True,
        index=True,
    )
    currency: _FinMapped[str] = _fin_mapped_column(
        _FinString(10),
        default="SAR",
        nullable=False,
    )
    allow_posting: _FinMapped[bool] = _fin_mapped_column(
        _FinBoolean,
        default=True,
        nullable=False,
        index=True,
    )
    is_active: _FinMapped[bool] = _fin_mapped_column(
        _FinBoolean,
        default=True,
        nullable=False,
        index=True,
    )
    system_code: _FinMapped[str | None] = _fin_mapped_column(
        _FinString(80),
        unique=True,
        nullable=True,
        index=True,
    )
    account_metadata: _FinMapped[dict] = _fin_mapped_column(
        _FinJSONB,
        default=dict,
        nullable=False,
    )
    created_at: _FinMapped[object] = _fin_mapped_column(
        _FinDateTime(timezone=True),
        server_default=_fin_func.now(),
        nullable=False,
    )
    updated_at: _FinMapped[object] = _fin_mapped_column(
        _FinDateTime(timezone=True),
        server_default=_fin_func.now(),
        onupdate=_fin_func.now(),
        nullable=False,
    )


class FinanceAccountingPeriod(Base):
    __tablename__ = "finance_accounting_periods"

    id: _FinMapped[_fin_uuid.UUID] = _fin_mapped_column(
        _FinUUID(as_uuid=True),
        primary_key=True,
        default=_fin_uuid.uuid4,
    )
    period_key: _FinMapped[str] = _fin_mapped_column(
        _FinString(20),
        unique=True,
        nullable=False,
        index=True,
    )
    year: _FinMapped[int] = _fin_mapped_column(
        _FinInteger,
        nullable=False,
        index=True,
    )
    month: _FinMapped[int] = _fin_mapped_column(
        _FinInteger,
        nullable=False,
        index=True,
    )
    start_date: _FinMapped[object] = _fin_mapped_column(
        _FinDate,
        nullable=False,
        index=True,
    )
    end_date: _FinMapped[object] = _fin_mapped_column(
        _FinDate,
        nullable=False,
        index=True,
    )
    status: _FinMapped[str] = _fin_mapped_column(
        _FinString(30),
        default="open",
        nullable=False,
        index=True,
    )
    close_approval_id: _FinMapped[_fin_uuid.UUID | None] = _fin_mapped_column(
        _FinUUID(as_uuid=True),
        _FinForeignKey("approvals.id"),
        nullable=True,
        index=True,
    )
    closed_by: _FinMapped[str | None] = _fin_mapped_column(
        _FinString(150),
        nullable=True,
    )
    closed_at: _FinMapped[object | None] = _fin_mapped_column(
        _FinDateTime(timezone=True),
        nullable=True,
    )
    notes: _FinMapped[str | None] = _fin_mapped_column(
        _FinText,
        nullable=True,
    )
    created_at: _FinMapped[object] = _fin_mapped_column(
        _FinDateTime(timezone=True),
        server_default=_fin_func.now(),
        nullable=False,
    )
    updated_at: _FinMapped[object] = _fin_mapped_column(
        _FinDateTime(timezone=True),
        server_default=_fin_func.now(),
        onupdate=_fin_func.now(),
        nullable=False,
    )


class FinanceJournalEntry(Base):
    __tablename__ = "finance_journal_entries"

    id: _FinMapped[_fin_uuid.UUID] = _fin_mapped_column(
        _FinUUID(as_uuid=True),
        primary_key=True,
        default=_fin_uuid.uuid4,
    )
    entry_number: _FinMapped[str] = _fin_mapped_column(
        _FinString(80),
        unique=True,
        nullable=False,
        index=True,
    )
    journal_date: _FinMapped[object] = _fin_mapped_column(
        _FinDate,
        nullable=False,
        index=True,
    )
    period_id: _FinMapped[_fin_uuid.UUID] = _fin_mapped_column(
        _FinUUID(as_uuid=True),
        _FinForeignKey("finance_accounting_periods.id"),
        nullable=False,
        index=True,
    )
    description: _FinMapped[str] = _fin_mapped_column(
        _FinText,
        nullable=False,
    )
    reference: _FinMapped[str | None] = _fin_mapped_column(
        _FinString(150),
        nullable=True,
        index=True,
    )
    source_type: _FinMapped[str] = _fin_mapped_column(
        _FinString(50),
        default="manual",
        nullable=False,
        index=True,
    )
    source_id: _FinMapped[str | None] = _fin_mapped_column(
        _FinString(150),
        nullable=True,
        index=True,
    )
    currency: _FinMapped[str] = _fin_mapped_column(
        _FinString(10),
        default="SAR",
        nullable=False,
    )
    status: _FinMapped[str] = _fin_mapped_column(
        _FinString(30),
        default="draft",
        nullable=False,
        index=True,
    )
    approval_id: _FinMapped[_fin_uuid.UUID | None] = _fin_mapped_column(
        _FinUUID(as_uuid=True),
        _FinForeignKey("approvals.id"),
        nullable=True,
        index=True,
    )
    created_by: _FinMapped[str] = _fin_mapped_column(
        _FinString(150),
        default="user",
        nullable=False,
        index=True,
    )
    submitted_at: _FinMapped[object | None] = _fin_mapped_column(
        _FinDateTime(timezone=True),
        nullable=True,
    )
    posted_at: _FinMapped[object | None] = _fin_mapped_column(
        _FinDateTime(timezone=True),
        nullable=True,
        index=True,
    )
    posted_by: _FinMapped[str | None] = _fin_mapped_column(
        _FinString(150),
        nullable=True,
    )
    reversal_of_id: _FinMapped[_fin_uuid.UUID | None] = _fin_mapped_column(
        _FinUUID(as_uuid=True),
        _FinForeignKey("finance_journal_entries.id"),
        nullable=True,
        index=True,
    )
    journal_metadata: _FinMapped[dict] = _fin_mapped_column(
        _FinJSONB,
        default=dict,
        nullable=False,
    )
    created_at: _FinMapped[object] = _fin_mapped_column(
        _FinDateTime(timezone=True),
        server_default=_fin_func.now(),
        nullable=False,
    )
    updated_at: _FinMapped[object] = _fin_mapped_column(
        _FinDateTime(timezone=True),
        server_default=_fin_func.now(),
        onupdate=_fin_func.now(),
        nullable=False,
    )


class FinanceJournalLine(Base):
    __tablename__ = "finance_journal_lines"

    id: _FinMapped[_fin_uuid.UUID] = _fin_mapped_column(
        _FinUUID(as_uuid=True),
        primary_key=True,
        default=_fin_uuid.uuid4,
    )
    journal_entry_id: _FinMapped[_fin_uuid.UUID] = _fin_mapped_column(
        _FinUUID(as_uuid=True),
        _FinForeignKey(
            "finance_journal_entries.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )
    line_number: _FinMapped[int] = _fin_mapped_column(
        _FinInteger,
        nullable=False,
    )
    account_id: _FinMapped[_fin_uuid.UUID] = _fin_mapped_column(
        _FinUUID(as_uuid=True),
        _FinForeignKey("finance_accounts.id"),
        nullable=False,
        index=True,
    )
    description: _FinMapped[str | None] = _fin_mapped_column(
        _FinText,
        nullable=True,
    )
    debit: _FinMapped[float] = _fin_mapped_column(
        _FinNumeric(18, 2),
        default=0,
        nullable=False,
    )
    credit: _FinMapped[float] = _fin_mapped_column(
        _FinNumeric(18, 2),
        default=0,
        nullable=False,
    )
    cost_center: _FinMapped[str | None] = _fin_mapped_column(
        _FinString(100),
        nullable=True,
        index=True,
    )
    department_code: _FinMapped[str | None] = _fin_mapped_column(
        _FinString(100),
        nullable=True,
        index=True,
    )
    line_metadata: _FinMapped[dict] = _fin_mapped_column(
        _FinJSONB,
        default=dict,
        nullable=False,
    )
    created_at: _FinMapped[object] = _fin_mapped_column(
        _FinDateTime(timezone=True),
        server_default=_fin_func.now(),
        nullable=False,
    )

# ============================================================
# Finance - AP / AR
# Vendors, Customers, Bills, Invoices, Payments and Receipts
# ============================================================
import uuid as _far_uuid

from sqlalchemy import (
    Boolean as _FarBoolean,
    Date as _FarDate,
    DateTime as _FarDateTime,
    ForeignKey as _FarForeignKey,
    Integer as _FarInteger,
    Numeric as _FarNumeric,
    String as _FarString,
    Text as _FarText,
    func as _far_func,
)
from sqlalchemy.dialects.postgresql import (
    JSONB as _FarJSONB,
    UUID as _FarUUID,
)
from sqlalchemy.orm import (
    Mapped as _FarMapped,
    mapped_column as _far_mapped_column,
)


class FinanceVendor(Base):
    __tablename__ = "finance_vendors"

    id: _FarMapped[_far_uuid.UUID] = _far_mapped_column(
        _FarUUID(as_uuid=True),
        primary_key=True,
        default=_far_uuid.uuid4,
    )
    code: _FarMapped[str] = _far_mapped_column(
        _FarString(50),
        unique=True,
        nullable=False,
        index=True,
    )
    name_ar: _FarMapped[str] = _far_mapped_column(
        _FarString(255),
        nullable=False,
    )
    name_en: _FarMapped[str | None] = _far_mapped_column(
        _FarString(255),
        nullable=True,
    )
    vat_number: _FarMapped[str | None] = _far_mapped_column(
        _FarString(50),
        nullable=True,
        index=True,
    )
    cr_number: _FarMapped[str | None] = _far_mapped_column(
        _FarString(80),
        nullable=True,
        index=True,
    )
    email: _FarMapped[str | None] = _far_mapped_column(
        _FarString(255),
        nullable=True,
    )
    phone: _FarMapped[str | None] = _far_mapped_column(
        _FarString(80),
        nullable=True,
    )
    iban: _FarMapped[str | None] = _far_mapped_column(
        _FarString(80),
        nullable=True,
    )
    payment_terms_days: _FarMapped[int] = _far_mapped_column(
        _FarInteger,
        default=30,
        nullable=False,
    )
    default_expense_account_id: _FarMapped[_far_uuid.UUID | None] = _far_mapped_column(
        _FarUUID(as_uuid=True),
        _FarForeignKey("finance_accounts.id"),
        nullable=True,
        index=True,
    )
    is_active: _FarMapped[bool] = _far_mapped_column(
        _FarBoolean,
        default=True,
        nullable=False,
        index=True,
    )
    vendor_metadata: _FarMapped[dict] = _far_mapped_column(
        _FarJSONB,
        default=dict,
        nullable=False,
    )
    created_at: _FarMapped[object] = _far_mapped_column(
        _FarDateTime(timezone=True),
        server_default=_far_func.now(),
        nullable=False,
    )
    updated_at: _FarMapped[object] = _far_mapped_column(
        _FarDateTime(timezone=True),
        server_default=_far_func.now(),
        onupdate=_far_func.now(),
        nullable=False,
    )


class FinanceCustomer(Base):
    __tablename__ = "finance_customers"

    id: _FarMapped[_far_uuid.UUID] = _far_mapped_column(
        _FarUUID(as_uuid=True),
        primary_key=True,
        default=_far_uuid.uuid4,
    )
    code: _FarMapped[str] = _far_mapped_column(
        _FarString(50),
        unique=True,
        nullable=False,
        index=True,
    )
    name_ar: _FarMapped[str] = _far_mapped_column(
        _FarString(255),
        nullable=False,
    )
    name_en: _FarMapped[str | None] = _far_mapped_column(
        _FarString(255),
        nullable=True,
    )
    vat_number: _FarMapped[str | None] = _far_mapped_column(
        _FarString(50),
        nullable=True,
        index=True,
    )
    cr_number: _FarMapped[str | None] = _far_mapped_column(
        _FarString(80),
        nullable=True,
        index=True,
    )
    email: _FarMapped[str | None] = _far_mapped_column(
        _FarString(255),
        nullable=True,
    )
    phone: _FarMapped[str | None] = _far_mapped_column(
        _FarString(80),
        nullable=True,
    )
    payment_terms_days: _FarMapped[int] = _far_mapped_column(
        _FarInteger,
        default=30,
        nullable=False,
    )
    credit_limit: _FarMapped[float] = _far_mapped_column(
        _FarNumeric(18, 2),
        default=0,
        nullable=False,
    )
    default_revenue_account_id: _FarMapped[_far_uuid.UUID | None] = _far_mapped_column(
        _FarUUID(as_uuid=True),
        _FarForeignKey("finance_accounts.id"),
        nullable=True,
        index=True,
    )
    is_active: _FarMapped[bool] = _far_mapped_column(
        _FarBoolean,
        default=True,
        nullable=False,
        index=True,
    )
    customer_metadata: _FarMapped[dict] = _far_mapped_column(
        _FarJSONB,
        default=dict,
        nullable=False,
    )
    created_at: _FarMapped[object] = _far_mapped_column(
        _FarDateTime(timezone=True),
        server_default=_far_func.now(),
        nullable=False,
    )
    updated_at: _FarMapped[object] = _far_mapped_column(
        _FarDateTime(timezone=True),
        server_default=_far_func.now(),
        onupdate=_far_func.now(),
        nullable=False,
    )


class FinanceBill(Base):
    __tablename__ = "finance_bills"

    id: _FarMapped[_far_uuid.UUID] = _far_mapped_column(
        _FarUUID(as_uuid=True),
        primary_key=True,
        default=_far_uuid.uuid4,
    )
    vendor_id: _FarMapped[_far_uuid.UUID] = _far_mapped_column(
        _FarUUID(as_uuid=True),
        _FarForeignKey("finance_vendors.id"),
        nullable=False,
        index=True,
    )
    bill_number: _FarMapped[str] = _far_mapped_column(
        _FarString(100),
        nullable=False,
        index=True,
    )
    bill_date: _FarMapped[object] = _far_mapped_column(
        _FarDate,
        nullable=False,
        index=True,
    )
    due_date: _FarMapped[object] = _far_mapped_column(
        _FarDate,
        nullable=False,
        index=True,
    )
    currency: _FarMapped[str] = _far_mapped_column(
        _FarString(10),
        default="SAR",
        nullable=False,
    )
    subtotal: _FarMapped[float] = _far_mapped_column(
        _FarNumeric(18, 2),
        default=0,
        nullable=False,
    )
    vat_amount: _FarMapped[float] = _far_mapped_column(
        _FarNumeric(18, 2),
        default=0,
        nullable=False,
    )
    total_amount: _FarMapped[float] = _far_mapped_column(
        _FarNumeric(18, 2),
        default=0,
        nullable=False,
    )
    amount_paid: _FarMapped[float] = _far_mapped_column(
        _FarNumeric(18, 2),
        default=0,
        nullable=False,
    )
    status: _FarMapped[str] = _far_mapped_column(
        _FarString(40),
        default="draft",
        nullable=False,
        index=True,
    )
    payable_account_id: _FarMapped[_far_uuid.UUID] = _far_mapped_column(
        _FarUUID(as_uuid=True),
        _FarForeignKey("finance_accounts.id"),
        nullable=False,
        index=True,
    )
    input_vat_account_id: _FarMapped[_far_uuid.UUID | None] = _far_mapped_column(
        _FarUUID(as_uuid=True),
        _FarForeignKey("finance_accounts.id"),
        nullable=True,
        index=True,
    )
    approval_id: _FarMapped[_far_uuid.UUID | None] = _far_mapped_column(
        _FarUUID(as_uuid=True),
        _FarForeignKey("approvals.id"),
        nullable=True,
        index=True,
    )
    journal_entry_id: _FarMapped[_far_uuid.UUID | None] = _far_mapped_column(
        _FarUUID(as_uuid=True),
        _FarForeignKey("finance_journal_entries.id"),
        nullable=True,
        index=True,
    )
    reference: _FarMapped[str | None] = _far_mapped_column(
        _FarString(150),
        nullable=True,
    )
    notes: _FarMapped[str | None] = _far_mapped_column(
        _FarText,
        nullable=True,
    )
    bill_metadata: _FarMapped[dict] = _far_mapped_column(
        _FarJSONB,
        default=dict,
        nullable=False,
    )
    created_by: _FarMapped[str] = _far_mapped_column(
        _FarString(150),
        default="user",
        nullable=False,
    )
    created_at: _FarMapped[object] = _far_mapped_column(
        _FarDateTime(timezone=True),
        server_default=_far_func.now(),
        nullable=False,
    )
    updated_at: _FarMapped[object] = _far_mapped_column(
        _FarDateTime(timezone=True),
        server_default=_far_func.now(),
        onupdate=_far_func.now(),
        nullable=False,
    )


class FinanceBillLine(Base):
    __tablename__ = "finance_bill_lines"

    id: _FarMapped[_far_uuid.UUID] = _far_mapped_column(
        _FarUUID(as_uuid=True),
        primary_key=True,
        default=_far_uuid.uuid4,
    )
    bill_id: _FarMapped[_far_uuid.UUID] = _far_mapped_column(
        _FarUUID(as_uuid=True),
        _FarForeignKey("finance_bills.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    line_number: _FarMapped[int] = _far_mapped_column(
        _FarInteger,
        nullable=False,
    )
    description: _FarMapped[str] = _far_mapped_column(
        _FarString(500),
        nullable=False,
    )
    expense_account_id: _FarMapped[_far_uuid.UUID] = _far_mapped_column(
        _FarUUID(as_uuid=True),
        _FarForeignKey("finance_accounts.id"),
        nullable=False,
        index=True,
    )
    quantity: _FarMapped[float] = _far_mapped_column(
        _FarNumeric(18, 4),
        default=1,
        nullable=False,
    )
    unit_price: _FarMapped[float] = _far_mapped_column(
        _FarNumeric(18, 4),
        default=0,
        nullable=False,
    )
    vat_rate: _FarMapped[float] = _far_mapped_column(
        _FarNumeric(7, 4),
        default=0,
        nullable=False,
    )
    net_amount: _FarMapped[float] = _far_mapped_column(
        _FarNumeric(18, 2),
        default=0,
        nullable=False,
    )
    vat_amount: _FarMapped[float] = _far_mapped_column(
        _FarNumeric(18, 2),
        default=0,
        nullable=False,
    )
    total_amount: _FarMapped[float] = _far_mapped_column(
        _FarNumeric(18, 2),
        default=0,
        nullable=False,
    )
    line_metadata: _FarMapped[dict] = _far_mapped_column(
        _FarJSONB,
        default=dict,
        nullable=False,
    )


class FinanceInvoice(Base):
    __tablename__ = "finance_invoices"

    id: _FarMapped[_far_uuid.UUID] = _far_mapped_column(
        _FarUUID(as_uuid=True),
        primary_key=True,
        default=_far_uuid.uuid4,
    )
    customer_id: _FarMapped[_far_uuid.UUID] = _far_mapped_column(
        _FarUUID(as_uuid=True),
        _FarForeignKey("finance_customers.id"),
        nullable=False,
        index=True,
    )
    invoice_number: _FarMapped[str] = _far_mapped_column(
        _FarString(100),
        unique=True,
        nullable=False,
        index=True,
    )
    invoice_date: _FarMapped[object] = _far_mapped_column(
        _FarDate,
        nullable=False,
        index=True,
    )
    due_date: _FarMapped[object] = _far_mapped_column(
        _FarDate,
        nullable=False,
        index=True,
    )
    currency: _FarMapped[str] = _far_mapped_column(
        _FarString(10),
        default="SAR",
        nullable=False,
    )
    subtotal: _FarMapped[float] = _far_mapped_column(
        _FarNumeric(18, 2),
        default=0,
        nullable=False,
    )
    vat_amount: _FarMapped[float] = _far_mapped_column(
        _FarNumeric(18, 2),
        default=0,
        nullable=False,
    )
    total_amount: _FarMapped[float] = _far_mapped_column(
        _FarNumeric(18, 2),
        default=0,
        nullable=False,
    )
    amount_collected: _FarMapped[float] = _far_mapped_column(
        _FarNumeric(18, 2),
        default=0,
        nullable=False,
    )
    status: _FarMapped[str] = _far_mapped_column(
        _FarString(40),
        default="draft",
        nullable=False,
        index=True,
    )
    receivable_account_id: _FarMapped[_far_uuid.UUID] = _far_mapped_column(
        _FarUUID(as_uuid=True),
        _FarForeignKey("finance_accounts.id"),
        nullable=False,
        index=True,
    )
    output_vat_account_id: _FarMapped[_far_uuid.UUID | None] = _far_mapped_column(
        _FarUUID(as_uuid=True),
        _FarForeignKey("finance_accounts.id"),
        nullable=True,
        index=True,
    )
    approval_id: _FarMapped[_far_uuid.UUID | None] = _far_mapped_column(
        _FarUUID(as_uuid=True),
        _FarForeignKey("approvals.id"),
        nullable=True,
        index=True,
    )
    journal_entry_id: _FarMapped[_far_uuid.UUID | None] = _far_mapped_column(
        _FarUUID(as_uuid=True),
        _FarForeignKey("finance_journal_entries.id"),
        nullable=True,
        index=True,
    )
    reference: _FarMapped[str | None] = _far_mapped_column(
        _FarString(150),
        nullable=True,
    )
    notes: _FarMapped[str | None] = _far_mapped_column(
        _FarText,
        nullable=True,
    )
    invoice_metadata: _FarMapped[dict] = _far_mapped_column(
        _FarJSONB,
        default=dict,
        nullable=False,
    )
    created_by: _FarMapped[str] = _far_mapped_column(
        _FarString(150),
        default="user",
        nullable=False,
    )
    created_at: _FarMapped[object] = _far_mapped_column(
        _FarDateTime(timezone=True),
        server_default=_far_func.now(),
        nullable=False,
    )
    updated_at: _FarMapped[object] = _far_mapped_column(
        _FarDateTime(timezone=True),
        server_default=_far_func.now(),
        onupdate=_far_func.now(),
        nullable=False,
    )


class FinanceInvoiceLine(Base):
    __tablename__ = "finance_invoice_lines"

    id: _FarMapped[_far_uuid.UUID] = _far_mapped_column(
        _FarUUID(as_uuid=True),
        primary_key=True,
        default=_far_uuid.uuid4,
    )
    invoice_id: _FarMapped[_far_uuid.UUID] = _far_mapped_column(
        _FarUUID(as_uuid=True),
        _FarForeignKey("finance_invoices.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    line_number: _FarMapped[int] = _far_mapped_column(
        _FarInteger,
        nullable=False,
    )
    description: _FarMapped[str] = _far_mapped_column(
        _FarString(500),
        nullable=False,
    )
    revenue_account_id: _FarMapped[_far_uuid.UUID] = _far_mapped_column(
        _FarUUID(as_uuid=True),
        _FarForeignKey("finance_accounts.id"),
        nullable=False,
        index=True,
    )
    quantity: _FarMapped[float] = _far_mapped_column(
        _FarNumeric(18, 4),
        default=1,
        nullable=False,
    )
    unit_price: _FarMapped[float] = _far_mapped_column(
        _FarNumeric(18, 4),
        default=0,
        nullable=False,
    )
    vat_rate: _FarMapped[float] = _far_mapped_column(
        _FarNumeric(7, 4),
        default=0,
        nullable=False,
    )
    net_amount: _FarMapped[float] = _far_mapped_column(
        _FarNumeric(18, 2),
        default=0,
        nullable=False,
    )
    vat_amount: _FarMapped[float] = _far_mapped_column(
        _FarNumeric(18, 2),
        default=0,
        nullable=False,
    )
    total_amount: _FarMapped[float] = _far_mapped_column(
        _FarNumeric(18, 2),
        default=0,
        nullable=False,
    )
    line_metadata: _FarMapped[dict] = _far_mapped_column(
        _FarJSONB,
        default=dict,
        nullable=False,
    )


class FinanceBillPayment(Base):
    __tablename__ = "finance_bill_payments"

    id: _FarMapped[_far_uuid.UUID] = _far_mapped_column(
        _FarUUID(as_uuid=True),
        primary_key=True,
        default=_far_uuid.uuid4,
    )
    bill_id: _FarMapped[_far_uuid.UUID] = _far_mapped_column(
        _FarUUID(as_uuid=True),
        _FarForeignKey("finance_bills.id"),
        nullable=False,
        index=True,
    )
    payment_date: _FarMapped[object] = _far_mapped_column(
        _FarDate,
        nullable=False,
        index=True,
    )
    amount: _FarMapped[float] = _far_mapped_column(
        _FarNumeric(18, 2),
        nullable=False,
    )
    bank_account_id: _FarMapped[_far_uuid.UUID] = _far_mapped_column(
        _FarUUID(as_uuid=True),
        _FarForeignKey("finance_accounts.id"),
        nullable=False,
        index=True,
    )
    reference: _FarMapped[str | None] = _far_mapped_column(
        _FarString(150),
        nullable=True,
    )
    status: _FarMapped[str] = _far_mapped_column(
        _FarString(30),
        default="draft",
        nullable=False,
        index=True,
    )
    approval_id: _FarMapped[_far_uuid.UUID | None] = _far_mapped_column(
        _FarUUID(as_uuid=True),
        _FarForeignKey("approvals.id"),
        nullable=True,
        index=True,
    )
    journal_entry_id: _FarMapped[_far_uuid.UUID | None] = _far_mapped_column(
        _FarUUID(as_uuid=True),
        _FarForeignKey("finance_journal_entries.id"),
        nullable=True,
        index=True,
    )
    created_by: _FarMapped[str] = _far_mapped_column(
        _FarString(150),
        default="user",
        nullable=False,
    )
    created_at: _FarMapped[object] = _far_mapped_column(
        _FarDateTime(timezone=True),
        server_default=_far_func.now(),
        nullable=False,
    )


class FinanceInvoiceReceipt(Base):
    __tablename__ = "finance_invoice_receipts"

    id: _FarMapped[_far_uuid.UUID] = _far_mapped_column(
        _FarUUID(as_uuid=True),
        primary_key=True,
        default=_far_uuid.uuid4,
    )
    invoice_id: _FarMapped[_far_uuid.UUID] = _far_mapped_column(
        _FarUUID(as_uuid=True),
        _FarForeignKey("finance_invoices.id"),
        nullable=False,
        index=True,
    )
    receipt_date: _FarMapped[object] = _far_mapped_column(
        _FarDate,
        nullable=False,
        index=True,
    )
    amount: _FarMapped[float] = _far_mapped_column(
        _FarNumeric(18, 2),
        nullable=False,
    )
    bank_account_id: _FarMapped[_far_uuid.UUID] = _far_mapped_column(
        _FarUUID(as_uuid=True),
        _FarForeignKey("finance_accounts.id"),
        nullable=False,
        index=True,
    )
    reference: _FarMapped[str | None] = _far_mapped_column(
        _FarString(150),
        nullable=True,
    )
    status: _FarMapped[str] = _far_mapped_column(
        _FarString(30),
        default="draft",
        nullable=False,
        index=True,
    )
    approval_id: _FarMapped[_far_uuid.UUID | None] = _far_mapped_column(
        _FarUUID(as_uuid=True),
        _FarForeignKey("approvals.id"),
        nullable=True,
        index=True,
    )
    journal_entry_id: _FarMapped[_far_uuid.UUID | None] = _far_mapped_column(
        _FarUUID(as_uuid=True),
        _FarForeignKey("finance_journal_entries.id"),
        nullable=True,
        index=True,
    )
    created_by: _FarMapped[str] = _far_mapped_column(
        _FarString(150),
        default="user",
        nullable=False,
    )
    created_at: _FarMapped[object] = _far_mapped_column(
        _FarDateTime(timezone=True),
        server_default=_far_func.now(),
        nullable=False,
    )

# ============================================================
# Finance - Cash, Bank, Expenses, Budget & Forecast
# ============================================================
import uuid as _f3_uuid

from sqlalchemy import (
    Boolean as _F3Boolean,
    Date as _F3Date,
    DateTime as _F3DateTime,
    ForeignKey as _F3ForeignKey,
    Integer as _F3Integer,
    Numeric as _F3Numeric,
    String as _F3String,
    Text as _F3Text,
    func as _f3_func,
)
from sqlalchemy.dialects.postgresql import (
    JSONB as _F3JSONB,
    UUID as _F3UUID,
)
from sqlalchemy.orm import (
    Mapped as _F3Mapped,
    mapped_column as _f3_mapped_column,
)


class FinanceBankAccount(Base):
    __tablename__ = "finance_bank_accounts"

    id: _F3Mapped[_f3_uuid.UUID] = _f3_mapped_column(
        _F3UUID(as_uuid=True),
        primary_key=True,
        default=_f3_uuid.uuid4,
    )
    code: _F3Mapped[str] = _f3_mapped_column(
        _F3String(50),
        unique=True,
        nullable=False,
        index=True,
    )
    bank_name: _F3Mapped[str] = _f3_mapped_column(
        _F3String(255),
        nullable=False,
    )
    account_name: _F3Mapped[str | None] = _f3_mapped_column(
        _F3String(255),
        nullable=True,
    )
    iban: _F3Mapped[str | None] = _f3_mapped_column(
        _F3String(80),
        unique=True,
        nullable=True,
        index=True,
    )
    currency: _F3Mapped[str] = _f3_mapped_column(
        _F3String(10),
        default="SAR",
        nullable=False,
    )
    gl_account_id: _F3Mapped[_f3_uuid.UUID] = _f3_mapped_column(
        _F3UUID(as_uuid=True),
        _F3ForeignKey("finance_accounts.id"),
        nullable=False,
        index=True,
    )
    opening_balance: _F3Mapped[float] = _f3_mapped_column(
        _F3Numeric(18, 2),
        default=0,
        nullable=False,
    )
    is_active: _F3Mapped[bool] = _f3_mapped_column(
        _F3Boolean,
        default=True,
        nullable=False,
        index=True,
    )
    bank_metadata: _F3Mapped[dict] = _f3_mapped_column(
        _F3JSONB,
        default=dict,
        nullable=False,
    )
    created_at: _F3Mapped[object] = _f3_mapped_column(
        _F3DateTime(timezone=True),
        server_default=_f3_func.now(),
        nullable=False,
    )
    updated_at: _F3Mapped[object] = _f3_mapped_column(
        _F3DateTime(timezone=True),
        server_default=_f3_func.now(),
        onupdate=_f3_func.now(),
        nullable=False,
    )


class FinanceBankStatementLine(Base):
    __tablename__ = "finance_bank_statement_lines"

    id: _F3Mapped[_f3_uuid.UUID] = _f3_mapped_column(
        _F3UUID(as_uuid=True),
        primary_key=True,
        default=_f3_uuid.uuid4,
    )
    bank_account_id: _F3Mapped[_f3_uuid.UUID] = _f3_mapped_column(
        _F3UUID(as_uuid=True),
        _F3ForeignKey("finance_bank_accounts.id"),
        nullable=False,
        index=True,
    )
    transaction_date: _F3Mapped[object] = _f3_mapped_column(
        _F3Date,
        nullable=False,
        index=True,
    )
    value_date: _F3Mapped[object | None] = _f3_mapped_column(
        _F3Date,
        nullable=True,
    )
    description: _F3Mapped[str] = _f3_mapped_column(
        _F3Text,
        nullable=False,
    )
    reference: _F3Mapped[str | None] = _f3_mapped_column(
        _F3String(180),
        nullable=True,
        index=True,
    )
    amount: _F3Mapped[float] = _f3_mapped_column(
        _F3Numeric(18, 2),
        nullable=False,
    )
    external_id: _F3Mapped[str | None] = _f3_mapped_column(
        _F3String(180),
        nullable=True,
        index=True,
    )
    status: _F3Mapped[str] = _f3_mapped_column(
        _F3String(30),
        default="unmatched",
        nullable=False,
        index=True,
    )
    matched_journal_line_id: _F3Mapped[_f3_uuid.UUID | None] = _f3_mapped_column(
        _F3UUID(as_uuid=True),
        _F3ForeignKey("finance_journal_lines.id"),
        nullable=True,
        index=True,
    )
    matched_at: _F3Mapped[object | None] = _f3_mapped_column(
        _F3DateTime(timezone=True),
        nullable=True,
    )
    notes: _F3Mapped[str | None] = _f3_mapped_column(
        _F3Text,
        nullable=True,
    )
    created_at: _F3Mapped[object] = _f3_mapped_column(
        _F3DateTime(timezone=True),
        server_default=_f3_func.now(),
        nullable=False,
    )


class FinanceBankReconciliation(Base):
    __tablename__ = "finance_bank_reconciliations"

    id: _F3Mapped[_f3_uuid.UUID] = _f3_mapped_column(
        _F3UUID(as_uuid=True),
        primary_key=True,
        default=_f3_uuid.uuid4,
    )
    bank_account_id: _F3Mapped[_f3_uuid.UUID] = _f3_mapped_column(
        _F3UUID(as_uuid=True),
        _F3ForeignKey("finance_bank_accounts.id"),
        nullable=False,
        index=True,
    )
    statement_from: _F3Mapped[object] = _f3_mapped_column(
        _F3Date,
        nullable=False,
        index=True,
    )
    statement_to: _F3Mapped[object] = _f3_mapped_column(
        _F3Date,
        nullable=False,
        index=True,
    )
    statement_ending_balance: _F3Mapped[float] = _f3_mapped_column(
        _F3Numeric(18, 2),
        nullable=False,
    )
    status: _F3Mapped[str] = _f3_mapped_column(
        _F3String(30),
        default="draft",
        nullable=False,
        index=True,
    )
    approval_id: _F3Mapped[_f3_uuid.UUID | None] = _f3_mapped_column(
        _F3UUID(as_uuid=True),
        _F3ForeignKey("approvals.id"),
        nullable=True,
        index=True,
    )
    created_by: _F3Mapped[str] = _f3_mapped_column(
        _F3String(150),
        default="user",
        nullable=False,
    )
    completed_at: _F3Mapped[object | None] = _f3_mapped_column(
        _F3DateTime(timezone=True),
        nullable=True,
    )
    notes: _F3Mapped[str | None] = _f3_mapped_column(
        _F3Text,
        nullable=True,
    )
    created_at: _F3Mapped[object] = _f3_mapped_column(
        _F3DateTime(timezone=True),
        server_default=_f3_func.now(),
        nullable=False,
    )
    updated_at: _F3Mapped[object] = _f3_mapped_column(
        _F3DateTime(timezone=True),
        server_default=_f3_func.now(),
        onupdate=_f3_func.now(),
        nullable=False,
    )


class FinanceExpense(Base):
    __tablename__ = "finance_expenses"

    id: _F3Mapped[_f3_uuid.UUID] = _f3_mapped_column(
        _F3UUID(as_uuid=True),
        primary_key=True,
        default=_f3_uuid.uuid4,
    )
    expense_date: _F3Mapped[object] = _f3_mapped_column(
        _F3Date,
        nullable=False,
        index=True,
    )
    description: _F3Mapped[str] = _f3_mapped_column(
        _F3Text,
        nullable=False,
    )
    vendor_id: _F3Mapped[_f3_uuid.UUID | None] = _f3_mapped_column(
        _F3UUID(as_uuid=True),
        _F3ForeignKey("finance_vendors.id"),
        nullable=True,
        index=True,
    )
    expense_account_id: _F3Mapped[_f3_uuid.UUID] = _f3_mapped_column(
        _F3UUID(as_uuid=True),
        _F3ForeignKey("finance_accounts.id"),
        nullable=False,
        index=True,
    )
    payment_account_id: _F3Mapped[_f3_uuid.UUID] = _f3_mapped_column(
        _F3UUID(as_uuid=True),
        _F3ForeignKey("finance_accounts.id"),
        nullable=False,
        index=True,
    )
    input_vat_account_id: _F3Mapped[_f3_uuid.UUID | None] = _f3_mapped_column(
        _F3UUID(as_uuid=True),
        _F3ForeignKey("finance_accounts.id"),
        nullable=True,
        index=True,
    )
    subtotal: _F3Mapped[float] = _f3_mapped_column(
        _F3Numeric(18, 2),
        nullable=False,
    )
    vat_rate: _F3Mapped[float] = _f3_mapped_column(
        _F3Numeric(7, 4),
        default=0,
        nullable=False,
    )
    vat_amount: _F3Mapped[float] = _f3_mapped_column(
        _F3Numeric(18, 2),
        default=0,
        nullable=False,
    )
    total_amount: _F3Mapped[float] = _f3_mapped_column(
        _F3Numeric(18, 2),
        nullable=False,
    )
    currency: _F3Mapped[str] = _f3_mapped_column(
        _F3String(10),
        default="SAR",
        nullable=False,
    )
    status: _F3Mapped[str] = _f3_mapped_column(
        _F3String(30),
        default="draft",
        nullable=False,
        index=True,
    )
    approval_id: _F3Mapped[_f3_uuid.UUID | None] = _f3_mapped_column(
        _F3UUID(as_uuid=True),
        _F3ForeignKey("approvals.id"),
        nullable=True,
        index=True,
    )
    journal_entry_id: _F3Mapped[_f3_uuid.UUID | None] = _f3_mapped_column(
        _F3UUID(as_uuid=True),
        _F3ForeignKey("finance_journal_entries.id"),
        nullable=True,
        index=True,
    )
    reference: _F3Mapped[str | None] = _f3_mapped_column(
        _F3String(180),
        nullable=True,
    )
    cost_center: _F3Mapped[str | None] = _f3_mapped_column(
        _F3String(100),
        nullable=True,
        index=True,
    )
    department_code: _F3Mapped[str | None] = _f3_mapped_column(
        _F3String(100),
        nullable=True,
        index=True,
    )
    created_by: _F3Mapped[str] = _f3_mapped_column(
        _F3String(150),
        default="user",
        nullable=False,
    )
    notes: _F3Mapped[str | None] = _f3_mapped_column(
        _F3Text,
        nullable=True,
    )
    expense_metadata: _F3Mapped[dict] = _f3_mapped_column(
        _F3JSONB,
        default=dict,
        nullable=False,
    )
    created_at: _F3Mapped[object] = _f3_mapped_column(
        _F3DateTime(timezone=True),
        server_default=_f3_func.now(),
        nullable=False,
    )
    updated_at: _F3Mapped[object] = _f3_mapped_column(
        _F3DateTime(timezone=True),
        server_default=_f3_func.now(),
        onupdate=_f3_func.now(),
        nullable=False,
    )


class FinanceBudget(Base):
    __tablename__ = "finance_budgets"

    id: _F3Mapped[_f3_uuid.UUID] = _f3_mapped_column(
        _F3UUID(as_uuid=True),
        primary_key=True,
        default=_f3_uuid.uuid4,
    )
    year: _F3Mapped[int] = _f3_mapped_column(
        _F3Integer,
        nullable=False,
        index=True,
    )
    name: _F3Mapped[str] = _f3_mapped_column(
        _F3String(255),
        nullable=False,
    )
    version: _F3Mapped[int] = _f3_mapped_column(
        _F3Integer,
        default=1,
        nullable=False,
    )
    status: _F3Mapped[str] = _f3_mapped_column(
        _F3String(30),
        default="draft",
        nullable=False,
        index=True,
    )
    approval_id: _F3Mapped[_f3_uuid.UUID | None] = _f3_mapped_column(
        _F3UUID(as_uuid=True),
        _F3ForeignKey("approvals.id"),
        nullable=True,
        index=True,
    )
    is_current: _F3Mapped[bool] = _f3_mapped_column(
        _F3Boolean,
        default=False,
        nullable=False,
        index=True,
    )
    created_by: _F3Mapped[str] = _f3_mapped_column(
        _F3String(150),
        default="user",
        nullable=False,
    )
    notes: _F3Mapped[str | None] = _f3_mapped_column(
        _F3Text,
        nullable=True,
    )
    created_at: _F3Mapped[object] = _f3_mapped_column(
        _F3DateTime(timezone=True),
        server_default=_f3_func.now(),
        nullable=False,
    )
    updated_at: _F3Mapped[object] = _f3_mapped_column(
        _F3DateTime(timezone=True),
        server_default=_f3_func.now(),
        onupdate=_f3_func.now(),
        nullable=False,
    )


class FinanceBudgetLine(Base):
    __tablename__ = "finance_budget_lines"

    id: _F3Mapped[_f3_uuid.UUID] = _f3_mapped_column(
        _F3UUID(as_uuid=True),
        primary_key=True,
        default=_f3_uuid.uuid4,
    )
    budget_id: _F3Mapped[_f3_uuid.UUID] = _f3_mapped_column(
        _F3UUID(as_uuid=True),
        _F3ForeignKey("finance_budgets.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    account_id: _F3Mapped[_f3_uuid.UUID] = _f3_mapped_column(
        _F3UUID(as_uuid=True),
        _F3ForeignKey("finance_accounts.id"),
        nullable=False,
        index=True,
    )
    month: _F3Mapped[int] = _f3_mapped_column(
        _F3Integer,
        nullable=False,
        index=True,
    )
    department_code: _F3Mapped[str | None] = _f3_mapped_column(
        _F3String(100),
        nullable=True,
        index=True,
    )
    cost_center: _F3Mapped[str | None] = _f3_mapped_column(
        _F3String(100),
        nullable=True,
        index=True,
    )
    amount: _F3Mapped[float] = _f3_mapped_column(
        _F3Numeric(18, 2),
        nullable=False,
    )
    notes: _F3Mapped[str | None] = _f3_mapped_column(
        _F3Text,
        nullable=True,
    )


class FinanceForecast(Base):
    __tablename__ = "finance_forecasts"

    id: _F3Mapped[_f3_uuid.UUID] = _f3_mapped_column(
        _F3UUID(as_uuid=True),
        primary_key=True,
        default=_f3_uuid.uuid4,
    )
    year: _F3Mapped[int] = _f3_mapped_column(
        _F3Integer,
        nullable=False,
        index=True,
    )
    name: _F3Mapped[str] = _f3_mapped_column(
        _F3String(255),
        nullable=False,
    )
    version: _F3Mapped[int] = _f3_mapped_column(
        _F3Integer,
        default=1,
        nullable=False,
    )
    status: _F3Mapped[str] = _f3_mapped_column(
        _F3String(30),
        default="draft",
        nullable=False,
        index=True,
    )
    approval_id: _F3Mapped[_f3_uuid.UUID | None] = _f3_mapped_column(
        _F3UUID(as_uuid=True),
        _F3ForeignKey("approvals.id"),
        nullable=True,
        index=True,
    )
    is_current: _F3Mapped[bool] = _f3_mapped_column(
        _F3Boolean,
        default=False,
        nullable=False,
        index=True,
    )
    based_on_budget_id: _F3Mapped[_f3_uuid.UUID | None] = _f3_mapped_column(
        _F3UUID(as_uuid=True),
        _F3ForeignKey("finance_budgets.id"),
        nullable=True,
        index=True,
    )
    created_by: _F3Mapped[str] = _f3_mapped_column(
        _F3String(150),
        default="user",
        nullable=False,
    )
    notes: _F3Mapped[str | None] = _f3_mapped_column(
        _F3Text,
        nullable=True,
    )
    created_at: _F3Mapped[object] = _f3_mapped_column(
        _F3DateTime(timezone=True),
        server_default=_f3_func.now(),
        nullable=False,
    )
    updated_at: _F3Mapped[object] = _f3_mapped_column(
        _F3DateTime(timezone=True),
        server_default=_f3_func.now(),
        onupdate=_f3_func.now(),
        nullable=False,
    )


class FinanceForecastLine(Base):
    __tablename__ = "finance_forecast_lines"

    id: _F3Mapped[_f3_uuid.UUID] = _f3_mapped_column(
        _F3UUID(as_uuid=True),
        primary_key=True,
        default=_f3_uuid.uuid4,
    )
    forecast_id: _F3Mapped[_f3_uuid.UUID] = _f3_mapped_column(
        _F3UUID(as_uuid=True),
        _F3ForeignKey("finance_forecasts.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    account_id: _F3Mapped[_f3_uuid.UUID] = _f3_mapped_column(
        _F3UUID(as_uuid=True),
        _F3ForeignKey("finance_accounts.id"),
        nullable=False,
        index=True,
    )
    month: _F3Mapped[int] = _f3_mapped_column(
        _F3Integer,
        nullable=False,
        index=True,
    )
    department_code: _F3Mapped[str | None] = _f3_mapped_column(
        _F3String(100),
        nullable=True,
        index=True,
    )
    cost_center: _F3Mapped[str | None] = _f3_mapped_column(
        _F3String(100),
        nullable=True,
        index=True,
    )
    amount: _F3Mapped[float] = _f3_mapped_column(
        _F3Numeric(18, 2),
        nullable=False,
    )
    notes: _F3Mapped[str | None] = _f3_mapped_column(
        _F3Text,
        nullable=True,
    )

# ============================================================
# Finance Batch 5 - Fixed Assets, Depreciation & Accruals
# ============================================================
import uuid as _f5_uuid

from sqlalchemy import (
    Date as _F5Date,
    DateTime as _F5DateTime,
    ForeignKey as _F5ForeignKey,
    Integer as _F5Integer,
    Numeric as _F5Numeric,
    String as _F5String,
    Text as _F5Text,
    func as _f5_func,
)
from sqlalchemy.dialects.postgresql import (
    JSONB as _F5JSONB,
    UUID as _F5UUID,
)
from sqlalchemy.orm import (
    Mapped as _F5Mapped,
    mapped_column as _f5_mapped_column,
)


class FinanceFixedAsset(Base):
    __tablename__ = "finance_fixed_assets"

    id: _F5Mapped[_f5_uuid.UUID] = _f5_mapped_column(
        _F5UUID(as_uuid=True),
        primary_key=True,
        default=_f5_uuid.uuid4,
    )
    code: _F5Mapped[str] = _f5_mapped_column(
        _F5String(80),
        unique=True,
        nullable=False,
        index=True,
    )
    name_ar: _F5Mapped[str] = _f5_mapped_column(
        _F5String(255),
        nullable=False,
    )
    name_en: _F5Mapped[str | None] = _f5_mapped_column(
        _F5String(255),
        nullable=True,
    )
    category: _F5Mapped[str | None] = _f5_mapped_column(
        _F5String(120),
        nullable=True,
        index=True,
    )
    acquisition_date: _F5Mapped[object] = _f5_mapped_column(
        _F5Date,
        nullable=False,
        index=True,
    )
    placed_in_service_date: _F5Mapped[object] = _f5_mapped_column(
        _F5Date,
        nullable=False,
        index=True,
    )
    acquisition_cost: _F5Mapped[float] = _f5_mapped_column(
        _F5Numeric(18, 2),
        nullable=False,
    )
    salvage_value: _F5Mapped[float] = _f5_mapped_column(
        _F5Numeric(18, 2),
        default=0,
        nullable=False,
    )
    useful_life_months: _F5Mapped[int] = _f5_mapped_column(
        _F5Integer,
        nullable=False,
    )
    depreciation_method: _F5Mapped[str] = _f5_mapped_column(
        _F5String(40),
        default="straight_line",
        nullable=False,
    )
    asset_account_id: _F5Mapped[_f5_uuid.UUID] = _f5_mapped_column(
        _F5UUID(as_uuid=True),
        _F5ForeignKey("finance_accounts.id"),
        nullable=False,
        index=True,
    )
    accumulated_depreciation_account_id: _F5Mapped[_f5_uuid.UUID] = _f5_mapped_column(
        _F5UUID(as_uuid=True),
        _F5ForeignKey("finance_accounts.id"),
        nullable=False,
        index=True,
    )
    depreciation_expense_account_id: _F5Mapped[_f5_uuid.UUID] = _f5_mapped_column(
        _F5UUID(as_uuid=True),
        _F5ForeignKey("finance_accounts.id"),
        nullable=False,
        index=True,
    )
    vendor_id: _F5Mapped[_f5_uuid.UUID | None] = _f5_mapped_column(
        _F5UUID(as_uuid=True),
        _F5ForeignKey("finance_vendors.id"),
        nullable=True,
        index=True,
    )
    status: _F5Mapped[str] = _f5_mapped_column(
        _F5String(30),
        default="active",
        nullable=False,
        index=True,
    )
    serial_number: _F5Mapped[str | None] = _f5_mapped_column(
        _F5String(160),
        nullable=True,
        index=True,
    )
    location: _F5Mapped[str | None] = _f5_mapped_column(
        _F5String(180),
        nullable=True,
    )
    notes: _F5Mapped[str | None] = _f5_mapped_column(
        _F5Text,
        nullable=True,
    )
    asset_metadata: _F5Mapped[dict] = _f5_mapped_column(
        _F5JSONB,
        default=dict,
        nullable=False,
    )
    created_at: _F5Mapped[object] = _f5_mapped_column(
        _F5DateTime(timezone=True),
        server_default=_f5_func.now(),
        nullable=False,
    )
    updated_at: _F5Mapped[object] = _f5_mapped_column(
        _F5DateTime(timezone=True),
        server_default=_f5_func.now(),
        onupdate=_f5_func.now(),
        nullable=False,
    )


class FinanceDepreciationRun(Base):
    __tablename__ = "finance_depreciation_runs"

    id: _F5Mapped[_f5_uuid.UUID] = _f5_mapped_column(
        _F5UUID(as_uuid=True),
        primary_key=True,
        default=_f5_uuid.uuid4,
    )
    year: _F5Mapped[int] = _f5_mapped_column(
        _F5Integer,
        nullable=False,
        index=True,
    )
    month: _F5Mapped[int] = _f5_mapped_column(
        _F5Integer,
        nullable=False,
        index=True,
    )
    run_date: _F5Mapped[object] = _f5_mapped_column(
        _F5Date,
        nullable=False,
        index=True,
    )
    status: _F5Mapped[str] = _f5_mapped_column(
        _F5String(30),
        default="draft",
        nullable=False,
        index=True,
    )
    total_depreciation: _F5Mapped[float] = _f5_mapped_column(
        _F5Numeric(18, 2),
        default=0,
        nullable=False,
    )
    approval_id: _F5Mapped[_f5_uuid.UUID | None] = _f5_mapped_column(
        _F5UUID(as_uuid=True),
        _F5ForeignKey("approvals.id"),
        nullable=True,
        index=True,
    )
    journal_entry_id: _F5Mapped[_f5_uuid.UUID | None] = _f5_mapped_column(
        _F5UUID(as_uuid=True),
        _F5ForeignKey("finance_journal_entries.id"),
        nullable=True,
        index=True,
    )
    created_by: _F5Mapped[str] = _f5_mapped_column(
        _F5String(150),
        default="user",
        nullable=False,
    )
    notes: _F5Mapped[str | None] = _f5_mapped_column(
        _F5Text,
        nullable=True,
    )
    created_at: _F5Mapped[object] = _f5_mapped_column(
        _F5DateTime(timezone=True),
        server_default=_f5_func.now(),
        nullable=False,
    )
    updated_at: _F5Mapped[object] = _f5_mapped_column(
        _F5DateTime(timezone=True),
        server_default=_f5_func.now(),
        onupdate=_f5_func.now(),
        nullable=False,
    )


class FinanceDepreciationLine(Base):
    __tablename__ = "finance_depreciation_lines"

    id: _F5Mapped[_f5_uuid.UUID] = _f5_mapped_column(
        _F5UUID(as_uuid=True),
        primary_key=True,
        default=_f5_uuid.uuid4,
    )
    run_id: _F5Mapped[_f5_uuid.UUID] = _f5_mapped_column(
        _F5UUID(as_uuid=True),
        _F5ForeignKey("finance_depreciation_runs.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    asset_id: _F5Mapped[_f5_uuid.UUID] = _f5_mapped_column(
        _F5UUID(as_uuid=True),
        _F5ForeignKey("finance_fixed_assets.id"),
        nullable=False,
        index=True,
    )
    amount: _F5Mapped[float] = _f5_mapped_column(
        _F5Numeric(18, 2),
        nullable=False,
    )
    accumulated_before: _F5Mapped[float] = _f5_mapped_column(
        _F5Numeric(18, 2),
        default=0,
        nullable=False,
    )
    accumulated_after: _F5Mapped[float] = _f5_mapped_column(
        _F5Numeric(18, 2),
        default=0,
        nullable=False,
    )
    created_at: _F5Mapped[object] = _f5_mapped_column(
        _F5DateTime(timezone=True),
        server_default=_f5_func.now(),
        nullable=False,
    )


class FinanceAccrual(Base):
    __tablename__ = "finance_accruals"

    id: _F5Mapped[_f5_uuid.UUID] = _f5_mapped_column(
        _F5UUID(as_uuid=True),
        primary_key=True,
        default=_f5_uuid.uuid4,
    )
    code: _F5Mapped[str] = _f5_mapped_column(
        _F5String(80),
        unique=True,
        nullable=False,
        index=True,
    )
    description: _F5Mapped[str] = _f5_mapped_column(
        _F5Text,
        nullable=False,
    )
    accrual_date: _F5Mapped[object] = _f5_mapped_column(
        _F5Date,
        nullable=False,
        index=True,
    )
    reversal_date: _F5Mapped[object] = _f5_mapped_column(
        _F5Date,
        nullable=False,
        index=True,
    )
    amount: _F5Mapped[float] = _f5_mapped_column(
        _F5Numeric(18, 2),
        nullable=False,
    )
    currency: _F5Mapped[str] = _f5_mapped_column(
        _F5String(10),
        default="SAR",
        nullable=False,
    )
    expense_account_id: _F5Mapped[_f5_uuid.UUID] = _f5_mapped_column(
        _F5UUID(as_uuid=True),
        _F5ForeignKey("finance_accounts.id"),
        nullable=False,
        index=True,
    )
    accrued_liability_account_id: _F5Mapped[_f5_uuid.UUID] = _f5_mapped_column(
        _F5UUID(as_uuid=True),
        _F5ForeignKey("finance_accounts.id"),
        nullable=False,
        index=True,
    )
    status: _F5Mapped[str] = _f5_mapped_column(
        _F5String(30),
        default="draft",
        nullable=False,
        index=True,
    )
    approval_id: _F5Mapped[_f5_uuid.UUID | None] = _f5_mapped_column(
        _F5UUID(as_uuid=True),
        _F5ForeignKey("approvals.id"),
        nullable=True,
        index=True,
    )
    journal_entry_id: _F5Mapped[_f5_uuid.UUID | None] = _f5_mapped_column(
        _F5UUID(as_uuid=True),
        _F5ForeignKey("finance_journal_entries.id"),
        nullable=True,
        index=True,
    )
    reversal_approval_id: _F5Mapped[_f5_uuid.UUID | None] = _f5_mapped_column(
        _F5UUID(as_uuid=True),
        _F5ForeignKey("approvals.id"),
        nullable=True,
        index=True,
    )
    reversal_journal_entry_id: _F5Mapped[_f5_uuid.UUID | None] = _f5_mapped_column(
        _F5UUID(as_uuid=True),
        _F5ForeignKey("finance_journal_entries.id"),
        nullable=True,
        index=True,
    )
    reference: _F5Mapped[str | None] = _f5_mapped_column(
        _F5String(180),
        nullable=True,
    )
    department_code: _F5Mapped[str | None] = _f5_mapped_column(
        _F5String(100),
        nullable=True,
        index=True,
    )
    cost_center: _F5Mapped[str | None] = _f5_mapped_column(
        _F5String(100),
        nullable=True,
        index=True,
    )
    created_by: _F5Mapped[str] = _f5_mapped_column(
        _F5String(150),
        default="user",
        nullable=False,
    )
    notes: _F5Mapped[str | None] = _f5_mapped_column(
        _F5Text,
        nullable=True,
    )
    accrual_metadata: _F5Mapped[dict] = _f5_mapped_column(
        _F5JSONB,
        default=dict,
        nullable=False,
    )
    created_at: _F5Mapped[object] = _f5_mapped_column(
        _F5DateTime(timezone=True),
        server_default=_f5_func.now(),
        nullable=False,
    )
    updated_at: _F5Mapped[object] = _f5_mapped_column(
        _F5DateTime(timezone=True),
        server_default=_f5_func.now(),
        onupdate=_f5_func.now(),
        nullable=False,
    )

# ============================================================
# Procurement Batch 8 - Purchase-to-Pay Foundation
# Purchase Request -> Approval -> PO -> Receipt -> Finance AP Bill
# Supplier master is FinanceVendor; no duplicate supplier table.
# ============================================================

import uuid as _p8_uuid

from sqlalchemy import (
    Date as _P8Date,
    DateTime as _P8DateTime,
    ForeignKey as _P8ForeignKey,
    Integer as _P8Integer,
    Numeric as _P8Numeric,
    String as _P8String,
    Text as _P8Text,
    UniqueConstraint as _P8UniqueConstraint,
    func as _p8_func,
)
from sqlalchemy.dialects.postgresql import JSONB as _P8JSONB, UUID as _P8UUID
from sqlalchemy.orm import Mapped as _P8Mapped, mapped_column as _p8_mapped_column


class ProcurementPurchaseRequest(Base):
    __tablename__ = "procurement_purchase_requests"

    id: _P8Mapped[_p8_uuid.UUID] = _p8_mapped_column(
        _P8UUID(as_uuid=True), primary_key=True, default=_p8_uuid.uuid4
    )
    request_number: _P8Mapped[str] = _p8_mapped_column(
        _P8String(80), unique=True, nullable=False, index=True
    )
    requested_by: _P8Mapped[str] = _p8_mapped_column(
        _P8String(150), nullable=False, index=True
    )
    department_code: _P8Mapped[str | None] = _p8_mapped_column(
        _P8String(100), nullable=True, index=True
    )
    request_date: _P8Mapped[object] = _p8_mapped_column(
        _P8Date, nullable=False, index=True
    )
    needed_by: _P8Mapped[object | None] = _p8_mapped_column(
        _P8Date, nullable=True, index=True
    )
    purpose: _P8Mapped[str] = _p8_mapped_column(_P8Text, nullable=False)
    preferred_vendor_id: _P8Mapped[_p8_uuid.UUID | None] = _p8_mapped_column(
        _P8UUID(as_uuid=True),
        _P8ForeignKey("finance_vendors.id"),
        nullable=True,
        index=True,
    )
    currency: _P8Mapped[str] = _p8_mapped_column(
        _P8String(10), default="SAR", nullable=False
    )
    estimated_subtotal: _P8Mapped[float] = _p8_mapped_column(
        _P8Numeric(18, 2), default=0, nullable=False
    )
    estimated_vat_amount: _P8Mapped[float] = _p8_mapped_column(
        _P8Numeric(18, 2), default=0, nullable=False
    )
    estimated_total: _P8Mapped[float] = _p8_mapped_column(
        _P8Numeric(18, 2), default=0, nullable=False
    )
    status: _P8Mapped[str] = _p8_mapped_column(
        _P8String(40), default="draft", nullable=False, index=True
    )
    approval_id: _P8Mapped[_p8_uuid.UUID | None] = _p8_mapped_column(
        _P8UUID(as_uuid=True),
        _P8ForeignKey("approvals.id"),
        nullable=True,
        index=True,
    )
    notes: _P8Mapped[str | None] = _p8_mapped_column(_P8Text, nullable=True)
    request_metadata: _P8Mapped[dict] = _p8_mapped_column(
        _P8JSONB, default=dict, nullable=False
    )
    created_at: _P8Mapped[object] = _p8_mapped_column(
        _P8DateTime(timezone=True), server_default=_p8_func.now(), nullable=False
    )
    updated_at: _P8Mapped[object] = _p8_mapped_column(
        _P8DateTime(timezone=True),
        server_default=_p8_func.now(),
        onupdate=_p8_func.now(),
        nullable=False,
    )


class ProcurementPurchaseRequestLine(Base):
    __tablename__ = "procurement_purchase_request_lines"
    __table_args__ = (
        _P8UniqueConstraint(
            "purchase_request_id", "line_number", name="uq_procurement_pr_line_number"
        ),
    )

    id: _P8Mapped[_p8_uuid.UUID] = _p8_mapped_column(
        _P8UUID(as_uuid=True), primary_key=True, default=_p8_uuid.uuid4
    )
    purchase_request_id: _P8Mapped[_p8_uuid.UUID] = _p8_mapped_column(
        _P8UUID(as_uuid=True),
        _P8ForeignKey("procurement_purchase_requests.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    line_number: _P8Mapped[int] = _p8_mapped_column(_P8Integer, nullable=False)
    description: _P8Mapped[str] = _p8_mapped_column(_P8String(500), nullable=False)
    quantity: _P8Mapped[float] = _p8_mapped_column(
        _P8Numeric(18, 4), default=1, nullable=False
    )
    estimated_unit_price: _P8Mapped[float] = _p8_mapped_column(
        _P8Numeric(18, 4), default=0, nullable=False
    )
    vat_rate: _P8Mapped[float] = _p8_mapped_column(
        _P8Numeric(7, 4), default=0, nullable=False
    )
    estimated_net_amount: _P8Mapped[float] = _p8_mapped_column(
        _P8Numeric(18, 2), default=0, nullable=False
    )
    estimated_vat_amount: _P8Mapped[float] = _p8_mapped_column(
        _P8Numeric(18, 2), default=0, nullable=False
    )
    estimated_total_amount: _P8Mapped[float] = _p8_mapped_column(
        _P8Numeric(18, 2), default=0, nullable=False
    )
    account_id: _P8Mapped[_p8_uuid.UUID | None] = _p8_mapped_column(
        _P8UUID(as_uuid=True),
        _P8ForeignKey("finance_accounts.id"),
        nullable=True,
        index=True,
    )
    cost_center: _P8Mapped[str | None] = _p8_mapped_column(
        _P8String(100), nullable=True, index=True
    )
    line_metadata: _P8Mapped[dict] = _p8_mapped_column(
        _P8JSONB, default=dict, nullable=False
    )


class ProcurementPurchaseOrder(Base):
    __tablename__ = "procurement_purchase_orders"

    id: _P8Mapped[_p8_uuid.UUID] = _p8_mapped_column(
        _P8UUID(as_uuid=True), primary_key=True, default=_p8_uuid.uuid4
    )
    po_number: _P8Mapped[str] = _p8_mapped_column(
        _P8String(80), unique=True, nullable=False, index=True
    )
    purchase_request_id: _P8Mapped[_p8_uuid.UUID] = _p8_mapped_column(
        _P8UUID(as_uuid=True),
        _P8ForeignKey("procurement_purchase_requests.id"),
        unique=True,
        nullable=False,
        index=True,
    )
    vendor_id: _P8Mapped[_p8_uuid.UUID] = _p8_mapped_column(
        _P8UUID(as_uuid=True),
        _P8ForeignKey("finance_vendors.id"),
        nullable=False,
        index=True,
    )
    order_date: _P8Mapped[object] = _p8_mapped_column(_P8Date, nullable=False, index=True)
    expected_delivery_date: _P8Mapped[object | None] = _p8_mapped_column(
        _P8Date, nullable=True, index=True
    )
    currency: _P8Mapped[str] = _p8_mapped_column(
        _P8String(10), default="SAR", nullable=False
    )
    subtotal: _P8Mapped[float] = _p8_mapped_column(
        _P8Numeric(18, 2), default=0, nullable=False
    )
    vat_amount: _P8Mapped[float] = _p8_mapped_column(
        _P8Numeric(18, 2), default=0, nullable=False
    )
    total_amount: _P8Mapped[float] = _p8_mapped_column(
        _P8Numeric(18, 2), default=0, nullable=False
    )
    status: _P8Mapped[str] = _p8_mapped_column(
        _P8String(40), default="draft", nullable=False, index=True
    )
    approval_id: _P8Mapped[_p8_uuid.UUID | None] = _p8_mapped_column(
        _P8UUID(as_uuid=True),
        _P8ForeignKey("approvals.id"),
        nullable=True,
        index=True,
    )
    issued_at: _P8Mapped[object | None] = _p8_mapped_column(
        _P8DateTime(timezone=True), nullable=True, index=True
    )
    issued_by: _P8Mapped[str | None] = _p8_mapped_column(_P8String(150), nullable=True)
    notes: _P8Mapped[str | None] = _p8_mapped_column(_P8Text, nullable=True)
    po_metadata: _P8Mapped[dict] = _p8_mapped_column(
        _P8JSONB, default=dict, nullable=False
    )
    created_at: _P8Mapped[object] = _p8_mapped_column(
        _P8DateTime(timezone=True), server_default=_p8_func.now(), nullable=False
    )
    updated_at: _P8Mapped[object] = _p8_mapped_column(
        _P8DateTime(timezone=True),
        server_default=_p8_func.now(),
        onupdate=_p8_func.now(),
        nullable=False,
    )


class ProcurementPurchaseOrderLine(Base):
    __tablename__ = "procurement_purchase_order_lines"
    __table_args__ = (
        _P8UniqueConstraint(
            "purchase_order_id", "line_number", name="uq_procurement_po_line_number"
        ),
    )

    id: _P8Mapped[_p8_uuid.UUID] = _p8_mapped_column(
        _P8UUID(as_uuid=True), primary_key=True, default=_p8_uuid.uuid4
    )
    purchase_order_id: _P8Mapped[_p8_uuid.UUID] = _p8_mapped_column(
        _P8UUID(as_uuid=True),
        _P8ForeignKey("procurement_purchase_orders.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    purchase_request_line_id: _P8Mapped[_p8_uuid.UUID | None] = _p8_mapped_column(
        _P8UUID(as_uuid=True),
        _P8ForeignKey("procurement_purchase_request_lines.id"),
        nullable=True,
        index=True,
    )
    line_number: _P8Mapped[int] = _p8_mapped_column(_P8Integer, nullable=False)
    description: _P8Mapped[str] = _p8_mapped_column(_P8String(500), nullable=False)
    account_id: _P8Mapped[_p8_uuid.UUID] = _p8_mapped_column(
        _P8UUID(as_uuid=True),
        _P8ForeignKey("finance_accounts.id"),
        nullable=False,
        index=True,
    )
    quantity: _P8Mapped[float] = _p8_mapped_column(
        _P8Numeric(18, 4), default=1, nullable=False
    )
    unit_price: _P8Mapped[float] = _p8_mapped_column(
        _P8Numeric(18, 4), default=0, nullable=False
    )
    vat_rate: _P8Mapped[float] = _p8_mapped_column(
        _P8Numeric(7, 4), default=0, nullable=False
    )
    net_amount: _P8Mapped[float] = _p8_mapped_column(
        _P8Numeric(18, 2), default=0, nullable=False
    )
    vat_amount: _P8Mapped[float] = _p8_mapped_column(
        _P8Numeric(18, 2), default=0, nullable=False
    )
    total_amount: _P8Mapped[float] = _p8_mapped_column(
        _P8Numeric(18, 2), default=0, nullable=False
    )
    received_quantity: _P8Mapped[float] = _p8_mapped_column(
        _P8Numeric(18, 4), default=0, nullable=False
    )
    cost_center: _P8Mapped[str | None] = _p8_mapped_column(
        _P8String(100), nullable=True, index=True
    )
    line_metadata: _P8Mapped[dict] = _p8_mapped_column(
        _P8JSONB, default=dict, nullable=False
    )


class ProcurementReceipt(Base):
    __tablename__ = "procurement_receipts"

    id: _P8Mapped[_p8_uuid.UUID] = _p8_mapped_column(
        _P8UUID(as_uuid=True), primary_key=True, default=_p8_uuid.uuid4
    )
    receipt_number: _P8Mapped[str] = _p8_mapped_column(
        _P8String(80), unique=True, nullable=False, index=True
    )
    purchase_order_id: _P8Mapped[_p8_uuid.UUID] = _p8_mapped_column(
        _P8UUID(as_uuid=True),
        _P8ForeignKey("procurement_purchase_orders.id"),
        nullable=False,
        index=True,
    )
    receipt_type: _P8Mapped[str] = _p8_mapped_column(
        _P8String(30), nullable=False, index=True
    )
    receipt_date: _P8Mapped[object] = _p8_mapped_column(
        _P8Date, nullable=False, index=True
    )
    status: _P8Mapped[str] = _p8_mapped_column(
        _P8String(30), default="draft", nullable=False, index=True
    )
    received_by: _P8Mapped[str] = _p8_mapped_column(_P8String(150), nullable=False)
    notes: _P8Mapped[str | None] = _p8_mapped_column(_P8Text, nullable=True)
    finance_bill_id: _P8Mapped[_p8_uuid.UUID | None] = _p8_mapped_column(
        _P8UUID(as_uuid=True),
        _P8ForeignKey("finance_bills.id"),
        unique=True,
        nullable=True,
        index=True,
    )
    receipt_metadata: _P8Mapped[dict] = _p8_mapped_column(
        _P8JSONB, default=dict, nullable=False
    )
    confirmed_at: _P8Mapped[object | None] = _p8_mapped_column(
        _P8DateTime(timezone=True), nullable=True, index=True
    )
    created_at: _P8Mapped[object] = _p8_mapped_column(
        _P8DateTime(timezone=True), server_default=_p8_func.now(), nullable=False
    )
    updated_at: _P8Mapped[object] = _p8_mapped_column(
        _P8DateTime(timezone=True),
        server_default=_p8_func.now(),
        onupdate=_p8_func.now(),
        nullable=False,
    )


class ProcurementReceiptLine(Base):
    __tablename__ = "procurement_receipt_lines"
    __table_args__ = (
        _P8UniqueConstraint(
            "receipt_id",
            "purchase_order_line_id",
            name="uq_procurement_receipt_po_line",
        ),
    )

    id: _P8Mapped[_p8_uuid.UUID] = _p8_mapped_column(
        _P8UUID(as_uuid=True), primary_key=True, default=_p8_uuid.uuid4
    )
    receipt_id: _P8Mapped[_p8_uuid.UUID] = _p8_mapped_column(
        _P8UUID(as_uuid=True),
        _P8ForeignKey("procurement_receipts.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    purchase_order_line_id: _P8Mapped[_p8_uuid.UUID] = _p8_mapped_column(
        _P8UUID(as_uuid=True),
        _P8ForeignKey("procurement_purchase_order_lines.id"),
        nullable=False,
        index=True,
    )
    line_number: _P8Mapped[int] = _p8_mapped_column(_P8Integer, nullable=False)
    description: _P8Mapped[str] = _p8_mapped_column(_P8String(500), nullable=False)
    quantity_received: _P8Mapped[float] = _p8_mapped_column(
        _P8Numeric(18, 4), nullable=False
    )
    line_metadata: _P8Mapped[dict] = _p8_mapped_column(
        _P8JSONB, default=dict, nullable=False
    )

# ============================================================
# Procurement Batch 9 - Operational Sourcing Completion
# RFQ, quotations, supplier qualification and award control.
# FinanceVendor remains the single supplier master.
# ============================================================

import uuid as _p9_uuid

from sqlalchemy import (
    Boolean as _P9Boolean,
    Date as _P9Date,
    DateTime as _P9DateTime,
    ForeignKey as _P9ForeignKey,
    Integer as _P9Integer,
    Numeric as _P9Numeric,
    String as _P9String,
    Text as _P9Text,
    UniqueConstraint as _P9UniqueConstraint,
    func as _p9_func,
)
from sqlalchemy.dialects.postgresql import (
    JSONB as _P9JSONB,
    UUID as _P9UUID,
)
from sqlalchemy.orm import (
    Mapped as _P9Mapped,
    mapped_column as _p9_mapped_column,
)


class ProcurementRFQ(Base):
    __tablename__ = "procurement_rfqs"

    id: _P9Mapped[_p9_uuid.UUID] = _p9_mapped_column(
        _P9UUID(as_uuid=True),
        primary_key=True,
        default=_p9_uuid.uuid4,
    )
    rfq_number: _P9Mapped[str] = _p9_mapped_column(
        _P9String(80),
        unique=True,
        nullable=False,
        index=True,
    )
    purchase_request_id: _P9Mapped[_p9_uuid.UUID] = _p9_mapped_column(
        _P9UUID(as_uuid=True),
        _P9ForeignKey("procurement_purchase_requests.id"),
        nullable=False,
        index=True,
    )
    title: _P9Mapped[str] = _p9_mapped_column(
        _P9String(255),
        nullable=False,
    )
    issue_date: _P9Mapped[object] = _p9_mapped_column(
        _P9Date,
        nullable=False,
        index=True,
    )
    response_due_date: _P9Mapped[object | None] = _p9_mapped_column(
        _P9Date,
        nullable=True,
        index=True,
    )
    currency: _P9Mapped[str] = _p9_mapped_column(
        _P9String(10),
        default="SAR",
        nullable=False,
    )
    status: _P9Mapped[str] = _p9_mapped_column(
        _P9String(30),
        default="draft",
        nullable=False,
        index=True,
    )
    notes: _P9Mapped[str | None] = _p9_mapped_column(
        _P9Text,
        nullable=True,
    )
    created_by: _P9Mapped[str] = _p9_mapped_column(
        _P9String(150),
        default="user",
        nullable=False,
    )
    rfq_metadata: _P9Mapped[dict] = _p9_mapped_column(
        _P9JSONB,
        default=dict,
        nullable=False,
    )
    opened_at: _P9Mapped[object | None] = _p9_mapped_column(
        _P9DateTime(timezone=True),
        nullable=True,
        index=True,
    )
    closed_at: _P9Mapped[object | None] = _p9_mapped_column(
        _P9DateTime(timezone=True),
        nullable=True,
        index=True,
    )
    created_at: _P9Mapped[object] = _p9_mapped_column(
        _P9DateTime(timezone=True),
        server_default=_p9_func.now(),
        nullable=False,
    )
    updated_at: _P9Mapped[object] = _p9_mapped_column(
        _P9DateTime(timezone=True),
        server_default=_p9_func.now(),
        onupdate=_p9_func.now(),
        nullable=False,
    )


class ProcurementRFQVendor(Base):
    __tablename__ = "procurement_rfq_vendors"
    __table_args__ = (
        _P9UniqueConstraint(
            "rfq_id",
            "vendor_id",
            name="uq_procurement_rfq_vendor",
        ),
    )

    id: _P9Mapped[_p9_uuid.UUID] = _p9_mapped_column(
        _P9UUID(as_uuid=True),
        primary_key=True,
        default=_p9_uuid.uuid4,
    )
    rfq_id: _P9Mapped[_p9_uuid.UUID] = _p9_mapped_column(
        _P9UUID(as_uuid=True),
        _P9ForeignKey("procurement_rfqs.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    vendor_id: _P9Mapped[_p9_uuid.UUID] = _p9_mapped_column(
        _P9UUID(as_uuid=True),
        _P9ForeignKey("finance_vendors.id"),
        nullable=False,
        index=True,
    )
    status: _P9Mapped[str] = _p9_mapped_column(
        _P9String(30),
        default="invited",
        nullable=False,
        index=True,
    )
    invited_at: _P9Mapped[object | None] = _p9_mapped_column(
        _P9DateTime(timezone=True),
        nullable=True,
    )
    notes: _P9Mapped[str | None] = _p9_mapped_column(
        _P9Text,
        nullable=True,
    )


class ProcurementQuotation(Base):
    __tablename__ = "procurement_quotations"
    __table_args__ = (
        _P9UniqueConstraint(
            "rfq_id",
            "vendor_id",
            name="uq_procurement_quote_rfq_vendor",
        ),
    )

    id: _P9Mapped[_p9_uuid.UUID] = _p9_mapped_column(
        _P9UUID(as_uuid=True),
        primary_key=True,
        default=_p9_uuid.uuid4,
    )
    quotation_number: _P9Mapped[str] = _p9_mapped_column(
        _P9String(80),
        unique=True,
        nullable=False,
        index=True,
    )
    rfq_id: _P9Mapped[_p9_uuid.UUID] = _p9_mapped_column(
        _P9UUID(as_uuid=True),
        _P9ForeignKey("procurement_rfqs.id"),
        nullable=False,
        index=True,
    )
    vendor_id: _P9Mapped[_p9_uuid.UUID] = _p9_mapped_column(
        _P9UUID(as_uuid=True),
        _P9ForeignKey("finance_vendors.id"),
        nullable=False,
        index=True,
    )
    vendor_quote_reference: _P9Mapped[str | None] = _p9_mapped_column(
        _P9String(150),
        nullable=True,
        index=True,
    )
    quote_date: _P9Mapped[object] = _p9_mapped_column(
        _P9Date,
        nullable=False,
        index=True,
    )
    valid_until: _P9Mapped[object | None] = _p9_mapped_column(
        _P9Date,
        nullable=True,
        index=True,
    )
    currency: _P9Mapped[str] = _p9_mapped_column(
        _P9String(10),
        default="SAR",
        nullable=False,
    )
    subtotal: _P9Mapped[float] = _p9_mapped_column(
        _P9Numeric(18, 2),
        default=0,
        nullable=False,
    )
    vat_amount: _P9Mapped[float] = _p9_mapped_column(
        _P9Numeric(18, 2),
        default=0,
        nullable=False,
    )
    total_amount: _P9Mapped[float] = _p9_mapped_column(
        _P9Numeric(18, 2),
        default=0,
        nullable=False,
    )
    delivery_days: _P9Mapped[int | None] = _p9_mapped_column(
        _P9Integer,
        nullable=True,
    )
    payment_terms_days: _P9Mapped[int | None] = _p9_mapped_column(
        _P9Integer,
        nullable=True,
    )
    warranty_terms: _P9Mapped[str | None] = _p9_mapped_column(
        _P9String(500),
        nullable=True,
    )
    status: _P9Mapped[str] = _p9_mapped_column(
        _P9String(30),
        default="submitted",
        nullable=False,
        index=True,
    )
    notes: _P9Mapped[str | None] = _p9_mapped_column(
        _P9Text,
        nullable=True,
    )
    quote_metadata: _P9Mapped[dict] = _p9_mapped_column(
        _P9JSONB,
        default=dict,
        nullable=False,
    )
    created_at: _P9Mapped[object] = _p9_mapped_column(
        _P9DateTime(timezone=True),
        server_default=_p9_func.now(),
        nullable=False,
    )
    updated_at: _P9Mapped[object] = _p9_mapped_column(
        _P9DateTime(timezone=True),
        server_default=_p9_func.now(),
        onupdate=_p9_func.now(),
        nullable=False,
    )


class ProcurementQuotationLine(Base):
    __tablename__ = "procurement_quotation_lines"
    __table_args__ = (
        _P9UniqueConstraint(
            "quotation_id",
            "purchase_request_line_id",
            name="uq_procurement_quote_pr_line",
        ),
    )

    id: _P9Mapped[_p9_uuid.UUID] = _p9_mapped_column(
        _P9UUID(as_uuid=True),
        primary_key=True,
        default=_p9_uuid.uuid4,
    )
    quotation_id: _P9Mapped[_p9_uuid.UUID] = _p9_mapped_column(
        _P9UUID(as_uuid=True),
        _P9ForeignKey("procurement_quotations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    purchase_request_line_id: _P9Mapped[_p9_uuid.UUID] = _p9_mapped_column(
        _P9UUID(as_uuid=True),
        _P9ForeignKey("procurement_purchase_request_lines.id"),
        nullable=False,
        index=True,
    )
    line_number: _P9Mapped[int] = _p9_mapped_column(
        _P9Integer,
        nullable=False,
    )
    description: _P9Mapped[str] = _p9_mapped_column(
        _P9String(500),
        nullable=False,
    )
    quantity: _P9Mapped[float] = _p9_mapped_column(
        _P9Numeric(18, 4),
        nullable=False,
    )
    unit_price: _P9Mapped[float] = _p9_mapped_column(
        _P9Numeric(18, 4),
        nullable=False,
    )
    vat_rate: _P9Mapped[float] = _p9_mapped_column(
        _P9Numeric(7, 4),
        default=0,
        nullable=False,
    )
    net_amount: _P9Mapped[float] = _p9_mapped_column(
        _P9Numeric(18, 2),
        default=0,
        nullable=False,
    )
    vat_amount: _P9Mapped[float] = _p9_mapped_column(
        _P9Numeric(18, 2),
        default=0,
        nullable=False,
    )
    total_amount: _P9Mapped[float] = _p9_mapped_column(
        _P9Numeric(18, 2),
        default=0,
        nullable=False,
    )
    line_metadata: _P9Mapped[dict] = _p9_mapped_column(
        _P9JSONB,
        default=dict,
        nullable=False,
    )


class ProcurementSupplierQualification(Base):
    __tablename__ = "procurement_supplier_qualifications"

    id: _P9Mapped[_p9_uuid.UUID] = _p9_mapped_column(
        _P9UUID(as_uuid=True),
        primary_key=True,
        default=_p9_uuid.uuid4,
    )
    vendor_id: _P9Mapped[_p9_uuid.UUID] = _p9_mapped_column(
        _P9UUID(as_uuid=True),
        _P9ForeignKey("finance_vendors.id"),
        unique=True,
        nullable=False,
        index=True,
    )
    status: _P9Mapped[str] = _p9_mapped_column(
        _P9String(30),
        default="pending",
        nullable=False,
        index=True,
    )
    risk_level: _P9Mapped[str] = _p9_mapped_column(
        _P9String(20),
        default="medium",
        nullable=False,
        index=True,
    )
    cr_verified: _P9Mapped[bool] = _p9_mapped_column(
        _P9Boolean,
        default=False,
        nullable=False,
    )
    vat_verified: _P9Mapped[bool] = _p9_mapped_column(
        _P9Boolean,
        default=False,
        nullable=False,
    )
    iban_verified: _P9Mapped[bool] = _p9_mapped_column(
        _P9Boolean,
        default=False,
        nullable=False,
    )
    cybersecurity_review_required: _P9Mapped[bool] = _p9_mapped_column(
        _P9Boolean,
        default=False,
        nullable=False,
    )
    cybersecurity_review_status: _P9Mapped[str] = _p9_mapped_column(
        _P9String(30),
        default="not_required",
        nullable=False,
    )
    valid_until: _P9Mapped[object | None] = _p9_mapped_column(
        _P9Date,
        nullable=True,
        index=True,
    )
    reviewed_by: _P9Mapped[str | None] = _p9_mapped_column(
        _P9String(150),
        nullable=True,
    )
    reviewed_at: _P9Mapped[object | None] = _p9_mapped_column(
        _P9DateTime(timezone=True),
        nullable=True,
    )
    notes: _P9Mapped[str | None] = _p9_mapped_column(
        _P9Text,
        nullable=True,
    )
    qualification_metadata: _P9Mapped[dict] = _p9_mapped_column(
        _P9JSONB,
        default=dict,
        nullable=False,
    )
    created_at: _P9Mapped[object] = _p9_mapped_column(
        _P9DateTime(timezone=True),
        server_default=_p9_func.now(),
        nullable=False,
    )
    updated_at: _P9Mapped[object] = _p9_mapped_column(
        _P9DateTime(timezone=True),
        server_default=_p9_func.now(),
        onupdate=_p9_func.now(),
        nullable=False,
    )


class ProcurementAwardDecision(Base):
    __tablename__ = "procurement_award_decisions"

    id: _P9Mapped[_p9_uuid.UUID] = _p9_mapped_column(
        _P9UUID(as_uuid=True),
        primary_key=True,
        default=_p9_uuid.uuid4,
    )
    rfq_id: _P9Mapped[_p9_uuid.UUID] = _p9_mapped_column(
        _P9UUID(as_uuid=True),
        _P9ForeignKey("procurement_rfqs.id"),
        unique=True,
        nullable=False,
        index=True,
    )
    selected_quotation_id: _P9Mapped[_p9_uuid.UUID] = _p9_mapped_column(
        _P9UUID(as_uuid=True),
        _P9ForeignKey("procurement_quotations.id"),
        nullable=False,
        index=True,
    )
    approval_id: _P9Mapped[_p9_uuid.UUID | None] = _p9_mapped_column(
        _P9UUID(as_uuid=True),
        _P9ForeignKey("approvals.id"),
        nullable=True,
        index=True,
    )
    status: _P9Mapped[str] = _p9_mapped_column(
        _P9String(30),
        default="pending_approval",
        nullable=False,
        index=True,
    )
    rationale: _P9Mapped[str | None] = _p9_mapped_column(
        _P9Text,
        nullable=True,
    )
    decided_by: _P9Mapped[str | None] = _p9_mapped_column(
        _P9String(150),
        nullable=True,
    )
    decided_at: _P9Mapped[object | None] = _p9_mapped_column(
        _P9DateTime(timezone=True),
        nullable=True,
    )
    award_metadata: _P9Mapped[dict] = _p9_mapped_column(
        _P9JSONB,
        default=dict,
        nullable=False,
    )
    created_at: _P9Mapped[object] = _p9_mapped_column(
        _P9DateTime(timezone=True),
        server_default=_p9_func.now(),
        nullable=False,
    )
    updated_at: _P9Mapped[object] = _p9_mapped_column(
        _P9DateTime(timezone=True),
        server_default=_p9_func.now(),
        onupdate=_p9_func.now(),
        nullable=False,
    )

# ============================================================
# Company Control Center - Phase 2
# Company master, DoA/RACI reference register and role register
# ============================================================
import uuid as _cc_uuid

from sqlalchemy import (
    Boolean as _CCBoolean,
    DateTime as _CCDateTime,
    Integer as _CCInteger,
    String as _CCString,
    Text as _CCText,
    func as _cc_func,
)
from sqlalchemy.dialects.postgresql import (
    JSONB as _CCJSONB,
    UUID as _CCUUID,
)
from sqlalchemy.orm import (
    Mapped as _CCMapped,
    mapped_column as _cc_mapped_column,
)


class CompanyProfile(Base):
    __tablename__ = "company_profiles"

    id: _CCMapped[_cc_uuid.UUID] = _cc_mapped_column(
        _CCUUID(as_uuid=True),
        primary_key=True,
        default=_cc_uuid.uuid4,
    )
    profile_key: _CCMapped[str] = _cc_mapped_column(
        _CCString(50),
        unique=True,
        nullable=False,
        index=True,
        default="primary",
    )
    legal_name_en: _CCMapped[str] = _cc_mapped_column(
        _CCString(255),
        nullable=False,
    )
    legal_name_ar: _CCMapped[str | None] = _cc_mapped_column(
        _CCString(255),
        nullable=True,
    )
    commercial_registration_no: _CCMapped[str] = _cc_mapped_column(
        _CCString(80),
        nullable=False,
        index=True,
    )
    city: _CCMapped[str | None] = _cc_mapped_column(
        _CCString(120),
        nullable=True,
    )
    country_code: _CCMapped[str] = _cc_mapped_column(
        _CCString(10),
        nullable=False,
        default="SA",
    )
    base_currency: _CCMapped[str] = _cc_mapped_column(
        _CCString(10),
        nullable=False,
        default="SAR",
    )
    timezone: _CCMapped[str] = _cc_mapped_column(
        _CCString(80),
        nullable=False,
        default="Asia/Riyadh",
    )
    vat_status: _CCMapped[str] = _cc_mapped_column(
        _CCString(30),
        nullable=False,
        default="unverified",
        index=True,
    )
    vat_number: _CCMapped[str | None] = _cc_mapped_column(
        _CCString(80),
        nullable=True,
    )
    status: _CCMapped[str] = _cc_mapped_column(
        _CCString(30),
        nullable=False,
        default="active",
        index=True,
    )
    profile_metadata: _CCMapped[dict] = _cc_mapped_column(
        _CCJSONB,
        default=dict,
        nullable=False,
    )
    created_at: _CCMapped[object] = _cc_mapped_column(
        _CCDateTime(timezone=True),
        server_default=_cc_func.now(),
        nullable=False,
    )
    updated_at: _CCMapped[object] = _cc_mapped_column(
        _CCDateTime(timezone=True),
        server_default=_cc_func.now(),
        onupdate=_cc_func.now(),
        nullable=False,
    )


class CompanyAuthorityRole(Base):
    __tablename__ = "company_authority_roles"

    id: _CCMapped[_cc_uuid.UUID] = _cc_mapped_column(
        _CCUUID(as_uuid=True),
        primary_key=True,
        default=_cc_uuid.uuid4,
    )
    code: _CCMapped[str] = _cc_mapped_column(
        _CCString(20),
        unique=True,
        nullable=False,
        index=True,
    )
    name_ar: _CCMapped[str] = _cc_mapped_column(
        _CCString(255),
        nullable=False,
    )
    scope_ar: _CCMapped[str] = _cc_mapped_column(
        _CCText,
        nullable=False,
    )
    incumbent_name: _CCMapped[str | None] = _cc_mapped_column(
        _CCString(255),
        nullable=True,
    )
    delegate_name: _CCMapped[str | None] = _cc_mapped_column(
        _CCString(255),
        nullable=True,
    )
    notes: _CCMapped[str | None] = _cc_mapped_column(
        _CCText,
        nullable=True,
    )
    source_version: _CCMapped[str] = _cc_mapped_column(
        _CCString(180),
        nullable=False,
        index=True,
    )
    status: _CCMapped[str] = _cc_mapped_column(
        _CCString(30),
        nullable=False,
        default="reference",
        index=True,
    )
    created_at: _CCMapped[object] = _cc_mapped_column(
        _CCDateTime(timezone=True),
        server_default=_cc_func.now(),
        nullable=False,
    )
    updated_at: _CCMapped[object] = _cc_mapped_column(
        _CCDateTime(timezone=True),
        server_default=_cc_func.now(),
        onupdate=_cc_func.now(),
        nullable=False,
    )


class CompanyAuthorityRule(Base):
    __tablename__ = "company_authority_rules"

    id: _CCMapped[_cc_uuid.UUID] = _cc_mapped_column(
        _CCUUID(as_uuid=True),
        primary_key=True,
        default=_cc_uuid.uuid4,
    )
    source_version: _CCMapped[str] = _cc_mapped_column(
        _CCString(180),
        nullable=False,
        index=True,
    )
    source_row_number: _CCMapped[int] = _cc_mapped_column(
        _CCInteger,
        nullable=False,
        index=True,
    )
    domain: _CCMapped[str] = _cc_mapped_column(
        _CCString(180),
        nullable=False,
        index=True,
    )
    activity: _CCMapped[str] = _cc_mapped_column(
        _CCText,
        nullable=False,
    )
    authority_condition: _CCMapped[str | None] = _cc_mapped_column(
        _CCText,
        nullable=True,
    )
    raci: _CCMapped[dict] = _cc_mapped_column(
        _CCJSONB,
        nullable=False,
        default=dict,
    )
    target_sla: _CCMapped[str | None] = _cc_mapped_column(
        _CCString(180),
        nullable=True,
    )
    notes: _CCMapped[str | None] = _cc_mapped_column(
        _CCText,
        nullable=True,
    )
    validation_status: _CCMapped[str | None] = _cc_mapped_column(
        _CCString(80),
        nullable=True,
    )
    status: _CCMapped[str] = _cc_mapped_column(
        _CCString(30),
        nullable=False,
        default="reference",
        index=True,
    )
    enforcement_enabled: _CCMapped[bool] = _cc_mapped_column(
        _CCBoolean,
        nullable=False,
        default=False,
        index=True,
    )
    source_hash: _CCMapped[str] = _cc_mapped_column(
        _CCString(64),
        nullable=False,
        unique=True,
        index=True,
    )
    created_at: _CCMapped[object] = _cc_mapped_column(
        _CCDateTime(timezone=True),
        server_default=_cc_func.now(),
        nullable=False,
    )
    updated_at: _CCMapped[object] = _cc_mapped_column(
        _CCDateTime(timezone=True),
        server_default=_cc_func.now(),
        onupdate=_cc_func.now(),
        nullable=False,
    )


class CompanyAuthorityLimit(Base):
    __tablename__ = "company_authority_limits"

    id: _CCMapped[_cc_uuid.UUID] = _cc_mapped_column(
        _CCUUID(as_uuid=True),
        primary_key=True,
        default=_cc_uuid.uuid4,
    )
    source_version: _CCMapped[str] = _cc_mapped_column(
        _CCString(180),
        nullable=False,
        index=True,
    )
    source_row_number: _CCMapped[int] = _cc_mapped_column(
        _CCInteger,
        nullable=False,
        index=True,
    )
    domain: _CCMapped[str] = _cc_mapped_column(
        _CCString(180),
        nullable=False,
        index=True,
    )
    band_or_case: _CCMapped[str] = _cc_mapped_column(
        _CCText,
        nullable=False,
    )
    method_or_condition: _CCMapped[str | None] = _cc_mapped_column(
        _CCText,
        nullable=True,
    )
    responsible: _CCMapped[str | None] = _cc_mapped_column(
        _CCText,
        nullable=True,
    )
    consulted: _CCMapped[str | None] = _cc_mapped_column(
        _CCText,
        nullable=True,
    )
    accountable: _CCMapped[str | None] = _cc_mapped_column(
        _CCText,
        nullable=True,
    )
    escalation: _CCMapped[str | None] = _cc_mapped_column(
        _CCText,
        nullable=True,
    )
    required_documents: _CCMapped[str | None] = _cc_mapped_column(
        _CCText,
        nullable=True,
    )
    source_status: _CCMapped[str | None] = _cc_mapped_column(
        _CCString(80),
        nullable=True,
        index=True,
    )
    approval_notes: _CCMapped[str | None] = _cc_mapped_column(
        _CCText,
        nullable=True,
    )
    enforcement_enabled: _CCMapped[bool] = _cc_mapped_column(
        _CCBoolean,
        nullable=False,
        default=False,
        index=True,
    )
    source_hash: _CCMapped[str] = _cc_mapped_column(
        _CCString(64),
        nullable=False,
        unique=True,
        index=True,
    )
    created_at: _CCMapped[object] = _cc_mapped_column(
        _CCDateTime(timezone=True),
        server_default=_cc_func.now(),
        nullable=False,
    )
    updated_at: _CCMapped[object] = _cc_mapped_column(
        _CCDateTime(timezone=True),
        server_default=_cc_func.now(),
        onupdate=_cc_func.now(),
        nullable=False,
    )

# ============================================================
# Sales & CRM - Phase 1A
# Evidence-based CRM pipeline foundation
# ============================================================
import uuid as _sal_uuid

from sqlalchemy import (
    Boolean as _SalBoolean,
    Date as _SalDate,
    DateTime as _SalDateTime,
    ForeignKey as _SalForeignKey,
    Integer as _SalInteger,
    Numeric as _SalNumeric,
    String as _SalString,
    Text as _SalText,
    func as _sal_func,
)
from sqlalchemy.dialects.postgresql import (
    JSONB as _SalJSONB,
    UUID as _SalUUID,
)
from sqlalchemy.orm import (
    Mapped as _SalMapped,
    mapped_column as _sal_mapped_column,
)


class SalesAccount(Base):
    __tablename__ = "sales_accounts"

    id: _SalMapped[_sal_uuid.UUID] = _sal_mapped_column(
        _SalUUID(as_uuid=True),
        primary_key=True,
        default=_sal_uuid.uuid4,
    )
    code: _SalMapped[str] = _sal_mapped_column(
        _SalString(50),
        unique=True,
        nullable=False,
        index=True,
    )
    name: _SalMapped[str] = _sal_mapped_column(
        _SalString(255),
        nullable=False,
        index=True,
    )
    sector: _SalMapped[str | None] = _sal_mapped_column(
        _SalString(120),
        nullable=True,
        index=True,
    )
    account_type: _SalMapped[str] = _sal_mapped_column(
        _SalString(40),
        nullable=False,
        default="prospect",
        index=True,
    )
    tier: _SalMapped[str | None] = _sal_mapped_column(
        _SalString(10),
        nullable=True,
        index=True,
    )
    owner_name: _SalMapped[str | None] = _sal_mapped_column(
        _SalString(180),
        nullable=True,
        index=True,
    )
    source: _SalMapped[str | None] = _sal_mapped_column(
        _SalString(120),
        nullable=True,
        index=True,
    )
    status: _SalMapped[str] = _sal_mapped_column(
        _SalString(30),
        nullable=False,
        default="active",
        index=True,
    )
    notes: _SalMapped[str | None] = _sal_mapped_column(
        _SalText,
        nullable=True,
    )
    account_metadata: _SalMapped[dict] = _sal_mapped_column(
        _SalJSONB,
        default=dict,
        nullable=False,
    )
    created_at: _SalMapped[object] = _sal_mapped_column(
        _SalDateTime(timezone=True),
        server_default=_sal_func.now(),
        nullable=False,
    )
    updated_at: _SalMapped[object] = _sal_mapped_column(
        _SalDateTime(timezone=True),
        server_default=_sal_func.now(),
        onupdate=_sal_func.now(),
        nullable=False,
    )


class SalesContact(Base):
    __tablename__ = "sales_contacts"

    id: _SalMapped[_sal_uuid.UUID] = _sal_mapped_column(
        _SalUUID(as_uuid=True),
        primary_key=True,
        default=_sal_uuid.uuid4,
    )
    account_id: _SalMapped[_sal_uuid.UUID] = _sal_mapped_column(
        _SalUUID(as_uuid=True),
        _SalForeignKey(
            "sales_accounts.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )
    full_name: _SalMapped[str] = _sal_mapped_column(
        _SalString(255),
        nullable=False,
    )
    job_title: _SalMapped[str | None] = _sal_mapped_column(
        _SalString(180),
        nullable=True,
    )
    email: _SalMapped[str | None] = _sal_mapped_column(
        _SalString(255),
        nullable=True,
        index=True,
    )
    mobile: _SalMapped[str | None] = _sal_mapped_column(
        _SalString(80),
        nullable=True,
    )
    decision_role: _SalMapped[str | None] = _sal_mapped_column(
        _SalString(100),
        nullable=True,
    )
    is_primary: _SalMapped[bool] = _sal_mapped_column(
        _SalBoolean,
        default=False,
        nullable=False,
    )
    notes: _SalMapped[str | None] = _sal_mapped_column(
        _SalText,
        nullable=True,
    )
    created_at: _SalMapped[object] = _sal_mapped_column(
        _SalDateTime(timezone=True),
        server_default=_sal_func.now(),
        nullable=False,
    )


class SalesOpportunity(Base):
    __tablename__ = "sales_opportunities"

    id: _SalMapped[_sal_uuid.UUID] = _sal_mapped_column(
        _SalUUID(as_uuid=True),
        primary_key=True,
        default=_sal_uuid.uuid4,
    )
    code: _SalMapped[str] = _sal_mapped_column(
        _SalString(50),
        unique=True,
        nullable=False,
        index=True,
    )
    account_id: _SalMapped[_sal_uuid.UUID] = _sal_mapped_column(
        _SalUUID(as_uuid=True),
        _SalForeignKey("sales_accounts.id"),
        nullable=False,
        index=True,
    )
    name: _SalMapped[str] = _sal_mapped_column(
        _SalString(255),
        nullable=False,
        index=True,
    )
    owner_name: _SalMapped[str | None] = _sal_mapped_column(
        _SalString(180),
        nullable=True,
        index=True,
    )
    opportunity_type: _SalMapped[str] = _sal_mapped_column(
        _SalString(50),
        nullable=False,
        default="new_business",
        index=True,
    )
    stage: _SalMapped[int] = _sal_mapped_column(
        _SalInteger,
        nullable=False,
        default=0,
        index=True,
    )
    probability_pct: _SalMapped[int] = _sal_mapped_column(
        _SalInteger,
        nullable=False,
        default=0,
    )
    forecast_category: _SalMapped[str] = _sal_mapped_column(
        _SalString(30),
        nullable=False,
        default="pipeline",
        index=True,
    )
    total_contract_value_ex_vat: _SalMapped[float] = _sal_mapped_column(
        _SalNumeric(18, 2),
        nullable=False,
        default=0,
    )
    period_value_ex_vat: _SalMapped[float] = _sal_mapped_column(
        _SalNumeric(18, 2),
        nullable=False,
        default=0,
    )
    discount_amount: _SalMapped[float] = _sal_mapped_column(
        _SalNumeric(18, 2),
        nullable=False,
        default=0,
    )
    direct_cost_estimate: _SalMapped[float] = _sal_mapped_column(
        _SalNumeric(18, 2),
        nullable=False,
        default=0,
    )
    net_revenue_ex_vat: _SalMapped[float] = _sal_mapped_column(
        _SalNumeric(18, 2),
        nullable=False,
        default=0,
    )
    gross_profit: _SalMapped[float] = _sal_mapped_column(
        _SalNumeric(18, 2),
        nullable=False,
        default=0,
    )
    gross_margin_pct: _SalMapped[float] = _sal_mapped_column(
        _SalNumeric(9, 4),
        nullable=False,
        default=0,
    )
    expected_close_date: _SalMapped[object | None] = _sal_mapped_column(
        _SalDate,
        nullable=True,
        index=True,
    )
    next_step: _SalMapped[str | None] = _sal_mapped_column(
        _SalText,
        nullable=True,
    )
    next_step_date: _SalMapped[object | None] = _sal_mapped_column(
        _SalDate,
        nullable=True,
        index=True,
    )
    need_summary: _SalMapped[str | None] = _sal_mapped_column(
        _SalText,
        nullable=True,
    )
    decision_maker: _SalMapped[str | None] = _sal_mapped_column(
        _SalString(255),
        nullable=True,
    )
    budget_status: _SalMapped[str | None] = _sal_mapped_column(
        _SalString(120),
        nullable=True,
    )
    buying_process: _SalMapped[str | None] = _sal_mapped_column(
        _SalText,
        nullable=True,
    )
    scope_summary: _SalMapped[str | None] = _sal_mapped_column(
        _SalText,
        nullable=True,
    )
    binding_document_reference: _SalMapped[str | None] = _sal_mapped_column(
        _SalString(255),
        nullable=True,
    )
    loss_reason: _SalMapped[str | None] = _sal_mapped_column(
        _SalString(255),
        nullable=True,
    )
    status: _SalMapped[str] = _sal_mapped_column(
        _SalString(30),
        nullable=False,
        default="open",
        index=True,
    )
    opportunity_metadata: _SalMapped[dict] = _sal_mapped_column(
        _SalJSONB,
        default=dict,
        nullable=False,
    )
    created_at: _SalMapped[object] = _sal_mapped_column(
        _SalDateTime(timezone=True),
        server_default=_sal_func.now(),
        nullable=False,
    )
    updated_at: _SalMapped[object] = _sal_mapped_column(
        _SalDateTime(timezone=True),
        server_default=_sal_func.now(),
        onupdate=_sal_func.now(),
        nullable=False,
    )


class SalesOpportunityStageHistory(Base):
    __tablename__ = "sales_opportunity_stage_history"

    id: _SalMapped[_sal_uuid.UUID] = _sal_mapped_column(
        _SalUUID(as_uuid=True),
        primary_key=True,
        default=_sal_uuid.uuid4,
    )
    opportunity_id: _SalMapped[_sal_uuid.UUID] = _sal_mapped_column(
        _SalUUID(as_uuid=True),
        _SalForeignKey(
            "sales_opportunities.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )
    from_stage: _SalMapped[int | None] = _sal_mapped_column(
        _SalInteger,
        nullable=True,
    )
    to_stage: _SalMapped[int] = _sal_mapped_column(
        _SalInteger,
        nullable=False,
    )
    evidence: _SalMapped[str | None] = _sal_mapped_column(
        _SalText,
        nullable=True,
    )
    changed_by: _SalMapped[str] = _sal_mapped_column(
        _SalString(150),
        nullable=False,
        default="user",
    )
    created_at: _SalMapped[object] = _sal_mapped_column(
        _SalDateTime(timezone=True),
        server_default=_sal_func.now(),
        nullable=False,
    )

# ============================================================
# Sales & CRM - Phase 1B
# Quotations, targets, Finance-verified collections, commissions
# ============================================================
import uuid as _salb_uuid

from sqlalchemy import (
    Boolean as _SalBBoolean,
    Date as _SalBDate,
    DateTime as _SalBDateTime,
    ForeignKey as _SalBForeignKey,
    Integer as _SalBInteger,
    Numeric as _SalBNumeric,
    String as _SalBString,
    Text as _SalBText,
    UniqueConstraint as _SalBUniqueConstraint,
    func as _salb_func,
)
from sqlalchemy.dialects.postgresql import (
    JSONB as _SalBJSONB,
    UUID as _SalBUUID,
)
from sqlalchemy.orm import (
    Mapped as _SalBMapped,
    mapped_column as _salb_mapped_column,
)


class SalesFinanceCustomerLink(Base):
    __tablename__ = "sales_finance_customer_links"

    id: _SalBMapped[_salb_uuid.UUID] = _salb_mapped_column(
        _SalBUUID(as_uuid=True),
        primary_key=True,
        default=_salb_uuid.uuid4,
    )
    sales_account_id: _SalBMapped[_salb_uuid.UUID] = _salb_mapped_column(
        _SalBUUID(as_uuid=True),
        _SalBForeignKey("sales_accounts.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )
    finance_customer_id: _SalBMapped[_salb_uuid.UUID] = _salb_mapped_column(
        _SalBUUID(as_uuid=True),
        _SalBForeignKey("finance_customers.id"),
        nullable=False,
        unique=True,
        index=True,
    )
    is_active: _SalBMapped[bool] = _salb_mapped_column(
        _SalBBoolean,
        nullable=False,
        default=True,
        index=True,
    )
    created_at: _SalBMapped[object] = _salb_mapped_column(
        _SalBDateTime(timezone=True),
        server_default=_salb_func.now(),
        nullable=False,
    )
    updated_at: _SalBMapped[object] = _salb_mapped_column(
        _SalBDateTime(timezone=True),
        server_default=_salb_func.now(),
        onupdate=_salb_func.now(),
        nullable=False,
    )


class SalesQuotation(Base):
    __tablename__ = "sales_quotations"
    __table_args__ = (
        _SalBUniqueConstraint(
            "opportunity_id",
            "version",
            name="uq_sales_quotation_opportunity_version",
        ),
    )

    id: _SalBMapped[_salb_uuid.UUID] = _salb_mapped_column(
        _SalBUUID(as_uuid=True),
        primary_key=True,
        default=_salb_uuid.uuid4,
    )
    opportunity_id: _SalBMapped[_salb_uuid.UUID] = _salb_mapped_column(
        _SalBUUID(as_uuid=True),
        _SalBForeignKey("sales_opportunities.id"),
        nullable=False,
        index=True,
    )
    version: _SalBMapped[int] = _salb_mapped_column(
        _SalBInteger,
        nullable=False,
        default=1,
    )
    external_quote_number: _SalBMapped[str | None] = _salb_mapped_column(
        _SalBString(120),
        nullable=True,
        index=True,
    )
    status: _SalBMapped[str] = _salb_mapped_column(
        _SalBString(30),
        nullable=False,
        default="draft",
        index=True,
    )
    subtotal_ex_vat: _SalBMapped[float] = _salb_mapped_column(
        _SalBNumeric(18, 2),
        nullable=False,
        default=0,
    )
    discount_amount: _SalBMapped[float] = _salb_mapped_column(
        _SalBNumeric(18, 2),
        nullable=False,
        default=0,
    )
    net_revenue_ex_vat: _SalBMapped[float] = _salb_mapped_column(
        _SalBNumeric(18, 2),
        nullable=False,
        default=0,
    )
    direct_cost: _SalBMapped[float] = _salb_mapped_column(
        _SalBNumeric(18, 2),
        nullable=False,
        default=0,
    )
    gross_profit: _SalBMapped[float] = _salb_mapped_column(
        _SalBNumeric(18, 2),
        nullable=False,
        default=0,
    )
    gross_margin_pct: _SalBMapped[float] = _salb_mapped_column(
        _SalBNumeric(9, 4),
        nullable=False,
        default=0,
    )
    vat_rate_pct: _SalBMapped[float] = _salb_mapped_column(
        _SalBNumeric(7, 4),
        nullable=False,
        default=0,
    )
    vat_amount: _SalBMapped[float] = _salb_mapped_column(
        _SalBNumeric(18, 2),
        nullable=False,
        default=0,
    )
    total_inc_vat: _SalBMapped[float] = _salb_mapped_column(
        _SalBNumeric(18, 2),
        nullable=False,
        default=0,
    )
    validity_date: _SalBMapped[object | None] = _salb_mapped_column(
        _SalBDate,
        nullable=True,
    )
    payment_terms: _SalBMapped[str | None] = _salb_mapped_column(
        _SalBText,
        nullable=True,
    )
    scope_summary: _SalBMapped[str | None] = _salb_mapped_column(
        _SalBText,
        nullable=True,
    )
    approval_id: _SalBMapped[_salb_uuid.UUID | None] = _salb_mapped_column(
        _SalBUUID(as_uuid=True),
        _SalBForeignKey("approvals.id"),
        nullable=True,
        index=True,
    )
    notes: _SalBMapped[str | None] = _salb_mapped_column(
        _SalBText,
        nullable=True,
    )
    quotation_metadata: _SalBMapped[dict] = _salb_mapped_column(
        _SalBJSONB,
        nullable=False,
        default=dict,
    )
    created_at: _SalBMapped[object] = _salb_mapped_column(
        _SalBDateTime(timezone=True),
        server_default=_salb_func.now(),
        nullable=False,
    )
    updated_at: _SalBMapped[object] = _salb_mapped_column(
        _SalBDateTime(timezone=True),
        server_default=_salb_func.now(),
        onupdate=_salb_func.now(),
        nullable=False,
    )


class SalesQuotationLine(Base):
    __tablename__ = "sales_quotation_lines"
    __table_args__ = (
        _SalBUniqueConstraint(
            "quotation_id",
            "line_number",
            name="uq_sales_quotation_line_number",
        ),
    )

    id: _SalBMapped[_salb_uuid.UUID] = _salb_mapped_column(
        _SalBUUID(as_uuid=True),
        primary_key=True,
        default=_salb_uuid.uuid4,
    )
    quotation_id: _SalBMapped[_salb_uuid.UUID] = _salb_mapped_column(
        _SalBUUID(as_uuid=True),
        _SalBForeignKey("sales_quotations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    line_number: _SalBMapped[int] = _salb_mapped_column(
        _SalBInteger,
        nullable=False,
    )
    description: _SalBMapped[str] = _salb_mapped_column(
        _SalBString(500),
        nullable=False,
    )
    quantity: _SalBMapped[float] = _salb_mapped_column(
        _SalBNumeric(18, 4),
        nullable=False,
        default=1,
    )
    unit_price: _SalBMapped[float] = _salb_mapped_column(
        _SalBNumeric(18, 4),
        nullable=False,
        default=0,
    )
    net_amount_ex_vat: _SalBMapped[float] = _salb_mapped_column(
        _SalBNumeric(18, 2),
        nullable=False,
        default=0,
    )
    direct_cost: _SalBMapped[float] = _salb_mapped_column(
        _SalBNumeric(18, 2),
        nullable=False,
        default=0,
    )
    notes: _SalBMapped[str | None] = _salb_mapped_column(
        _SalBText,
        nullable=True,
    )


class SalesTargetPlan(Base):
    __tablename__ = "sales_target_plans"

    id: _SalBMapped[_salb_uuid.UUID] = _salb_mapped_column(
        _SalBUUID(as_uuid=True),
        primary_key=True,
        default=_salb_uuid.uuid4,
    )
    year: _SalBMapped[int] = _salb_mapped_column(
        _SalBInteger,
        nullable=False,
        index=True,
    )
    period_label: _SalBMapped[str] = _salb_mapped_column(
        _SalBString(80),
        nullable=False,
    )
    start_date: _SalBMapped[object] = _salb_mapped_column(
        _SalBDate,
        nullable=False,
        index=True,
    )
    end_date: _SalBMapped[object] = _salb_mapped_column(
        _SalBDate,
        nullable=False,
        index=True,
    )
    owner_name: _SalBMapped[str | None] = _salb_mapped_column(
        _SalBString(180),
        nullable=True,
        index=True,
    )
    target_metric: _SalBMapped[str] = _salb_mapped_column(
        _SalBString(40),
        nullable=False,
        index=True,
    )
    target_amount: _SalBMapped[float] = _salb_mapped_column(
        _SalBNumeric(18, 2),
        nullable=False,
    )
    coverage_multiplier: _SalBMapped[float | None] = _salb_mapped_column(
        _SalBNumeric(8, 4),
        nullable=True,
    )
    status: _SalBMapped[str] = _salb_mapped_column(
        _SalBString(30),
        nullable=False,
        default="draft",
        index=True,
    )
    approval_id: _SalBMapped[_salb_uuid.UUID | None] = _salb_mapped_column(
        _SalBUUID(as_uuid=True),
        _SalBForeignKey("approvals.id"),
        nullable=True,
        index=True,
    )
    notes: _SalBMapped[str | None] = _salb_mapped_column(
        _SalBText,
        nullable=True,
    )
    created_at: _SalBMapped[object] = _salb_mapped_column(
        _SalBDateTime(timezone=True),
        server_default=_salb_func.now(),
        nullable=False,
    )
    updated_at: _SalBMapped[object] = _salb_mapped_column(
        _SalBDateTime(timezone=True),
        server_default=_salb_func.now(),
        onupdate=_salb_func.now(),
        nullable=False,
    )


class SalesCollectionMilestone(Base):
    __tablename__ = "sales_collection_milestones"

    id: _SalBMapped[_salb_uuid.UUID] = _salb_mapped_column(
        _SalBUUID(as_uuid=True),
        primary_key=True,
        default=_salb_uuid.uuid4,
    )
    opportunity_id: _SalBMapped[_salb_uuid.UUID] = _salb_mapped_column(
        _SalBUUID(as_uuid=True),
        _SalBForeignKey("sales_opportunities.id"),
        nullable=False,
        index=True,
    )
    quotation_id: _SalBMapped[_salb_uuid.UUID | None] = _salb_mapped_column(
        _SalBUUID(as_uuid=True),
        _SalBForeignKey("sales_quotations.id"),
        nullable=True,
        index=True,
    )
    due_date: _SalBMapped[object] = _salb_mapped_column(
        _SalBDate,
        nullable=False,
        index=True,
    )
    expected_amount_ex_vat: _SalBMapped[float] = _salb_mapped_column(
        _SalBNumeric(18, 2),
        nullable=False,
    )
    verified_amount_ex_vat: _SalBMapped[float] = _salb_mapped_column(
        _SalBNumeric(18, 2),
        nullable=False,
        default=0,
    )
    status: _SalBMapped[str] = _salb_mapped_column(
        _SalBString(30),
        nullable=False,
        default="planned",
        index=True,
    )
    notes: _SalBMapped[str | None] = _salb_mapped_column(
        _SalBText,
        nullable=True,
    )
    created_at: _SalBMapped[object] = _salb_mapped_column(
        _SalBDateTime(timezone=True),
        server_default=_salb_func.now(),
        nullable=False,
    )
    updated_at: _SalBMapped[object] = _salb_mapped_column(
        _SalBDateTime(timezone=True),
        server_default=_salb_func.now(),
        onupdate=_salb_func.now(),
        nullable=False,
    )


class SalesCollectionAllocation(Base):
    __tablename__ = "sales_collection_allocations"

    id: _SalBMapped[_salb_uuid.UUID] = _salb_mapped_column(
        _SalBUUID(as_uuid=True),
        primary_key=True,
        default=_salb_uuid.uuid4,
    )
    milestone_id: _SalBMapped[_salb_uuid.UUID] = _salb_mapped_column(
        _SalBUUID(as_uuid=True),
        _SalBForeignKey("sales_collection_milestones.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    finance_receipt_id: _SalBMapped[_salb_uuid.UUID] = _salb_mapped_column(
        _SalBUUID(as_uuid=True),
        _SalBForeignKey("finance_invoice_receipts.id"),
        nullable=False,
        unique=True,
        index=True,
    )
    finance_invoice_id: _SalBMapped[_salb_uuid.UUID] = _salb_mapped_column(
        _SalBUUID(as_uuid=True),
        _SalBForeignKey("finance_invoices.id"),
        nullable=False,
        index=True,
    )
    cash_amount_total: _SalBMapped[float] = _salb_mapped_column(
        _SalBNumeric(18, 2),
        nullable=False,
    )
    eligible_amount_ex_vat: _SalBMapped[float] = _salb_mapped_column(
        _SalBNumeric(18, 2),
        nullable=False,
    )
    verified_at: _SalBMapped[object] = _salb_mapped_column(
        _SalBDateTime(timezone=True),
        server_default=_salb_func.now(),
        nullable=False,
        index=True,
    )


class SalesCommissionPlan(Base):
    __tablename__ = "sales_commission_plans"

    id: _SalBMapped[_salb_uuid.UUID] = _salb_mapped_column(
        _SalBUUID(as_uuid=True),
        primary_key=True,
        default=_salb_uuid.uuid4,
    )
    name: _SalBMapped[str] = _salb_mapped_column(
        _SalBString(255),
        nullable=False,
    )
    employee_id: _SalBMapped[_salb_uuid.UUID] = _salb_mapped_column(
        _SalBUUID(as_uuid=True),
        _SalBForeignKey("hr_employees.id"),
        nullable=False,
        index=True,
    )
    year: _SalBMapped[int] = _salb_mapped_column(
        _SalBInteger,
        nullable=False,
        index=True,
    )
    period_label: _SalBMapped[str] = _salb_mapped_column(
        _SalBString(80),
        nullable=False,
    )
    target_amount: _SalBMapped[float] = _salb_mapped_column(
        _SalBNumeric(18, 2),
        nullable=False,
    )
    commission_rate_pct: _SalBMapped[float] = _salb_mapped_column(
        _SalBNumeric(9, 4),
        nullable=False,
    )
    status: _SalBMapped[str] = _salb_mapped_column(
        _SalBString(30),
        nullable=False,
        default="draft",
        index=True,
    )
    approval_id: _SalBMapped[_salb_uuid.UUID | None] = _salb_mapped_column(
        _SalBUUID(as_uuid=True),
        _SalBForeignKey("approvals.id"),
        nullable=True,
        index=True,
    )
    notes: _SalBMapped[str | None] = _salb_mapped_column(
        _SalBText,
        nullable=True,
    )
    created_at: _SalBMapped[object] = _salb_mapped_column(
        _SalBDateTime(timezone=True),
        server_default=_salb_func.now(),
        nullable=False,
    )
    updated_at: _SalBMapped[object] = _salb_mapped_column(
        _SalBDateTime(timezone=True),
        server_default=_salb_func.now(),
        onupdate=_salb_func.now(),
        nullable=False,
    )

# ============================================================
# Sales & CRM - Phase 1C
# Activities, follow-ups, pipeline aging and operating visibility
# ============================================================
import uuid as _salc_uuid

from sqlalchemy import (
    Boolean as _SalCBoolean,
    Date as _SalCDate,
    DateTime as _SalCDateTime,
    ForeignKey as _SalCForeignKey,
    String as _SalCString,
    Text as _SalCText,
    func as _salc_func,
)
from sqlalchemy.dialects.postgresql import (
    UUID as _SalCUUID,
)
from sqlalchemy.orm import (
    Mapped as _SalCMapped,
    mapped_column as _salc_mapped_column,
)


class SalesActivity(Base):
    __tablename__ = "sales_activities"

    id: _SalCMapped[_salc_uuid.UUID] = _salc_mapped_column(
        _SalCUUID(as_uuid=True),
        primary_key=True,
        default=_salc_uuid.uuid4,
    )
    account_id: _SalCMapped[_salc_uuid.UUID] = _salc_mapped_column(
        _SalCUUID(as_uuid=True),
        _SalCForeignKey("sales_accounts.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    opportunity_id: _SalCMapped[_salc_uuid.UUID | None] = _salc_mapped_column(
        _SalCUUID(as_uuid=True),
        _SalCForeignKey("sales_opportunities.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    contact_id: _SalCMapped[_salc_uuid.UUID | None] = _salc_mapped_column(
        _SalCUUID(as_uuid=True),
        _SalCForeignKey("sales_contacts.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    collection_milestone_id: _SalCMapped[_salc_uuid.UUID | None] = _salc_mapped_column(
        _SalCUUID(as_uuid=True),
        _SalCForeignKey("sales_collection_milestones.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    activity_type: _SalCMapped[str] = _salc_mapped_column(
        _SalCString(50),
        nullable=False,
        index=True,
    )
    subject: _SalCMapped[str] = _salc_mapped_column(
        _SalCString(255),
        nullable=False,
    )
    summary: _SalCMapped[str | None] = _salc_mapped_column(
        _SalCText,
        nullable=True,
    )
    outcome: _SalCMapped[str | None] = _salc_mapped_column(
        _SalCText,
        nullable=True,
    )
    activity_date: _SalCMapped[object] = _salc_mapped_column(
        _SalCDate,
        nullable=False,
        index=True,
    )
    next_follow_up_date: _SalCMapped[object | None] = _salc_mapped_column(
        _SalCDate,
        nullable=True,
        index=True,
    )
    status: _SalCMapped[str] = _salc_mapped_column(
        _SalCString(30),
        nullable=False,
        default="planned",
        index=True,
    )
    created_by: _SalCMapped[str] = _salc_mapped_column(
        _SalCString(150),
        nullable=False,
        default="user",
    )
    external_communication_sent: _SalCMapped[bool] = _salc_mapped_column(
        _SalCBoolean,
        nullable=False,
        default=False,
    )
    completed_at: _SalCMapped[object | None] = _salc_mapped_column(
        _SalCDateTime(timezone=True),
        nullable=True,
    )
    created_at: _SalCMapped[object] = _salc_mapped_column(
        _SalCDateTime(timezone=True),
        server_default=_salc_func.now(),
        nullable=False,
    )
    updated_at: _SalCMapped[object] = _salc_mapped_column(
        _SalCDateTime(timezone=True),
        server_default=_salc_func.now(),
        onupdate=_salc_func.now(),
        nullable=False,
    )

# ============================================================
# Sales & CRM - Phase 1D
# Lead intake, qualification, duplicate control and conversion
# ============================================================
import uuid as _sald_uuid

from sqlalchemy import (
    Date as _SalDDate,
    DateTime as _SalDDateTime,
    ForeignKey as _SalDForeignKey,
    JSON as _SalDJSON,
    String as _SalDString,
    Text as _SalDText,
    func as _sald_func,
)
from sqlalchemy.dialects.postgresql import (
    JSONB as _SalDJSONB,
    UUID as _SalDUUID,
)
from sqlalchemy.orm import (
    Mapped as _SalDMapped,
    mapped_column as _sald_mapped_column,
)


class SalesLead(Base):
    __tablename__ = "sales_leads"

    id: _SalDMapped[_sald_uuid.UUID] = _sald_mapped_column(
        _SalDUUID(as_uuid=True),
        primary_key=True,
        default=_sald_uuid.uuid4,
    )
    code: _SalDMapped[str] = _sald_mapped_column(
        _SalDString(50),
        nullable=False,
        unique=True,
        index=True,
    )
    company_name: _SalDMapped[str] = _sald_mapped_column(
        _SalDString(255),
        nullable=False,
        index=True,
    )
    normalized_company: _SalDMapped[str] = _sald_mapped_column(
        _SalDString(255),
        nullable=False,
        index=True,
    )
    contact_name: _SalDMapped[str | None] = _sald_mapped_column(
        _SalDString(255),
        nullable=True,
    )
    email: _SalDMapped[str | None] = _sald_mapped_column(
        _SalDString(255),
        nullable=True,
        index=True,
    )
    normalized_email: _SalDMapped[str | None] = _sald_mapped_column(
        _SalDString(255),
        nullable=True,
        index=True,
    )
    mobile: _SalDMapped[str | None] = _sald_mapped_column(
        _SalDString(80),
        nullable=True,
    )
    normalized_mobile: _SalDMapped[str | None] = _sald_mapped_column(
        _SalDString(80),
        nullable=True,
        index=True,
    )
    source: _SalDMapped[str] = _sald_mapped_column(
        _SalDString(120),
        nullable=False,
        index=True,
    )
    signal_date: _SalDMapped[object] = _sald_mapped_column(
        _SalDDate,
        nullable=False,
        index=True,
    )
    owner_name: _SalDMapped[str | None] = _sald_mapped_column(
        _SalDString(180),
        nullable=True,
        index=True,
    )
    status: _SalDMapped[str] = _sald_mapped_column(
        _SalDString(30),
        nullable=False,
        default="new",
        index=True,
    )
    fit_summary: _SalDMapped[str | None] = _sald_mapped_column(
        _SalDText,
        nullable=True,
    )
    need_summary: _SalDMapped[str | None] = _sald_mapped_column(
        _SalDText,
        nullable=True,
    )
    relationship_owner: _SalDMapped[str | None] = _sald_mapped_column(
        _SalDString(180),
        nullable=True,
    )
    buying_capacity: _SalDMapped[str | None] = _sald_mapped_column(
        _SalDText,
        nullable=True,
    )
    timing: _SalDMapped[str | None] = _sald_mapped_column(
        _SalDString(180),
        nullable=True,
    )
    next_step: _SalDMapped[str | None] = _sald_mapped_column(
        _SalDText,
        nullable=True,
    )
    next_step_date: _SalDMapped[object | None] = _sald_mapped_column(
        _SalDDate,
        nullable=True,
        index=True,
    )
    qualification_evidence: _SalDMapped[str | None] = _sald_mapped_column(
        _SalDText,
        nullable=True,
    )
    disqualification_reason: _SalDMapped[str | None] = _sald_mapped_column(
        _SalDString(255),
        nullable=True,
        index=True,
    )
    converted_account_id: _SalDMapped[_sald_uuid.UUID | None] = _sald_mapped_column(
        _SalDUUID(as_uuid=True),
        _SalDForeignKey("sales_accounts.id"),
        nullable=True,
        index=True,
    )
    converted_opportunity_id: _SalDMapped[_sald_uuid.UUID | None] = _sald_mapped_column(
        _SalDUUID(as_uuid=True),
        _SalDForeignKey("sales_opportunities.id"),
        nullable=True,
        index=True,
    )
    reopened_from_lead_id: _SalDMapped[_sald_uuid.UUID | None] = _sald_mapped_column(
        _SalDUUID(as_uuid=True),
        _SalDForeignKey("sales_leads.id"),
        nullable=True,
        index=True,
    )
    notes: _SalDMapped[str | None] = _sald_mapped_column(
        _SalDText,
        nullable=True,
    )
    lead_metadata: _SalDMapped[dict] = _sald_mapped_column(
        _SalDJSONB,
        nullable=False,
        default=dict,
    )
    qualified_at: _SalDMapped[object | None] = _sald_mapped_column(
        _SalDDateTime(timezone=True),
        nullable=True,
    )
    converted_at: _SalDMapped[object | None] = _sald_mapped_column(
        _SalDDateTime(timezone=True),
        nullable=True,
    )
    created_at: _SalDMapped[object] = _sald_mapped_column(
        _SalDDateTime(timezone=True),
        server_default=_sald_func.now(),
        nullable=False,
    )
    updated_at: _SalDMapped[object] = _sald_mapped_column(
        _SalDDateTime(timezone=True),
        server_default=_sald_func.now(),
        onupdate=_sald_func.now(),
        nullable=False,
    )

# ============================================================
# Marketing - Phase 1A
# Campaigns, content calendar and evidence-based lead attribution
# ============================================================
import uuid as _mkt_uuid

from sqlalchemy import (
    Boolean as _MktBoolean,
    Date as _MktDate,
    DateTime as _MktDateTime,
    ForeignKey as _MktForeignKey,
    Numeric as _MktNumeric,
    String as _MktString,
    Text as _MktText,
    UniqueConstraint as _MktUniqueConstraint,
    func as _mkt_func,
)
from sqlalchemy.dialects.postgresql import (
    JSONB as _MktJSONB,
    UUID as _MktUUID,
)
from sqlalchemy.orm import (
    Mapped as _MktMapped,
    mapped_column as _mkt_mapped_column,
)


class MarketingCampaign(Base):
    __tablename__ = "marketing_campaigns"

    id: _MktMapped[_mkt_uuid.UUID] = _mkt_mapped_column(
        _MktUUID(as_uuid=True),
        primary_key=True,
        default=_mkt_uuid.uuid4,
    )
    code: _MktMapped[str] = _mkt_mapped_column(
        _MktString(50),
        nullable=False,
        unique=True,
        index=True,
    )
    name: _MktMapped[str] = _mkt_mapped_column(
        _MktString(255),
        nullable=False,
        index=True,
    )
    objective: _MktMapped[str] = _mkt_mapped_column(
        _MktString(255),
        nullable=False,
    )
    channel: _MktMapped[str] = _mkt_mapped_column(
        _MktString(80),
        nullable=False,
        index=True,
    )
    owner_name: _MktMapped[str | None] = _mkt_mapped_column(
        _MktString(180),
        nullable=True,
        index=True,
    )
    status: _MktMapped[str] = _mkt_mapped_column(
        _MktString(30),
        nullable=False,
        default="draft",
        index=True,
    )
    start_date: _MktMapped[object | None] = _mkt_mapped_column(
        _MktDate,
        nullable=True,
        index=True,
    )
    end_date: _MktMapped[object | None] = _mkt_mapped_column(
        _MktDate,
        nullable=True,
        index=True,
    )
    planned_budget: _MktMapped[float] = _mkt_mapped_column(
        _MktNumeric(18, 2),
        nullable=False,
        default=0,
    )
    audience_summary: _MktMapped[str | None] = _mkt_mapped_column(
        _MktText,
        nullable=True,
    )
    notes: _MktMapped[str | None] = _mkt_mapped_column(
        _MktText,
        nullable=True,
    )
    campaign_metadata: _MktMapped[dict] = _mkt_mapped_column(
        _MktJSONB,
        nullable=False,
        default=dict,
    )
    created_at: _MktMapped[object] = _mkt_mapped_column(
        _MktDateTime(timezone=True),
        server_default=_mkt_func.now(),
        nullable=False,
    )
    updated_at: _MktMapped[object] = _mkt_mapped_column(
        _MktDateTime(timezone=True),
        server_default=_mkt_func.now(),
        onupdate=_mkt_func.now(),
        nullable=False,
    )


class MarketingContentItem(Base):
    __tablename__ = "marketing_content_items"

    id: _MktMapped[_mkt_uuid.UUID] = _mkt_mapped_column(
        _MktUUID(as_uuid=True),
        primary_key=True,
        default=_mkt_uuid.uuid4,
    )
    campaign_id: _MktMapped[_mkt_uuid.UUID | None] = _mkt_mapped_column(
        _MktUUID(as_uuid=True),
        _MktForeignKey(
            "marketing_campaigns.id",
            ondelete="SET NULL",
        ),
        nullable=True,
        index=True,
    )
    title: _MktMapped[str] = _mkt_mapped_column(
        _MktString(255),
        nullable=False,
        index=True,
    )
    content_type: _MktMapped[str] = _mkt_mapped_column(
        _MktString(80),
        nullable=False,
        index=True,
    )
    channel: _MktMapped[str] = _mkt_mapped_column(
        _MktString(80),
        nullable=False,
        index=True,
    )
    owner_name: _MktMapped[str | None] = _mkt_mapped_column(
        _MktString(180),
        nullable=True,
        index=True,
    )
    status: _MktMapped[str] = _mkt_mapped_column(
        _MktString(30),
        nullable=False,
        default="draft",
        index=True,
    )
    planned_publish_at: _MktMapped[object | None] = _mkt_mapped_column(
        _MktDateTime(timezone=True),
        nullable=True,
        index=True,
    )
    draft_text: _MktMapped[str | None] = _mkt_mapped_column(
        _MktText,
        nullable=True,
    )
    external_reference: _MktMapped[str | None] = _mkt_mapped_column(
        _MktString(500),
        nullable=True,
    )
    notes: _MktMapped[str | None] = _mkt_mapped_column(
        _MktText,
        nullable=True,
    )
    content_metadata: _MktMapped[dict] = _mkt_mapped_column(
        _MktJSONB,
        nullable=False,
        default=dict,
    )
    created_at: _MktMapped[object] = _mkt_mapped_column(
        _MktDateTime(timezone=True),
        server_default=_mkt_func.now(),
        nullable=False,
    )
    updated_at: _MktMapped[object] = _mkt_mapped_column(
        _MktDateTime(timezone=True),
        server_default=_mkt_func.now(),
        onupdate=_mkt_func.now(),
        nullable=False,
    )


class MarketingLeadAttribution(Base):
    __tablename__ = "marketing_lead_attributions"
    __table_args__ = (
        _MktUniqueConstraint(
            "lead_id",
            "campaign_id",
            "touch_type",
            "source",
            name="uq_marketing_lead_attribution_touch",
        ),
    )

    id: _MktMapped[_mkt_uuid.UUID] = _mkt_mapped_column(
        _MktUUID(as_uuid=True),
        primary_key=True,
        default=_mkt_uuid.uuid4,
    )
    lead_id: _MktMapped[_mkt_uuid.UUID] = _mkt_mapped_column(
        _MktUUID(as_uuid=True),
        _MktForeignKey(
            "sales_leads.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )
    campaign_id: _MktMapped[_mkt_uuid.UUID | None] = _mkt_mapped_column(
        _MktUUID(as_uuid=True),
        _MktForeignKey(
            "marketing_campaigns.id",
            ondelete="SET NULL",
        ),
        nullable=True,
        index=True,
    )
    touch_type: _MktMapped[str] = _mkt_mapped_column(
        _MktString(40),
        nullable=False,
        default="influenced",
        index=True,
    )
    channel: _MktMapped[str] = _mkt_mapped_column(
        _MktString(80),
        nullable=False,
        index=True,
    )
    source: _MktMapped[str] = _mkt_mapped_column(
        _MktString(120),
        nullable=False,
        index=True,
    )
    is_primary: _MktMapped[bool] = _mkt_mapped_column(
        _MktBoolean,
        nullable=False,
        default=False,
        index=True,
    )
    utm_source: _MktMapped[str | None] = _mkt_mapped_column(
        _MktString(180),
        nullable=True,
    )
    utm_medium: _MktMapped[str | None] = _mkt_mapped_column(
        _MktString(180),
        nullable=True,
    )
    utm_campaign: _MktMapped[str | None] = _mkt_mapped_column(
        _MktString(180),
        nullable=True,
    )
    utm_content: _MktMapped[str | None] = _mkt_mapped_column(
        _MktString(180),
        nullable=True,
    )
    utm_term: _MktMapped[str | None] = _mkt_mapped_column(
        _MktString(180),
        nullable=True,
    )
    landing_page: _MktMapped[str | None] = _mkt_mapped_column(
        _MktString(500),
        nullable=True,
    )
    notes: _MktMapped[str | None] = _mkt_mapped_column(
        _MktText,
        nullable=True,
    )
    created_at: _MktMapped[object] = _mkt_mapped_column(
        _MktDateTime(timezone=True),
        server_default=_mkt_func.now(),
        nullable=False,
    )

# ============================================================
# Marketing - Phase 1B
# Approval governance and evidence-based performance snapshots
# ============================================================
import uuid as _mktb_uuid

from sqlalchemy import (
    Date as _MktBDate,
    DateTime as _MktBDateTime,
    ForeignKey as _MktBForeignKey,
    Integer as _MktBInteger,
    String as _MktBString,
    Text as _MktBText,
    UniqueConstraint as _MktBUniqueConstraint,
    func as _mktb_func,
)
from sqlalchemy.dialects.postgresql import (
    UUID as _MktBUUID,
)
from sqlalchemy.orm import (
    Mapped as _MktBMapped,
    mapped_column as _mktb_mapped_column,
)


class MarketingApprovalBinding(Base):
    __tablename__ = "marketing_approval_bindings"
    __table_args__ = (
        _MktBUniqueConstraint(
            "entity_type",
            "entity_id",
            "purpose",
            name="uq_marketing_approval_binding_entity_purpose",
        ),
    )

    id: _MktBMapped[_mktb_uuid.UUID] = _mktb_mapped_column(
        _MktBUUID(as_uuid=True),
        primary_key=True,
        default=_mktb_uuid.uuid4,
    )
    entity_type: _MktBMapped[str] = _mktb_mapped_column(
        _MktBString(40),
        nullable=False,
        index=True,
    )
    entity_id: _MktBMapped[_mktb_uuid.UUID] = _mktb_mapped_column(
        _MktBUUID(as_uuid=True),
        nullable=False,
        index=True,
    )
    purpose: _MktBMapped[str] = _mktb_mapped_column(
        _MktBString(80),
        nullable=False,
        index=True,
    )
    approval_id: _MktBMapped[_mktb_uuid.UUID] = _mktb_mapped_column(
        _MktBUUID(as_uuid=True),
        _MktBForeignKey("approvals.id"),
        nullable=False,
        index=True,
    )
    created_at: _MktBMapped[object] = _mktb_mapped_column(
        _MktBDateTime(timezone=True),
        server_default=_mktb_func.now(),
        nullable=False,
    )
    updated_at: _MktBMapped[object] = _mktb_mapped_column(
        _MktBDateTime(timezone=True),
        server_default=_mktb_func.now(),
        onupdate=_mktb_func.now(),
        nullable=False,
    )


class MarketingPerformanceSnapshot(Base):
    __tablename__ = "marketing_performance_snapshots"

    id: _MktBMapped[_mktb_uuid.UUID] = _mktb_mapped_column(
        _MktBUUID(as_uuid=True),
        primary_key=True,
        default=_mktb_uuid.uuid4,
    )
    campaign_id: _MktBMapped[_mktb_uuid.UUID] = _mktb_mapped_column(
        _MktBUUID(as_uuid=True),
        _MktBForeignKey(
            "marketing_campaigns.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )
    snapshot_date: _MktBMapped[object] = _mktb_mapped_column(
        _MktBDate,
        nullable=False,
        index=True,
    )
    impressions: _MktBMapped[int] = _mktb_mapped_column(
        _MktBInteger,
        nullable=False,
        default=0,
    )
    clicks: _MktBMapped[int] = _mktb_mapped_column(
        _MktBInteger,
        nullable=False,
        default=0,
    )
    engagements: _MktBMapped[int] = _mktb_mapped_column(
        _MktBInteger,
        nullable=False,
        default=0,
    )
    website_sessions: _MktBMapped[int] = _mktb_mapped_column(
        _MktBInteger,
        nullable=False,
        default=0,
    )
    inquiries: _MktBMapped[int] = _mktb_mapped_column(
        _MktBInteger,
        nullable=False,
        default=0,
    )
    source_reference: _MktBMapped[str] = _mktb_mapped_column(
        _MktBString(500),
        nullable=False,
    )
    notes: _MktBMapped[str | None] = _mktb_mapped_column(
        _MktBText,
        nullable=True,
    )
    created_at: _MktBMapped[object] = _mktb_mapped_column(
        _MktBDateTime(timezone=True),
        server_default=_mktb_func.now(),
        nullable=False,
    )

# ============================================================
# Marketing - Phase 1C
# Finance budget/spend + Procurement link layer
# ============================================================
import uuid as _mktc_uuid

from sqlalchemy import (
    DateTime as _MktCDateTime,
    ForeignKey as _MktCForeignKey,
    Numeric as _MktCNumeric,
    String as _MktCString,
    Text as _MktCText,
    UniqueConstraint as _MktCUniqueConstraint,
    func as _mktc_func,
)
from sqlalchemy.dialects.postgresql import UUID as _MktCUUID
from sqlalchemy.orm import (
    Mapped as _MktCMapped,
    mapped_column as _mktc_mapped_column,
)


class MarketingBudgetAllocation(Base):
    __tablename__ = "marketing_budget_allocations"
    __table_args__ = (
        _MktCUniqueConstraint(
            "campaign_id",
            "finance_budget_line_id",
            name="uq_marketing_campaign_budget_line",
        ),
    )

    id: _MktCMapped[_mktc_uuid.UUID] = _mktc_mapped_column(
        _MktCUUID(as_uuid=True),
        primary_key=True,
        default=_mktc_uuid.uuid4,
    )
    campaign_id: _MktCMapped[_mktc_uuid.UUID] = _mktc_mapped_column(
        _MktCUUID(as_uuid=True),
        _MktCForeignKey("marketing_campaigns.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    finance_budget_line_id: _MktCMapped[_mktc_uuid.UUID] = _mktc_mapped_column(
        _MktCUUID(as_uuid=True),
        _MktCForeignKey("finance_budget_lines.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    allocated_amount: _MktCMapped[float] = _mktc_mapped_column(
        _MktCNumeric(18, 2),
        nullable=False,
    )
    linked_by: _MktCMapped[str] = _mktc_mapped_column(
        _MktCString(150),
        nullable=False,
        default="user",
    )
    notes: _MktCMapped[str | None] = _mktc_mapped_column(
        _MktCText,
        nullable=True,
    )
    created_at: _MktCMapped[object] = _mktc_mapped_column(
        _MktCDateTime(timezone=True),
        server_default=_mktc_func.now(),
        nullable=False,
    )


class MarketingFinanceExpenseLink(Base):
    __tablename__ = "marketing_finance_expense_links"

    id: _MktCMapped[_mktc_uuid.UUID] = _mktc_mapped_column(
        _MktCUUID(as_uuid=True),
        primary_key=True,
        default=_mktc_uuid.uuid4,
    )
    campaign_id: _MktCMapped[_mktc_uuid.UUID] = _mktc_mapped_column(
        _MktCUUID(as_uuid=True),
        _MktCForeignKey("marketing_campaigns.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    finance_expense_id: _MktCMapped[_mktc_uuid.UUID] = _mktc_mapped_column(
        _MktCUUID(as_uuid=True),
        _MktCForeignKey("finance_expenses.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )
    linked_by: _MktCMapped[str] = _mktc_mapped_column(
        _MktCString(150),
        nullable=False,
        default="user",
    )
    notes: _MktCMapped[str | None] = _mktc_mapped_column(
        _MktCText,
        nullable=True,
    )
    created_at: _MktCMapped[object] = _mktc_mapped_column(
        _MktCDateTime(timezone=True),
        server_default=_mktc_func.now(),
        nullable=False,
    )


class MarketingPurchaseRequestLink(Base):
    __tablename__ = "marketing_purchase_request_links"

    id: _MktCMapped[_mktc_uuid.UUID] = _mktc_mapped_column(
        _MktCUUID(as_uuid=True),
        primary_key=True,
        default=_mktc_uuid.uuid4,
    )
    campaign_id: _MktCMapped[_mktc_uuid.UUID] = _mktc_mapped_column(
        _MktCUUID(as_uuid=True),
        _MktCForeignKey("marketing_campaigns.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    purchase_request_id: _MktCMapped[_mktc_uuid.UUID] = _mktc_mapped_column(
        _MktCUUID(as_uuid=True),
        _MktCForeignKey("procurement_purchase_requests.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )
    linked_by: _MktCMapped[str] = _mktc_mapped_column(
        _MktCString(150),
        nullable=False,
        default="user",
    )
    notes: _MktCMapped[str | None] = _mktc_mapped_column(
        _MktCText,
        nullable=True,
    )
    created_at: _MktCMapped[object] = _mktc_mapped_column(
        _MktCDateTime(timezone=True),
        server_default=_mktc_func.now(),
        nullable=False,
    )


class MarketingPurchaseOrderLink(Base):
    __tablename__ = "marketing_purchase_order_links"

    id: _MktCMapped[_mktc_uuid.UUID] = _mktc_mapped_column(
        _MktCUUID(as_uuid=True),
        primary_key=True,
        default=_mktc_uuid.uuid4,
    )
    campaign_id: _MktCMapped[_mktc_uuid.UUID] = _mktc_mapped_column(
        _MktCUUID(as_uuid=True),
        _MktCForeignKey("marketing_campaigns.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    purchase_order_id: _MktCMapped[_mktc_uuid.UUID] = _mktc_mapped_column(
        _MktCUUID(as_uuid=True),
        _MktCForeignKey("procurement_purchase_orders.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )
    linked_by: _MktCMapped[str] = _mktc_mapped_column(
        _MktCString(150),
        nullable=False,
        default="user",
    )
    notes: _MktCMapped[str | None] = _mktc_mapped_column(
        _MktCText,
        nullable=True,
    )
    created_at: _MktCMapped[object] = _mktc_mapped_column(
        _MktCDateTime(timezone=True),
        server_default=_mktc_func.now(),
        nullable=False,
    )

# ============================================================
# Admin - Phase 1A
# Facilities, access/visitors, custody/keys and corporate records.
# Authoritative Finance assets, Procurement, corporate compliance,
# calendar and unified file storage remain in their existing modules.
# ============================================================
import uuid as _ad_uuid

from sqlalchemy import (
    Date as _AdDate,
    DateTime as _AdDateTime,
    ForeignKey as _AdForeignKey,
    String as _AdString,
    Text as _AdText,
    func as _ad_func,
)
from sqlalchemy.dialects.postgresql import (
    JSONB as _AdJSONB,
    UUID as _AdUUID,
)
from sqlalchemy.orm import (
    Mapped as _AdMapped,
    mapped_column as _ad_mapped_column,
)


class AdminFacility(Base):
    __tablename__ = "admin_facilities"

    id: _AdMapped[_ad_uuid.UUID] = _ad_mapped_column(
        _AdUUID(as_uuid=True),
        primary_key=True,
        default=_ad_uuid.uuid4,
    )
    code: _AdMapped[str] = _ad_mapped_column(
        _AdString(60),
        unique=True,
        nullable=False,
        index=True,
    )
    name: _AdMapped[str] = _ad_mapped_column(
        _AdString(255),
        nullable=False,
        index=True,
    )
    facility_type: _AdMapped[str] = _ad_mapped_column(
        _AdString(60),
        nullable=False,
        default="office",
        index=True,
    )
    address: _AdMapped[str | None] = _ad_mapped_column(
        _AdText,
        nullable=True,
    )
    city: _AdMapped[str | None] = _ad_mapped_column(
        _AdString(120),
        nullable=True,
        index=True,
    )
    responsible_owner: _AdMapped[str | None] = _ad_mapped_column(
        _AdString(150),
        nullable=True,
        index=True,
    )
    status: _AdMapped[str] = _ad_mapped_column(
        _AdString(30),
        nullable=False,
        default="active",
        index=True,
    )
    notes: _AdMapped[str | None] = _ad_mapped_column(
        _AdText,
        nullable=True,
    )
    facility_metadata: _AdMapped[dict] = _ad_mapped_column(
        _AdJSONB,
        nullable=False,
        default=dict,
    )
    created_at: _AdMapped[object] = _ad_mapped_column(
        _AdDateTime(timezone=True),
        server_default=_ad_func.now(),
        nullable=False,
    )
    updated_at: _AdMapped[object] = _ad_mapped_column(
        _AdDateTime(timezone=True),
        server_default=_ad_func.now(),
        onupdate=_ad_func.now(),
        nullable=False,
    )


class AdminFacilityWorkOrder(Base):
    __tablename__ = "admin_facility_work_orders"

    id: _AdMapped[_ad_uuid.UUID] = _ad_mapped_column(
        _AdUUID(as_uuid=True),
        primary_key=True,
        default=_ad_uuid.uuid4,
    )
    code: _AdMapped[str] = _ad_mapped_column(
        _AdString(60),
        unique=True,
        nullable=False,
        index=True,
    )
    facility_id: _AdMapped[_ad_uuid.UUID] = _ad_mapped_column(
        _AdUUID(as_uuid=True),
        _AdForeignKey(
            "admin_facilities.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )
    category: _AdMapped[str] = _ad_mapped_column(
        _AdString(60),
        nullable=False,
        default="maintenance",
        index=True,
    )
    title: _AdMapped[str] = _ad_mapped_column(
        _AdString(255),
        nullable=False,
    )
    description: _AdMapped[str | None] = _ad_mapped_column(
        _AdText,
        nullable=True,
    )
    priority: _AdMapped[str] = _ad_mapped_column(
        _AdString(20),
        nullable=False,
        default="normal",
        index=True,
    )
    responsible_owner: _AdMapped[str | None] = _ad_mapped_column(
        _AdString(150),
        nullable=True,
        index=True,
    )
    due_date: _AdMapped[object | None] = _ad_mapped_column(
        _AdDate,
        nullable=True,
        index=True,
    )
    status: _AdMapped[str] = _ad_mapped_column(
        _AdString(30),
        nullable=False,
        default="open",
        index=True,
    )
    notes: _AdMapped[str | None] = _ad_mapped_column(
        _AdText,
        nullable=True,
    )
    work_order_metadata: _AdMapped[dict] = _ad_mapped_column(
        _AdJSONB,
        nullable=False,
        default=dict,
    )
    completed_at: _AdMapped[object | None] = _ad_mapped_column(
        _AdDateTime(timezone=True),
        nullable=True,
    )
    created_at: _AdMapped[object] = _ad_mapped_column(
        _AdDateTime(timezone=True),
        server_default=_ad_func.now(),
        nullable=False,
    )
    updated_at: _AdMapped[object] = _ad_mapped_column(
        _AdDateTime(timezone=True),
        server_default=_ad_func.now(),
        onupdate=_ad_func.now(),
        nullable=False,
    )


class AdminAccessRequest(Base):
    __tablename__ = "admin_access_requests"

    id: _AdMapped[_ad_uuid.UUID] = _ad_mapped_column(
        _AdUUID(as_uuid=True),
        primary_key=True,
        default=_ad_uuid.uuid4,
    )
    code: _AdMapped[str] = _ad_mapped_column(
        _AdString(60),
        unique=True,
        nullable=False,
        index=True,
    )
    facility_id: _AdMapped[_ad_uuid.UUID] = _ad_mapped_column(
        _AdUUID(as_uuid=True),
        _AdForeignKey(
            "admin_facilities.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )
    request_type: _AdMapped[str] = _ad_mapped_column(
        _AdString(40),
        nullable=False,
        default="visitor",
        index=True,
    )
    person_name: _AdMapped[str] = _ad_mapped_column(
        _AdString(255),
        nullable=False,
        index=True,
    )
    organization: _AdMapped[str | None] = _ad_mapped_column(
        _AdString(255),
        nullable=True,
    )
    host_name: _AdMapped[str | None] = _ad_mapped_column(
        _AdString(180),
        nullable=True,
        index=True,
    )
    purpose: _AdMapped[str] = _ad_mapped_column(
        _AdText,
        nullable=False,
    )
    start_at: _AdMapped[object] = _ad_mapped_column(
        _AdDateTime(timezone=True),
        nullable=False,
        index=True,
    )
    end_at: _AdMapped[object | None] = _ad_mapped_column(
        _AdDateTime(timezone=True),
        nullable=True,
        index=True,
    )
    vehicle_plate: _AdMapped[str | None] = _ad_mapped_column(
        _AdString(80),
        nullable=True,
    )
    requested_by: _AdMapped[str] = _ad_mapped_column(
        _AdString(150),
        nullable=False,
        default="user",
    )
    approval_id: _AdMapped[_ad_uuid.UUID | None] = _ad_mapped_column(
        _AdUUID(as_uuid=True),
        _AdForeignKey("approvals.id"),
        nullable=True,
        index=True,
    )
    status: _AdMapped[str] = _ad_mapped_column(
        _AdString(30),
        nullable=False,
        default="draft",
        index=True,
    )
    checked_in_at: _AdMapped[object | None] = _ad_mapped_column(
        _AdDateTime(timezone=True),
        nullable=True,
    )
    checked_out_at: _AdMapped[object | None] = _ad_mapped_column(
        _AdDateTime(timezone=True),
        nullable=True,
    )
    notes: _AdMapped[str | None] = _ad_mapped_column(
        _AdText,
        nullable=True,
    )
    access_metadata: _AdMapped[dict] = _ad_mapped_column(
        _AdJSONB,
        nullable=False,
        default=dict,
    )
    created_at: _AdMapped[object] = _ad_mapped_column(
        _AdDateTime(timezone=True),
        server_default=_ad_func.now(),
        nullable=False,
    )
    updated_at: _AdMapped[object] = _ad_mapped_column(
        _AdDateTime(timezone=True),
        server_default=_ad_func.now(),
        onupdate=_ad_func.now(),
        nullable=False,
    )


class AdminCustodyAssignment(Base):
    __tablename__ = "admin_custody_assignments"

    id: _AdMapped[_ad_uuid.UUID] = _ad_mapped_column(
        _AdUUID(as_uuid=True),
        primary_key=True,
        default=_ad_uuid.uuid4,
    )
    code: _AdMapped[str] = _ad_mapped_column(
        _AdString(60),
        unique=True,
        nullable=False,
        index=True,
    )
    facility_id: _AdMapped[_ad_uuid.UUID | None] = _ad_mapped_column(
        _AdUUID(as_uuid=True),
        _AdForeignKey(
            "admin_facilities.id",
            ondelete="SET NULL",
        ),
        nullable=True,
        index=True,
    )
    finance_fixed_asset_id: _AdMapped[_ad_uuid.UUID | None] = _ad_mapped_column(
        _AdUUID(as_uuid=True),
        _AdForeignKey(
            "finance_fixed_assets.id",
            ondelete="SET NULL",
        ),
        nullable=True,
        index=True,
    )
    item_type: _AdMapped[str] = _ad_mapped_column(
        _AdString(60),
        nullable=False,
        index=True,
    )
    item_identifier: _AdMapped[str] = _ad_mapped_column(
        _AdString(180),
        nullable=False,
        index=True,
    )
    assigned_to_type: _AdMapped[str] = _ad_mapped_column(
        _AdString(40),
        nullable=False,
        default="employee",
        index=True,
    )
    assigned_to_reference: _AdMapped[str | None] = _ad_mapped_column(
        _AdString(180),
        nullable=True,
        index=True,
    )
    assigned_to_name: _AdMapped[str] = _ad_mapped_column(
        _AdString(255),
        nullable=False,
    )
    issued_by: _AdMapped[str] = _ad_mapped_column(
        _AdString(150),
        nullable=False,
        default="user",
    )
    issued_at: _AdMapped[object] = _ad_mapped_column(
        _AdDateTime(timezone=True),
        nullable=False,
        index=True,
    )
    due_return_at: _AdMapped[object | None] = _ad_mapped_column(
        _AdDateTime(timezone=True),
        nullable=True,
        index=True,
    )
    returned_at: _AdMapped[object | None] = _ad_mapped_column(
        _AdDateTime(timezone=True),
        nullable=True,
    )
    received_back_by: _AdMapped[str | None] = _ad_mapped_column(
        _AdString(150),
        nullable=True,
    )
    status: _AdMapped[str] = _ad_mapped_column(
        _AdString(30),
        nullable=False,
        default="issued",
        index=True,
    )
    notes: _AdMapped[str | None] = _ad_mapped_column(
        _AdText,
        nullable=True,
    )
    custody_metadata: _AdMapped[dict] = _ad_mapped_column(
        _AdJSONB,
        nullable=False,
        default=dict,
    )
    created_at: _AdMapped[object] = _ad_mapped_column(
        _AdDateTime(timezone=True),
        server_default=_ad_func.now(),
        nullable=False,
    )
    updated_at: _AdMapped[object] = _ad_mapped_column(
        _AdDateTime(timezone=True),
        server_default=_ad_func.now(),
        onupdate=_ad_func.now(),
        nullable=False,
    )


class AdminCorporateRecord(Base):
    __tablename__ = "admin_corporate_records"

    id: _AdMapped[_ad_uuid.UUID] = _ad_mapped_column(
        _AdUUID(as_uuid=True),
        primary_key=True,
        default=_ad_uuid.uuid4,
    )
    code: _AdMapped[str] = _ad_mapped_column(
        _AdString(60),
        unique=True,
        nullable=False,
        index=True,
    )
    title: _AdMapped[str] = _ad_mapped_column(
        _AdString(300),
        nullable=False,
        index=True,
    )
    record_category: _AdMapped[str] = _ad_mapped_column(
        _AdString(100),
        nullable=False,
        default="general",
        index=True,
    )
    owner_department: _AdMapped[str | None] = _ad_mapped_column(
        _AdString(120),
        nullable=True,
        index=True,
    )
    confidentiality_level: _AdMapped[str] = _ad_mapped_column(
        _AdString(30),
        nullable=False,
        default="confidential",
        index=True,
    )
    retention_until: _AdMapped[object | None] = _ad_mapped_column(
        _AdDate,
        nullable=True,
        index=True,
    )
    status: _AdMapped[str] = _ad_mapped_column(
        _AdString(30),
        nullable=False,
        default="active",
        index=True,
    )
    archived_at: _AdMapped[object | None] = _ad_mapped_column(
        _AdDateTime(timezone=True),
        nullable=True,
    )
    archived_by: _AdMapped[str | None] = _ad_mapped_column(
        _AdString(150),
        nullable=True,
    )
    archive_reason: _AdMapped[str | None] = _ad_mapped_column(
        _AdText,
        nullable=True,
    )
    notes: _AdMapped[str | None] = _ad_mapped_column(
        _AdText,
        nullable=True,
    )
    record_metadata: _AdMapped[dict] = _ad_mapped_column(
        _AdJSONB,
        nullable=False,
        default=dict,
    )
    created_at: _AdMapped[object] = _ad_mapped_column(
        _AdDateTime(timezone=True),
        server_default=_ad_func.now(),
        nullable=False,
    )
    updated_at: _AdMapped[object] = _ad_mapped_column(
        _AdDateTime(timezone=True),
        server_default=_ad_func.now(),
        onupdate=_ad_func.now(),
        nullable=False,
    )

# ============================================================
# Admin - Phase 1B
# Premises, company insurance, shared resources and bookings.
# ============================================================
import uuid as _adb_uuid

from sqlalchemy import (
    Date as _AdBDate,
    DateTime as _AdBDateTime,
    ForeignKey as _AdBForeignKey,
    Integer as _AdBInteger,
    Numeric as _AdBNumeric,
    String as _AdBString,
    Text as _AdBText,
    func as _adb_func,
)
from sqlalchemy.dialects.postgresql import (
    JSONB as _AdBJSONB,
    UUID as _AdBUUID,
)
from sqlalchemy.orm import (
    Mapped as _AdBMapped,
    mapped_column as _adb_mapped_column,
)


class AdminFacilityLease(Base):
    __tablename__ = "admin_facility_leases"

    id: _AdBMapped[_adb_uuid.UUID] = _adb_mapped_column(
        _AdBUUID(as_uuid=True),
        primary_key=True,
        default=_adb_uuid.uuid4,
    )
    code: _AdBMapped[str] = _adb_mapped_column(
        _AdBString(60),
        unique=True,
        nullable=False,
        index=True,
    )
    facility_id: _AdBMapped[_adb_uuid.UUID] = _adb_mapped_column(
        _AdBUUID(as_uuid=True),
        _AdBForeignKey("admin_facilities.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    counterparty_name: _AdBMapped[str] = _adb_mapped_column(
        _AdBString(255),
        nullable=False,
    )
    start_date: _AdBMapped[object] = _adb_mapped_column(
        _AdBDate,
        nullable=False,
        index=True,
    )
    end_date: _AdBMapped[object] = _adb_mapped_column(
        _AdBDate,
        nullable=False,
        index=True,
    )
    annual_value: _AdBMapped[float] = _adb_mapped_column(
        _AdBNumeric(18, 2),
        nullable=False,
        default=0,
    )
    currency: _AdBMapped[str] = _adb_mapped_column(
        _AdBString(10),
        nullable=False,
        default="SAR",
    )
    status: _AdBMapped[str] = _adb_mapped_column(
        _AdBString(40),
        nullable=False,
        default="draft",
        index=True,
    )
    approval_id: _AdBMapped[_adb_uuid.UUID | None] = _adb_mapped_column(
        _AdBUUID(as_uuid=True),
        _AdBForeignKey("approvals.id"),
        nullable=True,
        index=True,
    )
    executed_contract_reference: _AdBMapped[str | None] = _adb_mapped_column(
        _AdBString(500),
        nullable=True,
    )
    notes: _AdBMapped[str | None] = _adb_mapped_column(
        _AdBText,
        nullable=True,
    )
    lease_metadata: _AdBMapped[dict] = _adb_mapped_column(
        _AdBJSONB,
        nullable=False,
        default=dict,
    )
    created_at: _AdBMapped[object] = _adb_mapped_column(
        _AdBDateTime(timezone=True),
        server_default=_adb_func.now(),
        nullable=False,
    )
    updated_at: _AdBMapped[object] = _adb_mapped_column(
        _AdBDateTime(timezone=True),
        server_default=_adb_func.now(),
        onupdate=_adb_func.now(),
        nullable=False,
    )


class AdminInsuranceAuthorization(Base):
    __tablename__ = "admin_insurance_authorizations"

    id: _AdBMapped[_adb_uuid.UUID] = _adb_mapped_column(
        _AdBUUID(as_uuid=True),
        primary_key=True,
        default=_adb_uuid.uuid4,
    )
    code: _AdBMapped[str] = _adb_mapped_column(
        _AdBString(60),
        unique=True,
        nullable=False,
        index=True,
    )
    insurance_type: _AdBMapped[str] = _adb_mapped_column(
        _AdBString(80),
        nullable=False,
        index=True,
    )
    insurer_name: _AdBMapped[str | None] = _adb_mapped_column(
        _AdBString(255),
        nullable=True,
    )
    coverage_summary: _AdBMapped[str] = _adb_mapped_column(
        _AdBText,
        nullable=False,
    )
    proposed_premium: _AdBMapped[float] = _adb_mapped_column(
        _AdBNumeric(18, 2),
        nullable=False,
        default=0,
    )
    currency: _AdBMapped[str] = _adb_mapped_column(
        _AdBString(10),
        nullable=False,
        default="SAR",
    )
    effective_date: _AdBMapped[object | None] = _adb_mapped_column(
        _AdBDate,
        nullable=True,
        index=True,
    )
    expiry_date: _AdBMapped[object | None] = _adb_mapped_column(
        _AdBDate,
        nullable=True,
        index=True,
    )
    status: _AdBMapped[str] = _adb_mapped_column(
        _AdBString(40),
        nullable=False,
        default="draft",
        index=True,
    )
    approval_id: _AdBMapped[_adb_uuid.UUID | None] = _adb_mapped_column(
        _AdBUUID(as_uuid=True),
        _AdBForeignKey("approvals.id"),
        nullable=True,
        index=True,
    )
    policy_number: _AdBMapped[str | None] = _adb_mapped_column(
        _AdBString(150),
        nullable=True,
        index=True,
    )
    external_evidence_reference: _AdBMapped[str | None] = _adb_mapped_column(
        _AdBString(500),
        nullable=True,
    )
    compliance_record_id: _AdBMapped[_adb_uuid.UUID | None] = _adb_mapped_column(
        _AdBUUID(as_uuid=True),
        _AdBForeignKey(
            "hr_corporate_compliance_records.id",
            ondelete="SET NULL",
        ),
        nullable=True,
        index=True,
    )
    notes: _AdBMapped[str | None] = _adb_mapped_column(
        _AdBText,
        nullable=True,
    )
    insurance_metadata: _AdBMapped[dict] = _adb_mapped_column(
        _AdBJSONB,
        nullable=False,
        default=dict,
    )
    created_at: _AdBMapped[object] = _adb_mapped_column(
        _AdBDateTime(timezone=True),
        server_default=_adb_func.now(),
        nullable=False,
    )
    updated_at: _AdBMapped[object] = _adb_mapped_column(
        _AdBDateTime(timezone=True),
        server_default=_adb_func.now(),
        onupdate=_adb_func.now(),
        nullable=False,
    )


class AdminSharedResource(Base):
    __tablename__ = "admin_shared_resources"

    id: _AdBMapped[_adb_uuid.UUID] = _adb_mapped_column(
        _AdBUUID(as_uuid=True),
        primary_key=True,
        default=_adb_uuid.uuid4,
    )
    code: _AdBMapped[str] = _adb_mapped_column(
        _AdBString(60),
        unique=True,
        nullable=False,
        index=True,
    )
    facility_id: _AdBMapped[_adb_uuid.UUID | None] = _adb_mapped_column(
        _AdBUUID(as_uuid=True),
        _AdBForeignKey("admin_facilities.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    name: _AdBMapped[str] = _adb_mapped_column(
        _AdBString(255),
        nullable=False,
        index=True,
    )
    resource_type: _AdBMapped[str] = _adb_mapped_column(
        _AdBString(60),
        nullable=False,
        index=True,
    )
    capacity: _AdBMapped[int | None] = _adb_mapped_column(
        _AdBInteger,
        nullable=True,
    )
    status: _AdBMapped[str] = _adb_mapped_column(
        _AdBString(30),
        nullable=False,
        default="active",
        index=True,
    )
    notes: _AdBMapped[str | None] = _adb_mapped_column(
        _AdBText,
        nullable=True,
    )
    resource_metadata: _AdBMapped[dict] = _adb_mapped_column(
        _AdBJSONB,
        nullable=False,
        default=dict,
    )
    created_at: _AdBMapped[object] = _adb_mapped_column(
        _AdBDateTime(timezone=True),
        server_default=_adb_func.now(),
        nullable=False,
    )


class AdminResourceBooking(Base):
    __tablename__ = "admin_resource_bookings"

    id: _AdBMapped[_adb_uuid.UUID] = _adb_mapped_column(
        _AdBUUID(as_uuid=True),
        primary_key=True,
        default=_adb_uuid.uuid4,
    )
    code: _AdBMapped[str] = _adb_mapped_column(
        _AdBString(60),
        unique=True,
        nullable=False,
        index=True,
    )
    resource_id: _AdBMapped[_adb_uuid.UUID] = _adb_mapped_column(
        _AdBUUID(as_uuid=True),
        _AdBForeignKey(
            "admin_shared_resources.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )
    title: _AdBMapped[str] = _adb_mapped_column(
        _AdBString(255),
        nullable=False,
    )
    booked_by: _AdBMapped[str] = _adb_mapped_column(
        _AdBString(150),
        nullable=False,
    )
    start_at: _AdBMapped[object] = _adb_mapped_column(
        _AdBDateTime(timezone=True),
        nullable=False,
        index=True,
    )
    end_at: _AdBMapped[object] = _adb_mapped_column(
        _AdBDateTime(timezone=True),
        nullable=False,
        index=True,
    )
    status: _AdBMapped[str] = _adb_mapped_column(
        _AdBString(30),
        nullable=False,
        default="reserved",
        index=True,
    )
    notes: _AdBMapped[str | None] = _adb_mapped_column(
        _AdBText,
        nullable=True,
    )
    booking_metadata: _AdBMapped[dict] = _adb_mapped_column(
        _AdBJSONB,
        nullable=False,
        default=dict,
    )
    created_at: _AdBMapped[object] = _adb_mapped_column(
        _AdBDateTime(timezone=True),
        server_default=_adb_func.now(),
        nullable=False,
    )

# ============================================================
# Admin - Phase 1C
# Lease termination control + custody stocktake / reconciliation.
# ============================================================
import uuid as _adc_uuid

from sqlalchemy import (
    Date as _AdCDate,
    DateTime as _AdCDateTime,
    ForeignKey as _AdCForeignKey,
    String as _AdCString,
    Text as _AdCText,
    UniqueConstraint as _AdCUniqueConstraint,
    func as _adc_func,
)
from sqlalchemy.dialects.postgresql import UUID as _AdCUUID
from sqlalchemy.orm import (
    Mapped as _AdCMapped,
    mapped_column as _adc_mapped_column,
)


class AdminLeaseTermination(Base):
    __tablename__ = "admin_lease_terminations"

    id: _AdCMapped[_adc_uuid.UUID] = _adc_mapped_column(
        _AdCUUID(as_uuid=True),
        primary_key=True,
        default=_adc_uuid.uuid4,
    )
    lease_id: _AdCMapped[_adc_uuid.UUID] = _adc_mapped_column(
        _AdCUUID(as_uuid=True),
        _AdCForeignKey("admin_facility_leases.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True,
    )
    requested_by: _AdCMapped[str] = _adc_mapped_column(
        _AdCString(150),
        nullable=False,
    )
    reason: _AdCMapped[str | None] = _adc_mapped_column(
        _AdCText,
        nullable=True,
    )
    status: _AdCMapped[str] = _adc_mapped_column(
        _AdCString(40),
        nullable=False,
        default="pending_approval",
        index=True,
    )
    approval_id: _AdCMapped[_adc_uuid.UUID | None] = _adc_mapped_column(
        _AdCUUID(as_uuid=True),
        _AdCForeignKey("approvals.id"),
        nullable=True,
        index=True,
    )
    external_termination_reference: _AdCMapped[str | None] = _adc_mapped_column(
        _AdCString(500),
        nullable=True,
    )
    recorded_by: _AdCMapped[str | None] = _adc_mapped_column(
        _AdCString(150),
        nullable=True,
    )
    terminated_at: _AdCMapped[object | None] = _adc_mapped_column(
        _AdCDateTime(timezone=True),
        nullable=True,
    )
    created_at: _AdCMapped[object] = _adc_mapped_column(
        _AdCDateTime(timezone=True),
        server_default=_adc_func.now(),
        nullable=False,
    )
    updated_at: _AdCMapped[object] = _adc_mapped_column(
        _AdCDateTime(timezone=True),
        server_default=_adc_func.now(),
        onupdate=_adc_func.now(),
        nullable=False,
    )


class AdminCustodyStocktake(Base):
    __tablename__ = "admin_custody_stocktakes"

    id: _AdCMapped[_adc_uuid.UUID] = _adc_mapped_column(
        _AdCUUID(as_uuid=True),
        primary_key=True,
        default=_adc_uuid.uuid4,
    )
    code: _AdCMapped[str] = _adc_mapped_column(
        _AdCString(60),
        unique=True,
        nullable=False,
        index=True,
    )
    facility_id: _AdCMapped[_adc_uuid.UUID | None] = _adc_mapped_column(
        _AdCUUID(as_uuid=True),
        _AdCForeignKey("admin_facilities.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    stocktake_date: _AdCMapped[object] = _adc_mapped_column(
        _AdCDate,
        nullable=False,
        index=True,
    )
    performed_by: _AdCMapped[str] = _adc_mapped_column(
        _AdCString(150),
        nullable=False,
    )
    status: _AdCMapped[str] = _adc_mapped_column(
        _AdCString(30),
        nullable=False,
        default="draft",
        index=True,
    )
    notes: _AdCMapped[str | None] = _adc_mapped_column(
        _AdCText,
        nullable=True,
    )
    completed_at: _AdCMapped[object | None] = _adc_mapped_column(
        _AdCDateTime(timezone=True),
        nullable=True,
    )
    created_at: _AdCMapped[object] = _adc_mapped_column(
        _AdCDateTime(timezone=True),
        server_default=_adc_func.now(),
        nullable=False,
    )
    updated_at: _AdCMapped[object] = _adc_mapped_column(
        _AdCDateTime(timezone=True),
        server_default=_adc_func.now(),
        onupdate=_adc_func.now(),
        nullable=False,
    )


class AdminCustodyStocktakeItem(Base):
    __tablename__ = "admin_custody_stocktake_items"
    __table_args__ = (
        _AdCUniqueConstraint(
            "stocktake_id",
            "custody_id",
            name="uq_admin_stocktake_custody",
        ),
    )

    id: _AdCMapped[_adc_uuid.UUID] = _adc_mapped_column(
        _AdCUUID(as_uuid=True),
        primary_key=True,
        default=_adc_uuid.uuid4,
    )
    stocktake_id: _AdCMapped[_adc_uuid.UUID] = _adc_mapped_column(
        _AdCUUID(as_uuid=True),
        _AdCForeignKey("admin_custody_stocktakes.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    custody_id: _AdCMapped[_adc_uuid.UUID] = _adc_mapped_column(
        _AdCUUID(as_uuid=True),
        _AdCForeignKey("admin_custody_assignments.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    observed_status: _AdCMapped[str] = _adc_mapped_column(
        _AdCString(30),
        nullable=False,
        default="pending",
        index=True,
    )
    observed_by: _AdCMapped[str | None] = _adc_mapped_column(
        _AdCString(150),
        nullable=True,
    )
    observed_at: _AdCMapped[object | None] = _adc_mapped_column(
        _AdCDateTime(timezone=True),
        nullable=True,
    )
    notes: _AdCMapped[str | None] = _adc_mapped_column(
        _AdCText,
        nullable=True,
    )

# ============================================================
# Legal - Phase 1A
# Contract / NDA governance, legal review and legal matters.
# Existing Sales, Procurement, HR Compliance, Policy and
# Unified Attachments remain authoritative in their domains.
# ============================================================
import uuid as _leg_uuid

from sqlalchemy import (
    Boolean as _LegBoolean,
    Date as _LegDate,
    DateTime as _LegDateTime,
    ForeignKey as _LegForeignKey,
    Integer as _LegInteger,
    JSON as _LegJSON,
    String as _LegString,
    Text as _LegText,
    UniqueConstraint as _LegUniqueConstraint,
    func as _leg_func,
)
from sqlalchemy.dialects.postgresql import (
    JSONB as _LegJSONB,
    UUID as _LegUUID,
)
from sqlalchemy.orm import (
    Mapped as _LegMapped,
    mapped_column as _leg_mapped_column,
)


class LegalContract(Base):
    __tablename__ = "legal_contracts"

    id: _LegMapped[_leg_uuid.UUID] = _leg_mapped_column(
        _LegUUID(as_uuid=True),
        primary_key=True,
        default=_leg_uuid.uuid4,
    )
    code: _LegMapped[str] = _leg_mapped_column(
        _LegString(80),
        unique=True,
        nullable=False,
        index=True,
    )
    contract_type: _LegMapped[str] = _leg_mapped_column(
        _LegString(60),
        nullable=False,
        index=True,
    )
    title: _LegMapped[str] = _leg_mapped_column(
        _LegString(300),
        nullable=False,
        index=True,
    )
    counterparty_name: _LegMapped[str] = _leg_mapped_column(
        _LegString(300),
        nullable=False,
        index=True,
    )
    owner_department: _LegMapped[str | None] = _leg_mapped_column(
        _LegString(120),
        nullable=True,
        index=True,
    )
    source_module: _LegMapped[str | None] = _leg_mapped_column(
        _LegString(80),
        nullable=True,
        index=True,
    )
    source_entity_id: _LegMapped[_leg_uuid.UUID | None] = _leg_mapped_column(
        _LegUUID(as_uuid=True),
        nullable=True,
        index=True,
    )
    effective_date: _LegMapped[object | None] = _leg_mapped_column(
        _LegDate,
        nullable=True,
        index=True,
    )
    expiry_date: _LegMapped[object | None] = _leg_mapped_column(
        _LegDate,
        nullable=True,
        index=True,
    )
    auto_renew: _LegMapped[bool] = _leg_mapped_column(
        _LegBoolean,
        nullable=False,
        default=False,
    )
    notice_days: _LegMapped[int | None] = _leg_mapped_column(
        _LegInteger,
        nullable=True,
    )
    governing_law: _LegMapped[str | None] = _leg_mapped_column(
        _LegString(200),
        nullable=True,
    )
    jurisdiction: _LegMapped[str | None] = _leg_mapped_column(
        _LegString(200),
        nullable=True,
    )
    confidentiality_required: _LegMapped[bool] = _leg_mapped_column(
        _LegBoolean,
        nullable=False,
        default=False,
    )
    data_processing_involved: _LegMapped[bool] = _leg_mapped_column(
        _LegBoolean,
        nullable=False,
        default=False,
    )
    unlimited_liability: _LegMapped[bool] = _leg_mapped_column(
        _LegBoolean,
        nullable=False,
        default=False,
    )
    material_indemnity: _LegMapped[bool] = _leg_mapped_column(
        _LegBoolean,
        nullable=False,
        default=False,
    )
    status: _LegMapped[str] = _leg_mapped_column(
        _LegString(40),
        nullable=False,
        default="draft",
        index=True,
    )
    approval_id: _LegMapped[_leg_uuid.UUID | None] = _leg_mapped_column(
        _LegUUID(as_uuid=True),
        _LegForeignKey("approvals.id"),
        nullable=True,
        index=True,
    )
    external_execution_reference: _LegMapped[str | None] = _leg_mapped_column(
        _LegString(500),
        nullable=True,
    )
    executed_at: _LegMapped[object | None] = _leg_mapped_column(
        _LegDateTime(timezone=True),
        nullable=True,
    )
    notes: _LegMapped[str | None] = _leg_mapped_column(
        _LegText,
        nullable=True,
    )
    contract_metadata: _LegMapped[dict] = _leg_mapped_column(
        _LegJSONB,
        nullable=False,
        default=dict,
    )
    created_at: _LegMapped[object] = _leg_mapped_column(
        _LegDateTime(timezone=True),
        server_default=_leg_func.now(),
        nullable=False,
    )
    updated_at: _LegMapped[object] = _leg_mapped_column(
        _LegDateTime(timezone=True),
        server_default=_leg_func.now(),
        onupdate=_leg_func.now(),
        nullable=False,
    )


class LegalContractReview(Base):
    __tablename__ = "legal_contract_reviews"
    __table_args__ = (
        _LegUniqueConstraint(
            "contract_id",
            "review_round",
            name="uq_legal_contract_review_round",
        ),
    )

    id: _LegMapped[_leg_uuid.UUID] = _leg_mapped_column(
        _LegUUID(as_uuid=True),
        primary_key=True,
        default=_leg_uuid.uuid4,
    )
    contract_id: _LegMapped[_leg_uuid.UUID] = _leg_mapped_column(
        _LegUUID(as_uuid=True),
        _LegForeignKey("legal_contracts.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    review_round: _LegMapped[int] = _leg_mapped_column(
        _LegInteger,
        nullable=False,
        default=1,
    )
    review_type: _LegMapped[str] = _leg_mapped_column(
        _LegString(50),
        nullable=False,
        default="standard",
        index=True,
    )
    risk_level: _LegMapped[str] = _leg_mapped_column(
        _LegString(20),
        nullable=False,
        default="medium",
        index=True,
    )
    reviewer: _LegMapped[str] = _leg_mapped_column(
        _LegString(150),
        nullable=False,
    )
    deviations_summary: _LegMapped[str | None] = _leg_mapped_column(
        _LegText,
        nullable=True,
    )
    liability_summary: _LegMapped[str | None] = _leg_mapped_column(
        _LegText,
        nullable=True,
    )
    indemnity_summary: _LegMapped[str | None] = _leg_mapped_column(
        _LegText,
        nullable=True,
    )
    privacy_summary: _LegMapped[str | None] = _leg_mapped_column(
        _LegText,
        nullable=True,
    )
    recommendation: _LegMapped[str | None] = _leg_mapped_column(
        _LegText,
        nullable=True,
    )
    status: _LegMapped[str] = _leg_mapped_column(
        _LegString(30),
        nullable=False,
        default="completed",
        index=True,
    )
    created_at: _LegMapped[object] = _leg_mapped_column(
        _LegDateTime(timezone=True),
        server_default=_leg_func.now(),
        nullable=False,
    )
    updated_at: _LegMapped[object] = _leg_mapped_column(
        _LegDateTime(timezone=True),
        server_default=_leg_func.now(),
        onupdate=_leg_func.now(),
        nullable=False,
    )


class LegalMatter(Base):
    __tablename__ = "legal_matters"

    id: _LegMapped[_leg_uuid.UUID] = _leg_mapped_column(
        _LegUUID(as_uuid=True),
        primary_key=True,
        default=_leg_uuid.uuid4,
    )
    code: _LegMapped[str] = _leg_mapped_column(
        _LegString(80),
        unique=True,
        nullable=False,
        index=True,
    )
    matter_type: _LegMapped[str] = _leg_mapped_column(
        _LegString(60),
        nullable=False,
        index=True,
    )
    title: _LegMapped[str] = _leg_mapped_column(
        _LegString(300),
        nullable=False,
        index=True,
    )
    counterparty_name: _LegMapped[str | None] = _leg_mapped_column(
        _LegString(300),
        nullable=True,
        index=True,
    )
    owner: _LegMapped[str] = _leg_mapped_column(
        _LegString(150),
        nullable=False,
        index=True,
    )
    risk_level: _LegMapped[str] = _leg_mapped_column(
        _LegString(20),
        nullable=False,
        default="medium",
        index=True,
    )
    opened_date: _LegMapped[object] = _leg_mapped_column(
        _LegDate,
        nullable=False,
        index=True,
    )
    due_date: _LegMapped[object | None] = _leg_mapped_column(
        _LegDate,
        nullable=True,
        index=True,
    )
    summary: _LegMapped[str] = _leg_mapped_column(
        _LegText,
        nullable=False,
    )
    status: _LegMapped[str] = _leg_mapped_column(
        _LegString(30),
        nullable=False,
        default="open",
        index=True,
    )
    outcome_summary: _LegMapped[str | None] = _leg_mapped_column(
        _LegText,
        nullable=True,
    )
    closed_at: _LegMapped[object | None] = _leg_mapped_column(
        _LegDateTime(timezone=True),
        nullable=True,
    )
    notes: _LegMapped[str | None] = _leg_mapped_column(
        _LegText,
        nullable=True,
    )
    matter_metadata: _LegMapped[dict] = _leg_mapped_column(
        _LegJSONB,
        nullable=False,
        default=dict,
    )
    created_at: _LegMapped[object] = _leg_mapped_column(
        _LegDateTime(timezone=True),
        server_default=_leg_func.now(),
        nullable=False,
    )
    updated_at: _LegMapped[object] = _leg_mapped_column(
        _LegDateTime(timezone=True),
        server_default=_leg_func.now(),
        onupdate=_leg_func.now(),
        nullable=False,
    )

# ============================================================
# Legal - Phase 1B
# Privacy operations, data-sharing governance, DPIA,
# gifts/hospitality and evidence-based third-party integrity.
# ============================================================
import uuid as _legb_uuid

from sqlalchemy import (
    Boolean as _LegBBoolean,
    Date as _LegBDate,
    DateTime as _LegBDateTime,
    ForeignKey as _LegBForeignKey,
    Numeric as _LegBNumeric,
    String as _LegBString,
    Text as _LegBText,
    func as _legb_func,
)
from sqlalchemy.dialects.postgresql import (
    JSONB as _LegBJSONB,
    UUID as _LegBUUID,
)
from sqlalchemy.orm import (
    Mapped as _LegBMapped,
    mapped_column as _legb_mapped_column,
)


class LegalPrivacyRequest(Base):
    __tablename__ = "legal_privacy_requests"

    id: _LegBMapped[_legb_uuid.UUID] = _legb_mapped_column(
        _LegBUUID(as_uuid=True),
        primary_key=True,
        default=_legb_uuid.uuid4,
    )
    code: _LegBMapped[str] = _legb_mapped_column(
        _LegBString(80),
        unique=True,
        nullable=False,
        index=True,
    )
    request_type: _LegBMapped[str] = _legb_mapped_column(
        _LegBString(40),
        nullable=False,
        index=True,
    )
    subject_type: _LegBMapped[str] = _legb_mapped_column(
        _LegBString(40),
        nullable=False,
        index=True,
    )
    subject_reference: _LegBMapped[str | None] = _legb_mapped_column(
        _LegBString(180),
        nullable=True,
        index=True,
    )
    received_date: _LegBMapped[object] = _legb_mapped_column(
        _LegBDate,
        nullable=False,
        index=True,
    )
    due_date: _LegBMapped[object] = _legb_mapped_column(
        _LegBDate,
        nullable=False,
        index=True,
    )
    identity_verified: _LegBMapped[bool] = _legb_mapped_column(
        _LegBBoolean,
        nullable=False,
        default=False,
    )
    identity_evidence_reference: _LegBMapped[str | None] = _legb_mapped_column(
        _LegBString(500),
        nullable=True,
    )
    status: _LegBMapped[str] = _legb_mapped_column(
        _LegBString(40),
        nullable=False,
        default="open",
        index=True,
    )
    external_response_reference: _LegBMapped[str | None] = _legb_mapped_column(
        _LegBString(500),
        nullable=True,
    )
    completed_by: _LegBMapped[str | None] = _legb_mapped_column(
        _LegBString(150),
        nullable=True,
    )
    completed_at: _LegBMapped[object | None] = _legb_mapped_column(
        _LegBDateTime(timezone=True),
        nullable=True,
    )
    notes: _LegBMapped[str | None] = _legb_mapped_column(
        _LegBText,
        nullable=True,
    )
    privacy_metadata: _LegBMapped[dict] = _legb_mapped_column(
        _LegBJSONB,
        nullable=False,
        default=dict,
    )
    created_at: _LegBMapped[object] = _legb_mapped_column(
        _LegBDateTime(timezone=True),
        server_default=_legb_func.now(),
        nullable=False,
    )
    updated_at: _LegBMapped[object] = _legb_mapped_column(
        _LegBDateTime(timezone=True),
        server_default=_legb_func.now(),
        onupdate=_legb_func.now(),
        nullable=False,
    )


class LegalDataSharingAssessment(Base):
    __tablename__ = "legal_data_sharing_assessments"

    id: _LegBMapped[_legb_uuid.UUID] = _legb_mapped_column(
        _LegBUUID(as_uuid=True),
        primary_key=True,
        default=_legb_uuid.uuid4,
    )
    code: _LegBMapped[str] = _legb_mapped_column(
        _LegBString(80),
        unique=True,
        nullable=False,
        index=True,
    )
    recipient_name: _LegBMapped[str] = _legb_mapped_column(
        _LegBString(300),
        nullable=False,
        index=True,
    )
    purpose: _LegBMapped[str] = _legb_mapped_column(
        _LegBText,
        nullable=False,
    )
    legal_basis: _LegBMapped[str] = _legb_mapped_column(
        _LegBString(200),
        nullable=False,
    )
    data_categories: _LegBMapped[str] = _legb_mapped_column(
        _LegBText,
        nullable=False,
    )
    cross_border: _LegBMapped[bool] = _legb_mapped_column(
        _LegBBoolean,
        nullable=False,
        default=False,
    )
    dpa_required: _LegBMapped[bool] = _legb_mapped_column(
        _LegBBoolean,
        nullable=False,
        default=False,
    )
    risk_level: _LegBMapped[str] = _legb_mapped_column(
        _LegBString(20),
        nullable=False,
        default="medium",
        index=True,
    )
    status: _LegBMapped[str] = _legb_mapped_column(
        _LegBString(40),
        nullable=False,
        default="draft",
        index=True,
    )
    approval_id: _LegBMapped[_legb_uuid.UUID | None] = _legb_mapped_column(
        _LegBUUID(as_uuid=True),
        _LegBForeignKey("approvals.id"),
        nullable=True,
        index=True,
    )
    external_execution_reference: _LegBMapped[str | None] = _legb_mapped_column(
        _LegBString(500),
        nullable=True,
    )
    executed_at: _LegBMapped[object | None] = _legb_mapped_column(
        _LegBDateTime(timezone=True),
        nullable=True,
    )
    notes: _LegBMapped[str | None] = _legb_mapped_column(
        _LegBText,
        nullable=True,
    )
    assessment_metadata: _LegBMapped[dict] = _legb_mapped_column(
        _LegBJSONB,
        nullable=False,
        default=dict,
    )
    created_at: _LegBMapped[object] = _legb_mapped_column(
        _LegBDateTime(timezone=True),
        server_default=_legb_func.now(),
        nullable=False,
    )
    updated_at: _LegBMapped[object] = _legb_mapped_column(
        _LegBDateTime(timezone=True),
        server_default=_legb_func.now(),
        onupdate=_legb_func.now(),
        nullable=False,
    )


class LegalPrivacyImpactAssessment(Base):
    __tablename__ = "legal_privacy_impact_assessments"

    id: _LegBMapped[_legb_uuid.UUID] = _legb_mapped_column(
        _LegBUUID(as_uuid=True),
        primary_key=True,
        default=_legb_uuid.uuid4,
    )
    code: _LegBMapped[str] = _legb_mapped_column(
        _LegBString(80),
        unique=True,
        nullable=False,
        index=True,
    )
    title: _LegBMapped[str] = _legb_mapped_column(
        _LegBString(300),
        nullable=False,
        index=True,
    )
    owner: _LegBMapped[str] = _legb_mapped_column(
        _LegBString(150),
        nullable=False,
        index=True,
    )
    trigger_reason: _LegBMapped[str] = _legb_mapped_column(
        _LegBText,
        nullable=False,
    )
    processing_summary: _LegBMapped[str] = _legb_mapped_column(
        _LegBText,
        nullable=False,
    )
    high_risk_processing: _LegBMapped[bool] = _legb_mapped_column(
        _LegBBoolean,
        nullable=False,
        default=False,
    )
    sensitive_data: _LegBMapped[bool] = _legb_mapped_column(
        _LegBBoolean,
        nullable=False,
        default=False,
    )
    cross_border: _LegBMapped[bool] = _legb_mapped_column(
        _LegBBoolean,
        nullable=False,
        default=False,
    )
    safeguards_summary: _LegBMapped[str | None] = _legb_mapped_column(
        _LegBText,
        nullable=True,
    )
    residual_risk: _LegBMapped[str] = _legb_mapped_column(
        _LegBString(20),
        nullable=False,
        default="medium",
        index=True,
    )
    status: _LegBMapped[str] = _legb_mapped_column(
        _LegBString(40),
        nullable=False,
        default="draft",
        index=True,
    )
    approval_id: _LegBMapped[_legb_uuid.UUID | None] = _legb_mapped_column(
        _LegBUUID(as_uuid=True),
        _LegBForeignKey("approvals.id"),
        nullable=True,
        index=True,
    )
    completed_by: _LegBMapped[str | None] = _legb_mapped_column(
        _LegBString(150),
        nullable=True,
    )
    completed_at: _LegBMapped[object | None] = _legb_mapped_column(
        _LegBDateTime(timezone=True),
        nullable=True,
    )
    notes: _LegBMapped[str | None] = _legb_mapped_column(
        _LegBText,
        nullable=True,
    )
    dpia_metadata: _LegBMapped[dict] = _legb_mapped_column(
        _LegBJSONB,
        nullable=False,
        default=dict,
    )
    created_at: _LegBMapped[object] = _legb_mapped_column(
        _LegBDateTime(timezone=True),
        server_default=_legb_func.now(),
        nullable=False,
    )
    updated_at: _LegBMapped[object] = _legb_mapped_column(
        _LegBDateTime(timezone=True),
        server_default=_legb_func.now(),
        onupdate=_legb_func.now(),
        nullable=False,
    )


class LegalGiftHospitality(Base):
    __tablename__ = "legal_gifts_hospitality"

    id: _LegBMapped[_legb_uuid.UUID] = _legb_mapped_column(
        _LegBUUID(as_uuid=True),
        primary_key=True,
        default=_legb_uuid.uuid4,
    )
    code: _LegBMapped[str] = _legb_mapped_column(
        _LegBString(80),
        unique=True,
        nullable=False,
        index=True,
    )
    direction: _LegBMapped[str] = _legb_mapped_column(
        _LegBString(20),
        nullable=False,
        index=True,
    )
    category: _LegBMapped[str] = _legb_mapped_column(
        _LegBString(50),
        nullable=False,
        index=True,
    )
    counterparty_name: _LegBMapped[str] = _legb_mapped_column(
        _LegBString(300),
        nullable=False,
        index=True,
    )
    business_context: _LegBMapped[str] = _legb_mapped_column(
        _LegBText,
        nullable=False,
    )
    estimated_value: _LegBMapped[float] = _legb_mapped_column(
        _LegBNumeric(18, 2),
        nullable=False,
        default=0,
    )
    currency: _LegBMapped[str] = _legb_mapped_column(
        _LegBString(10),
        nullable=False,
        default="SAR",
    )
    government_related: _LegBMapped[bool] = _legb_mapped_column(
        _LegBBoolean,
        nullable=False,
        default=False,
    )
    conflict_indicated: _LegBMapped[bool] = _legb_mapped_column(
        _LegBBoolean,
        nullable=False,
        default=False,
    )
    threshold_exceeded: _LegBMapped[bool] = _legb_mapped_column(
        _LegBBoolean,
        nullable=False,
        default=False,
    )
    requires_approval: _LegBMapped[bool] = _legb_mapped_column(
        _LegBBoolean,
        nullable=False,
        default=False,
        index=True,
    )
    status: _LegBMapped[str] = _legb_mapped_column(
        _LegBString(40),
        nullable=False,
        default="draft",
        index=True,
    )
    approval_id: _LegBMapped[_legb_uuid.UUID | None] = _legb_mapped_column(
        _LegBUUID(as_uuid=True),
        _LegBForeignKey("approvals.id"),
        nullable=True,
        index=True,
    )
    disposition: _LegBMapped[str | None] = _legb_mapped_column(
        _LegBString(80),
        nullable=True,
    )
    external_evidence_reference: _LegBMapped[str | None] = _legb_mapped_column(
        _LegBString(500),
        nullable=True,
    )
    notes: _LegBMapped[str | None] = _legb_mapped_column(
        _LegBText,
        nullable=True,
    )
    gift_metadata: _LegBMapped[dict] = _legb_mapped_column(
        _LegBJSONB,
        nullable=False,
        default=dict,
    )
    created_at: _LegBMapped[object] = _legb_mapped_column(
        _LegBDateTime(timezone=True),
        server_default=_legb_func.now(),
        nullable=False,
    )
    updated_at: _LegBMapped[object] = _legb_mapped_column(
        _LegBDateTime(timezone=True),
        server_default=_legb_func.now(),
        onupdate=_legb_func.now(),
        nullable=False,
    )


class LegalThirdPartyIntegrityScreening(Base):
    __tablename__ = "legal_third_party_integrity_screenings"

    id: _LegBMapped[_legb_uuid.UUID] = _legb_mapped_column(
        _LegBUUID(as_uuid=True),
        primary_key=True,
        default=_legb_uuid.uuid4,
    )
    code: _LegBMapped[str] = _legb_mapped_column(
        _LegBString(80),
        unique=True,
        nullable=False,
        index=True,
    )
    party_type: _LegBMapped[str] = _legb_mapped_column(
        _LegBString(30),
        nullable=False,
        index=True,
    )
    party_name: _LegBMapped[str] = _legb_mapped_column(
        _LegBString(300),
        nullable=False,
        index=True,
    )
    source_module: _LegBMapped[str | None] = _legb_mapped_column(
        _LegBString(80),
        nullable=True,
        index=True,
    )
    source_entity_id: _LegBMapped[_legb_uuid.UUID | None] = _legb_mapped_column(
        _LegBUUID(as_uuid=True),
        nullable=True,
        index=True,
    )
    risk_level: _LegBMapped[str] = _legb_mapped_column(
        _LegBString(20),
        nullable=False,
        default="medium",
        index=True,
    )
    sanctions_result: _LegBMapped[str] = _legb_mapped_column(
        _LegBString(30),
        nullable=False,
        default="not_checked",
        index=True,
    )
    conflict_result: _LegBMapped[str] = _legb_mapped_column(
        _LegBString(30),
        nullable=False,
        default="not_checked",
        index=True,
    )
    adverse_media_result: _LegBMapped[str] = _legb_mapped_column(
        _LegBString(30),
        nullable=False,
        default="not_checked",
        index=True,
    )
    overall_result: _LegBMapped[str] = _legb_mapped_column(
        _LegBString(30),
        nullable=False,
        default="pending",
        index=True,
    )
    evidence_reference: _LegBMapped[str | None] = _legb_mapped_column(
        _LegBString(500),
        nullable=True,
    )
    screened_by: _LegBMapped[str | None] = _legb_mapped_column(
        _LegBString(150),
        nullable=True,
    )
    screened_at: _LegBMapped[object | None] = _legb_mapped_column(
        _LegBDateTime(timezone=True),
        nullable=True,
    )
    status: _LegBMapped[str] = _legb_mapped_column(
        _LegBString(30),
        nullable=False,
        default="pending",
        index=True,
    )
    notes: _LegBMapped[str | None] = _legb_mapped_column(
        _LegBText,
        nullable=True,
    )
    screening_metadata: _LegBMapped[dict] = _legb_mapped_column(
        _LegBJSONB,
        nullable=False,
        default=dict,
    )
    created_at: _LegBMapped[object] = _legb_mapped_column(
        _LegBDateTime(timezone=True),
        server_default=_legb_func.now(),
        nullable=False,
    )
    updated_at: _LegBMapped[object] = _legb_mapped_column(
        _LegBDateTime(timezone=True),
        server_default=_legb_func.now(),
        onupdate=_legb_func.now(),
        nullable=False,
    )

# ============================================================
# Legal - Phase 1C
# Delegations / representation, IP registration control,
# material legal actions and legal holds.
# ============================================================
import uuid as _legc_uuid

from sqlalchemy import (
    Boolean as _LegCBoolean,
    Date as _LegCDate,
    DateTime as _LegCDateTime,
    ForeignKey as _LegCForeignKey,
    Numeric as _LegCNumeric,
    String as _LegCString,
    Text as _LegCText,
    func as _legc_func,
)
from sqlalchemy.dialects.postgresql import (
    JSONB as _LegCJSONB,
    UUID as _LegCUUID,
)
from sqlalchemy.orm import (
    Mapped as _LegCMapped,
    mapped_column as _legc_mapped_column,
)


class LegalAuthorityDelegation(Base):
    __tablename__ = "legal_authority_delegations"

    id: _LegCMapped[_legc_uuid.UUID] = _legc_mapped_column(
        _LegCUUID(as_uuid=True),
        primary_key=True,
        default=_legc_uuid.uuid4,
    )
    code: _LegCMapped[str] = _legc_mapped_column(
        _LegCString(80),
        unique=True,
        nullable=False,
        index=True,
    )
    authorization_type: _LegCMapped[str] = _legc_mapped_column(
        _LegCString(50),
        nullable=False,
        index=True,
    )
    grantee_name: _LegCMapped[str] = _legc_mapped_column(
        _LegCString(250),
        nullable=False,
        index=True,
    )
    grantee_role: _LegCMapped[str | None] = _legc_mapped_column(
        _LegCString(180),
        nullable=True,
    )
    scope_summary: _LegCMapped[str] = _legc_mapped_column(
        _LegCText,
        nullable=False,
    )
    effective_date: _LegCMapped[object] = _legc_mapped_column(
        _LegCDate,
        nullable=False,
        index=True,
    )
    expiry_date: _LegCMapped[object | None] = _legc_mapped_column(
        _LegCDate,
        nullable=True,
        index=True,
    )
    status: _LegCMapped[str] = _legc_mapped_column(
        _LegCString(40),
        nullable=False,
        default="draft",
        index=True,
    )
    approval_id: _LegCMapped[_legc_uuid.UUID | None] = _legc_mapped_column(
        _LegCUUID(as_uuid=True),
        _LegCForeignKey("approvals.id"),
        nullable=True,
        index=True,
    )
    external_evidence_reference: _LegCMapped[str | None] = _legc_mapped_column(
        _LegCString(500),
        nullable=True,
    )
    activated_at: _LegCMapped[object | None] = _legc_mapped_column(
        _LegCDateTime(timezone=True),
        nullable=True,
    )
    revocation_approval_id: _LegCMapped[_legc_uuid.UUID | None] = _legc_mapped_column(
        _LegCUUID(as_uuid=True),
        _LegCForeignKey("approvals.id"),
        nullable=True,
        index=True,
    )
    revocation_evidence_reference: _LegCMapped[str | None] = _legc_mapped_column(
        _LegCString(500),
        nullable=True,
    )
    revoked_at: _LegCMapped[object | None] = _legc_mapped_column(
        _LegCDateTime(timezone=True),
        nullable=True,
    )
    notes: _LegCMapped[str | None] = _legc_mapped_column(
        _LegCText,
        nullable=True,
    )
    delegation_metadata: _LegCMapped[dict] = _legc_mapped_column(
        _LegCJSONB,
        nullable=False,
        default=dict,
    )
    created_at: _LegCMapped[object] = _legc_mapped_column(
        _LegCDateTime(timezone=True),
        server_default=_legc_func.now(),
        nullable=False,
    )
    updated_at: _LegCMapped[object] = _legc_mapped_column(
        _LegCDateTime(timezone=True),
        server_default=_legc_func.now(),
        onupdate=_legc_func.now(),
        nullable=False,
    )


class LegalIPAsset(Base):
    __tablename__ = "legal_ip_assets"

    id: _LegCMapped[_legc_uuid.UUID] = _legc_mapped_column(
        _LegCUUID(as_uuid=True),
        primary_key=True,
        default=_legc_uuid.uuid4,
    )
    code: _LegCMapped[str] = _legc_mapped_column(
        _LegCString(80),
        unique=True,
        nullable=False,
        index=True,
    )
    asset_type: _LegCMapped[str] = _legc_mapped_column(
        _LegCString(50),
        nullable=False,
        index=True,
    )
    asset_name: _LegCMapped[str] = _legc_mapped_column(
        _LegCString(300),
        nullable=False,
        index=True,
    )
    owner_entity: _LegCMapped[str] = _legc_mapped_column(
        _LegCString(300),
        nullable=False,
    )
    jurisdiction: _LegCMapped[str | None] = _legc_mapped_column(
        _LegCString(180),
        nullable=True,
    )
    status: _LegCMapped[str] = _legc_mapped_column(
        _LegCString(40),
        nullable=False,
        default="draft",
        index=True,
    )
    approval_id: _LegCMapped[_legc_uuid.UUID | None] = _legc_mapped_column(
        _LegCUUID(as_uuid=True),
        _LegCForeignKey("approvals.id"),
        nullable=True,
        index=True,
    )
    application_number: _LegCMapped[str | None] = _legc_mapped_column(
        _LegCString(180),
        nullable=True,
        index=True,
    )
    filing_reference: _LegCMapped[str | None] = _legc_mapped_column(
        _LegCString(500),
        nullable=True,
    )
    filing_date: _LegCMapped[object | None] = _legc_mapped_column(
        _LegCDate,
        nullable=True,
        index=True,
    )
    registration_number: _LegCMapped[str | None] = _legc_mapped_column(
        _LegCString(180),
        nullable=True,
        index=True,
    )
    registration_date: _LegCMapped[object | None] = _legc_mapped_column(
        _LegCDate,
        nullable=True,
    )
    expiry_date: _LegCMapped[object | None] = _legc_mapped_column(
        _LegCDate,
        nullable=True,
        index=True,
    )
    registration_evidence_reference: _LegCMapped[str | None] = _legc_mapped_column(
        _LegCString(500),
        nullable=True,
    )
    notes: _LegCMapped[str | None] = _legc_mapped_column(
        _LegCText,
        nullable=True,
    )
    ip_metadata: _LegCMapped[dict] = _legc_mapped_column(
        _LegCJSONB,
        nullable=False,
        default=dict,
    )
    created_at: _LegCMapped[object] = _legc_mapped_column(
        _LegCDateTime(timezone=True),
        server_default=_legc_func.now(),
        nullable=False,
    )
    updated_at: _LegCMapped[object] = _legc_mapped_column(
        _LegCDateTime(timezone=True),
        server_default=_legc_func.now(),
        onupdate=_legc_func.now(),
        nullable=False,
    )


class LegalMatterAction(Base):
    __tablename__ = "legal_matter_actions"

    id: _LegCMapped[_legc_uuid.UUID] = _legc_mapped_column(
        _LegCUUID(as_uuid=True),
        primary_key=True,
        default=_legc_uuid.uuid4,
    )
    matter_id: _LegCMapped[_legc_uuid.UUID] = _legc_mapped_column(
        _LegCUUID(as_uuid=True),
        _LegCForeignKey("legal_matters.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    code: _LegCMapped[str] = _legc_mapped_column(
        _LegCString(80),
        unique=True,
        nullable=False,
        index=True,
    )
    action_type: _LegCMapped[str] = _legc_mapped_column(
        _LegCString(60),
        nullable=False,
        index=True,
    )
    description: _LegCMapped[str] = _legc_mapped_column(
        _LegCText,
        nullable=False,
    )
    amount: _LegCMapped[float | None] = _legc_mapped_column(
        _LegCNumeric(18, 2),
        nullable=True,
    )
    currency: _LegCMapped[str] = _legc_mapped_column(
        _LegCString(10),
        nullable=False,
        default="SAR",
    )
    risk_level: _LegCMapped[str] = _legc_mapped_column(
        _LegCString(20),
        nullable=False,
        default="high",
        index=True,
    )
    status: _LegCMapped[str] = _legc_mapped_column(
        _LegCString(40),
        nullable=False,
        default="draft",
        index=True,
    )
    approval_id: _LegCMapped[_legc_uuid.UUID | None] = _legc_mapped_column(
        _LegCUUID(as_uuid=True),
        _LegCForeignKey("approvals.id"),
        nullable=True,
        index=True,
    )
    external_evidence_reference: _LegCMapped[str | None] = _legc_mapped_column(
        _LegCString(500),
        nullable=True,
    )
    executed_by: _LegCMapped[str | None] = _legc_mapped_column(
        _LegCString(150),
        nullable=True,
    )
    executed_at: _LegCMapped[object | None] = _legc_mapped_column(
        _LegCDateTime(timezone=True),
        nullable=True,
    )
    notes: _LegCMapped[str | None] = _legc_mapped_column(
        _LegCText,
        nullable=True,
    )
    action_metadata: _LegCMapped[dict] = _legc_mapped_column(
        _LegCJSONB,
        nullable=False,
        default=dict,
    )
    created_at: _LegCMapped[object] = _legc_mapped_column(
        _LegCDateTime(timezone=True),
        server_default=_legc_func.now(),
        nullable=False,
    )
    updated_at: _LegCMapped[object] = _legc_mapped_column(
        _LegCDateTime(timezone=True),
        server_default=_legc_func.now(),
        onupdate=_legc_func.now(),
        nullable=False,
    )


class LegalHold(Base):
    __tablename__ = "legal_holds"

    id: _LegCMapped[_legc_uuid.UUID] = _legc_mapped_column(
        _LegCUUID(as_uuid=True),
        primary_key=True,
        default=_legc_uuid.uuid4,
    )
    code: _LegCMapped[str] = _legc_mapped_column(
        _LegCString(80),
        unique=True,
        nullable=False,
        index=True,
    )
    matter_id: _LegCMapped[_legc_uuid.UUID | None] = _legc_mapped_column(
        _LegCUUID(as_uuid=True),
        _LegCForeignKey("legal_matters.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    title: _LegCMapped[str] = _legc_mapped_column(
        _LegCString(300),
        nullable=False,
        index=True,
    )
    scope_summary: _LegCMapped[str] = _legc_mapped_column(
        _LegCText,
        nullable=False,
    )
    owner: _LegCMapped[str] = _legc_mapped_column(
        _LegCString(150),
        nullable=False,
        index=True,
    )
    start_date: _LegCMapped[object] = _legc_mapped_column(
        _LegCDate,
        nullable=False,
        index=True,
    )
    review_date: _LegCMapped[object | None] = _legc_mapped_column(
        _LegCDate,
        nullable=True,
        index=True,
    )
    status: _LegCMapped[str] = _legc_mapped_column(
        _LegCString(30),
        nullable=False,
        default="active",
        index=True,
    )
    release_approval_id: _LegCMapped[_legc_uuid.UUID | None] = _legc_mapped_column(
        _LegCUUID(as_uuid=True),
        _LegCForeignKey("approvals.id"),
        nullable=True,
        index=True,
    )
    released_by: _LegCMapped[str | None] = _legc_mapped_column(
        _LegCString(150),
        nullable=True,
    )
    released_at: _LegCMapped[object | None] = _legc_mapped_column(
        _LegCDateTime(timezone=True),
        nullable=True,
    )
    notes: _LegCMapped[str | None] = _legc_mapped_column(
        _LegCText,
        nullable=True,
    )
    hold_metadata: _LegCMapped[dict] = _legc_mapped_column(
        _LegCJSONB,
        nullable=False,
        default=dict,
    )
    created_at: _LegCMapped[object] = _legc_mapped_column(
        _LegCDateTime(timezone=True),
        server_default=_legc_func.now(),
        nullable=False,
    )
    updated_at: _LegCMapped[object] = _legc_mapped_column(
        _LegCDateTime(timezone=True),
        server_default=_legc_func.now(),
        onupdate=_legc_func.now(),
        nullable=False,
    )

# ============================================================
# IT - Phase 1A
# Service register + controlled change/release + incidents.
# Policy Impact / Mismatch / Technical Verification remain
# authoritative for policy-driven technical changes.
# ============================================================
import uuid as _ita_uuid

from sqlalchemy import (
    Boolean as _ItABoolean,
    DateTime as _ItADateTime,
    ForeignKey as _ItAForeignKey,
    String as _ItAString,
    Text as _ItAText,
    func as _ita_func,
)
from sqlalchemy.dialects.postgresql import (
    JSONB as _ItAJSONB,
    UUID as _ItAUUID,
)
from sqlalchemy.orm import (
    Mapped as _ItAMapped,
    mapped_column as _ita_mapped_column,
)


class ITService(Base):
    __tablename__ = "it_services"

    id: _ItAMapped[_ita_uuid.UUID] = _ita_mapped_column(
        _ItAUUID(as_uuid=True),
        primary_key=True,
        default=_ita_uuid.uuid4,
    )
    code: _ItAMapped[str] = _ita_mapped_column(
        _ItAString(80),
        unique=True,
        nullable=False,
        index=True,
    )
    name: _ItAMapped[str] = _ita_mapped_column(
        _ItAString(250),
        nullable=False,
        index=True,
    )
    service_type: _ItAMapped[str] = _ita_mapped_column(
        _ItAString(50),
        nullable=False,
        index=True,
    )
    owner: _ItAMapped[str] = _ita_mapped_column(
        _ItAString(150),
        nullable=False,
        index=True,
    )
    environment: _ItAMapped[str] = _ita_mapped_column(
        _ItAString(40),
        nullable=False,
        default="production",
        index=True,
    )
    criticality: _ItAMapped[str] = _ita_mapped_column(
        _ItAString(20),
        nullable=False,
        default="medium",
        index=True,
    )
    data_classification: _ItAMapped[str] = _ita_mapped_column(
        _ItAString(40),
        nullable=False,
        default="internal",
        index=True,
    )
    external_provider: _ItAMapped[str | None] = _ita_mapped_column(
        _ItAString(250),
        nullable=True,
    )
    status: _ItAMapped[str] = _ita_mapped_column(
        _ItAString(30),
        nullable=False,
        default="active",
        index=True,
    )
    notes: _ItAMapped[str | None] = _ita_mapped_column(
        _ItAText,
        nullable=True,
    )
    service_metadata: _ItAMapped[dict] = _ita_mapped_column(
        _ItAJSONB,
        nullable=False,
        default=dict,
    )
    created_at: _ItAMapped[object] = _ita_mapped_column(
        _ItADateTime(timezone=True),
        server_default=_ita_func.now(),
        nullable=False,
    )
    updated_at: _ItAMapped[object] = _ita_mapped_column(
        _ItADateTime(timezone=True),
        server_default=_ita_func.now(),
        onupdate=_ita_func.now(),
        nullable=False,
    )


class ITChangeRequest(Base):
    __tablename__ = "it_change_requests"

    id: _ItAMapped[_ita_uuid.UUID] = _ita_mapped_column(
        _ItAUUID(as_uuid=True),
        primary_key=True,
        default=_ita_uuid.uuid4,
    )
    code: _ItAMapped[str] = _ita_mapped_column(
        _ItAString(80),
        unique=True,
        nullable=False,
        index=True,
    )
    service_id: _ItAMapped[_ita_uuid.UUID] = _ita_mapped_column(
        _ItAUUID(as_uuid=True),
        _ItAForeignKey("it_services.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    title: _ItAMapped[str] = _ita_mapped_column(
        _ItAString(300),
        nullable=False,
        index=True,
    )
    change_type: _ItAMapped[str] = _ita_mapped_column(
        _ItAString(30),
        nullable=False,
        default="standard",
        index=True,
    )
    risk_level: _ItAMapped[str] = _ita_mapped_column(
        _ItAString(20),
        nullable=False,
        default="medium",
        index=True,
    )
    requested_by: _ItAMapped[str] = _ita_mapped_column(
        _ItAString(150),
        nullable=False,
    )
    description: _ItAMapped[str] = _ita_mapped_column(
        _ItAText,
        nullable=False,
    )
    test_evidence: _ItAMapped[str] = _ita_mapped_column(
        _ItAText,
        nullable=False,
    )
    rollback_plan: _ItAMapped[str] = _ita_mapped_column(
        _ItAText,
        nullable=False,
    )
    customer_or_data_impact: _ItAMapped[bool] = _ita_mapped_column(
        _ItABoolean,
        nullable=False,
        default=False,
    )
    status: _ItAMapped[str] = _ita_mapped_column(
        _ItAString(40),
        nullable=False,
        default="draft",
        index=True,
    )
    approval_id: _ItAMapped[_ita_uuid.UUID | None] = _ita_mapped_column(
        _ItAUUID(as_uuid=True),
        _ItAForeignKey("approvals.id"),
        nullable=True,
        index=True,
    )
    notes: _ItAMapped[str | None] = _ita_mapped_column(
        _ItAText,
        nullable=True,
    )
    change_metadata: _ItAMapped[dict] = _ita_mapped_column(
        _ItAJSONB,
        nullable=False,
        default=dict,
    )
    created_at: _ItAMapped[object] = _ita_mapped_column(
        _ItADateTime(timezone=True),
        server_default=_ita_func.now(),
        nullable=False,
    )
    updated_at: _ItAMapped[object] = _ita_mapped_column(
        _ItADateTime(timezone=True),
        server_default=_ita_func.now(),
        onupdate=_ita_func.now(),
        nullable=False,
    )


class ITRelease(Base):
    __tablename__ = "it_releases"

    id: _ItAMapped[_ita_uuid.UUID] = _ita_mapped_column(
        _ItAUUID(as_uuid=True),
        primary_key=True,
        default=_ita_uuid.uuid4,
    )
    code: _ItAMapped[str] = _ita_mapped_column(
        _ItAString(80),
        unique=True,
        nullable=False,
        index=True,
    )
    change_request_id: _ItAMapped[_ita_uuid.UUID] = _ita_mapped_column(
        _ItAUUID(as_uuid=True),
        _ItAForeignKey("it_change_requests.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    release_version: _ItAMapped[str] = _ita_mapped_column(
        _ItAString(120),
        nullable=False,
        index=True,
    )
    target_environment: _ItAMapped[str] = _ita_mapped_column(
        _ItAString(40),
        nullable=False,
        default="production",
        index=True,
    )
    release_notes: _ItAMapped[str] = _ita_mapped_column(
        _ItAText,
        nullable=False,
    )
    pre_release_test_evidence: _ItAMapped[str] = _ita_mapped_column(
        _ItAText,
        nullable=False,
    )
    rollback_plan: _ItAMapped[str] = _ita_mapped_column(
        _ItAText,
        nullable=False,
    )
    status: _ItAMapped[str] = _ita_mapped_column(
        _ItAString(40),
        nullable=False,
        default="draft",
        index=True,
    )
    approval_id: _ItAMapped[_ita_uuid.UUID | None] = _ita_mapped_column(
        _ItAUUID(as_uuid=True),
        _ItAForeignKey("approvals.id"),
        nullable=True,
        index=True,
    )
    external_deployment_reference: _ItAMapped[str | None] = _ita_mapped_column(
        _ItAString(500),
        nullable=True,
    )
    deployed_by: _ItAMapped[str | None] = _ita_mapped_column(
        _ItAString(150),
        nullable=True,
    )
    deployed_at: _ItAMapped[object | None] = _ita_mapped_column(
        _ItADateTime(timezone=True),
        nullable=True,
    )
    notes: _ItAMapped[str | None] = _ita_mapped_column(
        _ItAText,
        nullable=True,
    )
    release_metadata: _ItAMapped[dict] = _ita_mapped_column(
        _ItAJSONB,
        nullable=False,
        default=dict,
    )
    created_at: _ItAMapped[object] = _ita_mapped_column(
        _ItADateTime(timezone=True),
        server_default=_ita_func.now(),
        nullable=False,
    )
    updated_at: _ItAMapped[object] = _ita_mapped_column(
        _ItADateTime(timezone=True),
        server_default=_ita_func.now(),
        onupdate=_ita_func.now(),
        nullable=False,
    )


class ITIncident(Base):
    __tablename__ = "it_incidents"

    id: _ItAMapped[_ita_uuid.UUID] = _ita_mapped_column(
        _ItAUUID(as_uuid=True),
        primary_key=True,
        default=_ita_uuid.uuid4,
    )
    code: _ItAMapped[str] = _ita_mapped_column(
        _ItAString(80),
        unique=True,
        nullable=False,
        index=True,
    )
    service_id: _ItAMapped[_ita_uuid.UUID | None] = _ita_mapped_column(
        _ItAUUID(as_uuid=True),
        _ItAForeignKey("it_services.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    incident_type: _ItAMapped[str] = _ita_mapped_column(
        _ItAString(50),
        nullable=False,
        index=True,
    )
    severity: _ItAMapped[str] = _ita_mapped_column(
        _ItAString(20),
        nullable=False,
        default="medium",
        index=True,
    )
    title: _ItAMapped[str] = _ita_mapped_column(
        _ItAString(300),
        nullable=False,
        index=True,
    )
    summary: _ItAMapped[str] = _ita_mapped_column(
        _ItAText,
        nullable=False,
    )
    owner: _ItAMapped[str] = _ita_mapped_column(
        _ItAString(150),
        nullable=False,
        index=True,
    )
    customer_or_personal_data_impact: _ItAMapped[bool] = _ita_mapped_column(
        _ItABoolean,
        nullable=False,
        default=False,
    )
    status: _ItAMapped[str] = _ita_mapped_column(
        _ItAString(30),
        nullable=False,
        default="open",
        index=True,
    )
    root_cause: _ItAMapped[str | None] = _ita_mapped_column(
        _ItAText,
        nullable=True,
    )
    resolution_summary: _ItAMapped[str | None] = _ita_mapped_column(
        _ItAText,
        nullable=True,
    )
    detected_at: _ItAMapped[object] = _ita_mapped_column(
        _ItADateTime(timezone=True),
        nullable=False,
        index=True,
    )
    resolved_at: _ItAMapped[object | None] = _ita_mapped_column(
        _ItADateTime(timezone=True),
        nullable=True,
    )
    closed_at: _ItAMapped[object | None] = _ita_mapped_column(
        _ItADateTime(timezone=True),
        nullable=True,
    )
    notes: _ItAMapped[str | None] = _ita_mapped_column(
        _ItAText,
        nullable=True,
    )
    incident_metadata: _ItAMapped[dict] = _ita_mapped_column(
        _ItAJSONB,
        nullable=False,
        default=dict,
    )
    created_at: _ItAMapped[object] = _ita_mapped_column(
        _ItADateTime(timezone=True),
        server_default=_ita_func.now(),
        nullable=False,
    )
    updated_at: _ItAMapped[object] = _ita_mapped_column(
        _ItADateTime(timezone=True),
        server_default=_ita_func.now(),
        onupdate=_ita_func.now(),
        nullable=False,
    )

# ============================================================
# IT - Phase 1B
# Logical access governance + Backup / Recovery / DR control.
# Physical premises access remains authoritative in Admin.
# No identity-provider mutation or backup/restore execution.
# ============================================================
import uuid as _itb_uuid

from sqlalchemy import (
    Boolean as _ItBBoolean,
    Date as _ItBDate,
    DateTime as _ItBDateTime,
    ForeignKey as _ItBForeignKey,
    Integer as _ItBInteger,
    String as _ItBString,
    Text as _ItBText,
    UniqueConstraint as _ItBUniqueConstraint,
    func as _itb_func,
)
from sqlalchemy.dialects.postgresql import (
    JSONB as _ItBJSONB,
    UUID as _ItBUUID,
)
from sqlalchemy.orm import (
    Mapped as _ItBMapped,
    mapped_column as _itb_mapped_column,
)


class ITAccessRequest(Base):
    __tablename__ = "it_access_requests"

    id: _ItBMapped[_itb_uuid.UUID] = _itb_mapped_column(
        _ItBUUID(as_uuid=True),
        primary_key=True,
        default=_itb_uuid.uuid4,
    )
    code: _ItBMapped[str] = _itb_mapped_column(
        _ItBString(80),
        unique=True,
        nullable=False,
        index=True,
    )
    service_id: _ItBMapped[_itb_uuid.UUID] = _itb_mapped_column(
        _ItBUUID(as_uuid=True),
        _ItBForeignKey("it_services.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    access_type: _ItBMapped[str] = _itb_mapped_column(
        _ItBString(30),
        nullable=False,
        index=True,
    )
    subject_type: _ItBMapped[str] = _itb_mapped_column(
        _ItBString(40),
        nullable=False,
        index=True,
    )
    subject_name: _ItBMapped[str] = _itb_mapped_column(
        _ItBString(250),
        nullable=False,
        index=True,
    )
    role_or_scope: _ItBMapped[str] = _itb_mapped_column(
        _ItBString(300),
        nullable=False,
    )
    requested_by: _ItBMapped[str] = _itb_mapped_column(
        _ItBString(150),
        nullable=False,
    )
    justification: _ItBMapped[str] = _itb_mapped_column(
        _ItBText,
        nullable=False,
    )
    least_privilege_confirmed: _ItBMapped[bool] = _itb_mapped_column(
        _ItBBoolean,
        nullable=False,
        default=False,
    )
    monitoring_required: _ItBMapped[bool] = _itb_mapped_column(
        _ItBBoolean,
        nullable=False,
        default=False,
    )
    starts_at: _ItBMapped[object | None] = _itb_mapped_column(
        _ItBDateTime(timezone=True),
        nullable=True,
    )
    expires_at: _ItBMapped[object | None] = _itb_mapped_column(
        _ItBDateTime(timezone=True),
        nullable=True,
        index=True,
    )
    status: _ItBMapped[str] = _itb_mapped_column(
        _ItBString(40),
        nullable=False,
        default="draft",
        index=True,
    )
    approval_id: _ItBMapped[_itb_uuid.UUID | None] = _itb_mapped_column(
        _ItBUUID(as_uuid=True),
        _ItBForeignKey("approvals.id"),
        nullable=True,
        index=True,
    )
    external_provisioning_reference: _ItBMapped[str | None] = _itb_mapped_column(
        _ItBString(500),
        nullable=True,
    )
    provisioned_by: _ItBMapped[str | None] = _itb_mapped_column(
        _ItBString(150),
        nullable=True,
    )
    provisioned_at: _ItBMapped[object | None] = _itb_mapped_column(
        _ItBDateTime(timezone=True),
        nullable=True,
    )
    external_revocation_reference: _ItBMapped[str | None] = _itb_mapped_column(
        _ItBString(500),
        nullable=True,
    )
    revoked_by: _ItBMapped[str | None] = _itb_mapped_column(
        _ItBString(150),
        nullable=True,
    )
    revoked_at: _ItBMapped[object | None] = _itb_mapped_column(
        _ItBDateTime(timezone=True),
        nullable=True,
    )
    notes: _ItBMapped[str | None] = _itb_mapped_column(
        _ItBText,
        nullable=True,
    )
    access_metadata: _ItBMapped[dict] = _itb_mapped_column(
        _ItBJSONB,
        nullable=False,
        default=dict,
    )
    created_at: _ItBMapped[object] = _itb_mapped_column(
        _ItBDateTime(timezone=True),
        server_default=_itb_func.now(),
        nullable=False,
    )
    updated_at: _ItBMapped[object] = _itb_mapped_column(
        _ItBDateTime(timezone=True),
        server_default=_itb_func.now(),
        onupdate=_itb_func.now(),
        nullable=False,
    )


class ITRecoveryProfile(Base):
    __tablename__ = "it_recovery_profiles"
    __table_args__ = (
        _ItBUniqueConstraint(
            "service_id",
            name="uq_it_recovery_profile_service",
        ),
    )

    id: _ItBMapped[_itb_uuid.UUID] = _itb_mapped_column(
        _ItBUUID(as_uuid=True),
        primary_key=True,
        default=_itb_uuid.uuid4,
    )
    code: _ItBMapped[str] = _itb_mapped_column(
        _ItBString(80),
        unique=True,
        nullable=False,
        index=True,
    )
    service_id: _ItBMapped[_itb_uuid.UUID] = _itb_mapped_column(
        _ItBUUID(as_uuid=True),
        _ItBForeignKey("it_services.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    backup_strategy: _ItBMapped[str] = _itb_mapped_column(
        _ItBText,
        nullable=False,
    )
    backup_frequency: _ItBMapped[str] = _itb_mapped_column(
        _ItBString(100),
        nullable=False,
    )
    recovery_location: _ItBMapped[str | None] = _itb_mapped_column(
        _ItBString(250),
        nullable=True,
    )
    rpo_target_minutes: _ItBMapped[int] = _itb_mapped_column(
        _ItBInteger,
        nullable=False,
    )
    rto_target_minutes: _ItBMapped[int] = _itb_mapped_column(
        _ItBInteger,
        nullable=False,
    )
    test_frequency_days: _ItBMapped[int] = _itb_mapped_column(
        _ItBInteger,
        nullable=False,
        default=90,
    )
    next_test_due_date: _ItBMapped[object] = _itb_mapped_column(
        _ItBDate,
        nullable=False,
        index=True,
    )
    last_test_at: _ItBMapped[object | None] = _itb_mapped_column(
        _ItBDateTime(timezone=True),
        nullable=True,
    )
    last_test_result: _ItBMapped[str | None] = _itb_mapped_column(
        _ItBString(30),
        nullable=True,
        index=True,
    )
    status: _ItBMapped[str] = _itb_mapped_column(
        _ItBString(40),
        nullable=False,
        default="draft",
        index=True,
    )
    approval_id: _ItBMapped[_itb_uuid.UUID | None] = _itb_mapped_column(
        _ItBUUID(as_uuid=True),
        _ItBForeignKey("approvals.id"),
        nullable=True,
        index=True,
    )
    notes: _ItBMapped[str | None] = _itb_mapped_column(
        _ItBText,
        nullable=True,
    )
    recovery_metadata: _ItBMapped[dict] = _itb_mapped_column(
        _ItBJSONB,
        nullable=False,
        default=dict,
    )
    created_at: _ItBMapped[object] = _itb_mapped_column(
        _ItBDateTime(timezone=True),
        server_default=_itb_func.now(),
        nullable=False,
    )
    updated_at: _ItBMapped[object] = _itb_mapped_column(
        _ItBDateTime(timezone=True),
        server_default=_itb_func.now(),
        onupdate=_itb_func.now(),
        nullable=False,
    )


class ITRecoveryTest(Base):
    __tablename__ = "it_recovery_tests"

    id: _ItBMapped[_itb_uuid.UUID] = _itb_mapped_column(
        _ItBUUID(as_uuid=True),
        primary_key=True,
        default=_itb_uuid.uuid4,
    )
    code: _ItBMapped[str] = _itb_mapped_column(
        _ItBString(80),
        unique=True,
        nullable=False,
        index=True,
    )
    recovery_profile_id: _ItBMapped[_itb_uuid.UUID] = _itb_mapped_column(
        _ItBUUID(as_uuid=True),
        _ItBForeignKey("it_recovery_profiles.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    test_type: _ItBMapped[str] = _itb_mapped_column(
        _ItBString(50),
        nullable=False,
        index=True,
    )
    planned_at: _ItBMapped[object] = _itb_mapped_column(
        _ItBDateTime(timezone=True),
        nullable=False,
        index=True,
    )
    status: _ItBMapped[str] = _itb_mapped_column(
        _ItBString(30),
        nullable=False,
        default="planned",
        index=True,
    )
    restoration_verified: _ItBMapped[bool | None] = _itb_mapped_column(
        _ItBBoolean,
        nullable=True,
    )
    actual_rpo_minutes: _ItBMapped[int | None] = _itb_mapped_column(
        _ItBInteger,
        nullable=True,
    )
    actual_rto_minutes: _ItBMapped[int | None] = _itb_mapped_column(
        _ItBInteger,
        nullable=True,
    )
    result: _ItBMapped[str | None] = _itb_mapped_column(
        _ItBString(30),
        nullable=True,
        index=True,
    )
    external_test_reference: _ItBMapped[str | None] = _itb_mapped_column(
        _ItBString(500),
        nullable=True,
    )
    performed_by: _ItBMapped[str | None] = _itb_mapped_column(
        _ItBString(150),
        nullable=True,
    )
    issues_summary: _ItBMapped[str | None] = _itb_mapped_column(
        _ItBText,
        nullable=True,
    )
    completed_at: _ItBMapped[object | None] = _itb_mapped_column(
        _ItBDateTime(timezone=True),
        nullable=True,
    )
    notes: _ItBMapped[str | None] = _itb_mapped_column(
        _ItBText,
        nullable=True,
    )
    test_metadata: _ItBMapped[dict] = _itb_mapped_column(
        _ItBJSONB,
        nullable=False,
        default=dict,
    )
    created_at: _ItBMapped[object] = _itb_mapped_column(
        _ItBDateTime(timezone=True),
        server_default=_itb_func.now(),
        nullable=False,
    )
    updated_at: _ItBMapped[object] = _itb_mapped_column(
        _ItBDateTime(timezone=True),
        server_default=_itb_func.now(),
        onupdate=_itb_func.now(),
        nullable=False,
    )

# ============================================================
# IT - Phase 1C
# Configuration + Architecture/Security Governance +
# Vulnerability/Risk Acceptance + Security Assessment Control.
# ============================================================
import uuid as _itc_uuid

from sqlalchemy import (
    Boolean as _ItCBoolean,
    Date as _ItCDate,
    DateTime as _ItCDateTime,
    ForeignKey as _ItCForeignKey,
    String as _ItCString,
    Text as _ItCText,
    UniqueConstraint as _ItCUniqueConstraint,
    func as _itc_func,
)
from sqlalchemy.dialects.postgresql import (
    JSONB as _ItCJSONB,
    UUID as _ItCUUID,
)
from sqlalchemy.orm import (
    Mapped as _ItCMapped,
    mapped_column as _itc_mapped_column,
)


class ITConfigurationItem(Base):
    __tablename__ = "it_configuration_items"
    __table_args__ = (
        _ItCUniqueConstraint(
            "service_id",
            "name",
            name="uq_it_configuration_item_service_name",
        ),
    )

    id: _ItCMapped[_itc_uuid.UUID] = _itc_mapped_column(
        _ItCUUID(as_uuid=True),
        primary_key=True,
        default=_itc_uuid.uuid4,
    )
    code: _ItCMapped[str] = _itc_mapped_column(
        _ItCString(80),
        unique=True,
        nullable=False,
        index=True,
    )
    service_id: _ItCMapped[_itc_uuid.UUID] = _itc_mapped_column(
        _ItCUUID(as_uuid=True),
        _ItCForeignKey("it_services.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name: _ItCMapped[str] = _itc_mapped_column(
        _ItCString(250),
        nullable=False,
        index=True,
    )
    item_type: _ItCMapped[str] = _itc_mapped_column(
        _ItCString(50),
        nullable=False,
        index=True,
    )
    environment: _ItCMapped[str] = _itc_mapped_column(
        _ItCString(40),
        nullable=False,
        index=True,
    )
    owner: _ItCMapped[str] = _itc_mapped_column(
        _ItCString(150),
        nullable=False,
        index=True,
    )
    baseline_reference: _ItCMapped[str | None] = _itc_mapped_column(
        _ItCString(500),
        nullable=True,
    )
    status: _ItCMapped[str] = _itc_mapped_column(
        _ItCString(30),
        nullable=False,
        default="active",
        index=True,
    )
    notes: _ItCMapped[str | None] = _itc_mapped_column(
        _ItCText,
        nullable=True,
    )
    configuration_metadata: _ItCMapped[dict] = _itc_mapped_column(
        _ItCJSONB,
        nullable=False,
        default=dict,
    )
    created_at: _ItCMapped[object] = _itc_mapped_column(
        _ItCDateTime(timezone=True),
        server_default=_itc_func.now(),
        nullable=False,
    )
    updated_at: _ItCMapped[object] = _itc_mapped_column(
        _ItCDateTime(timezone=True),
        server_default=_itc_func.now(),
        onupdate=_itc_func.now(),
        nullable=False,
    )


class ITArchitectureReview(Base):
    __tablename__ = "it_architecture_reviews"

    id: _ItCMapped[_itc_uuid.UUID] = _itc_mapped_column(
        _ItCUUID(as_uuid=True),
        primary_key=True,
        default=_itc_uuid.uuid4,
    )
    code: _ItCMapped[str] = _itc_mapped_column(
        _ItCString(80),
        unique=True,
        nullable=False,
        index=True,
    )
    service_id: _ItCMapped[_itc_uuid.UUID] = _itc_mapped_column(
        _ItCUUID(as_uuid=True),
        _ItCForeignKey("it_services.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    review_type: _ItCMapped[str] = _itc_mapped_column(
        _ItCString(50),
        nullable=False,
        index=True,
    )
    title: _ItCMapped[str] = _itc_mapped_column(
        _ItCString(300),
        nullable=False,
        index=True,
    )
    proposed_architecture: _ItCMapped[str] = _itc_mapped_column(
        _ItCText,
        nullable=False,
    )
    security_review_summary: _ItCMapped[str] = _itc_mapped_column(
        _ItCText,
        nullable=False,
    )
    privacy_review_required: _ItCMapped[bool] = _itc_mapped_column(
        _ItCBoolean,
        nullable=False,
        default=False,
    )
    risk_level: _ItCMapped[str] = _itc_mapped_column(
        _ItCString(20),
        nullable=False,
        default="medium",
        index=True,
    )
    status: _ItCMapped[str] = _itc_mapped_column(
        _ItCString(40),
        nullable=False,
        default="draft",
        index=True,
    )
    approval_id: _ItCMapped[_itc_uuid.UUID | None] = _itc_mapped_column(
        _ItCUUID(as_uuid=True),
        _ItCForeignKey("approvals.id"),
        nullable=True,
        index=True,
    )
    decision_notes: _ItCMapped[str | None] = _itc_mapped_column(
        _ItCText,
        nullable=True,
    )
    notes: _ItCMapped[str | None] = _itc_mapped_column(
        _ItCText,
        nullable=True,
    )
    review_metadata: _ItCMapped[dict] = _itc_mapped_column(
        _ItCJSONB,
        nullable=False,
        default=dict,
    )
    created_at: _ItCMapped[object] = _itc_mapped_column(
        _ItCDateTime(timezone=True),
        server_default=_itc_func.now(),
        nullable=False,
    )
    updated_at: _ItCMapped[object] = _itc_mapped_column(
        _ItCDateTime(timezone=True),
        server_default=_itc_func.now(),
        onupdate=_itc_func.now(),
        nullable=False,
    )


class ITSecurityException(Base):
    __tablename__ = "it_security_exceptions"

    id: _ItCMapped[_itc_uuid.UUID] = _itc_mapped_column(
        _ItCUUID(as_uuid=True),
        primary_key=True,
        default=_itc_uuid.uuid4,
    )
    code: _ItCMapped[str] = _itc_mapped_column(
        _ItCString(80),
        unique=True,
        nullable=False,
        index=True,
    )
    service_id: _ItCMapped[_itc_uuid.UUID] = _itc_mapped_column(
        _ItCUUID(as_uuid=True),
        _ItCForeignKey("it_services.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    control_reference: _ItCMapped[str] = _itc_mapped_column(
        _ItCString(250),
        nullable=False,
        index=True,
    )
    title: _ItCMapped[str] = _itc_mapped_column(
        _ItCString(300),
        nullable=False,
        index=True,
    )
    justification: _ItCMapped[str] = _itc_mapped_column(
        _ItCText,
        nullable=False,
    )
    compensating_controls: _ItCMapped[str] = _itc_mapped_column(
        _ItCText,
        nullable=False,
    )
    requested_by: _ItCMapped[str] = _itc_mapped_column(
        _ItCString(150),
        nullable=False,
    )
    risk_level: _ItCMapped[str] = _itc_mapped_column(
        _ItCString(20),
        nullable=False,
        default="high",
        index=True,
    )
    expiry_date: _ItCMapped[object] = _itc_mapped_column(
        _ItCDate,
        nullable=False,
        index=True,
    )
    status: _ItCMapped[str] = _itc_mapped_column(
        _ItCString(40),
        nullable=False,
        default="draft",
        index=True,
    )
    approval_id: _ItCMapped[_itc_uuid.UUID | None] = _itc_mapped_column(
        _ItCUUID(as_uuid=True),
        _ItCForeignKey("approvals.id"),
        nullable=True,
        index=True,
    )
    closure_evidence_reference: _ItCMapped[str | None] = _itc_mapped_column(
        _ItCString(500),
        nullable=True,
    )
    closed_by: _ItCMapped[str | None] = _itc_mapped_column(
        _ItCString(150),
        nullable=True,
    )
    closed_at: _ItCMapped[object | None] = _itc_mapped_column(
        _ItCDateTime(timezone=True),
        nullable=True,
    )
    notes: _ItCMapped[str | None] = _itc_mapped_column(
        _ItCText,
        nullable=True,
    )
    exception_metadata: _ItCMapped[dict] = _itc_mapped_column(
        _ItCJSONB,
        nullable=False,
        default=dict,
    )
    created_at: _ItCMapped[object] = _itc_mapped_column(
        _ItCDateTime(timezone=True),
        server_default=_itc_func.now(),
        nullable=False,
    )
    updated_at: _ItCMapped[object] = _itc_mapped_column(
        _ItCDateTime(timezone=True),
        server_default=_itc_func.now(),
        onupdate=_itc_func.now(),
        nullable=False,
    )


class ITVulnerability(Base):
    __tablename__ = "it_vulnerabilities"

    id: _ItCMapped[_itc_uuid.UUID] = _itc_mapped_column(
        _ItCUUID(as_uuid=True),
        primary_key=True,
        default=_itc_uuid.uuid4,
    )
    code: _ItCMapped[str] = _itc_mapped_column(
        _ItCString(80),
        unique=True,
        nullable=False,
        index=True,
    )
    service_id: _ItCMapped[_itc_uuid.UUID] = _itc_mapped_column(
        _ItCUUID(as_uuid=True),
        _ItCForeignKey("it_services.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    source_type: _ItCMapped[str] = _itc_mapped_column(
        _ItCString(50),
        nullable=False,
        index=True,
    )
    external_reference: _ItCMapped[str | None] = _itc_mapped_column(
        _ItCString(500),
        nullable=True,
    )
    title: _ItCMapped[str] = _itc_mapped_column(
        _ItCString(300),
        nullable=False,
        index=True,
    )
    severity: _ItCMapped[str] = _itc_mapped_column(
        _ItCString(20),
        nullable=False,
        index=True,
    )
    description: _ItCMapped[str] = _itc_mapped_column(
        _ItCText,
        nullable=False,
    )
    remediation_plan: _ItCMapped[str] = _itc_mapped_column(
        _ItCText,
        nullable=False,
    )
    due_date: _ItCMapped[object] = _itc_mapped_column(
        _ItCDate,
        nullable=False,
        index=True,
    )
    status: _ItCMapped[str] = _itc_mapped_column(
        _ItCString(40),
        nullable=False,
        default="open",
        index=True,
    )
    remediation_evidence_reference: _ItCMapped[str | None] = _itc_mapped_column(
        _ItCString(500),
        nullable=True,
    )
    closed_at: _ItCMapped[object | None] = _itc_mapped_column(
        _ItCDateTime(timezone=True),
        nullable=True,
    )
    notes: _ItCMapped[str | None] = _itc_mapped_column(
        _ItCText,
        nullable=True,
    )
    vulnerability_metadata: _ItCMapped[dict] = _itc_mapped_column(
        _ItCJSONB,
        nullable=False,
        default=dict,
    )
    created_at: _ItCMapped[object] = _itc_mapped_column(
        _ItCDateTime(timezone=True),
        server_default=_itc_func.now(),
        nullable=False,
    )
    updated_at: _ItCMapped[object] = _itc_mapped_column(
        _ItCDateTime(timezone=True),
        server_default=_itc_func.now(),
        onupdate=_itc_func.now(),
        nullable=False,
    )


class ITVulnerabilityRiskAcceptance(Base):
    __tablename__ = "it_vulnerability_risk_acceptances"
    __table_args__ = (
        _ItCUniqueConstraint(
            "vulnerability_id",
            name="uq_it_vulnerability_risk_acceptance",
        ),
    )

    id: _ItCMapped[_itc_uuid.UUID] = _itc_mapped_column(
        _ItCUUID(as_uuid=True),
        primary_key=True,
        default=_itc_uuid.uuid4,
    )
    vulnerability_id: _ItCMapped[_itc_uuid.UUID] = _itc_mapped_column(
        _ItCUUID(as_uuid=True),
        _ItCForeignKey("it_vulnerabilities.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    rationale: _ItCMapped[str] = _itc_mapped_column(
        _ItCText,
        nullable=False,
    )
    compensating_controls: _ItCMapped[str] = _itc_mapped_column(
        _ItCText,
        nullable=False,
    )
    accepted_until: _ItCMapped[object] = _itc_mapped_column(
        _ItCDate,
        nullable=False,
        index=True,
    )
    requested_by: _ItCMapped[str] = _itc_mapped_column(
        _ItCString(150),
        nullable=False,
    )
    status: _ItCMapped[str] = _itc_mapped_column(
        _ItCString(40),
        nullable=False,
        default="pending_approval",
        index=True,
    )
    approval_id: _ItCMapped[_itc_uuid.UUID] = _itc_mapped_column(
        _ItCUUID(as_uuid=True),
        _ItCForeignKey("approvals.id"),
        nullable=False,
        index=True,
    )
    notes: _ItCMapped[str | None] = _itc_mapped_column(
        _ItCText,
        nullable=True,
    )
    acceptance_metadata: _ItCMapped[dict] = _itc_mapped_column(
        _ItCJSONB,
        nullable=False,
        default=dict,
    )
    created_at: _ItCMapped[object] = _itc_mapped_column(
        _ItCDateTime(timezone=True),
        server_default=_itc_func.now(),
        nullable=False,
    )
    updated_at: _ItCMapped[object] = _itc_mapped_column(
        _ItCDateTime(timezone=True),
        server_default=_itc_func.now(),
        onupdate=_itc_func.now(),
        nullable=False,
    )


class ITSecurityAssessment(Base):
    __tablename__ = "it_security_assessments"

    id: _ItCMapped[_itc_uuid.UUID] = _itc_mapped_column(
        _ItCUUID(as_uuid=True),
        primary_key=True,
        default=_itc_uuid.uuid4,
    )
    code: _ItCMapped[str] = _itc_mapped_column(
        _ItCString(80),
        unique=True,
        nullable=False,
        index=True,
    )
    service_id: _ItCMapped[_itc_uuid.UUID] = _itc_mapped_column(
        _ItCUUID(as_uuid=True),
        _ItCForeignKey("it_services.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    assessment_type: _ItCMapped[str] = _itc_mapped_column(
        _ItCString(50),
        nullable=False,
        index=True,
    )
    title: _ItCMapped[str] = _itc_mapped_column(
        _ItCString(300),
        nullable=False,
        index=True,
    )
    scope_summary: _ItCMapped[str] = _itc_mapped_column(
        _ItCText,
        nullable=False,
    )
    written_authorization_reference: _ItCMapped[str] = _itc_mapped_column(
        _ItCString(500),
        nullable=False,
    )
    requested_by: _ItCMapped[str] = _itc_mapped_column(
        _ItCString(150),
        nullable=False,
    )
    status: _ItCMapped[str] = _itc_mapped_column(
        _ItCString(40),
        nullable=False,
        default="draft",
        index=True,
    )
    approval_id: _ItCMapped[_itc_uuid.UUID | None] = _itc_mapped_column(
        _ItCUUID(as_uuid=True),
        _ItCForeignKey("approvals.id"),
        nullable=True,
        index=True,
    )
    external_execution_reference: _ItCMapped[str | None] = _itc_mapped_column(
        _ItCString(500),
        nullable=True,
    )
    result_summary: _ItCMapped[str | None] = _itc_mapped_column(
        _ItCText,
        nullable=True,
    )
    executed_at: _ItCMapped[object | None] = _itc_mapped_column(
        _ItCDateTime(timezone=True),
        nullable=True,
    )
    notes: _ItCMapped[str | None] = _itc_mapped_column(
        _ItCText,
        nullable=True,
    )
    assessment_metadata: _ItCMapped[dict] = _itc_mapped_column(
        _ItCJSONB,
        nullable=False,
        default=dict,
    )
    created_at: _ItCMapped[object] = _itc_mapped_column(
        _ItCDateTime(timezone=True),
        server_default=_itc_func.now(),
        nullable=False,
    )
    updated_at: _ItCMapped[object] = _itc_mapped_column(
        _ItCDateTime(timezone=True),
        server_default=_itc_func.now(),
        onupdate=_itc_func.now(),
        nullable=False,
    )

# ============================================================
# Audit - Phase 1A
# Annual plan + independent engagements + findings/follow-up.
# Existing AuditLog remains the authoritative event trail.
# ============================================================
import uuid as _auda_uuid

from sqlalchemy import (
    Boolean as _AudABoolean,
    Date as _AudADate,
    DateTime as _AudADateTime,
    ForeignKey as _AudAForeignKey,
    Integer as _AudAInteger,
    String as _AudAString,
    Text as _AudAText,
    UniqueConstraint as _AudAUniqueConstraint,
    func as _auda_func,
)
from sqlalchemy.dialects.postgresql import (
    JSONB as _AudAJSONB,
    UUID as _AudAUUID,
)
from sqlalchemy.orm import (
    Mapped as _AudAMapped,
    mapped_column as _auda_mapped_column,
)


class AuditPlan(Base):
    __tablename__ = "audit_plans"
    __table_args__ = (
        _AudAUniqueConstraint(
            "year",
            name="uq_audit_plan_year",
        ),
    )

    id: _AudAMapped[_auda_uuid.UUID] = _auda_mapped_column(
        _AudAUUID(as_uuid=True),
        primary_key=True,
        default=_auda_uuid.uuid4,
    )
    code: _AudAMapped[str] = _auda_mapped_column(
        _AudAString(80),
        unique=True,
        nullable=False,
        index=True,
    )
    year: _AudAMapped[int] = _auda_mapped_column(
        _AudAInteger,
        nullable=False,
        index=True,
    )
    title: _AudAMapped[str] = _auda_mapped_column(
        _AudAString(300),
        nullable=False,
    )
    risk_basis: _AudAMapped[str] = _auda_mapped_column(
        _AudAText,
        nullable=False,
    )
    scope_summary: _AudAMapped[str] = _auda_mapped_column(
        _AudAText,
        nullable=False,
    )
    prepared_by: _AudAMapped[str] = _auda_mapped_column(
        _AudAString(150),
        nullable=False,
    )
    independence_confirmed: _AudAMapped[bool] = _auda_mapped_column(
        _AudABoolean,
        nullable=False,
        default=False,
    )
    status: _AudAMapped[str] = _auda_mapped_column(
        _AudAString(40),
        nullable=False,
        default="draft",
        index=True,
    )
    approval_id: _AudAMapped[_auda_uuid.UUID | None] = _auda_mapped_column(
        _AudAUUID(as_uuid=True),
        _AudAForeignKey("approvals.id"),
        nullable=True,
        index=True,
    )
    notes: _AudAMapped[str | None] = _auda_mapped_column(
        _AudAText,
        nullable=True,
    )
    plan_metadata: _AudAMapped[dict] = _auda_mapped_column(
        _AudAJSONB,
        nullable=False,
        default=dict,
    )
    created_at: _AudAMapped[object] = _auda_mapped_column(
        _AudADateTime(timezone=True),
        server_default=_auda_func.now(),
        nullable=False,
    )
    updated_at: _AudAMapped[object] = _auda_mapped_column(
        _AudADateTime(timezone=True),
        server_default=_auda_func.now(),
        onupdate=_auda_func.now(),
        nullable=False,
    )


class AuditEngagement(Base):
    __tablename__ = "audit_engagements"

    id: _AudAMapped[_auda_uuid.UUID] = _auda_mapped_column(
        _AudAUUID(as_uuid=True),
        primary_key=True,
        default=_auda_uuid.uuid4,
    )
    code: _AudAMapped[str] = _auda_mapped_column(
        _AudAString(80),
        unique=True,
        nullable=False,
        index=True,
    )
    plan_id: _AudAMapped[_auda_uuid.UUID | None] = _auda_mapped_column(
        _AudAUUID(as_uuid=True),
        _AudAForeignKey("audit_plans.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    title: _AudAMapped[str] = _auda_mapped_column(
        _AudAString(300),
        nullable=False,
        index=True,
    )
    domain: _AudAMapped[str] = _auda_mapped_column(
        _AudAString(100),
        nullable=False,
        index=True,
    )
    objective: _AudAMapped[str] = _auda_mapped_column(
        _AudAText,
        nullable=False,
    )
    scope_summary: _AudAMapped[str] = _auda_mapped_column(
        _AudAText,
        nullable=False,
    )
    records_access_scope: _AudAMapped[str] = _auda_mapped_column(
        _AudAText,
        nullable=False,
    )
    auditor: _AudAMapped[str] = _auda_mapped_column(
        _AudAString(150),
        nullable=False,
    )
    independence_confirmed: _AudAMapped[bool] = _auda_mapped_column(
        _AudABoolean,
        nullable=False,
        default=False,
    )
    planned_start_date: _AudAMapped[object | None] = _auda_mapped_column(
        _AudADate,
        nullable=True,
    )
    planned_end_date: _AudAMapped[object | None] = _auda_mapped_column(
        _AudADate,
        nullable=True,
    )
    status: _AudAMapped[str] = _auda_mapped_column(
        _AudAString(40),
        nullable=False,
        default="planned",
        index=True,
    )
    started_at: _AudAMapped[object | None] = _auda_mapped_column(
        _AudADateTime(timezone=True),
        nullable=True,
    )
    closed_at: _AudAMapped[object | None] = _auda_mapped_column(
        _AudADateTime(timezone=True),
        nullable=True,
    )
    notes: _AudAMapped[str | None] = _auda_mapped_column(
        _AudAText,
        nullable=True,
    )
    engagement_metadata: _AudAMapped[dict] = _auda_mapped_column(
        _AudAJSONB,
        nullable=False,
        default=dict,
    )
    created_at: _AudAMapped[object] = _auda_mapped_column(
        _AudADateTime(timezone=True),
        server_default=_auda_func.now(),
        nullable=False,
    )
    updated_at: _AudAMapped[object] = _auda_mapped_column(
        _AudADateTime(timezone=True),
        server_default=_auda_func.now(),
        onupdate=_auda_func.now(),
        nullable=False,
    )


class AuditFinding(Base):
    __tablename__ = "audit_findings"

    id: _AudAMapped[_auda_uuid.UUID] = _auda_mapped_column(
        _AudAUUID(as_uuid=True),
        primary_key=True,
        default=_auda_uuid.uuid4,
    )
    code: _AudAMapped[str] = _auda_mapped_column(
        _AudAString(80),
        unique=True,
        nullable=False,
        index=True,
    )
    engagement_id: _AudAMapped[_auda_uuid.UUID] = _auda_mapped_column(
        _AudAUUID(as_uuid=True),
        _AudAForeignKey("audit_engagements.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    title: _AudAMapped[str] = _auda_mapped_column(
        _AudAString(300),
        nullable=False,
        index=True,
    )
    severity: _AudAMapped[str] = _auda_mapped_column(
        _AudAString(20),
        nullable=False,
        default="medium",
        index=True,
    )
    condition: _AudAMapped[str] = _auda_mapped_column(
        _AudAText,
        nullable=False,
    )
    criteria: _AudAMapped[str] = _auda_mapped_column(
        _AudAText,
        nullable=False,
    )
    cause: _AudAMapped[str | None] = _auda_mapped_column(
        _AudAText,
        nullable=True,
    )
    impact: _AudAMapped[str] = _auda_mapped_column(
        _AudAText,
        nullable=False,
    )
    recommendation: _AudAMapped[str] = _auda_mapped_column(
        _AudAText,
        nullable=False,
    )
    status: _AudAMapped[str] = _auda_mapped_column(
        _AudAString(40),
        nullable=False,
        default="open",
        index=True,
    )
    management_response: _AudAMapped[str | None] = _auda_mapped_column(
        _AudAText,
        nullable=True,
    )
    action_plan: _AudAMapped[str | None] = _auda_mapped_column(
        _AudAText,
        nullable=True,
    )
    action_owner: _AudAMapped[str | None] = _auda_mapped_column(
        _AudAString(150),
        nullable=True,
        index=True,
    )
    target_date: _AudAMapped[object | None] = _auda_mapped_column(
        _AudADate,
        nullable=True,
        index=True,
    )
    action_plan_approval_id: _AudAMapped[_auda_uuid.UUID | None] = _auda_mapped_column(
        _AudAUUID(as_uuid=True),
        _AudAForeignKey("approvals.id"),
        nullable=True,
        index=True,
    )
    closure_evidence_reference: _AudAMapped[str | None] = _auda_mapped_column(
        _AudAString(500),
        nullable=True,
    )
    closed_by: _AudAMapped[str | None] = _auda_mapped_column(
        _AudAString(150),
        nullable=True,
    )
    closed_at: _AudAMapped[object | None] = _auda_mapped_column(
        _AudADateTime(timezone=True),
        nullable=True,
    )
    notes: _AudAMapped[str | None] = _auda_mapped_column(
        _AudAText,
        nullable=True,
    )
    finding_metadata: _AudAMapped[dict] = _auda_mapped_column(
        _AudAJSONB,
        nullable=False,
        default=dict,
    )
    created_at: _AudAMapped[object] = _auda_mapped_column(
        _AudADateTime(timezone=True),
        server_default=_auda_func.now(),
        nullable=False,
    )
    updated_at: _AudAMapped[object] = _auda_mapped_column(
        _AudADateTime(timezone=True),
        server_default=_auda_func.now(),
        onupdate=_auda_func.now(),
        nullable=False,
    )


class AuditFindingVerification(Base):
    __tablename__ = "audit_finding_verifications"

    id: _AudAMapped[_auda_uuid.UUID] = _auda_mapped_column(
        _AudAUUID(as_uuid=True),
        primary_key=True,
        default=_auda_uuid.uuid4,
    )
    finding_id: _AudAMapped[_auda_uuid.UUID] = _auda_mapped_column(
        _AudAUUID(as_uuid=True),
        _AudAForeignKey("audit_findings.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    result: _AudAMapped[str] = _auda_mapped_column(
        _AudAString(20),
        nullable=False,
        index=True,
    )
    evidence_reference: _AudAMapped[str] = _auda_mapped_column(
        _AudAString(500),
        nullable=False,
    )
    verification_summary: _AudAMapped[str] = _auda_mapped_column(
        _AudAText,
        nullable=False,
    )
    verified_by: _AudAMapped[str] = _auda_mapped_column(
        _AudAString(150),
        nullable=False,
    )
    verified_at: _AudAMapped[object] = _auda_mapped_column(
        _AudADateTime(timezone=True),
        server_default=_auda_func.now(),
        nullable=False,
    )
    created_at: _AudAMapped[object] = _auda_mapped_column(
        _AudADateTime(timezone=True),
        server_default=_auda_func.now(),
        nullable=False,
    )

# ============================================================
# Audit - Phase 1B
# Enterprise Risk Register + periodic/event review +
# time-bounded Risk Acceptance governance.
# Audit owns independent risk monitoring; operational owners
# remain accountable for treatment and execution.
# ============================================================
import uuid as _audb_uuid

from sqlalchemy import (
    Boolean as _AudBBoolean,
    Date as _AudBDate,
    DateTime as _AudBDateTime,
    ForeignKey as _AudBForeignKey,
    String as _AudBString,
    Text as _AudBText,
    func as _audb_func,
)
from sqlalchemy.dialects.postgresql import (
    JSONB as _AudBJSONB,
    UUID as _AudBUUID,
)
from sqlalchemy.orm import (
    Mapped as _AudBMapped,
    mapped_column as _audb_mapped_column,
)


class EnterpriseRisk(Base):
    __tablename__ = "enterprise_risks"

    id: _AudBMapped[_audb_uuid.UUID] = _audb_mapped_column(
        _AudBUUID(as_uuid=True),
        primary_key=True,
        default=_audb_uuid.uuid4,
    )
    code: _AudBMapped[str] = _audb_mapped_column(
        _AudBString(80),
        unique=True,
        nullable=False,
        index=True,
    )
    category: _AudBMapped[str] = _audb_mapped_column(
        _AudBString(80),
        nullable=False,
        index=True,
    )
    title: _AudBMapped[str] = _audb_mapped_column(
        _AudBString(300),
        nullable=False,
        index=True,
    )
    description: _AudBMapped[str] = _audb_mapped_column(
        _AudBText,
        nullable=False,
    )
    risk_owner: _AudBMapped[str] = _audb_mapped_column(
        _AudBString(150),
        nullable=False,
        index=True,
    )
    source_module: _AudBMapped[str | None] = _audb_mapped_column(
        _AudBString(80),
        nullable=True,
        index=True,
    )
    source_entity_id: _AudBMapped[_audb_uuid.UUID | None] = _audb_mapped_column(
        _AudBUUID(as_uuid=True),
        nullable=True,
        index=True,
    )
    inherent_risk_level: _AudBMapped[str] = _audb_mapped_column(
        _AudBString(20),
        nullable=False,
        index=True,
    )
    residual_risk_level: _AudBMapped[str] = _audb_mapped_column(
        _AudBString(20),
        nullable=False,
        index=True,
    )
    treatment_strategy: _AudBMapped[str] = _audb_mapped_column(
        _AudBString(30),
        nullable=False,
        index=True,
    )
    treatment_plan: _AudBMapped[str] = _audb_mapped_column(
        _AudBText,
        nullable=False,
    )
    status: _AudBMapped[str] = _audb_mapped_column(
        _AudBString(40),
        nullable=False,
        default="open",
        index=True,
    )
    next_review_date: _AudBMapped[object] = _audb_mapped_column(
        _AudBDate,
        nullable=False,
        index=True,
    )
    closed_by: _AudBMapped[str | None] = _audb_mapped_column(
        _AudBString(150),
        nullable=True,
    )
    closed_at: _AudBMapped[object | None] = _audb_mapped_column(
        _AudBDateTime(timezone=True),
        nullable=True,
    )
    closure_evidence_reference: _AudBMapped[str | None] = _audb_mapped_column(
        _AudBString(500),
        nullable=True,
    )
    notes: _AudBMapped[str | None] = _audb_mapped_column(
        _AudBText,
        nullable=True,
    )
    risk_metadata: _AudBMapped[dict] = _audb_mapped_column(
        _AudBJSONB,
        nullable=False,
        default=dict,
    )
    created_at: _AudBMapped[object] = _audb_mapped_column(
        _AudBDateTime(timezone=True),
        server_default=_audb_func.now(),
        nullable=False,
    )
    updated_at: _AudBMapped[object] = _audb_mapped_column(
        _AudBDateTime(timezone=True),
        server_default=_audb_func.now(),
        onupdate=_audb_func.now(),
        nullable=False,
    )


class EnterpriseRiskReview(Base):
    __tablename__ = "enterprise_risk_reviews"

    id: _AudBMapped[_audb_uuid.UUID] = _audb_mapped_column(
        _AudBUUID(as_uuid=True),
        primary_key=True,
        default=_audb_uuid.uuid4,
    )
    risk_id: _AudBMapped[_audb_uuid.UUID] = _audb_mapped_column(
        _AudBUUID(as_uuid=True),
        _AudBForeignKey("enterprise_risks.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    review_type: _AudBMapped[str] = _audb_mapped_column(
        _AudBString(30),
        nullable=False,
        index=True,
    )
    reviewed_by: _AudBMapped[str] = _audb_mapped_column(
        _AudBString(150),
        nullable=False,
    )
    review_date: _AudBMapped[object] = _audb_mapped_column(
        _AudBDate,
        nullable=False,
        index=True,
    )
    previous_residual_risk_level: _AudBMapped[str] = _audb_mapped_column(
        _AudBString(20),
        nullable=False,
    )
    new_residual_risk_level: _AudBMapped[str] = _audb_mapped_column(
        _AudBString(20),
        nullable=False,
    )
    treatment_progress: _AudBMapped[str] = _audb_mapped_column(
        _AudBText,
        nullable=False,
    )
    review_summary: _AudBMapped[str] = _audb_mapped_column(
        _AudBText,
        nullable=False,
    )
    evidence_reference: _AudBMapped[str] = _audb_mapped_column(
        _AudBString(500),
        nullable=False,
    )
    next_review_date: _AudBMapped[object] = _audb_mapped_column(
        _AudBDate,
        nullable=False,
        index=True,
    )
    created_at: _AudBMapped[object] = _audb_mapped_column(
        _AudBDateTime(timezone=True),
        server_default=_audb_func.now(),
        nullable=False,
    )


class AuditRiskAcceptance(Base):
    __tablename__ = "audit_risk_acceptances"

    id: _AudBMapped[_audb_uuid.UUID] = _audb_mapped_column(
        _AudBUUID(as_uuid=True),
        primary_key=True,
        default=_audb_uuid.uuid4,
    )
    risk_id: _AudBMapped[_audb_uuid.UUID] = _audb_mapped_column(
        _AudBUUID(as_uuid=True),
        _AudBForeignKey("enterprise_risks.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    rationale: _AudBMapped[str] = _audb_mapped_column(
        _AudBText,
        nullable=False,
    )
    compensating_controls: _AudBMapped[str] = _audb_mapped_column(
        _AudBText,
        nullable=False,
    )
    treatment_commitment: _AudBMapped[str] = _audb_mapped_column(
        _AudBText,
        nullable=False,
    )
    requested_by: _AudBMapped[str] = _audb_mapped_column(
        _AudBString(150),
        nullable=False,
    )
    within_approved_appetite_confirmed: _AudBMapped[bool] = _audb_mapped_column(
        _AudBBoolean,
        nullable=False,
        default=False,
    )
    risk_appetite_reference: _AudBMapped[str | None] = _audb_mapped_column(
        _AudBString(500),
        nullable=True,
    )
    accepted_until: _AudBMapped[object] = _audb_mapped_column(
        _AudBDate,
        nullable=False,
        index=True,
    )
    status: _AudBMapped[str] = _audb_mapped_column(
        _AudBString(40),
        nullable=False,
        default="pending_approval",
        index=True,
    )
    approval_id: _AudBMapped[_audb_uuid.UUID] = _audb_mapped_column(
        _AudBUUID(as_uuid=True),
        _AudBForeignKey("approvals.id"),
        nullable=False,
        index=True,
    )
    closed_by: _AudBMapped[str | None] = _audb_mapped_column(
        _AudBString(150),
        nullable=True,
    )
    closed_at: _AudBMapped[object | None] = _audb_mapped_column(
        _AudBDateTime(timezone=True),
        nullable=True,
    )
    closure_evidence_reference: _AudBMapped[str | None] = _audb_mapped_column(
        _AudBString(500),
        nullable=True,
    )
    notes: _AudBMapped[str | None] = _audb_mapped_column(
        _AudBText,
        nullable=True,
    )
    acceptance_metadata: _AudBMapped[dict] = _audb_mapped_column(
        _AudBJSONB,
        nullable=False,
        default=dict,
    )
    created_at: _AudBMapped[object] = _audb_mapped_column(
        _AudBDateTime(timezone=True),
        server_default=_audb_func.now(),
        nullable=False,
    )
    updated_at: _AudBMapped[object] = _audb_mapped_column(
        _AudBDateTime(timezone=True),
        server_default=_audb_func.now(),
        onupdate=_audb_func.now(),
        nullable=False,
    )

# ============================================================
# Audit - Phase 1C
# Fraud / Integrity Investigations + independent monitoring of
# exception/delegation registers and authority-matrix review.
# Source modules remain authoritative and read-only.
# ============================================================
import uuid as _audc_uuid

from sqlalchemy import (
    Boolean as _AudCBoolean,
    Date as _AudCDate,
    DateTime as _AudCDateTime,
    ForeignKey as _AudCForeignKey,
    String as _AudCString,
    Text as _AudCText,
    func as _audc_func,
)
from sqlalchemy.dialects.postgresql import (
    JSONB as _AudCJSONB,
    UUID as _AudCUUID,
)
from sqlalchemy.orm import (
    Mapped as _AudCMapped,
    mapped_column as _audc_mapped_column,
)


class AuditIntegrityInvestigation(Base):
    __tablename__ = "audit_integrity_investigations"

    id: _AudCMapped[_audc_uuid.UUID] = _audc_mapped_column(
        _AudCUUID(as_uuid=True),
        primary_key=True,
        default=_audc_uuid.uuid4,
    )
    code: _AudCMapped[str] = _audc_mapped_column(
        _AudCString(80),
        unique=True,
        nullable=False,
        index=True,
    )
    case_type: _AudCMapped[str] = _audc_mapped_column(
        _AudCString(40),
        nullable=False,
        index=True,
    )
    title: _AudCMapped[str] = _audc_mapped_column(
        _AudCString(300),
        nullable=False,
        index=True,
    )
    allegation_summary: _AudCMapped[str] = _audc_mapped_column(
        _AudCText,
        nullable=False,
    )
    received_channel: _AudCMapped[str] = _audc_mapped_column(
        _AudCString(50),
        nullable=False,
    )
    anonymous_reporter: _AudCMapped[bool] = _audc_mapped_column(
        _AudCBoolean,
        nullable=False,
        default=False,
    )
    reporter_reference: _AudCMapped[str | None] = _audc_mapped_column(
        _AudCString(250),
        nullable=True,
    )
    reporter_protection_required: _AudCMapped[bool] = _audc_mapped_column(
        _AudCBoolean,
        nullable=False,
        default=True,
    )
    retaliation_monitoring_required: _AudCMapped[bool] = _audc_mapped_column(
        _AudCBoolean,
        nullable=False,
        default=True,
    )
    severity: _AudCMapped[str] = _audc_mapped_column(
        _AudCString(20),
        nullable=False,
        default="high",
        index=True,
    )
    investigator: _AudCMapped[str] = _audc_mapped_column(
        _AudCString(150),
        nullable=False,
    )
    independence_confirmed: _AudCMapped[bool] = _audc_mapped_column(
        _AudCBoolean,
        nullable=False,
        default=False,
    )
    conflict_check_confirmed: _AudCMapped[bool] = _audc_mapped_column(
        _AudCBoolean,
        nullable=False,
        default=False,
    )
    status: _AudCMapped[str] = _audc_mapped_column(
        _AudCString(40),
        nullable=False,
        default="pending_approval",
        index=True,
    )
    approval_id: _AudCMapped[_audc_uuid.UUID] = _audc_mapped_column(
        _AudCUUID(as_uuid=True),
        _AudCForeignKey("approvals.id"),
        nullable=False,
        index=True,
    )
    findings_summary: _AudCMapped[str | None] = _audc_mapped_column(
        _AudCText,
        nullable=True,
    )
    outcome: _AudCMapped[str | None] = _audc_mapped_column(
        _AudCString(40),
        nullable=True,
        index=True,
    )
    investigation_report_reference: _AudCMapped[str | None] = _audc_mapped_column(
        _AudCString(500),
        nullable=True,
    )
    hr_referral_recommended: _AudCMapped[bool] = _audc_mapped_column(
        _AudCBoolean,
        nullable=False,
        default=False,
    )
    legal_referral_recommended: _AudCMapped[bool] = _audc_mapped_column(
        _AudCBoolean,
        nullable=False,
        default=False,
    )
    regulatory_referral_recommended: _AudCMapped[bool] = _audc_mapped_column(
        _AudCBoolean,
        nullable=False,
        default=False,
    )
    external_referral_recommended: _AudCMapped[bool] = _audc_mapped_column(
        _AudCBoolean,
        nullable=False,
        default=False,
    )
    opened_at: _AudCMapped[object | None] = _audc_mapped_column(
        _AudCDateTime(timezone=True),
        nullable=True,
    )
    closed_at: _AudCMapped[object | None] = _audc_mapped_column(
        _AudCDateTime(timezone=True),
        nullable=True,
    )
    notes: _AudCMapped[str | None] = _audc_mapped_column(
        _AudCText,
        nullable=True,
    )
    investigation_metadata: _AudCMapped[dict] = _audc_mapped_column(
        _AudCJSONB,
        nullable=False,
        default=dict,
    )
    created_at: _AudCMapped[object] = _audc_mapped_column(
        _AudCDateTime(timezone=True),
        server_default=_audc_func.now(),
        nullable=False,
    )
    updated_at: _AudCMapped[object] = _audc_mapped_column(
        _AudCDateTime(timezone=True),
        server_default=_audc_func.now(),
        onupdate=_audc_func.now(),
        nullable=False,
    )


class AuditGovernanceMonitoringReview(Base):
    __tablename__ = "audit_governance_monitoring_reviews"

    id: _AudCMapped[_audc_uuid.UUID] = _audc_mapped_column(
        _AudCUUID(as_uuid=True),
        primary_key=True,
        default=_audc_uuid.uuid4,
    )
    code: _AudCMapped[str] = _audc_mapped_column(
        _AudCString(80),
        unique=True,
        nullable=False,
        index=True,
    )
    review_type: _AudCMapped[str] = _audc_mapped_column(
        _AudCString(50),
        nullable=False,
        index=True,
    )
    period_label: _AudCMapped[str] = _audc_mapped_column(
        _AudCString(100),
        nullable=False,
    )
    reviewed_by: _AudCMapped[str] = _audc_mapped_column(
        _AudCString(150),
        nullable=False,
    )
    review_date: _AudCMapped[object] = _audc_mapped_column(
        _AudCDate,
        nullable=False,
        index=True,
    )
    evidence_reference: _AudCMapped[str] = _audc_mapped_column(
        _AudCString(500),
        nullable=False,
    )
    source_snapshot: _AudCMapped[dict] = _audc_mapped_column(
        _AudCJSONB,
        nullable=False,
        default=dict,
    )
    observations: _AudCMapped[str] = _audc_mapped_column(
        _AudCText,
        nullable=False,
    )
    follow_up_required: _AudCMapped[bool] = _audc_mapped_column(
        _AudCBoolean,
        nullable=False,
        default=False,
    )
    next_review_date: _AudCMapped[object] = _audc_mapped_column(
        _AudCDate,
        nullable=False,
        index=True,
    )
    status: _AudCMapped[str] = _audc_mapped_column(
        _AudCString(30),
        nullable=False,
        default="completed",
        index=True,
    )
    notes: _AudCMapped[str | None] = _audc_mapped_column(
        _AudCText,
        nullable=True,
    )
    created_at: _AudCMapped[object] = _audc_mapped_column(
        _AudCDateTime(timezone=True),
        server_default=_audc_func.now(),
        nullable=False,
    )
