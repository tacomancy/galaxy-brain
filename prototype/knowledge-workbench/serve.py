"""Serve the throwaway knowledge-workbench prototype locally."""

from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import os


PROTOTYPE_DIR = Path(__file__).resolve().parent
HOST = "127.0.0.1"
PORT = 4173


def main() -> None:
    os.chdir(PROTOTYPE_DIR)
    server = ThreadingHTTPServer((HOST, PORT), SimpleHTTPRequestHandler)
    print(f"Knowledge workbench prototype: http://{HOST}:{PORT}/")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
