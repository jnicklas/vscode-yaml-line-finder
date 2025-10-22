import fs from "fs";
import { resolve } from "path";
import { Node, parseDocument, Scalar, YAMLMap } from "yaml";

function isMap(node: Node): node is YAMLMap<Node, Node> {
  return node.tag === "tag:yaml.org,2002:map";
}

function isScalar(node: Node): node is Scalar {
  return node instanceof Scalar;
}

function getNodeOffset(node: Node, pathParts: string[]) {
  const [key, ...rest] = pathParts;

  if (isMap(node)) {
    for (const item of node.items) {
      if (isScalar(item.key) && item.key.value === key) {
        if (rest.length === 0) {
          return item.key.range;
        } else if (item.value) {
          return getNodeOffset(item.value, rest);
        }
      }
    }
  }
}

type Location = {
  path: string;
  line: number;
};

export function getYamlLineNumber(
  filePath: string,
  keyPath: string
): Location | undefined {
  const content = fs.readFileSync(filePath, "utf8");
  const doc = parseDocument(content).contents;
  if (doc) {
    const offset = getNodeOffset(doc, keyPath.split("."));
    if (offset) {
      return {
        path: resolve(filePath),
        line: content.slice(0, offset[0]).split("\n").length,
      };
    }
  }
}
