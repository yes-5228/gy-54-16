from datetime import datetime

from ..extensions import db
from ..models import GradeBatch


def list_batches():
    return GradeBatch.query.order_by(GradeBatch.created_at.desc()).all()


def get_batch(batch_id):
    return GradeBatch.query.get_or_404(batch_id)


def create_batch(payload):
    batch = GradeBatch(
        name=payload["name"],
        semester=payload["semester"],
        teacher=payload["teacher"],
    )
    db.session.add(batch)
    db.session.commit()
    return batch


def update_batch(batch, payload):
    if "name" in payload:
        batch.name = payload["name"]
    if "semester" in payload:
        batch.semester = payload["semester"]
    if "teacher" in payload:
        batch.teacher = payload["teacher"]
    db.session.commit()
    return batch


def publish_batch(batch):
    batch.status = "published"
    if batch.published_at is None:
        batch.published_at = datetime.utcnow()
    for grade in batch.grades:
        grade.published = True
    db.session.commit()
    return batch, None


def unpublish_batch(batch):
    if batch.status == "draft":
        return batch, "该批次尚未发布"
    batch.status = "draft"
    for grade in batch.grades:
        grade.published = False
    db.session.commit()
    return batch, None


def delete_batch(batch):
    if batch.status == "published":
        return "已发布的批次无法删除，请先撤回发布"
    db.session.delete(batch)
    db.session.commit()
    return None
