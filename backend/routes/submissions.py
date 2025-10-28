from flask import Blueprint, request, jsonify
from database import db
from models import Submission

bp = Blueprint("submissions", __name__, url_prefix="/submissions")


@bp.post("/import")
def import_submissions():
    try:
        print("=== Import route hit ===")
        payload = request.get_json(force=True)
        print("Payload received:", payload)
        if not isinstance(payload, list):
            return {"error": "Expected a JSON array"}, 400
        count = 0
        for s in payload:
            print(f"Processing submission: {s.get('id')}")
            sub = Submission.from_ingest(s)
            # Upsert: replace if exists
            existing = db.session.get(Submission, sub.id)
            if existing:
                print(f"Deleting existing submission: {existing.id}")
                db.session.delete(existing)
            db.session.add(sub)
            count += 1
        print("About to commit to database…")
        db.session.commit()
        print("Successfully committed to database")
        return {"status": "ok", "imported": count}
    except Exception as e:
        print(f"ERROR in import_submissions: {e}")
        import traceback
        traceback.print_exc()
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
        Submission.query.delete()
        db.session.commit()
        return {"status": "ok", "deleted": count}
    except Exception as e:
        db.session.rollback()
        print(f"ERROR clearing submissions: {e}")
        return {"error": str(e)}, 500
