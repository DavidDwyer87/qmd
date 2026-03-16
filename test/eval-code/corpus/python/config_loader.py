from dataclasses import dataclass
from pathlib import Path
import json


@dataclass
class AppConfig:
    env: str
    db_url: str
    redis_url: str


def load_config(path: str) -> AppConfig:
    data = json.loads(Path(path).read_text())
    return AppConfig(
        env=data.get("env", "dev"),
        db_url=data["db_url"],
        redis_url=data["redis_url"],
    )
