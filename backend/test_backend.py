import requests
import json

BASE = "http://127.0.0.1:5002"


sample_payload = [
    {
        "id": "sub_1",
        "queueId": "queue_1",
        "labelingTaskId": "task_1",
        "createdAt": 1690000000000,
        "questions": [
            {
                "rev": 1,
                "data": {
                    "id": "q_template_1",
                    "questionType": "single_choice_with_reasoning",
                    "questionText": "Is the sky blue?"
                }
            }
        ],
        "answers": {
            "q_template_1": {
                "choice": "yes",
                "reasoning": "Observed on a clear day."
            }
        }
    }
]


def test_import():
    print("Testing /submissions/import ...")
    r = requests.post(f"{BASE}/submissions/import",
                      headers={"Content-Type": "application/json"},
                      data=json.dumps(sample_payload))
    print("Status:", r.status_code)
    print("Response:", r.text)


def test_list():
    print("\nTesting /submissions ...")
    r = requests.get(f"{BASE}/submissions")
    print("Status:", r.status_code)
    print("Response:", r.text)


if __name__ == "__main__":
    test_import()
    test_list()
