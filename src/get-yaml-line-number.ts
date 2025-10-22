import fs from "fs";
import { resolve } from "path";
import { Node, parseDocument, Scalar, YAMLMap } from "yaml";

function isMap(node: Node): node is YAMLMap<Node, Node> {
  return Array.isArray((node as any).items);
}

function isScalar(node: Node): node is Scalar {
  return node instanceof Scalar;
}

function getNodeOffset(node: Node, pathParts: string[]) {
  const [key, ...rest] = pathParts;

  console.debug("Searching for key:", key, "in node:", node);

  if (isMap(node)) {
    for (const item of node.items) {
      console.debug("Checking item:", item);
      if (isScalar(item.key) && item.key.value === key) {
        console.debug("Found matching key:", key, item.key.range);
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
  console.debug("Read file content from", filePath);
  const content = fs.readFileSync(filePath, "utf8");
  const doc = parseDocument(content).contents;
  if (doc) {
    console.debug("YAML document parsed successfully");
    const offset = getNodeOffset(doc, keyPath.split("."));
    console.debug(`Computed offset for keyPath "${keyPath}":`, offset);
    if (offset) {
      return {
        path: resolve(filePath),
        line: content.slice(0, offset[0]).split("\n").length,
      };
    }
  } else {
    console.debug("parsing failed, not a valid YAML document");
  }
}
