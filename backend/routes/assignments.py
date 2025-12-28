from flask import Blueprint, request, jsonify
from database import db
from models import Assignment, Submission, Judge

bp = Blueprint("assignments", __name__, url_prefix="/assignments")


@bp.post("")
def upsert_assignment():
    try:
        data = request.get_json(force=True)
        required = ["submissionId", "questionId", "judgeId"]
        
        if not all(data.get(field) for field in required):
            return {"error": "Missing required fields"}, 400

        if not db.session.get(Judge, data["judgeId"]):
            return {"error": "Judge not found"}, 404
        if not db.session.get(Submission, data["submissionId"]):
            return {"error": "Submission not found"}, 404

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
        return {"id": assignment.id}
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
        return {"deleted": count}
    except Exception as e:
        db.session.rollback()
        return {"error": str(e)}, 500
