from flask import Blueprint, request, jsonify
from database import db
from models import Submission, Judge, Assignment, Evaluation
from llm import evaluate

bp = Blueprint("evaluations", __name__, url_prefix="/evaluations")


@bp.delete("/clear")
def clear_all_evaluations():
    """Delete all evaluations"""
    try:
        count = Evaluation.query.count()
        Evaluation.query.delete()
        db.session.commit()
        return {"deleted": count}
    except Exception as e:
        db.session.rollback()
        return {"error": str(e)}, 500


@bp.post("/run")
def run():
    try:
        data = request.get_json(force=True)
        queue_id = data.get("queueId")

        query = Submission.query.filter_by(queue_id=queue_id) if queue_id else Submission.query
        submissions = query.all()

        if not submissions:
            return {"error": "No submissions found"}, 404

        stats = {"planned": 0, "completed": 0, "failed": 0, "errors": []}

        for submission in submissions:
            questions = {q.id: q for q in submission.questions}
            answers = {a.question_id: a for a in submission.answers}
            assignments = Assignment.query.filter_by(submission_id=submission.id).all()

            for assignment in assignments:
                stats["planned"] += 1
                question = questions.get(assignment.question_id)
                answer = answers.get(assignment.question_id)
                judge = db.session.get(Judge, assignment.judge_id)

                # Validate required data
                if not question or not answer:
                    stats["failed"] += 1
                    continue
                if not judge or not judge.active:
                    stats["failed"] += 1
                    continue

                # Build answer text
                answer_text = f"{answer.choice}. Reason: {answer.reasoning}" if answer.reasoning else answer.choice or ""
                
                # Evaluate
                result = evaluate(question.question_text or "", answer_text, judge.prompt or "", judge.model_name)
                
                if not result.get("ok", True):
                    stats["failed"] += 1
                    if len(stats["errors"]) < 10:
                        stats["errors"].append(result.get("reasoning", "Unknown error"))
                    continue

                try:
                    evaluation = Evaluation(
                        submission_id=submission.id,
                        question_id=question.id,
                        judge_id=judge.id,
                        verdict=result.get("verdict", "inconclusive"),
                        reasoning=result.get("reasoning", ""),
                    )
                    db.session.add(evaluation)
                    db.session.commit()
                    stats["completed"] += 1
                except Exception as e:
                    db.session.rollback()
                    stats["failed"] += 1

        if not stats["errors"]:
            del stats["errors"]
        return stats
    except Exception as e:
        return {"error": str(e)}, 500


@bp.get("")
def list_evals():
    # Build query with optional filters
    query = Evaluation.query

    if judge_ids := request.args.getlist("judgeId"):
        query = query.filter(Evaluation.judge_id.in_(judge_ids))
    if question_ids := request.args.getlist("questionId"):
        query = query.filter(Evaluation.question_id.in_(question_ids))
    if verdicts := request.args.getlist("verdict"):
        query = query.filter(Evaluation.verdict.in_(verdicts))

    evaluations = query.order_by(Evaluation.created_at.desc()).all()

    # Compute pass rate summary
    total = len(evaluations)
    passed = sum(1 for e in evaluations if e.verdict == "pass")
    pass_rate = round((passed / total) * 100, 2) if total else 0

    return jsonify({
        "summary": {
            "total": total,
            "pass": passed,
            "passRatePct": pass_rate
        },
        "items": [{
            "id": e.id,
            "submissionId": e.submission_id,
            "questionId": e.question_id,
            "judgeId": e.judge_id,
            "verdict": e.verdict,
            "reasoning": e.reasoning,
            "createdAt": e.created_at.isoformat(),
        } for e in evaluations]
    })
