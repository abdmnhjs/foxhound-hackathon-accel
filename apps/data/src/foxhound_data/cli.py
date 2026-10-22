import argparse
import sys
from collections.abc import Sequence
from pathlib import Path
from typing import Optional

from foxhound_data.config import find_repository_file
from foxhound_data.pipeline.run import PipelineOptions, run_pipeline


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Transform raw feedback into the Foxhound Agent contract."
    )
    parser.add_argument("--input", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument(
        "--schema",
        type=Path,
        help="JSON Schema path; defaults to the repository feedback schema.",
    )
    return parser


def main(argv: Optional[Sequence[str]] = None) -> int:
    args = build_parser().parse_args(argv)

    try:
        schema_path = args.schema or find_repository_file("schema-feedback.json")
        options = PipelineOptions(
            input_path=args.input.resolve(),
            schema_path=schema_path.resolve(),
            output_path=args.output.resolve(),
        )
        run_pipeline(options)
    except ValueError as error:
        print(f"Error: {error}", file=sys.stderr)
        return 1

    print(f"Validated feedback payload written to {options.output_path}")
    return 0
