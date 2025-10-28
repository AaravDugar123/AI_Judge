from flask import Blueprint, request, jsonify
from database import db
from models import Assignment, Submission, Judge

bp = Blueprint("assignments", __name__, url_prefix="/assignments")


@bp.post("")
def upsert_assignment():
    try:
        data = request.get_json(force=True)

        # Validate required fields
        if not all(data.get(field) for field in ["submissionId", "questionId", "judgeId"]):
            return {"error": "Missing required fields: submissionId, questionId, judgeId"}, 400

        # Verify referenced entities exist
        judge = db.session.get(Judge, data["judgeId"])
        if not judge:
            return {"error": f"Judge with ID {data['judgeId']} not found"}, 404

        submission = db.session.get(Submission, data["submissionId"])
        if not submission:
            return {"error": f"Submission with ID '{data['submissionId']}' not found"}, 404

        # Upsert: delete conflicts then insert
        Assignment.query.filter_by(
            submission_id=data["submissionId"],
            question_id=data["questionId"],
            judge_id=data["judgeId"],
        ).delete()

        assignment = Assignment(
            submission_id=data["submissionId"],
            question_id=data["questionId"],
            judge_id=data["judgeId"],
        )
        db.session.add(assignment)
        db.session.commit()
        return {"ok": True, "id": assignment.id}
    except Exception as e:
        db.session.rollback()
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
        return {"error": str(e)}, 500
