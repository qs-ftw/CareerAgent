from __future__ import annotations

import uuid

from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.knowledge import KnowledgeDomain, KnowledgeQuestion, ResumeDomainLink
from src.schemas.knowledge import (
    KnowledgeDomainCreate,
    KnowledgeDomainResponse,
    KnowledgeDomainUpdate,
    KnowledgeQuestionCreate,
    KnowledgeQuestionResponse,
    KnowledgeQuestionUpdate,
)


def _to_domain_response(domain: KnowledgeDomain, question_count: int = 0) -> KnowledgeDomainResponse:
    return KnowledgeDomainResponse(
        id=domain.id,
        name=domain.name,
        tags_json=domain.tags_json or [],
        question_count=question_count,
        created_at=domain.created_at,
        updated_at=domain.updated_at,
    )


def _to_question_response(q: KnowledgeQuestion) -> KnowledgeQuestionResponse:
    return KnowledgeQuestionResponse(
        id=q.id,
        domain_id=q.domain_id,
        question_text=q.question_text,
        answer_markdown=q.answer_markdown,
        is_pinned=q.is_pinned,
        sort_order=q.sort_order,
        created_at=q.created_at,
        updated_at=q.updated_at,
    )


async def list_domains(
    session: AsyncSession,
    user_id: uuid.UUID,
    resume_id: uuid.UUID | None = None,
) -> list[KnowledgeDomainResponse]:
    count_subq = (
        select(
            KnowledgeQuestion.domain_id,
            func.count(KnowledgeQuestion.id).label("q_count"),
        )
        .where(KnowledgeQuestion.user_id == user_id)
        .group_by(KnowledgeQuestion.domain_id)
        .subquery()
    )

    stmt = (
        select(KnowledgeDomain, count_subq.c.q_count)
        .outerjoin(count_subq, KnowledgeDomain.id == count_subq.c.domain_id)
        .where(KnowledgeDomain.user_id == user_id)
    )

    if resume_id:
        stmt = stmt.join(
            ResumeDomainLink,
            (ResumeDomainLink.domain_id == KnowledgeDomain.id)
            & (ResumeDomainLink.resume_id == resume_id),
        )

    stmt = stmt.order_by(KnowledgeDomain.created_at.desc())
    result = await session.execute(stmt)
    rows = result.all()

    return [_to_domain_response(domain, count or 0) for domain, count in rows]


async def create_domain(
    session: AsyncSession,
    user_id: uuid.UUID,
    workspace_id: uuid.UUID,
    data: KnowledgeDomainCreate,
) -> KnowledgeDomainResponse:
    domain = KnowledgeDomain(
        user_id=user_id,
        workspace_id=workspace_id,
        **data.model_dump(),
    )
    session.add(domain)
    await session.flush()
    await session.refresh(domain)
    return _to_domain_response(domain, 0)


async def update_domain(
    session: AsyncSession,
    domain_id: uuid.UUID,
    user_id: uuid.UUID,
    data: KnowledgeDomainUpdate,
) -> KnowledgeDomainResponse | None:
    stmt = select(KnowledgeDomain).where(
        KnowledgeDomain.id == domain_id,
        KnowledgeDomain.user_id == user_id,
    )
    result = await session.execute(stmt)
    domain = result.scalar_one_or_none()
    if not domain:
        return None

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(domain, field, value)

    await session.flush()
    await session.refresh(domain)

    # Get question count
    count_stmt = select(func.count(KnowledgeQuestion.id)).where(
        KnowledgeQuestion.domain_id == domain_id
    )
    count_res = await session.execute(count_stmt)
    count = count_res.scalar() or 0

    return _to_domain_response(domain, count)


async def delete_domain(
    session: AsyncSession,
    domain_id: uuid.UUID,
    user_id: uuid.UUID,
) -> bool:
    stmt = select(KnowledgeDomain).where(
        KnowledgeDomain.id == domain_id,
        KnowledgeDomain.user_id == user_id,
    )
    result = await session.execute(stmt)
    domain = result.scalar_one_or_none()
    if not domain:
        return False

    await session.delete(domain)
    await session.flush()
    return True


async def list_questions(
    session: AsyncSession,
    user_id: uuid.UUID,
    domain_id: uuid.UUID,
) -> list[KnowledgeQuestionResponse]:
    stmt = (
        select(KnowledgeQuestion)
        .where(
            KnowledgeQuestion.domain_id == domain_id,
            KnowledgeQuestion.user_id == user_id,
        )
        .order_by(KnowledgeQuestion.is_pinned.desc(), KnowledgeQuestion.sort_order.asc())
    )
    result = await session.execute(stmt)
    return [_to_question_response(q) for q in result.scalars().all()]


async def create_question(
    session: AsyncSession,
    user_id: uuid.UUID,
    workspace_id: uuid.UUID,
    domain_id: uuid.UUID,
    data: KnowledgeQuestionCreate,
) -> KnowledgeQuestionResponse:
    q = KnowledgeQuestion(
        user_id=user_id,
        workspace_id=workspace_id,
        domain_id=domain_id,
        **data.model_dump(),
    )
    session.add(q)
    await session.flush()
    await session.refresh(q)
    return _to_question_response(q)


async def update_question(
    session: AsyncSession,
    question_id: uuid.UUID,
    user_id: uuid.UUID,
    data: KnowledgeQuestionUpdate,
) -> KnowledgeQuestionResponse | None:
    stmt = select(KnowledgeQuestion).where(
        KnowledgeQuestion.id == question_id,
        KnowledgeQuestion.user_id == user_id,
    )
    result = await session.execute(stmt)
    q = result.scalar_one_or_none()
    if not q:
        return None

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(q, field, value)

    await session.flush()
    await session.refresh(q)
    return _to_question_response(q)


async def delete_question(
    session: AsyncSession,
    question_id: uuid.UUID,
    user_id: uuid.UUID,
) -> bool:
    stmt = select(KnowledgeQuestion).where(
        KnowledgeQuestion.id == question_id,
        KnowledgeQuestion.user_id == user_id,
    )
    result = await session.execute(stmt)
    q = result.scalar_one_or_none()
    if not q:
        return False

    await session.delete(q)
    await session.flush()
    return True


async def link_domains_to_resume(
    session: AsyncSession,
    user_id: uuid.UUID,
    workspace_id: uuid.UUID,
    resume_id: uuid.UUID,
    domain_ids: list[uuid.UUID],
) -> None:
    del_stmt = delete(ResumeDomainLink).where(
        ResumeDomainLink.resume_id == resume_id,
        ResumeDomainLink.user_id == user_id,
    )
    await session.execute(del_stmt)

    for d_id in domain_ids:
        link = ResumeDomainLink(
            user_id=user_id,
            workspace_id=workspace_id,
            resume_id=resume_id,
            domain_id=d_id,
        )
        session.add(link)

    await session.flush()


async def get_linked_domains_for_resume(
    session: AsyncSession,
    user_id: uuid.UUID,
    resume_id: uuid.UUID,
) -> list[uuid.UUID]:
    stmt = select(ResumeDomainLink.domain_id).where(
        ResumeDomainLink.resume_id == resume_id,
        ResumeDomainLink.user_id == user_id,
    )
    result = await session.execute(stmt)
    return list(result.scalars().all())
