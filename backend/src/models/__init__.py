"""Import all ORM models so that Alembic can auto-detect them.

Every concrete model class must be imported here.  When new models are
added, add the corresponding import line below.
"""

from src.models.achievement import Achievement, AchievementResumeLink, AchievementRoleMatch
from src.models.agent import AgentRun, UpdateSuggestion
from src.models.gap import GapItem
from src.models.jd import JDResumeTask, JDSnapshot
from src.models.profile import CareerProfile
from src.models.work_experience import WorkExperience
from src.models.education import Education
from src.models.project import Project
from src.models.resume import Resume, ResumeVersion
from src.models.story import InterviewStory
from src.models.skill import SkillEntity
from src.models.target_role import RoleCapabilityModel, TargetRole
from src.models.user import User
from src.models.workspace import Workspace, WorkspaceMember
from src.models.capability_assessment import CapabilityAssessmentSnapshot
from src.models.coach_context import PerformanceContextItem, PerformanceTask, PerformanceProgressEntry
from src.models.knowledge import KnowledgeDomain, KnowledgeQuestion, ResumeDomainLink
from src.models.personal_okr import PersonalObjective, PersonalKeyResult
from src.models.weekly_review import WeeklyReviewRun

__all__ = [
    "User",
    "Workspace",
    "WorkspaceMember",
    "TargetRole",
    "RoleCapabilityModel",
    "Resume",
    "ResumeVersion",
    "Achievement",
    "AchievementRoleMatch",
    "AchievementResumeLink",
    "SkillEntity",
    "GapItem",
    "JDSnapshot",
    "JDResumeTask",
    "AgentRun",
    "UpdateSuggestion",
    "CareerProfile",
    "WorkExperience",
    "Education",
    "Project",
    "InterviewStory",
    "CapabilityAssessmentSnapshot",
    "PerformanceContextItem",
    "PerformanceTask",
    "PerformanceProgressEntry",
    "KnowledgeDomain",
    "KnowledgeQuestion",
    "ResumeDomainLink",
    "PersonalObjective",
    "PersonalKeyResult",
    "WeeklyReviewRun",
]
