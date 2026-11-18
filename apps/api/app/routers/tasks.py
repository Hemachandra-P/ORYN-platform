from datetime import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.household import HouseholdActivityLog
from app.models.task import HouseholdTask
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

    task = HouseholdTask(
        household_id=household_id,
        title=task_in.title,
        description=task_in.description,
        assigned_to_id=task_in.assigned_to_id,
        due_date=task_in.due_date,
        recurrence=task_in.recurrence or "none",
        status="todo"
    )
    db.add(task)

    act = HouseholdActivityLog(
        household_id=household_id,
        user_id=current_user.id,
        action_type="task_created",
        description=f"{current_user.full_name} created task '{task.title}'"
    )
    db.add(act)

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
        task.title = task_in.title
    if task_in.description is not None:
        task.description = task_in.description
    if task_in.assigned_to_id is not None:
        task.assigned_to_id = task_in.assigned_to_id
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
    require_household_member(household_id, current_user, db)
    task = db.query(HouseholdTask).filter(HouseholdTask.id == task_id, HouseholdTask.household_id == household_id).first()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    db.delete(task)
    db.commit()
    return {"message": "Task deleted successfully"}
