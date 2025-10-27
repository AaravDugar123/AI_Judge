import os
import json
from typing import Dict
from pydantic import BaseModel, ValidationError
from dotenv import load_dotenv
import openai

load_dotenv()
# Set up OpenAI client
client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
MODEL_NAME = os.getenv("MODEL_NAME", "gpt-3.5-turbo")


class EvalSchema(BaseModel):
    verdict: str  # "pass" | "fail" | "inconclusive"
    reasoning: str


SYSTEM_INSTRUCTIONS = (
    "You are an AI Judge. Return STRICT JSON only. Keys: verdict, reasoning."
)

PROMPT_TEMPLATE = (
    "Judge the human answer against the question.\n"
    "Question: {q}\n"
    "Answer: {a}\n"
    "Rubric: {r}\n"
    "Respond as JSON with keys verdict (pass|fail|inconclusive) and reasoning."
)


def evaluate(q_text: str, a_text: str, rubric: str, model_name: str | None = None) -> Dict:
    model = model_name or MODEL_NAME
    user = PROMPT_TEMPLATE.format(q=q_text, a=a_text, r=rubric)

    resp = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": SYSTEM_INSTRUCTIONS},
            {"role": "user", "content": user},
        ],
        temperature=0,
        max_tokens=150,
        response_format={"type": "json_object"},
    )
    content = resp.choices[0].message.content

    # best effort to parse JSON
    try:
        parsed = EvalSchema.model_validate_json(content)
        return {"ok": True, **parsed.model_dump()}
    except ValidationError as e:
        return {"ok": False, "verdict": "inconclusive", "reasoning": str(e)}
    except Exception as e:
        return {"ok": False, "verdict": "inconclusive", "reasoning": f"Evaluation error: {str(e)}"}
