from flask import Blueprint, request, jsonify
from database import db
from models import Judge
from llm import get_valid_models, VALID_OPENAI_MODELS

bp = Blueprint("judges", __name__, url_prefix="/judges")


@bp.get("/models")
def list_models():
    """Return list of valid OpenAI models."""
    return jsonify({"models": get_valid_models()})


@bp.get("")
def list_judges():
    judges = Judge.query.order_by(Judge.created_at.desc()).all()
    return jsonify([{
        "id": j.id,
        "name": j.name,
        "prompt": j.prompt,
        "modelName": j.model_name,
        "active": j.active,
        "createdAt": j.created_at.isoformat()
    } for j in judges])


@bp.post("")
def create_judge():
    data = request.get_json(force=True)
    model_name = data.get("modelName")

    # Validate model name
    if model_name and model_name not in VALID_OPENAI_MODELS:
        return {"error": f"Invalid model '{model_name}'. Valid models: {', '.join(sorted(VALID_OPENAI_MODELS))}"}, 400

    judge = Judge(
        name=data["name"],
        prompt=data["prompt"],
        model_name=model_name,
        active=data.get("active", True)
    )
    db.session.add(judge)
    db.session.commit()
    return {"id": judge.id}, 201


@bp.put("/<int:judge_id>")
def update_judge(judge_id: int):
    judge = db.session.get(Judge, judge_id)
    if not judge:
        return {"error": "Judge not found"}, 404

    data = request.get_json(force=True)
    model_name = data.get("modelName")

    # Validate model name if being updated
    if model_name and model_name not in VALID_OPENAI_MODELS:
        return {"error": f"Invalid model '{model_name}'. Valid models: {', '.join(sorted(VALID_OPENAI_MODELS))}"}, 400

    # Update fields
    judge.name = data.get("name", judge.name)
    judge.prompt = data.get("prompt", judge.prompt)
    judge.model_name = model_name or judge.model_name
    judge.active = data.get("active", judge.active)

    db.session.commit()
    return {"ok": True}


@bp.delete("/<int:judge_id>")
def delete_judge(judge_id: int):
    judge = db.session.get(Judge, judge_id)
    if not judge:
        return {"error": "Judge not found"}, 404

    db.session.delete(judge)
    db.session.commit()
    return {"ok": True}
