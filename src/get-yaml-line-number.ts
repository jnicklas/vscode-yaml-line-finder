import fs from "fs";
import { resolve } from "path";
import { Node, parseDocument, Range, Scalar, YAMLMap } from "yaml";

function isMap(node: Node): node is YAMLMap<Node, Node> {
  return Array.isArray((node as any).items);
}

function isScalar(node: Node): node is Scalar {
  return node instanceof Scalar;
}

function getNodeOffset(
  node: Node,
  pathParts: string[]
): Range | null | undefined {
  const [key, ...rest] = pathParts;

  if (isMap(node)) {
    for (const item of node.items) {
      if (isScalar(item.key) && item.key.value === key) {
        if (rest.length === 0) {
          return item.key.range;
        } else if (item.value) {
          const result = getNodeOffset(item.value, rest);
          if (result) {
            return result;
          } else {
            return item.key.range;
          }
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
