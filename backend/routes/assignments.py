from flask import Blueprint, request, jsonify
from database import db
from models import Assignment, Submission, Judge

bp = Blueprint("assignments", __name__, url_prefix="/assignments")


@bp.post("")
def upsert_assignment():
    try:
        d = request.get_json(force=True)

        # Validate required fields
        if not d.get("submissionId") or not d.get("questionId") or not d.get("judgeId"):
            return {"error": "Missing required fields: submissionId, questionId, judgeId"}, 400

        # Check if judge exists and is active
        judge = db.session.get(Judge, d["judgeId"])
        if not judge:
            return {"error": f"Judge with ID {d['judgeId']} not found"}, 404

        # Check if submission exists
        submission = db.session.get(Submission, d["submissionId"])
        if not submission:
            return {"error": f"Submission with ID '{d['submissionId']}' not found"}, 404

        a = Assignment(
            submission_id=d["submissionId"],
            question_id=d["questionId"],
            judge_id=d["judgeId"],
        )
        # naive upsert: delete conflicts then insert
        Assignment.query.filter_by(
            submission_id=a.submission_id,
            question_id=a.question_id,
            judge_id=a.judge_id,
        ).delete()
        db.session.add(a)
        db.session.commit()
        return {"ok": True, "id": a.id}
    except Exception as e:
        db.session.rollback()
        print(f"ERROR creating assignment: {e}")
        return {"error": str(e)}, 500


@bp.get("")
def list_assignments():
    rows = Assignment.query.all()
    return jsonify([
        {"id": r.id, "submissionId": r.submission_id,
            "questionId": r.question_id, "judgeId": r.judge_id}
        for r in rows
    ])


@bp.delete("/clear")
def clear_all_assignments():
    """Delete all assignments"""
    try:
        count = Assignment.query.count()
        Assignment.query.delete()
        db.session.commit()
        return {"status": "ok", "deleted": count}
    except Exception as e:
        db.session.rollback()
        print(f"ERROR clearing assignments: {e}")
        return {"error": str(e)}, 500
