from flask import Blueprint, request, jsonify
from sqlalchemy import and_
from database import db
from models import Submission, Question, Answer, Judge, Assignment, Evaluation
from llm import evaluate

bp = Blueprint("evaluations", __name__, url_prefix="/evaluations")


@bp.post("/run")
def run():
    d = request.get_json(force=True)
    queue_id = d.get("queueId")
    # fetch submissions for queue
    subs = Submission.query.filter_by(
        queue_id=queue_id).all() if queue_id else Submission.query.all()

    planned = 0
    completed = 0
    failed = 0

    for s in subs:
        # questions for this submission
        qs = {q.id: q for q in s.questions}
        # answers keyed by question template id
        ans_map = {a.question_id: a for a in s.answers}
        # assignments for this submission
        assigns = Assignment.query.filter_by(submission_id=s.id).all()
        for a in assigns:
            planned += 1
            q = qs.get(a.question_id)
            ans = ans_map.get(a.question_id)
            j = db.session.get(Judge, a.judge_id)
            if not (q and ans and j and j.active):
                failed += 1
                continue
            a_text = (ans.choice or "") + (". Reason: " +
                                           ans.reasoning if ans.reasoning else "")
            res = evaluate(q.question_text or "", a_text,
                           j.prompt or "", j.model_name)
            try:
                ev = Evaluation(
                    submission_id=s.id,
                    question_id=q.id,
                    judge_id=j.id,
                    verdict=res.get("verdict", "inconclusive"),
                    reasoning=res.get("reasoning", ""),
                )
                db.session.add(ev)
                db.session.commit()
                completed += 1
            except Exception:
                db.session.rollback()
                failed += 1

    return {"planned": planned, "completed": completed, "failed": failed}


@bp.get("")
def list_evals():
    judge_ids = request.args.getlist("judgeId")
    question_ids = request.args.getlist("questionId")
    verdicts = request.args.getlist("verdict")

    q = Evaluation.query
    if judge_ids:
        q = q.filter(Evaluation.judge_id.in_(judge_ids))
    if question_ids:
        q = q.filter(Evaluation.question_id.in_(question_ids))
    if verdicts:
        q = q.filter(Evaluation.verdict.in_(verdicts))

    rows = q.order_by(Evaluation.created_at.desc()).all()
    # compute pass rate summary
    total = len(rows)
    passed = sum(1 for r in rows if r.verdict == "pass")
    pass_rate = round((passed / total) * 100, 2) if total else 0

    return jsonify({
        "summary": {"total": total, "pass": passed, "passRatePct": pass_rate},
        "items": [
            {
                "id": r.id,
                "submissionId": r.submission_id,
                "questionId": r.question_id,
                "judgeId": r.judge_id,
                "verdict": r.verdict,
                "reasoning": r.reasoning,
                "createdAt": r.created_at.isoformat(),
            }
            for r in rows
        ],
    })
