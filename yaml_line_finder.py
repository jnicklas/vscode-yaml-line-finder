from ruamel.yaml import YAML
import sys
from pathlib import Path


def find_nested_key_line(node, key_path):
    parts = key_path.split(".")
    return _find_recursive(node, parts)


def _find_recursive(node, parts):
    if not parts:
        return None

    current_key = parts[0]
    rest = parts[1:]

    if not isinstance(node, dict):
        return None

    for k, v in node.items():
        if k == current_key:
            if not rest:
                # ruamel.yaml stores line/col info on the container
                # node.lc.key(k) returns a tuple (line_idx, col_idx)
                if hasattr(node.lc, "key"):
                    try:
                        return node.lc.key(k)[0] + 1  # convert 0-based to 1-based
                    except Exception:
                        return None
            else:
                return _find_recursive(v, rest)
    return None


def _usage_and_exit(status=2):
    prog = Path(sys.argv[0]).name
    msg = (
        f"Usage: {prog} <yaml-file> <key.path>\n"
        f"Example: {prog} config.yaml server.database.user"
    )
    print(msg, file=sys.stderr)
    sys.exit(status)


if __name__ == "__main__":
    if len(sys.argv) != 3 or sys.argv[1] in ("-h", "--help"):
        _usage_and_exit(1 if ("-h" in sys.argv or "--help" in sys.argv) else 2)

    yaml_path = Path(sys.argv[1])
    key_path = sys.argv[2]

    if not yaml_path.exists():
        print(f"File not found: {yaml_path}", file=sys.stderr)
        sys.exit(3)

    yaml = YAML()
    try:
        with yaml_path.open("r") as f:
            data = yaml.load(f)
    except Exception as e:
        print(f"Failed to read/parse YAML file: {e}", file=sys.stderr)
        sys.exit(4)

    line = find_nested_key_line(data, key_path)

    if line:
        # Print absolute path with line number in the requested format
        print(f"{yaml_path.resolve()}:{line}")
        sys.exit(0)
    else:
        print(f"Key '{key_path}' not found.", file=sys.stderr)
        sys.exit(5)
