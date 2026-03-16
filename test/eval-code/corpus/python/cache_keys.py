def user_profile_key(user_id: str) -> str:
    return f"user:profile:{user_id}"


def session_key(session_id: str) -> str:
    return f"session:{session_id}"
