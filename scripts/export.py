#!/usr/bin/env python3
"""Download the approved corpus from the Cloudflare Worker API."""

import argparse
import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request


def fetch_export(base_url: str, output_format: str) -> bytes:
    url = f"{base_url.rstrip('/')}/api/admin/export?{urllib.parse.urlencode({'format': output_format})}"
    headers = {}
    client_id = os.environ.get("CF_ACCESS_CLIENT_ID")
    client_secret = os.environ.get("CF_ACCESS_CLIENT_SECRET")
    if client_id and client_secret:
        headers["CF-Access-Client-Id"] = client_id
        headers["CF-Access-Client-Secret"] = client_secret

    request = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            return response.read()
    except urllib.error.HTTPError as error:
        message = error.read().decode("utf-8", errors="replace")
        print(f"Export failed ({error.code}): {message}", file=sys.stderr)
        raise SystemExit(1) from error
    except urllib.error.URLError as error:
        print(f"Export failed: {error.reason}", file=sys.stderr)
        raise SystemExit(1) from error


def to_parquet(jsonl: bytes, output: str) -> None:
    try:
        import pyarrow as pa
        import pyarrow.parquet as pq
    except ImportError:
        print("Install pyarrow: pip install pyarrow", file=sys.stderr)
        raise SystemExit(1)

    rows = [json.loads(line) for line in jsonl.decode("utf-8").splitlines() if line]
    pq.write_table(pa.Table.from_pylist(rows), output)


def main() -> None:
    parser = argparse.ArgumentParser(description="Export the approved maayataan corpus")
    parser.add_argument("--format", choices=["csv", "jsonl", "parquet"], default="jsonl")
    parser.add_argument("--output")
    parser.add_argument(
        "--base-url",
        default=os.environ.get("MAAYATAAN_URL", "https://maayataan.org"),
        help="Worker base URL (default: MAAYATAAN_URL or https://maayataan.org)",
    )
    args = parser.parse_args()
    output = args.output or f"corpus.{args.format}"

    source_format = "jsonl" if args.format == "parquet" else args.format
    data = fetch_export(args.base_url, source_format)
    if args.format == "parquet":
        to_parquet(data, output)
    else:
        with open(output, "wb") as file:
            file.write(data)
    print(f"Exported corpus to {output}")


if __name__ == "__main__":
    main()
