from pathlib import Path
from typing import Optional


class RepositoryFileNotFoundError(ValueError):
    """Raised when a required repository file cannot be located."""


def find_repository_file(filename: str, start: Optional[Path] = None) -> Path:
    """Find a file by walking from the current directory through its parents."""
    current = (start or Path.cwd()).resolve()

    for directory in (current, *current.parents):
        candidate = directory / filename
        if candidate.is_file():
            return candidate

    raise RepositoryFileNotFoundError(f"Unable to find {filename} from {current}")
