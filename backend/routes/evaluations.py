from flask import Blueprint, request, jsonify
from sqlalchemy import and_
from database import db
from models import Submission, Question, Answer, Judge, Assignment, Evaluation
from llm import evaluate

bp = Blueprint("evaluations", __name__, url_prefix="/evaluations")


@bp.delete("/clear")
def clear_all_evaluations():
    """Delete all evaluations"""
    try:
        count = Evaluation.query.count()
        Evaluation.query.delete()
        db.session.commit()
        return {"status": "ok", "deleted": count}
    except Exception as e:
        db.session.rollback()
        print(f"ERROR clearing evaluations: {e}")
        return {"error": str(e)}, 500


@bp.post("/run")
def run():
    try:
        d = request.get_json(force=True)
        queue_id = d.get("queueId")

        # fetch submissions for queue
        subs = Submission.query.filter_by(
            queue_id=queue_id).all() if queue_id else Submission.query.all()

        if not subs:
            return {"error": "No submissions found" if not queue_id else f"No submissions found for queue '{queue_id}'"}, 404

        planned = 0
        completed = 0
        failed = 0
        error_details = []

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

                if not q:
                    error_details.append(f"Question {a.question_id} not found")
                    failed += 1
                    continue
                if not ans:
                    error_details.append(
                        f"Answer for {a.question_id} not found")
                    failed += 1
                    continue
                if not j:
                    error_details.append(
                        f"Judge {a.judge_id} not found or deleted")
                    failed += 1
                    continue
                if not j.active:
                    error_details.append(f"Judge {j.name} is inactive")
                    failed += 1
                    continue

                a_text = (ans.choice or "") + (". Reason: " +
                                               ans.reasoning if ans.reasoning else "")
                res = evaluate(q.question_text or "", a_text,
                               j.prompt or "", j.model_name)

                if not res.get("ok", True):
                    error_details.append(
                        f"Evaluation failed: {res.get('reasoning', 'Unknown error')}")
                    failed += 1
                    continue

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
                except Exception as e:
                    db.session.rollback()
                    error_details.append(f"Database error: {str(e)}")
                    failed += 1

        result = {
            "planned": planned,
            "completed": completed,
            "failed": failed
        }

        # Include error details if there were failures
        if error_details and len(error_details) <= 10:
            result["errors"] = error_details

        return result
    except Exception as e:
        print(f"ERROR in evaluation run: {e}")
        import traceback
        traceback.print_exc()
        return {"error": f"Evaluation failed: {str(e)}"}, 500


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
