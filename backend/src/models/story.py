"""InterviewStory model — reusable STAR-structured interview stories."""

import uuid

from sqlalchemy import Float, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from src.models.base import CommonBase


class InterviewStory(CommonBase):
    __tablename__ = "interview_stories"

    workspace_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("workspaces.id"), nullable=False, index=True,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True,
    )
    question_text: Mapped[str] = mapped_column(Text, nullable=False)
    answer_markdown: Mapped[str | None] = mapped_column(Text, nullable=True, default="")
    theme: Mapped[str] = mapped_column(String(128), nullable=False, default="general")
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="empty")
    linked_achievement_ids: Mapped[list] = mapped_column(JSONB, nullable=True, default=list)
    analysis_chat: Mapped[list] = mapped_column(JSONB, nullable=True, default=list)
    star_summary: Mapped[dict] = mapped_column(JSONB, nullable=True, default=dict)
    confidence_score: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)


class ResumeInterviewAnswer(CommonBase):
    __tablename__ = "resume_interview_answers"

    workspace_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("workspaces.id"), nullable=False, index=True,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True,
    )
    story_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("interview_stories.id"), nullable=False, index=True,
    )
    resume_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("resumes.id"), nullable=True, index=True,
    )
    answer_markdown: Mapped[str | None] = mapped_column(Text, nullable=True, default="")
    analysis_chat: Mapped[list] = mapped_column(JSONB, nullable=True, default=list)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="empty")
    linked_achievement_ids: Mapped[list] = mapped_column(JSONB, nullable=True, default=list)
    star_summary: Mapped[dict] = mapped_column(JSONB, nullable=True, default=dict)
    confidence_score: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
