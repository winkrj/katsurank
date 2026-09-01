#!/usr/bin/env python3

import argparse
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


def main() -> None:
    parser = argparse.ArgumentParser(description="Serve collect_metrics.sh host metrics to Prometheus")
    parser.add_argument("--file", default="loadtest/results/host_metrics.prom")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=9105)
    args = parser.parse_args()
    metrics_file = Path(args.file).resolve()

    class Handler(BaseHTTPRequestHandler):
        def do_GET(self) -> None:
            if self.path not in ("/metrics", "/metrics/"):
                self.send_error(404)
                return
            try:
                body = metrics_file.read_bytes()
            except FileNotFoundError:
                body = b"# host metrics collector has not written a sample yet\n"
            self.send_response(200)
            self.send_header("Content-Type", "text/plain; version=0.0.4; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)

        def log_message(self, _format: str, *_args: object) -> None:
            return

    ThreadingHTTPServer((args.host, args.port), Handler).serve_forever()


if __name__ == "__main__":
    main()
