from datetime import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.household import HouseholdActivityLog, HouseholdMember
from app.models.task import HouseholdTask
from app.models.notification import Notification
from app.core.deps import get_current_user, require_household_member
from app.schemas.task import HouseholdTaskCreate, HouseholdTaskUpdate, HouseholdTaskResponse

router = APIRouter(prefix="/households/{household_id}/tasks", tags=["Tasks & Chores"])

@router.post("/", response_model=HouseholdTaskResponse, status_code=status.HTTP_201_CREATED)
def create_task(
    household_id: str,
    task_in: HouseholdTaskCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    require_household_member(household_id, current_user, db)

    assigned_user = None
    if task_in.assigned_to_id:
        # Validate that the assigned user is an ACTIVE member of this household
        mem = db.query(HouseholdMember).filter(
            HouseholdMember.household_id == household_id,
            HouseholdMember.user_id == task_in.assigned_to_id
        ).first()
        if not mem:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Assigned user must be an active member of this household."
            )
        assigned_user = db.query(User).filter(User.id == task_in.assigned_to_id).first()

    task = HouseholdTask(
        household_id=household_id,
        creator_id=current_user.id,
        title=task_in.title.strip(),
        description=task_in.description.strip() if task_in.description else None,
        assigned_to_id=task_in.assigned_to_id,
        due_date=task_in.due_date,
        recurrence=task_in.recurrence or "none",
        status="pending"
    )
    db.add(task)

    # Activity log
    assignee_name = assigned_user.full_name if assigned_user else "Unassigned"
    act = HouseholdActivityLog(
        household_id=household_id,
        user_id=current_user.id,
        action_type="task_created",
        description=f"{current_user.full_name} created task '{task.title}' assigned to {assignee_name}"
    )
    db.add(act)

    # Send Notification to assigned flatmate
    if assigned_user and assigned_user.id != current_user.id:
        notif = Notification(
            user_id=assigned_user.id,
            type="task_assigned",
            title="New Chore Assigned to You",
            message=f"{current_user.full_name} assigned you the task: '{task.title}'",
            link_url=f"/households?tab=tasks&id={task.id}"
        )
        db.add(notif)

    db.commit()
    db.refresh(task)
    return task

@router.get("/", response_model=List[HouseholdTaskResponse])
def list_tasks(
    household_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    require_household_member(household_id, current_user, db)
    tasks = db.query(HouseholdTask).filter(HouseholdTask.household_id == household_id).order_by(HouseholdTask.created_at.desc()).all()
    return tasks

@router.put("/{task_id}", response_model=HouseholdTaskResponse)
def update_task(
    household_id: str,
    task_id: str,
    task_in: HouseholdTaskUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    require_household_member(household_id, current_user, db)
    task = db.query(HouseholdTask).filter(HouseholdTask.id == task_id, HouseholdTask.household_id == household_id).first()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    if task_in.title is not None:
        task.title = task_in.title.strip()
    if task_in.description is not None:
        task.description = task_in.description.strip()
    if task_in.assigned_to_id is not None:
        if task_in.assigned_to_id != "":
            # Validate membership
            mem = db.query(HouseholdMember).filter(
                HouseholdMember.household_id == household_id,
                HouseholdMember.user_id == task_in.assigned_to_id
            ).first()
            if not mem:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Assigned user must be an active member of this household."
                )
            task.assigned_to_id = task_in.assigned_to_id
            # Notify newly assigned user
            if task_in.assigned_to_id != current_user.id:
                notif = Notification(
                    user_id=task_in.assigned_to_id,
                    type="task_reassigned",
                    title="Task Assigned to You",
                    message=f"{current_user.full_name} assigned you the task: '{task.title}'",
                    link_url=f"/households?tab=tasks&id={task.id}"
                )
                db.add(notif)
        else:
            task.assigned_to_id = None

    if task_in.due_date is not None:
        task.due_date = task_in.due_date
    if task_in.recurrence is not None:
        task.recurrence = task_in.recurrence
    if task_in.status is not None:
        task.status = task_in.status
        if task_in.status == "completed":
            task.completed_at = datetime.utcnow()
            act = HouseholdActivityLog(
                household_id=household_id,
                user_id=current_user.id,
                action_type="task_completed",
                description=f"{current_user.full_name} completed task '{task.title}'"
            )
            db.add(act)

    db.commit()
    db.refresh(task)
    return task

@router.delete("/{task_id}")
def delete_task(
    household_id: str,
    task_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    mem = require_household_member(household_id, current_user, db)
    task = db.query(HouseholdTask).filter(HouseholdTask.id == task_id, HouseholdTask.household_id == household_id).first()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    db.delete(task)
    db.commit()
    return {"message": "Task deleted successfully"}
