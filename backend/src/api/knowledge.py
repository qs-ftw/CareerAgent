from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, Path, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.database import get_db
from src.core.security import get_current_user_id, get_current_workspace_id
from src.schemas.knowledge import (
    KnowledgeDomainCreate,
    KnowledgeDomainResponse,
    KnowledgeDomainUpdate,
    KnowledgeQuestionCreate,
    KnowledgeQuestionResponse,
    KnowledgeQuestionUpdate,
    ResumeDomainLinkRequest,
)
from src.services import knowledge_service

router = APIRouter(prefix="/knowledge", tags=["knowledge"])


@router.get(
    "/domains",
    response_model=list[KnowledgeDomainResponse],
    summary="List all knowledge domains",
)
async def list_domains(
    resume_id: uuid.UUID | None = Query(default=None, description="Optional resume ID to filter linked domains"),
    db: AsyncSession = Depends(get_db),
) -> list[KnowledgeDomainResponse]:
    """Return all knowledge domains for the current user."""
    user_id = await get_current_user_id()
    return await knowledge_service.list_domains(db, user_id, resume_id=resume_id)


@router.post(
    "/domains",
    response_model=KnowledgeDomainResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new knowledge domain",
)
async def create_domain(
    body: KnowledgeDomainCreate,
    db: AsyncSession = Depends(get_db),
) -> KnowledgeDomainResponse:
    """Create a new knowledge domain."""
    user_id = await get_current_user_id()
    workspace_id = await get_current_workspace_id()
    return await knowledge_service.create_domain(db, user_id, workspace_id, body)


@router.patch(
    "/domains/{domain_id}",
    response_model=KnowledgeDomainResponse,
    summary="Update a knowledge domain",
)
async def update_domain(
    body: KnowledgeDomainUpdate,
    domain_id: uuid.UUID = Path(..., description="The domain UUID"),
    db: AsyncSession = Depends(get_db),
) -> KnowledgeDomainResponse:
    """Update a knowledge domain."""
    user_id = await get_current_user_id()
    domain = await knowledge_service.update_domain(db, domain_id, user_id, body)
    if not domain:
        raise HTTPException(status_code=404, detail="Domain not found")
    return domain


@router.delete(
    "/domains/{domain_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a knowledge domain",
)
async def delete_domain(
    domain_id: uuid.UUID = Path(..., description="The domain UUID"),
    db: AsyncSession = Depends(get_db),
) -> None:
    """Delete a knowledge domain."""
    user_id = await get_current_user_id()
    deleted = await knowledge_service.delete_domain(db, domain_id, user_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Domain not found")


@router.get(
    "/domains/{domain_id}/questions",
    response_model=list[KnowledgeQuestionResponse],
    summary="List questions for a domain",
)
async def list_questions(
    domain_id: uuid.UUID = Path(..., description="The domain UUID"),
    db: AsyncSession = Depends(get_db),
) -> list[KnowledgeQuestionResponse]:
    """Return all questions for a specific knowledge domain."""
    user_id = await get_current_user_id()
    return await knowledge_service.list_questions(db, user_id, domain_id)


@router.post(
    "/domains/{domain_id}/questions",
    response_model=KnowledgeQuestionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a question in a domain",
)
async def create_question(
    body: KnowledgeQuestionCreate,
    domain_id: uuid.UUID = Path(..., description="The domain UUID"),
    db: AsyncSession = Depends(get_db),
) -> KnowledgeQuestionResponse:
    """Create a new question for a domain."""
    user_id = await get_current_user_id()
    workspace_id = await get_current_workspace_id()
    return await knowledge_service.create_question(db, user_id, workspace_id, domain_id, body)


@router.patch(
    "/questions/{question_id}",
    response_model=KnowledgeQuestionResponse,
    summary="Update a question",
)
async def update_question(
    body: KnowledgeQuestionUpdate,
    question_id: uuid.UUID = Path(..., description="The question UUID"),
    db: AsyncSession = Depends(get_db),
) -> KnowledgeQuestionResponse:
    """Update a question."""
    user_id = await get_current_user_id()
    question = await knowledge_service.update_question(db, question_id, user_id, body)
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    return question


@router.delete(
    "/questions/{question_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a question",
)
async def delete_question(
    question_id: uuid.UUID = Path(..., description="The question UUID"),
    db: AsyncSession = Depends(get_db),
) -> None:
    """Delete a question."""
    user_id = await get_current_user_id()
    deleted = await knowledge_service.delete_question(db, question_id, user_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Question not found")


@router.get(
    "/resumes/{resume_id}/domains",
    response_model=list[uuid.UUID],
    summary="Get linked domain IDs for a resume",
)
async def get_linked_domains(
    resume_id: uuid.UUID = Path(..., description="The resume UUID"),
    db: AsyncSession = Depends(get_db),
) -> list[uuid.UUID]:
    """Return a list of domain IDs linked to a resume."""
    user_id = await get_current_user_id()
    return await knowledge_service.get_linked_domains_for_resume(db, user_id, resume_id)


@router.post(
    "/resumes/{resume_id}/domains",
    status_code=status.HTTP_200_OK,
    summary="Link domains to a resume",
)
async def link_domains(
    body: ResumeDomainLinkRequest,
    resume_id: uuid.UUID = Path(..., description="The resume UUID"),
    db: AsyncSession = Depends(get_db),
) -> dict[str, str]:
    """Link multiple domains to a resume, replacing existing links."""
    user_id = await get_current_user_id()
    workspace_id = await get_current_workspace_id()
    await knowledge_service.link_domains_to_resume(db, user_id, workspace_id, resume_id, body.domain_ids)
    return {"status": "success"}
