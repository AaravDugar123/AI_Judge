from flask import Blueprint, request, jsonify
from database import db
from models import Submission

bp = Blueprint("submissions", __name__, url_prefix="/submissions")


@bp.post("/import")
def import_submissions():
    try:
        payload = request.get_json(force=True)
        if not isinstance(payload, list):
            return {"error": "Expected a JSON array"}, 400

        count = 0
        for item in payload:
            # Upsert: replace if exists
            existing = db.session.get(Submission, item["id"])
            if existing:
                db.session.delete(existing)
                db.session.flush()  # Ensure delete completes before insert

            sub = Submission.from_ingest(item)
            db.session.add(sub)
            count += 1

        db.session.commit()
        return {"status": "ok", "imported": count}
    except Exception as e:
        db.session.rollback()
        return {"error": str(e)}, 500


@bp.get("")
def list_submissions():
    subs = Submission.query.all()
    return jsonify([
        {"id": s.id, "queueId": s.queue_id,
            "taskId": s.task_id, "createdAt": s.created_at}
        for s in subs
    ])


@bp.delete("/clear")
def clear_all_submissions():
    """Delete all submissions (cascades to questions and answers)"""
    try:
        count = Submission.query.count()
        # Delete each submission individually to trigger cascade
        for submission in Submission.query.all():
            db.session.delete(submission)
        db.session.commit()
        return {"status": "ok", "deleted": count}
    except Exception as e:
        db.session.rollback()
        return {"error": str(e)}, 500
