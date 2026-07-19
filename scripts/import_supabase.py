#!/usr/bin/env python3
"""Convert Supabase CSV exports into a D1-compatible SQL import.

Export each legacy table as CSV from Supabase and pass any files that exist.
The output can be loaded with:

    wrangler d1 execute maayataan-db --remote --file=d1-import.sql
"""

import argparse
import ast
import csv
import json
import re
import uuid
from pathlib import Path
from typing import Any, Iterable


DIALECTS = {"oriente", "noroccidente", "centro", "sur", "costa", "otro"}
SOURCES = {"hablante_nativo", "estudiante", "academico", "evento", "otro"}
STATUSES = {"pending", "approved", "rejected"}
ROLES = {"desarrollo", "diseño", "api_datos", "donacion", "institucion_educativa", "otro"}


def sql(value: Any) -> str:
    if value is None or value == "":
        return "NULL"
    if isinstance(value, bool):
        return "1" if value else "0"
    return "'" + str(value).replace("'", "''") + "'"


def boolean(value: Any) -> int:
    return 1 if str(value).lower() in {"1", "true", "t", "yes"} else 0


def identifier(value: Any) -> str:
    candidate = str(value or "")
    try:
        return str(uuid.UUID(candidate))
    except ValueError:
        return str(uuid.uuid4())


def enum(value: Any, allowed: set[str], fallback: str) -> str:
    return str(value) if str(value) in allowed else fallback


def audio_key(value: Any) -> str | None:
    if not value:
        return None
    match = re.search(r"/audio/([0-9a-f-]{36}\.(?:webm|ogg|mp3|wav|m4a))(?:\?.*)?$", str(value))
    return match.group(1) if match else None


def roles(value: Any) -> list[str]:
    if not value:
        return []
    text = str(value).strip()
    parsed: Iterable[Any]
    try:
        parsed = json.loads(text)
    except json.JSONDecodeError:
        if text.startswith("{") and text.endswith("}"):
            parsed = text[1:-1].split(",")
        else:
            try:
                parsed = ast.literal_eval(text)
            except (ValueError, SyntaxError):
                parsed = text.split(",")
    normalized = {str(item).strip().strip('"') for item in parsed}
    return sorted(normalized & ROLES)


def read_csv(path: Path | None) -> list[dict[str, str]]:
    if not path:
        return []
    with path.open(newline="", encoding="utf-8-sig") as file:
        return list(csv.DictReader(file))


def main() -> None:
    parser = argparse.ArgumentParser(description="Convert Supabase CSV exports to D1 SQL")
    parser.add_argument("--contributions", type=Path)
    parser.add_argument("--speakers", type=Path)
    parser.add_argument("--allies", type=Path)
    parser.add_argument("--output", type=Path, default=Path("d1-import.sql"))
    args = parser.parse_args()

    statements = ["PRAGMA foreign_keys = ON;"]

    for row in read_csv(args.contributions):
        values = [
            identifier(row.get("id")),
            row.get("maya_text"),
            row.get("spanish_translation"),
            audio_key(row.get("audio_url") or row.get("audio_key")),
            row.get("contributor_name") or "Anónimo",
            boolean(row.get("consent_given")),
            row.get("consent_scope"),
            row.get("license_code"),
            row.get("governance_label"),
            enum(row.get("dialect"), DIALECTS, "otro"),
            enum(row.get("source"), SOURCES, "otro"),
            enum(row.get("status"), STATUSES, "pending"),
            row.get("created_at") or None,
            row.get("updated_at") or row.get("created_at") or None,
        ]
        statements.append(
            "INSERT OR IGNORE INTO contributions "
            "(id,maya_text,spanish_translation,audio_key,contributor_name,consent_given,"
            "consent_scope,license_code,governance_label,dialect,source,status,created_at,updated_at) VALUES ("
            + ",".join(sql(value) if index not in {5} else str(value) for index, value in enumerate(values))
            + ");"
        )

    for row in read_csv(args.speakers):
        values = [
            identifier(row.get("id")), row.get("name"), row.get("phone"), row.get("email"),
            enum(row.get("dialect"), DIALECTS, "otro"), boolean(row.get("is_native_speaker")),
            boolean(row.get("wants_to_validate")), row.get("message"), row.get("created_at") or None,
        ]
        statements.append(
            "INSERT OR IGNORE INTO speaker_interests "
            "(id,name,phone,email,dialect,is_native_speaker,wants_to_validate,message,created_at) VALUES ("
            + ",".join(str(value) if index in {5, 6} else sql(value) for index, value in enumerate(values))
            + ");"
        )

    for row in read_csv(args.allies):
        ally_id = identifier(row.get("id"))
        values = [ally_id, row.get("name"), row.get("email"), row.get("phone"), row.get("organization"), row.get("message"), row.get("created_at") or None]
        statements.append(
            "INSERT OR IGNORE INTO ally_interests "
            "(id,name,email,phone,organization,message,created_at) VALUES ("
            + ",".join(sql(value) for value in values)
            + ");"
        )
        for role in roles(row.get("roles")):
            statements.append(f"INSERT OR IGNORE INTO ally_roles (ally_id,role) VALUES ({sql(ally_id)},{sql(role)});")

    args.output.write_text("\n".join(statements) + "\n", encoding="utf-8")
    print(f"Wrote {len(statements) - 1} statements to {args.output}")


if __name__ == "__main__":
    main()
