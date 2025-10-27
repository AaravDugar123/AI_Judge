from flask import Blueprint, request, jsonify
from database import db
from models import Assignment

bp = Blueprint("assignments", __name__, url_prefix="/assignments")

@bp.post("")
def upsert_assignment():
    d = request.get_json(force=True)
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

@bp.get("")
def list_assignments():
    rows = Assignment.query.all()
    return jsonify([
        {"id": r.id, "submissionId": r.submission_id, "questionId": r.question_id, "judgeId": r.judge_id}
        for r in rows
    ])